import { pgTable, uuid, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const friends = pgTable("friends", {
  id: uuid("id").primaryKey().defaultRandom(),
  user1Id: uuid("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: uuid("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending, accepted
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    friendPairIdx: uniqueIndex("friend_pair_idx").on(table.user1Id, table.user2Id),
  };
});

export type Friend = typeof friends.$inferSelect;
