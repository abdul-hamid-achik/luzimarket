import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns system status, resource usage, and log information for monitoring
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   head:
 *     summary: Simple availability check
 *     description: Simple HEAD request for checking if the service is available
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is available
 */

/**
 * Health check endpoint returns system status and resource usage
 */
export async function GET() {
    try {
        // Log directory for monitoring
        const LOG_DIR = process.env.NODE_ENV === 'test'
            ? path.join(process.cwd(), '..', '..', 'tmp', 'playwright-logs')
            : path.join(process.cwd(), 'logs');

        // Detect test environment more comprehensively
        const isTestEnvironment = !!(process.env.NODE_ENV === 'test' ||
            process.env.VITEST_SESSION_ID ||
            process.env.VITEST ||
            process.env.npm_lifecycle_event === 'test');

        // Gather system information
        const systemInfo = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            environment: isTestEnvironment ? 'test' : (process.env.NODE_ENV || 'development'),
            memory: {
                free: Math.round(os.freemem() / 1024 / 1024),
                total: Math.round(os.totalmem() / 1024 / 1024),
                usage: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)
            },
            cpu: os.loadavg(),
            test: isTestEnvironment
        };

        // Log health check to file
        try {
            if (!fs.existsSync(LOG_DIR)) {
                fs.mkdirSync(LOG_DIR, { recursive: true });
            }
            const logFile = path.join(LOG_DIR, 'health-checks.log');
            fs.appendFileSync(logFile, `${systemInfo.timestamp} | Health check triggered | Status: ${systemInfo.status}\n`);
        } catch (error) {
            console.error('Error writing to health log:', error);
        }

        // Check if log files exist and get their sizes
        const logInfo: Record<string, any> = {};
        const logTypes = ['api-requests', 'api-errors', 'api-events', 'console-errors'];

        for (const logType of logTypes) {
            const logFile = path.join(LOG_DIR, `${logType}.log`);

            if (fs.existsSync(logFile)) {
                try {
                    const stats = fs.statSync(logFile);
                    logInfo[logType] = {
                        exists: true,
                        size: stats.size,
                        modified: stats.mtime
                    };

                    // Count error entries in error logs
                    if (logType.includes('error')) {
                        const content = fs.readFileSync(logFile, 'utf8');
                        const lines = content.split('\n').filter(Boolean);
                        logInfo[logType].entries = lines.length;
                    }
                } catch (e) {
                    logInfo[logType] = { exists: true, error: 'Could not read file stats' };
                }
            } else {
                logInfo[logType] = { exists: false };
            }
        }

        // Return system status with log info
        return NextResponse.json({
            ...systemInfo,
            logs: logInfo
        });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Health check failed',
            error: (error as Error).message
        }, { status: 500 });
    }
}

/**
 * HEAD request for simple availability checking
 */
export function HEAD() {
    return new Response(null, { status: 200 });
} 