import { db } from './index';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/es';
import { eq } from 'drizzle-orm';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Define types for the dynamically imported schema modules
type PostgresSchemaModule = typeof import('./schema.postgres');
type SqliteSchemaModule = typeof import('./schema.sqlite');

const DB_MODE = process.env.DB_MODE || 'neon';

// Predefined static values - restored full arrays
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const petitionTypes = ['Question', 'Complaint', 'Suggestion', 'Feedback', 'Technical Issue'];
const petitionStatuses = ['pending', 'in-review', 'approved', 'rejected', 'on-hold'];

const statesData = [
    { label: 'Coahuila', value: 'coahuila' },
    { label: 'Nuevo Leon', value: 'nuevo-leon' },
];

const deliveryZonesData = [
    { name: 'Torreon', fee: 50 },
    { name: 'Saltillo', fee: 75 },
    { name: 'Monterrey', fee: 100 },
];

const giftCategories = [
    { name: 'Floral Arrangements', slug: 'floral-arrangements' },
    { name: 'Gift Baskets', slug: 'gift-baskets' },
    { name: 'Gourmet Treats', slug: 'gourmet-treats' },
    { name: 'Home Decor Gifts', slug: 'home-decor-gifts' },
    { name: 'Personalized Gifts', slug: 'personalized-gifts' },
    { name: 'Aromatherapy & Wellness', slug: 'aromatherapy-wellness' },
    { name: 'Seasonal Specials', slug: 'seasonal-specials' },
    { name: 'Luxury Gifts', slug: 'luxury-gifts' },
    { name: 'Handcrafted Items', slug: 'handcrafted-items' },
    { name: 'Eco-Friendly Gifts', slug: 'eco-friendly-gifts' }
];

const occasions = [
    { name: 'Cumpleaños', description: 'Celebrate another year of life with our special birthday collection' },
    { name: 'Aniversario', description: 'Commemorate years of love and commitment with our anniversary selections' },
    { name: 'Graduación', description: 'Honor academic achievements with our curated graduation gifts' },
    { name: 'Navidad', description: 'Spread holiday cheer with our festive Christmas collection' },
    { name: 'Día de la Madre', description: "Show appreciation to mothers with our thoughtful Mother's Day gifts" },
    { name: 'Día del Padre', description: "Celebrate fathers with our specially selected Father's Day items" },
    { name: 'San Valentín', description: "Express your love with our romantic Valentine's Day collection" },
    { name: 'Boda', description: 'Celebrate new beginnings with our elegant wedding gift selection' },
    { name: 'Bautizo', description: 'Mark a special christening with our carefully chosen baptism gifts' },
    { name: 'Baby Shower', description: 'Welcome new arrivals with our adorable baby shower presents' },
    { name: 'Inauguración', description: 'Celebrate new homes and businesses with our housewarming gifts' },
    { name: 'Jubilación', description: 'Honor career achievements with our thoughtful retirement presents' }
];

// Sample products data
const sampleProducts = [
    { name: 'Ramo de Rosas Rojas', description: 'Hermoso ramo de 12 rosas rojas frescas', price: 45000, categorySlug: 'floral-arrangements' },
    { name: 'Canasta de Frutas Premium', description: 'Selección de frutas frescas y gourmet', price: 65000, categorySlug: 'gift-baskets' },
    { name: 'Chocolates Artesanales', description: 'Caja de chocolates hechos a mano', price: 35000, categorySlug: 'gourmet-treats' },
    { name: 'Vela Aromática Lavanda', description: 'Vela de cera natural con aroma a lavanda', price: 25000, categorySlug: 'aromatherapy-wellness' },
    { name: 'Marco de Fotos Personalizado', description: 'Marco elegante con grabado personalizado', price: 40000, categorySlug: 'personalized-gifts' },
    { name: 'Arreglo Floral Primavera', description: 'Colorido arreglo con flores de temporada', price: 55000, categorySlug: 'floral-arrangements' },
    { name: 'Cesta de Vinos y Quesos', description: 'Selección de vinos y quesos gourmet', price: 85000, categorySlug: 'gourmet-treats' },
    { name: 'Difusor de Aceites Esenciales', description: 'Difusor ultrasónico con aceites incluidos', price: 60000, categorySlug: 'aromatherapy-wellness' },
    { name: 'Jarrón de Cerámica Artesanal', description: 'Jarrón único hecho por artesanos locales', price: 70000, categorySlug: 'handcrafted-items' },
    { name: 'Set de Té Orgánico', description: 'Colección de tés orgánicos premium', price: 45000, categorySlug: 'eco-friendly-gifts' }
];

