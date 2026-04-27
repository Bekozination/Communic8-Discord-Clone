import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { servers } from "./servers";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  position: integer("position").notNull().default(0),
});

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 16 }).notNull().default("text"),
  topic: text("topic"),
  position: integer("position").notNull().default(0),
  isNsfw: boolean("is_nsfw").notNull().default(false),
  slowModeSeconds: integer("slow_mode_seconds").notNull().default(0),
  lastMessageId: uuid("last_message_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type Category = typeof categories.$inferSelect;
