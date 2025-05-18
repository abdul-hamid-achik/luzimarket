import { db } from './index';
import * as schema from './schema';
import { reset, seed as drizzleSeed } from 'drizzle-seed';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

// Predefined static values
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

// Gift-specific categories
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

// Specific occasion names with descriptions
const occasions = [
    { name: 'Cumpleaños', description: 'Celebrate another year of life with our special birthday collection' },
    { name: 'Aniversario', description: 'Commemorate years of love and commitment with our anniversary selections' },
    { name: 'Graduación', description: 'Honor academic achievements with our curated graduation gifts' },
    { name: 'Navidad', description: 'Spread holiday cheer with our festive Christmas collection' },
    { name: 'Día de la Madre', description: 'Show appreciation to mothers with our thoughtful Mother\'s Day gifts' },
    { name: 'Día del Padre', description: 'Celebrate fathers with our specially selected Father\'s Day items' },
    { name: 'San Valentín', description: 'Express your love with our romantic Valentine\'s Day collection' },
    { name: 'Boda', description: 'Celebrate new beginnings with our elegant wedding gift selection' },
    { name: 'Bautizo', description: 'Mark a special christening with our carefully chosen baptism gifts' },
    { name: 'Baby Shower', description: 'Welcome new arrivals with our adorable baby shower presents' },
    { name: 'Inauguración', description: 'Celebrate new homes and businesses with our housewarming gifts' },
    { name: 'Jubilación', description: 'Honor career achievements with our thoughtful retirement presents' }
];

const roles = ['user', 'admin', 'editor', 'customer_service'];

// Categories for product images (Unsplash)
const imageCategories = [
    'gift', 'handmade', 'luxury', 'present', 'celebration',
    'flowers', 'decoration', 'elegant', 'birthday', 'custom'
];

// Product types for more realistic product names
const productTypes = [
    'Gift Box', 'Bouquet', 'Arrangement', 'Collection', 'Set',
    'Basket', 'Sampler', 'Package', 'Assortment', 'Kit'
];

// Materials for product descriptions
const materials = [
    'handcrafted', 'artisanal', 'premium', 'eco-friendly', 'sustainable',
    'recycled', 'organic', 'locally-sourced', 'fair-trade', 'luxury'
];

// Editorial article topics specific to gifting
const articleTopics = [
    'Gift Guides',
    'Occasion Ideas',
    'DIY Gift Wrapping',
    'Personalization Tips',
    'Sustainable Gifting',
    'Corporate Gift Ideas',
    'Gift Etiquette',
    'Seasonal Trends',
    'Artisan Spotlights',
    'Gift Psychology'
];

