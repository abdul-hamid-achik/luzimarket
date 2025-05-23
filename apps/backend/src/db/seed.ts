import { db } from './index';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/es';
import { eq } from 'drizzle-orm';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { imageService } from './services/imageService';
import { spanishProducts, spanishCategories, spanishOccasions } from './data/spanishProducts';

// Define types for the dynamically imported schema modules
type PostgresSchemaModule = typeof import('./schema.postgres');
type SqliteSchemaModule = typeof import('./schema.sqlite');

const DB_MODE = process.env.DB_MODE || 'neon';

// Predefined static values
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const petitionTypes = ['Pregunta', 'Queja', 'Sugerencia', 'Comentario', 'Problema Técnico'];
const petitionStatuses = ['pending', 'in-review', 'approved', 'rejected', 'on-hold'];

const statesData = [
    { label: 'Coahuila', value: 'coahuila' },
    { label: 'Nuevo León', value: 'nuevo-leon' },
    { label: 'Chihuahua', value: 'chihuahua' },
    { label: 'Tamaulipas', value: 'tamaulipas' },
];

const deliveryZonesData = [
    { name: 'Torreón Centro', fee: 5000 }, // $50 pesos
    { name: 'Torreón Norte', fee: 7500 }, // $75 pesos
    { name: 'Saltillo', fee: 10000 }, // $100 pesos
    { name: 'Monterrey', fee: 15000 }, // $150 pesos
    { name: 'Comarca Lagunera', fee: 8000 }, // $80 pesos
];

