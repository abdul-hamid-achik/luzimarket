import { http, HttpResponse } from 'msw';
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
  http.get('/api/products', () => HttpResponse.json(products ?? [])),
  http.get('/api/products/:id', ({ params }) => {
    const { id } = params;
    const found = (products ?? []).find((p) => p.id === id);
    return found ? HttpResponse.json(found) : HttpResponse.json({ error: 'Product not found' }, { status: 404 });
  }),
  // Categories
  http.get('/api/categories', () => HttpResponse.json(categories ?? [])),
  http.get('/api/categories/:slug', ({ params }) => {
    const { slug } = params;
    const found = (categories ?? []).find((c) => c.slug === slug);
    return found ? HttpResponse.json(found) : HttpResponse.json({ error: 'Category not found' }, { status: 404 });
  }),
  // Cart
  http.get('/api/cart', () => HttpResponse.json(cartResponse ?? { cart: {}, items: [] })),
  http.post('/api/cart', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 11, ...body }, { status: 201 });
  }),
  http.put('/api/cart/:itemId', async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: parseInt(params.itemId), ...body });
  }),
  http.delete('/api/cart/:itemId', () => HttpResponse.json({ success: true })),
  http.delete('/api/cart', () => HttpResponse.json({ success: true })),
  // Orders
  http.get('/api/orders', () => HttpResponse.json(orders ?? [])),
  http.get('/api/orders/:id', ({ params }) => {
    const { id } = params;
    const found = (orders ?? []).find((o) => o.id === parseInt(id));
    return found ? HttpResponse.json(found) : HttpResponse.json({ error: 'Order not found' }, { status: 404 });
  }),
  http.post('/api/orders', () => HttpResponse.json(order, { status: 201 })),
  // Sales
  http.get('/api/sales', () => HttpResponse.json(sales ?? [])),
  // Petitions
  http.get('/api/petitions', () => HttpResponse.json(petitions ?? [])),
  http.get('/api/petitions/admissions', () => HttpResponse.json(admissionPetitions ?? [])),
  http.get('/api/petitions/products', () => HttpResponse.json(productPetitions ?? [])),
  http.get('/api/petitions/branches', () => HttpResponse.json(branchPetitions ?? [])),
  // States
  http.get('/api/states', () => HttpResponse.json(states ?? [])),
  // Admin Orders
  http.get('/api/admin/orders', () => HttpResponse.json(adminOrders ?? [])),
  // Auth
  http.post('/api/auth/register', () => HttpResponse.json(registerResponse, { status: 201 })),
  http.post('/api/auth/login', () => HttpResponse.json(loginResponse)),
];