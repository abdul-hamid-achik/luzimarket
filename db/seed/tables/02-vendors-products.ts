import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { powerLawDistribution, realisticPricing } from "../utils/realistic-patterns";

// Set seed for consistency
faker.seed(12345);

const VENDOR_PREFIXES = [
  "Boutique", "Casa", "Tienda", "Atelier", "Estudio", "Galería", "Rincón",
  "Jardín", "Tesoro", "Arte", "Dulce", "Bella", "Luna", "Sol", "Magia"
];

const VENDOR_SUFFIXES = [
  "de Regalos", "Floral", "Gourmet", "Artesanal", "Creativo", "Exclusivo",
  "Premium", "Deluxe", "& Co.", "Mexicano", "Boutique", "Studio", "Express"
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
  "Cancún", "Mérida", "Toluca", "Chihuahua", "Aguascalientes", "San Luis Potosí", "Saltillo"
];

function generateMxPhone(): string {
  const area = faker.number.int({ min: 10, max: 99 }).toString().padStart(2, '0');
  const part1 = faker.string.numeric(4);
  const part2 = faker.string.numeric(4);
  return `+52 ${area} ${part1} ${part2}`;
}

/**
 * Seeds vendors and products with realistic distribution
 */
export async function seedVendorsAndProducts(database = db, options?: any) {
  console.log("🏪 Creating vendors and products...");

  const categories = await database.select().from(schema.categories);
  const shippingMethods = await database.select().from(schema.shippingMethods);
  const defaultShippingMethodId = shippingMethods[0]?.id || null;

  // 1. Create vendors with realistic distribution
  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const vendorCount = 25;
  const vendorData = [];

  // Add test vendor first
  vendorData.push({
    businessName: "Test Vendor Shop",
    slug: "test-vendor-shop",
    contactName: "Test Vendor",
    email: "vendor@luzimarket.shop",
    passwordHash: defaultPasswordHash,
    phone: "+52 55 5123 4567",
    whatsapp: "+52 55 5123 4567",
    businessPhone: "+52 55 5123 4567",
    businessHours: "Lun-Vie 9:00-18:00",
    street: "Calle Test 123",
    city: "Ciudad de México",
    state: "Ciudad de México",
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
    freeShippingThreshold: "1000",
    defaultShippingMethodId
  });

  // Generate other vendors
  for (let i = 1; i < vendorCount; i++) {
    const prefix = faker.helpers.arrayElement(VENDOR_PREFIXES);
    const suffix = faker.helpers.arrayElement(VENDOR_SUFFIXES);
    const businessName = `${prefix} ${suffix}`;
    const city = faker.helpers.arrayElement(CITIES);
    const state = faker.helpers.arrayElement(STATES);

    vendorData.push({
      businessName,
      slug: slugify(businessName + "-" + i, { lower: true, strict: true }),
      contactName: faker.person.fullName(),
      email: faker.internet.email(),
      passwordHash: defaultPasswordHash,
      phone: generateMxPhone(),
      whatsapp: generateMxPhone(),
      businessPhone: generateMxPhone(),
      businessHours: faker.helpers.arrayElement([
        "Lun-Sab: 8:00-20:00, Dom: 9:00-18:00",
        "Lun-Vie: 10:00-19:00, Sab: 10:00-17:00",
        "Lun-Dom: 9:00-21:00"
      ]),
      street: faker.location.streetAddress(),
      city,
      state,
      country: "México",
      postalCode: faker.location.zipCode("#####"),
      websiteUrl: faker.datatype.boolean({ probability: 0.7 }) ? faker.internet.url() : null,
      description: faker.lorem.sentences(2),
      hasDelivery: faker.datatype.boolean({ probability: 0.8 }),
      deliveryService: faker.helpers.arrayElement(["own", "external", "both"]),
      instagramUrl: faker.datatype.boolean({ probability: 0.6 }) ? `@${faker.internet.username()}` : null,
      facebookUrl: faker.datatype.boolean({ probability: 0.6 }) ? faker.internet.username() : null,
      tiktokUrl: faker.datatype.boolean({ probability: 0.4 }) ? `@${faker.internet.username()}` : null,
      isActive: faker.datatype.boolean({ probability: 0.9 }),
      shippingOriginState: state,
      freeShippingThreshold: faker.helpers.arrayElement([null, "500", "1000", "1500", "2000"]),
      defaultShippingMethodId
    });
  }

  await database
    .insert(schema.vendors)
    .values(vendorData)
    .onConflictDoNothing({ target: schema.vendors.slug });

  const vendors = await database.select().from(schema.vendors);

  // 2. Create Stripe accounts and balances for vendors
  const stripeAccounts = vendors.map(v => ({
    vendorId: v.id,
    stripeAccountId: `acct_${faker.string.alphanumeric(16).toLowerCase()}`,
    accountType: 'express' as const,
    onboardingStatus: 'completed' as const,
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
    commissionRate: String(faker.number.int({ min: 10, max: 20 })),
  }));

  await database.insert(schema.vendorStripeAccounts)
    .values(stripeAccounts)
    .onConflictDoNothing({ target: schema.vendorStripeAccounts.vendorId });

  const balances = vendors.map(v => ({
    vendorId: v.id,
    availableBalance: '0',
    pendingBalance: '0',
    reservedBalance: '0',
    currency: 'MXN',
    lifetimeVolume: '0',
  }));

  await database.insert(schema.vendorBalances)
    .values(balances)
    .onConflictDoNothing({ target: schema.vendorBalances.vendorId });

  // 3. Create products with power law distribution
  const totalProducts = 500;
  const productDistribution = powerLawDistribution(totalProducts, vendors.length, 3, 1.5);

  const productNames = getProductNamesByCategory();
  let productCounter = 0;
  const productData = [];

  for (let vendorIndex = 0; vendorIndex < vendors.length; vendorIndex++) {
    const vendor = vendors[vendorIndex];
    const productsForVendor = productDistribution[vendorIndex];
    const vendorType = vendorIndex < 5 ? 'enterprise' :
      vendorIndex < 10 ? 'established' :
        vendorIndex < 18 ? 'boutique' : 'artisan';

    for (let p = 0; p < productsForVendor; p++) {
      const category = categories[productCounter % categories.length];
      const categoryNames = productNames[category.slug as keyof typeof productNames] || productNames['default'];
      const baseName = categoryNames[p % categoryNames.length];
      const adjective = faker.helpers.arrayElement([
        "Premium", "Deluxe", "Exclusivo", "Artesanal", "Elegante",
        "Clásico", "Moderno", "Vintage", "Lujoso", "Especial"
      ]);

      const name = `${baseName} ${adjective}`;
      const price = realisticPricing(category.slug, vendorType);

      productData.push({
        name,
        slug: slugify(`${name}-${vendor.slug}-${productCounter}`, { lower: true, strict: true }),
        description: generateProductDescription(category.slug, baseName),
        categoryId: category.id,
        vendorId: vendor.id,
        price: String(price),
        images: [], // Will be filled by image generation later
        tags: generateProductTags(category.slug, vendorType),
        stock: generateStock(vendorType, vendorIndex),
        isActive: faker.datatype.boolean({ probability: 0.95 }),
        weight: getProductWeight(category.slug),
        length: faker.number.int({ min: 10, max: 50 }),
        width: faker.number.int({ min: 10, max: 40 }),
        height: faker.number.int({ min: 5, max: 30 }),
        shippingClass: faker.helpers.arrayElement(["standard", "fragile"])
      });

      productCounter++;
    }
  }

  await database
    .insert(schema.products)
    .values(productData)
    .onConflictDoNothing({ target: schema.products.slug });

  const products = await database.select().from(schema.products);

  // 4. Create product variants for top products
  const variantsData = [];
  const topProducts = products.slice(0, 150); // Add variants to top 30% of products

  for (const product of topProducts) {
    const category = categories.find(c => c.id === product.categoryId);
    const variantConfig = getVariantConfig(category?.slug || '');

    if (variantConfig) {
      for (const variant of variantConfig) {
        variantsData.push({
          productId: product.id,
          name: variant.name,
          variantType: variant.type,
          sku: `${product.id.substring(0, 8)}-${variant.type}-${faker.string.alphanumeric(4)}`,
          price: variant.priceModifier ? String(Number(product.price) + variant.priceModifier) : null,
          stock: faker.number.int({ min: 0, max: 50 }),
          attributes: variant.attributes || {},
          isActive: true
        });
      }
    }
  }

  if (variantsData.length > 0) {
    await database
      .insert(schema.productVariants)
      .values(variantsData)
      .onConflictDoNothing({ target: schema.productVariants.sku });
  }

  return {
    success: true,
    message: `Created ${vendors.length} vendors, ${products.length} products, ${variantsData.length} variants`,
    data: {
      vendors: vendors.length,
      products: products.length,
      variants: variantsData.length
    }
  };
}

