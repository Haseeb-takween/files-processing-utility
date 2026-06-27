import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ExpressFetchError, fetchExpress } from '@/lib/express';
import { getFriendlyApiError } from '@/lib/errors';
import { SESSION_COOKIE } from '@/lib/session';

const ALLOWED_TOOLS = ['merge', 'split', 'compress', 'convert', 'pages', 'watermark'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tool: string }> }
) {
  const { tool } = await params;

  if (!ALLOWED_TOOLS.includes(tool)) {
    return NextResponse.json({ message: 'Invalid tool' }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  const formData = await request.formData();

  try {
    const response = await fetchExpress(`/api/pdf/${tool}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.arrayBuffer();

    if (contentType.includes('application/json')) {
      const json = JSON.parse(new TextDecoder().decode(body));
      if (!response.ok) {
        return NextResponse.json(
          { message: getFriendlyApiError(response.status, json) },
          { status: response.status }
        );
      }
      return NextResponse.json(json, { status: response.status });
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: getFriendlyApiError(response.status) },
        { status: response.status }
      );
    }

    // Binary download: pass through the filename so the browser saves it correctly.
    const headers: Record<string, string> = { 'Content-Type': contentType };
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      headers['Content-Disposition'] = disposition;
    }
    // Forward tool metadata headers (e.g. compression stats) to the browser.
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-')) {
        headers[key] = value;
      }
    });

    return new NextResponse(body, {
      status: response.status,
      headers,
    });
  } catch (err) {
    console.error(`PDF proxy error (${tool}):`, err);
    if (err instanceof ExpressFetchError) {
      return NextResponse.json({ message: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      {
        message:
          'Could not reach the processing server. It may be waking up — please wait a moment and try again.',
      },
      { status: 503 }
    );
  }
}
