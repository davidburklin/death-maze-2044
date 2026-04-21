import { ConvexError, v } from "convex/values";
import { createMvpCharacter } from "../shared/game/characters/createCharacter";
import type { AttributeKey } from "../shared/game/characters/types";
import { createRng } from "../shared/game/random";
import { generateEntryPoints } from "../shared/game/world/generateEntryPoints";
import { generateWorld } from "../shared/game/world/generateWorld";
import {
  findLegalMove,
  getLegalMoves,
  isEntryPointReverseIntent,
  type LegalMove
} from "../shared/game/world/getLegalMoves";
import { MAZE_ENTRY_POINT_COUNT, type CellCoord, type MazeEntryPoint } from "../shared/game/world/types";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const RUN_MAX_PLAYERS = MAZE_ENTRY_POINT_COUNT;
const MVP_CHARACTER_SLOT_INDEX = 0;
const cellCoordValidator = v.object({
  x: v.number(),
  y: v.number(),
});

type RunStatus = "open" | "full" | "closed";

interface EnterMazeResult {
  runId: Id<"runs">;
  memberId: Id<"runMembers">;
  alreadyJoined: boolean;
}

interface RunMemberView {
  playerId: Id<"players">;
  displayName: string;
  avatarUrl: string | null;
  entryIndex: number;
  position: CellCoord;
  isSelf: boolean;
}

interface MoveInRunResult {
  position: CellCoord;
  legalMoves: LegalMove[];
}

function coordEquals(left: CellCoord, right: CellCoord): boolean {
  return left.x === right.x && left.y === right.y;
}

async function getCurrentPlayerId(ctx: MutationCtx | QueryCtx): Promise<Id<"players">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Not authenticated");

  const identityRow = await ctx.db
    .query("identities")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!identityRow) throw new ConvexError("Player record not found. Call ensureCurrentPlayer first.");
  return identityRow.playerId;
}

