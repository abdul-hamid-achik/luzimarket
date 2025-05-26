import { Logger } from 'next-axiom';

// E2E Test Logger for structured logging in CI
export class E2ELogger {
    private logger: Logger;
    private sessionId: string;
    private testContext: any;

    constructor(sessionId?: string) {
        this.logger = new Logger();
        this.sessionId = sessionId || process.env.PLAYWRIGHT_SESSION_ID || 'unknown';
        this.testContext = {
            sessionId: this.sessionId,
            environment: process.env.CI ? 'ci' : 'local',
            timestamp: new Date().toISOString()
        };
    }

    async logTestStart(testName: string, context: any = {}) {
        await this.logger.info('Test Started', {
            ...this.testContext,
            testName,
            action: 'test_start',
            ...context
        });
        await this.logger.flush();
    }

    async logTestEnd(testName: string, result: 'passed' | 'failed', context: any = {}) {
        await this.logger.info('Test Completed', {
            ...this.testContext,
            testName,
            result,
            action: 'test_end',
            ...context
        });
        await this.logger.flush();
    }

    async logAction(action: string, details: any = {}) {
        await this.logger.info('Test Action', {
            ...this.testContext,
            action,
            ...details
        });
        await this.logger.flush();
    }

    async logError(error: string, details: any = {}) {
        await this.logger.error('Test Error', {
            ...this.testContext,
            error,
            action: 'error',
            ...details
        });
        await this.logger.flush();
    }

    async logApiCall(method: string, url: string, status?: number, responseTime?: number) {
        await this.logger.info('API Call', {
            ...this.testContext,
            action: 'api_call',
            method,
            url,
            status,
            responseTime
        });
        await this.logger.flush();
    }

    async logPageNavigation(url: string, loadTime?: number) {
        await this.logger.info('Page Navigation', {
            ...this.testContext,
            action: 'navigation',
            url,
            loadTime
        });
        await this.logger.flush();
    }
}

// Global logger instance
let globalLogger: E2ELogger;

export function getE2ELogger(): E2ELogger {
    if (!globalLogger) {
        globalLogger = new E2ELogger();
    }
    return globalLogger;
} 