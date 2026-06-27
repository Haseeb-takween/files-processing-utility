import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ExpressFetchError,
  EXPRESS_PDF_TIMEOUT_MS,
  fetchExpress,
  wakeExpressBackend,
} from '@/lib/express';
import { getFriendlyApiError } from '@/lib/errors';
import { SESSION_COOKIE } from '@/lib/session';

const ALLOWED_TOOLS = ['merge', 'split', 'compress', 'convert', 'pages', 'watermark'];
const RETRY_DELAY_MS = 8000;
const MAX_ATTEMPTS = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildFormData(entries: [string, FormDataEntryValue][]): FormData {
  const fd = new FormData();
  for (const [key, value] of entries) {
    fd.append(key, value);
  }
  return fd;
}

async function proxyPdfToExpress(
  tool: string,
  token: string,
  entries: [string, FormDataEntryValue][]
): Promise<Response> {
  await wakeExpressBackend();

  return fetchExpress(
    `/api/pdf/${tool}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: buildFormData(entries),
    },
    EXPRESS_PDF_TIMEOUT_MS
  );
}

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

  const incoming = await request.formData();
  const entries: [string, FormDataEntryValue][] = [];
  for (const entry of incoming.entries()) {
    entries.push(entry);
  }

  try {
    let response: Response | null = null;
    let lastError: ExpressFetchError | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        if (attempt > 1) {
          await sleep(RETRY_DELAY_MS);
        }
        response = await proxyPdfToExpress(tool, token, entries);
        break;
      } catch (err) {
        if (err instanceof ExpressFetchError) {
          lastError = err;
          if (attempt < MAX_ATTEMPTS) continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError ?? new ExpressFetchError(503, 'Could not reach the processing server.');
    }

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

    const headers: Record<string, string> = { 'Content-Type': contentType };
    const disposition = response.headers.get('content-disposition');
    if (disposition) {
      headers['Content-Disposition'] = disposition;
    }
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
