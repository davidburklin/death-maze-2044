import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Lists all lobbies currently accepting players.
export const listOpen = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("lobbies")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();
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
    if (!identity) throw new Error("Not authenticated");

    const identityRow = await ctx.db
      .query("identities")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!identityRow) throw new Error("Player record not found. Call ensureCurrentPlayer first.");

    const now = Date.now();

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
    });

    return lobbyId;
  },
});
