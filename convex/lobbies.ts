import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const DEFAULT_LOBBY_NAME = "Staging Lobby";
const DEFAULT_MAX_PLAYERS = 9;
const HISTORY_PAGE_SIZE = 5;
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 50;
const NEW_MESSAGE_POLL_LIMIT = 50;
const TYPING_STATUS_TTL_MS = 6000;

type CurrentMemberContext = {
  playerId: Id<"players">;
  member: Doc<"lobbyMembers">;
  lobby: Doc<"lobbies">;
};

type LobbyMessageView = {
  id: Id<"lobbyMessages">;
  playerId: Id<"players">;
  senderName: string;
  senderAvatarUrl: string | null;
  body: string;
  createdAt: number;
  isSelf: boolean;
};

function getMemberActivityTimestamp(member: Doc<"lobbyMembers">): number {
  return member.lastActivityAt ?? member.joinedAt;
}

function isLobbyMemberActive(member: Doc<"lobbyMembers">, now: number): boolean {
  return now - getMemberActivityTimestamp(member) < INACTIVITY_TIMEOUT_MS;
}

async function touchLobbyMembership(
  ctx: MutationCtx,
  memberId: Id<"lobbyMembers">,
  lobbyId: Id<"lobbies">,
  now: number,
): Promise<void> {
  await ctx.db.patch(memberId, { lastActivityAt: now });
  await ctx.db.patch(lobbyId, { updatedAt: now });
}

async function removeLobbyMembership(
  ctx: MutationCtx,
  member: Doc<"lobbyMembers">,
  now: number,
): Promise<void> {
  const typingStatus = await ctx.db
    .query("lobbyTypingStatus")
    .withIndex("by_lobby_and_player", (q) =>
      q.eq("lobbyId", member.lobbyId).eq("playerId", member.playerId),
    )
    .unique();

  if (typingStatus) {
    await ctx.db.delete(typingStatus._id);
  }

  await ctx.db.delete(member._id);

  const lobby = await ctx.db.get(member.lobbyId);
  if (lobby) {
    await ctx.db.patch(lobby._id, { updatedAt: now });
  }
}

async function serializeMessages(
  ctx: QueryCtx,
  playerId: Id<"players">,
  messageRows: Doc<"lobbyMessages">[],
): Promise<LobbyMessageView[]> {
  const senders = new Map<Id<"players">, Doc<"players"> | null>();

  for (const message of messageRows) {
    if (!senders.has(message.playerId)) {
      senders.set(message.playerId, await ctx.db.get(message.playerId));
    }
  }

  return messageRows.map((message) => {
    const sender = senders.get(message.playerId);
    return {
      id: message._id,
      playerId: message.playerId,
      senderName: sender?.lobbyName ?? sender?.displayName ?? "Unknown Agent",
      senderAvatarUrl: sender?.avatarKey ? `/${sender.avatarKey}` : (sender?.avatarUrl ?? null),
      body: message.body,
      createdAt: message.createdAt,
      isSelf: message.playerId === playerId,
    };
  });
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

async function getCurrentLobbyContext(
  ctx: MutationCtx | QueryCtx,
): Promise<CurrentMemberContext> {
  const playerId = await getCurrentPlayerId(ctx);
  const now = Date.now();
  const playerMembers = await ctx.db
    .query("lobbyMembers")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .order("desc")
    .take(10);

  let foundTimedOutMembership = false;

  for (const member of playerMembers) {
    const lobby = await ctx.db.get(member.lobbyId);
    if (lobby && lobby.status === "waiting" && isLobbyMemberActive(member, now)) {
      return { playerId, member, lobby };
    }

    if (lobby && lobby.status === "waiting") {
      foundTimedOutMembership = true;
    }
  }

  if (foundTimedOutMembership) {
    throw new ConvexError("Lobby session timed out.");
  }

  throw new ConvexError("No active lobby membership found.");
}

// Lists all lobbies currently accepting players.
export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("lobbies")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .take(20);
  },
});

// Creates a new lobby and adds the host as the first member.
export const create = mutation({
  args: {
    name: v.string(),
    maxPlayers: v.number(),
  },
  handler: async (ctx, args): Promise<Id<"lobbies">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const identityRow = await ctx.db
      .query("identities")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!identityRow) throw new ConvexError("Player record not found. Call ensureCurrentPlayer first.");

    const now = Date.now();
    if (args.maxPlayers < 2 || args.maxPlayers > DEFAULT_MAX_PLAYERS) {
      throw new ConvexError(`Lobby size must be between 2 and ${DEFAULT_MAX_PLAYERS} players.`);
    }

    const lobbyId = await ctx.db.insert("lobbies", {
      hostPlayerId: identityRow.playerId,
      name: args.name,
      status: "waiting",
      maxPlayers: args.maxPlayers,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("lobbyMembers", {
      lobbyId,
      playerId: identityRow.playerId,
      isReady: false,
      joinedAt: now,
      lastActivityAt: now,
    });

    return lobbyId;
  },
});

