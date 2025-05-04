import dotenv from "dotenv";
import app from "./app";
import serverless from "serverless-http";
import http from "http";

dotenv.config();

// Create the serverless handler for Vercel
const handler = serverless(app);

// Export using TypeScript "export =" which compiles to CommonJS module.exports
export = handler;

// Function to try starting the server on a given port
function startServer(port: number) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      resolve(server);
    });
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying another port...`);
        reject(err);
      } else {
        reject(err);
      }
    });
  });
}

let currentIndex = 0;
async function tryNextPort(portsToTry: number[], basePort: number) {
  if (currentIndex >= portsToTry.length) {
    console.error('No available ports found. Please check your port configuration.');
    process.exit(1);
  }

  const port = portsToTry[currentIndex];
  try {
    await startServer(port);
  } catch (err) {
    currentIndex++;
    await tryNextPort(portsToTry, basePort);
  }
}

// Fallback to run locally with port fallback logic
if (require.main === module) {
  const basePort = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const portsToTry = [basePort, basePort + 1, basePort + 2, basePort + 3];
  tryNextPort(portsToTry, basePort);
}