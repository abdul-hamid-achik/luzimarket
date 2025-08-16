import { db } from "@/db";
import * as schema from "@/db/schema";
import { faker } from "@faker-js/faker";
import { reviewLikelihood } from "../utils/realistic-patterns";

faker.seed(12345);

const REVIEW_TITLES = {
  5: [
    "Excelente producto", "Superó mis expectativas", "100% recomendado",
    "Increíble calidad", "Muy satisfecho", "Perfecto", "Me encantó"
  ],
  4: [
    "Muy buena calidad", "Recomendado", "Buen producto",
    "Cumple su función", "Buena compra", "Satisfecho"
  ],
  3: [
    "Producto aceptable", "Regular", "Podría mejorar",
    "Cumple lo básico", "Normal"
  ],
  2: [
    "No cumplió expectativas", "Regular tirando a malo",
    "Esperaba más", "Decepcionante"
  ],
  1: [
    "Muy malo", "No lo recomiendo", "Pérdida de dinero",
    "Terrible", "Pésima calidad"
  ]
};

const REVIEW_COMMENTS = {
  5: [
    "La calidad es excepcional, totalmente recomendado.",
    "Llegó en perfectas condiciones y muy rápido.",
    "Mejor de lo que esperaba, excelente servicio.",
    "El vendedor fue muy atento y el producto es de primera."
  ],
  4: [
    "Buen producto, aunque el empaque podría mejorar.",
    "Cumple con lo prometido, buena relación calidad-precio.",
    "Me gustó mucho, solo tardó un poco en llegar.",
    "Recomendable, aunque hay detalles menores que mejorar."
  ],
  3: [
    "Es aceptable por el precio, nada extraordinario.",
    "Cumple su función pero la calidad es regular.",
    "Ni bueno ni malo, está bien para salir del paso.",
    "Esperaba un poco más de calidad."
  ],
  2: [
    "La calidad deja mucho que desear.",
    "No es lo que aparece en las fotos.",
    "Tardó mucho en llegar y no es lo que esperaba.",
    "Por el precio esperaba algo mejor."
  ],
  1: [
    "Producto de muy mala calidad, no lo recomiendo.",
    "Llegó dañado y el vendedor no respondió.",
    "Nada que ver con la descripción, muy decepcionado.",
    "Pérdida total de dinero, pésima experiencia."
  ]
};

/**
 * Seeds product reviews and ratings
 */
