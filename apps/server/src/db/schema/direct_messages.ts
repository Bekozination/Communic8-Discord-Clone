import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import type { Attachment } from "./messages";

export const dmChannels = pgTable("dm_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dmChannelMembers = pgTable("dm_channel_members", {
  dmChannelId: uuid("dm_channel_id")
    .notNull()
    .references(() => dmChannels.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const directMessages = pgTable("direct_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  dmChannelId: uuid("dm_channel_id")
    .notNull()
    .references(() => dmChannels.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content"),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
