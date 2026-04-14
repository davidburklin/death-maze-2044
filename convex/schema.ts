import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    lobbyName: v.optional(v.string()),
    avatarKey: v.optional(v.string()),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  }),

  identities: defineTable({
    playerId: v.id("players"),
    provider: v.union(v.literal("google"), v.literal("discord")),
    providerSubject: v.string(),
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    linkedAt: v.number(),
  })
    .index("by_token_identifier", ["tokenIdentifier"])
    .index("by_provider_and_subject", ["provider", "providerSubject"])
    .index("by_player", ["playerId"]),

  characters: defineTable({
    playerId: v.id("players"),
    slotIndex: v.number(),
    archetype: v.string(),
    stats: v.object({
      health: v.number(),
      maxHealth: v.number(),
      attack: v.number(),
      defense: v.number(),
      speed: v.number(),
    }),
    inventory: v.array(v.string()),
    progression: v.object({
      overrides: v.number(),
    }),
  })
    .index("by_player", ["playerId"])
    .index("by_player_and_slot", ["playerId", "slotIndex"]),

  lobbies: defineTable({
    hostPlayerId: v.id("players"),
    name: v.string(),
    status: v.union(
      v.literal("waiting"),
      v.literal("starting"),
      v.literal("in_run"),
      v.literal("disbanded"),
    ),
    maxPlayers: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  lobbyMembers: defineTable({
    lobbyId: v.id("lobbies"),
    playerId: v.id("players"),
    characterId: v.optional(v.id("characters")),
    isReady: v.boolean(),
    joinedAt: v.number(),
    lastActivityAt: v.optional(v.number()),
  })
    .index("by_lobby", ["lobbyId"])
    .index("by_last_activity_at", ["lastActivityAt"])
    .index("by_player", ["playerId"])
    .index("by_lobby_and_player", ["lobbyId", "playerId"]),

  lobbyMessages: defineTable({
    lobbyId: v.id("lobbies"),
    playerId: v.id("players"),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_lobby", ["lobbyId"])
    .index("by_lobby_and_created_at", ["lobbyId", "createdAt"]),

  lobbyTypingStatus: defineTable({
    lobbyId: v.id("lobbies"),
    playerId: v.id("players"),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_lobby", ["lobbyId"])
    .index("by_player", ["playerId"])
    .index("by_lobby_and_player", ["lobbyId", "playerId"]),
});