// Ensures the signed-in player is in the shared waiting lobby.
export const ensureJoinedDefaultLobby = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"lobbies">> => {
    const playerId = await getCurrentPlayerId(ctx);
    const now = Date.now();

    const playerMembers = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .order("desc")
      .take(10);

    for (const member of playerMembers) {
      const lobby = await ctx.db.get(member.lobbyId);
      if (!lobby || lobby.status !== "waiting") {
        continue;
      }

      if (!isLobbyMemberActive(member, now)) {
        await removeLobbyMembership(ctx, member, now);
        continue;
      }

      if (lobby && lobby.status === "waiting") {
        if (lobby.maxPlayers !== DEFAULT_MAX_PLAYERS) {
          await ctx.db.patch(lobby._id, {
            maxPlayers: DEFAULT_MAX_PLAYERS,
            updatedAt: now,
          });
        }
        return lobby._id;
      }
    }

    const waitingLobbies = await ctx.db
      .query("lobbies")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("asc")
      .take(20);

    let targetLobby: Doc<"lobbies"> | null = null;

    for (const lobby of waitingLobbies) {
      const lobbyMembers = await ctx.db
        .query("lobbyMembers")
        .withIndex("by_lobby", (q) => q.eq("lobbyId", lobby._id))
        .collect();

      const activeMemberCount = lobbyMembers.filter((member) => isLobbyMemberActive(member, now)).length;
      const nextMaxPlayers = lobby.maxPlayers === DEFAULT_MAX_PLAYERS ? lobby.maxPlayers : DEFAULT_MAX_PLAYERS;

      if (activeMemberCount < nextMaxPlayers) {
        targetLobby = lobby;
        break;
      }
    }

    if (!targetLobby) {
      const lobbyId = await ctx.db.insert("lobbies", {
        hostPlayerId: playerId,
        name: DEFAULT_LOBBY_NAME,
        status: "waiting",
        maxPlayers: DEFAULT_MAX_PLAYERS,
        createdAt: now,
        updatedAt: now,
      });

      targetLobby = await ctx.db.get(lobbyId);
      if (!targetLobby) throw new ConvexError("Failed to create lobby.");
    }

    const existingMembership = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobby_and_player", (q) =>
        q.eq("lobbyId", targetLobby._id).eq("playerId", playerId),
      )
      .unique();

    if (!existingMembership) {
      await ctx.db.insert("lobbyMembers", {
        lobbyId: targetLobby._id,
        playerId,
        isReady: false,
        joinedAt: now,
        lastActivityAt: now,
      });

      await ctx.db.patch(targetLobby._id, {
        maxPlayers: DEFAULT_MAX_PLAYERS,
        updatedAt: now,
      });
    }
    else if (targetLobby.maxPlayers !== DEFAULT_MAX_PLAYERS) {
      await ctx.db.patch(targetLobby._id, {
        maxPlayers: DEFAULT_MAX_PLAYERS,
        updatedAt: now,
      });
    }

    return targetLobby._id;
  },
});

// Returns the current waiting lobby with members and recent messages.
export const getCurrentLobbyView = query({
  args: {},
  handler: async (ctx) => {
    const { playerId, lobby } = await getCurrentLobbyContext(ctx);
    const now = Date.now();

    const lobbyMembers = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", lobby._id))
      .collect();

    const activeMembers = lobbyMembers.filter((member) => isLobbyMemberActive(member, now));

    const members = [] as Array<{
      playerId: Id<"players">;
      displayName: string;
      avatarUrl: string | null;
      isReady: boolean;
      isSelf: boolean;
    }>;

    for (const member of activeMembers) {
      const memberPlayer = await ctx.db.get(member.playerId);
      if (!memberPlayer) continue;

      members.push({
        playerId: member.playerId,
        displayName: memberPlayer.lobbyName ?? memberPlayer.displayName,
        avatarUrl: memberPlayer.avatarKey ? `/${memberPlayer.avatarKey}` : (memberPlayer.avatarUrl ?? null),
        isReady: member.isReady,
        isSelf: member.playerId === playerId,
      });
    }

    const activeMemberIds = new Set(activeMembers.map((member) => member.playerId));

    const typingRows = await ctx.db
      .query("lobbyTypingStatus")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", lobby._id))
      .take(50);

    const typingDisplayNames: string[] = [];
    for (const row of typingRows) {
      const isRecent = now - row.updatedAt <= TYPING_STATUS_TTL_MS;
      if (!row.isTyping || !isRecent || row.playerId === playerId || !activeMemberIds.has(row.playerId)) continue;

      const typingPlayer = await ctx.db.get(row.playerId);
      if (!typingPlayer) continue;
      typingDisplayNames.push(typingPlayer.lobbyName ?? typingPlayer.displayName);
    }

    return {
      lobby: {
        id: lobby._id,
        name: lobby.name,
        maxPlayers: lobby.maxPlayers,
      },
      members,
      typingDisplayNames,
      allReady: members.length > 0 && members.every((member) => member.isReady),
      selfReady: members.some((member) => member.isSelf && member.isReady),
    };
  },
});

