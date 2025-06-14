import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { db } from './index';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker/locale/es';
import { eq, sql } from 'drizzle-orm';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { imageService } from './services/imageService';
import { spanishProducts, spanishCategories, spanishOccasions } from './data/spanishProducts';
import { additionalSpanishProducts } from './data/additionalProducts';

// Define types for the schema module
type PostgresSchemaModule = typeof import('./schema.postgres');

// Predefined static values
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
// const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const petitionTypes = ['Pregunta', 'Queja', 'Sugerencia', 'Comentario', 'Problema Técnico'];
const petitionStatuses = ['pending', 'in-review', 'approved', 'rejected', 'on-hold'];

const statesData = [
    { label: 'Coahuila', value: 'coahuila' },
    { label: 'Chihuahua', value: 'chihuahua' },
    { label: 'Durango', value: 'durango' },
    { label: 'Nuevo León', value: 'nuevo-leon' },
    { label: 'Ciudad de México', value: 'cdmx' },
];

const deliveryZonesData = [
    { name: 'Torreón', fee: 5000, isActive: true, description: 'Entrega en Torreón, Coahuila - $50 pesos' }, // $50 pesos - Coahuila
    { name: 'Saltillo', fee: 7500, isActive: true, description: 'Entrega en Saltillo, Coahuila - $75 pesos' }, // $75 pesos - Coahuila
    { name: 'Monterrey', fee: 12000, isActive: true, description: 'Entrega en Monterrey, Nuevo León - $120 pesos' }, // $120 pesos - Nuevo León
    { name: 'Chihuahua', fee: 14000, isActive: true, description: 'Entrega en Chihuahua, Chihuahua - $140 pesos' }, // $140 pesos - Chihuahua
    { name: 'Ciudad Juárez', fee: 15000, isActive: true, description: 'Entrega en Ciudad Juárez, Chihuahua - $150 pesos' }, // $150 pesos - Chihuahua
    { name: 'Gómez Palacio', fee: 6000, isActive: true, description: 'Entrega en Gómez Palacio, Durango - $60 pesos' }, // $60 pesos - Durango
    { name: 'Lerdo', fee: 6500, isActive: true, description: 'Entrega en Lerdo, Durango - $65 pesos' }, // $65 pesos - Durango
    { name: 'CDMX', fee: 18000, isActive: true, description: 'Entrega en Ciudad de México - $180 pesos' }, // $180 pesos - CDMX
];

// Homepage slides data will be created dynamically using enhanced image service
const homepageSlidesTemplates = [
    {
        title: 'Bienvenido a LUZI MARKET',
        subtitle: 'Experiencia de Lujo',
        description: 'Descubre una experiencia de compra única con productos cuidadosamente seleccionados para ti.',
        buttonText: 'Explorar Ahora',
        buttonLink: '/handpicked/productos',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        position: 'center' as const,
        isActive: true,
        sortOrder: 3
    },
    {
        title: 'Colección Premium 2025',
        subtitle: 'Los Mejores Productos',
        description: 'Explora nuestra selección exclusiva de productos de la más alta calidad.',
        buttonText: 'Ver Colección',
        buttonLink: '/handpicked/productos',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        position: 'left' as const,
        isActive: true,
        sortOrder: 2
    },
    {
        title: 'Regalos Especiales',
        subtitle: 'Para Momentos Únicos',
        description: 'Encuentra el regalo perfecto para esas ocasiones especiales que nunca se olvidan.',
        buttonText: 'Buscar Regalos',
        buttonLink: '/handpicked/productos',
        backgroundColor: '#2d3748',
        textColor: '#ffffff',
        position: 'right' as const,
        isActive: true,
        sortOrder: 1
    }
];

