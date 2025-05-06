// Stub for Node.js 'net' module to support connect in browser
export function connect(...args) {
    console.warn('net.connect() stub called in browser, args:', args);
    // Return a dummy socket-like object
    return {
        on: () => { },
        end: () => { },
        write: () => { },
        destroy: () => { },
    };
} 