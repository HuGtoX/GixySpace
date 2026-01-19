import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema";

// 天气画报表
export const weatherPoster = pgTable(
  "weather_poster",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    city: text("city").notNull(), // 城市名称
    condition: text("condition").notNull(), // 天气状况
    date: text("date").notNull(), // 日期（如：12月11日周四）
    generatedDate: date("generated_date").notNull(), // 生成日期（用于判断每日限制）
    imgUrl: text("img_url").notNull(), // AI生成的图片URL
    poetry: text("poetry").notNull(), // 诗词描述
    tempHigh: integer("temp_high").notNull(), // 最高温度
    tempLow: integer("temp_low").notNull(), // 最低温度
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(), // 创建时间
  },
  (table) => [
    // 为用户ID和生成日期创建索引，方便查询用户每日的画报
    index("idx_weather_poster_user_date").on(table.userId, table.generatedDate),
    // 为用户ID和创建时间创建索引，方便查询用户的历史画报
    index("idx_weather_poster_user_created").on(table.userId, table.createdAt),
  ],
);

// 关系定义
export const weatherPosterRelations = relations(weatherPoster, ({ one }) => ({
  user: one(user, {
    fields: [weatherPoster.userId],
    references: [user.id],
  }),
}));

// 类型导出
export type WeatherPoster = typeof weatherPoster.$inferSelect;
export type NewWeatherPoster = typeof weatherPoster.$inferInsert;
