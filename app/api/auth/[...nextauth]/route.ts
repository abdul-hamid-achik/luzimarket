import { handlers } from "@/lib/auth";

// Handle CORS for test environment
function withCors(handler: any) {
  return async (request: Request) => {
    const origin = request.headers.get('origin');
    const isTestEnvironment = process.env.NODE_ENV === 'test' || 
                             process.env.PLAYWRIGHT_TEST === 'true' ||
                             request.headers.get('user-agent')?.includes('Playwright');
    
    // Allow requests from test environment or local development
    if (isTestEnvironment || origin === null || origin?.includes('localhost')) {
      const response = await handler(request);
      
      // Add CORS headers for test environment
      if (isTestEnvironment || origin === null) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
      
      return response;
    }
    
    return handler(request);
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

// Export runtime to fix potential edge runtime issues
export const runtime = 'nodejs';