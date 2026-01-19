import { pgTable, index, serial, text, date, timestamp, bigserial, jsonb, foreignKey, unique, uuid, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const userRole = pgEnum("user_role", ['user', 'admin'])


export const dailySentences = pgTable("daily_sentences", {
	id: serial().primaryKey().notNull(),
	content: text().notNull(),
	source: text(),
	fetchData: text("fetch_data"),
	fetchDate: date("fetch_date").default(sql`CURRENT_DATE`).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_daily_sentences_date").using("btree", table.fetchDate.asc().nullsLast().op("date_ops")),
]);

export const eventTrackings = pgTable("event_trackings", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	eventName: text("event_name").notNull(),
	eventCategory: text("event_category"),
	userId: text("user_id").notNull(),
	properties: jsonb().default({}),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	path: text(),
	referrer: text(),
	userAgent: text("user_agent"),
	ipHash: text("ip_hash"),
}, (table) => [
	index("idx_event_trackings_guest_event").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.eventName.asc().nullsLast().op("text_ops")),
	index("idx_event_trackings_occurred_at").using("btree", table.occurredAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const passwordResetToken = pgTable("password_reset_token", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "password_reset_token_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_token_token_unique").on(table.token),
]);

export const user = pgTable("user", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	avatarUrl: text("avatar_url"),
	role: userRole().default('user').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const userSession = pgTable("user_session", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sessionId: text("session_id").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	loginAt: timestamp("login_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	logoutAt: timestamp("logout_at", { withTimezone: true, mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_session_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const userProfile = pgTable("user_profile", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	bio: text(),
	website: text(),
	location: text(),
	preferences: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "user_profile_user_id_user_id_fk"
		}).onDelete("cascade"),
]);