function getProductNamesByCategory() {
  return {
    "flores-arreglos": [
      "Ramo de Rosas Premium", "Bouquet de Girasoles", "Orquídea en Maceta",
      "Arreglo Floral Primaveral", "Ramo de Tulipanes", "Centro de Mesa Floral",
      "Bouquet de Peonías", "Arreglo de Flores Silvestres", "Ramo de Lirios Blancos"
    ],
    "chocolates-dulces": [
      "Caja de Chocolates Artesanales", "Trufas de Chocolate Belga",
      "Chocolates Ferrero Rocher", "Brownies Artesanales", "Bombones de Licor",
      "Chocolate Oaxaqueño", "Macarons Franceses", "Galletas Decoradas"
    ],
    "velas-aromas": [
      "Vela Aromática de Lavanda", "Set de Velas Aromáticas", "Difusor de Aromas",
      "Vela de Soya Natural", "Incienso Natural", "Aceites Esenciales"
    ],
    "regalos-personalizados": [
      "Album Fotográfico Personalizado", "Taza Personalizada", "Marco Digital",
      "Libro de Recuerdos", "Cojín Personalizado", "Llavero Grabado"
    ],
    "cajas-regalo": [
      "Caja Regalo Spa", "Caja Desayuno Sorpresa", "Caja Romántica",
      "Kit de Café Especialidad", "Caja de Té Premium", "Box de Cuidado Personal"
    ],
    "decoracion-hogar": [
      "Jarrón de Talavera", "Espejo Decorativo", "Maceta Artesanal",
      "Cuadro Decorativo", "Tapete Artesanal", "Lámpara Decorativa"
    ],
    "joyeria-accesorios": [
      "Collar de Plata", "Pulsera de Oro", "Aretes de Perlas",
      "Anillo de Compromiso", "Reloj de Lujo", "Brazalete de Cuero"
    ],
    "gourmet-delicatessen": [
      "Canasta Gourmet Premium", "Tabla de Quesos", "Vino Tinto Reserva",
      "Aceite de Oliva Extra Virgen", "Miel Artesanal", "Mermeladas Gourmet"
    ],
    "default": ["Producto Especial", "Artículo Premium", "Item Exclusivo"]
  };
}

