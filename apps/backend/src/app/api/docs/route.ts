import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Swagger UI documentation page
 *     description: Serves an interactive HTML page with Swagger UI for exploring and testing the API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: HTML page with Swagger UI interface
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: Complete HTML page with embedded Swagger UI
 */
export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Luzi Market API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
        <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.10.3/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.10.3/favicon-16x16.png" sizes="16x16" />
        <style>
          html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
          }
          *, *:before, *:after {
            box-sizing: inherit;
          }
          body {
            margin:0;
            background: #fafafa;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .swagger-ui .topbar {
            background-color: #2d3748;
          }
          .swagger-ui .topbar .topbar-wrapper {
            padding: 0 20px;
          }
          .swagger-ui .topbar .topbar-wrapper .link {
            color: white;
            font-size: 1.5em;
            font-weight: bold;
            text-decoration: none;
          }
          .swagger-ui .info .title {
            color: #2d3748;
          }
          .swagger-ui .scheme-container {
            background: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
          }
          .custom-header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
          }
          .custom-header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="custom-header">
          <h1>🛒 Luzi Market API</h1>
          <p>Complete API documentation for the Luzi Market e-commerce platform</p>
        </div>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            const ui = SwaggerUIBundle({
              url: '/api/docs/openapi.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: "StandaloneLayout",
              docExpansion: "list",
              displayRequestDuration: true,
              tryItOutEnabled: true,
              filter: true,
              persistAuthorization: true,
              displayOperationId: false,
              defaultModelRendering: 'model',
              showExtensions: false,
              showCommonExtensions: false,
              requestInterceptor: function(request) {
                // Add any custom headers here
                return request;
              },
              responseInterceptor: function(response) {
                // Handle responses here
                return response;
              }
            });
          };
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 