export async function seedReviewsAndRatings(database = db, options?: any) {
  console.log("⭐ Creating reviews and ratings...");

  const orders = await database.query.orders.findMany({
    where: (orders, { eq }) => eq(orders.status, "delivered"),
    with: {
      items: true
    }
  });

  const users = await database.select().from(schema.users);
  const products = await database.select().from(schema.products);

  if (orders.length === 0) {
    console.log("⚠️  No delivered orders found for reviews");
    return { success: true, message: "No reviews created", data: { reviews: 0 } };
  }

  const reviewData = [];
  const processedCombos = new Set(); // Track user-product combinations

  // Create reviews for delivered orders
  for (const order of orders) {
    if (!order.userId) continue;

    const user = users.find(u => u.id === order.userId);
    if (!user) continue;

    // Determine customer type based on position in array
    const userIndex = users.indexOf(user);
    const customerType = userIndex < 10 ? 'vip' :
      userIndex < 40 ? 'loyal' :
        userIndex < 100 ? 'regular' : 'occasional';

    const orderValue = parseFloat(order.total);
    const shouldReview = reviewLikelihood(orderValue, customerType);

    if (!shouldReview) continue;

    // Review some or all items in the order
    const itemsToReview = faker.helpers.arrayElements(
      order.items,
      faker.number.int({ min: 1, max: Math.min(3, order.items.length) })
    );

    for (const item of itemsToReview) {
      const comboKey = `${user.id}-${item.productId}`;
      if (processedCombos.has(comboKey)) continue;
      processedCombos.add(comboKey);

      // Generate rating based on customer type and product
      const rating = generateRating(customerType);
      const titles = REVIEW_TITLES[rating as keyof typeof REVIEW_TITLES];
      const comments = REVIEW_COMMENTS[rating as keyof typeof REVIEW_COMMENTS];

      // Ensure we always have a valid Date for faker.date.between
      const orderCreatedAt = order.createdAt ? new Date(order.createdAt) : new Date();

      reviewData.push({
        productId: item.productId,
        userId: user.id,
        orderId: order.id,
        rating,
        title: faker.helpers.arrayElement(titles),
        comment: faker.helpers.arrayElement(comments),
        isVerifiedPurchase: true,
        helpfulCount: generateHelpfulCount(rating),
        images: faker.datatype.boolean({ probability: 0.1 })
          ? [`/uploads/reviews/${faker.string.uuid()}.jpg`]
          : null,
        createdAt: faker.date.between({
          from: orderCreatedAt,
          to: new Date(Math.min(
            orderCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000,
            Date.now()
          ))
        })
      });
    }
  }

  // Add some fake reviews (non-verified purchases) for popular products
  const popularProducts = products.slice(0, 30);
  const fakeReviewUsers = faker.helpers.arrayElements(users, 20);

  for (const product of popularProducts) {
    if (faker.datatype.boolean({ probability: 0.3 })) {
      const user = faker.helpers.arrayElement(fakeReviewUsers);
      const comboKey = `${user.id}-${product.id}`;

      if (!processedCombos.has(comboKey)) {
        processedCombos.add(comboKey);
        const rating = generateRating('occasional');
        const titles = REVIEW_TITLES[rating as keyof typeof REVIEW_TITLES];
        const comments = REVIEW_COMMENTS[rating as keyof typeof REVIEW_COMMENTS];

        reviewData.push({
          productId: product.id,
          userId: user.id,
          orderId: null,
          rating,
          title: faker.helpers.arrayElement(titles),
          comment: faker.helpers.arrayElement(comments),
          isVerifiedPurchase: false,
          helpfulCount: generateHelpfulCount(rating) / 2, // Less helpful if not verified
          images: null,
          createdAt: faker.date.recent({ days: 90 })
        });
      }
    }
  }

  if (reviewData.length > 0) {
    await database.insert(schema.reviews).values(reviewData);
  }

  return {
    success: true,
    message: `Created ${reviewData.length} reviews`,
    data: {
      reviews: reviewData.length,
      verifiedReviews: reviewData.filter(r => r.isVerifiedPurchase).length,
      averageRating: (reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length).toFixed(1)
    }
  };
}

function generateRating(customerType: string): number {
  const distributions = {
    vip: { 5: 0.6, 4: 0.3, 3: 0.08, 2: 0.02, 1: 0 },
    loyal: { 5: 0.5, 4: 0.35, 3: 0.1, 2: 0.04, 1: 0.01 },
    regular: { 5: 0.4, 4: 0.35, 3: 0.15, 2: 0.07, 1: 0.03 },
    occasional: { 5: 0.35, 4: 0.3, 3: 0.2, 2: 0.1, 1: 0.05 }
  };

  const dist = distributions[customerType as keyof typeof distributions] || distributions.occasional;
  const random = Math.random();
  let cumulative = 0;

  for (const [rating, probability] of Object.entries(dist)) {
    cumulative += probability;
    if (random < cumulative) {
      return parseInt(rating);
    }
  }

  return 4; // Default
}

function generateHelpfulCount(rating: number): number {
  // Higher ratings tend to get more helpful votes
  const baseCount = {
    5: faker.number.int({ min: 5, max: 50 }),
    4: faker.number.int({ min: 3, max: 30 }),
    3: faker.number.int({ min: 1, max: 15 }),
    2: faker.number.int({ min: 0, max: 10 }),
    1: faker.number.int({ min: 0, max: 5 })
  };

  return baseCount[rating as keyof typeof baseCount] || 0;
}