// No overloads needed here, we will use type guards inside the function.
async function seed(currentDb: NeonDatabase | BetterSQLite3Database, currentSchema: PostgresSchemaModule | SqliteSchemaModule): Promise<void> {
    try {
        const seedId = Math.floor(Math.random() * 1000000);
        faker.seed(seedId);
        console.log('Starting basic seeding without reset...');

        if (DB_MODE === 'offline') {
            // currentDb is BetterSQLite3Database, currentSchema is SqliteSchemaModule
            const dbInstance = currentDb as BetterSQLite3Database;
            const schemaInstance = currentSchema as SqliteSchemaModule;

            try {
                for (const size of sizes) {
                    await dbInstance.insert(schemaInstance.sizes).values({ size }).onConflictDoNothing();
                }
                console.log('Sizes seeded successfully (SQLite)');
            } catch (err) { console.log('Error seeding sizes (SQLite):', err); }

            try {
                for (const state of statesData) {
                    await dbInstance.insert(schemaInstance.states).values(state).onConflictDoNothing();
                }
                console.log('States seeded successfully (SQLite)');
            } catch (err) { console.log('Error seeding states (SQLite):', err); }

            try {
                for (const zone of deliveryZonesData) {
                    await dbInstance.insert(schemaInstance.deliveryZones).values(zone).onConflictDoNothing();
                }
                console.log('Delivery zones seeded successfully (SQLite)');
            } catch (err) { console.log('Error seeding delivery zones (SQLite):', err); }

            try {
                for (const category of giftCategories) {
                    await dbInstance.insert(schemaInstance.categories).values({ ...category, description: faker.commerce.productDescription() }).onConflictDoNothing();
                }
                console.log('Categories seeded successfully (SQLite)');
            } catch (err) { console.log('Error seeding categories (SQLite):', err); }

            // Seed products after categories
            try {
                // Get categories to link products
                const categoriesResult = await dbInstance.select().from(schemaInstance.categories);
                const categoryMap = new Map(categoriesResult.map(cat => [cat.slug, cat.id]));

                for (const product of sampleProducts) {
                    const categoryId = categoryMap.get(product.categorySlug);
                    if (categoryId) {
                        const productData = {
                            slug: faker.helpers.slugify(product.name.toLowerCase()),
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            categoryId
                        };

                        const insertedProduct = await dbInstance.insert(schemaInstance.products)
                            .values(productData)
                            .returning({ id: schemaInstance.products.id })
                            .onConflictDoNothing();

                        if (insertedProduct.length > 0) {
                            const productId = insertedProduct[0].id;

                            // Create a default variant for each product
                            await dbInstance.insert(schemaInstance.productVariants).values({
                                productId,
                                sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
                                attributes: JSON.stringify({ size: 'Standard', color: 'Default' }),
                                stock: faker.number.int({ min: 5, max: 50 })
                            }).onConflictDoNothing();
                        }
                    }
                }
                console.log('Products and variants seeded successfully (SQLite)');
            } catch (err) { console.log('Error seeding products (SQLite):', err); }

            try {
                for (const occasion of occasions) {
                    await dbInstance.insert(schemaInstance.occasions).values({ ...occasion, slug: faker.helpers.slugify(occasion.name.toLowerCase()) }).onConflictDoNothing();
                }
                console.log('Occasions seeded successfully (SQLite)');
            } catch (err) { console.log('Error seeding occasions (SQLite):', err); }

            try {
                await dbInstance.insert(schemaInstance.users).values({
                    email: 'admin@example.com',
                    password: bcrypt.hashSync('Password123!', 10),
                    name: 'Admin User',
                    role: 'admin'
                }).onConflictDoNothing();
                console.log('Admin user seeded successfully (SQLite)');
            } catch (err) { console.log('Error seeding admin user (SQLite):', err); }

            try {
                const adminResult = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.email, 'admin@example.com')).limit(1);
                const admin = adminResult[0];
                if (admin) {
                    for (const status of orderStatuses) {
                        await dbInstance.insert(schemaInstance.orders).values({
                            userId: admin.id,
                            total: faker.number.int({ min: 1000, max: 50000 }),
                            status,
                            createdAt: faker.date.recent()
                        }).onConflictDoNothing();
                    }
                    console.log('Example orders seeded successfully (SQLite)');
                }
            } catch (err) { console.log('Error seeding example orders (SQLite):', err); }

            try {
                for (const type of petitionTypes) {
                    for (const status of petitionStatuses) {
                        await dbInstance.insert(schemaInstance.petitions).values({
                            type,
                            title: `${type} - ${faker.lorem.sentence(4)}`,
                            description: faker.lorem.paragraphs(2),
                            status,
                            createdAt: faker.date.recent()
                        }).onConflictDoNothing();
                    }
                }
                console.log('Example petitions seeded successfully (SQLite)');
            } catch (err) { console.log('Error seeding example petitions (SQLite):', err); }

        } else {
            // currentDb is NeonDatabase, currentSchema is PostgresSchemaModule
            const dbInstance = currentDb as NeonDatabase;
            const schemaInstance = currentSchema as PostgresSchemaModule;

            try {
                for (const size of sizes) {
                    await dbInstance.insert(schemaInstance.sizes).values({ size }).onConflictDoNothing();
                }
                console.log('Sizes seeded successfully (PostgreSQL)');
            } catch (err) { console.log('Error seeding sizes (PostgreSQL):', err); }

            try {
                for (const state of statesData) {
                    await dbInstance.insert(schemaInstance.states).values(state).onConflictDoNothing();
                }
                console.log('States seeded successfully (PostgreSQL)');
            } catch (err) { console.log('Error seeding states (PostgreSQL):', err); }

            try {
                for (const zone of deliveryZonesData) {
                    await dbInstance.insert(schemaInstance.deliveryZones).values(zone).onConflictDoNothing();
                }
                console.log('Delivery zones seeded successfully (PostgreSQL)');
            } catch (err) { console.log('Error seeding delivery zones (PostgreSQL):', err); }

            try {
                for (const category of giftCategories) {
                    await dbInstance.insert(schemaInstance.categories).values({ ...category, description: faker.commerce.productDescription() }).onConflictDoNothing();
                }
                console.log('Categories seeded successfully (PostgreSQL)');
            } catch (err) { console.log('Error seeding categories (PostgreSQL):', err); }

            // Seed products after categories
            try {
                // Get categories to link products
                const categoriesResult = await dbInstance.select().from(schemaInstance.categories);
                const categoryMap = new Map(categoriesResult.map(cat => [cat.slug, cat.id]));

                for (const product of sampleProducts) {
                    const categoryId = categoryMap.get(product.categorySlug);
                    if (categoryId) {
                        const productData = {
                            slug: faker.helpers.slugify(product.name.toLowerCase()),
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            categoryId
                        };

                        const insertedProduct = await dbInstance.insert(schemaInstance.products)
                            .values(productData)
                            .returning({ id: schemaInstance.products.id })
                            .onConflictDoNothing();

                        if (insertedProduct.length > 0) {
                            const productId = insertedProduct[0].id;

                            // Create a default variant for each product
                            await dbInstance.insert(schemaInstance.productVariants).values({
                                productId,
                                sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
                                attributes: { size: 'Standard', color: 'Default' }, // JSON for PostgreSQL
                                stock: faker.number.int({ min: 5, max: 50 })
                            }).onConflictDoNothing();
                        }
                    }
                }
                console.log('Products and variants seeded successfully (PostgreSQL)');
            } catch (err) { console.log('Error seeding products (PostgreSQL):', err); }

            try {
                for (const occasion of occasions) {
                    await dbInstance.insert(schemaInstance.occasions).values({ ...occasion, slug: faker.helpers.slugify(occasion.name.toLowerCase()) }).onConflictDoNothing();
                }
                console.log('Occasions seeded successfully (PostgreSQL)');
            } catch (err) { console.log('Error seeding occasions (PostgreSQL):', err); }

            try {
                await dbInstance.insert(schemaInstance.users).values({
                    email: 'admin@example.com',
                    password: bcrypt.hashSync('Password123!', 10),
                    name: 'Admin User',
                    role: 'admin'
                }).onConflictDoNothing();
                console.log('Admin user seeded successfully (PostgreSQL)');
            } catch (err) { console.log('Error seeding admin user (PostgreSQL):', err); }

            try {
                const adminResult = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.email, 'admin@example.com')).limit(1);
                const admin = adminResult[0];
                if (admin) {
                    for (const status of orderStatuses) {
                        await dbInstance.insert(schemaInstance.orders).values({
                            userId: admin.id,
                            total: faker.number.int({ min: 1000, max: 50000 }),
                            status,
                            createdAt: faker.date.recent()
                        }).onConflictDoNothing();
                    }
                    console.log('Example orders seeded successfully (PostgreSQL)');
                }
            } catch (err) { console.log('Error seeding example orders (PostgreSQL):', err); }

            try {
                for (const type of petitionTypes) {
                    for (const status of petitionStatuses) {
                        await dbInstance.insert(schemaInstance.petitions).values({
                            type,
                            title: `${type} - ${faker.lorem.sentence(4)}`,
                            description: faker.lorem.paragraphs(2),
                            status,
                            createdAt: faker.date.recent()
                        }).onConflictDoNothing();
                    }
                }
                console.log('Example petitions seeded successfully (PostgreSQL)');
            } catch (err) { console.log('Error seeding example petitions (PostgreSQL):', err); }
        }

        console.log('Basic seed data created successfully!');
    } catch (err) {
        console.error('Error seeding database:', err instanceof Error ? err.stack : err);
        process.exit(1);
    }
}

async function loadSchemaAndRunSeed() {
    try {
        if (DB_MODE === 'offline') {
            console.log('Seed script: Loading SQLite schema.');
            const sqliteSchema = await import('./schema.sqlite');
            const sqliteDb = db as BetterSQLite3Database;
            await seed(sqliteDb, sqliteSchema);
        } else {
            console.log('Seed script: Loading PostgreSQL schema.');
            const postgresSchema = await import('./schema.postgres');
            const neonDb = db as NeonDatabase;
            await seed(neonDb, postgresSchema);
        }
    } catch (error) {
        console.error('Failed to load schema or run seed:', error);
        process.exit(1);
    }
}

loadSchemaAndRunSeed().catch((err) => {
    console.error('Error during schema loading or seeding database:', err.stack || err);
    process.exit(1);
}); 