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

export default { get }; 