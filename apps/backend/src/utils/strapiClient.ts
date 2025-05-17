// removed axios-based Strapi client
const host = (
    process.env.STRAPI_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/strapi` : 'http://localhost:1337')
).replace(/\/$/, '');

async function get(path: string) {
    const url = `${host}${path}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Strapi request failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return { data: json };
}

// Add POST method
async function post(path: string, body: any) {
    const url = `${host}${path}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Strapi POST request failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return { data: json };
}

// Add PUT method
async function put(path: string, body: any) {
    const url = `${host}${path}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Strapi PUT request failed: ${res.status} ${text}`);
    }
    const json = await res.json();
    return { data: json };
}

// Add DELETE method
async function del(path: string) {
    const url = `${host}${path}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Strapi DELETE request failed: ${res.status} ${text}`);
    }
    const text = await res.text();
    return { data: text };
}

// Export all methods
export default { get, post, put, delete: del }; 