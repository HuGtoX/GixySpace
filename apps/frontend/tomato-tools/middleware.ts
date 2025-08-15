import { NextRequest } from "next/server";
import { updateSession } from "@/middleware/supabase/middleware";
import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("middleware");

// 需要认证的页面路径
const protectedPaths = ["/dashboard", "/profile", "/settings"];

// API接口路径中需要认证的
const protectedApiPaths = ["/api/auth/me", "/api/auth/logout", "/api/user", "/api/todo"];

// 公开的认证相关页面路径
const publicAuthPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  log.info({ pathname, method: request.method }, "Request started");
  log.debug({ headers: request.headers }, "Request headers");

  log.debug({ pathname }, "Middleware processing request");

  // 处理Supabase会话更新
  const response = await updateSession(request);

  // 检查是否需要认证
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );
  const isProtectedApiPath = protectedApiPaths.some((path) =>
    pathname.startsWith(path),
  );
  const isPublicAuthPath = publicAuthPaths.some((path) =>
    pathname.startsWith(path),
  );

  // 如果是公开路径，直接返回
  if (isPublicAuthPath || (!isProtectedPath && !isProtectedApiPath)) {
    return response;
  }

  log.info({ response }, "final response");

  // 对于需要认证的路径，检查用户是否已登录
  // 这里可以通过检查cookies中的session来判断
  // 由于updateSession已经处理了认证逻辑，我们可以检查响应中的用户信息

  log.debug(
    { pathname, isProtectedPath, isProtectedApiPath },
    "Processing protected route",
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下开头的：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon文件)
     * - 公开文件夹中的文件
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
