import { AuthService } from "@/modules/auth/auth.service";
import { UserService } from "@/modules/user/user.service";

export async function authorization() {
  const authService = new AuthService();
  const { user, error } = await authService.getCurrentUser();

  if (error || !user) {
    throw new Error("未授权访问");
  }

  return user;
}

/**
 * 验证管理员权限
 * @returns 返回包含完整用户信息的对象
 * @throws 如果用户未登录、不存在或不是管理员，则抛出错误
 */
export async function requireAdmin() {
  // 1. 验证用户身份（Supabase 认证）
  const authUser = await authorization();

  // 2. 从数据库查询用户的真实角色
  const userService = new UserService();
  const user = await userService.getUserById(authUser.id);

  // 3. 检查用户是否存在
  if (!user) {
    throw new Error("用户不存在");
  }

  // 4. 验证管理员权限
  if (user.role !== "admin") {
    throw new Error("权限不足，只有管理员才能执行此操作");
  }

  return user;
}