export const listCurrentLobbyMessages = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { playerId, lobby } = await getCurrentLobbyContext(ctx);
    const pageSize = Math.max(1, Math.min(args.paginationOpts.numItems, HISTORY_PAGE_SIZE));

    const messagePage = await ctx.db
      .query("lobbyMessages")
      .withIndex("by_lobby_and_created_at", (q) => q.eq("lobbyId", lobby._id))
      .order("desc")
      .paginate({
        cursor: args.paginationOpts.cursor,
        numItems: pageSize,
      });

    const page = await serializeMessages(ctx, playerId, messagePage.page.reverse());

    return {
      page,
      isDone: messagePage.isDone,
      continueCursor: messagePage.continueCursor,
    };
  },
});

export const listCurrentLobbyMessagesSince = query({
  args: {
    afterCreatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { playerId, lobby } = await getCurrentLobbyContext(ctx);
    const messageRows = await ctx.db
      .query("lobbyMessages")
      .withIndex("by_lobby_and_created_at", (q) =>
        q.eq("lobbyId", lobby._id).gte("createdAt", args.afterCreatedAt),
      )
      .order("asc")
      .take(NEW_MESSAGE_POLL_LIMIT);

    return serializeMessages(ctx, playerId, messageRows);
  },
});

export const setCurrentPlayerReady = mutation({
  args: {
    isReady: v.boolean(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { member, lobby } = await getCurrentLobbyContext(ctx);
    const now = Date.now();
    await ctx.db.patch(member._id, {
      isReady: args.isReady,
      lastActivityAt: now,
    });
    await ctx.db.patch(lobby._id, { updatedAt: now });
  },
});

export const leaveCurrentLobby = mutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    const { member } = await getCurrentLobbyContext(ctx);
    await removeLobbyMembership(ctx, member, Date.now());
  },
});

export const sendCurrentPlayerMessage = mutation({
  args: {
    body: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { playerId, member, lobby } = await getCurrentLobbyContext(ctx);
    const body = args.body.trim();

    if (body.length < 1 || body.length > 300) {
      throw new ConvexError("Message must be between 1 and 300 characters.");
    }

    const now = Date.now();

    await ctx.db.insert("lobbyMessages", {
      lobbyId: lobby._id,
      playerId,
      body,
      createdAt: now,
    });

    await touchLobbyMembership(ctx, member._id, lobby._id, now);
  },
});

export const setCurrentPlayerTyping = mutation({
  args: {
    isTyping: v.boolean(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { playerId, member, lobby } = await getCurrentLobbyContext(ctx);
    const existingStatus = await ctx.db
      .query("lobbyTypingStatus")
      .withIndex("by_lobby_and_player", (q) =>
        q.eq("lobbyId", lobby._id).eq("playerId", playerId),
      )
      .unique();

    const now = Date.now();
    if (existingStatus) {
      if (args.isTyping && !existingStatus.isTyping) {
        await touchLobbyMembership(ctx, member._id, lobby._id, now);
      }

      await ctx.db.patch(existingStatus._id, {
        isTyping: args.isTyping,
        updatedAt: now,
      });
      return;
    }

    if (args.isTyping) {
      await touchLobbyMembership(ctx, member._id, lobby._id, now);
    }

    await ctx.db.insert("lobbyTypingStatus", {
      lobbyId: lobby._id,
      playerId,
      isTyping: args.isTyping,
      updatedAt: now,
    });
  },
});

export const cleanupInactiveMembers = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ removedCount: number }> => {
    const now = Date.now();
    const cutoff = now - INACTIVITY_TIMEOUT_MS;
    const staleMembers = await ctx.db
      .query("lobbyMembers")
      .withIndex("by_last_activity_at", (q) => q.lt("lastActivityAt", cutoff))
      .take(CLEANUP_BATCH_SIZE);

    let removedCount = 0;

    const legacyMembers = await ctx.db
      .query("lobbyMembers")
      .take(CLEANUP_BATCH_SIZE);

    for (const member of legacyMembers) {
      if (member.lastActivityAt !== undefined) {
        continue;
      }

      if (isLobbyMemberActive(member, now)) {
        await ctx.db.patch(member._id, {
          lastActivityAt: member.joinedAt,
        });
        continue;
      }

      await removeLobbyMembership(ctx, member, now);
      removedCount += 1;
    }

    for (const member of staleMembers) {
      const latestMember = await ctx.db.get(member._id);
      if (!latestMember || isLobbyMemberActive(latestMember, now)) {
        continue;
      }

      await removeLobbyMembership(ctx, latestMember, now);
      removedCount += 1;
    }

    if (staleMembers.length === CLEANUP_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.lobbies.cleanupInactiveMembers, {});
    }

    return { removedCount };
  },
});
