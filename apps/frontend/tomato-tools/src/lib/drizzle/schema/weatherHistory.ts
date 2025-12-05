import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema";

// 天气城市切换历史记录表
export const weatherCityHistory = pgTable(
  "weather_city_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    cityName: text("city_name").notNull(), // 城市名称（中文）
    cityNameEn: text("city_name_en"), // 城市名称（英文）
    locationId: text("location_id"), // 和风天气的Location ID
    latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(), // 纬度
    longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(), // 经度
    province: text("province"), // 省份/直辖市
    visitCount: integer("visit_count").default(1).notNull(), // 访问次数
    lastVisitAt: timestamp("last_visit_at", { withTimezone: true })
      .defaultNow()
      .notNull(), // 最后访问时间
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(), // 首次创建时间
  },
  (table) => [
    // 为用户ID和最后访问时间创建索引，方便查询用户的历史记录
    index("idx_weather_city_history_user_visit").on(
      table.userId,
      table.lastVisitAt,
    ),
    // 为用户ID和城市名称创建索引，方便查询特定城市的记录
    index("idx_weather_city_history_user_city").on(
      table.userId,
      table.cityName,
    ),
  ],
);

// 关系定义
export const weatherCityHistoryRelations = relations(
  weatherCityHistory,
  ({ one }) => ({
    user: one(user, {
      fields: [weatherCityHistory.userId],
      references: [user.id],
    }),
  }),
);

// 类型导出
export type WeatherCityHistory = typeof weatherCityHistory.$inferSelect;
export type NewWeatherCityHistory = typeof weatherCityHistory.$inferInsert;
