import { db } from './index';
import * as schema from './schema';
import { reset, seed as drizzleSeed } from 'drizzle-seed';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

// Predefined static values
const sizes = ['S', 'M', 'L', 'XL'];
const orderStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
const petitionTypes = ['Question', 'Complaint', 'Feedback'];
const petitionStatuses = ['pending', 'approved', 'rejected'];
const occasionNames = ['Cumpleaños', 'Aniversario', 'Graduación', 'Navidad', 'Día de la Madre', 'Día del Padre', 'San Valentín'];
const roles = ['user', 'admin'];
// Gift-specific product names
const giftItems = [
    'Bouquet of Roses',
    'Artisanal Chocolate Box',
    'Handmade Soap Set',
    'Light Scented Candle',
    'Floral Arrangement',
    'Gift Basket',
    'Spa Gift Set',
    'Tea Sampler Box',
    'Gourmet Cookie Tin',
    'Succulent Planter',
];
// Categories for gift images (Unsplash)
const imageCategories = [
    'flowers',
    'bouquet',
    'chocolate',
    'soap',
    'candle',
    'gift',
    'spa',
    'tea',
    'cookie',
    'plant',
];

// Generate a pool of random variant attributes for JSON column
const attributeOptions = Array.from({ length: 200 }, () => ({
    color: faker.color.human(),
    size: faker.helpers.arrayElement(sizes),
}));

async function seed() {
    console.log('Resetting database...');
    await reset(db, schema);

    console.log('Seeding fake data with drizzle-seed and Faker...');
    await drizzleSeed(db, schema, { seed: 1234, disableForeignKeys: true })
        .refine((f: any) => ({
            empleados: {
                count: 10,
                columns: {
                    nombre: f.string({ transformer: () => faker.name.findName() }),
                    puesto: f.valuesFromArray({ values: ['Gerente', 'Desarrolladora', 'Analista', 'Asistente', 'Contador'] }),
                    email: f.string({ transformer: () => faker.internet.email(), isUnique: true }),
                    createdAt: f.timestamp(),
                    updatedAt: f.timestamp(),
                },
            },
            users: {
                count: 100,
                columns: {
                    email: f.string({ transformer: () => faker.internet.email(), isUnique: true }),
                    password: f.string({ transformer: () => bcrypt.hashSync(faker.internet.password(), 10) }),
                    name: f.string({ transformer: () => faker.name.findName() }),
                    role: f.valuesFromArray({ values: roles, weights: [90, 10] }),
                    createdAt: f.timestamp(),
                },
            },
            categories: {
                count: 10,
                columns: {
                    name: f.string({ transformer: () => faker.commerce.department() }),
                    slug: f.string({ transformer: () => faker.helpers.slugify(faker.commerce.department()).toLowerCase() }),
                },
            },
            occasions: {
                count: occasionNames.length,
                columns: {
                    name: f.valuesFromArray({ values: occasionNames }),
                },
            },
            brands: {
                count: 15,
                columns: {
                    name: f.string({ transformer: () => faker.company.companyName() }),
                },
            },
            editorialArticles: {
                count: 30,
                columns: {
                    title: f.string({ transformer: () => faker.lorem.sentence() }),
                    content: f.string({ transformer: () => faker.lorem.paragraphs(2) }),
                },
            },
            petitions: {
                count: 40,
                columns: {
                    type: f.valuesFromArray({ values: petitionTypes }),
                    title: f.string({ transformer: () => faker.lorem.sentence() }),
                    description: f.string({ transformer: () => faker.lorem.paragraph() }),
                    status: f.valuesFromArray({ values: petitionStatuses }),
                    createdAt: f.timestamp(),
                },
            },
            products: {
                count: 100,
                columns: {
                    name: f.valuesFromArray({ values: giftItems }),
                    description: f.string({ transformer: () => `Perfect gift: ${faker.lorem.sentence()}` }),
                    price: f.int({ minValue: 1000, maxValue: 20000 }),
                    categoryId: f.int({ minValue: 1, maxValue: 10 }),
                    createdAt: f.timestamp(),
                },
                with: {
                    photos: {
                        count: [1, 5],
                        columns: {
                            url: f.string({ transformer: () => `https://source.unsplash.com/640x480/?${faker.helpers.arrayElement(imageCategories)}` }),
                            alt: f.string({ transformer: () => faker.lorem.words(3) }),
                            sortOrder: f.int({ minValue: 0, maxValue: 5 }),
                        },
                    },
                },
            },
            productVariants: {
                count: 200,
                columns: {
                    productId: f.int({ minValue: 1, maxValue: 100 }),
                    sku: f.string({ transformer: () => faker.random.alphaNumeric(8).toUpperCase(), isUnique: true }),
                    attributes: f.valuesFromArray({ values: attributeOptions }),
                    stock: f.int({ minValue: 0, maxValue: 500 }),
                },
            },
            sessions: {
                count: 150,
                columns: {
                    userId: f.int({ minValue: 1, maxValue: 100 }),
                    isGuest: f.boolean(),
                    createdAt: f.timestamp(),
                },
            },
            cartItems: {
                count: 500,
                columns: {
                    sessionId: f.int({ minValue: 1, maxValue: 150 }),
                    variantId: f.int({ minValue: 1, maxValue: 200 }),
                    quantity: f.int({ minValue: 1, maxValue: 5 }),
                },
            },
            orders: {
                count: 150,
                columns: {
                    userId: f.int({ minValue: 1, maxValue: 100 }),
                    total: f.int({ minValue: 1000, maxValue: 100000 }),
                    status: f.valuesFromArray({ values: orderStatuses }),
                    createdAt: f.timestamp(),
                },
            },
            orderItems: {
                count: 500,
                columns: {
                    orderId: f.int({ minValue: 1, maxValue: 150 }),
                    variantId: f.int({ minValue: 1, maxValue: 200 }),
                    quantity: f.int({ minValue: 1, maxValue: 5 }),
                    price: f.int({ minValue: 1000, maxValue: 20000 }),
                },
            },
            bundles: {
                count: 30,
                columns: {
                    name: f.string({ transformer: () => faker.commerce.productName() }),
                    description: f.string({ transformer: () => faker.commerce.productDescription() }),
                    createdAt: f.timestamp(),
                },
            },
            bundleItems: {
                count: 600,
                columns: {
                    bundleId: f.int({ minValue: 1, maxValue: 30 }),
                    variantId: f.int({ minValue: 1, maxValue: 200 }),
                    quantity: f.int({ minValue: 1, maxValue: 5 }),
                },
            },
        }));

    console.log('Database seeded successfully');
}

seed().catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
}); 