import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ExpressFetchError, fetchExpress } from '@/lib/express';
import { getFriendlyApiError } from '@/lib/errors';
import { SESSION_COOKIE } from '@/lib/session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  try {
    const response = await fetchExpress('/api/usage/me', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: getFriendlyApiError(response.status, data) },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error('Usage proxy error:', err);
    if (err instanceof ExpressFetchError) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { message: 'Unable to reach the API server. It may be waking up — please try again.' },
      { status: 503 }
    );
  }
}
