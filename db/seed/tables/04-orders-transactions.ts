import { db } from "@/db";
import * as schema from "@/db/schema";
import { faker } from "@faker-js/faker";
import { seasonalOrderVolume, reviewLikelihood } from "../utils/realistic-patterns";

faker.seed(12345);

const CARRIERS = ["fedex", "ups", "dhl", "estafeta", "correos-de-mexico"];
const CITIES = [
  "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro", 
  "Tijuana", "León", "Cancún", "Mérida", "Toluca"
];

/**
 * Seeds orders and order items with realistic patterns
 */
export async function seedOrdersAndTransactions(database = db, options?: any) {
  console.log("🛒 Creating orders and transactions...");
  
  const users = await database.select().from(schema.users);
  const vendors = await database.select().from(schema.vendors);
  const products = await database.select().from(schema.products);
  
  if (users.length === 0 || vendors.length === 0 || products.length === 0) {
    console.log("⚠️  Skipping orders: missing users, vendors, or products");
    return { success: false, message: "Missing required data" };
  }

  // Group users by segment (based on position in array from previous seeding)
  const vipUsers = users.slice(0, 10);
  const loyalUsers = users.slice(10, 40);
  const regularUsers = users.slice(40, 100);
  const occasionalUsers = users.slice(100);

  const orderData = [];
  const orderItemData = [];
  let orderCounter = 0;

  // Generate orders based on customer segments
  const orderDistribution = [
    { users: vipUsers, ordersPerUser: [8, 15], label: "VIP" },
    { users: loyalUsers, ordersPerUser: [4, 8], label: "Loyal" },
    { users: regularUsers, ordersPerUser: [2, 4], label: "Regular" },
    { users: occasionalUsers, ordersPerUser: [0, 2], label: "Occasional" }
  ];

  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  for (const segment of orderDistribution) {
    for (const user of segment.users) {
      const orderCount = faker.number.int({ 
        min: segment.ordersPerUser[0], 
        max: segment.ordersPerUser[1] 
      });
      
      for (let i = 0; i < orderCount; i++) {
        // Generate order date with seasonal patterns
        const orderDate = faker.date.between({ from: ninetyDaysAgo, to: now });
        const month = orderDate.getMonth() + 1;
        const day = orderDate.getDate();
        
        // Skip some orders based on seasonal patterns
        const seasonalMultiplier = seasonalOrderVolume(1, month, day);
        if (Math.random() > seasonalMultiplier) continue;

        // Select vendor (top vendors get more orders)
        const vendorIndex = Math.floor(Math.pow(Math.random(), 2) * vendors.length);
        const vendor = vendors[vendorIndex];

        // Generate order items
        const itemCount = faker.number.int({ min: 1, max: 5 });
        const vendorProducts = products.filter(p => p.vendorId === vendor.id);
        
        if (vendorProducts.length === 0) continue;
        
        const selectedProducts = faker.helpers.arrayElements(
          vendorProducts, 
          Math.min(itemCount, vendorProducts.length)
        );

        let subtotal = 0;
        const items = [];
        
        for (const product of selectedProducts) {
          const quantity = faker.number.int({ min: 1, max: 3 });
          const price = parseFloat(product.price);
          const itemTotal = price * quantity;
          
          items.push({
            productId: product.id,
            quantity,
            price: product.price,
            total: String(itemTotal)
          });
          
          subtotal += itemTotal;
        }

        const tax = Math.round(subtotal * 0.16);
        const shipping = subtotal > 1500 ? 0 : faker.helpers.arrayElement([99, 149, 199]);
        const total = subtotal + tax + shipping;

        // Determine order status based on age
        const daysOld = Math.floor((now.getTime() - orderDate.getTime()) / (24 * 60 * 60 * 1000));
        let status;
        if (daysOld > 14) {
          status = faker.helpers.weightedArrayElement([
            { value: "delivered", weight: 8 },
            { value: "shipped", weight: 1 },
            { value: "cancelled", weight: 1 }
          ]);
        } else if (daysOld > 7) {
          status = faker.helpers.weightedArrayElement([
            { value: "delivered", weight: 4 },
            { value: "shipped", weight: 4 },
            { value: "processing", weight: 2 }
          ]);
        } else {
          status = faker.helpers.weightedArrayElement([
            { value: "shipped", weight: 3 },
            { value: "processing", weight: 4 },
            { value: "pending", weight: 3 }
          ]);
        }

        // Generate tracking for shipped/delivered orders
        let trackingData = {};
        if (status === "shipped" || status === "delivered") {
          trackingData = generateTrackingData(status, orderDate);
        }

        const orderNumber = `ORD-${String(orderCounter).padStart(8, '0')}`;
        
        const order = {
          orderNumber,
          userId: user.id,
          vendorId: vendor.id,
          status,
          subtotal: String(subtotal),
          tax: String(tax),
          shipping: String(shipping),
          total: String(total),
          currency: "MXN",
          paymentIntentId: status !== "pending" ? `pi_${faker.string.alphanumeric(24)}` : null,
          paymentStatus: status === "pending" ? "pending" : "succeeded",
          shippingAddress: generateAddress(),
          notes: faker.datatype.boolean({ probability: 0.2 }) 
            ? faker.lorem.sentence() 
            : null,
          createdAt: orderDate,
          updatedAt: orderDate,
          ...trackingData
        };

        orderData.push(order);
        
        // Store items for this order
        for (const item of items) {
          orderItemData.push({
            orderNumber,
            ...item
          });
        }
        
        orderCounter++;
      }
    }
  }

  // Insert orders
  if (orderData.length > 0) {
    await database
      .insert(schema.orders)
      .values(orderData)
      .onConflictDoNothing({ target: schema.orders.orderNumber });
    
    const insertedOrders = await database.select().from(schema.orders);
    
    // Map order items to actual order IDs
    const finalOrderItems = [];
    for (const item of orderItemData) {
      const order = insertedOrders.find(o => o.orderNumber === item.orderNumber);
      if (order) {
        finalOrderItems.push({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        });
      }
    }
    
    if (finalOrderItems.length > 0) {
      await database.insert(schema.orderItems).values(finalOrderItems);
    }
    
    return {
      success: true,
      message: `Created ${insertedOrders.length} orders with ${finalOrderItems.length} items`,
      data: {
        orders: insertedOrders.length,
        orderItems: finalOrderItems.length
      }
    };
  }
  
  return {
    success: true,
    message: "No orders created",
    data: { orders: 0, orderItems: 0 }
  };
}

