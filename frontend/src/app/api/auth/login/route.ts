import { NextResponse } from 'next/server';
import { proxyJsonToExpress } from '@/lib/express';
import { setAuthCookie } from '@/lib/session';

interface LoginResponse {
  message?: string;
  user?: { name: string; email: string };
  token?: string;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, status } = await proxyJsonToExpress<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (status >= 400 || !data.token) {
      return NextResponse.json(
        { error: data.message || data.error || 'Login failed' },
        { status: status >= 400 ? status : 401 }
      );
    }

    const response = NextResponse.json({
      message: data.message,
      user: data.user,
    });

    setAuthCookie(response, data.token);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to reach API server', message: 'Unable to reach API server' },
      { status: 503 }
    );
  }
}
