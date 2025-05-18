// @ts-ignore: Allow importing dotenv without type declarations
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';

dotenv.config();

export const db = drizzle(process.env.DATABASE_URL!); 