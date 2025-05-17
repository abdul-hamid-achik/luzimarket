import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
  async bootstrap() {
    const envToken = process.env.STRAPI_API_TOKEN;
    if (!envToken) {
      strapi.log.warn('STRAPI_API_TOKEN environment variable is not set; skipping API token creation.');
      return;
    }

    try {
      const tokenService = strapi.plugin('api-token').service('api-token');
      const existing = await tokenService.list();
      const found = existing.results.find((t: any) => t.accessKey === envToken);
      if (!found) {
        await tokenService.create({
          name: 'Backend Access Token',
          description: 'Token for backend service to access Strapi API',
          type: 'full-access',
          accessKey: envToken,
        });
        strapi.log.info('API token created from STRAPI_API_TOKEN environment variable');
      } else {
        strapi.log.info('API token from STRAPI_API_TOKEN already exists');
      }
    } catch (err) {
      strapi.log.error('Failed to create API token from STRAPI_API_TOKEN', err);
    }
  },
});
