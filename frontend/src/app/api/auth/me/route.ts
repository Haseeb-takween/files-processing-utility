import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { SESSION_COOKIE, clearAuthCookie } from '@/lib/session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token || !process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      name: string;
      email: string;
    };

    return NextResponse.json({
      user: { name: decoded.name, email: decoded.email },
    });
  } catch {
    // Token is present but invalid/expired. Clear it so the stale cookie can't
    // trap the user (navbar shows "logged out" yet the cookie blocks login).
    const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    clearAuthCookie(response);
    return response;
  }
}
