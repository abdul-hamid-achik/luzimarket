import { rest } from 'msw';
import { products } from '../__fixtures__/products.fixture';
import { categories } from '../__fixtures__/categories.fixture';
import { cartResponse } from '../__fixtures__/cart.fixture';
import { orders, order } from '../__fixtures__/orders.fixture';
import { petitions } from '../__fixtures__/petitions.fixture';
import { admissionPetitions } from '../__fixtures__/petitionsAdmissions.fixture';
import { productPetitions } from '../__fixtures__/petitionsProducts.fixture';
import { branchPetitions } from '../__fixtures__/petitionsBranches.fixture';
import { states } from '../__fixtures__/states.fixture';
import { adminOrders } from '../__fixtures__/adminOrders.fixture';
import { sales } from '../__fixtures__/sales.fixture';
import { registerResponse, loginResponse } from '../__fixtures__/auth.fixture';

// Define default request handlers
export const handlers = [
  // Products
  rest.get('/api/products', (req, res, ctx) => res(ctx.status(200), ctx.json(products))),
  rest.get('/api/products/:id', (req, res, ctx) => {
    const { id } = req.params;
    const found = products.find((p) => p.id === parseInt(id));
    return found ? res(ctx.json(found)) : res(ctx.status(404));
  }),
  // Categories
  rest.get('/api/categories', (req, res, ctx) => res(ctx.status(200), ctx.json(categories))),
  // Cart
  rest.get('/api/cart', (req, res, ctx) => res(ctx.status(200), ctx.json(cartResponse))),
  rest.post('/api/cart', (req, res, ctx) => res(ctx.status(201), ctx.json({ id: 11, ...req.body }))),
  rest.put('/api/cart/:itemId', (req, res, ctx) => res(ctx.status(200), ctx.json({ id: parseInt(req.params.itemId), ...req.body }))),
  rest.delete('/api/cart/:itemId', (req, res, ctx) => res(ctx.status(200), ctx.json({ success: true }))),
  rest.delete('/api/cart', (req, res, ctx) => res(ctx.status(200), ctx.json({ success: true }))),
  // Orders
  rest.get('/api/orders', (req, res, ctx) => res(ctx.status(200), ctx.json(orders))),
  rest.get('/api/orders/:id', (req, res, ctx) => {
    const { id } = req.params;
    const found = orders.find((o) => o.id === parseInt(id));
    return found ? res(ctx.json(found)) : res(ctx.status(404));
  }),
  rest.post('/api/orders', (req, res, ctx) => res(ctx.status(201), ctx.json(order))),
  // Sales
  rest.get('/api/sales', (req, res, ctx) => res(ctx.status(200), ctx.json(sales))),
  // Petitions
  rest.get('/api/petitions', (req, res, ctx) => res(ctx.status(200), ctx.json(petitions))),
  rest.get('/api/petitions/admissions', (req, res, ctx) => res(ctx.status(200), ctx.json(admissionPetitions))),
  rest.get('/api/petitions/products', (req, res, ctx) => res(ctx.status(200), ctx.json(productPetitions))),
  rest.get('/api/petitions/branches', (req, res, ctx) => res(ctx.status(200), ctx.json(branchPetitions))),
  // States
  rest.get('/api/states', (req, res, ctx) => res(ctx.status(200), ctx.json(states))),
  // Admin Orders
  rest.get('/api/admin/orders', (req, res, ctx) => res(ctx.status(200), ctx.json(adminOrders))),
  // Auth
  rest.post('/api/auth/register', (req, res, ctx) => res(ctx.status(201), ctx.json(registerResponse))),
  rest.post('/api/auth/login', (req, res, ctx) => res(ctx.status(200), ctx.json(loginResponse))),
];