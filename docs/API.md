# LuziMarket API Documentation

**Last Updated:** October 8, 2025  
**Version:** 2.0

This document describes all available API endpoints in the Luzimarket platform.

---

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

### GET /api/admin/users/[id]/activities
Get audit log activities for a specific user.

**Response:**
```json
[
  {
    "id": "activity_id",
    "action": "login.success",
    "description": "User logged in successfully",
    "timestamp": "2025-10-08T12:00:00Z",
    "ipAddress": "192.168.1.1",
    "method": "POST",
    "path": "/api/auth/signin",
    "severity": "info",
    "details": {}
  }
]
```

### GET /api/admin/audit-logs
Get all audit logs (system-wide).

**Query Parameters:**
- `limit`: Number of logs to fetch (default: 100)
- `offset`: Pagination offset (default: 0)
- `category`: Filter by category (auth, payment, order, admin, security)
- `severity`: Filter by severity (info, warning, error, critical)
- `search`: Search in action, userEmail, or IP

**Response:**
```json
{
  "logs": [...],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET /api/admin/settings
Get all platform settings.

**Response:**
```json
{
  "settings": {
    "siteName": "Luzimarket",
    "platformCommission": 15,
    "defaultShippingCost": 99,
    "freeShippingThreshold": 1000,
    ...
  }
}
```

### PUT /api/admin/settings
Update platform settings.

**Request Body:**
```json
{
  "siteName": "Luzimarket",
  "platformCommission": 18,
  "maintenanceMode": false,
  "defaultShippingCost": 120,
  ...
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

## Vendor Endpoints

### GET /api/vendor/products
Get vendor's products.

### POST /api/vendor/products
Create new product (pending approval).

### GET /api/vendor/orders
Get orders for vendor's products.

### GET /api/vendor/analytics
Get vendor sales analytics.

---

## Checkout & Payment Endpoints

### POST /api/checkout/sessions
Create a Stripe checkout session.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id",
      "quantity": 1,
      "vendorId": "vendor_id"
    }
  ],
  "isGuest": false,
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "5551234567",
    "address": "Street 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "postalCode": "01000",
    "country": "México"
  },
  "selectedShipping": "standard",
  "selectedShippingByVendor": {},
  "shippingCostsByVendor": {}
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### GET /api/checkout/retry
Fetch order details for payment retry.

**Query Parameters:**
- `orderNumber`: Order number to retry (e.g., ORD-12345678)

**Response:**
```json
{
  "order": {
    "orderNumber": "ORD-12345678",
    "total": "1299.00",
    "subtotal": "999.00",
    "tax": "159.84",
    "shipping": "140.16",
    "currency": "MXN",
    "paymentStatus": "failed",
    "items": [
      {
        "name": "Product Name",
        "quantity": 1,
        "price": "999.00",
        "image": "https://..."
      }
    ]
  }
}
```

### POST /api/checkout/retry
Create new checkout session for failed payment.

**Request Body:**
```json
{
  "orderNumber": "ORD-12345678"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

---

## Webhooks

### POST /api/webhooks/stripe
Handle Stripe webhooks.

**Supported Events:**
- `checkout.session.completed` - Payment succeeded
- `payment_intent.succeeded` - Payment confirmed
- `payment_intent.payment_failed` - Payment failed
- `account.updated` - Stripe Connect account updated

**Note:** This endpoint is called by Stripe and requires webhook signature verification.

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
