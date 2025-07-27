export const runtime = 'nodejs';

import { handlers } from "@/lib/auth";

// Handle CORS for test environment
function withCors(handler: any) {
  return async (request: Request) => {
    const origin = request.headers.get('origin');
    const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                             process.env.PLAYWRIGHT_TEST === 'true' ||
                             request.headers.get('user-agent')?.includes('Playwright');
    
    const response = await handler(request);
    
    // Create new response with CORS headers for test environment
    if (isTestEnvironment || origin === null || origin?.includes('localhost')) {
      const corsHeaders = new Headers(response.headers);
      corsHeaders.set('Access-Control-Allow-Origin', '*');
      corsHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      corsHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      corsHeaders.set('Access-Control-Allow-Credentials', 'true');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: corsHeaders,
      });
    }
    
    return response;
  };
}

export const GET = withCors(handlers.GET);
export const POST = withCors(handlers.POST);

// Handle preflight requests
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                           process.env.PLAYWRIGHT_TEST === 'true' ||
                           request.headers.get('user-agent')?.includes('Playwright');
  
  if (isTestEnvironment || origin === null || origin?.includes('localhost')) {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }
  
  return new Response(null, { status: 405 });
}
