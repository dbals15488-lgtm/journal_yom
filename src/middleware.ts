import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = ["/", "/workout", "/diet", "/diary", "/detail", "/support"];
const AUTH_PATHS = ["/login", "/register"];

// next-auth v5의 세션 쿠키 이름들 (환경에 따라 이름 다름)
const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token", // HTTPS (프로덕션)
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 세션 쿠키 존재 여부만 체크 (실제 검증은 페이지/액션에서)
  const isLoggedIn = SESSION_COOKIE_NAMES.some(
    (name) => req.cookies.get(name)?.value
  );

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const isAuthPage = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 로그아웃 상태로 보호된 경로 접근 → 로그인 페이지로
  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 로그인 상태로 인증 페이지 접근 → 홈으로
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};