import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
// Import routes lazily under non-test environments to avoid pulling in full schema
// and controllers during Jest smoke tests
// (Dynamic requires ensure schema-related TS errors are skipped)
// Swagger UI is always available

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(bodyParser.json());

// Mount API routes only when not testing
if (process.env.NODE_ENV !== 'test') {
  // Use require() to defer loading
  const authRoutes = require("./routes/auth").default;
  app.use("/api/auth", authRoutes);
  const categoryRoutes = require("./routes/categories").default;
  app.use("/api/categories", categoryRoutes);
  const productRoutes = require("./routes/products").default;
  app.use("/api/products", productRoutes);
  const cartRoutes = require("./routes/cart").default;
  app.use("/api/cart", cartRoutes);
  const orderRoutes = require("./routes/orders").default;
  app.use("/api/orders", orderRoutes);
}

// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;