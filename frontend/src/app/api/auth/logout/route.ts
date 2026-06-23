import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'token';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' }, { status: 200 });

  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
