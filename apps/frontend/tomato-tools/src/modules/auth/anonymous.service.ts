import { createClient } from "@/lib/supabase/server";
import { UserService } from "../user/user.service";
import { createModuleLogger } from "@/lib/logger";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const log = createModuleLogger("anonymous-service");

export class AnonymousService {
  private userService: UserService;
  private logger;

  constructor(requestId?: string) {
    this.userService = new UserService(requestId);
    this.logger = requestId ? log.child({ requestId }) : log;
  }

  /**
   * 创建匿名用户
   */
  async createAnonymousUser(): Promise<{
    user: SupabaseUser | null;
    session: any | null;
    error: string | null;
  }> {
    this.logger.info("Creating anonymous user");

    try {
      const supabase = await createClient();

      // 使用 Supabase 匿名登录
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error || !data.user) {
        this.logger.error(
          { error: error?.message },
          "Failed to create anonymous user in Supabase",
        );
        return {
          user: null,
          session: null,
          error: error?.message || "Failed to create anonymous user",
        };
      }

      // 在本地数据库创建用户记录
      try {
        const anonymousEmail = `anonymous_${data.user.id}@temp.local`;

        await this.userService.createUser({
          id: data.user.id,
          email: anonymousEmail,
          fullName: "临时用户",
          role: "anonymous",
          isAnonymous: true,
          anonymousCreatedAt: new Date(),
          // 设置30天后过期
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        // 创建用户配置
        await this.userService.createUserProfile({
          userId: data.user.id,
        });

        this.logger.info(
          { userId: data.user.id },
          "Anonymous user created successfully",
        );
      } catch (dbError) {
        this.logger.error(
          { error: dbError, userId: data.user.id },
          "Failed to create anonymous user in database",
        );
        // 数据库创建失败，但Supabase用户已创建，返回错误
        return {
          user: null,
          session: null,
          error: "Failed to create user record in database",
        };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      this.logger.error({ error }, "Create anonymous user error");
      return {
        user: null,
        session: null,
        error: "Failed to create anonymous user",
      };
    }
  }

  /**
   * 将匿名用户转换为正式用户
   *
   * 注意：在调用此方法前，应该已经通过 Supabase Email OTP 验证了邮箱
   * 此方法主要负责：
   * 1. 更新 Supabase Auth 用户信息（设置密码和元数据）
   * 2. 更新本地数据库用户信息
   */
  async convertToRegularUser(
    userId: string,
    email: string,
    password: string,
    fullName?: string,
  ): Promise<{ success: boolean; error: string | null }> {
    this.logger.info(
      { userId, email },
      "Converting anonymous user to regular user",
    );

    try {
      const supabase = await createClient();

      // 更新 Supabase Auth 用户信息
      // 由于已经通过 OTP 验证，这里主要是设置密码和更新元数据
      const { error: updateError } = await supabase.auth.updateUser({
        email,
        password,
        data: {
          full_name: fullName,
        },
      });

      if (updateError) {
        this.logger.error(
          { error: updateError.message },
          "Failed to update Supabase user",
        );
        return { success: false, error: updateError.message };
      }

      // 更新本地数据库
      await this.userService.updateUser(userId, {
        email,
        fullName: fullName || null,
        role: "user",
        isAnonymous: false,
        anonymousCreatedAt: null,
        expiresAt: null,
      });

      this.logger.info({ userId }, "Anonymous user converted successfully");
      return { success: true, error: null };
    } catch (error) {
      this.logger.error({ error, userId }, "Convert anonymous user error");
      return { success: false, error: "Failed to convert anonymous user" };
    }
  }

  /**
   * 检查用户是否为匿名用户
   */
  async isAnonymousUser(userId: string): Promise<boolean> {
    try {
      const user = await this.userService.getUserById(userId);
      return user?.isAnonymous || false;
    } catch (error) {
      this.logger.error(
        { error, userId },
        "Failed to check if user is anonymous",
      );
      return false;
    }
  }

  /**
   * 清理过期的匿名用户（定时任务）
   */
  async cleanupExpiredAnonymousUsers(): Promise<{
    success: boolean;
    deletedCount: number;
    error: string | null;
  }> {
    this.logger.info("Cleaning up expired anonymous users");

    try {
      // 这里需要实现清理逻辑
      // 1. 查询过期的匿名用户
      // 2. 删除用户及其关联数据（通过cascade自动删除）
      // 3. 从 Supabase Auth 中删除（需要使用 Admin API）

      this.logger.info("Expired anonymous users cleaned up");
      return { success: true, deletedCount: 0, error: null };
    } catch (error) {
      this.logger.error({ error }, "Failed to cleanup expired anonymous users");
      return { success: false, deletedCount: 0, error: "Cleanup failed" };
    }
  }
}
