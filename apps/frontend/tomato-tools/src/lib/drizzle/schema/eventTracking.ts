import {
  pgTable,
  index,
  text,
  timestamp,
  bigserial,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema";

export const eventTrackings = pgTable(
  "event_trackings",
  {
    id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
    eventName: text("event_name").notNull(),
    eventCategory: text("event_category"),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    properties: jsonb().default({}),
    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    path: text(),
    referrer: text(),
    userAgent: text("user_agent"),
    ip: text("ip"),
  },
  (table) => [
    index("idx_event_trackings_guest_event").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
      table.eventName.asc().nullsLast().op("text_ops"),
    ),
    index("idx_event_trackings_occurred_at").using(
      "btree",
      table.occurredAt.asc().nullsLast().op("timestamptz_ops"),
    ),
  ],
);

// 关系定义
export const eventTrackingsRelations = relations(eventTrackings, ({ one }) => ({
  user: one(user, {
    fields: [eventTrackings.userId],
    references: [user.id],
  }),
}));

export type EventTracking = typeof eventTrackings.$inferSelect;
export type NewEventTracking = typeof eventTrackings.$inferInsert;
