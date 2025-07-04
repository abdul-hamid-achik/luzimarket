import { config } from "dotenv";
import { reset } from "drizzle-seed";
import { fakerES_MX as faker } from "@faker-js/faker";
import * as schema from "./schema";
import { generateAndUploadImage, generateProductImagePrompt, generateCategoryImagePrompt } from "../lib/openai";
import { eq, sql } from "drizzle-orm";
import slugify from "slugify";
import bcrypt from "bcryptjs";

// Load environment variables before importing db
config({ path: ".env.local" });

import { db } from "./index";


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
  {
    name: "Joyería y Accesorios",
    slug: "joyeria-accesorios",
    description: "Joyería fina y accesorios de moda",
    imageUrl: null, // Will be generated with AI
    displayOrder: 7
  },
  {
    name: "Gourmet y Delicatessen",
    slug: "gourmet-delicatessen",
    description: "Productos gourmet, vinos y delicatessen",
    imageUrl: null, // Will be generated with AI
    displayOrder: 8
  },
  {
    name: "Eventos y Cenas",
    slug: "eventos-cenas",
    description: "Servicios y productos para eventos especiales, cenas románticas y celebraciones",
    imageUrl: null, // Will be generated with AI
    displayOrder: 9
  }
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

const CITIES = ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro"];
const STATES = ["CDMX", "Jalisco", "Nuevo León", "Puebla", "Querétaro"];

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

  // Check if --no-reset flag is passed
  const shouldReset = !process.argv.includes('--no-reset');

  try {
    // Reset database if needed
    if (shouldReset) {
      console.log("🧹 Resetting database...");
      await reset(db, schema);
      console.log("✅ Database reset complete");
    } else {
      console.log("⚡ Skipping database reset (--no-reset flag detected)");
    }

    console.log("📦 Seeding database...");

    // 1. Seed Categories
    console.log("🏷️  Creating categories...");
    const categories = await db.insert(schema.categories).values(CATEGORIES).returning();
    console.log(`✅ Created ${categories.length} categories`);

    // 2. Seed Admin Users
    console.log("👤 Creating admin users...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUsers = await db.insert(schema.adminUsers).values([
      {
        email: "admin@luzimarket.shop",
        name: "Administrador Principal",
        passwordHash: hashedPassword,
        role: "super_admin",
        isActive: true
      },
      {
        email: "support@luzimarket.shop",
        name: "Soporte Técnico",
        passwordHash: hashedPassword,
        role: "admin",
        isActive: true
      },
      {
        email: "manager@luzimarket.shop",
        name: "Gerente de Ventas",
        passwordHash: hashedPassword,
        role: "admin",
        isActive: true
      }
    ]).returning();
    console.log(`✅ Created ${adminUsers.length} admin users`);

    // 3. Seed Email Templates
    console.log("📧 Creating email templates...");
    const emailTemplates = await db.insert(schema.emailTemplates).values([
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
    ]).returning();
    console.log(`✅ Created ${emailTemplates.length} email templates`);

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
        slug: slugify(businessName, { lower: true, strict: true }),
        contactName: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash: defaultPasswordHash, // All test vendors use password123
        phone: faker.phone.number(),
        whatsapp: faker.phone.number(),
        businessPhone: faker.phone.number(),
        businessHours: faker.helpers.arrayElement(BUSINESS_HOURS),
        street: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(CITIES),
        state: faker.helpers.arrayElement(STATES),
        country: "México",
        postalCode: faker.location.zipCode("#####"),
        websiteUrl: faker.datatype.boolean(0.7) ? faker.internet.url() : "",
        description: faker.lorem.sentences(2),
        hasDelivery: faker.datatype.boolean(0.8),
        deliveryService: faker.helpers.arrayElement(["own", "external", "both"]),
        instagramUrl: faker.datatype.boolean(0.6) ? `@${faker.internet.username()}` : "",
        facebookUrl: faker.datatype.boolean(0.6) ? faker.internet.username() : "",
        tiktokUrl: faker.datatype.boolean(0.4) ? `@${faker.internet.username()}` : "",
        isActive: faker.datatype.boolean(0.9)
      });
    }
    
    // Add a specific test vendor for e2e tests
    vendorData.push({
      businessName: "Test Vendor Shop",
      slug: "test-vendor-shop",
      contactName: "Test Vendor",
      email: "vendor@luzimarket.shop",
      passwordHash: defaultPasswordHash, // password123
      phone: "+52 555 123 4567",
      whatsapp: "+52 555 123 4567",
      businessPhone: "+52 555 123 4567",
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
      isActive: true
    });
    
    const vendors = await db.insert(schema.vendors).values(vendorData).returning();
    console.log(`✅ Created ${vendors.length} vendors`);

    // 5. Seed Products
    console.log("📦 Creating products...");
    const productData = [];
    
    // Group product names by category
    const CATEGORY_PRODUCT_NAMES: Record<string, string[]> = {
      "flores-arreglos": PRODUCT_NAMES.slice(0, 15),
      "chocolates-dulces": PRODUCT_NAMES.slice(15, 30),
      "velas-aromas": PRODUCT_NAMES.slice(30, 45),
      "regalos-personalizados": PRODUCT_NAMES.slice(45, 60),
      "cajas-regalo": PRODUCT_NAMES.slice(60, 75),
      "decoracion-hogar": PRODUCT_NAMES.slice(75, 90),
      "joyeria-accesorios": PRODUCT_NAMES.slice(90, 105),
      "gourmet-delicatessen": PRODUCT_NAMES.slice(105, 120)
    };
    
    for (let i = 0; i < 500; i++) {
      const category = faker.helpers.arrayElement(categories);
      const categoryProducts = CATEGORY_PRODUCT_NAMES[category.slug] || PRODUCT_NAMES;
      const baseName = faker.helpers.arrayElement(categoryProducts);
      const adjective = faker.helpers.arrayElement([
        "Premium", "Deluxe", "Exclusivo", "Artesanal", "Elegante", 
        "Clásico", "Moderno", "Vintage", "Lujoso", "Especial"
      ]);
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
      
      productData.push({
        name,
        slug: slugify(name + "-" + faker.string.alphanumeric(6), { lower: true, strict: true }),
        description,
        categoryId: category.id,
        vendorId: faker.helpers.arrayElement(vendors).id,
        price: String(Math.round(price / 50) * 50), // Round to nearest 50
        images: null, // Will be generated with AI
        tags: faker.helpers.arrayElements(["nuevo", "popular", "oferta", "exclusivo", "limitado", "artesanal", "eco-friendly", "premium"], { min: 1, max: 4 }),
        stock: faker.helpers.weightedArrayElement([
          { value: faker.number.int({ min: 1, max: 10 }), weight: 2 }, // Low stock
          { value: faker.number.int({ min: 11, max: 50 }), weight: 5 }, // Normal stock
          { value: faker.number.int({ min: 51, max: 100 }), weight: 3 }, // High stock
          { value: 0, weight: 1 } // Out of stock
        ]),
        sku: `${category.slug.substring(0, 3).toUpperCase()}-${faker.string.alphanumeric(5).toUpperCase()}`,
        isActive: faker.datatype.boolean(0.95)
      });
    }
    const products = await db.insert(schema.products).values(productData).returning();
    console.log(`✅ Created ${products.length} products`);

    // 5.5 Seed Product Variants
    console.log("🎨 Creating product variants...");
    const variantData = [];
    
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
    for (const product of products.slice(0, 200)) { // Add variants to first 200 products
      const category = categories.find(c => c.id === product.categoryId);
      if (!category) continue;
      
      const variantConfig = CATEGORY_VARIANTS[category.slug];
      if (!variantConfig) continue;

      for (const variantType of variantConfig.types) {
        const values = variantConfig.values[variantType];
        for (const value of values) {
          const stock = faker.number.int({ min: 0, max: 50 });
          variantData.push({
            productId: product.id,
            name: value.name,
            variantType,
            sku: `${product.sku}-${variantType.charAt(0).toUpperCase()}-${value.name.substring(0, 3).toUpperCase()}`,
            price: value.price ? String(Number(product.price) + value.price) : null,
            stock,
            attributes: value.attributes || {},
            isActive: stock > 0
          });
        }
      }
    }

    if (variantData.length > 0) {
      await db.insert(schema.productVariants).values(variantData);
      console.log(`✅ Created ${variantData.length} product variants`);
    }

    // 6. Seed Users (Customers)
    console.log("👥 Creating users...");
    const userPassword = await bcrypt.hash("password123", 10);
    const userData = [];
    for (let i = 0; i < 50; i++) {
      userData.push({
        email: faker.internet.email(),
        name: faker.person.fullName(),
        passwordHash: userPassword,
        stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
        isActive: faker.datatype.boolean(0.95)
      });
    }
    const users = await db.insert(schema.users).values(userData).returning();
    console.log(`✅ Created ${users.length} users`);

    // 7. Seed Newsletter Subscriptions
    console.log("📰 Creating newsletter subscriptions...");
    const subscriptionData = [];
    for (let i = 0; i < 100; i++) {
      subscriptionData.push({
        email: faker.internet.email(),
        isActive: faker.datatype.boolean(0.9)
      });
    }
    await db.insert(schema.subscriptions).values(subscriptionData);
    console.log(`✅ Created ${subscriptionData.length} subscriptions`);

    // 8. Seed Orders
    console.log("🛒 Creating orders...");
    const orderData = [];
    for (let i = 0; i < 150; i++) {
      const subtotal = faker.number.int({ min: 199, max: 9999 });
      const tax = Math.round(subtotal * 0.16);
      const shipping = faker.helpers.arrayElement([0, 99, 149, 199]);
      const total = subtotal + tax + shipping;

      orderData.push({
        userId: faker.helpers.arrayElement(users).id,
        vendorId: faker.helpers.arrayElement(vendors).id,
        orderNumber: `ORD-${faker.string.numeric(8)}`,
        status: faker.helpers.weightedArrayElement([
          { value: "delivered", weight: 4 },
          { value: "shipped", weight: 3 },
          { value: "processing", weight: 2 },
          { value: "pending", weight: 1 }
        ]),
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
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null
      });
    }
    const orders = await db.insert(schema.orders).values(orderData).returning();
    console.log(`✅ Created ${orders.length} orders`);

    // 9. Seed Order Items
    console.log("📋 Creating order items...");
    const orderItemData = [];
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
    }
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
    for (const product of productsWithReviews) {
      const reviewCount = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < reviewCount; i++) {
        const user = faker.helpers.arrayElement(users);
        // Check if user has ordered this product
        const hasOrdered = faker.datatype.boolean(0.8);

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
    }
    await db.insert(schema.reviews).values(reviewData);
    console.log(`✅ Created ${reviewData.length} reviews`);

    // Generate AI images if OpenAI key is available
    if (process.env.OPENAI_SECRET_KEY) {
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
      for (const category of categories) {
        try {
          console.log(`🖼️  Generating image for category: ${category.name}`);

          const prompt = generateCategoryImagePrompt({
            name: category.name,
            description: category.description || '',
          });

          const imageUrl = await generateAndUploadImage(
            prompt,
            `category-${category.slug}.png`,
            {
              size: '1792x1024',
              quality: 'hd',
              style: 'natural',
            }
          );

          await db.update(schema.categories)
            .set({ imageUrl })
            .where(eq(schema.categories.id, category.id));

          console.log(`✅ Generated image for ${category.name}`);

          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error generating image for ${category.name}:`, error);
        }
      }

      // Generate product images (limit to 20 for cost control)
      // Increase the limit or remove .slice() to generate images for all products
      console.log('\n🖼️  Generating product images...');
      const productsToImage = products; // Generate images for all products
      for (const product of productsToImage) {
        try {
          console.log(`🖼️  Generating image for product: ${product.name}`);

          const prompt = generateProductImagePrompt({
            name: product.name,
            description: product.description || '',
            tags: product.tags as string[],
          });

          const imageUrl = await generateAndUploadImage(
            prompt,
            `product-${product.slug}.png`,
            {
              size: '1024x1024',
              quality: 'standard',
              style: 'natural',
            }
          );

          await db.update(schema.products)
            .set({
              images: [imageUrl]
            })
            .where(eq(schema.products.id, product.id));

          console.log(`✅ Generated image for ${product.name}`);

          // Add delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error generating image for ${product.name}:`, error);
        }
      }

      console.log('\n✨ AI image generation completed!');
    } else {
      console.log("\n⚠️  Skipping AI image generation (OPENAI_SECRET_KEY not found)");
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