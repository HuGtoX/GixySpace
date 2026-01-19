import {
  pgTable,
  index,
  serial,
  text,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const dailySentences = pgTable(
  "daily_sentences",
  {
    id: serial().primaryKey().notNull(),
    content: text().notNull(),
    source: text(),
    fetchData: text("fetch_data"),
    fetchDate: date("fetch_date")
      .default(sql`CURRENT_DATE`)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_daily_sentences_date").using(
      "btree",
      table.fetchDate.asc().nullsLast().op("date_ops"),
    ),
  ],
);
