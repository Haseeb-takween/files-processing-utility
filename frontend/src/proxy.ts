import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'token';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // NOTE: we deliberately do NOT redirect away from /login or /register when a
  // cookie is present. The middleware can only see that a token *exists*, not
  // that it's still valid — so a stale/expired cookie used to trap users on a
  // redirect loop and trigger the "account required" pop-up. Letting the auth
  // pages always load (and re-login overwrite the cookie) resolves that.

  // Access control for the tools: no session → straight to login, with a
  // `next` param so the user lands back on the tool after signing in.
  // This blocks the page (and its upload UI) before any file can be selected,
  // instead of letting processing silently fail later.
  if (pathname.startsWith('/tools') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/tools/:path*'],
};
