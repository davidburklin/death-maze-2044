import { ConvexError, v } from "convex/values";
import { createMvpCharacter } from "../shared/game/characters/createCharacter";
import type { AttributeKey } from "../shared/game/characters/types";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const MVP_CHARACTER_SLOT_INDEX = 0;
const MVP_ARCHETYPE = "regime-entrant";

const survivalBiasValidator = v.union(
  v.literal("strength"),
  v.literal("perception"),
  v.literal("agility"),
  v.literal("intelligence"),
);

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

async function getCurrentMvpCharacter(
  ctx: MutationCtx | QueryCtx,
  playerId: Id<"players">,
): Promise<Doc<"characters"> | null> {
  return ctx.db
    .query("characters")
    .withIndex("by_player_and_slot", (q) =>
      q.eq("playerId", playerId).eq("slotIndex", MVP_CHARACTER_SLOT_INDEX),
    )
    .unique();
}

async function attachCharacterToWaitingLobbyMember(
  ctx: MutationCtx,
  playerId: Id<"players">,
  characterId: Id<"characters">,
): Promise<void> {
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

    const now = Date.now();
    await ctx.db.patch(member._id, {
      characterId,
      lastActivityAt: now,
    });
    await ctx.db.patch(lobby._id, { updatedAt: now });
    return;
  }
}

export const getCurrentCharacter = query({
  args: {},
  handler: async (ctx): Promise<Doc<"characters"> | null> => {
    const playerId = await getCurrentPlayerId(ctx);
    return getCurrentMvpCharacter(ctx, playerId);
  },
});

export const saveCurrentCharacter = mutation({
  args: {
    survivalBias: survivalBiasValidator,
  },
  handler: async (ctx, args): Promise<Doc<"characters">> => {
    const playerId = await getCurrentPlayerId(ctx);
    const character = createMvpCharacter(args.survivalBias as AttributeKey);
    const existingCharacter = await getCurrentMvpCharacter(ctx, playerId);

    let characterId: Id<"characters">;

    if (existingCharacter) {
      characterId = existingCharacter._id;
      await ctx.db.patch(characterId, {
        archetype: MVP_ARCHETYPE,
        survivalBias: character.survivalBias,
        attributes: character.attributes,
        inventory: [],
        progression: {
          overrides: 0,
        },
      });
    }
    else {
      characterId = await ctx.db.insert("characters", {
        playerId,
        slotIndex: MVP_CHARACTER_SLOT_INDEX,
        archetype: MVP_ARCHETYPE,
        survivalBias: character.survivalBias,
        attributes: character.attributes,
        inventory: [],
        progression: {
          overrides: 0,
        },
      });
    }

    await attachCharacterToWaitingLobbyMember(ctx, playerId, characterId);

    const savedCharacter = await ctx.db.get(characterId);
    if (!savedCharacter) throw new ConvexError("Character was not found after save.");
    return savedCharacter;
  },
});
