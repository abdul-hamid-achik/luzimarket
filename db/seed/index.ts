import { config } from "dotenv";
import { reset, seed as drizzleSeed } from "drizzle-seed";
import { fakerES_MX as faker } from "@faker-js/faker";
import * as schema from "../schema";
import { generateAndUploadImage, generateProductImagePrompt, generateCategoryImagePrompt } from "../../lib/openai";
import { eq, sql } from "drizzle-orm";
import slugify from "slugify";
import bcrypt from "bcryptjs";
import { initializeShippingData } from "../../lib/actions/shipping";

// Load environment variables before importing db
config({ path: ".env.local" });

import { db } from "../index";

// Progress bar helpers (lazy-loaded to avoid breaking CI/non-TTY)
type ProgressControls = { start: (total: number, label: string) => any; tick: (inc?: number) => void; stop: () => void; enabled: boolean };
async function createProgressControls(): Promise<ProgressControls> {
  const progressEnabled = process.stdout.isTTY && !process.env.CI && !process.argv.includes('--no-progress');
  if (!progressEnabled) {
    return {
      enabled: false,
      start: () => null,
      tick: () => { },
      stop: () => { },
    };
  }
  try {
    const cli = await import('cli-progress');
    let bar: any = null;
    return {
      enabled: true,
      start: (total: number, label: string) => {
        bar = new (cli as any).SingleBar({
          format: `${label} [{bar}] {value}/{total}`,
          hideCursor: true,
        }, (cli as any).Presets.rect);
        bar.start(total, 0);
        return bar;
      },
      tick: (inc: number = 1) => {
        bar && bar.increment(inc);
      },
      stop: () => {
        bar && bar.stop();
        bar = null;
      }
    };
  } catch {
    return {
      enabled: false,
      start: () => null,
      tick: () => { },
      stop: () => { },
    };
  }
}

type ImageMode = 'ai' | 'placeholders' | 'none';

// Simple CLI arg helpers (no deps)
function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function getFlagValue(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    const val = process.argv[idx + 1];
    if (!val.startsWith('--')) return val;
  }
  return undefined;
}

function resolveImageMode(): ImageMode {
  // Unified flag: --images [none|placeholders|ai]
  const imagesArg = (getFlagValue('--images') || '').toLowerCase();
  if (imagesArg === 'none') return 'none';
  if (imagesArg === 'placeholders') return 'placeholders';
  if (imagesArg === 'ai') return 'ai';

  // Backward compatible aliases
  if (hasFlag('--no-images')) return 'none';
  if (hasFlag('--placeholders')) return 'placeholders';
  if (hasFlag('--ai')) return 'ai';

  // Deprecated env override
  if (process.env.SEED_IMAGE_MODE) {
    const envMode = (process.env.SEED_IMAGE_MODE || '').toLowerCase();
    console.warn("⚠️  SEED_IMAGE_MODE is deprecated. Use --images [none|placeholders|ai] instead.");
    if (envMode === 'none') return 'none';
    if (envMode === 'placeholders') return 'placeholders';
    if (envMode === 'ai') return 'ai';
  }

  // Default behavior: placeholders in dev, AI in prod if key exists
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && process.env.OPENAI_SECRET_KEY) return 'ai';
  return 'placeholders';
}

function isProbablyProdEnvironment(): boolean {
  const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  // Treat any non-localhost URL as production-ish
  return process.env.NODE_ENV === 'production' || (!!url && !url.includes('localhost'));
}

