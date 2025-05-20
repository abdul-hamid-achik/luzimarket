/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable CORS headers for API routes
    async headers() {
        return [
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Credentials', value: 'true' },
                    { key: 'Access-Control-Allow-Origin', value: '*' },
                    { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
                    { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
                ],
            },
        ];
    },
    // Configure webpack to properly handle Headers
    webpack: (config, { isServer }) => {
        if (isServer) {
            // Ensure Headers is available in the server environment
            config.resolve.fallback = {
                ...config.resolve.fallback,
                // Provide empty objects for Node.js modules used by Headers
                http: false,
                https: false,
                crypto: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig; 