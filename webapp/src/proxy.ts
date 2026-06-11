import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((request) => {
  if (request.auth) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/", request.nextUrl.origin));
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/items/:path*",
    "/collections/:path*",
  ],
};
