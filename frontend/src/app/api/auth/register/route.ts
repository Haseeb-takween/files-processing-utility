import { NextResponse } from 'next/server';
import { proxyJsonToExpress } from '@/lib/express';

interface ExpressErrorBody {
  message?: string;
  error?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, status } = await proxyJsonToExpress<ExpressErrorBody & { message?: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    if (status >= 400) {
      return NextResponse.json(
        { error: data.message || data.error || 'Registration failed' },
        { status }
      );
    }

    return NextResponse.json(data, { status });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Unable to reach API server', message: 'Unable to reach API server' },
      { status: 503 }
    );
  }
}
