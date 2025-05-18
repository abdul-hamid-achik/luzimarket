import path from 'path';

export default ({ env }) => {
  // Force SQLite as the only supported client
  const client = 'sqlite';

  const connections = {
    sqlite: {
      connection: {
        filename: env(
          'DATABASE_FILENAME',
          path.join(__dirname, '..', '..', '..', 'tmp', 'ecommerce.db')
        ),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
    settings: {
      forceMigration: true,
      runMigrations: true,
      debug: true,
      useTypescriptMigrations: true
    },
  };
};
