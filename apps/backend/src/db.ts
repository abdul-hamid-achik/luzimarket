import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleWs } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

let connectionString = process.env.DATABASE_URL!;

if (process.env.NODE_ENV === 'development') {
  // Use the Docker Compose database service
  connectionString = process.env.DATABASE_URL || 'postgres://postgres:password@db:5433/ecommerce';

  // Configure Neon HTTP/WebSocket proxy for local development
  neonConfig.fetchEndpoint = (host) => {
    const [protocol, port] = host === 'db' ? ['http', 5432] : ['https', 443];
    return `${protocol}://${host}:${port}/sql`;
  };

  const url = new URL(connectionString);
  neonConfig.useSecureWebSocket = url.hostname !== 'db';
  neonConfig.wsProxy = (host) =>
    host === 'db' ? `${host}:5432/v2` : `${host}/v2`;
}

// Always set the WebSocket constructor
neonConfig.webSocketConstructor = ws;

// Create a Neon client and a serverless Pool
const sqlClient = neon(connectionString);
// @ts-ignore
const serverlessPool = new Pool({ connectionString });

// HTTP Client: ideal for serverless functions and sporadic queries
export const drizzleClientHttp = drizzleHttp({ client: sqlClient });

// WebSocket Client: ideal for long-running servers and high-frequency queries
export const drizzleClientWs = drizzleWs({ client: serverlessPool });