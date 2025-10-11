import { db } from "@/db";
import * as schema from "@/db/schema";
import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { SeedLogger } from "../utils/logger";

const logger = new SeedLogger();

faker.seed(12345);

/**
 * Seeds moderation and support-related data
 */
export async function seedModerationAndSupport(database = db, options?: any) {
  logger.info("Creating moderation and support data", true);

  const products = await database.query.products.findMany({
    where: (products, { isNotNull, and, gt }) =>
      and(
        isNotNull(products.images),
        sql`json_array_length(${products.images}) > 0`
      ),
    limit: 100
  });

  const adminUsers = await database.select().from(schema.adminUsers);
  const vendors = await database.select().from(schema.vendors);

  if (products.length === 0) {
    logger.warn("No products with images found for moderation");
    return { success: true, message: "No moderation data created", data: {} };
  }

  // 1. Create image moderation records
  const moderationData = [];

  for (const product of products.slice(0, 50)) { // Moderate first 50 products with images
    const images = product.images as string[];
    if (!images || images.length === 0) continue;

    const vendor = vendors.find(v => v.id === product.vendorId);
    if (!vendor) continue;

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];

      // Determine moderation status
      const random = Math.random();
      let status: "pending" | "approved" | "rejected";
      let reviewedBy = null;
      let reviewedAt = null;
      let rejectionReason = null;
      let rejectionCategory = null;
      let notes = null;

      if (random < 0.7) {
        // 70% approved
        status = "approved";
        reviewedBy = faker.helpers.arrayElement(adminUsers).id;
        reviewedAt = faker.date.recent({ days: 30 });
        notes = faker.helpers.arrayElement([
          "Imagen clara y apropiada",
          "Cumple con los estándares",
          "Aprobada",
          null
        ]);
      } else if (random < 0.9) {
        // 20% pending
        status = "pending";
      } else {
        // 10% rejected
        status = "rejected";
        reviewedBy = faker.helpers.arrayElement(adminUsers).id;
        reviewedAt = faker.date.recent({ days: 30 });
        rejectionCategory = faker.helpers.arrayElement([
          "quality",
          "inappropriate",
          "copyright",
          "misleading"
        ]);

        const rejectionReasons: Record<string, string[]> = {
          quality: [
            "Imagen borrosa o de baja calidad",
            "Iluminación insuficiente",
            "Imagen pixelada"
          ],
          inappropriate: [
            "Contenido no apto para la plataforma",
            "Imagen no relacionada con el producto"
          ],
          copyright: [
            "Posible violación de derechos de autor",
            "Marca de agua de otro sitio"
          ],
          misleading: [
            "Imagen no corresponde al producto descrito",
            "Imagen engañosa"
          ]
        };

        rejectionReason = faker.helpers.arrayElement(
          rejectionReasons[rejectionCategory] || ["Rechazada por política de la plataforma"]
        );
      }

      moderationData.push({
        productId: product.id,
        vendorId: product.vendorId,
        imageUrl,
        imageIndex: i,
        status,
        reviewedBy,
        reviewedAt,
        rejectionReason,
        rejectionCategory,
        notes,
        createdAt: faker.date.recent({ days: 45 })
      });
    }
  }

  if (moderationData.length > 0) {
    await database.insert(schema.productImageModeration).values(moderationData);

    // Update product flags based on moderation results
    const productModerationStatus = new Map<string, Array<"pending" | "approved" | "rejected">>();

    for (const record of moderationData) {
      const existingStatuses = productModerationStatus.get(record.productId);
      if (existingStatuses) {
        existingStatuses.push(record.status);
      } else {
        productModerationStatus.set(record.productId, [record.status]);
      }
    }

    for (const [productId, statuses] of productModerationStatus.entries()) {
      const allApproved = statuses.every((s) => s === "approved");
      const hasPending = statuses.some((s) => s === "pending");
      const hasRejected = statuses.some((s) => s === "rejected");

      await database.update(schema.products)
        .set({
          imagesApproved: allApproved,
          imagesPendingModeration: hasPending && !hasRejected
        })
        .where(sql`${schema.products.id} = ${productId}`);
    }
  }

  // 2. Create stock reservations for active carts
  const users = await database.select().from(schema.users);
  const activeUsers = faker.helpers.arrayElements(users, 30);
  const reservations = [];

  for (const user of activeUsers) {
    const cartProducts = faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 5 }));

    for (const product of cartProducts) {
      const stock = product.stock ?? 0;
      if (stock <= 0) continue;

      const quantity = Math.min(faker.number.int({ min: 1, max: 3 }), stock);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + faker.number.int({ min: 10, max: 60 }));

      reservations.push({
        productId: product.id,
        quantity,
        userId: user.id,
        sessionId: null,
        reservationType: faker.helpers.arrayElement(["cart", "checkout"]),
        expiresAt,
        createdAt: faker.date.recent({ days: 1 })
      });
    }
  }

  // Add some guest cart reservations
  for (let i = 0; i < 10; i++) {
    const product = faker.helpers.arrayElement(products);
    const stock = product.stock ?? 0;
    if (stock <= 0) continue;

    const quantity = Math.min(faker.number.int({ min: 1, max: 2 }), stock);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + faker.number.int({ min: 10, max: 30 }));

    reservations.push({
      productId: product.id,
      quantity,
      userId: null,
      sessionId: `sess_guest_${faker.string.alphanumeric(32)}`,
      reservationType: "cart",
      expiresAt,
      createdAt: faker.date.recent({ days: 1 })
    });
  }

  if (reservations.length > 0) {
    await database.insert(schema.stockReservations).values(reservations);
  }

  // 3. Create vendor shipping rates
  const shippingZones = await database.select().from(schema.shippingZones);
  const shippingMethods = await database.select().from(schema.shippingMethods);
  const topVendors = vendors.slice(0, 10); // Only top vendors have custom rates

  const vendorShippingRates = [];

  for (const vendor of topVendors) {
    for (const zone of shippingZones) {
      for (const method of shippingMethods) {
        // Not all vendors support all methods
        if (Math.random() < 0.3) continue;

        // Create weight-based rates
        const weightRanges = [
          { min: 0, max: 500, baseRate: 99, perKg: 0 },
          { min: 501, max: 1000, baseRate: 129, perKg: 0 },
          { min: 1001, max: 5000, baseRate: 149, perKg: 20 },
          { min: 5001, max: 10000, baseRate: 199, perKg: 15 },
          { min: 10001, max: 99999, baseRate: 299, perKg: 10 }
        ];

        for (const range of weightRanges) {
          vendorShippingRates.push({
            vendorId: vendor.id,
            shippingMethodId: method.id,
            zoneId: zone.id,
            minWeight: range.min,
            maxWeight: range.max,
            baseRate: String(range.baseRate * parseFloat(zone.baseRateMultiplier)),
            perKgRate: String(range.perKg),
            isActive: true
          });
        }
      }
    }
  }

  if (vendorShippingRates.length > 0) {
    await database.insert(schema.vendorShippingRates).values(vendorShippingRates);
  }

  return {
    success: true,
    message: `Created ${moderationData.length} moderation records, ${reservations.length} stock reservations, ${vendorShippingRates.length} shipping rates`,
    data: {
      moderationRecords: moderationData.length,
      stockReservations: reservations.length,
      vendorShippingRates: vendorShippingRates.length
    }
  };
}