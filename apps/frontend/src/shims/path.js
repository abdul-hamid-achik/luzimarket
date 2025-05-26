// Stub for Node.js 'path' module to support dirname and join in browser
export function dirname(p) {
    // Return dirname by removing trailing segment
    const parts = p.split('/');
    parts.pop();
    return parts.join('/') || '/';
}
export function join(...parts) {
    return parts.join('/');
}

const path = { dirname, join };
export default path; 