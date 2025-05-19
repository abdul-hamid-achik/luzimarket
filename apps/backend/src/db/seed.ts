import { db } from './index';
import * as schema from './schema';
import { reset, seed as drizzleSeed } from 'drizzle-seed';
import bcrypt from 'bcryptjs';

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

// Predefined attribute options for productVariants
const variantAttributesOptions = (() => {
    const colors = ['Red', 'Blue', 'Green', 'Black', 'White'];
    const materialsArr = ['Cotton', 'Silk', 'Wool', 'Polyester', 'Linen'];
    return colors.flatMap(color => materialsArr.map(material => ({
        color,
        material,
        weight: Math.floor(Math.random() * 1000) + 100,
    })));
})();

async function seed() {

    console.log('Resetting database...');
    await reset(db, schema);
    const seedId = Math.floor(Math.random() * 1000000);
    console.log('Seeding id:', seedId);
    // Use a random integer seed for each run to generate unique data
    await drizzleSeed(db, schema, { seed: seedId })
        .refine((f) => ({
            empleados: {
                count: 10,
                columns: {
                    nombre: f.fullName(),
                    puesto: f.valuesFromArray({
                        values: ['Gerente', 'Desarrolladora', 'Analista', 'Asistente', 'Contador', 'Director/a', 'Coordinador/a', 'Supervisor/a'],
                    }),
                    email: f.email(),
                    createdAt: f.date({ minDate: '2021-01-01', maxDate: new Date().toISOString() }),
                    updatedAt: f.date({ minDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), maxDate: new Date().toISOString() }),
                },
            },
            users: {
                count: 100,
                columns: {
                    email: f.email(),
                    password: f.default({ defaultValue: bcrypt.hashSync('Password123!', 10) }),
                    name: f.fullName(),
                    username: f.string({ isUnique: true }),
                    role: f.weightedRandom([
                        { weight: 0.85, value: f.default({ defaultValue: 'user' }) },
                        { weight: 0.05, value: f.default({ defaultValue: 'admin' }) },
                        { weight: 0.05, value: f.default({ defaultValue: 'editor' }) },
                        { weight: 0.05, value: f.default({ defaultValue: 'customer_service' }) },
                    ]),
                    createdAt: f.date({ minDate: '2022-01-01', maxDate: new Date().toISOString() }),
                },
                with: {
                    sessions: [{ weight: 1, count: [1, 3] }],
                    favorites: [{ weight: 1, count: [0, 10] }],
                    orders: [{ weight: 1, count: [1, 5] }],
                },
            },
            sessions: {
                columns: {
                    isGuest: f.boolean(),
                    createdAt: f.date({ minDate: '2023-01-01', maxDate: new Date().toISOString() }),
                },
                with: {
                    cartItems: [{ weight: 1, count: [1, 5] }],
                },
            },
            orders: {
                count: 1000,
                columns: {
                    total: f.int({ minValue: 1000, maxValue: 100000 }),
                    status: f.valuesFromArray({ values: orderStatuses }),
                    orderNumber: f.string({ isUnique: true }),
                    createdAt: f.date({ minDate: '2023-01-01', maxDate: new Date().toISOString() }),
                },
                with: {
                    orderItems: [{ weight: 1, count: [1, 5] }],
                },
            },
            categories: {
                count: giftCategories.length,
                columns: {
                    name: f.valuesFromArray({ values: giftCategories.map(c => c.name) }),
                    slug: f.valuesFromArray({ values: giftCategories.map(c => c.slug) }),
                    description: f.loremIpsum({ sentencesCount: 1 }),
                },
                with: {
                    products: [{ weight: 1, count: [5, 15] }],
                },
            },
            products: {
                count: 1000,
                columns: {
                    name: f.string(),
                    slug: f.string({ isUnique: true }),
                    description: f.loremIpsum({ sentencesCount: 2 }),
                    price: f.int({ minValue: 1000, maxValue: 20000 }),
                    createdAt: f.date({ minDate: '2023-01-01', maxDate: new Date().toISOString() }),
                },
                with: {
                    productVariants: [
                        { weight: 0.22, count: 1 },
                        { weight: 0.22, count: 2 },
                        { weight: 0.18, count: 3 },
                        { weight: 0.13, count: 4 },
                        { weight: 0.13, count: 5 },
                        { weight: 0.06, count: 6 },
                        { weight: 0.06, count: 7 }
                    ],
                    photos: [
                        { weight: 0.18, count: 1 },
                        { weight: 0.24, count: 2 },
                        { weight: 0.24, count: 3 },
                        { weight: 0.17, count: 4 },
                        { weight: 0.17, count: 5 }
                    ]
                }
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
            brands: {
                count: 15,
                columns: {
                    name: f.companyName(),
                    slug: f.string({ isUnique: true }),
                    description: f.loremIpsum({ sentencesCount: 1 }),
                    website: f.string(),
                }
            },
            occasions: {
                count: occasions.length,
                columns: {
                    name: f.valuesFromArray({ values: occasions.map(o => o.name) }),
                    description: f.valuesFromArray({ values: occasions.map(o => o.description) }),
                    slug: f.string({ isUnique: true }),
                },
            },
            editorialArticles: {
                count: 30,
                columns: {
                    title: f.loremIpsum({ sentencesCount: 1 }),
                    content: f.loremIpsum({ sentencesCount: 3 }),
                    author: f.fullName(),
                    slug: f.string({ isUnique: true }),
                    createdAt: f.date({ minDate: '2023-01-01', maxDate: new Date().toISOString() })
                }
            },
            petitions: {
                count: 50,
                columns: {
                    type: f.valuesFromArray({ values: petitionTypes }),
                    title: f.loremIpsum({ sentencesCount: 1 }),
                    description: f.loremIpsum({ sentencesCount: 2 }),
                    status: f.valuesFromArray({ values: petitionStatuses }),
                    createdAt: f.date({ minDate: '2023-01-01', maxDate: new Date().toISOString() }),
                },
            },
            bundles: {
                count: 30,
                columns: {
                    name: f.loremIpsum({ sentencesCount: 2 }),
                    description: f.loremIpsum({ sentencesCount: 2 }),
                    slug: f.string({ isUnique: true }),
                    createdAt: f.date({ minDate: '2023-01-01', maxDate: new Date().toISOString() }),
                },
                with: { bundleItems: [{ weight: 1, count: [1, 5] }] }
            },
            sizes: {
                count: sizes.length,
                columns: {
                    size: f.valuesFromArray({ values: sizes, isUnique: true }),
                },
            },
            imageCategories: {
                count: imageCategories.length,
                columns: {
                    name: f.valuesFromArray({ values: imageCategories, isUnique: true }),
                },
            },
            productTypes: {
                count: productTypes.length,
                columns: {
                    name: f.valuesFromArray({ values: productTypes, isUnique: true }),
                },
            },
            materials: {
                count: materials.length,
                columns: {
                    name: f.valuesFromArray({ values: materials, isUnique: true }),
                },
            },
            articleTopics: {
                count: articleTopics.length,
                columns: {
                    name: f.valuesFromArray({ values: articleTopics, isUnique: true }),
                },
            },
            productVariants: {
                columns: {
                    sku: f.uuid(),
                    // populate attributes initially with random JSON to satisfy not-null
                    attributes: f.json(),
                    stock: f.int({ minValue: 0, maxValue: 200 }),
                }
            },
            photos: {
                columns: {
                    url: f.default({
                        defaultValue: () => {
                            const category = imageCategories[Math.floor(Math.random() * imageCategories.length)];
                            return `https://source.unsplash.com/random/640x640?${category}&t=${Date.now()}`;
                        }
                    }),
                    alt: f.loremIpsum({ sentencesCount: 1 }),
                    sortOrder: f.int({ minValue: 0, maxValue: 10 }),
                }
            },
            orderItems: {
                columns: {
                    quantity: f.int({ minValue: 1, maxValue: 5 }),
                    price: f.int({ minValue: 1000, maxValue: 20000 }),
                }
            },
            cartItems: {
                columns: {
                    quantity: f.int({ minValue: 1, maxValue: 5 }),
                }
            },
            favorites: {
                columns: {
                    productId: f.int({ minValue: 1, maxValue: 100 }),
                    userId: f.int({ minValue: 1, maxValue: 100 }),
                    createdAt: f.date({ minDate: '2023-01-01', maxDate: new Date().toISOString() }),
                    updatedAt: f.date({ minDate: '2023-01-01', maxDate: new Date().toISOString() }),
                }
            },
            bundleItems: {
                columns: {
                    quantity: f.int({ minValue: 1, maxValue: 3 }),
                }
            }
        }));

    console.log('Database seeded successfully');
}

seed().catch((err) => {
    console.error('Error seeding database:', err.stack || err);
    process.exit(1);
}); 