import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("refresh_token")

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isAppPage = req.nextUrl.pathname.startsWith("/dashboard")

  if (!token && isAppPage) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  if (token && isAuthPage && req.nextUrl.pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/dashboard/flux", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/app/:path*", "/auth/:path*"],
}
