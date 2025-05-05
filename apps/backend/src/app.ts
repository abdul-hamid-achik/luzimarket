import express from "express";
import { graphqlHTTP } from 'express-graphql';
import { createSchema } from '@tinacms/graphql';
import { FileSystem } from '@tinacms/git-client';
import tinaConfig from './.tina/schema';
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger";
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import statesRoutes from './routes/states';
import adminOrdersRoutes from './routes/adminOrders';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import salesRoutes from './routes/sales';
import petitionsRoutes from './routes/petitions';
import admissionsRoutes from './routes/petitions/admissions';
import petitionProductsRoutes from './routes/petitions/products';
import branchPetitionsRoutes from './routes/petitions/branches';
import { StatusCodes } from "http-status-codes";
// Import routes lazily under non-test environments to avoid pulling in full schema
// and controllers during Jest smoke tests
// (Dynamic requires ensure schema-related TS errors are skipped)
// Swagger UI is always available

const app = express();

// Middleware
// Allow all CORS origins (use specific origins in production via CORS_ORIGIN env var)
app.use(cors());
app.use(bodyParser.json());

// add health endpoint for Docker HEALTHCHECK and CI readiness
app.get('/api/health', (_req, res) => res.sendStatus(StatusCodes.OK));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/petitions', petitionsRoutes);
app.use('/api/petitions/admissions', admissionsRoutes);
app.use('/api/petitions/products', petitionProductsRoutes);
app.use('/api/petitions/branches', branchPetitionsRoutes);
app.use('/api/states', statesRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);

// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Tina CMS GraphQL API
const tinaSchema = createSchema({
  config: { rootPath: process.cwd(), branch: process.env.GIT_BRANCH || 'main' },
  collections: tinaConfig.collections,
  client: new FileSystem(),
});
app.use(
  '/admin/graphql',
  graphqlHTTP({ schema: tinaSchema, graphiql: true }),
);

export default app;