import { db } from './index';
import { empleados, users, categories, products, productVariants, photos, sessions, cartItems, orders, orderItems, occasions, brands, editorialArticles, petitions, bundles, bundleItems } from './schema';
// @ts-ignore: Allow bcryptjs import without type declarations
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('Seeding database...');
    await db.delete(empleados).execute();
    await db.delete(users).execute();
    await db.delete(cartItems).execute();
    await db.delete(sessions).execute();
    await db.delete(orderItems).execute();
    await db.delete(bundleItems).execute();
    await db.delete(bundles).execute();
    await db.delete(orders).execute();
    await db.delete(photos).execute();
    await db.delete(productVariants).execute();
    await db.delete(products).execute();
    await db.delete(categories).execute();
    await db.delete(occasions).execute();
    await db.delete(brands).execute();
    await db.delete(editorialArticles).execute();
    await db.delete(petitions).execute();

    await db.insert(empleados).values([
        { nombre: 'Juan Perez', puesto: 'Gerente', email: 'juan.perez@example.com' },
        { nombre: 'Maria Lopez', puesto: 'Desarrolladora', email: 'maria.lopez@example.com' },
        { nombre: 'Carlos Ramirez', puesto: 'Analista', email: 'carlos.ramirez@example.com' }
    ]).execute();

    const passwordHash = await bcrypt.hash('AdminPassword123', 10);
    await db.insert(users).values([
        { email: 'admin@example.com', password: passwordHash, name: 'Administrator', role: 'admin' }
    ]).execute();

    // Seed categories
    await db.insert(categories).values([
        { name: 'Rosas', slug: 'rosas' },
        { name: 'Orquídeas', slug: 'orquideas' }
    ]).execute();

    // Seed occasions
    await db.insert(occasions).values([
        { name: 'Cumpleaños' },
        { name: 'Aniversario' },
        { name: 'Graduación' },
        { name: 'Navidad' }
    ]).execute();

    // Seed brands
    await db.insert(brands).values([
        { name: 'Luzimarket Originals' },
        { name: 'ElectroMax' },
        { name: 'ModaPlus' }
    ]).execute();

    // Seed editorial articles
    await db.insert(editorialArticles).values([
        { title: 'Tendencias de regalos 2025', content: 'Contenido de tendencias...' },
        { title: 'Cómo elegir el regalo perfecto', content: 'Guía para elegir regalos...' },
        { title: 'Ideas para celebraciones inolvidables', content: 'Sugerencias para celebraciones...' }
    ]).execute();

    // Seed products
    const [{ id: catId1 }] = await db.insert(products).values([
        { name: 'Ramo de Rosas', description: 'Hermoso ramo de rosas frescas', price: 4999, categoryId: 1 },
        { name: 'Orquídea Azul', description: 'Orquídeas elegantes', price: 5999, categoryId: 2 }
    ]).returning({ id: products.id }).execute();

    // Seed product variants
    const variantInsertRes = await db.insert(productVariants).values([
        { productId: 1, sku: 'ROSAS-ROJO', attributes: JSON.stringify({ color: 'rojo' }), stock: 10 },
        { productId: 2, sku: 'ORQ-AZUL', attributes: JSON.stringify({ color: 'azul' }), stock: 5 }
    ]).returning({ id: productVariants.id }).execute();

    const varId1 = variantInsertRes[0].id;
    const varId2 = variantInsertRes[1].id;

    // Seed photos
    await db.insert(photos).values([
        { url: '/images/rosas-rojo.jpg', alt: 'Rosas rojas', productId: 1 },
        { url: '/images/orquidea-azul.jpg', alt: 'Orquídea azul', productId: 2 }
    ]).execute();

    // Seed bundles
    const [{ id: bundleId }] = await db.insert(bundles).values([
        { name: 'Roses & Orchids Combo', description: 'A beautiful mix of roses and orchids' }
    ]).returning({ id: bundles.id }).execute();
    await db.insert(bundleItems).values([
        { bundleId, variantId: varId1, quantity: 1 },
        { bundleId, variantId: varId2, quantity: 1 }
    ]).execute();

    console.log('E-commerce tables seeded.');
    console.log('Database seeded successfully');
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error seeding database:', err);
        process.exit(1);
    }); 