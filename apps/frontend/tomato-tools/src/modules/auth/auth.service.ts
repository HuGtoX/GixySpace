import { createClient } from "@/lib/supabase/server";
import { UserService } from "../user/user.service";
import { AnonymousService } from "./anonymous.service";
import { createModuleLogger } from "@/lib/logger";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

const log = createModuleLogger("auth-service");

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
}

export interface RegisterWithCodeData {
  email: string;
  code: string;
  password: string;
  fullName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  redirectUrl: string;
  email: string;
}

export interface UpdatePasswordData {
  token: string;
  newPassword: string;
}

export class AuthService {
  private userService: UserService;
  private anonymousService: AnonymousService;
  private logger;

  constructor(requestId?: string) {
    this.userService = new UserService(requestId);
    this.anonymousService = new AnonymousService(requestId);
    this.logger = requestId ? log.child({ requestId }) : log;
  }

  // 用户注册
  async register(
    data: RegisterData,
  ): Promise<{ user: SupabaseUser | null; error: string | null }> {
    this.logger.info({ email: data.email }, "User registration attempt");

    try {
      const supabase = await createClient();

      // 使用Supabase进行注册，添加重试机制
      let authData, authError;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const result = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
              data: {
                full_name: data.fullName,
              },
              emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
          });
          authData = result.data;
          authError = result.error;
          break; // 成功则跳出重试循环
        } catch (error: unknown) {
          retryCount++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          this.logger.warn(
            {
              error: errorMessage,
              retryCount,
              maxRetries,
            },
            "Supabase signUp retry attempt",
          );

          if (retryCount >= maxRetries) {
            authError = { message: errorMessage || "fetch failed" };
          } else {
            // 等待一段时间后重试
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount),
            );
          }
        }
      }

      this.logger.info(
        {
          authData: authData
            ? { user: !!authData.user, session: !!authData.session }
            : null,
          authError: authError ? authError.message : null,
        },
        "Supabase signUp response",
      );

      if (authError) {
        this.logger.error(
          { error: authError.message, email: data.email },
          "Supabase registration failed",
        );
        return { user: null, error: authError.message };
      }

      if (authData && authData.user) {
        // 在本地数据库中创建用户记录
        try {
          await this.userService.createUser({
            id: authData.user.id,
            email: data.email,
            fullName: data.fullName || null,
            avatarUrl: authData.user.user_metadata?.avatar_url || null,
          });

          // 创建用户配置
          await this.userService.createUserProfile({
            userId: authData.user.id,
          });

          this.logger.info(
            { userId: authData.user.id },
            "User registered successfully",
          );
        } catch (dbError) {
          this.logger.warn(
            { error: dbError, userId: authData.user.id },
            "Failed to create user in local database, will retry on first login",
          );
          // 注意：这里Supabase用户已创建，但本地数据库失败
          // 这不应该阻止注册流程，用户仍然可以收到确认邮件
        }

        return { user: authData.user, error: null };
      }

      return {
        user: null,
        error: "Registration failed: No user data returned",
      };
    } catch (error) {
      this.logger.error(
        { error, email: data.email },
        "Unexpected registration error",
      );
      // 只有在Supabase操作本身失败时才返回错误
      if (error instanceof Error && error.message.includes("fetch")) {
        return { user: null, error: "Network error during registration" };
      }
      return { user: null, error: "Registration failed" };
    }
  }

  // 使用验证码注册
  async registerWithCode(
    data: RegisterWithCodeData,
  ): Promise<{ user: SupabaseUser | null; error: string | null }> {
    this.logger.info(
      { email: data.email },
      "User registration with code attempt",
    );

    try {
      const supabase = await createClient();

      // 首先验证验证码
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.code,
        type: "signup",
      });

      if (verifyError) {
        this.logger.error(
          { error: verifyError.message, email: data.email },
          "Code verification failed",
        );
        return { user: null, error: "验证码错误或已过期" };
      }

      // 验证码验证成功，使用邮箱和密码注册用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (authError) {
        this.logger.error(
          { error: authError.message, email: data.email },
          "Registration failed after code verification",
        );
        return { user: null, error: authError.message };
      }

      if (authData && authData.user) {
        // 在本地数据库中创建用户记录
        try {
          await this.userService.createUser({
            id: authData.user.id,
            email: data.email,
            fullName: data.fullName || null,
            avatarUrl: authData.user.user_metadata?.avatar_url || null,
          });

          // 创建用户配置
          await this.userService.createUserProfile({
            userId: authData.user.id,
          });

          this.logger.info(
            { userId: authData.user.id },
            "User registered with code successfully",
          );
        } catch (dbError) {
          this.logger.warn(
            { error: dbError, userId: authData.user.id },
            "Failed to create user in local database, will retry on first login",
          );
        }

        return { user: authData.user, error: null };
      }

      return {
        user: null,
        error: "Registration failed: No user data returned",
      };
    } catch (error) {
      this.logger.error(
        { error, email: data.email },
        "Unexpected registration with code error",
      );
      return { user: null, error: "Registration failed" };
    }
  }

  // 用户登录
  async login(
    data: LoginData,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    user: SupabaseUser | null;
    session: Session | null;
    error: string | null;
  }> {
    this.logger.info({ email: data.email }, "User login attempt");

    try {
      const supabase = await createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (authError) {
        this.logger.error(
          { error: authError.message, email: data.email },
          "Login failed",
        );
        return { user: null, session: null, error: authError.message };
      }

      if (authData.user && authData.session) {
        // 记录登录会话
        try {
          await this.userService.createUserSession({
            userId: authData.user.id,
            sessionId: authData.session.access_token,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
          });

          this.logger.info(
            { userId: authData.user.id },
            "User logged in successfully",
          );
        } catch (dbError) {
          this.logger.error(
            { error: dbError, userId: authData.user.id },
            "Failed to record login session",
          );
          // 登录成功但会话记录失败，不影响登录流程
        }
      }

      return { user: authData.user, session: authData.session, error: null };
    } catch (error) {
      this.logger.error({ error, email: data.email }, "Login error");
      return { user: null, session: null, error: "Login failed" };
    }
  }

  // 用户登出
  async logout(sessionToken?: string): Promise<{ error: string | null }> {
    this.logger.info("User logout attempt");

    try {
      const supabase = await createClient();

      const { error: authError } = await supabase.auth.signOut();

      if (authError) {
        this.logger.error({ error: authError.message }, "Logout failed");
        return { error: authError.message };
      }

      // 结束本地会话记录
      if (sessionToken) {
        try {
          await this.userService.endUserSession(sessionToken);
        } catch (dbError) {
          this.logger.error(
            { error: dbError },
            "Failed to end session in database",
          );
          // 登出成功但会话结束记录失败，不影响登出流程
        }
      }

      this.logger.info("User logged out successfully");
      return { error: null };
    } catch (error) {
      this.logger.error({ error }, "Logout error");
      return { error: "Logout failed" };
    }
  }

  // 发送密码重置邮件
  async sendPasswordResetEmail(
    data: ResetPasswordData,
  ): Promise<{ error: string | null }> {
    this.logger.info({ email: data.email }, "Password reset email request");

    try {
      const supabase = await createClient();

      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${data.redirectUrl}/auth/callback?next=/auth/reset-password`,
        },
      );

      if (authError) {
        this.logger.error(
          { error: authError.message, email: data.email },
          "Password reset email failed",
        );
        return { error: authError.message };
      }

      // 可选：在本地数据库中创建重置令牌记录
      try {
        const user = await this.userService.getUserByEmail(data.email);
        if (user) {
          await this.userService.createPasswordResetToken(user.id);
        }
      } catch (dbError) {
        this.logger.error(
          { error: dbError, email: data.email },
          "Failed to create reset token in database",
        );
        // 不影响主流程
      }

      this.logger.info(
        { email: data.email },
        "Password reset email sent successfully",
      );
      return { error: null };
    } catch (error) {
      this.logger.error(
        { error, email: data.email },
        "Password reset email error",
      );
      return { error: "Failed to send password reset email" };
    }
  }

  // 更新密码（使用当前session）
  async updatePasswordWithSession(data: {
    newPassword: string;
  }): Promise<{ error: string | null }> {
    this.logger.info("Password update attempt with session");

    try {
      const supabase = await createClient();

      // 验证当前用户是否已登录
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        this.logger.error(
          { error: userError?.message },
          "No authenticated user found for password update",
        );
        return { error: "未找到已认证的用户，请重新点击邮件中的重置链接" };
      }

      // 使用当前session更新密码
      const { error: authError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (authError) {
        this.logger.error(
          { error: authError.message, userId: user.id },
          "Password update failed",
        );
        return { error: authError.message };
      }

      this.logger.info({ userId: user.id }, "Password updated successfully");
      return { error: null };
    } catch (error) {
      this.logger.error({ error }, "Password update error");
      return { error: "Failed to update password" };
    }
  }

  // 更新密码
  async updatePassword(
    data: UpdatePasswordData,
  ): Promise<{ error: string | null }> {
    this.logger.info("Password update attempt");

    try {
      const supabase = await createClient();

      const { error: authError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (authError) {
        this.logger.error(
          { error: authError.message },
          "Password update failed",
        );
        return { error: authError.message };
      }

      // 标记重置令牌为已使用（如果有的话）
      try {
        const userId = await this.userService.validatePasswordResetToken(
          data.token,
        );
        if (userId) {
          await this.userService.markPasswordResetTokenAsUsed(data.token);
        }
      } catch (dbError) {
        this.logger.error(
          { error: dbError },
          "Failed to mark reset token as used",
        );
        // 不影响主流程
      }

      this.logger.info("Password updated successfully");
      return { error: null };
    } catch (error) {
      this.logger.error({ error }, "Password update error");
      return { error: "Failed to update password" };
    }
  }

  // 获取当前用户
  async getCurrentUser(): Promise<{
    user: SupabaseUser | null;
    error: string | null;
  }> {
    try {
      const supabase = await createClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        this.logger.error(
          { error: error.message },
          "Failed to get current user",
        );
        return { user: null, error: error.message };
      }

      return { user, error: null };
    } catch (error) {
      this.logger.error({ error }, "Get current user error");
      return { user: null, error: "Failed to get current user" };
    }
  }

  // 获取当前用户，失败时自动创建匿名用户
  async getCurrentUserOrAnonymous(): Promise<{
    user: SupabaseUser | null;
    session: Session | null;
    isAnonymous: boolean;
    error: string | null;
  }> {
    this.logger.info("Attempting to get current user or create anonymous user");

    try {
      // 首先尝试获取当前用户
      const { user, error } = await this.getCurrentUser();

      if (user && !error) {
        this.logger.info({ userId: user.id }, "Current user found");

        // 获取会话信息
        const { session } = await this.getSession();

        // 检查是否为匿名用户
        const isAnonymous = await this.anonymousService.isAnonymousUser(
          user.id,
        );

        return { user, session, isAnonymous, error: null };
      }

      // 如果获取用户失败，自动创建匿名用户
      this.logger.info("No current user found, creating anonymous user");

      const anonymousResult = await this.anonymousService.createAnonymousUser();

      if (anonymousResult.error || !anonymousResult.user) {
        this.logger.error(
          { error: anonymousResult.error },
          "Failed to create anonymous user",
        );
        return {
          user: null,
          session: null,
          isAnonymous: false,
          error: anonymousResult.error || "Failed to create anonymous user",
        };
      }

      this.logger.info(
        { userId: anonymousResult.user.id },
        "Anonymous user created successfully",
      );

      return {
        user: anonymousResult.user,
        session: anonymousResult.session,
        isAnonymous: true,
        error: null,
      };
    } catch (error) {
      this.logger.error({ error }, "Get current user or anonymous error");
      return {
        user: null,
        session: null,
        isAnonymous: false,
        error: "Failed to get or create user",
      };
    }
  }

  // 刷新会话
  async refreshSession(): Promise<{ error: string | null }> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.refreshSession();

      if (error) {
        this.logger.error(
          { error: error.message },
          "Failed to refresh session",
        );
        return { error: error.message };
      }

      this.logger.debug("Session refreshed successfully");
      return { error: null };
    } catch (error) {
      this.logger.error({ error }, "Refresh session error");
      return { error: "Failed to refresh session" };
    }
  }

  // 获取用户会话
  async getSession(): Promise<{ session: any | null; error: string | null }> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error: error?.message || null };
  }
}
