import { relations } from "drizzle-orm/relations";
import { user, passwordResetToken, userSession, userProfile } from "./schema";

export const passwordResetTokenRelations = relations(passwordResetToken, ({one}) => ({
	user: one(user, {
		fields: [passwordResetToken.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	passwordResetTokens: many(passwordResetToken),
	userSessions: many(userSession),
	userProfiles: many(userProfile),
}));

export const userSessionRelations = relations(userSession, ({one}) => ({
	user: one(user, {
		fields: [userSession.userId],
		references: [user.id]
	}),
}));

export const userProfileRelations = relations(userProfile, ({one}) => ({
	user: one(user, {
		fields: [userProfile.userId],
		references: [user.id]
	}),
}));