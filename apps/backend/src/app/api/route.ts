import { NextResponse } from "next/server";

export async function GET() {
    // Get the current environment and host information
    const isProduction = process.env.NODE_ENV === 'production';
    const backendUrl = isProduction
        ? 'https://luzimarket-backend.vercel.app'
        : `http://localhost:${process.env.PORT || 8000}`;

    // Return HTML response matching frontend theme
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LuziMarket API Backend</title>
      <style>
        body { 
          margin: 0; 
          padding: 0;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #f8f9fa;
          color: #000000;
          line-height: 1.6;
        }
        .admin-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .admin-header {
          background: #ffffff;
          color: #000000;
          padding: 1.5rem 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border-bottom: 2px solid #000000;
          margin-bottom: 2rem;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        .admin-title {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .logo {
          font-size: 2rem;
        }
        .main-content {
          flex: 1;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .content-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 2rem;
          margin-bottom: 2rem;
        }
        .environment-badge {
          background: ${isProduction ? '#28a745' : '#ffc107'};
          color: ${isProduction ? 'white' : '#000'};
          padding: 0.5rem 1rem;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 1.5rem;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .section {
          margin-bottom: 2rem;
        }
        .section h2 {
          color: #000000;
          margin-bottom: 1rem;
          font-size: 1.4rem;
          font-weight: 600;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 0.5rem;
        }
        .endpoint-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        .endpoint-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 1.5rem;
          transition: all 0.2s ease;
          border-left: 3px solid #000000;
        }
        .endpoint-card:hover {
          background: #e9ecef;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .endpoint-link {
          color: #000000;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          display: block;
          margin-bottom: 0.5rem;
        }
        .endpoint-link:hover {
          text-decoration: underline;
        }
        .endpoint-desc {
          color: #495057;
          font-size: 0.9rem;
          margin: 0;
        }
        .backend-info {
          background: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 8px;
          padding: 1.5rem;
          border-left: 3px solid #1976d2;
        }
        .backend-info h3 {
          margin-top: 0;
          color: #1976d2;
          font-size: 1.2rem;
        }
        .backend-info p {
          margin: 0.5rem 0;
        }
        .backend-info code {
          background: #f5f5f5;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }
        .footer {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e9ecef;
          color: #6c757d;
          font-size: 0.9rem;
          text-align: center;
        }
        @media (max-width: 768px) {
          .container, .main-content {
            padding: 1rem;
          }
          .content-card {
            padding: 1.5rem;
          }
          .endpoint-grid {
            grid-template-columns: 1fr;
          }
          .admin-title {
            font-size: 1.5rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="admin-layout">
        <div class="admin-header">
          <div class="container">
            <h1 class="admin-title">
              <span class="logo">🚀</span>
              LuziMarket API Backend
            </h1>
          </div>
        </div>
        
        <div class="main-content">
          <div class="content-card">
            <div class="environment-badge">
              ${isProduction ? '🌐 Production Environment' : '🛠️ Development Environment'}
            </div>
            
            <p style="font-size: 1.1rem; margin-bottom: 2rem; color: #495057;">
              This is an API-only backend service. No frontend pages are served from this application.
            </p>
            
            <div class="section">
              <h2>📚 API Documentation</h2>
              <div class="endpoint-grid">
                <div class="endpoint-card">
                  <a href="/api/docs" class="endpoint-link">/api/docs</a>
                  <p class="endpoint-desc">Interactive Swagger UI documentation with request/response examples</p>
                </div>
                <div class="endpoint-card">
                  <a href="/api/docs/redoc" class="endpoint-link">/api/docs/redoc</a>
                  <p class="endpoint-desc">Professional Redoc documentation interface</p>
                </div>
                <div class="endpoint-card">
                  <a href="/api/docs/openapi.json" class="endpoint-link">/api/docs/openapi.json</a>
                  <p class="endpoint-desc">Raw OpenAPI 3.0 specification for API integration</p>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>🔗 Core API Endpoints</h2>
              <div class="endpoint-grid">
                <div class="endpoint-card">
                  <a href="/api/health" class="endpoint-link">/api/health</a>
                  <p class="endpoint-desc">Service health and status information</p>
                </div>
                <div class="endpoint-card">
                  <a href="/api/products" class="endpoint-link">/api/products</a>
                  <p class="endpoint-desc">Product catalog management and retrieval</p>
                </div>
                <div class="endpoint-card">
                  <a href="/api/categories" class="endpoint-link">/api/categories</a>
                  <p class="endpoint-desc">Product category management</p>
                </div>
                <div class="endpoint-card">
                  <a href="/api/auth" class="endpoint-link">/api/auth</a>
                  <p class="endpoint-desc">User authentication and session management</p>
                </div>
                <div class="endpoint-card">
                  <a href="/api/vendors" class="endpoint-link">/api/vendors</a>
                  <p class="endpoint-desc">Vendor and supplier management</p>
                </div>
                <div class="endpoint-card">
                  <a href="/api/orders" class="endpoint-link">/api/orders</a>
                  <p class="endpoint-desc">Order processing and management</p>
                </div>
              </div>
            </div>
            
            <div class="section">
              <div class="backend-info">
                <h3>🌐 Backend Information</h3>
                <p><strong>Backend URL:</strong> <a href="${backendUrl}" target="_blank" style="color: #1976d2;">${backendUrl}</a></p>
                <p><strong>Environment:</strong> ${isProduction ? 'Production (Vercel)' : 'Development (Local)'}</p>
                <p><strong>API Base:</strong> <code>${backendUrl}/api</code></p>
                <p><strong>Port Configuration:</strong> Uses <code>process.env.PORT</code> ${isProduction ? '(auto-configured by Vercel)' : `(defaults to ${process.env.PORT || 3000})`}</p>
              </div>
            </div>
            
            <div class="footer">
              <p>LuziMarket API Backend • Built with Next.js ${isProduction ? 'on Vercel' : 'locally'}</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
        },
    });
} 