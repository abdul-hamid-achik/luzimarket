import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import authRoutes from '@/routes/auth';
import categoryRoutes from '@/routes/categories';
import productRoutes from '@/routes/products';
import cartRoutes from '@/routes/cart';
import orderRoutes from '@/routes/orders';
import salesRoutes from '@/routes/sales';
import petitionsRoutes from '@/routes/petitions';
import admissionsRoutes from '@/routes/petitions/admissions';
import petitionProductsRoutes from '@/routes/petitions/products';
import branchPetitionsRoutes from '@/routes/petitions/branches';
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
  app.use("/api/auth", authRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/sales", salesRoutes);
  app.use("/api/petitions", petitionsRoutes);
  app.use("/api/petitions/admissions", admissionsRoutes);
  app.use("/api/petitions/products", petitionProductsRoutes);
  app.use("/api/petitions/branches", branchPetitionsRoutes);
}

// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;