function buildPlaceholderImageUrl(kind: 'category' | 'product', slug: string): string {
  // Deterministic selection of a few curated Unsplash image IDs
  const productImageIds = [
    'photo-1542291026-7eec264c27ff', // generic flowers
    'photo-1519681393784-d120267933ba', // gift box
    'photo-1504754524776-8f4f37790ca0', // chocolate
    // Removed two IDs that currently 404 from Unsplash
    // 'photo-1519681394823-2bda8d494253', // candles
    // 'photo-1512291319326-9f4cebe47745', // jewelry
    'photo-1486427944299-d1955d23e34d', // decor
  ];
  const categoryImageIds = [
    'photo-1525182008055-f88b95ff7980',
    'photo-1481833761820-0509d3217039',
    'photo-1491553895911-0055eca6402d',
    'photo-1503602642458-232111445657',
    'photo-1442458017215-285b83f65851',
  ];

  const ids = kind === 'category' ? categoryImageIds : productImageIds;
  const hash = Array.from(slug).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const id = ids[hash % ids.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1024&q=60&ixlib=rb-4.0.3`;
}

// Set a fixed seed for consistent data generation
faker.seed(12345);


// Fixed data
const CATEGORIES = [
  {
    name: "Flores y Arreglos",
    slug: "flores-arreglos",
    description: "Hermosos arreglos florales para toda ocasión: cumpleaños, aniversarios, condolencias y más",
    imageUrl: null, // Will be generated with AI
    displayOrder: 1
  },
  {
    name: "Chocolates y Dulces",
    slug: "chocolates-dulces",
    description: "Deliciosos chocolates artesanales, bombones y dulces gourmet",
    imageUrl: null, // Will be generated with AI
    displayOrder: 2
  },
  {
    name: "Velas y Aromas",
    slug: "velas-aromas",
    description: "Velas aromáticas, difusores y productos para crear ambientes especiales",
    imageUrl: null, // Will be generated with AI
    displayOrder: 3
  },
  {
    name: "Regalos Personalizados",
    slug: "regalos-personalizados",
    description: "Regalos únicos y personalizados para ocasiones especiales",
    imageUrl: null, // Will be generated with AI
    displayOrder: 4
  },
  {
    name: "Cajas de Regalo",
    slug: "cajas-regalo",
    description: "Cajas curadas con productos selectos para regalar",
    imageUrl: null, // Will be generated with AI
    displayOrder: 5
  },
  {
    name: "Decoración y Hogar",
    slug: "decoracion-hogar",
    description: "Artículos decorativos y accesorios para el hogar",
    imageUrl: null, // Will be generated with AI
    displayOrder: 6
  },

];

const PRODUCT_NAMES = [
  // Flores y Arreglos
  "Ramo de Rosas Premium",
  "Bouquet de Girasoles",
  "Orquídea en Maceta",
  "Arreglo Floral Primaveral",
  "Ramo de Tulipanes",
  "Centro de Mesa Floral",
  "Bouquet de Peonías",
  "Arreglo de Flores Silvestres",
  "Ramo de Lirios Blancos",
  "Arreglo de Alcatraces",
  "Bouquet de Gerberas",
  "Corona Floral",
  "Ramo de Lavanda",
  "Arreglo de Suculentas",
  "Bouquet de Flores Mixtas",

  // Chocolates y Dulces
  "Caja de Chocolates Artesanales",
  "Trufas de Chocolate Belga",
  "Chocolates Ferrero Rocher",
  "Brownies Artesanales",
  "Bombones de Licor",
  "Chocolate Oaxaqueño",
  "Macarons Franceses",
  "Galletas Decoradas",
  "Paletas de Chocolate",
  "Caja de Chocolates Suizos",
  "Dulces Típicos Mexicanos",
  "Chocolates Rellenos",
  "Barras de Chocolate Gourmet",
  "Pretzels Cubiertos",
  "Chocolates Sin Azúcar",

  // Velas y Aromas
  "Vela Aromática de Lavanda",
  "Set de Velas Aromáticas",
  "Difusor de Aromas",
  "Vela de Soya Natural",
  "Incienso Natural",
  "Aceites Esenciales",
  "Vela de Masaje",
  "Aromatizador de Ambiente",
  "Velas Flotantes",
  "Set de Spa Aromático",
  "Vela de Citronela",
  "Difusor de Bambú",
  "Sales de Baño Aromáticas",
  "Potpurrí Natural",
  "Velas Decorativas",

  // Regalos Personalizados
  "Album Fotográfico Personalizado",
  "Taza Personalizada",
  "Marco Digital Inteligente",
  "Libro de Recuerdos",
  "Cojín Personalizado",
  "Llavero Grabado",
  "Placa Conmemorativa",
  "Retrato Personalizado",
  "Joyero Grabado",
  "Reloj Personalizado",
  "Termo Personalizado",
  "Agenda Personalizada",
  "Funda de Celular Personalizada",
  "Puzzle Personalizado",
  "Manta Personalizada",

  // Cajas de Regalo
  "Caja Regalo Spa",
  "Caja Desayuno Sorpresa",
  "Caja Romántica",
  "Kit de Café Especialidad",
  "Caja de Té Premium",
  "Box de Cuidado Personal",
  "Caja de Vinos",
  "Kit de Barbacoa",
  "Caja de Snacks Gourmet",
  "Box de Productos Orgánicos",
  "Caja de Cerveza Artesanal",
  "Kit de Coctelería",
  "Box de Productos Mexicanos",
  "Caja de Bienestar",
  "Kit de Arte y Manualidades",

  // Decoración y Hogar
  "Jarrón de Talavera",
  "Espejo Decorativo",
  "Maceta Artesanal",
  "Cuadro Decorativo",
  "Tapete Artesanal",
  "Lámpara Decorativa",
  "Reloj de Pared",
  "Portavelas de Cristal",
  "Cesta Decorativa",
  "Figura Decorativa",
  "Cortina de Macramé",
  "Portarretratos Vintage",
  "Adorno de Mesa",
  "Móvil Decorativo",
  "Escultura Artesanal",

  // Joyería y Accesorios
  "Collar de Plata",
  "Pulsera de Oro",
  "Aretes de Perlas",
  "Anillo de Compromiso",
  "Reloj de Lujo",
  "Brazalete de Cuero",
  "Dije de Plata",
  "Cadena de Oro",
  "Anillo de Plata",
  "Broche Vintage",
  "Gemelos de Plata",
  "Tobillera de Oro",
  "Piercing de Oro",
  "Set de Joyería",
  "Collar de Piedras Preciosas",

  // Gourmet y Delicatessen
  "Canasta Gourmet Premium",
  "Tabla de Quesos Gourmet",
  "Vino Tinto Reserva",
  "Aceite de Oliva Extra Virgen",
  "Miel Artesanal",
  "Mermeladas Gourmet",
  "Café de Especialidad",
  "Té Premium Importado",
  "Especias Exóticas",
  "Conservas Gourmet",
  "Vinagre Balsámico",
  "Pasta Italiana Premium",
  "Caviar Premium",
  "Jamón Serrano",
  "Queso Artesanal"
];

// Realistic price ranges for each category (in MXN)
const CATEGORY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  "flores-arreglos": { min: 399, max: 2499 },
  "chocolates-dulces": { min: 199, max: 999 },
  "velas-aromas": { min: 149, max: 599 },
  "regalos-personalizados": { min: 299, max: 1499 },
  "cajas-regalo": { min: 499, max: 2999 },
  "decoracion-hogar": { min: 299, max: 1999 },
  "joyeria-accesorios": { min: 599, max: 4999 },
  "gourmet-delicatessen": { min: 399, max: 2499 }
};

const BUSINESS_HOURS = [
  "Lun-Sab: 8:00-20:00, Dom: 9:00-18:00",
  "Lun-Vie: 10:00-19:00, Sab: 10:00-17:00",
  "Lun-Vie: 11:00-19:00, Sab: 11:00-16:00",
  "Lun-Dom: 9:00-21:00",
  "Mar-Dom: 10:00-18:00"
];

const STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const CITIES = [
  "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro", "Tijuana", "León",
  "Cancún", "Mérida", "Toluca", "Chihuahua", "Aguascalientes", "San Luis Potosí", "Saltillo",
  "Hermosillo", "Culiacán", "Morelia", "Cuernavaca", "Durango", "Veracruz", "Xalapa",
  "Villahermosa", "Tuxtla Gutiérrez", "Oaxaca", "Acapulco", "Tampico", "Mazatlán", "Ensenada",
  "Mexicali", "La Paz", "Playa del Carmen", "Tepic", "Colima", "Zacatecas", "Pachuca", "Irapuato"
];

function generateMxPhone(): string {
  const area = faker.number.int({ min: 10, max: 99 }).toString().padStart(2, '0');
  const part1 = faker.string.numeric(4);
  const part2 = faker.string.numeric(4);
  return `+52 ${area} ${part1} ${part2}`;
}

const VENDOR_PREFIXES = [
  "Boutique", "Casa", "Tienda", "Atelier", "Estudio", "Galería", "Rincón",
  "Jardín", "Tesoro", "Arte", "Dulce", "Bella", "Luna", "Sol", "Magia"
];

const VENDOR_SUFFIXES = [
  "de Regalos", "Floral", "Gourmet", "Artesanal", "Creativo", "Exclusivo",
  "Premium", "Deluxe", "& Co.", "Mexicano", "Boutique", "Studio", "Express"
];

async function main() {
  console.log("🌱 Starting seed...");

  // Available command line flags:
  // --no-reset: Skip database reset
  // --no-images: Skip AI image generation
  // --force-images: Force regenerate existing images
  // --fast: Limit image generation to 10 items for testing
  // --placeholders: Force placeholder images instead of AI
  // --ai: Force AI images (if key is present)
  // --images [none|placeholders|ai]: Unified image mode flag (preferred)
  // --images-limit <n>: Limit number of products to image (preferred over --fast)
  // --allow-prod: Allow running in production-like environments 
  // --financials [auto|force|skip]: Control platform fees/transactions/payouts generation

  // Safety guard to avoid seeding production accidentally
  const allowProd = hasFlag('--allow-prod')
  if (isProbablyProdEnvironment() && !allowProd) {
    console.error("❌ Refusing to run seed in production-like environment. Set SEED_ALLOW_PROD=1 to override.");
    process.exit(1);
  }

  if (hasFlag('--help')) {
    console.log(`\nUsage: tsx db/seed.ts [options]\n\nOptions:\n  --no-reset                 Skip database reset\n  --images [mode]            Image mode: none | placeholders | ai\n  --images-limit <n>         Limit number of products to generate images for\n  --force-images             Force regenerate images even if present\n  --fast                     Alias for --images-limit 10\n  --financials [auto|force|skip]  Control financials seeding\n  --allow-prod               Allow running in production-like environment\n  --drizzle-seed | --auto    Use drizzle-seed automatic generators\n  --count <n>                Count for drizzle-seed auto mode\n  --seed <n>                 Seed value for deterministic generation\n  --no-progress              Disable progress bar output\n  --help                     Show this help\n`);
    process.exit(0);
  }

  // Check command line flags
  const shouldReset = !process.argv.includes('--no-reset');
  const useDrizzleSeed = hasFlag('--drizzle-seed') || hasFlag('--auto');
  const imageMode = resolveImageMode();
  const shouldGenerateAIImages = imageMode === 'ai' && !!process.env.OPENAI_SECRET_KEY && !hasFlag('--no-images');
  const forceRegenerateImages = hasFlag('--force-images'); // Force regenerate existing images
  const imagesLimitArg = getFlagValue('--images-limit');
  const imageBatchSize = imagesLimitArg ? Math.max(0, parseInt(imagesLimitArg, 10) || 0) : (hasFlag('--fast') ? 10 : 100);

  try {
    // Reset database if needed
    if (shouldReset) {
      console.log("🧹 Resetting database...");

      // Use drizzle-seed reset with node-postgres driver for compatibility
      try {
        // Import node-postgres driver only when needed
        const { drizzle } = await import('drizzle-orm/node-postgres');
        const { Client } = await import('pg');

        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not set for reset');
        }

        // Create a temporary connection with node-postgres for reset
        // Accept self-signed certs in Neon Local / localhost
        const allowSelfSigned = process.env.PGSSLMODE === 'no-verify' || process.env.NEON_LOCAL === '1';
        const client = new Client({
          connectionString: databaseUrl,
          ssl: allowSelfSigned ? { rejectUnauthorized: false } : undefined,
        });

        await client.connect();
        const pgDb = drizzle(client, { schema });

        // Reset using the pg driver connection
        await reset(pgDb, schema);

        // Close the temporary connection
        await client.end();

        console.log("✅ Database reset complete");
      } catch (resetError: any) {
        console.error("❌ Failed to reset database:", resetError);
        throw resetError;
      }
    } else {
      console.log("⚡ Skipping database reset (--no-reset flag detected)");
    }

    console.log("📦 Seeding database...");
    // Optional: drizzle-seed automatic mode for quick bootstrapping
    if (useDrizzleSeed) {
      const countVal = parseInt(getFlagValue('--count') || '', 10);
      const seedVal = parseInt(getFlagValue('--seed') || '', 10);
      console.log(`🌾 Using drizzle-seed auto mode${Number.isFinite(countVal) ? ` (count=${countVal})` : ''}${Number.isFinite(seedVal) ? ` (seed=${seedVal})` : ''}...`);
      // Use node-postgres driver for drizzle-seed compatibility
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const { Client } = await import('pg');
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) throw new Error('DATABASE_URL is not set for drizzle-seed');
      const allowSelfSigned = process.env.PGSSLMODE === 'no-verify' || process.env.NEON_LOCAL === '1';
      const client = new Client({
        connectionString: databaseUrl,
        ssl: allowSelfSigned ? { rejectUnauthorized: false } : undefined,
      });
      await client.connect();
      try {
        const pgDb = drizzle(client, { schema });

        // 0) Initialize shipping data FIRST to avoid foreign key issues
        console.log("🚚 Initializing shipping zones and methods...");
        const shippingResult = await initializeShippingData();
        if (shippingResult.success) {
          console.log(`✅ ${shippingResult.message}`);
        } else {
          console.log(`⚠️  Shipping data initialization failed: ${shippingResult.error}`);
        }

        // 1) Ensure our 6 fixed categories exist
        await pgDb.insert(schema.categories).values(CATEGORIES as any).onConflictDoNothing({ target: schema.categories.slug });
        const categories = await pgDb.select().from(schema.categories);

        // 2) Get shipping methods for foreign key references
        const shippingMethodsList = await pgDb.select().from(schema.shippingMethods);
        const defaultShippingMethodId = shippingMethodsList.length > 0 ? shippingMethodsList[0].id : null;

        // 3) Seed a realistic number of vendors with proper shipping method reference
        const vendorTarget = 12;
        await drizzleSeed(pgDb as any, {
          vendors: schema.vendors,
        } as any, {
          count: vendorTarget,
          ...(Number.isFinite(seedVal) ? { seed: seedVal } : {}),
          version: '2',
        } as any);
        // Normalize vendors to MX profile and set default shipping method
        const vendors = await pgDb.select().from(schema.vendors);
        for (const v of vendors) {
          await pgDb.update(schema.vendors)
            .set({
              country: 'México',
              city: CITIES[faker.number.int({ min: 0, max: CITIES.length - 1 })],
              state: STATES[faker.number.int({ min: 0, max: STATES.length - 1 })],
              phone: generateMxPhone(),
              whatsapp: generateMxPhone(),
              businessPhone: generateMxPhone(),
              isActive: true,
              defaultShippingMethodId: defaultShippingMethodId,
            })
            .where(eq(schema.vendors.id, (v as any).id));
        }

        // 4) Seed products with controlled counts per category
        const productCounts: Record<string, number> = {
          'flores-arreglos': 13,
          'chocolates-dulces': 10,
          'velas-aromas': 11,
          'regalos-personalizados': 11,
          'cajas-regalo': 11,
          'decoracion-hogar': 10,
        };

        let vendorCursor = 0;
        for (const cat of categories.filter((c: any) => productCounts[c.slug as string])) {
          const count = productCounts[cat.slug as string]!;
          const namesByCat: Record<string, string[]> = {
            'flores-arreglos': PRODUCT_NAMES.slice(0, 15),
            'chocolates-dulces': PRODUCT_NAMES.slice(15, 30),
            'velas-aromas': PRODUCT_NAMES.slice(30, 45),
            'regalos-personalizados': PRODUCT_NAMES.slice(45, 60),
            'cajas-regalo': PRODUCT_NAMES.slice(60, 75),
            'decoracion-hogar': PRODUCT_NAMES.slice(75, 90),
          };
          const baseNames = namesByCat[cat.slug as string] ?? PRODUCT_NAMES;
          let localIdx = 0;
          const adjectives = ["Premium", "Deluxe", "Exclusivo", "Artesanal", "Elegante", "Clásico", "Moderno", "Vintage", "Lujoso", "Especial"];

          // Create products manually with controlled ranges
          const toInsert: Array<typeof schema.products.$inferInsert> = [];
          for (let j = 0; j < count; j++) {
            const base = baseNames[localIdx % baseNames.length]!;
            const adj = adjectives[(vendorCursor + localIdx) % adjectives.length]!;
            const name = `${base} ${adj}`;
            const range = CATEGORY_PRICE_RANGES[cat.slug as string] ?? { min: 299, max: 1999 };
            const p = faker.number.int({ min: range.min, max: range.max });
            const vendorId = vendors[vendorCursor % vendors.length]!.id as string;
            vendorCursor++;
            localIdx++;
            toInsert.push({
              name,
              slug: slugify(`${cat.slug}-${vendorCursor}-${localIdx}`, { lower: true, strict: true }),
              description: '',
              categoryId: (cat as any).id,
              vendorId,
              price: String(Math.round(p / 50) * 50),
              images: [],
              tags: faker.helpers.arrayElements(["nuevo", "popular", "oferta", "exclusivo", "artesanal"], faker.number.int({ min: 1, max: 3 })),
              stock: faker.number.int({ min: 5, max: 40 }),
              isActive: true,
              weight: cat.slug === 'flores-arreglos' ? faker.number.int({ min: 500, max: 3000 }) : cat.slug === 'chocolates-dulces' ? faker.number.int({ min: 100, max: 1000 }) : cat.slug === 'velas-aromas' ? faker.number.int({ min: 200, max: 800 }) : faker.number.int({ min: 200, max: 1500 }),
              length: faker.number.int({ min: 10, max: 50 }),
              width: faker.number.int({ min: 10, max: 40 }),
              height: faker.number.int({ min: 5, max: 30 }),
              shippingClass: faker.helpers.arrayElement(["standard", "fragile"]),
            });
          }
          if (toInsert.length > 0) {
            await pgDb.insert(schema.products).values(toInsert as any).onConflictDoNothing({ target: schema.products.slug });
          }
        }

        // 5) Users & subscriptions with restrained counts
        await drizzleSeed(pgDb as any, { users: schema.users } as any, {
          count: 40,
          ...(Number.isFinite(seedVal) ? { seed: seedVal } : {}),
          version: '2',
        } as any);
        await drizzleSeed(pgDb as any, { subscriptions: schema.subscriptions } as any, {
          count: 80,
          ...(Number.isFinite(seedVal) ? { seed: seedVal } : {}),
          version: '2',
        } as any);
      } finally {
        await client.end();
      }
      console.log('✅ drizzle-seed auto seeding complete');
      console.log("\n✅ Database seeded successfully!");
      return;
    }

    const progress = await createProgressControls();

    // 1. Seed Categories (idempotent)
    console.log("🏷️  Creating categories...");
    await db
      .insert(schema.categories)
      .values(CATEGORIES)
      .onConflictDoNothing({ target: schema.categories.slug });
    const categories = await db.select().from(schema.categories);
    console.log(`✅ Ensured ${categories.length} categories`);

    // 2. Seed Admin Users
    console.log("👤 Creating admin users...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUsersData = [
      {
        email: "admin@luzimarket.shop",
        name: "Administrador Principal",
        passwordHash: hashedPassword,
        role: "super_admin" as const,
        isActive: true
      },
      {
        email: "support@luzimarket.shop",
        name: "Soporte Técnico",
        passwordHash: hashedPassword,
        role: "admin" as const,
        isActive: true
      },
      {
        email: "manager@luzimarket.shop",
        name: "Gerente de Ventas",
        passwordHash: hashedPassword,
        role: "admin" as const,
        isActive: true
      }
    ];
    const upsertedAdmins = await db
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
      })
      .returning();
    console.log(`✅ Ensured ${upsertedAdmins.length} admin users exist`);

    // 3. Seed Email Templates (idempotent)
    console.log("📧 Creating email templates...");
    const EMAIL_TEMPLATES = [
      {
        name: "welcome",
        subject: "¡Bienvenido a Luzimarket!",
        htmlTemplate: "<h1>Bienvenido {{name}}</h1><p>Gracias por unirte a Luzimarket.</p>",
        textTemplate: "Bienvenido {{name}}. Gracias por unirte a Luzimarket.",
        variables: ["name", "email"],
        isActive: true
      },
      {
        name: "order_confirmation",
        subject: "Confirmación de pedido #{{orderNumber}}",
        htmlTemplate: "<h1>Pedido Confirmado</h1><p>Tu pedido #{{orderNumber}} ha sido confirmado.</p>",
        textTemplate: "Tu pedido #{{orderNumber}} ha sido confirmado.",
        variables: ["name", "email", "orderNumber"],
        isActive: true
      },
      {
        name: "order_shipped",
        subject: "Tu pedido #{{orderNumber}} ha sido enviado",
        htmlTemplate: "<h1>Pedido Enviado</h1><p>Tu pedido #{{orderNumber}} está en camino.</p>",
        textTemplate: "Tu pedido #{{orderNumber}} está en camino.",
        variables: ["name", "email", "orderNumber", "trackingNumber"],
        isActive: true
      },
      {
        name: "vendor_approved",
        subject: "¡Tu solicitud de vendedor ha sido aprobada!",
        htmlTemplate: "<h1>¡Felicidades!</h1><p>Tu tienda {{businessName}} ha sido aprobada.</p>",
        textTemplate: "Tu tienda {{businessName}} ha sido aprobada.",
        variables: ["name", "email", "businessName"],
        isActive: true
      }
    ];
    await db
      .insert(schema.emailTemplates)
      .values(EMAIL_TEMPLATES)
      .onConflictDoUpdate({
        target: schema.emailTemplates.name,
        set: {
          subject: sql`excluded.subject`,
          htmlTemplate: sql`excluded.html_template`,
          textTemplate: sql`excluded.text_template`,
          variables: sql`excluded.variables`,
          isActive: sql`excluded.is_active`,
        },
      });
    const emailTemplates = await db.select().from(schema.emailTemplates);
    console.log(`✅ Ensured ${emailTemplates.length} email templates`);

    // 4. Seed Vendors
    console.log("🏪 Creating vendors...");
    const vendorData = [];
    // Add a default password hash for all test vendors
    const defaultPasswordHash = await bcrypt.hash("password123", 10);

    for (let i = 0; i < 20; i++) {
      const prefix = faker.helpers.arrayElement(VENDOR_PREFIXES);
      const suffix = faker.helpers.arrayElement(VENDOR_SUFFIXES);
      const businessName = `${prefix} ${suffix}`;
      vendorData.push({
        businessName,
        slug: slugify(businessName + "-" + i, { lower: true, strict: true }), // Use index instead of random string
        contactName: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash: defaultPasswordHash, // All test vendors use password123
        phone: generateMxPhone(),
        whatsapp: generateMxPhone(),
        businessPhone: generateMxPhone(),
        businessHours: faker.helpers.arrayElement(BUSINESS_HOURS),
        street: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(CITIES),
        state: faker.helpers.arrayElement(STATES),
        country: "México",
        postalCode: faker.location.zipCode("#####"),
        websiteUrl: faker.datatype.boolean({ probability: 0.7 }) ? faker.internet.url() : "",
        description: faker.lorem.sentences(2),
        hasDelivery: faker.datatype.boolean({ probability: 0.8 }),
        deliveryService: faker.helpers.arrayElement(["own", "external", "both"]),
        instagramUrl: faker.datatype.boolean({ probability: 0.6 }) ? `@${faker.internet.username()}` : "",
        facebookUrl: faker.datatype.boolean({ probability: 0.6 }) ? faker.internet.username() : "",
        tiktokUrl: faker.datatype.boolean({ probability: 0.4 }) ? `@${faker.internet.username()}` : "",
        isActive: faker.datatype.boolean({ probability: 0.9 }),
        shippingOriginState: faker.helpers.arrayElement(STATES),
        freeShippingThreshold: faker.helpers.arrayElement([null, "500", "1000", "1500", "2000"])
      });
    }

    // Add a specific test vendor for e2e tests
    vendorData.push({
      businessName: "Test Vendor Shop",
      slug: "test-vendor-shop",
      contactName: "Test Vendor",
      email: "vendor@luzimarket.shop",
      passwordHash: defaultPasswordHash, // password123
      phone: "+52 55 5123 4567",
      whatsapp: "+52 55 5123 4567",
      businessPhone: "+52 55 5123 4567",
      businessHours: "Lun-Vie 9:00-18:00",
      street: "Calle Test 123",
      city: "Ciudad de México",
      state: "CDMX",
      country: "México",
      postalCode: "01000",
      websiteUrl: "https://testvendor.com",
      description: "Test vendor for e2e tests",
      hasDelivery: true,
      deliveryService: "own",
      instagramUrl: "@testvendor",
      facebookUrl: "testvendor",
      tiktokUrl: "@testvendor",
      isActive: true,
      shippingOriginState: "Ciudad de México",
      freeShippingThreshold: "1000"
    });

    await db
      .insert(schema.vendors)
      .values(vendorData)
      .onConflictDoNothing({ target: schema.vendors.slug });
    const vendors = await db.select().from(schema.vendors);
    console.log(`✅ Ensured ${vendors.length} vendors`);

    // 5. Seed Products
    console.log("📦 Creating products...");
    const productData: Array<typeof schema.products.$inferInsert> = [];

    // Group product names by category
    const CATEGORY_PRODUCT_NAMES: Record<string, string[]> = {
      "flores-arreglos": PRODUCT_NAMES.slice(0, 15),
      "chocolates-dulces": PRODUCT_NAMES.slice(15, 30),
      "velas-aromas": PRODUCT_NAMES.slice(30, 45),
      "regalos-personalizados": PRODUCT_NAMES.slice(45, 60),
      "cajas-regalo": PRODUCT_NAMES.slice(60, 75),
      "decoracion-hogar": PRODUCT_NAMES.slice(75, 90),
      // trimmed to 6 categories for realistic demo
    };

    for (let i = 0; i < 100; i++) {
      // Use modulo to cycle through categories deterministically
      const categoryIndex = i % categories.length;
      const category = categories[categoryIndex];

      const categoryProducts = CATEGORY_PRODUCT_NAMES[category.slug] || PRODUCT_NAMES;
      // Use modulo to cycle through product names
      const productNameIndex = Math.floor(i / categories.length) % categoryProducts.length;
      const baseName = categoryProducts[productNameIndex];

      const adjectives = [
        "Premium", "Deluxe", "Exclusivo", "Artesanal", "Elegante",
        "Clásico", "Moderno", "Vintage", "Lujoso", "Especial"
      ];
      // Use modulo to cycle through adjectives
      const adjectiveIndex = i % adjectives.length;
      const adjective = adjectives[adjectiveIndex];

      const name = `${baseName} ${adjective}`;
      const priceRange = CATEGORY_PRICE_RANGES[category.slug] || { min: 299, max: 1999 };
      const price = faker.number.int({ min: priceRange.min, max: priceRange.max });

      // Generate more realistic descriptions based on category
      let description = "";
      if (category.slug === "flores-arreglos") {
        description = `Hermoso arreglo floral con ${baseName.toLowerCase()} frescos, perfectos para ${faker.helpers.arrayElement(["celebraciones", "aniversarios", "cumpleaños", "ocasiones especiales"])}. Incluye ${faker.helpers.arrayElement(["follaje verde", "baby's breath", "decoración especial", "lazo elegante"])}.`;
      } else if (category.slug === "chocolates-dulces") {
        description = `Deliciosos chocolates ${faker.helpers.arrayElement(["belgas", "suizos", "artesanales", "gourmet"])} con ${faker.helpers.arrayElement(["cacao 70%", "relleno de trufa", "frutos secos", "caramelo"])}. Presentación ${faker.helpers.arrayElement(["en caja elegante", "envueltos individualmente", "con moño decorativo"])}.`;
      } else if (category.slug === "velas-aromas") {
        description = `Vela aromática de ${faker.helpers.arrayElement(["cera de soya", "cera de abeja", "parafina premium"])} con esencia de ${faker.helpers.arrayElement(["lavanda francesa", "vainilla de Madagascar", "sándalo", "jazmín"])}. Duración aproximada de ${faker.number.int({ min: 20, max: 60 })} horas.`;
      } else {
        description = faker.lorem.sentences(2) + ` ${faker.helpers.arrayElement(["Hecho a mano con amor.", "Producto exclusivo de temporada.", "Edición limitada.", "Diseño único."])}`;
      }

      // Assign vendors deterministically by cycling through them
      const vendorIndex = i % vendors.length;
      const vendor = vendors[vendorIndex];
      // Create deterministic slug based on product index only (since everything else is now deterministic)
      const deterministicSlug = slugify(`${baseName}-${adjective}-${i}`, { lower: true, strict: true });

      const tagOptions = ["nuevo", "popular", "oferta", "exclusivo", "limitado", "artesanal", "eco-friendly", "premium"];
      const tagCount = faker.number.int({ min: 1, max: 4 });
      productData.push({
        name,
        slug: deterministicSlug,
        description,
        categoryId: category.id,
        vendorId: vendor.id,
        price: String(Math.round(price / 50) * 50), // Round to nearest 50
        images: [], // Will be generated later (AI or placeholders)
        tags: faker.helpers.arrayElements(tagOptions, tagCount),
        stock: faker.helpers.weightedArrayElement([
          { value: faker.number.int({ min: 1, max: 10 }), weight: 2 }, // Low stock
          { value: faker.number.int({ min: 11, max: 50 }), weight: 5 }, // Normal stock
          { value: faker.number.int({ min: 51, max: 100 }), weight: 3 }, // High stock
          { value: 0, weight: 1 } // Out of stock
        ]),
        isActive: faker.datatype.boolean({ probability: 0.95 }),
        // Shipping fields based on category
        weight: (() => {
          if (category.slug === "flores-arreglos") return faker.number.int({ min: 500, max: 3000 }); // 0.5-3kg
          if (category.slug === "chocolates-dulces") return faker.number.int({ min: 100, max: 1000 }); // 0.1-1kg
          if (category.slug === "velas-aromas") return faker.number.int({ min: 200, max: 800 }); // 0.2-0.8kg
          if (category.slug === "joyeria-accesorios") return faker.number.int({ min: 50, max: 300 }); // 0.05-0.3kg
          if (category.slug === "gourmet-delicatessen") return faker.number.int({ min: 300, max: 2000 }); // 0.3-2kg
          return faker.number.int({ min: 200, max: 1500 }); // Default 0.2-1.5kg
        })(),
        length: faker.number.int({ min: 10, max: 50 }), // 10-50cm
        width: faker.number.int({ min: 10, max: 40 }), // 10-40cm
        height: faker.number.int({ min: 5, max: 30 }), // 5-30cm
        shippingClass: faker.helpers.arrayElement(["standard", "fragile", "oversize"])
      });
    }
    await db
      .insert(schema.products)
      .values(productData)
      .onConflictDoNothing({ target: schema.products.slug });
    const products = await db.select().from(schema.products);
    console.log(`✅ Ensured ${products.length} products`);

    // IMAGE HANDLING PHASE
    // 5.1 Assign images via placeholders or AI, respecting existing images and flags
    if (imageMode === 'placeholders') {
      console.log('\n🖼️  Assigning placeholder images...');
      // Categories without imageUrl
      const categoriesToSet = forceRegenerateImages ? categories : categories.filter(c => !c.imageUrl);
      const bar = progress.start(categoriesToSet.length, '🖼️  Categories placeholders');
      for (const category of categoriesToSet) {
        const imageUrl = buildPlaceholderImageUrl('category', category.slug);
        await db.update(schema.categories)
          .set({ imageUrl })
          .where(eq(schema.categories.id, category.id));
        progress.tick();
      }
      progress.stop();
      console.log(`✅ Set placeholder images for ${categoriesToSet.length} categories`);

      // Products without images
      const productTargets = forceRegenerateImages ? products : products.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0));
      let updatedCount = 0;
      const targets = productTargets.slice(0, imageBatchSize);
      const bar2 = progress.start(targets.length, '🖼️  Products placeholders');
      for (const product of targets) {
        const imageUrl = buildPlaceholderImageUrl('product', product.slug);
        await db.update(schema.products)
          .set({ images: [imageUrl], imagesApproved: true, imagesPendingModeration: false })
          .where(eq(schema.products.id, product.id));
        updatedCount++;
        progress.tick();
      }
      progress.stop();
      console.log(`✅ Set placeholder images for ${updatedCount} products`);
    }

    // 5.2 Generate AI images (optional)
    if (shouldGenerateAIImages) {
      console.log("\n🎨 Generating AI images for products and categories...");
      // Create uploads directory for local development
      if (process.env.NODE_ENV === 'development' && !process.env.BLOB_READ_WRITE_TOKEN) {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'ai-generated');
        await fs.mkdir(uploadsDir, { recursive: true });
        console.log('📁 Created local uploads directory\n');
      }

      // Generate category images
      console.log('🖼️  Generating category images...');
      const categoriesToImage = forceRegenerateImages ? categories : categories.filter(c => !c.imageUrl || c.imageUrl === null);
      console.log(`📊 Found ${categoriesToImage.length} categories ${forceRegenerateImages ? '(forced regeneration)' : 'without images'}`);

      const bar3 = progress.start(categoriesToImage.length, '🖼️  AI: categories');
      for (const category of categoriesToImage) {
        try {
          const prompt = generateCategoryImagePrompt({
            name: category.name,
            description: category.description || '',
          });
          const imageUrl = await generateAndUploadImage(
            prompt,
            `category-${category.slug}.png`,
            { size: '1792x1024', quality: 'hd', style: 'natural' }
          );
          await db.update(schema.categories)
            .set({ imageUrl })
            .where(eq(schema.categories.id, category.id));
        } catch (error) {
          console.error(`❌ Error generating image for category ${category.name}:`, error);
        }
        progress.tick();
      }
      progress.stop();

      // Generate product images
      console.log('\n🖼️  Generating product images...');
      const productsNeedingImages = forceRegenerateImages ? products : products.filter(p => !p.images || (Array.isArray(p.images) && p.images.length === 0));
      const productsToImage = productsNeedingImages.slice(0, imageBatchSize);
      console.log(`📊 Found ${productsNeedingImages.length} products ${forceRegenerateImages ? '(forced regeneration)' : 'without images'}, generating for ${productsToImage.length}`);

      const bar4 = progress.start(productsToImage.length, '🖼️  AI: products');
      for (const product of productsToImage) {
        try {
          const prompt = generateProductImagePrompt({
            name: product.name,
            description: product.description || '',
            tags: (product.tags as string[]) || [],
          });
          const imageUrl = await generateAndUploadImage(
            prompt,
            `product-${product.slug}.png`,
            { size: '1024x1024', quality: 'standard', style: 'natural' }
          );
          await db.update(schema.products)
            .set({ images: [imageUrl] })
            .where(eq(schema.products.id, product.id));
        } catch (error) {
          console.error(`❌ Error generating image for product ${product.name}:`, error);
        }
        progress.tick();
      }
      progress.stop();

      console.log('\n✨ AI image generation completed!');
    } else if (imageMode === 'none') {
      console.log("\n⏭️  Skipping image assignment (imageMode=none)");
    }

    // 5.3 Create Image Moderation Records AFTER images exist
    console.log("🖼️  Creating image moderation records...");
    const productsWithImages = await db.query.products.findMany({
      where: sql`json_array_length(${schema.products.images}) > 0`,
      columns: { id: true, vendorId: true, images: true }
    });
    const sample = productsWithImages.slice(0, 20);

    const imageModerationData: schema.NewProductImageModeration[] = [];
    for (const product of sample) {
      (product.images as string[]).forEach((imageUrl, index) => {
        // In placeholder mode, mark as approved. In AI mode, vary statuses
        let status: 'pending' | 'approved' | 'rejected' = imageMode === 'placeholders' ? 'approved' : 'approved';
        let reviewedAt: Date | null = new Date();
        let rejectionReason: string | null = null;
        let rejectionCategory: string | null = null;

        if (imageMode === 'ai') {
          const r = faker.number.float({ min: 0, max: 1 });
          if (r < 0.7) {
            status = 'approved';
          } else if (r < 0.9) {
            status = 'pending';
            reviewedAt = null;
          } else {
            status = 'rejected';
            rejectionReason = 'Mejorar calidad o iluminación';
            rejectionCategory = 'quality';
          }
        }

        imageModerationData.push({
          productId: product.id,
          vendorId: product.vendorId,
          imageUrl,
          imageIndex: index,
          status,
          reviewedAt: reviewedAt || undefined,
          rejectionReason: rejectionReason || undefined,
          rejectionCategory: rejectionCategory || undefined,
        });
      });
    }

    if (imageModerationData.length > 0) {
      await db.insert(schema.productImageModeration).values(imageModerationData);

      // Update product flags based on moderation
      const byProduct = new Map<string, schema.NewProductImageModeration[]>();
      for (const rec of imageModerationData) {
        const arr = byProduct.get(rec.productId) || [];
        arr.push(rec);
        byProduct.set(rec.productId, arr);
      }
      for (const [productId, records] of byProduct.entries()) {
        const allApproved = records.every(r => r.status === 'approved');
        const hasPending = records.some(r => r.status === 'pending');
        await db.update(schema.products)
          .set({
            imagesApproved: allApproved,
            imagesPendingModeration: !allApproved && hasPending,
          })
          .where(eq(schema.products.id, productId));
      }
      console.log(`✅ Created ${imageModerationData.length} image moderation records and updated flags`);
    } else {
      console.log('ℹ️  No products with images found to moderate at this stage');
    }

    // 5.5 Seed Product Variants
    console.log("🎨 Creating product variants...");
    const variantData = [] as Array<typeof schema.productVariants.$inferInsert>;

    // Define variant configurations by category
    const CATEGORY_VARIANTS: Record<string, { types: string[], values: Record<string, any[]> }> = {
      "flores-arreglos": {
        types: ["size", "color"],
        values: {
          size: [
            { name: "Pequeño", price: 0 },
            { name: "Mediano", price: 150 },
            { name: "Grande", price: 300 },
            { name: "Extra Grande", price: 500 }
          ],
          color: [
            { name: "Rosa", attributes: { colorValue: "#FFB6C1" } },
            { name: "Rojo", attributes: { colorValue: "#DC143C" } },
            { name: "Blanco", attributes: { colorValue: "#FFFFFF" } },
            { name: "Amarillo", attributes: { colorValue: "#FFD700" } },
            { name: "Mixto", attributes: { colorValue: "linear-gradient(45deg, #FFB6C1, #FFD700)" } }
          ]
        }
      },
      "chocolates-dulces": {
        types: ["size", "type"],
        values: {
          size: [
            { name: "Individual", price: 0 },
            { name: "Caja Pequeña (6 pz)", price: 100 },
            { name: "Caja Mediana (12 pz)", price: 200 },
            { name: "Caja Grande (24 pz)", price: 400 }
          ],
          type: [
            { name: "Chocolate Oscuro" },
            { name: "Chocolate con Leche" },
            { name: "Chocolate Blanco" },
            { name: "Mixto" }
          ]
        }
      },
      "velas-aromas": {
        types: ["size", "scent"],
        values: {
          size: [
            { name: "Vela Pequeña (100g)", price: 0 },
            { name: "Vela Mediana (200g)", price: 150 },
            { name: "Vela Grande (400g)", price: 300 }
          ],
          scent: [
            { name: "Lavanda" },
            { name: "Vainilla" },
            { name: "Canela" },
            { name: "Cítricos" },
            { name: "Rosa" },
            { name: "Sándalo" }
          ]
        }
      },
      "joyeria-accesorios": {
        types: ["material", "size"],
        values: {
          material: [
            { name: "Plata 925", price: 0 },
            { name: "Oro 14k", price: 2000 },
            { name: "Oro Rosa", price: 1500 },
            { name: "Acero Inoxidable", price: -500 }
          ],
          size: [
            { name: "XS" },
            { name: "S" },
            { name: "M" },
            { name: "L" },
            { name: "Ajustable" }
          ]
        }
      },
      "cajas-regalo": {
        types: ["size", "theme"],
        values: {
          size: [
            { name: "Caja Pequeña", price: 0 },
            { name: "Caja Mediana", price: 300 },
            { name: "Caja Grande", price: 600 },
            { name: "Caja Premium", price: 1000 }
          ],
          theme: [
            { name: "Cumpleaños" },
            { name: "Aniversario" },
            { name: "Día de las Madres" },
            { name: "Navidad" },
            { name: "San Valentín" },
            { name: "Personalizada" }
          ]
        }
      }
    };

    // Create variants for products that have variant configurations
    let variantCounter = 0;
    for (const product of products.slice(0, 50)) { // Add variants to first 50 products
      const category = categories.find(c => c.id === product.categoryId);
      if (!category) continue;

      const variantConfig = CATEGORY_VARIANTS[category.slug];
      if (!variantConfig) continue;

      for (const variantType of variantConfig.types) {
        const values = variantConfig.values[variantType];
        for (const value of values) {
          const stock = faker.number.int({ min: 0, max: 50 });
          variantCounter++;
          variantData.push({
            productId: product.id,
            name: value.name,
            variantType,
            sku: `${product.id.substring(0, 8)}-${variantType.charAt(0).toUpperCase()}-${variantCounter.toString().padStart(4, '0')}`,
            price: value.price ? String(Number(product.price) + value.price) : null,
            stock,
            attributes: value.attributes || {},
            isActive: stock > 0
          });
        }
      }
    }

    if (variantData.length > 0) {
      const total = variantData.length;
      const bar5 = progress.start(total, '🎨 Upserting variants');
      const chunkSize = 300;
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = variantData.slice(i, i + chunkSize);
        await db
          .insert(schema.productVariants)
          .values(chunk)
          .onConflictDoUpdate({
            target: schema.productVariants.sku,
            set: {
              name: sql`excluded.name`,
              variantType: sql`excluded.variant_type`,
              price: sql`excluded.price`,
              stock: sql`excluded.stock`,
              attributes: sql`excluded.attributes`,
              isActive: sql`excluded.is_active`,
            },
          });
        progress.tick(chunk.length);
      }
      progress.stop();
      console.log(`✅ Ensured ${variantData.length} product variants`);
    }

    // 6. Seed Users (Customers)
    console.log("👥 Creating users...");
    const userPassword = await bcrypt.hash("password123", 10);
    const userData: Array<typeof schema.users.$inferInsert> = [];

    // Add specific test users first (predictable logins)
    userData.push({
      email: "client@luzimarket.shop",
      name: "Test Customer",
      passwordHash: userPassword,
      stripeCustomerId: `cus_client_main`,
      isActive: true
    });

    userData.push({
      email: "client_2@luzimarket.shop",
      name: "Test Customer 2 (Alt)",
      passwordHash: userPassword,
      stripeCustomerId: `cus_client_alt`,
      isActive: true
    });

    // Keep legacy test users used by some E2E specs
    userData.push({
      email: "customer1@example.com",
      name: "Test Customer",
      passwordHash: userPassword,
      stripeCustomerId: `cus_test_customer1`,
      isActive: true
    });
    userData.push({
      email: "customer2@example.com",
      name: "Test Customer 2",
      passwordHash: userPassword,
      stripeCustomerId: `cus_test_customer2`,
      isActive: true
    });

    // Add random users
    for (let i = 0; i < 48; i++) {
      userData.push({
        email: faker.internet.email(),
        name: faker.person.fullName(),
        passwordHash: userPassword,
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        isActive: faker.datatype.boolean({ probability: 0.95 })
      });
    }
    await db.insert(schema.users).values(userData).onConflictDoNothing({ target: schema.users.email });
    const users = await db.select().from(schema.users);
    console.log(`✅ Ensured ${users.length} users`);

    // 7. Seed Newsletter Subscriptions
    console.log("📰 Creating newsletter subscriptions...");
    const subscriptionData: Array<typeof schema.subscriptions.$inferInsert> = [];
    for (let i = 0; i < 100; i++) {
      subscriptionData.push({
        email: faker.internet.email(),
        isActive: faker.datatype.boolean({ probability: 0.9 })
      });
    }
    await db.insert(schema.subscriptions).values(subscriptionData).onConflictDoNothing({ target: schema.subscriptions.email });
    const subsCount = await db.select({ c: sql<number>`COUNT(*)` }).from(schema.subscriptions);
    console.log(`✅ Ensured ${subsCount[0].c} subscriptions`);

    // 8. Seed Orders
    console.log("🛒 Creating orders...");
    const orderData = [];
    const carriers = ["fedex", "ups", "dhl", "estafeta", "correos-de-mexico"];

    const ordersTotal = 150;
    const bar6 = progress.start(ordersTotal, '🛒 Generating orders');
    for (let i = 0; i < ordersTotal; i++) {
      const subtotal = faker.number.int({ min: 199, max: 9999 });
      const tax = Math.round(subtotal * 0.16);
      const shipping = faker.helpers.arrayElement([0, 99, 149, 199]);
      const total = subtotal + tax + shipping;

      const status = faker.helpers.weightedArrayElement([
        { value: "delivered", weight: 4 },
        { value: "shipped", weight: 3 },
        { value: "processing", weight: 2 },
        { value: "pending", weight: 1 }
      ]);

      const orderCreatedAt = faker.date.recent({ days: 90 });

      // Prepare tracking information for shipped and delivered orders
      let trackingData: any = {};

      if (status === "shipped" || status === "delivered") {
        const carrier = faker.helpers.arrayElement(carriers);
        const trackingNumber = `${carrier.toUpperCase().substring(0, 3)}${faker.string.numeric(12)}`;
        const shippedDate = faker.date.between({ from: orderCreatedAt, to: new Date() });
        const estimatedDelivery = new Date(shippedDate);
        estimatedDelivery.setDate(estimatedDelivery.getDate() + faker.number.int({ min: 1, max: 5 }));

        // Build tracking history
        const trackingHistory = [];

        // Order picked up
        trackingHistory.push({
          status: "picked_up",
          location: faker.helpers.arrayElement(CITIES),
          timestamp: shippedDate,
          description: "Paquete recogido por el transportista",
          coordinates: {
            lat: Number(faker.location.latitude({ min: 14, max: 33 })),
            lng: Number(faker.location.longitude({ min: -117, max: -86 }))
          }
        });

        // In transit events
        const transitEvents = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < transitEvents; j++) {
          const transitDate = faker.date.between({ from: shippedDate, to: estimatedDelivery });
          trackingHistory.push({
            status: "in_transit",
            location: faker.helpers.arrayElement(CITIES),
            timestamp: transitDate,
            description: faker.helpers.arrayElement([
              "En tránsito hacia el destino",
              "Paquete en centro de distribución",
              "Procesando en instalación"
            ]),
            coordinates: {
              lat: Number(faker.location.latitude({ min: 14, max: 33 })),
              lng: Number(faker.location.longitude({ min: -117, max: -86 }))
            }
          });
        }

        // Out for delivery (for both shipped and delivered)
        const outForDeliveryDate = new Date(estimatedDelivery);
        outForDeliveryDate.setHours(outForDeliveryDate.getHours() - faker.number.int({ min: 2, max: 8 }));
        trackingHistory.push({
          status: "out_for_delivery",
          location: faker.helpers.arrayElement(CITIES),
          timestamp: outForDeliveryDate,
          description: "En ruta de entrega",
          coordinates: {
            lat: Number(faker.location.latitude({ min: 14, max: 33 })),
            lng: Number(faker.location.longitude({ min: -117, max: -86 }))
          }
        });

        // Delivered event (only for delivered orders)
        if (status === "delivered") {
          // Ensure the delivery date is not in the future
          const maxDeliveryDate = new Date();
          const minDeliveryDate = new Date(outForDeliveryDate);

          // If outForDeliveryDate is in the future, set actual delivery to a reasonable time after it
          if (minDeliveryDate > maxDeliveryDate) {
            // Add 1-4 hours to outForDeliveryDate for actual delivery
            const hoursAfterOutForDelivery = faker.number.int({ min: 1, max: 4 });
            minDeliveryDate.setHours(minDeliveryDate.getHours() + hoursAfterOutForDelivery);
            var actualDeliveryDate = minDeliveryDate;
          } else {
            // Normal case: delivery happened between out for delivery and now
            var actualDeliveryDate = faker.date.between({ from: outForDeliveryDate, to: maxDeliveryDate });
          }

          trackingHistory.push({
            status: "delivered",
            location: faker.helpers.arrayElement(CITIES),
            timestamp: actualDeliveryDate,
            description: "Entregado exitosamente",
            coordinates: {
              lat: Number(faker.location.latitude({ min: 14, max: 33 })),
              lng: Number(faker.location.longitude({ min: -117, max: -86 }))
            }
          });

          trackingData.actualDeliveryDate = actualDeliveryDate;
        }

        // Sort tracking history by timestamp
        trackingHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        trackingData = {
          trackingNumber,
          carrier,
          estimatedDeliveryDate: estimatedDelivery,
          trackingHistory,
          ...trackingData
        };
      }

      orderData.push({
        userId: faker.helpers.arrayElement(users).id,
        vendorId: faker.helpers.arrayElement(vendors).id,
        orderNumber: `ORD-${faker.string.numeric(8)}`,
        status,
        subtotal: String(subtotal),
        tax: String(tax),
        shipping: String(shipping),
        total: String(total),
        currency: "MXN",
        paymentIntentId: `pi_${faker.string.alphanumeric(24)}`,
        paymentStatus: faker.helpers.weightedArrayElement([
          { value: "succeeded", weight: 9 },
          { value: "pending", weight: 1 }
        ]),
        shippingAddress: {
          name: faker.person.fullName(),
          street: faker.location.streetAddress(),
          city: faker.helpers.arrayElement(CITIES),
          state: faker.helpers.arrayElement(STATES),
          postalCode: faker.location.zipCode("#####"),
          country: "México"
        },
        notes: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : null,
        createdAt: orderCreatedAt,
        ...trackingData
      });
      progress.tick();
    }
    progress.stop();
    await db.insert(schema.orders).values(orderData).onConflictDoNothing({ target: schema.orders.orderNumber });
    const orders = await db.select().from(schema.orders);
    console.log(`✅ Ensured ${orders.length} orders`);

    // 9. Seed Order Items
    console.log("📋 Creating order items...");
    const orderItemData = [];
    const bar7 = progress.start(orders.length, '📋 Generating order items');
    for (const order of orders) {
      const itemCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(products, itemCount);

      for (const product of selectedProducts) {
        const quantity = faker.number.int({ min: 1, max: 3 });
        const price = parseInt(product.price);
        orderItemData.push({
          orderId: order.id,
          productId: product.id,
          quantity,
          price: String(price),
          total: String(price * quantity)
        });
      }
      progress.tick();
    }
    progress.stop();
    await db.insert(schema.orderItems).values(orderItemData);
    console.log(`✅ Created ${orderItemData.length} order items`);

    // 10. Seed Reviews
    console.log("⭐ Creating reviews...");
    const reviewData = [];
    const reviewTitles = [
      "Excelente producto",
      "Muy buena calidad",
      "Recomendado",
      "Superó mis expectativas",
      "Buen servicio",
      "Producto como se describe",
      "Entrega rápida",
      "Volveré a comprar"
    ];

    // Create reviews for random products
    const productsWithReviews = faker.helpers.arrayElements(products, 120);
    const bar8 = progress.start(productsWithReviews.length, '⭐ Generating reviews');
    for (const product of productsWithReviews) {
      const reviewCount = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < reviewCount; i++) {
        const user = faker.helpers.arrayElement(users);
        // Check if user has ordered this product
        const hasOrdered = faker.datatype.boolean({ probability: 0.8 });

        reviewData.push({
          productId: product.id,
          userId: user.id,
          orderId: hasOrdered ? faker.helpers.arrayElement(orders).id : null,
          rating: faker.helpers.weightedArrayElement([
            { value: 5, weight: 5 },
            { value: 4, weight: 3 },
            { value: 3, weight: 1.5 },
            { value: 2, weight: 0.5 }
          ]),
          title: faker.helpers.arrayElement(reviewTitles),
          comment: faker.lorem.sentences(2),
          isVerifiedPurchase: hasOrdered,
          helpfulCount: faker.number.int({ min: 0, max: 50 })
        });
      }
      progress.tick();
    }
    progress.stop();
    await db.insert(schema.reviews).values(reviewData);
    console.log(`✅ Created ${reviewData.length} reviews`);

    // 12. Seed Financial Data (balances, fees, transactions, payouts)
    console.log("💸 Seeding financial data...");
    const financialsMode = (getFlagValue('--financials') || 'auto').toLowerCase();
    const forceFinancials = financialsMode === 'force' || process.argv.includes('--force-financials');
    const skipFinancials = financialsMode === 'skip';

    // Ensure vendor Stripe accounts (by vendorId) - batch insert
    const accountRows = vendors.map((v) => ({
      vendorId: v.id,
      stripeAccountId: `acct_${faker.string.alphanumeric(16).toLowerCase()}`,
      accountType: 'express' as const,
      onboardingStatus: 'completed' as const,
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      commissionRate: String(faker.number.int({ min: 10, max: 20 })),
    }));
    await db.insert(schema.vendorStripeAccounts).values(accountRows).onConflictDoNothing({ target: schema.vendorStripeAccounts.vendorId });

    // Ensure vendor balances - batch insert
    const balanceRows = vendors.map((v) => ({
      vendorId: v.id,
      availableBalance: '0',
      pendingBalance: '0',
      reservedBalance: '0',
      currency: 'MXN',
      lifetimeVolume: '0',
    }));
    await db.insert(schema.vendorBalances).values(balanceRows).onConflictDoNothing({ target: schema.vendorBalances.vendorId });

    const existingFeesCount = await db.select({ c: sql<number>`COUNT(*)` }).from(schema.platformFees);
    const shouldCreateFees = forceFinancials || (existingFeesCount[0].c === 0);

    const vendorIdToCommission = new Map<string, number>();
    const accounts = await db.select({ vendorId: schema.vendorStripeAccounts.vendorId, commissionRate: schema.vendorStripeAccounts.commissionRate }).from(schema.vendorStripeAccounts);
    for (const a of accounts) vendorIdToCommission.set(a.vendorId, Number(a.commissionRate));

    if (!skipFinancials && shouldCreateFees) {
      console.log("🧾 Creating platform fees and transactions...");
      const feeRows: Array<typeof schema.platformFees.$inferInsert> = [];
      const transactionRows: Array<typeof schema.transactions.$inferInsert> = [];

      for (const o of orders) {
        if (o.paymentStatus !== 'succeeded') continue;
        const orderAmount = Number(o.total);
        const commission = vendorIdToCommission.get(o.vendorId) ?? 15;
        const feeAmount = Math.round((orderAmount * commission) / 100);
        const vendorEarnings = orderAmount - feeAmount - Number(o.shipping || 0);

        feeRows.push({
          orderId: o.id,
          vendorId: o.vendorId,
          orderAmount: String(orderAmount),
          feePercentage: String(commission),
          feeAmount: String(feeAmount),
          vendorEarnings: String(vendorEarnings),
          currency: 'MXN',
          status: 'collected',
        });

        transactionRows.push({
          vendorId: o.vendorId,
          orderId: o.id,
          type: 'sale',
          amount: String(orderAmount),
          currency: 'MXN',
          status: 'completed',
          description: `Sale for order ${o.orderNumber}`,
          metadata: {},
        });

        transactionRows.push({
          vendorId: o.vendorId,
          orderId: o.id,
          type: 'fee',
          amount: String(feeAmount),
          currency: 'MXN',
          status: 'completed',
          description: `Platform fee for order ${o.orderNumber}`,
          metadata: { commission },
        });
      }

      if (feeRows.length > 0) {
        await db.insert(schema.platformFees).values(feeRows);
        await db.insert(schema.transactions).values(transactionRows);
        console.log(`✅ Created ${feeRows.length} platform fees and ${transactionRows.length} transactions`);
      } else {
        console.log('ℹ️  No eligible orders for platform fees');
      }
    } else if (!skipFinancials) {
      console.log('ℹ️  Platform fees already exist, skipping (use --financials force to regenerate)');
    }

    console.log('🧮 Updating vendor balances...');
    const vendorEarningsByStatus = new Map<string, { available: number; pending: number; lifetime: number }>();
    for (const v of vendors) vendorEarningsByStatus.set(v.id, { available: 0, pending: 0, lifetime: 0 });

    for (const o of orders) {
      if (o.paymentStatus !== 'succeeded') continue;
      const orderAmount = Number(o.total);
      const commission = vendorIdToCommission.get(o.vendorId) ?? 15;
      const feeAmount = Math.round((orderAmount * commission) / 100);
      const vendorEarnings = orderAmount - feeAmount - Number(o.shipping || 0);
      const agg = vendorEarningsByStatus.get(o.vendorId)!;
      agg.lifetime += vendorEarnings;
      if (o.status === 'delivered') agg.available += vendorEarnings; else agg.pending += vendorEarnings;
    }

    for (const [vendorId, sums] of vendorEarningsByStatus.entries()) {
      await db.update(schema.vendorBalances)
        .set({
          availableBalance: String(Math.max(0, Math.round(sums.available))),
          pendingBalance: String(Math.max(0, Math.round(sums.pending))),
          lifetimeVolume: String(Math.max(0, Math.round(sums.lifetime))),
          lastUpdated: new Date(),
        })
        .where(eq(schema.vendorBalances.vendorId, vendorId));
    }
    console.log('✅ Vendor balances updated');

    const existingPayoutsCount = await db.select({ c: sql<number>`COUNT(*)` }).from(schema.payouts);
    const shouldCreatePayouts = forceFinancials || (existingPayoutsCount[0].c === 0);
    if (!skipFinancials && shouldCreatePayouts) {
      console.log('🏦 Creating bank accounts and payouts...');
      const payoutTargets = vendors.slice(0, Math.min(15, vendors.length));
      const bar9 = progress.start(payoutTargets.length, '🏦 Creating payouts');
      for (const v of payoutTargets) {
        const bank = await db.insert(schema.vendorBankAccounts).values({
          vendorId: v.id,
          accountHolderName: v.businessName,
          accountHolderType: 'company',
          bankName: faker.helpers.arrayElement(['BBVA', 'Santander', 'Banorte', 'HSBC', 'Scotiabank']),
          last4: faker.string.numeric(4),
          currency: 'MXN',
          country: 'MX',
          isDefault: true,
        }).onConflictDoNothing({ target: schema.vendorBankAccounts.vendorId }).returning();

        const [balance] = await db.select().from(schema.vendorBalances).where(eq(schema.vendorBalances.vendorId, v.id));
        const available = balance ? Number(balance.availableBalance) : 0;
        if (available < 200) continue;

        const payoutAmount = Math.round(available * faker.number.float({ min: 0.3, max: 0.8 }));
        await db.insert(schema.payouts).values({
          vendorId: v.id,
          amount: String(payoutAmount),
          currency: 'MXN',
          status: 'paid',
          method: 'bank_transfer',
          bankAccountId: (bank[0] && (bank[0] as any).id) || null,
          processedAt: faker.date.recent({ days: 15 }),
          paidAt: faker.date.recent({ days: 10 }),
        });

        await db.update(schema.vendorBalances)
          .set({
            availableBalance: String(available - payoutAmount),
            lastUpdated: new Date(),
          })
          .where(eq(schema.vendorBalances.vendorId, v.id));
        progress.tick();
      }
      progress.stop();
      console.log('✅ Payouts created where applicable');
    } else if (!skipFinancials) {
      console.log('ℹ️  Payouts already exist, skipping');
    }

    // 11. Initialize shipping data
    console.log("🚚 Initializing shipping zones and methods...");
    const shippingResult = await initializeShippingData();
    if (shippingResult.success) {
      console.log(`✅ ${shippingResult.message}`);
    } else {
      console.log(`⚠️  Shipping data initialization failed: ${shippingResult.error}`);
    }

    // Print summary
    console.log("\n📋 Summary:");
    const counts = await db.select({
      categories: sql<number>`(SELECT COUNT(*) FROM ${schema.categories})`,
      vendors: sql<number>`(SELECT COUNT(*) FROM ${schema.vendors})`,
      products: sql<number>`(SELECT COUNT(*) FROM ${schema.products})`,
      users: sql<number>`(SELECT COUNT(*) FROM ${schema.users})`,
      orders: sql<number>`(SELECT COUNT(*) FROM ${schema.orders})`,
      reviews: sql<number>`(SELECT COUNT(*) FROM ${schema.reviews})`
    }).from(schema.categories);

    const summary = counts[0];
    console.log(`- Categories: ${summary.categories}`);
    console.log(`- Vendors: ${summary.vendors}`);
    console.log(`- Products: ${summary.products}`);
    console.log(`- Users: ${summary.users}`);
    console.log(`- Orders: ${summary.orders}`);
    console.log(`- Reviews: ${summary.reviews}`);

    console.log("\n🔐 Login credentials:");
    console.log("Admin: admin@luzimarket.shop / admin123");
    console.log("User: any user email / password123");

    console.log("\n✅ Database seeded successfully!");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();