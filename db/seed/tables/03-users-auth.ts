import { db } from "@/db";
import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { customerSegments } from "../utils/realistic-patterns";
import { SeedLogger } from "../utils/logger";

const logger = new SeedLogger();

faker.seed(12345);

/**
 * Seeds users, admin users, and authentication-related tables
 */
export async function seedUsersAndAuth(database = db, options?: any) {
  logger.info("Creating users and authentication data", true);

  // 1. Create Admin Users
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const adminUsersData = [
    {
      email: "admin@luzimarket.shop",
      name: "Administrador Principal",
      passwordHash: hashedAdminPassword,
      role: "super_admin" as const,
      isActive: true
    },
    {
      email: "support@luzimarket.shop",
      name: "Soporte Técnico",
      passwordHash: hashedAdminPassword,
      role: "admin" as const,
      isActive: true
    },
    {
      email: "manager@luzimarket.shop",
      name: "Gerente de Ventas",
      passwordHash: hashedAdminPassword,
      role: "admin" as const,
      isActive: true
    },
    {
      email: "content@luzimarket.shop",
      name: "Moderador de Contenido",
      passwordHash: hashedAdminPassword,
      role: "admin" as const,
      isActive: true
    },
    {
      email: "finance@luzimarket.shop",
      name: "Administrador Financiero",
      passwordHash: hashedAdminPassword,
      role: "admin" as const,
      isActive: true
    }
  ];

  await database
    .insert(schema.adminUsers)
    .values(adminUsersData)
    .onConflictDoUpdate({
      target: schema.adminUsers.email,
      set: {
        name: sql`excluded.name`,
        passwordHash: sql`excluded.password_hash`,
        role: sql`excluded.role`,
        isActive: sql`excluded.is_active`,
      },
    });

  // 2. Create Customer Users with segments
  const userPassword = await bcrypt.hash("password123", 10);
  const totalUsers = 200;
  const segments = customerSegments(totalUsers);
  const userData = [];

  // Test users
  userData.push(
    {
      email: "client@luzimarket.shop",
      name: "Test Customer",
      passwordHash: userPassword,
      stripeCustomerId: `cus_client_main`,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    },
    {
      email: "client_2@luzimarket.shop",
      name: "Test Customer 2",
      passwordHash: userPassword,
      stripeCustomerId: `cus_client_alt`,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  );

  // VIP customers (5%)
  for (let i = 0; i < segments.vip; i++) {
    userData.push({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      passwordHash: userPassword,
      stripeCustomerId: `cus_vip_${faker.string.alphanumeric(14)}`,
      isActive: true,
      emailVerified: true,
      emailVerifiedAt: faker.date.past()
    });
  }

  // Loyal customers (15%)
  for (let i = 0; i < segments.loyal; i++) {
    userData.push({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      passwordHash: userPassword,
      stripeCustomerId: `cus_loyal_${faker.string.alphanumeric(14)}`,
      isActive: true,
      emailVerified: faker.datatype.boolean({ probability: 0.9 }),
      emailVerifiedAt: faker.datatype.boolean({ probability: 0.9 }) ? faker.date.past() : null
    });
  }

  // Regular customers (30%)
  for (let i = 0; i < segments.regular; i++) {
    userData.push({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      passwordHash: userPassword,
      stripeCustomerId: `cus_reg_${faker.string.alphanumeric(14)}`,
      isActive: faker.datatype.boolean({ probability: 0.95 }),
      emailVerified: faker.datatype.boolean({ probability: 0.7 }),
      emailVerifiedAt: faker.datatype.boolean({ probability: 0.7 }) ? faker.date.past() : null
    });
  }

  // Occasional customers (50%)
  for (let i = 0; i < segments.occasional - 2; i++) { // -2 for test users
    userData.push({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      passwordHash: userPassword,
      stripeCustomerId: faker.datatype.boolean({ probability: 0.5 })
        ? `cus_occ_${faker.string.alphanumeric(14)}`
        : null,
      isActive: faker.datatype.boolean({ probability: 0.9 }),
      emailVerified: faker.datatype.boolean({ probability: 0.5 }),
      emailVerifiedAt: faker.datatype.boolean({ probability: 0.5 }) ? faker.date.past() : null
    });
  }

  await database
    .insert(schema.users)
    .values(userData)
    .onConflictDoNothing({ target: schema.users.email });

  const users = await database.select().from(schema.users);

  // 3. Create Newsletter Subscriptions
  const subscriptionData = [];

  // All VIP and loyal users are subscribed
  const vipAndLoyalUsers = users.slice(0, segments.vip + segments.loyal + 2); // +2 for test users
  for (const user of vipAndLoyalUsers) {
    subscriptionData.push({
      email: user.email,
      isActive: true
    });
  }

  // Some regular users are subscribed
  const regularUsers = users.slice(
    segments.vip + segments.loyal + 2,
    segments.vip + segments.loyal + segments.regular + 2
  );
  for (const user of faker.helpers.arrayElements(regularUsers, Math.floor(regularUsers.length * 0.5))) {
    subscriptionData.push({
      email: user.email,
      isActive: faker.datatype.boolean({ probability: 0.9 })
    });
  }

  // Additional non-user subscribers
  for (let i = 0; i < 300; i++) {
    subscriptionData.push({
      email: faker.internet.email(),
      isActive: faker.datatype.boolean({ probability: 0.85 })
    });
  }

  await database
    .insert(schema.subscriptions)
    .values(subscriptionData)
    .onConflictDoNothing({ target: schema.subscriptions.email });

  // 4. Create some user sessions for active users
  const activeUsers = users.filter(u => u.isActive).slice(0, 30);
  const sessionData = [];

  for (const user of activeUsers) {
    sessionData.push({
      userId: user.id,
      userType: 'user' as const,
      sessionToken: `sess_${faker.string.alphanumeric(32)}`,
      ipAddress: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
      browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
      location: faker.helpers.arrayElement(['Ciudad de México', 'Guadalajara', 'Monterrey']),
      lastActive: faker.date.recent(),
      expiresAt: faker.date.future(),
      createdAt: faker.date.recent()
    });
  }

  if (sessionData.length > 0) {
    await database
      .insert(schema.userSessions)
      .values(sessionData)
      .onConflictDoNothing({ target: schema.userSessions.sessionToken });
  }

  return {
    success: true,
    message: `Created ${adminUsersData.length} admins, ${users.length} users, ${subscriptionData.length} subscriptions`,
    data: {
      admins: adminUsersData.length,
      users: users.length,
      subscriptions: subscriptionData.length,
      sessions: sessionData.length,
      segments: {
        vip: segments.vip,
        loyal: segments.loyal,
        regular: segments.regular,
        occasional: segments.occasional
      }
    }
  };
}