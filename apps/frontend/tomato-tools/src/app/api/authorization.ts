import { AuthService } from "@/modules/auth/auth.service";

export async function authorization() {
  const authService = new AuthService();
  const { user, error } = await authService.getCurrentUser();

  if (error || !user) {
    throw new Error("未授权访问");
  }

  return user;
}
