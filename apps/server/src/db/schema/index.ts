import { relations } from "drizzle-orm";
import { users, refreshTokens } from "./users";
import { servers, serverMembers, roles, memberRoles } from "./servers";
import { categories, channels } from "./channels";
import { messages } from "./messages";
import {
  dmChannels,
  dmChannelMembers,
  directMessages,
} from "./direct_messages";
import { friends } from "./friends";

// ===== User Relations =====
export const usersRelations = relations(users, ({ many }) => ({
  serverMembers: many(serverMembers),
  ownedServers: many(servers),
  messages: many(messages),
  refreshTokens: many(refreshTokens),
  friendsInitiated: many(friends, { relationName: "user1" }),
  friendsReceived: many(friends, { relationName: "user2" }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  user1: one(users, {
    fields: [friends.user1Id],
    references: [users.id],
    relationName: "user1",
  }),
  user2: one(users, {
    fields: [friends.user2Id],
    references: [users.id],
    relationName: "user2",
  }),
}));

// ===== Server Relations =====
export const serversRelations = relations(servers, ({ one, many }) => ({
  owner: one(users, {
    fields: [servers.ownerId],
    references: [users.id],
  }),
  members: many(serverMembers),
  channels: many(channels),
  categories: many(categories),
  roles: many(roles),
}));

export const serverMembersRelations = relations(
  serverMembers,
  ({ one, many }) => ({
    server: one(servers, {
      fields: [serverMembers.serverId],
      references: [servers.id],
    }),
    user: one(users, {
      fields: [serverMembers.userId],
      references: [users.id],
    }),
    memberRoles: many(memberRoles),
  }),
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  server: one(servers, {
    fields: [roles.serverId],
    references: [servers.id],
  }),
  memberRoles: many(memberRoles),
}));

export const memberRolesRelations = relations(memberRoles, ({ one }) => ({
  member: one(serverMembers, {
    fields: [memberRoles.memberId],
    references: [serverMembers.id],
  }),
  role: one(roles, {
    fields: [memberRoles.roleId],
    references: [roles.id],
  }),
}));

// ===== Channel Relations =====
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  server: one(servers, {
    fields: [categories.serverId],
    references: [servers.id],
  }),
  channels: many(channels),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  server: one(servers, {
    fields: [channels.serverId],
    references: [servers.id],
  }),
  category: one(categories, {
    fields: [channels.categoryId],
    references: [categories.id],
  }),
  messages: many(messages),
}));

// ===== Message Relations =====
export const messagesRelations = relations(messages, ({ one }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  author: one(users, {
    fields: [messages.authorId],
    references: [users.id],
  }),
}));

// ===== DM Relations =====
export const dmChannelsRelations = relations(dmChannels, ({ many }) => ({
  members: many(dmChannelMembers),
  messages: many(directMessages),
}));

export const dmChannelMembersRelations = relations(
  dmChannelMembers,
  ({ one }) => ({
    channel: one(dmChannels, {
      fields: [dmChannelMembers.dmChannelId],
      references: [dmChannels.id],
    }),
    user: one(users, {
      fields: [dmChannelMembers.userId],
      references: [users.id],
    }),
  }),
);

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  channel: one(dmChannels, {
    fields: [directMessages.dmChannelId],
    references: [dmChannels.id],
  }),
  author: one(users, {
    fields: [directMessages.authorId],
    references: [users.id],
  }),
}));

// Re-export all tables
export * from "./users";
export * from "./servers";
export * from "./channels";
export * from "./messages";
export * from "./direct_messages";
export * from "./friends";
