import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });
  clearAuthCookie(response);
  return response;
}
