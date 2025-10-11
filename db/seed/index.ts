import { config } from "dotenv";
import { reset } from "drizzle-seed";
import * as schema from "../schema";
import { SeedLogger } from "./utils/logger";
import {
  seedFoundationTables,
  seedVendorsAndProducts,
  seedUsersAndAuth,
  seedOrdersAndTransactions,
  seedReviewsAndRatings,
  seedFinancialData,
  seedModerationAndSupport
} from "./tables";

// Load environment variables before importing db
config({ path: ".env.local" });

import { db } from "../index";

// CLI argument helpers
function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function getFlagValue(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    const val = process.argv[idx + 1];
    if (!val.startsWith('--')) return val;
  }
  return undefined;
}

function isProbablyProdEnvironment(): boolean {
  const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  return process.env.NODE_ENV === 'production' || (!!url && !url.includes('localhost'));
}

// Database reset helper
async function resetDatabase(logger: SeedLogger) {
  try {
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Client } = await import('pg');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set for reset');
    }

    const allowSelfSigned = process.env.PGSSLMODE === 'no-verify' || process.env.NEON_LOCAL === '1';
    const client = new Client({
      connectionString: databaseUrl,
      ssl: allowSelfSigned ? { rejectUnauthorized: false } : undefined,
    });

    await client.connect();
    const pgDb = drizzle(client, { schema });
    await reset(pgDb, schema);
    await client.end();

    logger.success('Database reset complete');
  } catch (resetError: any) {
    logger.error('Failed to reset database', resetError);
    throw resetError;
  }
}

async function main() {
  // Determine log level
  const logLevel = hasFlag('--silent') ? 'silent' : hasFlag('--verbose') ? 'verbose' : 'normal';
  const logger = new SeedLogger(logLevel as any);

  // Show help if requested
  if (hasFlag('--help')) {
    console.log(`
Usage: tsx db/seed/index.ts [options]

Options:
  --no-reset                 Skip database reset
  --silent                   Suppress all non-error output
  --verbose                  Show detailed logging
  --allow-prod               Allow running in production-like environment
  --help                     Show this help

Description:
  This seed script populates the database with realistic e-commerce data
  including vendors, products, users, orders, reviews, and financial records.
  
  The script uses modular table seeders for organized, maintainable seeding.
  Each seeding phase is clearly logged with progress indicators.

Examples:
  tsx db/seed/index.ts                    # Normal seeding with default settings
  tsx db/seed/index.ts --silent           # Silent mode, only show errors
  tsx db/seed/index.ts --verbose          # Detailed logging
  tsx db/seed/index.ts --no-reset         # Skip database reset
    `);
    process.exit(0);
  }

  logger.info('Starting database seed');

  // Production safety check
  if (isProbablyProdEnvironment() && !hasFlag('--allow-prod')) {
    logger.error('Refusing to run seed in production-like environment. Use --allow-prod to override.');
    process.exit(1);
  }

  const shouldReset = !hasFlag('--no-reset');

  try {
    // Step 1: Reset database
    if (shouldReset) {
      logger.step(1, 8, 'Resetting database');
      await resetDatabase(logger);
    } else {
      logger.info('Skipping database reset (--no-reset flag detected)');
    }

    // Step 2: Foundation tables (categories, shipping, email templates)
    logger.step(2, 8, 'Seeding foundation tables');
    const foundationResult = await seedFoundationTables();
    logger.success(foundationResult.message);

    // Step 3: Vendors and products
    logger.step(3, 8, 'Seeding vendors and products');
    const vendorsResult = await seedVendorsAndProducts();
    logger.success(vendorsResult.message);

    // Step 4: Users and authentication
    logger.step(4, 8, 'Seeding users and authentication');
    const usersResult = await seedUsersAndAuth();
    logger.success(usersResult.message);

    // Step 5: Orders and transactions
    logger.step(5, 8, 'Seeding orders and transactions');
    const ordersResult = await seedOrdersAndTransactions();
    logger.success(ordersResult.message);

    // Step 6: Reviews and ratings
    logger.step(6, 8, 'Seeding reviews and ratings');
    const reviewsResult = await seedReviewsAndRatings();
    logger.success(reviewsResult.message);

    // Step 7: Financial data (fees, transactions, payouts)
    logger.step(7, 8, 'Seeding financial data');
    const financialResult = await seedFinancialData();
    logger.success(financialResult.message);

    // Step 8: Moderation and support data
    logger.step(8, 8, 'Seeding moderation and support data');
    const moderationResult = await seedModerationAndSupport();
    logger.success(moderationResult.message);

    // Display summary
    logger.summary({
      'Categories': foundationResult.data?.categories?.length || 0,
      'Vendors': vendorsResult.data?.vendors || 0,
      'Products': vendorsResult.data?.products || 0,
      'Product Variants': vendorsResult.data?.variants || 0,
      'Admin Users': usersResult.data?.admins || 0,
      'Customer Users': usersResult.data?.users || 0,
      'Newsletter Subscriptions': usersResult.data?.subscriptions || 0,
      'Orders': ordersResult.data?.orders || 0,
      'Order Items': ordersResult.data?.orderItems || 0,
      'Reviews': reviewsResult.data?.reviews || 0,
      'Platform Fees': financialResult.data?.platformFees || 0,
      'Transactions': financialResult.data?.transactions || 0,
      'Payouts': financialResult.data?.payouts || 0,
      'Moderation Records': moderationResult.data?.moderationRecords || 0,
      'Stock Reservations': moderationResult.data?.stockReservations || 0
    });

    // Display login credentials
    logger.credentials([
      { label: 'Admin', value: 'admin@luzimarket.shop / admin123' },
      { label: 'Test Vendor', value: 'vendor@luzimarket.shop / password123' },
      { label: 'Test Customer', value: 'client@luzimarket.shop / password123' }
    ]);

    logger.success('Database seed completed successfully');
  } catch (error) {
    logger.error('Seed failed', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
