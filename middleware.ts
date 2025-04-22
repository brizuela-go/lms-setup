// middleware.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthRoute = nextUrl.pathname.startsWith("/login");
  const isStaticFile =
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/favicon.ico") ||
    nextUrl.pathname.startsWith("/images") ||
    nextUrl.pathname.startsWith("/assets") ||
    nextUrl.pathname.endsWith(".css") ||
    nextUrl.pathname.endsWith(".js") ||
    nextUrl.pathname.endsWith(".jpg") ||
    nextUrl.pathname.endsWith(".png") ||
    nextUrl.pathname.endsWith(".svg");

  // Allow API routes and static files
  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  // If it's the login page and user is logged in, redirect to dashboard based on role
  if (isAuthRoute && isLoggedIn) {
    switch (session.user.role) {
      case "STUDENT":
        return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
      case "TEACHER":
        return NextResponse.redirect(new URL("/teacher", nextUrl.origin));
      case "ADMIN":
      case "SUPERADMIN":
        return NextResponse.redirect(new URL("/admin", nextUrl.origin));
      default:
        return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl.origin));
  }

  // Handle role-based access
  if (isLoggedIn) {
    // Check for admin routes
    if (
      nextUrl.pathname.startsWith("/admin") &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPERADMIN"
    ) {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }

    // Check for teacher routes
    if (
      nextUrl.pathname.startsWith("/teacher") &&
      session.user.role !== "TEACHER"
    ) {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }

    // Check for student routes
    if (
      (nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/subjects") ||
        nextUrl.pathname.startsWith("/homeworks") ||
        nextUrl.pathname.startsWith("/calendar")) &&
      session.user.role !== "STUDENT"
    ) {
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
  }

  return NextResponse.next();
});

// Optional: Config for matching against specific paths
export const config = {
  matcher: [
    // Routes that require authentication/authorization
    "/",
    "/dashboard/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/subjects/:path*",
    "/homeworks/:path*",
    "/calendar/:path*",
    "/login",

    // Skip static assets and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)",
  ],
};
