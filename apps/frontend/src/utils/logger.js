/**
 * Logger utility for frontend debugging
 * Provides both console logging and API logging capabilities
 */

// Configuration for the logger
const config = {
    // Default log level
    level: process.env.NODE_ENV === 'test' ? 'debug' : 'info',
    // Whether to send logs to the backend API
    apiLogging: process.env.NODE_ENV === 'test',
    // Backend API endpoint for logs
    logEndpoint: '/api/logs',
    // Categories to ignore (not log)
    ignoreCategories: []
};

// Log levels with numeric values for comparison
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

/**
 * Send a log to the backend API
 * @param {Object} logData Log data to send
 */
async function sendLogToApi(logData) {
    try {
        if (!config.apiLogging) return;

        await fetch(config.logEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...logData,
                timestamp: new Date().toISOString(),
                url: window.location.href
            })
        });
    } catch (err) {
        // Silent fail on logging errors to prevent cascading issues
        console.error('Failed to send log to API:', err);
    }
}

/**
 * Main logger function
 * @param {string} level Log level (debug, info, warn, error)
 * @param {string} category Log category for grouping/filtering
 * @param {string} message Log message
 * @param {Object} data Additional data to log
 */
function log(level, category, message, data = {}) {
    // Skip logging if level is below configured level
    if (LOG_LEVELS[level] < LOG_LEVELS[config.level]) return;

    // Skip logging if category is in ignore list
    if (config.ignoreCategories.includes(category)) return;

    // Prepare log data
    const logData = {
        level,
        category,
        message,
        data
    };

    // Log to console
    switch (level) {
        case 'debug':
            console.debug(`[${category}] ${message}`, data);
            break;
        case 'info':
            console.info(`[${category}] ${message}`, data);
            break;
        case 'warn':
            console.warn(`[${category}] ${message}`, data);
            break;
        case 'error':
            console.error(`[${category}] ${message}`, data);
            break;
    }

    // Send to API
    if (process.env.NODE_ENV === 'test' || level === 'error') {
        sendLogToApi(logData);
    }
}

// Convenience methods for different log levels
const logger = {
    debug: (category, message, data) => log('debug', category, message, data),
    info: (category, message, data) => log('info', category, message, data),
    warn: (category, message, data) => log('warn', category, message, data),
    error: (category, message, data) => log('error', category, message, data),

    // Configure the logger
    configure: (options) => {
        Object.assign(config, options);
    },

    // Log API requests for debugging
    logApiRequest: (method, url, data, response) => {
        const status = response?.status;
        const isError = status >= 400;

        const logLevel = isError ? 'error' : 'debug';
        const message = `${method} ${url} - ${status || 'No response'}`;

        log(logLevel, 'api', message, {
            request: { method, url, data },
            response: {
                status,
                ok: response?.ok,
                statusText: response?.statusText,
                data: response?.data
            }
        });
    }
};

export default logger; 