function generateAddress() {
  return {
    street: faker.location.streetAddress(),
    city: faker.helpers.arrayElement(CITIES),
    state: faker.helpers.arrayElement([
      "Ciudad de México", "Jalisco", "Nuevo León", "Puebla", "Querétaro"
    ]),
    postalCode: faker.location.zipCode("#####"),
    country: "México"
  };
}

function generateTrackingData(status: string, orderDate: Date) {
  const carrier = faker.helpers.arrayElement(CARRIERS);
  const trackingNumber = `${carrier.toUpperCase().substring(0, 3)}${faker.string.numeric(12)}`;
  const shippedDate = faker.date.between({ 
    from: orderDate, 
    to: new Date(Math.min(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000, Date.now()))
  });
  
  const estimatedDelivery = new Date(shippedDate);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + faker.number.int({ min: 1, max: 5 }));
  
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
  
  // Out for delivery
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
  let actualDeliveryDate;
  if (status === "delivered") {
    actualDeliveryDate = faker.date.between({ 
      from: outForDeliveryDate, 
      to: new Date(Math.min(estimatedDelivery.getTime(), Date.now()))
    });
    
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
  }
  
  // Sort tracking history by timestamp
  trackingHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return {
    trackingNumber,
    carrier,
    estimatedDeliveryDate: estimatedDelivery,
    actualDeliveryDate,
    trackingHistory
  };
}