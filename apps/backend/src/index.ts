import dotenv from "dotenv";
import app from "./app";
import serverless from "serverless-http";
import logger from "./logger";

// Configure environment as early as possible
dotenv.config();

// Seed database in development mode
if (require.main === module && process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      logger.info('Seeding database...');
      await import('./seed');
      logger.info('Database seeded successfully');
    } catch (err) {
      logger.error({ err }, 'Database seeding failed');
      process.exit(1);
    }
  })();
}

logger.info(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);

// Local dev: start server if run directly
if (require.main === module) {
  (async () => {
    const port = parseInt(process.env.PORT || '8080', 10);
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })();
}

// Export the Express app for Vercel serverless function
export = serverless(app);