async function seed(currentDb: NeonDatabase | BetterSQLite3Database, currentSchema: PostgresSchemaModule | SqliteSchemaModule): Promise<void> {
    try {
        const seedId = Math.floor(Math.random() * 1000000);
        faker.seed(seedId);
        console.log('🌱 Iniciando siembra de datos en español con imágenes...');

        if (DB_MODE === 'offline') {
            // SQLite Database
            const dbInstance = currentDb as BetterSQLite3Database;
            const schemaInstance = currentSchema as SqliteSchemaModule;

            // Seed sizes
            try {
                for (const size of sizes) {
                    await dbInstance.insert(schemaInstance.sizes).values({ size }).onConflictDoNothing();
                }
                console.log('✅ Tallas sembradas exitosamente (SQLite)');
            } catch (err) { console.log('❌ Error sembrando tallas (SQLite):', err); }

            // Seed states
            try {
                for (const state of statesData) {
                    await dbInstance.insert(schemaInstance.states).values(state).onConflictDoNothing();
                }
                console.log('✅ Estados sembrados exitosamente (SQLite)');
            } catch (err) { console.log('❌ Error sembrando estados (SQLite):', err); }

            // Seed delivery zones
            try {
                for (const zone of deliveryZonesData) {
                    await dbInstance.insert(schemaInstance.deliveryZones).values(zone).onConflictDoNothing();
                }
                console.log('✅ Zonas de entrega sembradas exitosamente (SQLite)');
            } catch (err) { console.log('❌ Error sembrando zonas de entrega (SQLite):', err); }

            // Seed Spanish categories
            try {
                for (const category of spanishCategories) {
                    await dbInstance.insert(schemaInstance.categories).values(category).onConflictDoNothing();
                }
                console.log('✅ Categorías en español sembradas exitosamente (SQLite)');
            } catch (err) { console.log('❌ Error sembrando categorías (SQLite):', err); }

            // Seed Spanish occasions
            try {
                for (const occasion of spanishOccasions) {
                    await dbInstance.insert(schemaInstance.occasions).values(occasion).onConflictDoNothing();
                }
                console.log('✅ Ocasiones en español sembradas exitosamente (SQLite)');
            } catch (err) { console.log('❌ Error sembrando ocasiones (SQLite):', err); }

            // Seed Spanish products with images
            try {
                const categoriesResult = await dbInstance.select().from(schemaInstance.categories);
                const categoryMap = new Map(categoriesResult.map(cat => [cat.slug, cat.id]));

                console.log('📸 Iniciando carga de productos con imágenes...');

                for (let i = 0; i < spanishProducts.length; i++) {
                    const product = spanishProducts[i];
                    const categoryId = categoryMap.get(product.categorySlug);

                    if (categoryId) {
                        console.log(`📦 Procesando producto ${i + 1}/${spanishProducts.length}: ${product.name}`);

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
                                attributes: JSON.stringify({
                                    size: 'Estándar',
                                    color: 'Natural',
                                    material: 'Premium'
                                }),
                                stock: faker.number.int({ min: 5, max: 50 })
                            }).onConflictDoNothing();

                            // Check if product already has images in the database
                            const hasExistingImages = await imageService.checkExistingImages(
                                dbInstance,
                                schemaInstance,
                                productId
                            );

                            if (hasExistingImages) {
                                console.log(`♻️  Producto ${product.name} ya tiene imágenes, saltando...`);
                                continue;
                            }

                            // Upload images for the product
                            try {
                                console.log(`🖼️  Cargando imágenes para: ${product.name}`);
                                const imageResult = await imageService.getImageForProduct(
                                    product.categorySlug,
                                    productId,
                                    product.name
                                );

                                if (imageResult.success) {
                                    await dbInstance.insert(schemaInstance.photos).values({
                                        url: imageResult.url,
                                        alt: imageResult.alt,
                                        sortOrder: 0,
                                        productId
                                    }).onConflictDoNothing();

                                    if (imageResult.isExisting) {
                                        console.log(`♻️  Imagen existente reutilizada para: ${product.name}`);
                                    } else {
                                        console.log(`✅ Nueva imagen cargada exitosamente para: ${product.name}`);
                                    }
                                } else {
                                    console.log(`⚠️  Imagen con fallback para: ${product.name} - ${imageResult.error}`);
                                    // Still save the image even if upload failed
                                    await dbInstance.insert(schemaInstance.photos).values({
                                        url: imageResult.url,
                                        alt: imageResult.alt,
                                        sortOrder: 0,
                                        productId
                                    }).onConflictDoNothing();
                                }
                            } catch (imageError) {
                                console.log(`❌ Error cargando imagen para ${product.name}:`, imageError);
                            }
                        }
                    }
                }
                console.log('✅ Productos en español con imágenes sembrados exitosamente (SQLite)');
            } catch (err) { console.log('❌ Error sembrando productos (SQLite):', err); }

            // Seed admin user
            try {
                await dbInstance.insert(schemaInstance.users).values({
                    email: 'admin@luzimarket.com',
                    password: bcrypt.hashSync('LuziAdmin2024!', 10),
                    name: 'Administrador Luzi',
                    role: 'admin'
                }).onConflictDoNothing();
                console.log('✅ Usuario administrador sembrado exitosamente (SQLite)');
            } catch (err) { console.log('❌ Error sembrando usuario administrador (SQLite):', err); }

            // Seed example orders
            try {
                const adminResult = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.email, 'admin@luzimarket.com')).limit(1);
                const admin = adminResult[0];
                if (admin) {
                    for (const status of orderStatuses) {
                        await dbInstance.insert(schemaInstance.orders).values({
                            userId: admin.id,
                            total: faker.number.int({ min: 25000, max: 150000 }), // $250 - $1,500 pesos
                            status,
                            createdAt: faker.date.recent()
                        }).onConflictDoNothing();
                    }
                    console.log('✅ Órdenes de ejemplo sembradas exitosamente (SQLite)');
                }
            } catch (err) { console.log('❌ Error sembrando órdenes de ejemplo (SQLite):', err); }

            // Seed example petitions
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
                console.log('✅ Peticiones de ejemplo sembradas exitosamente (SQLite)');
            } catch (err) { console.log('❌ Error sembrando peticiones de ejemplo (SQLite):', err); }

        } else {
            // PostgreSQL Database
            const dbInstance = currentDb as NeonDatabase;
            const schemaInstance = currentSchema as PostgresSchemaModule;

            // Seed sizes
            try {
                for (const size of sizes) {
                    await dbInstance.insert(schemaInstance.sizes).values({ size }).onConflictDoNothing();
                }
                console.log('✅ Tallas sembradas exitosamente (PostgreSQL)');
            } catch (err) { console.log('❌ Error sembrando tallas (PostgreSQL):', err); }

            // Seed states
            try {
                for (const state of statesData) {
                    await dbInstance.insert(schemaInstance.states).values(state).onConflictDoNothing();
                }
                console.log('✅ Estados sembrados exitosamente (PostgreSQL)');
            } catch (err) { console.log('❌ Error sembrando estados (PostgreSQL):', err); }

            // Seed delivery zones
            try {
                for (const zone of deliveryZonesData) {
                    await dbInstance.insert(schemaInstance.deliveryZones).values(zone).onConflictDoNothing();
                }
                console.log('✅ Zonas de entrega sembradas exitosamente (PostgreSQL)');
            } catch (err) { console.log('❌ Error sembrando zonas de entrega (PostgreSQL):', err); }

            // Seed Spanish categories
            try {
                for (const category of spanishCategories) {
                    await dbInstance.insert(schemaInstance.categories).values(category).onConflictDoNothing();
                }
                console.log('✅ Categorías en español sembradas exitosamente (PostgreSQL)');
            } catch (err) { console.log('❌ Error sembrando categorías (PostgreSQL):', err); }

            // Seed Spanish occasions
            try {
                for (const occasion of spanishOccasions) {
                    await dbInstance.insert(schemaInstance.occasions).values(occasion).onConflictDoNothing();
                }
                console.log('✅ Ocasiones en español sembradas exitosamente (PostgreSQL)');
            } catch (err) { console.log('❌ Error sembrando ocasiones (PostgreSQL):', err); }

            // Seed Spanish products with images
            try {
                const categoriesResult = await dbInstance.select().from(schemaInstance.categories);
                const categoryMap = new Map(categoriesResult.map(cat => [cat.slug, cat.id]));

                console.log('📸 Iniciando carga de productos con imágenes...');

                for (let i = 0; i < spanishProducts.length; i++) {
                    const product = spanishProducts[i];
                    const categoryId = categoryMap.get(product.categorySlug);

                    if (categoryId) {
                        console.log(`📦 Procesando producto ${i + 1}/${spanishProducts.length}: ${product.name}`);

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
                                attributes: {
                                    size: 'Estándar',
                                    color: 'Natural',
                                    material: 'Premium'
                                }, // JSON for PostgreSQL
                                stock: faker.number.int({ min: 5, max: 50 })
                            }).onConflictDoNothing();

                            // Check if product already has images in the database
                            const hasExistingImages = await imageService.checkExistingImages(
                                dbInstance,
                                schemaInstance,
                                productId
                            );

                            if (hasExistingImages) {
                                console.log(`♻️  Producto ${product.name} ya tiene imágenes, saltando...`);
                                continue;
                            }

                            // Upload images for the product
                            try {
                                console.log(`🖼️  Cargando imágenes para: ${product.name}`);
                                const imageResult = await imageService.getImageForProduct(
                                    product.categorySlug,
                                    productId,
                                    product.name
                                );

                                if (imageResult.success) {
                                    await dbInstance.insert(schemaInstance.photos).values({
                                        url: imageResult.url,
                                        alt: imageResult.alt,
                                        sortOrder: 0,
                                        productId
                                    }).onConflictDoNothing();

                                    if (imageResult.isExisting) {
                                        console.log(`♻️  Imagen existente reutilizada para: ${product.name}`);
                                    } else {
                                        console.log(`✅ Nueva imagen cargada exitosamente para: ${product.name}`);
                                    }
                                } else {
                                    console.log(`⚠️  Imagen con fallback para: ${product.name} - ${imageResult.error}`);
                                    // Still save the image even if upload failed
                                    await dbInstance.insert(schemaInstance.photos).values({
                                        url: imageResult.url,
                                        alt: imageResult.alt,
                                        sortOrder: 0,
                                        productId
                                    }).onConflictDoNothing();
                                }
                            } catch (imageError) {
                                console.log(`❌ Error cargando imagen para ${product.name}:`, imageError);
                            }
                        }
                    }
                }
                console.log('✅ Productos en español con imágenes sembrados exitosamente (PostgreSQL)');
            } catch (err) { console.log('❌ Error sembrando productos (PostgreSQL):', err); }

            // Seed admin user
            try {
                await dbInstance.insert(schemaInstance.users).values({
                    email: 'admin@luzimarket.com',
                    password: bcrypt.hashSync('LuziAdmin2024!', 10),
                    name: 'Administrador Luzi',
                    role: 'admin'
                }).onConflictDoNothing();
                console.log('✅ Usuario administrador sembrado exitosamente (PostgreSQL)');
            } catch (err) { console.log('❌ Error sembrando usuario administrador (PostgreSQL):', err); }

            // Seed example orders
            try {
                const adminResult = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.email, 'admin@luzimarket.com')).limit(1);
                const admin = adminResult[0];
                if (admin) {
                    for (const status of orderStatuses) {
                        await dbInstance.insert(schemaInstance.orders).values({
                            userId: admin.id,
                            total: faker.number.int({ min: 25000, max: 150000 }), // $250 - $1,500 pesos
                            status,
                            createdAt: faker.date.recent()
                        }).onConflictDoNothing();
                    }
                    console.log('✅ Órdenes de ejemplo sembradas exitosamente (PostgreSQL)');
                }
            } catch (err) { console.log('❌ Error sembrando órdenes de ejemplo (PostgreSQL):', err); }

            // Seed example petitions
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
                console.log('✅ Peticiones de ejemplo sembradas exitosamente (PostgreSQL)');
            } catch (err) { console.log('❌ Error sembrando peticiones de ejemplo (PostgreSQL):', err); }
        }

        console.log('🎉 ¡Datos en español con imágenes sembrados exitosamente!');
        console.log('📊 Resumen:');
        console.log(`   • ${spanishCategories.length} categorías en español`);
        console.log(`   • ${spanishProducts.length} productos con descripciones detalladas`);
        console.log(`   • ${spanishOccasions.length} ocasiones especiales`);
        console.log(`   • ${statesData.length} estados mexicanos`);
        console.log(`   • ${deliveryZonesData.length} zonas de entrega`);
        console.log('   • Imágenes realistas cargadas a Vercel Blob');
        console.log('   • Precios en pesos mexicanos');
        console.log('   • Usuario admin: admin@luzimarket.com / LuziAdmin2024!');

    } catch (err) {
        console.error('💥 Error sembrando base de datos:', err instanceof Error ? err.stack : err);
        process.exit(1);
    }
}

async function loadSchemaAndRunSeed() {
    try {
        if (DB_MODE === 'offline') {
            console.log('🗄️  Cargando esquema SQLite...');
            const sqliteSchema = await import('./schema.sqlite');
            const sqliteDb = db as BetterSQLite3Database;
            await seed(sqliteDb, sqliteSchema);
        } else {
            console.log('🗄️  Cargando esquema PostgreSQL...');
            const postgresSchema = await import('./schema.postgres');
            const neonDb = db as NeonDatabase;
            await seed(neonDb, postgresSchema);
        }
    } catch (error) {
        console.error('💥 Error cargando esquema o sembrando:', error);
        process.exit(1);
    }
}

loadSchemaAndRunSeed().catch((err) => {
    console.error('💥 Error durante la carga del esquema o siembra:', err.stack || err);
    process.exit(1);
}); 