import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { channels } from "./channels";

export interface Attachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface Embed {
  type: "link" | "image" | "video";
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  color?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => channels.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content"),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").notNull().default(false),
  replyToId: uuid("reply_to_id"),
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  embeds: jsonb("embeds").$type<Embed[]>().default([]),
  reactions: jsonb("reactions").$type<Reaction[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
