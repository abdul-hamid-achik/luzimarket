# E2E API Flow Tests

## 📢 API Tests Migration Notice

**API integration tests have been moved to the backend!**

All API integration tests have been migrated from `e2e/api/` to `apps/backend/src/app/api/` and now run as part of the backend test suite.

### ✅ Migrated Tests
- ~~`analytics-integration.spec.js`~~ → `apps/backend/src/app/api/analytics/route.spec.ts`
- ~~`api-integration.spec.js`~~ → `apps/backend/src/app/api/cart/route.spec.ts` + `apps/backend/src/app/api/auth/route.spec.ts`
- ~~`homepage-slides.spec.js`~~ → `apps/backend/src/app/api/homepage-slides/route.spec.ts`
- ~~`order-tracking.spec.js`~~ → `apps/backend/src/app/api/track/route.spec.ts`
- ~~`session-delivery-zone.spec.js`~~ → Integrated into auth tests

### 🎯 What Goes Here Now?

This directory should only contain **end-to-end flow tests** that require both frontend and backend running together, such as:

- **Complete user journeys** (registration → shopping → checkout → order tracking)
- **Multi-page workflows** (product discovery → cart → payment → confirmation)
- **Integration flows** that span multiple systems
- **Browser-specific functionality** requiring full UI interaction

### 🔧 Backend API Tests

For API-only testing, use the backend test suite:

```bash
# Run backend API tests
cd apps/backend
npm test

# Run specific API tests
npm test -- --run src/app/api/auth/route.spec.ts
npm test -- --run src/app/api/cart/route.spec.ts
```

### 🎭 E2E Flow Tests

For full end-to-end flows, use the E2E test suite:

```bash
# Run E2E flow tests
npm run test:e2e

# Run specific flow tests
npx playwright test e2e/flows/
```

### 🚀 CI/CD Optimizations

Our E2E tests now run with significant performance improvements:

- **Parallel execution**: 12 concurrent jobs (4 shards × 3 browsers)
- **Smart artifacts**: Results consolidated by browser instead of creating 12+ separate artifacts
- **Cross-browser coverage**: Chromium, Firefox, and WebKit testing
- **Efficient storage**: Test results, screenshots, and logs organized by browser type

### 📁 Suggested Structure

```
e2e/
├── api/                    # Only for cross-system E2E flows
│   └── README.md          # This file
├── auth/                  # Authentication flows
├── shopping/              # Shopping experience flows  
├── admin/                 # Admin dashboard flows
└── cms/                   # CMS workflow flows
```

### 🚀 Benefits of the Migration

1. **Faster Tests**: API tests run directly against Next.js without HTTP overhead
2. **Better Isolation**: Backend tests run independently without frontend dependencies
3. **Improved CI**: Parallel execution of backend and frontend test suites
4. **Better Coverage**: API tests generate backend-specific coverage reports
5. **Easier Debugging**: API tests can use debugger and have direct database access 