function createRunSeed(playerId: Id<"players">, now: number): number {
  let hash = 0x811c9dc5;
  const source = `${playerId}:${now}`;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function getEntryPointByIndex(entryPoints: MazeEntryPoint[], entryIndex: number): MazeEntryPoint {
  const entryPoint = entryPoints.find((candidate) => candidate.index === entryIndex);
  if (!entryPoint) {
    throw new ConvexError("Maze entry assignment is invalid.");
  }
  return entryPoint;
}

function pickUnusedEntryIndex(run: Doc<"runs">, members: Doc<"runMembers">[], playerId: Id<"players">): number {
  const usedEntryIndexes = new Set(members.map((member) => member.entryIndex));
  const availableEntryIndexes = run.entryPoints
    .map((entryPoint) => entryPoint.index)
    .filter((entryIndex) => !usedEntryIndexes.has(entryIndex));

  if (availableEntryIndexes.length === 0) {
    throw new ConvexError("Maze is full.");
  }

  const rng = createRng(createRunSeed(playerId, Date.now()) ^ run.seed);
  return rng.pick(availableEntryIndexes);
}

function isValidMvpCharacter(character: Doc<"characters">): boolean {
  const survivalBias = character.survivalBias;
  if (!survivalBias) {
    return false;
  }

  const expectedCharacter = createMvpCharacter(survivalBias as AttributeKey);
  return expectedCharacter.attributes.strength === character.attributes.strength &&
    expectedCharacter.attributes.perception === character.attributes.perception &&
    expectedCharacter.attributes.agility === character.attributes.agility &&
    expectedCharacter.attributes.intelligence === character.attributes.intelligence;
}

async function getCurrentMvpCharacter(ctx: QueryCtx | MutationCtx, playerId: Id<"players">): Promise<Doc<"characters">> {
  const character = await ctx.db
    .query("characters")
    .withIndex("by_player_and_slot", (q) =>
      q.eq("playerId", playerId).eq("slotIndex", MVP_CHARACTER_SLOT_INDEX),
    )
    .unique();

  if (!character || !isValidMvpCharacter(character)) {
    throw new ConvexError("Valid character creation is required before entering the maze.");
  }

  return character;
}

async function getReadyLobbyMember(
  ctx: MutationCtx,
  playerId: Id<"players">,
  characterId: Id<"characters">,
): Promise<Doc<"lobbyMembers">> {
  const memberships = await ctx.db
    .query("lobbyMembers")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .order("desc")
    .take(10);

  for (const member of memberships) {
    const lobby = await ctx.db.get(member.lobbyId);
    if (!lobby || lobby.status !== "waiting") {
      continue;
    }

    if (!member.isReady) {
      throw new ConvexError("Ready state is required before entering the maze.");
    }

    if (member.characterId !== characterId) {
      await ctx.db.patch(member._id, {
        characterId,
        lastActivityAt: Date.now(),
      });
    }

    return member;
  }

  throw new ConvexError("Active lobby membership is required before entering the maze.");
}

async function getExistingActiveMembership(
  ctx: QueryCtx | MutationCtx,
  playerId: Id<"players">,
): Promise<{ run: Doc<"runs">; member: Doc<"runMembers"> } | null> {
  const memberships = await ctx.db
    .query("runMembers")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .order("desc")
    .take(10);

  for (const member of memberships) {
    const run = await ctx.db.get(member.runId);
    if (run && (run.status === "open" || run.status === "full")) {
      return { run, member };
    }
  }

  return null;
}

async function findOrCreateOpenRun(ctx: MutationCtx, playerId: Id<"players">): Promise<Doc<"runs">> {
  const openRuns = await ctx.db
    .query("runs")
    .withIndex("by_status_and_member_count", (q) =>
      q.eq("status", "open").lt("memberCount", RUN_MAX_PLAYERS),
    )
    .order("asc")
    .take(10);

  const existingOpenRun = openRuns[0];
  if (existingOpenRun) {
    return existingOpenRun;
  }

  const now = Date.now();
  const seed = createRunSeed(playerId, now);
  const runId = await ctx.db.insert("runs", {
    seed,
    status: "open" as RunStatus,
    maxPlayers: RUN_MAX_PLAYERS,
    memberCount: 0,
    entryPoints: generateEntryPoints({ seed }),
    createdAt: now,
    updatedAt: now,
  });

  const run = await ctx.db.get(runId);
  if (!run) throw new ConvexError("Failed to create maze run.");
  return run;
}

async function markLobbyMemberEnteredMaze(ctx: MutationCtx, member: Doc<"lobbyMembers">): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(member._id, {
    isReady: false,
    lastActivityAt: now,
  });

  const lobby = await ctx.db.get(member.lobbyId);
  if (lobby) {
    await ctx.db.patch(lobby._id, {
      updatedAt: now,
    });
  }
}

export const enterMaze = mutation({
  args: {},
  handler: async (ctx): Promise<EnterMazeResult> => {
    const playerId = await getCurrentPlayerId(ctx);
    const character = await getCurrentMvpCharacter(ctx, playerId);

    const existingMembership = await getExistingActiveMembership(ctx, playerId);
    if (existingMembership) {
      return {
        runId: existingMembership.run._id,
        memberId: existingMembership.member._id,
        alreadyJoined: true,
      };
    }

    const lobbyMember = await getReadyLobbyMember(ctx, playerId, character._id);
    const run = await findOrCreateOpenRun(ctx, playerId);
    const members = await ctx.db
      .query("runMembers")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .take(RUN_MAX_PLAYERS);

    if (members.length >= RUN_MAX_PLAYERS || run.memberCount >= RUN_MAX_PLAYERS) {
      throw new ConvexError("Maze is full.");
    }

    const entryIndex = pickUnusedEntryIndex(run, members, playerId);
    const entryPoint = getEntryPointByIndex(run.entryPoints, entryIndex);
    const now = Date.now();

    const memberId = await ctx.db.insert("runMembers", {
      runId: run._id,
      playerId,
      characterId: character._id,
      entryIndex,
      position: entryPoint.to,
      joinedAt: now,
      lastActivityAt: now,
    });

    const nextMemberCount = run.memberCount + 1;
    await ctx.db.patch(run._id, {
      memberCount: nextMemberCount,
      status: nextMemberCount >= RUN_MAX_PLAYERS ? "full" : "open",
      updatedAt: now,
    });

    await markLobbyMemberEnteredMaze(ctx, lobbyMember);

    return {
      runId: run._id,
      memberId,
      alreadyJoined: false,
    };
  },
});

