import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/docs/redoc:
 *   get:
 *     summary: Redoc documentation page
 *     description: Serves a clean, professional HTML page with Redoc for viewing API documentation
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: HTML page with Redoc interface
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: Complete HTML page with embedded Redoc
 */
export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Luzi Market API Documentation - Redoc</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Roboto', sans-serif;
          }
          .custom-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 0;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .custom-header h1 {
            margin: 0;
            font-size: 3em;
            font-weight: 300;
            font-family: 'Montserrat', sans-serif;
          }
          .custom-header p {
            margin: 15px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
          }
          #redoc-container {
            margin-top: 0;
          }
        </style>
      </head>
      <body>
        <div class="custom-header">
          <h1>🛒 Luzi Market API</h1>
          <p>Professional API Documentation</p>
        </div>
        <div id="redoc-container"></div>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
        <script>
          Redoc.init('/api/docs/openapi.json', {
            scrollYOffset: 0,
            hideHostname: false,
            hideDownloadButton: false,
            theme: {
              colors: {
                primary: {
                  main: '#667eea'
                }
              },
              typography: {
                fontSize: '14px',
                lineHeight: '1.5em',
                code: {
                  fontSize: '13px',
                  fontFamily: 'Courier, monospace'
                },
                headings: {
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '400'
                }
              },
              menu: {
                backgroundColor: '#fafafa'
              }
            }
          }, document.getElementById('redoc-container'));
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