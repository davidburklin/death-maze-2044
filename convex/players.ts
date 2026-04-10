import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

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
