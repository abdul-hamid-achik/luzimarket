import { http } from 'msw';
import { products } from '../__fixtures__/products.fixture.js';
import { categories } from '../__fixtures__/categories.fixture.js';
import { cartResponse } from '../__fixtures__/cart.fixture.js';
import { orders, order } from '../__fixtures__/orders.fixture.js';
import { petitions } from '../__fixtures__/petitions.fixture.js';
import { admissionPetitions } from '../__fixtures__/petitionsAdmissions.fixture.js';
import { productPetitions } from '../__fixtures__/petitionsProducts.fixture.js';
import { branchPetitions } from '../__fixtures__/petitionsBranches.fixture.js';
import { states } from '../__fixtures__/states.fixture.js';
import { adminOrders } from '../__fixtures__/adminOrders.fixture.js';
import { sales } from '../__fixtures__/sales.fixture.js';
import { registerResponse, loginResponse } from '../__fixtures__/auth.fixture.js';

// Define default request handlers
export const handlers = [
  // Products
  http.get('/api/products', (req, res, ctx) => res(ctx.status(200), ctx.json(products ?? []))),
  http.get('/api/products/:id', (req, res, ctx) => {
    const { id } = req.params;
    const found = (products ?? []).find((p) => p.id === id);
    return found ? res(ctx.json(found)) : res(ctx.status(404).json({ error: 'Product not found' }));
  }),
  // Categories
  http.get('/api/categories', (req, res, ctx) => res(ctx.status(200), ctx.json(categories ?? []))),
  // Cart
  http.get('/api/cart', (req, res, ctx) => res(ctx.status(200), ctx.json(cartResponse ?? { cart: {}, items: [] }))),
  http.post('/api/cart', (req, res, ctx) => res(ctx.status(201), ctx.json({ id: 11, ...req.body }))),
  http.put('/api/cart/:itemId', (req, res, ctx) => res(ctx.status(200), ctx.json({ id: parseInt(req.params.itemId), ...req.body }))),
  http.delete('/api/cart/:itemId', (req, res, ctx) => res(ctx.status(200), ctx.json({ success: true }))),
  http.delete('/api/cart', (req, res, ctx) => res(ctx.status(200), ctx.json({ success: true }))),
  // Orders
  http.get('/api/orders', (req, res, ctx) => res(ctx.status(200), ctx.json(orders ?? []))),
  http.get('/api/orders/:id', (req, res, ctx) => {
    const { id } = req.params;
    const found = (orders ?? []).find((o) => o.id === parseInt(id));
    return found ? res(ctx.json(found)) : res(ctx.status(404).json({ error: 'Order not found' }));
  }),
  http.post('/api/orders', (req, res, ctx) => res(ctx.status(201), ctx.json(order))),
  // Sales
  http.get('/api/sales', (req, res, ctx) => res(ctx.status(200), ctx.json(sales ?? []))),
  // Petitions
  http.get('/api/petitions', (req, res, ctx) => res(ctx.status(200), ctx.json(petitions ?? []))),
  http.get('/api/petitions/admissions', (req, res, ctx) => res(ctx.status(200), ctx.json(admissionPetitions ?? []))),
  http.get('/api/petitions/products', (req, res, ctx) => res(ctx.status(200), ctx.json(productPetitions ?? []))),
  http.get('/api/petitions/branches', (req, res, ctx) => res(ctx.status(200), ctx.json(branchPetitions ?? []))),
  // States
  http.get('/api/states', (req, res, ctx) => res(ctx.status(200), ctx.json(states ?? []))),
  // Admin Orders
  http.get('/api/admin/orders', (req, res, ctx) => res(ctx.status(200), ctx.json(adminOrders ?? []))),
  // Auth
  http.post('/api/auth/register', (req, res, ctx) => res(ctx.status(201), ctx.json(registerResponse))),
  http.post('/api/auth/login', (req, res, ctx) => res(ctx.status(200), ctx.json(loginResponse))),
];