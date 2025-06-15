import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { generateSlug } from "../lib/utils/slug";
import { eq } from "drizzle-orm";

// Load environment variables before importing db
config({ path: ".env.local" });

import { db } from "./index";
import { categories, vendors, products, users, adminUsers, emailTemplates, subscriptions, orders, orderItems, reviews } from "./schema";

// Generate SKU from vendor name and product name
function generateSKU(vendorName: string, productName: string, index: number): string {
  const vendorCode = vendorName.substring(0, 3).toUpperCase();
  const productCode = productName.substring(0, 3).toUpperCase();
  return `${vendorCode}-${productCode}-${String(index).padStart(4, '0')}`;
}

async function seed() {
  console.log("🌱 Starting seed...");

  try {
    // Clear existing data in correct order (respecting foreign key constraints)
    console.log("🧹 Clearing existing data...");
    await db.delete(reviews);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(products);
    await db.delete(vendors);
    await db.delete(categories);
    await db.delete(users);
    await db.delete(adminUsers);
    await db.delete(emailTemplates);
    await db.delete(subscriptions);

    // Insert categories
    console.log("📦 Inserting categories...");
    const categoriesData = [
      {
        name: "Flores y Arreglos",
        slug: "flores-arreglos",
        description: "Hermosos arreglos florales para toda ocasión: cumpleaños, aniversarios, condolencias y más",
        imageUrl: "/images/categories/flores.jpg",
        displayOrder: 1,
      },
      {
        name: "Chocolates y Dulces",
        slug: "chocolates-dulces",
        description: "Deliciosos chocolates artesanales, bombones y dulces gourmet",
        imageUrl: "/images/categories/chocolates.jpg",
        displayOrder: 2,
      },
      {
        name: "Velas y Aromas",
        slug: "velas-aromas",
        description: "Velas aromáticas, difusores y productos para crear ambientes especiales",
        imageUrl: "/images/categories/velas.jpg",
        displayOrder: 3,
      },
      {
        name: "Regalos Personalizados",
        slug: "regalos-personalizados",
        description: "Regalos únicos y personalizados para ocasiones especiales",
        imageUrl: "/images/categories/regalos.jpg",
        displayOrder: 4,
      },
      {
        name: "Cajas de Regalo",
        slug: "cajas-regalo",
        description: "Cajas curadas con productos selectos para regalar",
        imageUrl: "/images/categories/cajas.jpg",
        displayOrder: 5,
      },
      {
        name: "Decoración y Hogar",
        slug: "decoracion-hogar",
        description: "Artículos decorativos y accesorios para el hogar",
        imageUrl: "/images/categories/decoracion.jpg",
        displayOrder: 6,
      },
      {
        name: "Joyería y Accesorios",
        slug: "joyeria-accesorios",
        description: "Joyería fina y accesorios de moda",
        imageUrl: "/images/categories/joyeria.jpg",
        displayOrder: 7,
      },
      {
        name: "Gourmet y Delicatessen",
        slug: "gourmet-delicatessen",
        description: "Productos gourmet, vinos y delicatessen",
        imageUrl: "/images/categories/gourmet.jpg",
        displayOrder: 8,
      }
    ];

    const insertedCategories = await db.insert(categories).values(categoriesData).returning();
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Insert vendors
    console.log("🏪 Inserting vendors...");
    const vendorsData = [
      {
        businessName: "Flores del Valle",
        slug: generateSlug("Flores del Valle"),
        contactName: "María Elena González",
        email: "contacto@floresdelvalle.mx",
        phone: "5551234567",
        whatsapp: "5551234567",
        businessPhone: "5551234567",
        businessHours: "Lun-Sab: 8:00-20:00, Dom: 9:00-18:00",
        street: "Av. Presidente Masaryk 123",
        city: "Ciudad de México",
        state: "CDMX",
        country: "México",
        postalCode: "11560",
        websiteUrl: "https://floresdelvalle.mx",
        description: "Floristería boutique con más de 20 años de experiencia, especializados en arreglos florales únicos y exclusivos para toda ocasión",
        hasDelivery: true,
        deliveryService: "own",
        instagramUrl: "@floresdelvalle_mx",
        facebookUrl: "floresdelvallemx",
        isActive: true,
      },
      {
        businessName: "Chocolatería Artesanal Cacao",
        slug: generateSlug("Chocolatería Artesanal Cacao"),
        contactName: "Carlos Mendoza Ruiz",
        email: "info@chocolateriacacao.mx",
        phone: "5559876543",
        whatsapp: "5559876543",
        businessPhone: "5559876543",
        businessHours: "Lun-Vie: 10:00-19:00, Sab: 10:00-17:00",
        street: "Polanco 456, Local 12",
        city: "Ciudad de México",
        state: "CDMX",
        country: "México",
        postalCode: "11550",
        description: "Chocolatería artesanal con cacao mexicano de la más alta calidad. Creamos experiencias únicas con cada bocado",
        hasDelivery: true,
        deliveryService: "external",
        instagramUrl: "@cacao_artesanal",
        facebookUrl: "cacaoartesanal",
        tiktokUrl: "@cacao_mx",
        isActive: true,
      },
      {
        businessName: "Luzia Candles",
        slug: generateSlug("Luzia Candles"),
        contactName: "Ana Sofía Herrera",
        email: "hola@luziacandles.mx",
        phone: "5555555555",
        whatsapp: "5555555556",
        businessPhone: "5555555555",
        businessHours: "Lun-Vie: 11:00-19:00, Sab: 11:00-16:00",
        street: "Roma Norte 789, Local A",
        city: "Ciudad de México",
        state: "CDMX",
        country: "México",
        postalCode: "06700",
        description: "Velas artesanales hechas a mano con cera de soya 100% natural y aceites esenciales. Aromas únicos para cada espacio",
        hasDelivery: true,
        deliveryService: "own",
        websiteUrl: "https://luziacandles.mx",
        instagramUrl: "@luzia_candles",
        tiktokUrl: "@luziacandles",
        isActive: true,
      },
      {
        businessName: "Regalo Perfecto MX",
        slug: generateSlug("Regalo Perfecto MX"),
        contactName: "Sofía Hernández López",
        email: "contacto@regaloperfecto.mx",
        phone: "5552223333",
        whatsapp: "5552223334",
        businessPhone: "5552223333",
        businessHours: "Lun-Dom: 9:00-21:00",
        street: "Condesa 321, Piso 2",
        city: "Ciudad de México",
        state: "CDMX",
        country: "México",
        postalCode: "06140",
        description: "Especialistas en regalos personalizados y cajas de regalo curadas. Hacemos que cada regalo sea inolvidable",
        hasDelivery: true,
        deliveryService: "own",
        websiteUrl: "https://regaloperfecto.mx",
        instagramUrl: "@regalo_perfecto_mx",
        facebookUrl: "regaloperfectomx",
        isActive: true,
      },
      {
        businessName: "Casa Décor Studio",
        slug: generateSlug("Casa Décor Studio"),
        contactName: "Roberto Jiménez",
        email: "info@casadecor.mx",
        phone: "5554445555",
        businessPhone: "5554445555",
        businessHours: "Lun-Sab: 10:00-19:00",
        street: "San Ángel 234",
        city: "Ciudad de México",
        state: "CDMX",
        country: "México",
        postalCode: "01000",
        description: "Artículos de decoración y diseño de interiores. Piezas únicas de diseñadores mexicanos",
        hasDelivery: true,
        deliveryService: "external",
        instagramUrl: "@casadecor_studio",
        isActive: true,
      },
      {
        businessName: "Joyería Plata y Oro",
        slug: generateSlug("Joyería Plata y Oro"),
        contactName: "Isabella Martínez",
        email: "ventas@platayoro.mx",
        phone: "5556667777",
        whatsapp: "5556667778",
        businessPhone: "5556667777",
        businessHours: "Lun-Sab: 11:00-19:00",
        street: "Coyoacán 567",
        city: "Ciudad de México", 
        state: "CDMX",
        country: "México",
        postalCode: "04000",
        description: "Joyería fina con diseños exclusivos en plata .925 y oro. Piezas únicas para ocasiones especiales",
        hasDelivery: true,
        deliveryService: "own",
        websiteUrl: "https://platayoro.mx",
        instagramUrl: "@platayoro_mx",
        isActive: true,
      },
      {
        businessName: "Delicias Gourmet",
        slug: generateSlug("Delicias Gourmet"),
        contactName: "Chef Pierre Dubois",
        email: "pedidos@deliciasgourmet.mx",
        phone: "5557778888",
        businessPhone: "5557778888",
        businessHours: "Mar-Dom: 10:00-18:00",
        street: "Lomas de Chapultepec 890",
        city: "Ciudad de México",
        state: "CDMX",
        country: "México",
        postalCode: "11000",
        description: "Productos gourmet importados y nacionales. Vinos, quesos, jamones y delicatessen selectos",
        hasDelivery: true,
        deliveryService: "own",
        instagramUrl: "@delicias_gourmet_mx",
        facebookUrl: "deliciasgourmetmx",
        isActive: true,
      }
    ];

    const insertedVendors = await db.insert(vendors).values(vendorsData).returning();
    console.log(`✅ Inserted ${insertedVendors.length} vendors`);

    // Insert products with realistic Mexican prices
    console.log("🎁 Inserting products...");
    const productsData = [
      // Flores y Arreglos - Flores del Valle
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[0].id,
        name: "Ramo de 24 Rosas Rojas Premium",
        slug: "ramo-24-rosas-rojas-premium",
        description: "Elegante ramo de 24 rosas rojas de tallo largo, cultivadas en los mejores invernaderos. Incluye follaje verde, papel coreano premium y moño de seda. Perfecto para aniversarios y declaraciones de amor.",
        price: "1899.00",
        images: ["/images/products/rosas-rojas-24.jpg", "/images/products/rosas-rojas-24-2.jpg"],
        tags: ["rosas", "amor", "aniversario", "premium", "tallo-largo"],
        stock: 15,
      },
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[0].id,
        name: "Arreglo Primaveral en Caja",
        slug: "arreglo-primaveral-caja",
        description: "Hermoso arreglo floral con girasoles, gerberas y flores de temporada en una elegante caja de madera. Incluye tarjeta personalizada.",
        price: "1299.00",
        images: ["/images/products/arreglo-primaveral.jpg"],
        tags: ["girasoles", "gerberas", "primavera", "caja", "alegre"],
        stock: 20,
      },
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[0].id,
        name: "Orquídea Phalaenopsis Blanca",
        slug: "orquidea-phalaenopsis-blanca",
        description: "Elegante orquídea Phalaenopsis blanca de dos varas en maceta de cerámica. Una planta que dura meses con los cuidados adecuados.",
        price: "1599.00",
        images: ["/images/products/orquidea-blanca.jpg"],
        tags: ["orquidea", "planta", "elegante", "duradero", "blanco"],
        stock: 8,
      },
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[0].id,
        name: "Ramo de Tulipanes Holandeses",
        slug: "ramo-tulipanes-holandeses",
        description: "Exclusivo ramo de 20 tulipanes importados de Holanda en colores variados. Disponible por temporada.",
        price: "2299.00",
        images: ["/images/products/tulipanes.jpg"],
        tags: ["tulipanes", "importado", "exclusivo", "primavera"],
        stock: 5,
      },
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[0].id,
        name: "Corona Fúnebre Paz Eterna",
        slug: "corona-funebre-paz-eterna",
        description: "Corona fúnebre con rosas blancas, crisantemos y follaje verde. Incluye base y moño con mensaje de condolencias.",
        price: "2899.00",
        images: ["/images/products/corona-funebre.jpg"],
        tags: ["funeral", "condolencias", "corona", "rosas-blancas"],
        stock: 3,
      },

      // Chocolates y Dulces - Chocolatería Cacao
      {
        vendorId: insertedVendors[1].id,
        categoryId: insertedCategories[1].id,
        name: "Caja de 24 Trufas Artesanales",
        slug: "caja-24-trufas-artesanales",
        description: "Exquisita selección de 24 trufas artesanales con cacao mexicano 70%. Sabores: café de Veracruz, mezcal, chile, vainilla de Papantla y más.",
        price: "899.00",
        images: ["/images/products/trufas-24.jpg", "/images/products/trufas-24-2.jpg"],
        tags: ["trufas", "artesanal", "cacao-mexicano", "gourmet", "regalo"],
        stock: 25,
      },
      {
        vendorId: insertedVendors[1].id,
        categoryId: insertedCategories[1].id,
        name: "Tableta de Chocolate Bean to Bar 85%",
        slug: "tableta-chocolate-bean-to-bar-85",
        description: "Tableta de chocolate negro 85% cacao de Chiapas, proceso bean to bar. Notas frutales y acabado aterciopelado. 100g.",
        price: "189.00",
        images: ["/images/products/tableta-85.jpg"],
        tags: ["chocolate-negro", "bean-to-bar", "chiapas", "premium"],
        stock: 40,
      },
      {
        vendorId: insertedVendors[1].id,
        categoryId: insertedCategories[1].id,
        name: "Bombones de Mezcal (12 piezas)",
        slug: "bombones-mezcal-12",
        description: "Innovadores bombones rellenos de ganache con mezcal artesanal de Oaxaca. Una experiencia única que combina chocolate y destilado.",
        price: "549.00",
        images: ["/images/products/bombones-mezcal.jpg"],
        tags: ["bombones", "mezcal", "oaxaca", "innovador", "alcohol"],
        stock: 15,
      },
      {
        vendorId: insertedVendors[1].id,
        categoryId: insertedCategories[1].id,
        name: "Caja Degustación Cacao Mexicano",
        slug: "caja-degustacion-cacao-mexicano",
        description: "Caja con 6 tabletas de diferentes regiones de México: Tabasco, Chiapas, Oaxaca. Incluye guía de cata y maridaje.",
        price: "1299.00",
        images: ["/images/products/caja-degustacion.jpg"],
        tags: ["degustacion", "cacao-mexicano", "gourmet", "educativo"],
        stock: 10,
      },

      // Velas y Aromas - Luzia Candles
      {
        vendorId: insertedVendors[2].id,
        categoryId: insertedCategories[2].id,
        name: "Vela de Soya Lavanda y Vainilla 300g",
        slug: "vela-soya-lavanda-vainilla-300g",
        description: "Vela artesanal de cera de soya 100% natural con aceites esenciales de lavanda francesa y vainilla. Duración aproximada: 60 horas.",
        price: "449.00",
        images: ["/images/products/vela-lavanda.jpg"],
        tags: ["vela-soya", "lavanda", "vainilla", "aromaterapia", "relajante"],
        stock: 30,
      },
      {
        vendorId: insertedVendors[2].id,
        categoryId: insertedCategories[2].id,
        name: "Set de 3 Velas Mini Cítricos",
        slug: "set-3-velas-mini-citricos",
        description: "Set de 3 velas pequeñas (100g c/u) con aromas cítricos: limón siciliano, toronja rosa y mandarina. Perfectas para regalar.",
        price: "599.00",
        images: ["/images/products/set-velas-citricos.jpg"],
        tags: ["set-velas", "citricos", "mini", "regalo", "energizante"],
        stock: 25,
      },
      {
        vendorId: insertedVendors[2].id,
        categoryId: insertedCategories[2].id,
        name: "Difusor de Varillas Sándalo y Jazmín",
        slug: "difusor-varillas-sandalo-jazmin",
        description: "Elegante difusor de varillas con fragancia de sándalo y jazmín. Incluye 8 varillas de ratán y 200ml de fragancia. Duración: 3 meses.",
        price: "799.00",
        images: ["/images/products/difusor-sandalo.jpg"],
        tags: ["difusor", "sandalo", "jazmin", "aromatizador", "elegante"],
        stock: 18,
      },
      {
        vendorId: insertedVendors[2].id,
        categoryId: insertedCategories[2].id,
        name: "Vela Especial Navidad - Canela y Naranja",
        slug: "vela-navidad-canela-naranja",
        description: "Vela edición especial de Navidad con aroma a canela de Ceilán y naranja. Presentación en frasco de vidrio ámbar. 400g.",
        price: "649.00",
        images: ["/images/products/vela-navidad.jpg"],
        tags: ["navidad", "canela", "naranja", "edicion-especial", "festivo"],
        stock: 50,
      },

      // Regalos Personalizados - Regalo Perfecto MX
      {
        vendorId: insertedVendors[3].id,
        categoryId: insertedCategories[3].id,
        name: "Caja de Madera Grabada con Vino",
        slug: "caja-madera-grabada-vino",
        description: "Elegante caja de madera de pino grabada con láser. Incluye botella de vino tinto reserva y 2 copas. Personalización incluida.",
        price: "1899.00",
        images: ["/images/products/caja-vino-grabada.jpg"],
        tags: ["personalizado", "vino", "grabado", "madera", "elegante"],
        stock: 12,
      },
      {
        vendorId: insertedVendors[3].id,
        categoryId: insertedCategories[3].id,
        name: "Album Fotográfico Personalizado Premium",
        slug: "album-fotografico-personalizado-premium",
        description: "Álbum fotográfico de 30x30cm con portada personalizada en piel genuina. 50 páginas, impresión profesional. Incluye caja de presentación.",
        price: "2499.00",
        images: ["/images/products/album-personalizado.jpg"],
        tags: ["album", "fotos", "personalizado", "piel", "recuerdos"],
        stock: 8,
      },
      {
        vendorId: insertedVendors[3].id,
        categoryId: insertedCategories[3].id,
        name: "Taza Mágica con Foto y Mensaje",
        slug: "taza-magica-foto-mensaje",
        description: "Taza de cerámica que revela tu foto y mensaje al agregar líquido caliente. Capacidad 350ml. Incluye caja de regalo.",
        price: "299.00",
        images: ["/images/products/taza-magica.jpg"],
        tags: ["taza", "personalizado", "foto", "magica", "economico"],
        stock: 40,
      },

      // Cajas de Regalo - Regalo Perfecto MX
      {
        vendorId: insertedVendors[3].id,
        categoryId: insertedCategories[4].id,
        name: "Caja Spa en Casa Deluxe",
        slug: "caja-spa-casa-deluxe",
        description: "Caja de regalo con productos spa: sales de baño, aceites esenciales, vela aromática, mascarilla facial, toalla de bambú y más.",
        price: "1799.00",
        images: ["/images/products/caja-spa.jpg"],
        tags: ["spa", "relajacion", "autocuidado", "mujer", "bienestar"],
        stock: 15,
      },
      {
        vendorId: insertedVendors[3].id,
        categoryId: insertedCategories[4].id,
        name: "Caja Gourmet Mexicana",
        slug: "caja-gourmet-mexicana",
        description: "Selección de productos gourmet mexicanos: mezcal artesanal, chocolates, café de especialidad, miel de agave, sal de gusano y más.",
        price: "2299.00",
        images: ["/images/products/caja-gourmet-mx.jpg"],
        tags: ["gourmet", "mexicano", "mezcal", "cafe", "premium"],
        stock: 10,
      },
      {
        vendorId: insertedVendors[3].id,
        categoryId: insertedCategories[4].id,
        name: "Caja Desayuno Sorpresa",
        slug: "caja-desayuno-sorpresa",
        description: "Desayuno completo en caja: jugo natural, fruta, pan artesanal, mermeladas, queso, jamón serrano, croissant y mensaje personalizado.",
        price: "899.00",
        images: ["/images/products/caja-desayuno.jpg"],
        tags: ["desayuno", "sorpresa", "mañana", "romantico", "completo"],
        stock: 20,
      },

      // Decoración y Hogar - Casa Décor Studio
      {
        vendorId: insertedVendors[4].id,
        categoryId: insertedCategories[5].id,
        name: "Jarrón de Talavera Artesanal Grande",
        slug: "jarron-talavera-artesanal-grande",
        description: "Hermoso jarrón de Talavera poblana hecho a mano. Diseño tradicional con colores vibrantes. Altura: 40cm. Pieza única.",
        price: "2899.00",
        images: ["/images/products/jarron-talavera.jpg"],
        tags: ["talavera", "artesanal", "mexicano", "decorativo", "unico"],
        stock: 5,
      },
      {
        vendorId: insertedVendors[4].id,
        categoryId: insertedCategories[5].id,
        name: "Set de 3 Macetas Colgantes Macramé",
        slug: "set-3-macetas-colgantes-macrame",
        description: "Set de 3 macetas colgantes de macramé hechas a mano con algodón natural. Incluye macetas de cerámica. Diferentes tamaños.",
        price: "1299.00",
        images: ["/images/products/macetas-macrame.jpg"],
        tags: ["macrame", "plantas", "colgante", "boho", "natural"],
        stock: 12,
      },
      {
        vendorId: insertedVendors[4].id,
        categoryId: insertedCategories[5].id,
        name: "Espejo Sol de Madera Tallada",
        slug: "espejo-sol-madera-tallada",
        description: "Espejo decorativo en forma de sol con marco de madera de pino tallada a mano. Diámetro: 80cm. Acabado natural.",
        price: "3499.00",
        images: ["/images/products/espejo-sol.jpg"],
        tags: ["espejo", "madera", "tallado", "sol", "artesanal"],
        stock: 4,
      },
      {
        vendorId: insertedVendors[4].id,
        categoryId: insertedCategories[5].id,
        name: "Cojines Bordados Otomí (Par)",
        slug: "cojines-bordados-otomi-par",
        description: "Par de cojines con bordado Otomí tradicional hecho a mano. Funda de algodón 100%, relleno incluido. 45x45cm.",
        price: "1899.00",
        images: ["/images/products/cojines-otomi.jpg"],
        tags: ["cojines", "otomi", "bordado", "tradicional", "colorido"],
        stock: 8,
      },

      // Joyería y Accesorios - Joyería Plata y Oro
      {
        vendorId: insertedVendors[5].id,
        categoryId: insertedCategories[6].id,
        name: "Collar de Plata con Ámbar de Chiapas",
        slug: "collar-plata-ambar-chiapas",
        description: "Elegante collar de plata .925 con dije de ámbar auténtico de Chiapas. Cadena de 45cm. Incluye certificado de autenticidad.",
        price: "3299.00",
        images: ["/images/products/collar-ambar.jpg"],
        tags: ["plata", "ambar", "chiapas", "collar", "elegante"],
        stock: 6,
      },
      {
        vendorId: insertedVendors[5].id,
        categoryId: insertedCategories[6].id,
        name: "Aretes de Oro 14k con Perlas Cultivadas",
        slug: "aretes-oro-14k-perlas",
        description: "Finos aretes de oro amarillo 14k con perlas cultivadas de 8mm. Cierre de mariposa. Presentación en estuche de terciopelo.",
        price: "4899.00",
        images: ["/images/products/aretes-perlas.jpg"],
        tags: ["oro", "perlas", "aretes", "fino", "clasico"],
        stock: 4,
      },
      {
        vendorId: insertedVendors[5].id,
        categoryId: insertedCategories[6].id,
        name: "Pulsera de Plata con Dijes Mexicanos",
        slug: "pulsera-plata-dijes-mexicanos",
        description: "Pulsera de plata .925 con 7 dijes representativos de México: catrina, corazón, cactus, chile, sombrero y más. 19cm.",
        price: "2499.00",
        images: ["/images/products/pulsera-dijes.jpg"],
        tags: ["plata", "pulsera", "mexicano", "dijes", "tradicional"],
        stock: 10,
      },
      {
        vendorId: insertedVendors[5].id,
        categoryId: insertedCategories[6].id,
        name: "Anillo de Plata con Turquesa",
        slug: "anillo-plata-turquesa",
        description: "Anillo de plata .925 con piedra turquesa natural. Diseño artesanal único. Disponible en varias tallas.",
        price: "1899.00",
        images: ["/images/products/anillo-turquesa.jpg"],
        tags: ["plata", "anillo", "turquesa", "artesanal", "natural"],
        stock: 8,
      },

      // Gourmet y Delicatessen - Delicias Gourmet
      {
        vendorId: insertedVendors[6].id,
        categoryId: insertedCategories[7].id,
        name: "Canasta de Vinos Premium",
        slug: "canasta-vinos-premium",
        description: "Selección de 3 vinos premium: tinto reserva del Valle de Guadalupe, blanco de Coahuila y rosado. Incluye canasta de mimbre.",
        price: "3499.00",
        images: ["/images/products/canasta-vinos.jpg"],
        tags: ["vino", "premium", "valle-guadalupe", "canasta", "regalo"],
        stock: 5,
      },
      {
        vendorId: insertedVendors[6].id,
        categoryId: insertedCategories[7].id,
        name: "Tabla de Quesos Artesanales Mexicanos",
        slug: "tabla-quesos-artesanales-mexicanos",
        description: "Selección de 5 quesos artesanales mexicanos (500g total), mermeladas, nueces y galletas. Tabla de madera de encino incluida.",
        price: "1899.00",
        images: ["/images/products/tabla-quesos.jpg"],
        tags: ["quesos", "artesanal", "mexicano", "tabla", "gourmet"],
        stock: 8,
      },
      {
        vendorId: insertedVendors[6].id,
        categoryId: insertedCategories[7].id,
        name: "Kit de Café de Especialidad",
        slug: "kit-cafe-especialidad",
        description: "3 bolsas de café de especialidad (250g c/u) de Veracruz, Chiapas y Oaxaca. Incluye prensa francesa y taza de cerámica.",
        price: "1599.00",
        images: ["/images/products/kit-cafe.jpg"],
        tags: ["cafe", "especialidad", "mexicano", "kit", "gourmet"],
        stock: 12,
      },
      {
        vendorId: insertedVendors[6].id,
        categoryId: insertedCategories[7].id,
        name: "Aceite de Oliva Extra Virgen Premium 750ml",
        slug: "aceite-oliva-extra-virgen-750ml",
        description: "Aceite de oliva extra virgen de primera prensada en frío. Importado de España. Notas frutales y picante equilibrado.",
        price: "899.00",
        images: ["/images/products/aceite-oliva.jpg"],
        tags: ["aceite-oliva", "extra-virgen", "importado", "gourmet", "cocina"],
        stock: 20,
      }
    ];

    // Map products data with SKUs
    const productsDataWithSKU = productsData.map((product, index) => {
      const vendorIndex = insertedVendors.findIndex(v => v.id === product.vendorId);
      const vendorName = vendorIndex >= 0 ? vendorsData[vendorIndex].businessName : "VND";
      return {
        ...product,
        sku: generateSKU(vendorName, product.name, index + 1)
      };
    });

    const insertedProducts = await db.insert(products).values(productsDataWithSKU).returning();
    console.log(`✅ Inserted ${insertedProducts.length} products`);

    // Insert admin users
    console.log("👤 Inserting admin users...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminUsersData = [
      {
        email: "admin@luzimarket.shop",
        name: "Administrador Principal",
        passwordHash: adminPassword,
        role: "super_admin",
        isActive: true,
      },
      {
        email: "soporte@luzimarket.shop",
        name: "Soporte Técnico",
        passwordHash: adminPassword,
        role: "admin",
        isActive: true,
      }
    ];

    const insertedAdmins = await db.insert(adminUsers).values(adminUsersData).returning();
    console.log(`✅ Inserted ${insertedAdmins.length} admin users`);

    // Insert test customers
    console.log("👥 Inserting test customers...");
    const customerPassword = await bcrypt.hash("customer123", 10);
    const customersData = [
      {
        email: "maria.garcia@email.com",
        name: "María García",
        passwordHash: customerPassword,
        stripeCustomerId: "cus_test_maria",
        isActive: true,
      },
      {
        email: "carlos.lopez@email.com",
        name: "Carlos López",
        passwordHash: customerPassword,
        stripeCustomerId: "cus_test_carlos",
        isActive: true,
      },
      {
        email: "ana.martinez@email.com",
        name: "Ana Martínez",
        passwordHash: customerPassword,
        stripeCustomerId: "cus_test_ana",
        isActive: true,
      }
    ];

    const insertedCustomers = await db.insert(users).values(customersData).returning();
    console.log(`✅ Inserted ${insertedCustomers.length} customers`);

    // Insert email templates
    console.log("📧 Inserting email templates...");
    const emailTemplatesData = [
      {
        name: "welcome",
        subject: "¡Bienvenido a Luzimarket!",
        htmlTemplate: "<h1>¡Hola {{name}}!</h1><p>Bienvenido a Luzimarket, tu destino para regalos especiales.</p><p>Gracias por unirte a nuestra comunidad.</p>",
        textTemplate: "Hola {{name}}, Bienvenido a Luzimarket!",
        variables: ["name"],
      },
      {
        name: "order_confirmation",
        subject: "Confirmación de pedido #{{orderNumber}}",
        htmlTemplate: "<h1>¡Gracias por tu compra!</h1><p>Hola {{customerName}},</p><p>Hemos recibido tu pedido #{{orderNumber}}.</p><p>Total: ${{total}} MXN</p>",
        textTemplate: "Confirmación de pedido #{{orderNumber}}. Total: ${{total}} MXN",
        variables: ["customerName", "orderNumber", "total"],
      },
      {
        name: "order_shipped",
        subject: "Tu pedido #{{orderNumber}} ha sido enviado",
        htmlTemplate: "<h1>¡Tu pedido está en camino!</h1><p>Hola {{customerName}},</p><p>Tu pedido #{{orderNumber}} ha sido enviado.</p><p>Número de guía: {{trackingNumber}}</p>",
        textTemplate: "Tu pedido #{{orderNumber}} ha sido enviado. Guía: {{trackingNumber}}",
        variables: ["customerName", "orderNumber", "trackingNumber"],
      },
      {
        name: "vendor_approved",
        subject: "¡Tu solicitud de vendedor ha sido aprobada!",
        htmlTemplate: "<h1>¡Bienvenido a Luzimarket como vendedor!</h1><p>Hola {{vendorName}},</p><p>Tu solicitud para {{businessName}} ha sido aprobada.</p><p>Ya puedes comenzar a publicar tus productos.</p>",
        textTemplate: "Tu solicitud de vendedor ha sido aprobada. ¡Bienvenido!",
        variables: ["vendorName", "businessName"],
      }
    ];

    const insertedTemplates = await db.insert(emailTemplates).values(emailTemplatesData).returning();
    console.log(`✅ Inserted ${insertedTemplates.length} email templates`);

    // Insert sample subscriptions
    console.log("📮 Inserting newsletter subscriptions...");
    const subscriptionsData = [
      { email: "newsletter1@email.com" },
      { email: "newsletter2@email.com" },
      { email: "newsletter3@email.com" },
    ];

    const insertedSubscriptions = await db.insert(subscriptions).values(subscriptionsData).returning();
    console.log(`✅ Inserted ${insertedSubscriptions.length} subscriptions`);

    // Insert sample orders with realistic data
    console.log("📦 Inserting sample orders...");
    const ordersData = [
      {
        orderNumber: "LM-2024-001",
        userId: insertedCustomers[0].id,
        vendorId: insertedVendors[0].id,
        status: "delivered",
        subtotal: "1899.00",
        tax: "303.84",
        shipping: "150.00",
        total: "2352.84",
        paymentIntentId: "pi_test_001",
        paymentStatus: "succeeded",
        shippingAddress: {
          street: "Av. Reforma 123",
          city: "Ciudad de México",
          state: "CDMX",
          postalCode: "06500",
          country: "México"
        },
        notes: "Entregar en recepción del edificio",
        createdAt: new Date("2024-01-15"),
      },
      {
        orderNumber: "LM-2024-002",
        userId: insertedCustomers[1].id,
        vendorId: insertedVendors[1].id,
        status: "shipped",
        subtotal: "899.00",
        tax: "143.84",
        shipping: "99.00",
        total: "1141.84",
        paymentIntentId: "pi_test_002",
        paymentStatus: "succeeded",
        shippingAddress: {
          street: "Calle Madero 456",
          city: "Ciudad de México",
          state: "CDMX",
          postalCode: "06000",
          country: "México"
        },
        createdAt: new Date("2024-01-20"),
      }
    ];

    const insertedOrders = await db.insert(orders).values(ordersData).returning();
    console.log(`✅ Inserted ${insertedOrders.length} orders`);

    // Insert order items
    console.log("🛒 Inserting order items...");
    const orderItemsData = [
      {
        orderId: insertedOrders[0].id,
        productId: insertedProducts[0].id, // Ramo de 24 Rosas
        quantity: 1,
        price: "1899.00",
        total: "1899.00",
      },
      {
        orderId: insertedOrders[1].id,
        productId: insertedProducts[5].id, // Caja de Trufas
        quantity: 1,
        price: "899.00",
        total: "899.00",
      }
    ];

    const insertedOrderItems = await db.insert(orderItems).values(orderItemsData).returning();
    console.log(`✅ Inserted ${insertedOrderItems.length} order items`);

    // Insert sample reviews
    console.log("⭐ Inserting sample reviews...");
    const reviewsData = [
      {
        productId: insertedProducts[0].id,
        userId: insertedCustomers[0].id,
        orderId: insertedOrders[0].id,
        rating: 5,
        title: "Hermosas rosas, excelente calidad",
        comment: "Las rosas llegaron frescas y hermosas. El arreglo estaba tal cual la foto. Mi esposa quedó encantada. Definitivamente volveré a comprar.",
        isVerifiedPurchase: true,
        helpfulCount: 12,
      },
      {
        productId: insertedProducts[5].id,
        userId: insertedCustomers[1].id,
        orderId: insertedOrders[1].id,
        rating: 5,
        title: "Deliciosas trufas artesanales",
        comment: "El sabor es increíble, se nota la calidad del cacao. La presentación es elegante, perfecta para regalo. Las de mezcal son mis favoritas.",
        isVerifiedPurchase: true,
        helpfulCount: 8,
      },
      {
        productId: insertedProducts[0].id,
        userId: insertedCustomers[2].id,
        rating: 4,
        title: "Muy bonitas pero un poco caras",
        comment: "Las rosas son de muy buena calidad y el arreglo es hermoso. Solo me pareció un poco elevado el precio, pero la calidad lo justifica.",
        isVerifiedPurchase: false,
        helpfulCount: 5,
      }
    ];

    const insertedReviews = await db.insert(reviews).values(reviewsData).returning();
    console.log(`✅ Inserted ${insertedReviews.length} reviews`);

    console.log("\n✨ Seed completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`- Categories: ${insertedCategories.length}`);
    console.log(`- Vendors: ${insertedVendors.length}`);
    console.log(`- Products: ${insertedProducts.length}`);
    console.log(`- Admin users: ${insertedAdmins.length}`);
    console.log(`- Customers: ${insertedCustomers.length}`);
    console.log(`- Email templates: ${insertedTemplates.length}`);
    console.log(`- Subscriptions: ${insertedSubscriptions.length}`);
    console.log(`- Orders: ${insertedOrders.length}`);
    console.log(`- Reviews: ${insertedReviews.length}`);
    
    console.log("\n🔐 Login credentials:");
    console.log("Admin: admin@luzimarket.shop / admin123");
    console.log("Customer: maria.garcia@email.com / customer123");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();