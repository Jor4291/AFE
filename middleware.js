export default function middleware(request) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return new Response('Basic auth is not configured. Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in Vercel.', {
      status: 503,
    });
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Basic ')) {
    const encoded = authHeader.slice(6);
    let decoded;
    try {
      decoded = atob(encoded);
    } catch {
      decoded = '';
    }

    const colon = decoded.indexOf(':');
    const user = colon >= 0 ? decoded.slice(0, colon) : decoded;
    const pass = colon >= 0 ? decoded.slice(colon + 1) : '';

    if (user === expectedUser && pass === expectedPass) {
      return;
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="AFE Portal Demo"',
    },
  });
}

export const config = {
  matcher: ['/((?!_vercel/).*)'],
};
