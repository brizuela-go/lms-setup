export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // Protect these routes with authentication
    "/dashboard/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",

    // Skip these paths
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)",
  ],
};

export const runtime = "experimental-edge";
