import { eq, and, isNull } from "drizzle-orm";
import { createDbClient } from "@/lib/drizzle/client";
import {
  user,
  userProfile,
  userSession,
  passwordResetToken,
} from "@/lib/drizzle/schema/schema";
import type {
  User,
  NewUser,
  UserProfile,
  NewUserProfile,
  UserSession,
  NewUserSession,
} from "@/lib/drizzle/schema/schema";
import { createModuleLogger } from "@/lib/logger";
import crypto from "crypto";

const log = createModuleLogger("user-service");

export class UserService {
  private dbClient;
  private logger;

  constructor(requestId?: string) {
    this.dbClient = createDbClient(requestId);
    this.logger = requestId ? log.child({ requestId }) : log;
  }

  // 创建用户（注册后的回调）
  async createUser(userData: NewUser): Promise<User> {
    this.logger.info({ email: userData.email }, "Creating new user");

    try {
      const [newUser] = await this.dbClient.db
        .insert(user)
        .values(userData)
        .returning();

      this.logger.info({ userId: newUser.id }, "User created successfully");
      return newUser;
    } catch (error) {
      this.logger.error(
        { error, email: userData.email },
        "Failed to create user",
      );
      throw error;
    }
  }

  // 根据ID获取用户
  async getUserById(id: string): Promise<User | null> {
    try {
      const [foundUser] = await this.dbClient.db
        .select()
        .from(user)
        .where(eq(user.id, id))
        .limit(1);

      return foundUser || null;
    } catch (error) {
      this.logger.error({ error, userId: id }, "Failed to get user by ID");
      throw error;
    }
  }

  // 根据邮箱获取用户
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [foundUser] = await this.dbClient.db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      return foundUser || null;
    } catch (error) {
      this.logger.error({ error, email }, "Failed to get user by email");
      throw error;
    }
  }

  // 更新用户信息
  async updateUser(id: string, userData: Partial<NewUser>): Promise<User> {
    this.logger.info({ userId: id }, "Updating user");

    try {
      const [updatedUser] = await this.dbClient.db
        .update(user)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(user.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error("User not found");
      }

      this.logger.info({ userId: id }, "User updated successfully");
      return updatedUser;
    } catch (error) {
      this.logger.error({ error, userId: id }, "Failed to update user");
      throw error;
    }
  }

  // 创建用户配置
  async createUserProfile(profileData: NewUserProfile): Promise<UserProfile> {
    this.logger.info({ userId: profileData.userId }, "Creating user profile");

    try {
      const [profile] = await this.dbClient.db
        .insert(userProfile)
        .values(profileData)
        .returning();

      this.logger.info(
        { userId: profileData.userId },
        "User profile created successfully",
      );
      return profile;
    } catch (error) {
      this.logger.error(
        { error, userId: profileData.userId },
        "Failed to create user profile",
      );
      throw error;
    }
  }

  // 获取用户配置
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const [profile] = await this.dbClient.db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId))
        .limit(1);

      return profile || null;
    } catch (error) {
      this.logger.error({ error, userId }, "Failed to get user profile");
      throw error;
    }
  }

  // 记录用户登录会话
  async createUserSession(sessionData: NewUserSession): Promise<UserSession> {
    this.logger.info({ userId: sessionData.userId }, "Creating user session");

    try {
      const [session] = await this.dbClient.db
        .insert(userSession)
        .values(sessionData)
        .returning();

      this.logger.info(
        { userId: sessionData.userId, sessionId: session.id },
        "User session created",
      );
      return session;
    } catch (error) {
      this.logger.error(
        { error, userId: sessionData.userId },
        "Failed to create user session",
      );
      throw error;
    }
  }

  // 结束用户会话
  async endUserSession(sessionId: string): Promise<void> {
    this.logger.info({ sessionId }, "Ending user session");

    try {
      await this.dbClient.db
        .update(userSession)
        .set({
          logoutAt: new Date(),
          isActive: false,
        })
        .where(eq(userSession.sessionId, sessionId));

      this.logger.info({ sessionId }, "User session ended");
    } catch (error) {
      this.logger.error({ error, sessionId }, "Failed to end user session");
      throw error;
    }
  }

  // 创建密码重置令牌
  async createPasswordResetToken(userId: string): Promise<string> {
    this.logger.info({ userId }, "Creating password reset token");

    try {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

      await this.dbClient.db.insert(passwordResetToken).values({
        userId,
        token,
        expiresAt,
      });

      this.logger.info({ userId }, "Password reset token created");
      return token;
    } catch (error) {
      this.logger.error(
        { error, userId },
        "Failed to create password reset token",
      );
      throw error;
    }
  }

  // 验证密码重置令牌
  async validatePasswordResetToken(token: string): Promise<string | null> {
    try {
      const [resetToken] = await this.dbClient.db
        .select()
        .from(passwordResetToken)
        .where(
          and(
            eq(passwordResetToken.token, token),
            isNull(passwordResetToken.usedAt),
          ),
        )
        .limit(1);

      if (!resetToken || resetToken.expiresAt < new Date()) {
        this.logger.warn(
          { token: token.substring(0, 8) + "..." },
          "Invalid or expired reset token",
        );
        return null;
      }

      return resetToken.userId;
    } catch (error) {
      this.logger.error({ error }, "Failed to validate password reset token");
      throw error;
    }
  }

  // 标记密码重置令牌为已使用
  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    try {
      await this.dbClient.db
        .update(passwordResetToken)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetToken.token, token));

      this.logger.info(
        { token: token.substring(0, 8) + "..." },
        "Password reset token marked as used",
      );
    } catch (error) {
      this.logger.error(
        { error },
        "Failed to mark password reset token as used",
      );
      throw error;
    }
  }
}
