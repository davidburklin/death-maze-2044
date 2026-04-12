import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const AVATAR_KEY_PATTERN = /^avt-\d{3}\.svg$/;

function sanitizeLobbyName(rawName: string): string {
  const trimmed = rawName.trim();
  if (trimmed.length < 2 || trimmed.length > 24) {
    throw new Error("Lobby name must be between 2 and 24 characters.");
  }
  return trimmed;
}

function validateAvatarKey(avatarKey: string): string {
  const trimmed = avatarKey.trim();
  if (!AVATAR_KEY_PATTERN.test(trimmed)) {
    throw new Error("Avatar selection is invalid.");
  }
  return trimmed;
}

async function getPlayerByTokenIdentifier(
  ctx: QueryCtx | MutationCtx,
  tokenIdentifier: string,
): Promise<Doc<"players"> | null> {
  const identityRow = await ctx.db
    .query("identities")
    .withIndex("by_token_identifier", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
  if (!identityRow) return null;
  return ctx.db.get(identityRow.playerId);
}

// Returns the current player record for the authenticated user, or null.
export const getCurrentPlayer = query({
  args: {},
  handler: async (ctx): Promise<Doc<"players"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return getPlayerByTokenIdentifier(ctx, identity.tokenIdentifier);
  },
});

// Creates or updates the player record for the authenticated user.
// Call this once after sign-in to ensure the player exists in the database.
export const ensureCurrentPlayer = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"players">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();

    const existingIdentity = await ctx.db
      .query("identities")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existingIdentity) {
      await ctx.db.patch(existingIdentity.playerId, { lastSeenAt: now });
      return existingIdentity.playerId;
    }

    const playerId = await ctx.db.insert("players", {
      displayName: identity.name ?? identity.email ?? "Unknown Agent",
      avatarUrl: identity.pictureUrl ?? undefined,
      lobbyName: undefined,
      avatarKey: undefined,
      createdAt: now,
      lastSeenAt: now,
    });

    await ctx.db.insert("identities", {
      playerId,
      provider: "google",
      providerSubject: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? undefined,
      linkedAt: now,
    });

    return playerId;
  },
});

// Updates lobby profile fields that are user-selected and persisted between sessions.
export const updateCurrentProfile = mutation({
  args: {
    lobbyName: v.string(),
    avatarKey: v.string(),
  },
  handler: async (ctx, args): Promise<Doc<"players">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const player = await getPlayerByTokenIdentifier(ctx, identity.tokenIdentifier);
    if (!player) throw new Error("Player record not found. Call ensureCurrentPlayer first.");

    const nextLobbyName = sanitizeLobbyName(args.lobbyName);
    const nextAvatarKey = validateAvatarKey(args.avatarKey);

    await ctx.db.patch(player._id, {
      lobbyName: nextLobbyName,
      avatarKey: nextAvatarKey,
      lastSeenAt: Date.now(),
    });

    const updatedPlayer = await ctx.db.get(player._id);
    if (!updatedPlayer) throw new Error("Player record not found after update.");
    return updatedPlayer;
  },
});
