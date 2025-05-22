import * as dotenv from 'dotenv';
dotenv.config();
import * as sqliteSchema from './schema.sqlite';
import * as postgresSchema from './schema.postgres';

// Determine effective mode (fallback to offline if no DB URL)
const DB_MODE = process.env.DB_MODE || 'online';
let effectiveMode = DB_MODE;
if (DB_MODE !== 'offline' && !process.env.DATABASE_URL) {
    effectiveMode = 'offline';
}
const schema = effectiveMode === 'offline' ? sqliteSchema : postgresSchema;

export const {
    users,
    empleados,
    categories,
    products,
    productVariants,
    photos,
    sessions,
    cartItems,
    states,
    deliveryZones,
    orders,
    orderItems,
    brands,
    occasions,
    editorialArticles,
    favorites,
    petitions,
    bundles,
    bundleItems,
    sizes,
    imageCategories,
    productTypes,
    materials,
    articleTopics
} = schema;