function generateProductDescription(categorySlug: string, productName: string): string {
  const descriptions: Record<string, string[]> = {
    "flores-arreglos": [
      `Hermoso arreglo floral con ${productName.toLowerCase()} frescos, perfectos para celebraciones especiales.`,
      `Incluye follaje verde y decoración elegante. Ideal para expresar tus sentimientos.`
    ],
    "chocolates-dulces": [
      `Deliciosos chocolates artesanales con cacao de la mejor calidad.`,
      `Presentación elegante, perfecta para regalar en ocasiones especiales.`
    ],
    "velas-aromas": [
      `Vela aromática de cera de soya natural con esencias premium.`,
      `Duración aproximada de ${faker.number.int({ min: 20, max: 60 })} horas de combustión.`
    ]
  };

  const categoryDescriptions = descriptions[categorySlug] || [faker.lorem.sentences(2)];
  return faker.helpers.arrayElement(categoryDescriptions);
}

function generateProductTags(categorySlug: string, vendorType: string): string[] {
  const baseTags = ["nuevo", "popular", "exclusivo"];
  const categoryTags: Record<string, string[]> = {
    "flores-arreglos": ["natural", "fresco", "romántico"],
    "chocolates-dulces": ["artesanal", "gourmet", "importado"],
    "velas-aromas": ["relajante", "aromático", "natural"],
    "joyeria-accesorios": ["elegante", "fino", "lujo"]
  };

  const tags = [...baseTags];
  if (categoryTags[categorySlug]) {
    tags.push(...faker.helpers.arrayElements(categoryTags[categorySlug], 2));
  }
  if (vendorType === 'artisan') tags.push("hecho a mano");
  if (vendorType === 'enterprise') tags.push("envío gratis");

  return faker.helpers.arrayElements(tags, faker.number.int({ min: 2, max: 4 }));
}

function generateStock(vendorType: string, vendorIndex: number): number {
  // Top vendors have more stock
  if (vendorIndex < 5) {
    return faker.number.int({ min: 20, max: 100 });
  } else if (vendorIndex < 15) {
    return faker.number.int({ min: 10, max: 50 });
  } else {
    return faker.number.int({ min: 0, max: 30 });
  }
}

function getProductWeight(categorySlug: string): number {
  const weights: Record<string, [number, number]> = {
    "flores-arreglos": [500, 3000],
    "chocolates-dulces": [100, 1000],
    "velas-aromas": [200, 800],
    "joyeria-accesorios": [50, 300],
    "gourmet-delicatessen": [300, 2000]
  };

  const [min, max] = weights[categorySlug] || [200, 1500];
  return faker.number.int({ min, max });
}

function getVariantConfig(categorySlug: string) {
  const configs: Record<string, any[]> = {
    "flores-arreglos": [
      { name: "Pequeño", type: "size", priceModifier: 0 },
      { name: "Mediano", type: "size", priceModifier: 150 },
      { name: "Grande", type: "size", priceModifier: 300 }
    ],
    "chocolates-dulces": [
      { name: "Caja 6 piezas", type: "size", priceModifier: 0 },
      { name: "Caja 12 piezas", type: "size", priceModifier: 200 },
      { name: "Caja 24 piezas", type: "size", priceModifier: 400 }
    ],
    "velas-aromas": [
      { name: "Lavanda", type: "scent", attributes: { scent: "lavender" } },
      { name: "Vainilla", type: "scent", attributes: { scent: "vanilla" } },
      { name: "Canela", type: "scent", attributes: { scent: "cinnamon" } }
    ]
  };

  return configs[categorySlug] || null;
}