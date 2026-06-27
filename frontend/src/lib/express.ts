export function getExpressApiUrl(): string {
	return process.env.EXPRESS_API_URL || 'http://localhost:5000';
}

export async function proxyJsonToExpress<T>(
	path: string,
	options: RequestInit = {},
): Promise<{ data: T; status: number }> {
	const headers = new Headers(options.headers);

	if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	const response = await fetch(`${getExpressApiUrl()}${path}`, {
		...options,
		headers,
	});

	const data = (await response.json()) as T;
	return { data, status: response.status };
}
