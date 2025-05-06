// Stub for Node.js 'url' module to support fileURLToPath import
export function fileURLToPath(input) {
    // In browser, URL objects have pathname property
    if (typeof input === 'string') {
        return input;
    }
    if (input && typeof input.pathname === 'string') {
        return input.pathname;
    }
    // Fallback to string conversion
    return String(input);
} 