async function seed() {
    console.log('Resetting database...');
    await reset(db, schema);

    console.log('Seeding fake data with drizzle-seed and Faker...');
    await drizzleSeed(db, schema, { seed: 1234 })
        .refine((f: any) => ({
            empleados: {
                count: 10,
                columns: {
                    nombre: f.string({ transformer: () => faker.person.fullName() }),
                    puesto: f.valuesFromArray({ values: ['Gerente', 'Desarrolladora', 'Analista', 'Asistente', 'Contador', 'Director/a', 'Coordinador/a', 'Supervisor/a'] }),
                    email: f.string({
                        transformer: () => {
                            const firstName = faker.person.firstName().toLowerCase();
                            const lastName = faker.person.lastName().toLowerCase();
                            return `${firstName}.${lastName}@luzimarket.com`;
                        },
                        isUnique: true
                    }),
                    createdAt: f.timestamp({ transformer: () => faker.date.past({ years: 3 }) }),
                    updatedAt: f.timestamp({ transformer: () => faker.date.recent({ days: 60 }) }),
                },
            },
            users: {
                count: 100,
                columns: {
                    email: f.string({
                        transformer: () => {
                            const firstName = faker.person.firstName().toLowerCase();
                            const lastName = faker.person.lastName().toLowerCase();
                            return `${firstName}.${lastName}@${faker.internet.domainName()}`;
                        },
                        isUnique: true
                    }),
                    password: f.string({ transformer: () => bcrypt.hashSync('Password123!', 10) }),
                    name: f.string({ transformer: () => faker.person.fullName() }),
                    username: f.string({
                        transformer: () => {
                            // Create realistic usernames with a variety of patterns
                            const patterns = [
                                // firstname_lastname pattern
                                () => `${faker.person.firstName().toLowerCase()}_${faker.person.lastName().toLowerCase()}`,
                                // firstinitial.lastname pattern
                                () => `${faker.person.firstName().charAt(0).toLowerCase()}.${faker.person.lastName().toLowerCase()}`,
                                // firstname+number pattern
                                () => `${faker.person.firstName().toLowerCase()}${faker.number.int({ min: 1, max: 999 })}`,
                                // custom handle with word
                                () => `${faker.word.adjective()}${faker.word.noun()}${faker.number.int({ min: 1, max: 99 })}`,
                                // hobby based
                                () => {
                                    const hobbies = ['gifter', 'shopper', 'collector', 'crafter', 'giver', 'maker', 'finder'];
                                    return `${faker.person.firstName().toLowerCase()}_${faker.helpers.arrayElement(hobbies)}`;
                                }
                            ];
                            return faker.helpers.arrayElement(patterns)();
                        },
                        isUnique: true
                    }),
                    role: f.string({
                        transformer: () => faker.helpers.weightedArrayElement([
                            { weight: 85, value: 'user' },
                            { weight: 5, value: 'admin' },
                            { weight: 5, value: 'editor' },
                            { weight: 5, value: 'customer_service' },
                        ])
                    }),
                    createdAt: f.timestamp({ transformer: () => faker.date.past({ years: 2 }) }),
                },
            },
            categories: {
                count: giftCategories.length,
                columns: {
                    name: f.valuesFromArray({
                        values: giftCategories.map(cat => cat.name)
                    }),
                    slug: f.valuesFromArray({
                        values: giftCategories.map(cat => cat.slug)
                    }),
                    description: f.string({
                        transformer: (_: unknown, i: number) => {
                            const category = giftCategories[i % giftCategories.length];
                            return `Explore our collection of ${category.name.toLowerCase()} for every special occasion. Find the perfect ${category.name.toLowerCase()} to express your sentiments.`;
                        }
                    }),
                },
            },
            occasions: {
                count: occasions.length,
                columns: {
                    name: f.valuesFromArray({ values: occasions.map(occ => occ.name) }),
                    description: f.valuesFromArray({ values: occasions.map(occ => occ.description) }),
                    slug: f.string({
                        transformer: (_: unknown, i: number) => {
                            return faker.helpers.slugify(occasions[i % occasions.length].name).toLowerCase();
                        }
                    }),
                },
            },
            brands: {
                count: 15,
                columns: {
                    name: f.string({
                        transformer: () => {
                            const patterns = [
                                // Company style names
                                () => faker.company.name(),
                                // Descriptive style
                                () => `${faker.word.adjective()} ${faker.commerce.productMaterial()}`,
                                // Family style
                                () => `${faker.person.lastName()} & ${faker.person.lastName()}`,
                                // Product focused
                                () => `${faker.word.adjective()} ${faker.commerce.productAdjective()} ${faker.commerce.product()}`
                            ];
                            return faker.helpers.arrayElement(patterns)();
                        }
                    }),
                    description: f.string({
                        transformer: () => {
                            const year = faker.date.past({ years: 30 }).getFullYear();
                            return `Established in ${year}, we specialize in ${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} products designed to ${faker.word.verb()} and ${faker.word.verb()}.`;
                        }
                    }),
                    website: f.string({
                        transformer: (_: unknown, i: number) => {
                            // Create a website URL based on the brand name
                            const domain = faker.internet.domainName();
                            return `https://www.${domain}`;
                        }
                    }),
                },
            },
            editorialArticles: {
                count: 30,
                columns: {
                    title: f.string({
                        transformer: () => {
                            const topic = faker.helpers.arrayElement(articleTopics);
                            const patterns = [
                                `Top 10 ${topic} for ${faker.helpers.arrayElement(occasions).name}`,
                                `The Ultimate Guide to ${topic}`,
                                `How to Choose the Perfect ${faker.commerce.product()} for Any Occasion`,
                                `${faker.number.int({ min: 5, max: 15 })} ${faker.word.adjective()} ${topic} You Need to Know About`,
                                `${topic}: A Complete Guide for ${faker.date.future().getFullYear()}`,
                                `The Art of ${topic}: Tips from the Experts`
                            ];
                            return faker.helpers.arrayElement(patterns);
                        }
                    }),
                    content: f.string({
                        transformer: () => {
                            const intro = faker.lorem.paragraph(2);
                            const mainContent = `## Why This Matters\n\n${faker.lorem.paragraph(3)}\n\n### Key Points to Remember\n\n${faker.lorem.paragraph(2)}\n\n`;
                            const listItems = Array.from({ length: 4 }, (_, i) => `* ${faker.lorem.sentence()}`).join('\n');
                            const conclusion = `\n\n## Final Thoughts\n\n${faker.lorem.paragraph(2)}`;

                            return `${intro}\n\n${mainContent}${listItems}${conclusion}`;
                        }
                    }),
                    author: f.string({ transformer: () => faker.person.fullName() }),
                    slug: f.string({
                        transformer: () => {
                            const topic = faker.helpers.arrayElement(articleTopics);
                            return faker.helpers.slugify(`${topic} ${faker.lorem.words(3)}`).toLowerCase();
                        },
                        isUnique: true
                    }),
                    createdAt: f.timestamp({ transformer: () => faker.date.past({ years: 1 }) }),
                },
            },
            petitions: {
                count: 40,
                columns: {
                    type: f.valuesFromArray({ values: petitionTypes }),
                    title: f.string({
                        transformer: () => {
                            const prefixes = ['Solicitud de', 'Petición para', 'Consulta sobre', 'Sugerencia para', 'Problema con'];
                            return `${faker.helpers.arrayElement(prefixes)} ${faker.commerce.productName()}`;
                        }
                    }),
                    description: f.string({ transformer: () => faker.lorem.paragraphs(2) }),
                    status: f.valuesFromArray({ values: petitionStatuses }),
                    createdAt: f.timestamp({ transformer: () => faker.date.recent({ days: 90 }) }),
                },
            },
            products: {
                count: 100,
                columns: {
                    name: f.string({
                        transformer: () => {
                            const adjective = faker.commerce.productAdjective();
                            const material = faker.helpers.arrayElement(materials);
                            const product = faker.commerce.product();
                            const type = faker.helpers.arrayElement(productTypes);

                            return `${adjective} ${material} ${product} ${type}`;
                        }
                    }),
                    description: f.string({
                        transformer: () => {
                            const paragraph1 = `This ${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} ${faker.commerce.product()} is perfect for ${faker.word.adjective()} occasions.`;
                            const paragraph2 = `Made with ${faker.helpers.arrayElement(materials)} materials and designed with ${faker.commerce.productAdjective()} detail.`;
                            const features = [
                                `Premium ${faker.commerce.productMaterial()} construction`,
                                `${faker.commerce.productAdjective()} finish`,
                                `Perfect gift for ${faker.helpers.arrayElement(occasions).name}`,
                                `Includes ${faker.commerce.productAdjective()} packaging`
                            ];

                            return `${paragraph1} ${paragraph2}\n\nFeatures:\n- ${features.join('\n- ')}`;
                        }
                    }),
                    price: f.int({
                        transformer: () => {
                            // More realistic pricing - ending in common price points
                            const basePrice = faker.number.int({ min: 10, max: 200 });
                            const cents = faker.helpers.arrayElement([95, 99, 50, 0]);
                            return basePrice * 100 + cents;
                        }
                    }),
                    slug: f.string({
                        transformer: () => {
                            return faker.helpers.slugify(`${faker.commerce.productAdjective()} ${faker.commerce.product()} ${faker.string.numeric(3)}`).toLowerCase();
                        },
                        isUnique: true
                    }),
                    categoryId: f.int({ minValue: 1, maxValue: giftCategories.length }),
                    createdAt: f.timestamp({ transformer: () => faker.date.past({ years: 1 }) }),
                },
                with: {
                    photos: [
                        { weight: 0.2, count: 1 },
                        { weight: 0.3, count: 2 },
                        { weight: 0.3, count: 3 },
                        { weight: 0.1, count: 4 },
                        { weight: 0.1, count: 5 },
                    ],
                },
            },
            photos: {
                columns: {
                    url: f.string({
                        transformer: () => {
                            const width = faker.helpers.arrayElement([600, 800, 1024]);
                            const height = faker.helpers.arrayElement([400, 600, 768]);
                            const category = faker.helpers.arrayElement(imageCategories);
                            return `https://source.unsplash.com/${width}x${height}/?${category}`;
                        }
                    }),
                    alt: f.string({ transformer: () => `${faker.commerce.productAdjective()} ${faker.commerce.product()} - ${faker.word.words(2)}` }),
                    sortOrder: f.int({ minValue: 0, maxValue: 5 }),
                    title: f.string({ transformer: () => `${faker.commerce.productName()} Image` }),
                },
            },
            productVariants: {
                count: 200,
                columns: {
                    productId: f.int({ minValue: 1, maxValue: 100 }),
                    sku: f.string({
                        transformer: () => {
                            // Generate realistic SKU: 2 letters + 6 numbers
                            const letters = faker.string.alpha({ length: 2, casing: 'upper' });
                            const numbers = faker.string.numeric(6);
                            return `${letters}-${numbers}`;
                        },
                        isUnique: true
                    }),
                    title: f.string({
                        transformer: () => {
                            const color = faker.color.human();
                            const size = faker.helpers.arrayElement(sizes);
                            return `${color} / ${size}`;
                        }
                    }),
                    attributes: f.string({
                        transformer: () => JSON.stringify({
                            color: faker.color.human(),
                            size: faker.helpers.arrayElement(sizes),
                            material: faker.commerce.productMaterial(),
                            weight: `${faker.number.float({ min: 0.1, max: 5.0, fractionDigits: 1 })} kg`
                        })
                    }),
                    stock: f.int({
                        transformer: () => {
                            // More realistic inventory patterns
                            return faker.helpers.weightedArrayElement([
                                { weight: 0.7, value: faker.number.int({ min: 5, max: 100 }) }, // Normal stock
                                { weight: 0.15, value: faker.number.int({ min: 100, max: 500 }) }, // High stock
                                { weight: 0.1, value: faker.number.int({ min: 1, max: 5 }) }, // Low stock
                                { weight: 0.05, value: 0 } // Out of stock
                            ]);
                        }
                    }),
                },
            },
            sessions: {
                count: 150,
                columns: {
                    userId: f.int({ minValue: 1, maxValue: 100 }),
                    isGuest: f.boolean({
                        transformer: () => faker.helpers.weightedArrayElement([
                            { weight: 0.7, value: false },
                            { weight: 0.3, value: true },
                        ])
                    }),
                    createdAt: f.timestamp({ transformer: () => faker.date.recent({ days: 30 }) }),
                },
            },
            cartItems: {
                count: 500,
                columns: {
                    sessionId: f.int({ minValue: 1, maxValue: 150 }),
                    variantId: f.int({ minValue: 1, maxValue: 200 }),
                    quantity: f.int({
                        transformer: () => faker.helpers.weightedArrayElement([
                            { weight: 0.6, value: 1 },
                            { weight: 0.25, value: 2 },
                            { weight: 0.1, value: 3 },
                            { weight: 0.05, value: faker.number.int({ min: 4, max: 10 }) },
                        ])
                    }),
                },
            },
            orders: {
                count: 150,
                columns: {
                    userId: f.int({ minValue: 1, maxValue: 100 }),
                    total: f.int({ minValue: 1000, maxValue: 100000 }),
                    status: f.string({
                        transformer: () => faker.helpers.weightedArrayElement([
                            { weight: 0.2, value: 'pending' },
                            { weight: 0.1, value: 'processing' },
                            { weight: 0.2, value: 'shipped' },
                            { weight: 0.4, value: 'delivered' },
                            { weight: 0.05, value: 'cancelled' },
                            { weight: 0.05, value: 'returned' },
                        ])
                    }),
                    orderNumber: f.string({
                        transformer: () => {
                            // Generate realistic order number: LM-YEAR-NUMBER format
                            const year = faker.date.recent().getFullYear().toString().slice(2);
                            const number = faker.string.numeric(6);
                            return `LM-${year}-${number}`;
                        },
                        isUnique: true
                    }),
                    createdAt: f.timestamp({ transformer: () => faker.date.past({ years: 1 }) }),
                },
            },
            orderItems: {
                count: 500,
                columns: {
                    orderId: f.int({ minValue: 1, maxValue: 150 }),
                    variantId: f.int({ minValue: 1, maxValue: 200 }),
                    quantity: f.int({ minValue: 1, maxValue: 5 }),
                    price: f.int({
                        transformer: () => {
                            // More realistic pricing - ending in common price points
                            const basePrice = faker.number.int({ min: 10, max: 200 });
                            const cents = faker.helpers.arrayElement([95, 99, 50, 0]);
                            return basePrice * 100 + cents;
                        }
                    }),
                },
            },
            bundles: {
                count: 30,
                columns: {
                    name: f.string({
                        transformer: () => {
                            const adjectives = [
                                'Ultimate', 'Premium', 'Luxury', 'Essential', 'Complete',
                                'Seasonal', 'Holiday', 'Special', 'Exclusive', 'Limited Edition'
                            ];
                            const bundleTypes = [
                                'Gift Set', 'Collection', 'Bundle', 'Package', 'Assortment',
                                'Selection', 'Combo', 'Kit', 'Box', 'Hamper'
                            ];

                            return `${faker.helpers.arrayElement(adjectives)} ${faker.commerce.productAdjective()} ${faker.helpers.arrayElement(bundleTypes)}`;
                        }
                    }),
                    description: f.string({
                        transformer: () => {
                            const intro = `This ${faker.commerce.productAdjective()} bundle features a selection of our finest products.`;
                            const bundle = `Perfect for ${faker.helpers.arrayElement(occasions).name} or any special occasion!`;
                            const includes = [
                                `${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
                                `${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
                                `${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
                                `${faker.commerce.productMaterial()} ${faker.commerce.product()}`
                            ];

                            return `${intro} ${bundle}\n\nIncludes:\n- ${includes.join('\n- ')}`;
                        }
                    }),
                    slug: f.string({
                        transformer: () => {
                            const adjective = faker.commerce.productAdjective();
                            const bundleType = faker.helpers.arrayElement(['gift-set', 'collection', 'bundle', 'package']);
                            return `${faker.helpers.slugify(adjective)}-${bundleType}-${faker.string.numeric(3)}`;
                        },
                        isUnique: true
                    }),
                    createdAt: f.timestamp({ transformer: () => faker.date.past({ years: 1 }) }),
                },
            },
            bundleItems: {
                count: 600,
                columns: {
                    bundleId: f.int({ minValue: 1, maxValue: 30 }),
                    variantId: f.int({ minValue: 1, maxValue: 200 }),
                    quantity: f.int({
                        transformer: () => faker.helpers.weightedArrayElement([
                            { weight: 0.7, value: 1 },
                            { weight: 0.2, value: 2 },
                            { weight: 0.1, value: faker.number.int({ min: 3, max: 5 }) },
                        ])
                    }),
                },
            },
            states: {
                count: statesData.length,
                columns: {
                    label: f.valuesFromArray({ values: statesData.map(s => s.label) }),
                    value: f.valuesFromArray({ values: statesData.map(s => s.value) }),
                },
            },
            deliveryZones: {
                count: deliveryZonesData.length,
                columns: {
                    name: f.valuesFromArray({ values: deliveryZonesData.map(z => z.name) }),
                    fee: f.valuesFromArray({ values: deliveryZonesData.map(z => z.fee) }),
                },
            },
        }));

    console.log('Database seeded successfully');
}

seed().catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
}); 