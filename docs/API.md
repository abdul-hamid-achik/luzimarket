# LuziMarket API Documentation

## Authentication Endpoints

### POST /api/auth/signin
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "customer|vendor|admin"
  },
  "session": "jwt_token"
}
```

## Product Endpoints

### GET /api/products
Get paginated list of products.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)
- `category`: Filter by category
- `vendor`: Filter by vendor
- `search`: Search query
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "totalPages": 9
  }
}
```

### GET /api/products/[slug]
Get single product by slug.

### POST /api/products (Admin/Vendor only)
Create new product.

## Cart Endpoints

### GET /api/cart
Get user's cart items.

### POST /api/cart/add
Add item to cart.

### PUT /api/cart/update
Update cart item quantity.

### DELETE /api/cart/remove
Remove item from cart.

## Order Endpoints

### POST /api/orders
Create new order.

### GET /api/orders
Get user's orders.

### GET /api/orders/[id]
Get specific order details.

## Stripe Endpoints

### POST /api/stripe/create-payment-intent
Create Stripe payment intent for checkout.

### POST /api/stripe/webhook
Handle Stripe webhooks for payment confirmation.

## Admin Endpoints

### GET /api/admin/products
Get all products for admin review.

### PUT /api/admin/products/[id]/approve
Approve pending product.

### GET /api/admin/vendors
Get all vendors for management.

### PUT /api/admin/vendors/[id]/approve
Approve vendor registration.

## Vendor Endpoints

### GET /api/vendor/products
Get vendor's products.

### POST /api/vendor/products
Create new product (pending approval).

### GET /api/vendor/orders
Get orders for vendor's products.

### GET /api/vendor/analytics
Get vendor sales analytics.

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

## Rate Limiting

- General API: 100 requests per minute
- Authentication: 5 requests per minute
- File uploads: 10 requests per minute

## Authentication

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```
