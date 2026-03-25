import { NextResponse } from "next/server";

export function middleware(req) {
  if (req.nextUrl.pathname === "/api/chat") {
    const url = req.nextUrl.clone();
    url.pathname = "/api/chat-v2";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/chat"],
};
