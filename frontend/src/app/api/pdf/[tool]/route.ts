import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getExpressApiUrl } from '@/lib/express';
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

  const response = await fetch(`${getExpressApiUrl()}/api/pdf/${tool}`, {
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
    return NextResponse.json(json, { status: response.status });
  }

  return new NextResponse(body, {
    status: response.status,
    headers: { 'Content-Type': contentType },
  });
}
