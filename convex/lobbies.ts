import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const DEFAULT_LOBBY_NAME = "Staging Lobby";
const DEFAULT_MAX_PLAYERS = 5;
const TYPING_STATUS_TTL_MS = 6000;

type CurrentMemberContext = {
  playerId: Id<"players">;
  member: Doc<"lobbyMembers">;
  lobby: Doc<"lobbies">;
};

async function getCurrentPlayerId(ctx: MutationCtx | QueryCtx): Promise<Id<"players">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const identityRow = await ctx.db
    .query("identities")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!identityRow) throw new Error("Player record not found. Call ensureCurrentPlayer first.");
  return identityRow.playerId;
}

async function getCurrentLobbyContext(
  ctx: MutationCtx | QueryCtx,
): Promise<CurrentMemberContext> {
  const playerId = await getCurrentPlayerId(ctx);
  const playerMembers = await ctx.db
    .query("lobbyMembers")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .order("desc")
    .take(10);

  for (const member of playerMembers) {
    const lobby = await ctx.db.get(member.lobbyId);
    if (lobby && lobby.status === "waiting") {
      return { playerId, member, lobby };
    }
  }

  throw new Error("No active lobby membership found.");
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
    if (!identity) throw new Error("Not authenticated");

    const identityRow = await ctx.db
      .query("identities")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!identityRow) throw new Error("Player record not found. Call ensureCurrentPlayer first.");

    const now = Date.now();
    if (args.maxPlayers < 2 || args.maxPlayers > DEFAULT_MAX_PLAYERS) {
      throw new Error(`Lobby size must be between 2 and ${DEFAULT_MAX_PLAYERS} players.`);
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

    let targetLobby = await ctx.db
      .query("lobbies")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("asc")
      .first();

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
      if (!targetLobby) throw new Error("Failed to create lobby.");
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

    const members = [] as Array<{
      playerId: Id<"players">;
      displayName: string;
      avatarUrl: string | null;
      isReady: boolean;
      isSelf: boolean;
    }>;

    for (const member of lobbyMembers) {
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

    const recentMessages = await ctx.db
      .query("lobbyMessages")
      .withIndex("by_lobby_and_created_at", (q) => q.eq("lobbyId", lobby._id))
      .order("desc")
      .take(100);

    const messageRows = recentMessages.reverse();
    const messages = [] as Array<{
      id: Id<"lobbyMessages">;
      playerId: Id<"players">;
      senderName: string;
      senderAvatarUrl: string | null;
      body: string;
      createdAt: number;
      isSelf: boolean;
    }>;

    for (const message of messageRows) {
      const sender = await ctx.db.get(message.playerId);
      messages.push({
        id: message._id,
        playerId: message.playerId,
        senderName: sender?.lobbyName ?? sender?.displayName ?? "Unknown Agent",
        senderAvatarUrl: sender?.avatarKey ? `/${sender.avatarKey}` : (sender?.avatarUrl ?? null),
        body: message.body,
        createdAt: message.createdAt,
        isSelf: message.playerId === playerId,
      });
    }

    const typingRows = await ctx.db
      .query("lobbyTypingStatus")
      .withIndex("by_lobby", (q) => q.eq("lobbyId", lobby._id))
      .take(lobby.maxPlayers);

    const typingDisplayNames: string[] = [];
    for (const row of typingRows) {
      const isRecent = now - row.updatedAt <= TYPING_STATUS_TTL_MS;
      if (!row.isTyping || !isRecent || row.playerId === playerId) continue;

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
      messages,
      typingDisplayNames,
      allReady: members.length > 0 && members.every((member) => member.isReady),
      selfReady: members.some((member) => member.isSelf && member.isReady),
    };
  },
});

export const setCurrentPlayerReady = mutation({
  args: {
    isReady: v.boolean(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { member, lobby } = await getCurrentLobbyContext(ctx);
    await ctx.db.patch(member._id, { isReady: args.isReady });
    await ctx.db.patch(lobby._id, { updatedAt: Date.now() });
  },
});

export const sendCurrentPlayerMessage = mutation({
  args: {
    body: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { playerId, lobby } = await getCurrentLobbyContext(ctx);
    const body = args.body.trim();

    if (body.length < 1 || body.length > 300) {
      throw new Error("Message must be between 1 and 300 characters.");
    }

    await ctx.db.insert("lobbyMessages", {
      lobbyId: lobby._id,
      playerId,
      body,
      createdAt: Date.now(),
    });
  },
});

export const setCurrentPlayerTyping = mutation({
  args: {
    isTyping: v.boolean(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { playerId, lobby } = await getCurrentLobbyContext(ctx);
    const existingStatus = await ctx.db
      .query("lobbyTypingStatus")
      .withIndex("by_lobby_and_player", (q) =>
        q.eq("lobbyId", lobby._id).eq("playerId", playerId),
      )
      .unique();

    const now = Date.now();
    if (existingStatus) {
      await ctx.db.patch(existingStatus._id, {
        isTyping: args.isTyping,
        updatedAt: now,
      });
      return;
    }

    await ctx.db.insert("lobbyTypingStatus", {
      lobbyId: lobby._id,
      playerId,
      isTyping: args.isTyping,
      updatedAt: now,
    });
  },
});