export const getRunView = query({
  args: {
    runId: v.id("runs"),
  },
  handler: async (ctx, args) => {
    const playerId = await getCurrentPlayerId(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run) throw new ConvexError("Maze run not found.");

    const selfMember = await ctx.db
      .query("runMembers")
      .withIndex("by_run_and_player", (q) =>
        q.eq("runId", args.runId).eq("playerId", playerId),
      )
      .unique();

    if (!selfMember) {
      throw new ConvexError("You are not in this maze run.");
    }

    const runMembers = await ctx.db
      .query("runMembers")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .take(RUN_MAX_PLAYERS);

    const world = generateWorld({ seed: run.seed });
    const members: RunMemberView[] = [];
    for (const member of runMembers) {
      const memberPlayer = await ctx.db.get(member.playerId);
      if (!memberPlayer) continue;

      members.push({
        playerId: member.playerId,
        displayName: memberPlayer.lobbyName ?? memberPlayer.displayName,
        avatarUrl: memberPlayer.avatarKey ? `/${memberPlayer.avatarKey}` : (memberPlayer.avatarUrl ?? null),
        entryIndex: member.entryIndex,
        position: member.position,
        isSelf: member.playerId === playerId,
      });
    }

    return {
      run: {
        id: run._id,
        seed: run.seed,
        status: run.status,
        maxPlayers: run.maxPlayers,
        memberCount: run.memberCount,
        entryPoints: run.entryPoints,
      },
      world: {
        width: world.width,
        height: world.height,
      },
      self: {
        memberId: selfMember._id,
        entryIndex: selfMember.entryIndex,
        position: selfMember.position,
        legalMoves: getLegalMoves(world, selfMember.position),
      },
      members,
    };
  },
});

export const moveInRun = mutation({
  args: {
    runId: v.id("runs"),
    from: cellCoordValidator,
    connectionId: v.string(),
  },
  handler: async (ctx, args): Promise<MoveInRunResult> => {
    const playerId = await getCurrentPlayerId(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run) throw new ConvexError("Maze run not found.");
    if (run.status === "closed") throw new ConvexError("Maze run is closed.");

    const selfMember = await ctx.db
      .query("runMembers")
      .withIndex("by_run_and_player", (q) =>
        q.eq("runId", args.runId).eq("playerId", playerId),
      )
      .unique();

    if (!selfMember) {
      throw new ConvexError("You are not in this maze run.");
    }

    if (!coordEquals(selfMember.position, args.from)) {
      throw new ConvexError("Movement source is stale. Refresh run state.");
    }

    if (isEntryPointReverseIntent(run.entryPoints, selfMember.position, args.connectionId)) {
      throw new ConvexError("Entry doors do not open from inside.");
    }

    const world = generateWorld({ seed: run.seed });
    const legalMove = findLegalMove(world, selfMember.position, args.connectionId);
    if (!legalMove) {
      throw new ConvexError("Movement is not legal from this cell.");
    }

    await ctx.db.patch(selfMember._id, {
      position: legalMove.to,
      lastActivityAt: Date.now(),
    });

    return {
      position: legalMove.to,
      legalMoves: getLegalMoves(world, legalMove.to),
    };
  },
});
