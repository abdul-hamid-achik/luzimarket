import { db } from "./index";
import { categories, vendors, products } from "./schema";
import { config } from "dotenv";

config({ path: ".env.local" });

async function seed() {
  console.log("🌱 Starting seed...");

  try {
    // Clear existing data
    await db.delete(products);
    await db.delete(vendors);
    await db.delete(categories);

    // Insert categories
    const categoriesData = [
      {
        name: "Flowershop",
        slug: "flowershop",
        description: "Flores y arreglos florales para toda ocasión",
        imageUrl: "/images/links/pia-riverola.webp",
        displayOrder: 1,
      },
      {
        name: "Sweet",
        slug: "sweet",
        description: "Postres, dulces y delicias",
        imageUrl: "/images/links/game-wwe-19-1507733870-150-911.jpg",
        displayOrder: 2,
      },
      {
        name: "Events + Dinners",
        slug: "events-dinners",
        description: "Todo para tus eventos y cenas especiales",
        imageUrl: "/images/links/pia-riverola.webp",
        displayOrder: 3,
      },
      {
        name: "Giftshop",
        slug: "giftshop",
        description: "Regalos únicos y especiales",
        imageUrl: "/images/links/game-wwe-19-1507733870-150-911.jpg",
        displayOrder: 4,
      },
    ];

    const insertedCategories = await db.insert(categories).values(categoriesData).returning();
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Insert vendors
    const vendorsData = [
      {
        businessName: "BOTANICA",
        contactName: "María García",
        email: "contacto@botanica.mx",
        phone: "5551234567",
        whatsapp: "5551234567",
        businessPhone: "5551234567",
        businessHours: "Lun-Sab 9:00-19:00",
        street: "Av. Presidente Masaryk 123",
        city: "CDMX",
        state: "Ciudad de México",
        country: "México",
        postalCode: "11560",
        websiteUrl: "https://botanica.mx",
        description: "Floristería boutique especializada en arreglos únicos y exclusivos",
        hasDelivery: true,
        deliveryService: "own",
        instagramUrl: "@botanica_mx",
        isActive: true,
      },
      {
        businessName: "LA VITRINA",
        contactName: "Carlos Mendoza",
        email: "info@lavitrina.mx",
        phone: "5559876543",
        whatsapp: "5559876543",
        businessPhone: "5559876543",
        businessHours: "Lun-Dom 8:00-20:00",
        street: "Polanco 456",
        city: "CDMX",
        state: "Ciudad de México",
        country: "México",
        postalCode: "11550",
        description: "Pastelería artesanal con los mejores ingredientes",
        hasDelivery: true,
        deliveryService: "external",
        instagramUrl: "@lavitrina_mx",
        facebookUrl: "lavitrinamx",
        isActive: true,
      },
      {
        businessName: "NAP",
        contactName: "Ana Rodríguez",
        email: "hola@nap.design",
        phone: "5555555555",
        businessPhone: "5555555555",
        businessHours: "Lun-Vie 10:00-18:00",
        street: "Roma Norte 789",
        city: "CDMX",
        state: "Ciudad de México",
        country: "México",
        description: "Diseño de interiores y objetos decorativos únicos",
        hasDelivery: true,
        instagramUrl: "@nap_design",
        isActive: true,
      },
      {
        businessName: "BFF Beauty",
        contactName: "Sofia Hernández",
        email: "contacto@bffbeauty.mx",
        phone: "5552223333",
        businessPhone: "5552223333",
        street: "Condesa 321",
        city: "CDMX",
        state: "Ciudad de México",
        country: "México",
        description: "Productos de belleza y skincare premium",
        hasDelivery: true,
        deliveryService: "own",
        websiteUrl: "https://bffbeauty.mx",
        instagramUrl: "@bff_beauty",
        tiktokUrl: "@bffbeauty",
        isActive: true,
      },
    ];

    const insertedVendors = await db.insert(vendors).values(vendorsData).returning();
    console.log(`✅ Inserted ${insertedVendors.length} vendors`);

    // Insert products
    const productsData = [
      // Flowershop products
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[0].id,
        name: "Sunkissed Box",
        slug: "sunkissed-box",
        description: "Hermoso arreglo floral con girasoles y flores de temporada en caja de madera",
        price: "1000.00",
        images: ["/images/links/pia-riverola.webp"],
        tags: ["flores", "girasoles", "caja", "regalo"],
        stock: 10,
      },
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[0].id,
        name: "Romance Eterno",
        slug: "romance-eterno",
        description: "Arreglo de rosas rojas premium en florero de cristal",
        price: "1500.00",
        images: ["/images/links/pia-riverola.webp"],
        tags: ["rosas", "amor", "aniversario"],
        stock: 5,
      },
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[0].id,
        name: "Primavera Box",
        slug: "primavera-box",
        description: "Mix de flores de primavera en tonos pastel",
        price: "800.00",
        images: ["/images/links/pia-riverola.webp"],
        tags: ["primavera", "pastel", "flores"],
        stock: 15,
      },

      // Sweet products
      {
        vendorId: insertedVendors[1].id,
        categoryId: insertedCategories[1].id,
        name: "Coffee Cake Deluxe",
        slug: "coffee-cake-deluxe",
        description: "Pastel de café con nueces caramelizadas y crema de mascarpone",
        price: "450.00",
        images: ["/images/links/game-wwe-19-1507733870-150-911.jpg"],
        tags: ["pastel", "café", "postre"],
        stock: 8,
      },
      {
        vendorId: insertedVendors[1].id,
        categoryId: insertedCategories[1].id,
        name: "Chocolate Dream",
        slug: "chocolate-dream",
        description: "Pastel de chocolate belga con frutos rojos",
        price: "550.00",
        images: ["/images/links/game-wwe-19-1507733870-150-911.jpg"],
        tags: ["chocolate", "pastel", "cumpleaños"],
        stock: 6,
      },
      {
        vendorId: insertedVendors[1].id,
        categoryId: insertedCategories[1].id,
        name: "Macarons Box",
        slug: "macarons-box",
        description: "Caja de 12 macarons franceses de sabores surtidos",
        price: "350.00",
        images: ["/images/links/game-wwe-19-1507733870-150-911.jpg"],
        tags: ["macarons", "francés", "regalo"],
        stock: 20,
      },

      // Giftshop products
      {
        vendorId: insertedVendors[2].id,
        categoryId: insertedCategories[3].id,
        name: "Mango Lamp",
        slug: "mango-lamp",
        description: "Lámpara de diseño minimalista inspirada en formas orgánicas",
        price: "2000.00",
        images: ["/images/links/game-wwe-19-1507733870-150-911.jpg"],
        tags: ["lámpara", "diseño", "decoración"],
        stock: 3,
      },
      {
        vendorId: insertedVendors[2].id,
        categoryId: insertedCategories[3].id,
        name: "Ceramic Vase Set",
        slug: "ceramic-vase-set",
        description: "Set de 3 jarrones de cerámica artesanal",
        price: "1200.00",
        images: ["/images/links/pia-riverola.webp"],
        tags: ["cerámica", "jarrones", "decoración"],
        stock: 7,
      },

      // Beauty products
      {
        vendorId: insertedVendors[3].id,
        categoryId: insertedCategories[3].id,
        name: "BFF Protonic Cleanser",
        slug: "bff-protonic-cleanser",
        description: "Limpiador facial con probióticos y ácido hialurónico",
        price: "440.00",
        images: ["/images/links/game-wwe-19-1507733870-150-911.jpg"],
        tags: ["skincare", "limpiador", "probióticos"],
        stock: 25,
      },
      {
        vendorId: insertedVendors[3].id,
        categoryId: insertedCategories[3].id,
        name: "Glow Serum Kit",
        slug: "glow-serum-kit",
        description: "Kit de 3 sueros para una piel radiante",
        price: "980.00",
        images: ["/images/links/game-wwe-19-1507733870-150-911.jpg"],
        tags: ["skincare", "suero", "kit"],
        stock: 12,
      },

      // Events products
      {
        vendorId: insertedVendors[0].id,
        categoryId: insertedCategories[2].id,
        name: "Centro de Mesa Elegante",
        slug: "centro-mesa-elegante",
        description: "Centro de mesa con flores blancas y velas",
        price: "1800.00",
        images: ["/images/links/pia-riverola.webp"],
        tags: ["eventos", "centro de mesa", "elegante"],
        stock: 5,
      },
      {
        vendorId: insertedVendors[1].id,
        categoryId: insertedCategories[2].id,
        name: "Mini Desserts Tower",
        slug: "mini-desserts-tower",
        description: "Torre de mini postres para eventos (50 piezas)",
        price: "2500.00",
        images: ["/images/links/game-wwe-19-1507733870-150-911.jpg"],
        tags: ["eventos", "postres", "catering"],
        stock: 2,
      },
    ];

    const insertedProducts = await db.insert(products).values(productsData).returning();
    console.log(`✅ Inserted ${insertedProducts.length} products`);

    console.log("✨ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();