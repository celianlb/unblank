import { NextRequest, NextResponse } from 'next/server';

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  // Allow Chrome extensions and localhost
  if (origin && (origin.startsWith('chrome-extension://') || origin.includes('localhost') || origin.includes('unblank.app'))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreFlight(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
