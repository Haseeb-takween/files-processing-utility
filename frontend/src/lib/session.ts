import { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'token';

export function setAuthCookie(response: NextResponse, token: string): void {
	response.cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24,
		path: '/',
	});
}

export function clearAuthCookie(response: NextResponse): void {
	response.cookies.set(SESSION_COOKIE, '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 0,
		path: '/',
	});
}
