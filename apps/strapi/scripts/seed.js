'use strict';

/**
 * Consolidated seed script for Strapi v5.
 * Run with: `npm run seed` from apps/strapi
 * Can be run locally or inside Docker container
 */
const path = require('path');
// Load local environment variables for local seeding
if (!process.env.DATABASE_HOST) {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
}
// Ensure transfer token salt
if (!process.env.TRANSFER_TOKEN_SALT) {
    process.env.TRANSFER_TOKEN_SALT = require('crypto').randomBytes(16).toString('base64');
    console.log('ℹ️  Generated TRANSFER_TOKEN_SALT for seeding');
}
// Ensure module resolution includes the local Strapi installation
process.env.NODE_PATH = path.resolve(__dirname, '..', 'node_modules');
require('module').Module._initPaths();
const { createStrapi } = require('@strapi/strapi');

async function seed() {
    const projectDir = path.resolve(__dirname, '..');
    process.chdir(projectDir);
    const app = createStrapi({
        appDir: projectDir,
        distDir: path.resolve(projectDir, 'dist'),
        autoReload: false,
    });

    try {
        // Load Strapi without starting the HTTP server
        console.log('✅ Loading Strapi instance...');
        await app.load();
        const strapi = app;

        // Verify database connection
        console.log('✅ Checking database tables...');

        // List tables to debug
        try {
            // Execute raw query to check if users table exists and its columns
            const tables = await strapi.db.connection.raw('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
            console.log('Available tables:', tables.rows.map(t => t.table_name).join(', '));

            // Check if up_users table exists and show its columns
            try {
                const columns = await strapi.db.connection.raw('SELECT column_name FROM information_schema.columns WHERE table_name = \'up_users\';');
                console.log('up_users columns:', columns.rows.map(c => c.column_name).join(', '));

                // Get the user model to understand its structure
                const userModel = strapi.getModel('plugin::users-permissions.user');
                console.log('User model fields:', Object.keys(userModel.attributes));
            } catch (e) {
                console.log('Cannot query up_users columns:', e.message);

                // Check if users table exists in a different name
                const userTables = await strapi.db.connection.raw('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name LIKE \'%user%\';');
                if (userTables.rows.length > 0) {
                    console.log('Found potential user tables:', userTables.rows.map(t => t.table_name).join(', '));

                    // Check the schema of the first potential user table
                    const firstUserTable = userTables.rows[0].table_name;
                    const userColumns = await strapi.db.connection.raw(`SELECT column_name FROM information_schema.columns WHERE table_name = '${firstUserTable}';`);
                    console.log(`${firstUserTable} columns:`, userColumns.rows.map(c => c.column_name).join(', '));
                }
            }
        } catch (e) {
            console.log('Error listing tables:', e.message);
        }

        console.log('Starting seeding operations...');

        // 1. Seed test user
        // Create user directly in the database if the Users & Permissions plugin is available
        if (strapi.plugin('users-permissions')) {
            try {
                // First, check if we need to create a new test user
                const existingUsers = await strapi.db.connection.raw('SELECT * FROM up_users LIMIT 1');

                if (existingUsers.rows.length === 0) {
                    console.log('Creating test user directly in the database...');

                    // Get role ID for authenticated users
                    const authenticatedRole = await strapi.db
                        .query('plugin::users-permissions.role')
                        .findOne({ where: { type: 'authenticated' } });

                    if (!authenticatedRole) {
                        throw new Error('Could not find authenticated role');
                    }

                    // Create a new user with profile data (adapt fields to your schema)
                    await strapi.db.connection.raw(`
                        INSERT INTO up_users 
                        (first_name, last_name, phone, address, postal_code, state, country, document_id, created_at, updated_at) 
                        VALUES 
                        ('Test', 'User', '555-1234', '123 Test St.', '12345', 'TestState', 'TestLand', 'testuser@example.com', NOW(), NOW())
                        RETURNING id
                    `);

                    console.log('✅ Created test user');
                } else {
                    console.log('✅ Users already exist in the database');
                }
            } catch (err) {
                console.error('Error creating test user:', err);
            }
        }

        // 2. Seed brands
        const brandCount = await strapi.db.query('api::brand.brand').count();
        if (brandCount === 0) {
            const fakeBrands = [
                {
                    name: 'Luzimarket Originals',
                    logo: 'https://dummyimage.com/200x100/000/fff&text=Luzimarket',
                    description: 'Our in-house brand for quality essentials.',
                    website: 'https://luzimarket.com/originals',
                },
                {
                    name: 'ElectroMax',
                    logo: 'https://dummyimage.com/200x100/111/eee&text=ElectroMax',
                    description: 'Top electronics and gadgets.',
                    website: 'https://electromax.com',
                },
                {
                    name: 'ModaPlus',
                    logo: 'https://dummyimage.com/200x100/222/fff&text=ModaPlus',
                    description: 'Trendy fashion for all ages.',
                    website: 'https://modaplus.com',
                },
            ];
            for (const brand of fakeBrands) {
                await strapi.entityService.create('api::brand.brand', { data: brand });
            }
            console.log('✅ Seeded brands');
        } else {
            console.log('✅ Brands already exist');
        }

        // 3. Seed categories and articles
        const categoryCount = await strapi.db.query('api::category.category').count();
        const articleCount = await strapi.db.query('api::article.article').count();

        if (categoryCount === 0) {
            const fakeCategories = [
                {
                    name: 'Cumpleaños',
                    description: 'Celebra cumpleaños con regalos y productos especiales.',
                    image: 'https://dummyimage.com/300x120/ffb347/fff&text=Cumplea%C3%B1os',
                },
                {
                    name: 'Aniversario',
                    description: 'Sorprende en aniversarios con detalles inolvidables.',
                    image: 'https://dummyimage.com/300x120/77dd77/fff&text=Aniversario',
                },
                {
                    name: 'Graduación',
                    description: 'Regalos para celebrar logros académicos.',
                    image: 'https://dummyimage.com/300x120/779ecb/fff&text=Graduaci%C3%B3n',
                },
                {
                    name: 'Navidad',
                    description: 'Todo para una Navidad mágica y especial.',
                    image: 'https://dummyimage.com/300x120/ff6961/fff&text=Navidad',
                },
            ];
            for (const category of fakeCategories) {
                await strapi.entityService.create('api::category.category', { data: category });
            }
            console.log('✅ Seeded categories');
        } else {
            console.log('✅ Categories already exist');
        }

        if (articleCount === 0) {
            const fakeArticles = [
                {
                    title: 'Tendencias de regalos 2025',
                    summary: 'Descubre las tendencias más populares en regalos para este año.',
                    content:
                        'Este año, los regalos personalizados y las experiencias únicas están en auge. Desde gadgets tecnológicos hasta kits de bienestar, descubre cómo sorprender a tus seres queridos...',
                },
                {
                    title: 'Cómo elegir el regalo perfecto',
                    summary: 'Consejos prácticos para acertar siempre con tu regalo.',
                    content:
                        'Elegir el regalo perfecto depende de conocer los gustos y necesidades de la persona. Considera experiencias, productos útiles y detalles personalizados para marcar la diferencia...',
                },
                {
                    title: 'Ideas para celebraciones inolvidables',
                    summary: 'Inspírate con estas ideas para organizar eventos memorables.',
                    content:
                        'Desde decoraciones temáticas hasta actividades interactivas, aquí tienes ideas para que tu próxima celebración sea inolvidable...',
                },
            ];
            for (const article of fakeArticles) {
                await strapi.entityService.create('api::article.article', { data: article });
            }
            console.log('✅ Seeded articles');
        } else {
            console.log('✅ Articles already exist');
        }

        // 4. Seed product details if they don't exist
        const productCount = await strapi.db.query('api::product-detail.product-detail').count();
        if (productCount === 0) {
            // Get existing categories first
            const categories = await strapi.entityService.findMany('api::category.category');
            const categoryMap = new Map();
            categories.forEach(cat => {
                if (cat.slug === 'flowershop' || cat.name.includes('Flowershop')) {
                    categoryMap.set(1, cat.id);
                } else if (cat.slug === 'sweet' || cat.name.includes('Sweet')) {
                    categoryMap.set(2, cat.id);
                } else if (cat.slug === 'events-dinners' || cat.name.includes('Events')) {
                    categoryMap.set(3, cat.id);
                } else if (cat.slug === 'giftshop' || cat.name.includes('Giftshop')) {
                    categoryMap.set(4, cat.id);
                }
            });

            // If we don't have the necessary categories, create them
            if (categoryMap.size < 4) {
                const prodCategories = [
                    { id: 1, name: 'Flowershop', slug: 'flowershop', description: 'Regalos florales y arreglos.' },
                    { id: 2, name: 'Sweet', slug: 'sweet', description: 'Dulces y postres artesanales.' },
                    { id: 3, name: 'Events + Dinners', slug: 'events-dinners', description: 'Experiencias y cenas especiales.' },
                    { id: 4, name: 'Giftshop', slug: 'giftshop', description: 'Regalos únicos y personalizados.' },
                ];

                for (const cat of prodCategories) {
                    if (!categoryMap.has(cat.id)) {
                        const created = await strapi.entityService.create('api::category.category', {
                            data: { name: cat.name, slug: cat.slug, description: cat.description },
                        });
                        categoryMap.set(cat.id, created.id);
                    }
                }
            }

            // Now seed products
            const prodProducts = [
                {
                    name: 'Bouquet de Rosas',
                    description: 'Hermoso ramo de rosas frescas para momentos especiales.',
                    price: 650,
                    imageUrl: 'https://images.unsplash.com/photo-1525948454345-c39df3b1e70?auto=format&fit=crop&w=300&q=80',
                    category: 1,
                },
                {
                    name: 'Caja de Donas',
                    description: 'Selección de donas artesanales (6 piezas).',
                    price: 150,
                    imageUrl: 'https://images.unsplash.com/photo-1589987603893-8674b8bb8a8a?auto=format&fit=crop&w=300&q=80',
                    category: 2,
                },
                {
                    name: 'Experiencia Cena',
                    description: 'Cena para dos con decoración especial y menú de 3 tiempos.',
                    price: 2500,
                    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
                    category: 3,
                },
                {
                    name: 'Juego de Tazas',
                    description: 'Set de 4 tazas cerámicas coloridas.',
                    price: 350,
                    imageUrl: 'https://images.unsplash.com/photo-1553524789-29085d31b7c?auto=format&fit=crop&w=300&q=80',
                    category: 4,
                },
            ];

            for (const prod of prodProducts) {
                const categoryId = categoryMap.get(prod.category);
                if (categoryId) {
                    await strapi.entityService.create('api::product-detail.product-detail', {
                        data: {
                            name: prod.name,
                            description: prod.description,
                            price: prod.price,
                            imageUrl: prod.imageUrl,
                            category: categoryId,
                        },
                    });
                }
            }
            console.log('✅ Seeded product details');
        } else {
            console.log('✅ Products already exist');
        }

        // 5. Seed new Product entries
        const newProdCount = await strapi.db.query('api::product.product').count();
        if (newProdCount === 0) {
            console.log('Seeding demo products...');
            const categories = await strapi.entityService.findMany('api::category.category');
            const catMap = {};
            categories.forEach(c => { catMap[c.slug] = c.id; });
            const demoProducts = [
                {
                    title: 'Ramo de Rosas', slug: 'ramo-de-rosas', description: 'Hermoso ramo de rosas rojas',
                    price: 500, salePrice: 450, sku: 'RAMO-0001', inStock: 25,
                    category: catMap['flowershop'], brand: null, tags: ['rosas', 'flores']
                },
                {
                    title: 'Caja de Globos', slug: 'caja-de-globos', description: 'Caja con globos de colores',
                    price: 300, salePrice: 270, sku: 'GLOB-0001', inStock: 30,
                    category: catMap['cumpleanos'], brand: null, tags: ['globos', 'celebracion']
                },
                {
                    title: 'Arreglo Floral Premium', slug: 'arreglo-floral-premium', description: 'Arreglo mixto premium',
                    price: 800, salePrice: 700, sku: 'FLOR-0001', inStock: 10,
                    category: catMap['flowershop'], brand: null, tags: ['premium', 'flores']
                }
            ];
            for (const p of demoProducts) {
                await strapi.entityService.create('api::product.product', { data: p });
            }
            console.log('✅ Seeded demo products');
        } else {
            console.log('✅ Demo products already exist');
        }

        // 6. Seed Variants
        const varCount = await strapi.db.query('api::variant.variant').count();
        if (varCount === 0) {
            console.log('Seeding variants...');
            const products = await strapi.entityService.findMany('api::product.product');
            const variants = [];
            products.forEach(prod => {
                variants.push({ name: prod.title + ' - Pequeño', price: prod.price, sku: prod.sku + '-S', stock: 10, product: prod.id });
                variants.push({ name: prod.title + ' - Grande', price: prod.price * 1.5, sku: prod.sku + '-L', stock: 5, product: prod.id });
            });
            for (const v of variants) {
                await strapi.entityService.create('api::variant.variant', { data: v });
            }
            console.log('✅ Seeded variants');
        } else {
            console.log('✅ Variants already exist');
        }

        // 7. Seed Bundles
        const bundleCount = await strapi.db.query('api::bundle.bundle').count();
        if (bundleCount === 0) {
            console.log('Seeding bundles...');
            const prods = await strapi.entityService.findMany('api::product.product');
            if (prods.length >= 2) {
                await strapi.entityService.create('api::bundle.bundle', {
                    data: {
                        title: 'Combo Rosa y Globos', slug: 'combo-rosa-y-globos', products: [prods[0].id, prods[1].id],
                        price: (prods[0].price + prods[1].price) * 0.9
                    }
                });
                await strapi.entityService.create('api::bundle.bundle', {
                    data: {
                        title: 'Combo Premium', slug: 'combo-premium', products: [prods[0].id, prods[2]?.id || prods[1].id],
                        price: (prods[0].price + (prods[2]?.price || prods[1].price)) * 0.85
                    }
                });
            }
            console.log('✅ Seeded bundles');
        } else {
            console.log('✅ Bundles already exist');
        }

        // 8. Seed Promotions
        const promoCount = await strapi.db.query('api::promotion.promotion').count();
        if (promoCount === 0) {
            console.log('Seeding promotions...');
            const now = new Date();
            const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await strapi.entityService.create('api::promotion.promotion', { data: { code: 'WELCOME10', discount: 10, type: 'percent', active: true, validFrom: now, validTo: nextMonth } });
            await strapi.entityService.create('api::promotion.promotion', { data: { code: 'SUMMER5', discount: 5, type: 'percent', active: true, validFrom: now, validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) } });
            console.log('✅ Seeded promotions');
        } else {
            console.log('✅ Promotions already exist');
        }

        // 9. Seed Delivery Zones
        const zoneCount = await strapi.db.query('api::delivery-zone.delivery-zone').count();
        if (zoneCount === 0) {
            console.log('Seeding delivery zones...');
            await strapi.entityService.create('api::delivery-zone.delivery-zone', { data: { name: 'Ciudad de México', cities: ['Ciudad de México', 'Distrito Federal'], fee: 50, minDays: 0, maxDays: 0 } });
            await strapi.entityService.create('api::delivery-zone.delivery-zone', { data: { name: 'Interior de la República', cities: ['Guadalajara', 'Monterrey'], fee: 100, minDays: 1, maxDays: 3 } });
            console.log('✅ Seeded delivery zones');
        } else {
            console.log('✅ Delivery zones already exist');
        }

    } catch (err) {
        console.error('Error during seeding:', err);
        throw err;
    } finally {
        await app.destroy();
    }
}

seed()
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    })
    .then(() => process.exit(0)); 