async function seed(currentDb: NeonDatabase, currentSchema: PostgresSchemaModule): Promise<void> {
    try {
        const seedId = Math.floor(Math.random() * 1000000);
        faker.seed(seedId);
        console.log('🌱 Iniciando siembra de datos en español con imágenes...');

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
            
            // Combine original and additional products
            const allProducts = [...spanishProducts, ...additionalSpanishProducts];
            console.log(`📦 Total de productos a cargar: ${allProducts.length}`);
            
            // Process products in batches to manage API limits
            const BATCH_SIZE = 50; // Process 50 products at a time
            const batches = Math.ceil(allProducts.length / BATCH_SIZE);
            
            for (let batch = 0; batch < batches; batch++) {
                const startIdx = batch * BATCH_SIZE;
                const endIdx = Math.min(startIdx + BATCH_SIZE, allProducts.length);
                const batchProducts = allProducts.slice(startIdx, endIdx);
                
                console.log(`\n🔄 Procesando lote ${batch + 1}/${batches} (productos ${startIdx + 1}-${endIdx})`);
                
                // Check Unsplash rate limit status
                const rateLimitStatus = imageService.getRateLimitStatus();
                console.log(`📊 Estado de límite Unsplash: ${rateLimitStatus.requestsUsed}/50 solicitudes usadas`);
                
                if (rateLimitStatus.requestsRemaining < 10) {
                    console.log(`⚠️  Pocas solicitudes Unsplash restantes. Usando imágenes locales y placeholders.`);
                }

            for (let i = 0; i < batchProducts.length; i++) {
                const product = batchProducts[i];
                const globalIndex = startIdx + i;
                const categoryId = categoryMap.get(product.categorySlug);

                if (categoryId) {
                    console.log(`📦 Procesando producto ${globalIndex + 1}/${allProducts.length}: ${product.name}`);

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

                    let productId;

                    if (insertedProduct.length > 0) {
                        // New product was inserted
                        productId = insertedProduct[0].id;

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
                    } else {
                        // Product already exists, find its ID
                        const existingProduct = await dbInstance
                            .select({ id: schemaInstance.products.id })
                            .from(schemaInstance.products)
                            .where(eq(schemaInstance.products.slug, productData.slug))
                            .limit(1);

                        if (existingProduct.length > 0) {
                            productId = existingProduct[0].id;
                        }
                    }

                    if (productId) {
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
                
                // Add a small delay between batches to avoid overwhelming the API
                if (batch < batches - 1) {
                    console.log(`⏸️  Pausa entre lotes (2 segundos)...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            console.log('\n📊 Resumen de carga de imágenes:');
            const finalRateLimitStatus = imageService.getRateLimitStatus();
            console.log(`   • Solicitudes Unsplash usadas: ${finalRateLimitStatus.requestsUsed}/50`);
            console.log(`   • Productos procesados: ${allProducts.length}`);
            console.log('✅ Productos en español con imágenes sembrados exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando productos (PostgreSQL):', err); }

        // Seed realistic user accounts (admins, employees, customers, vendors)
        try {
            const users = [
                // Admin accounts
                {
                    email: 'admin@luzimarket.shop',
                    password: bcrypt.hashSync('LuziAdmin2024!', 10),
                    name: 'Administrador Principal',
                    role: 'admin' as const
                },
                {
                    email: 'maria.admin@luzimarket.shop',
                    password: bcrypt.hashSync('MariaAdmin123!', 10),
                    name: 'María González',
                    role: 'admin' as const
                },
                // Employee accounts
                {
                    email: 'carlos.ventas@luzimarket.shop',
                    password: bcrypt.hashSync('Carlos123!', 10),
                    name: 'Carlos Ramírez',
                    role: 'employee' as const
                },
                {
                    email: 'ana.marketing@luzimarket.shop',
                    password: bcrypt.hashSync('Ana123!', 10),
                    name: 'Ana Martínez',
                    role: 'employee' as const
                },
                {
                    email: 'luis.inventario@luzimarket.shop',
                    password: bcrypt.hashSync('Luis123!', 10),
                    name: 'Luis Hernández',
                    role: 'employee' as const
                },
                // Vendor accounts
                {
                    email: 'proveedor1@email.com',
                    password: bcrypt.hashSync('Proveedor123!', 10),
                    name: 'Distribuidora Premium',
                    role: 'vendor' as const
                },
                {
                    email: 'proveedor2@email.com',
                    password: bcrypt.hashSync('Proveedor123!', 10),
                    name: 'Productos de Lujo SA',
                    role: 'vendor' as const
                },
                // Customer accounts
                {
                    email: 'sofia.cliente@email.com',
                    password: bcrypt.hashSync('Sofia123!', 10),
                    name: 'Sofía López',
                    role: 'customer' as const
                },
                {
                    email: 'diego.comprador@email.com',
                    password: bcrypt.hashSync('Diego123!', 10),
                    name: 'Diego Morales',
                    role: 'customer' as const
                },
                {
                    email: 'carmen.user@email.com',
                    password: bcrypt.hashSync('Carmen123!', 10),
                    name: 'Carmen Ruiz',
                    role: 'customer' as const
                },
                {
                    email: 'rafael.cliente@email.com',
                    password: bcrypt.hashSync('Rafael123!', 10),
                    name: 'Rafael Torres',
                    role: 'customer' as const
                },
                {
                    email: 'lucia.compras@email.com',
                    password: bcrypt.hashSync('Lucia123!', 10),
                    name: 'Lucía Fernández',
                    role: 'customer' as const
                }
            ];

            for (const user of users) {
                await dbInstance.insert(schemaInstance.users).values(user).onConflictDoNothing();
            }
            console.log('✅ Usuarios realistas sembrados exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando usuarios (PostgreSQL):', err); }

        // Seed employee records for employee users
        try {
            // const employeeUsers = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.role, 'employee'));

            const employeeData = [
                {
                    nombre: 'Carlos Ramírez',
                    puesto: 'Gerente de Ventas',
                    email: 'carlos.ventas@luzimarket.shop'
                },
                {
                    nombre: 'Ana Martínez',
                    puesto: 'Especialista en Marketing',
                    email: 'ana.marketing@luzimarket.shop'
                },
                {
                    nombre: 'Luis Hernández',
                    puesto: 'Coordinador de Inventario',
                    email: 'luis.inventario@luzimarket.shop'
                }
            ];

            for (const empleado of employeeData) {
                await dbInstance.insert(schemaInstance.empleados).values({
                    ...empleado
                }).onConflictDoNothing();
            }
            console.log('✅ Registros de empleados sembrados exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando empleados (PostgreSQL):', err); }

        // Seed vendor records for vendor users
        try {
            const vendorUsers = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.role, 'vendor'));

            if (vendorUsers.length > 0) {
                const vendorData = [
                    {
                        userId: vendorUsers[0]?.id,
                        businessName: 'Distribuidora Premium',
                        contactPerson: 'José María Sánchez',
                        phone: '+52 871 123 4567',
                        address: 'Av. Juárez 1234, Torreón, Coahuila',
                        taxId: 'DPR240101ABC',
                        commissionRate: 8,
                        status: 'approved' as const
                    },
                    {
                        userId: vendorUsers[1]?.id,
                        businessName: 'Productos de Lujo SA',
                        contactPerson: 'Elena Vargas',
                        phone: '+52 871 987 6543',
                        address: 'Blvd. Revolución 5678, Saltillo, Coahuila',
                        taxId: 'PLU240101XYZ',
                        commissionRate: 12,
                        status: 'approved' as const
                    }
                ];

                for (const vendor of vendorData) {
                    if (vendor.userId) {
                        await dbInstance.insert(schemaInstance.vendors).values(vendor).onConflictDoNothing();
                    }
                }
                console.log('✅ Registros de proveedores sembrados exitosamente (PostgreSQL)');
            }
        } catch (err) { console.log('❌ Error sembrando proveedores (PostgreSQL):', err); }

        // Seed sessions and cart items for realistic shopping behavior
        try {
            const allUsers = await dbInstance.select().from(schemaInstance.users);
            const customerUsers = allUsers.filter(user => user.role === 'customer');

            // Create sessions for customers and some guest sessions
            const sessions = [];

            // Customer sessions
            for (const customer of customerUsers) {
                sessions.push({
                    userId: customer.id,
                    isGuest: false
                });
            }

            // Guest sessions (simulating anonymous users browsing)
            for (let i = 0; i < 3; i++) {
                sessions.push({
                    userId: null,
                    isGuest: true
                });
            }

            for (const sessionData of sessions) {
                const insertedSession = await dbInstance
                    .insert(schemaInstance.sessions)
                    .values(sessionData)
                    .returning({ id: schemaInstance.sessions.id });

                // Add cart items to some sessions
                if (insertedSession.length > 0 && Math.random() < 0.6) { // 60% chance of having cart items
                    const sessionId = insertedSession[0].id;
                    const variants = await dbInstance.select().from(schemaInstance.productVariants).limit(10);

                    if (variants.length > 0) {
                        const numCartItems = faker.number.int({ min: 1, max: 4 });
                        const selectedVariants = faker.helpers.arrayElements(variants, numCartItems);

                        for (const variant of selectedVariants) {
                            await dbInstance.insert(schemaInstance.cartItems).values({
                                sessionId,
                                variantId: variant.id,
                                quantity: faker.number.int({ min: 1, max: 3 })
                            });
                        }
                    }
                }
            }
            console.log('✅ Sesiones y carritos sembrados exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando sesiones y carritos (PostgreSQL):', err); }

        // Seed favorites for customers
        try {
            const customerUsers = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.role, 'customer'));
            const variants = await dbInstance.select().from(schemaInstance.productVariants).limit(20);

            for (const customer of customerUsers) {
                // Each customer has 2-6 favorite items
                const numFavorites = faker.number.int({ min: 2, max: 6 });
                const favoriteVariants = faker.helpers.arrayElements(variants, numFavorites);

                for (const variant of favoriteVariants) {
                    await dbInstance.insert(schemaInstance.favorites).values({
                        userId: customer.id,
                        variantId: variant.id
                    }).onConflictDoNothing();
                }
            }
            console.log('✅ Favoritos de clientes sembrados exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando favoritos (PostgreSQL):', err); }

        // Seed realistic orders with diverse patterns
        try {
            const allUsers = await dbInstance.select().from(schemaInstance.users);
            const productsWithVariants = await dbInstance
                .select({
                    productId: schemaInstance.products.id,
                    productName: schemaInstance.products.name,
                    productPrice: schemaInstance.products.price,
                    variantId: schemaInstance.productVariants.id,
                })
                .from(schemaInstance.products)
                .leftJoin(schemaInstance.productVariants, eq(schemaInstance.productVariants.productId, schemaInstance.products.id));

            if (productsWithVariants.length > 0 && allUsers.length > 0) {
                const numberOfOrders = 75; // Create 75 orders for realistic data
                console.log(`📦 Creando ${numberOfOrders} órdenes realistas con información de envío mexicana...`);

                // Mexican shipping carriers
                const mexicanCarriers = ['estafeta', 'correos_mexico', 'fedex', 'ups', 'dhl', 'paquete_express', '99minutos'];
                const shippingServices = ['standard', 'express', 'economy', 'same_day', 'overnight'];

                for (let i = 0; i < numberOfOrders; i++) {
                    // Randomly select a user for the order
                    const randomUser = faker.helpers.arrayElement(allUsers);

                    // Create more realistic order dates using PostgreSQL SQL functions
                    let orderDateSql;
                    if (Math.random() < 0.4) {
                        // 40% recent orders (last 30 days)
                        const daysAgo = faker.number.int({ min: 1, max: 30 });
                        orderDateSql = sql`NOW() - INTERVAL '${sql.raw(daysAgo.toString())} days'`;
                    } else if (Math.random() < 0.7) {
                        // 30% medium recent (30-90 days ago)
                        const daysAgo = faker.number.int({ min: 31, max: 90 });
                        orderDateSql = sql`NOW() - INTERVAL '${sql.raw(daysAgo.toString())} days'`;
                    } else {
                        // 30% older orders (90-180 days ago)
                        const daysAgo = faker.number.int({ min: 91, max: 180 });
                        orderDateSql = sql`NOW() - INTERVAL '${sql.raw(daysAgo.toString())} days'`;
                    }

                    // More realistic status distribution
                    let status, paymentStatus, shippingCarrier, shippingService, trackingNumber;
                    const statusRandom = Math.random();
                    if (statusRandom < 0.6) {
                        status = 'delivered';
                        paymentStatus = 'succeeded';
                    } else if (statusRandom < 0.8) {
                        status = 'shipped';
                        paymentStatus = 'succeeded';
                    } else if (statusRandom < 0.9) {
                        status = 'processing';
                        paymentStatus = 'succeeded';
                    } else if (statusRandom < 0.95) {
                        status = 'pending';
                        paymentStatus = 'pending';
                    } else {
                        status = 'cancelled';
                        paymentStatus = 'failed';
                    }

                    // Add shipping details for shipped/delivered orders
                    if (status === 'shipped' || status === 'delivered') {
                        shippingCarrier = faker.helpers.arrayElement(mexicanCarriers);
                        shippingService = faker.helpers.arrayElement(shippingServices);
                        // Generate Mexican tracking number
                        const trackingSuffix = faker.string.alphanumeric(8).toUpperCase();
                        trackingNumber = `LZ${new Date().getFullYear().toString().slice(-2)}${faker.string.numeric(6)}${trackingSuffix}`;
                    }

                    // Add 1-5 items per order with realistic pricing
                    const itemsPerOrder = faker.number.int({ min: 1, max: 5 });
                    const selectedVariants = faker.helpers.arrayElements(
                        productsWithVariants.filter(v => v.variantId),
                        Math.min(itemsPerOrder, productsWithVariants.filter(v => v.variantId).length)
                    );

                    let orderTotal = 0;
                    const orderItemsData = [];

                    for (const variant of selectedVariants) {
                        if (variant.variantId) {
                            const quantity = faker.number.int({ min: 1, max: 3 });
                            // Use product price with some variation (±20%)
                            const priceVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20%
                            const itemPrice = Math.round((variant.productPrice || 50000) * priceVariation);

                            orderTotal += itemPrice * quantity;
                            orderItemsData.push({
                                variantId: variant.variantId,
                                quantity,
                                price: itemPrice
                            });
                        }
                    }

                    const orderData = {
                        userId: randomUser.id,
                        total: orderTotal,
                        status,
                        payment_status: paymentStatus,
                        shipping_carrier: shippingCarrier,
                        shipping_service: shippingService,
                        tracking_number: trackingNumber,
                        createdAt: orderDateSql
                    };

                    const insertedOrder = await dbInstance
                        .insert(schemaInstance.orders)
                        .values(orderData)
                        .returning({ id: schemaInstance.orders.id });

                    if (insertedOrder.length > 0) {
                        const orderId = insertedOrder[0].id;

                        // Insert all order items
                        for (const itemData of orderItemsData) {
                            await dbInstance.insert(schemaInstance.orderItems).values({
                                orderId,
                                ...itemData
                            });
                        }
                    }

                    // Show progress every 15 orders
                    if ((i + 1) % 15 === 0) {
                        console.log(`✅ Procesadas ${i + 1}/${numberOfOrders} órdenes realistas con envío mexicano`);
                    }
                }
                console.log('✅ Órdenes realistas con envío mexicano sembradas exitosamente (PostgreSQL)');
            } else {
                console.log('⚠️  No se encontraron productos o usuarios para crear órdenes');
            }
        } catch (err) { console.log('❌ Error sembrando órdenes realistas (PostgreSQL):', err); }

        // Seed realistic notifications for admin dashboard
        try {
            console.log('🔔 Creando notificaciones realistas para dashboard de admin...');

            // Get some real data for notifications
            const recentOrders = await dbInstance.select().from(schemaInstance.orders).limit(10);
            // These queries are used to generate realistic notification messages below
            await dbInstance.select().from(schemaInstance.vendors).limit(5);
            await dbInstance.select().from(schemaInstance.products).limit(20);

            const notificationTemplates = [
                // Vendor requests
                {
                    type: 'vendor_request',
                    severity: 'warning',
                    title: 'Nueva solicitud de vendedor',
                    message: 'Artesanías Mexicanas ha solicitado unirse como vendedor en la plataforma',
                    category: 'vendors',
                    actionRequired: true,
                    data: { vendorName: 'Artesanías Mexicanas', email: 'contacto@artesanias.mx' }
                },
                {
                    type: 'vendor_request',
                    severity: 'warning',
                    title: 'Solicitud de vendedor pendiente',
                    message: 'Productos Tradicionales de Coahuila solicita aprobación para vender',
                    category: 'vendors',
                    actionRequired: true,
                    data: { vendorName: 'Productos Tradicionales de Coahuila', email: 'ventas@tradicionales.mx' }
                },
                // Stock issues
                {
                    type: 'low_stock',
                    severity: 'warning',
                    title: 'Inventario bajo',
                    message: 'Tetera de barro artesanal tiene menos de 5 unidades disponibles',
                    category: 'inventory',
                    actionRequired: true,
                    data: { productName: 'Tetera de barro artesanal', currentStock: 3 }
                },
                {
                    type: 'low_stock',
                    severity: 'error',
                    title: 'Producto agotado',
                    message: 'Servilletas bordadas a mano están agotadas',
                    category: 'inventory',
                    actionRequired: true,
                    data: { productName: 'Servilletas bordadas a mano', currentStock: 0 }
                },
                // Payment issues
                {
                    type: 'payment_failed',
                    severity: 'error',
                    title: 'Pago fallido',
                    message: 'Orden por $1,250 pesos rechazada por el banco - tarjeta expirada',
                    category: 'payments',
                    actionRequired: true,
                    data: { amount: 125000, reason: 'expired_card' }
                },
                {
                    type: 'payment_failed',
                    severity: 'error',
                    title: 'Problema con procesador de pagos',
                    message: 'Stripe reporta problemas con pagos en pesos mexicanos',
                    category: 'payments',
                    actionRequired: true,
                    data: { processor: 'stripe', currency: 'MXN' }
                },
                // Delivery issues
                {
                    type: 'delivery_issue',
                    severity: 'warning',
                    title: 'Problema de entrega en Torreón',
                    message: 'Estafeta reporta retraso en entregas por condiciones climáticas',
                    category: 'orders',
                    actionRequired: true,
                    data: { carrier: 'estafeta', zone: 'Torreón', reason: 'weather' }
                },
                {
                    type: 'delivery_issue',
                    severity: 'error',
                    title: 'Dirección incorrecta',
                    message: 'Cliente reporta dirección de entrega incorrecta en orden',
                    category: 'orders',
                    actionRequired: true,
                    data: { customer: 'María García', issue: 'wrong_address' }
                },
                // Customer petitions
                {
                    type: 'customer_petition',
                    severity: 'info',
                    title: 'Nueva petición de cliente',
                    message: 'Solicitud de productos orgánicos en la categoría de alimentos artesanales',
                    category: 'petitions',
                    actionRequired: false,
                    data: { petitionType: 'product_request', category: 'alimentos' }
                },
                {
                    type: 'customer_petition',
                    severity: 'info',
                    title: 'Sugerencia de mejora',
                    message: 'Cliente sugiere agregar opción de entrega en horario nocturno',
                    category: 'petitions',
                    actionRequired: false,
                    data: { petitionType: 'improvement', feature: 'night_delivery' }
                },
                // Sales achievements
                {
                    type: 'high_sales',
                    severity: 'success',
                    title: 'Meta de ventas superada',
                    message: 'Las ventas de hoy superaron la meta diaria en un 125%',
                    category: 'sales',
                    actionRequired: false,
                    data: { salesAmount: 87500, target: 70000, percentage: 125 }
                },
                {
                    type: 'high_sales',
                    severity: 'success',
                    title: 'Producto más vendido',
                    message: 'Rebozos de Saltillo fueron el producto más vendido esta semana',
                    category: 'sales',
                    actionRequired: false,
                    data: { productName: 'Rebozos de Saltillo', unitsSold: 45 }
                },
                // System notifications
                {
                    type: 'system_maintenance',
                    severity: 'info',
                    title: 'Mantenimiento programado',
                    message: 'Mantenimiento del sistema programado para el domingo de 2:00 AM a 4:00 AM',
                    category: 'system',
                    actionRequired: false,
                    data: { date: '2025-02-02', startTime: '02:00', endTime: '04:00', timezone: 'America/Mexico_City' }
                },
                {
                    type: 'system_update',
                    severity: 'info',
                    title: 'Actualización completada',
                    message: 'Sistema de notificaciones actualizado con mejoras de rendimiento',
                    category: 'system',
                    actionRequired: false,
                    data: { version: '2.1.0', features: ['real-time updates', 'performance improvements'] }
                }
            ];

            // Create notifications with realistic timestamps
            for (let i = 0; i < notificationTemplates.length; i++) {
                const template = notificationTemplates[i];

                // Create timestamps ranging from 1 hour to 7 days ago
                const hoursAgo = faker.number.int({ min: 1, max: 168 }); // 1 hour to 7 days
                const notificationDateSql = sql`NOW() - INTERVAL '${sql.raw(hoursAgo.toString())} hours'`;

                // Set expiration for some notifications (7 days from creation)
                let expiresAt = null;
                if (['system_maintenance', 'system_update', 'high_sales'].includes(template.type)) {
                    expiresAt = sql`NOW() + INTERVAL '7 days'`;
                }

                // Mark some as read (60% unread for urgency)
                const isRead = Math.random() < 0.4;

                const notificationData = {
                    ...template,
                    severity: template.severity as 'info' | 'warning' | 'error' | 'success',
                    isRead,
                    expiresAt,
                    createdAt: notificationDateSql,
                    updatedAt: notificationDateSql
                };

                await dbInstance.insert(schemaInstance.notifications).values(notificationData).onConflictDoNothing();
            }

            // Create some order-specific notifications using real order data
            for (const order of recentOrders.slice(0, 5)) {
                const orderNotification = {
                    type: 'order_update',
                    severity: (order.status === 'delivered' ? 'success' : 'info') as 'info' | 'warning' | 'error' | 'success',
                    title: `Orden ${order.id.slice(-8)} actualizada`,
                    message: `Estado cambiado a: ${order.status}`,
                    category: 'orders',
                    actionRequired: false,
                    relatedEntityId: order.id,
                    relatedEntityType: 'order',
                    data: { orderId: order.id, newStatus: order.status },
                    isRead: Math.random() < 0.3,
                    createdAt: sql`NOW() - INTERVAL '${sql.raw(faker.number.int({ min: 1, max: 48 }).toString())} hours'`
                };

                await dbInstance.insert(schemaInstance.notifications).values(orderNotification).onConflictDoNothing();
            }

            console.log('✅ Notificaciones realistas sembradas exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando notificaciones (PostgreSQL):', err); }

        // Seed example petitions
        try {
            for (const type of petitionTypes) {
                for (const status of petitionStatuses) {
                    const petitionDaysAgo = faker.number.int({ min: 1, max: 90 });
                    const petitionDateSql = sql`NOW() - INTERVAL '${sql.raw(petitionDaysAgo.toString())} days'`;

                    await dbInstance.insert(schemaInstance.petitions).values({
                        type,
                        title: `${type} - ${faker.lorem.sentence(4)}`,
                        description: faker.lorem.paragraphs(2),
                        status,
                        createdAt: petitionDateSql
                    }).onConflictDoNothing();
                }
            }
            console.log('✅ Peticiones de ejemplo sembradas exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando peticiones de ejemplo (PostgreSQL):', err); }

        // Seed homepage slides with enhanced images
        try {
            console.log('🏠 Creando slides de página principal con imágenes optimizadas...');
            for (let i = 0; i < homepageSlidesTemplates.length; i++) {
                const slideTemplate = homepageSlidesTemplates[i];

                // Get enhanced image for homepage slide
                const imageResult = await imageService.getHomepageSlideImage(
                    i.toString(),
                    slideTemplate.title
                );

                const slideData = {
                    ...slideTemplate,
                    imageUrl: imageResult.url
                };

                await dbInstance.insert(schemaInstance.homepageSlides).values(slideData).onConflictDoNothing();

                if (imageResult.isExisting) {
                    console.log(`♻️  Slide ${i + 1}: imagen existente reutilizada`);
                } else {
                    console.log(`✅ Slide ${i + 1}: nueva imagen cargada (${imageResult.source})`);
                }
            }
            console.log('✅ Slides de página principal sembradas exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando slides de página principal (PostgreSQL):', err); }

        // Seed user addresses for customers
        try {
            const customerUsers = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.role, 'customer'));

            for (const customer of customerUsers) {
                // Each customer gets 1-2 addresses
                const numAddresses = faker.number.int({ min: 1, max: 2 });
                for (let i = 0; i < numAddresses; i++) {
                    await dbInstance.insert(schemaInstance.userAddresses).values({
                        userId: customer.id,
                        type: i === 0 ? 'shipping' : 'billing',
                        isDefault: i === 0,
                        fullName: customer.name || `${faker.person.firstName()} ${faker.person.lastName()}`,
                        street: `${faker.location.streetAddress()}, ${faker.location.secondaryAddress()}`,
                        city: faker.helpers.arrayElement(['Torreón', 'Saltillo', 'Monterrey', 'Gómez Palacio', 'Lerdo']),
                        state: faker.helpers.arrayElement(['Coahuila', 'Nuevo León', 'Durango']),
                        postalCode: faker.location.zipCode('####'),
                        country: 'México',
                        phone: `+52 871 ${faker.string.numeric(7)}`,
                        instructions: Math.random() < 0.5 ? faker.lorem.sentence() : null,
                    }).onConflictDoNothing();
                }
            }
            console.log('✅ Direcciones de usuarios sembradas exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando direcciones de usuarios (PostgreSQL):', err); }

        // Seed product reviews
        try {
            const customerUsers = await dbInstance.select().from(schemaInstance.users).where(eq(schemaInstance.users.role, 'customer'));
            const allProducts = await dbInstance.select().from(schemaInstance.products).limit(20);

            const reviewTitles = [
                'Excelente calidad',
                'Muy recomendado',
                'Perfecto para regalo',
                'Superó mis expectativas',
                'Bellísimo producto',
                'Calidad premium',
                'Muy satisfecho con la compra',
                'Producto auténtico',
                'Entrega rápida y segura',
                'Exactamente como se describe'
            ];

            const reviewComments = [
                'El producto llegó en perfectas condiciones y la calidad es excepcional. Muy contento con la compra.',
                'Hermoso regalo, mi familia quedó encantada. La presentación es muy elegante.',
                'Superó todas mis expectativas. La atención al detalle es increíble.',
                'Producto auténtico y de muy buena calidad. Definitivamente volvería a comprar.',
                'Entrega muy rápida y el empaque cuidadoso. El producto es tal como se describe.',
                'Excelente relación calidad-precio. Lo recomiendo ampliamente.',
                'Un regalo perfecto para ocasiones especiales. La calidad se nota desde el primer momento.',
                'Producto único y hermoso. La artesanía mexicana en su máxima expresión.',
            ];

            for (const product of allProducts) {
                // Each product gets 2-5 reviews
                const numReviews = faker.number.int({ min: 2, max: 5 });
                const selectedCustomers = faker.helpers.arrayElements(customerUsers, numReviews);

                for (const customer of selectedCustomers) {
                    const reviewDaysAgo = faker.number.int({ min: 1, max: 60 });
                    const reviewDateSql = sql`NOW() - INTERVAL '${sql.raw(reviewDaysAgo.toString())} days'`;

                    await dbInstance.insert(schemaInstance.productReviews).values({
                        productId: product.id,
                        userId: customer.id,
                        rating: faker.number.int({ min: 3, max: 5 }), // Mostly positive reviews
                        title: faker.helpers.arrayElement(reviewTitles),
                        comment: faker.helpers.arrayElement(reviewComments),
                        isVerifiedPurchase: Math.random() < 0.7, // 70% verified purchases
                        isApproved: Math.random() < 0.9, // 90% approved
                        createdAt: reviewDateSql,
                    }).onConflictDoNothing();
                }
            }
            console.log('✅ Reseñas de productos sembradas exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando reseñas de productos (PostgreSQL):', err); }

        // Seed discount codes
        try {
            // Create safe future dates for discount codes using PostgreSQL SQL functions
            const discountCodes = [
                {
                    code: 'BIENVENIDO10',
                    type: 'percentage' as const,
                    value: 10,
                    minOrderAmount: 50000, // $500 pesos
                    maxUses: 100,
                    usedCount: faker.number.int({ min: 5, max: 25 }),
                    isActive: true,
                    expiresAt: sql`NOW() + INTERVAL '30 days'`, // 30 days
                },
                {
                    code: 'ENVIOGRATIS',
                    type: 'free_shipping' as const,
                    value: 0,
                    minOrderAmount: 100000, // $1000 pesos
                    maxUses: 50,
                    usedCount: faker.number.int({ min: 10, max: 30 }),
                    isActive: true,
                    expiresAt: sql`NOW() + INTERVAL '60 days'`, // 60 days
                },
                {
                    code: 'NAVIDAD2025',
                    type: 'percentage' as const,
                    value: 20,
                    minOrderAmount: 75000, // $750 pesos
                    maxUses: 200,
                    usedCount: faker.number.int({ min: 50, max: 100 }),
                    isActive: true,
                    expiresAt: sql`'2025-12-31 23:59:59'::timestamp`, // December 31, 2025
                },
                {
                    code: 'PRIMERA100',
                    type: 'fixed_amount' as const,
                    value: 10000, // $100 pesos off
                    minOrderAmount: 50000, // $500 pesos minimum
                    maxUses: 500,
                    usedCount: faker.number.int({ min: 200, max: 400 }),
                    isActive: true,
                    expiresAt: sql`NOW() + INTERVAL '90 days'`, // 90 days
                }
            ];

            for (const discountCode of discountCodes) {
                await dbInstance.insert(schemaInstance.discountCodes).values(discountCode).onConflictDoNothing();
            }
            console.log('✅ Códigos de descuento sembrados exitosamente (PostgreSQL)');
        } catch (err) { console.log('❌ Error sembrando códigos de descuento (PostgreSQL):', err); }

        console.log('\n🎉 ¡Datos realistas en español con imágenes sembrados exitosamente!');
        console.log('📊 Resumen completo:');
        console.log(`   • ${spanishCategories.length} categorías en español`);
        console.log(`   • ${[...spanishProducts, ...additionalSpanishProducts].length} productos con descripciones detalladas`);
        console.log(`   • ${spanishOccasions.length} ocasiones especiales`);
        console.log(`   • ${statesData.length} estados mexicanos`);
        console.log(`   • ${deliveryZonesData.length} zonas de entrega`);
        console.log(`   • ${homepageSlidesTemplates.length} slides de página principal`);
        console.log('');
        console.log('👥 Usuarios realistas:');
        console.log('   • 2 administradores con credenciales completas');
        console.log('   • 3 empleados con registros de empleados');
        console.log('   • 2 proveedores con perfiles de negocio');
        console.log('   • 5 clientes con cuentas completas');
        console.log('');
        console.log('🛒 Comportamiento de ecommerce:');
        console.log('   • Sesiones activas para clientes y huéspedes');
        console.log('   • Carritos con productos para simular compras activas');
        console.log('   • Favoritos personalizados por cliente');
        console.log('   • 75 órdenes realistas con distribución temporal');
        console.log('   • Estados de órdenes diversos (60% entregadas, 20% enviadas, etc.)');
        console.log('   • Precios calculados basados en productos reales');
        console.log('   • Notificaciones realistas para dashboard de admin');
        console.log('   • Direcciones de usuarios y órdenes');
        console.log('   • Reseñas de productos con calificaciones');
        console.log('   • Códigos de descuento activos');
        console.log('');
        console.log('📸 Contenido multimedia:');
        console.log('   • Imágenes optimizadas con fuentes múltiples:');
        console.log('     - Imágenes del usuario reutilizadas inteligentemente');
        console.log('     - API de Unsplash con límite de tasa (50/hora)');
        console.log('     - Placeholders como respaldo');
        console.log('   • Todas las imágenes almacenadas en Vercel Blob');
        console.log('   • Precios en pesos mexicanos');
        console.log('');
        console.log('🔑 Credenciales de acceso:');
        console.log('   👨‍💼 Admin principal: admin@luzimarket.shop / LuziAdmin2024!');
        console.log('   👩‍💼 Admin secundario: maria.admin@luzimarket.shop / MariaAdmin123!');
        console.log('   👷‍♂️ Empleado ventas: carlos.ventas@luzimarket.shop / Carlos123!');
        console.log('   👩‍💻 Empleado marketing: ana.marketing@luzimarket.shop / Ana123!');
        console.log('   📦 Empleado inventario: luis.inventario@luzimarket.shop / Luis123!');
        console.log('   🏢 Proveedor 1: proveedor1@email.com / Proveedor123!');
        console.log('   🏪 Proveedor 2: proveedor2@email.com / Proveedor123!');
        console.log('   🛍️ Cliente ejemplo: sofia.cliente@email.com / Sofia123!');

    } catch (err) {
        console.error('💥 Error sembrando base de datos:', err instanceof Error ? err.stack : err);
        process.exit(1);
    }
}

async function loadSchemaAndRunSeed() {
    try {
        console.log('🗄️  Cargando esquema PostgreSQL...');
        const mainSchema = await import('./schema');
        const neonDb = db as NeonDatabase;
        await seed(neonDb, mainSchema);
    } catch (error) {
        console.error('💥 Error cargando esquema o sembrando:', error);
        process.exit(1);
    }
}

loadSchemaAndRunSeed().catch((err) => {
    console.error('💥 Error durante la carga del esquema o siembra:', err.stack || err);
    process.exit(1);
}); 