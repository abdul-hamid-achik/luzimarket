# Token Refresh System

This document describes the token refresh system implemented for the LuziMarket application, providing automatic token renewal and secure session management.

## Overview

The token refresh system provides:
- **Automatic token refresh** via Axios interceptors
- **Configurable token durations** via environment variables  
- **Secure refresh token management** with revocation
- **Obfuscated storage keys** for enhanced client-side security
- **Seamless user experience** with transparent token renewal
- **Comprehensive E2E testing** coverage

## Architecture

### Backend Components

#### 1. Database Schema
- **refresh_tokens table**: Stores refresh tokens with expiration and revocation status
- **Foreign key relationship**: Links refresh tokens to users
- **Automatic cleanup**: Expired/revoked tokens are tracked

#### 2. API Endpoints

##### `/api/auth/refresh` (POST)
Exchanges a valid refresh token for new access and refresh tokens.

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-refresh-token"
}
```

**Error Responses:**
- `400`: Missing refresh token
- `401`: Invalid or expired refresh token
- `500`: Server error

#### 3. Updated Auth Endpoints
- **Login** (`/api/auth/login`): Returns both `accessToken` and `refreshToken`
- **Register** (`/api/auth/register`): Returns both `accessToken` and `refreshToken`

### Frontend Components

#### 1. Secure Storage Utility
- **Obfuscated keys**: Uses base64-encoded keys to store tokens securely
- **Access token key**: `X2x1emlfYXV0aF9hY2Nlc3M=` (base64 of `_luzi_auth_access`)
- **Refresh token key**: `X2x1emlfYXV0aF9yZWZyZXNo` (base64 of `_luzi_auth_refresh`)
- **Utility methods**: `setTokens()`, `getTokens()`, `clearTokens()`, etc.

#### 2. Axios Interceptors
- **Request interceptor**: Attaches access token to requests
- **Response interceptor**: Handles 401 errors with automatic refresh
- **Queue management**: Prevents multiple simultaneous refresh attempts

#### 3. Auth Context Updates
- **Token storage**: Manages both access and refresh tokens using secure storage
- **Login/Register**: Stores both tokens from API responses
- **Logout**: Clears both tokens

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ACCESS_TOKEN_DURATION` | `1m` | JWT access token expiration (e.g., '1m', '15m', '1h') |
| `REFRESH_TOKEN_DURATION_HOURS` | `168` | Refresh token duration in hours (default: 7 days) |
| `JWT_SECRET` | `test-jwt-secret-for-e2e-tests` | JWT signing secret |

### Recommended Configuration

**Development:**
```bash
ACCESS_TOKEN_DURATION=1m
REFRESH_TOKEN_DURATION_HOURS=168
```

**Production:**
```bash
ACCESS_TOKEN_DURATION=15m
REFRESH_TOKEN_DURATION_HOURS=24
JWT_SECRET=your-secure-production-secret
```

## Security Features

### 1. Obfuscated Storage Keys
- Token storage keys are base64-encoded to prevent easy discovery
- Malicious scripts cannot easily find tokens using predictable key names
- Keys are generated from prefixed strings to maintain consistency

### 2. Refresh Token Rotation
- Each refresh generates new access AND refresh tokens
- Old refresh tokens are immediately revoked
- Prevents replay attacks

### 3. Token Expiration
- Access tokens: Short-lived (default 7 days for development)
- Refresh tokens: Longer-lived (default 7 days)
- Maximum refresh window: Configurable up to any duration

### 4. Automatic Cleanup
- Expired refresh tokens are tracked in database
- Revoked tokens cannot be reused
- Failed refresh attempts clear all tokens

## Usage Examples

### Manual Token Refresh

```javascript
import { secureStorage } from '@/utils/storage';
import api from '@/api/client';

// The axios interceptor handles this automatically,
// but you can also refresh manually:
const refreshToken = secureStorage.getRefreshToken();
const response = await api.post('/auth/refresh', { refreshToken });
const { accessToken, refreshToken: newRefreshToken } = response.data;

secureStorage.setTokens({ accessToken, refreshToken: newRefreshToken });
```

### Using Secure Storage

```javascript
import { secureStorage } from '@/utils/storage';

// Store tokens
secureStorage.setTokens({ 
  accessToken: 'jwt-token-here', 
  refreshToken: 'refresh-token-here' 
});

// Get individual tokens
const accessToken = secureStorage.getAccessToken();
const refreshToken = secureStorage.getRefreshToken();

// Get both tokens
const { accessToken, refreshToken } = secureStorage.getTokens();

// Check if user has tokens
const isAuthenticated = secureStorage.hasTokens();

// Clear all tokens
secureStorage.clearTokens();
```

### Checking Token Status

```javascript
import { secureStorage } from '@/utils/storage';

// Decode JWT to check expiration
const accessToken = secureStorage.getAccessToken();
if (accessToken) {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    console.log('Token expired:', isExpired);
  } catch (error) {
    console.error('Invalid token format');
  }
}
```

## Testing

### E2E Tests
Comprehensive test suite in `e2e/auth/token-refresh.spec.js`:

- **Token Issuance**: Verifies both tokens are issued on login/register
- **Manual Refresh**: Tests the refresh endpoint directly
- **Automatic Refresh**: Tests axios interceptor behavior
- **Session Management**: Validates session persistence through refresh
- **Error Handling**: Tests invalid/expired token scenarios
- **Obfuscated Storage**: Tests that tokens are stored with encoded keys

### Running Tests

```bash
# Run all auth tests
npm run test:e2e -- e2e/auth/

# Run only token refresh tests  
npm run test:e2e -- e2e/auth/token-refresh.spec.js

# Run with specific configuration
ACCESS_TOKEN_DURATION=30s npm run test:e2e -- e2e/auth/token-refresh.spec.js
```

## Flow Diagrams

### Login Flow
```
User Login
    ↓
Validate Credentials
    ↓
Create Session
    ↓
Generate Access Token (7d exp)
    ↓
Generate Refresh Token (7d exp)
    ↓
Store Refresh Token in DB
    ↓
Return Both Tokens as { accessToken, refreshToken }
    ↓
Store in Obfuscated SessionStorage Keys
```

### Automatic Refresh Flow
```
API Request with Expired Access Token
    ↓
Receive 401 Response
    ↓
Axios Interceptor Triggered
    ↓
Get Refresh Token from Secure Storage
    ↓
Call /auth/refresh with Refresh Token
    ↓
[Success] → Store New Tokens → Retry Original Request
    ↓
[Failure] → Clear All Tokens → Logout User
```

### Manual Refresh Flow
```
Client Calls /auth/refresh
    ↓
Validate Refresh Token
    ↓
Check Expiration & Revocation
    ↓
Revoke Old Refresh Token
    ↓
Generate New Tokens
    ↓
Store New Refresh Token
    ↓
Return { accessToken, refreshToken }
```

## Best Practices

### 1. Token Storage
- Store tokens using the secure storage utility (obfuscated keys)
- Clear tokens on logout or authentication failure
- Never log tokens in console or error messages
- Use sessionStorage instead of localStorage for security

### 2. API Integration
- Always use `accessToken` field from API responses
- Handle both `accessToken` and `refreshToken` in login/register flows
- Use the secure storage utility for all token operations

### 3. Error Handling
- Always handle refresh failures gracefully
- Provide clear user feedback for authentication issues
- Implement automatic logout on repeated failures

### 4. Performance
- Queue concurrent requests during refresh
- Avoid multiple simultaneous refresh attempts
- Cache refresh results appropriately

### 5. Security
- Use HTTPS in production
- Implement proper CORS configuration
- Monitor for unusual refresh patterns
- Regularly rotate JWT secrets
- Leverage obfuscated storage keys to prevent easy token discovery

## Troubleshooting

### Common Issues

1. **Tokens not being issued**
   - Check environment variables are set
   - Verify database schema is up to date
   - Check login/register API responses return `accessToken` field

2. **Automatic refresh not working**
   - Verify axios interceptor is configured
   - Check refresh token is stored using secure storage
   - Ensure refresh endpoint is accessible

3. **Tokens cleared unexpectedly**
   - Check for 401 responses triggering logout
   - Verify refresh token hasn't expired
   - Check for authentication errors in console

4. **Storage key issues**
   - Ensure secure storage utility is imported correctly
   - Verify obfuscated keys match between components
   - Check for proper base64 encoding of storage keys

### Debug Mode

Enable debug logging by checking obfuscated storage:
```javascript
import { secureStorage } from '@/utils/storage';

// In your app, add this for debugging:
console.log('Token refresh system status:', {
  hasAccessToken: secureStorage.hasAccessToken(),
  hasRefreshToken: !!secureStorage.getRefreshToken(),
  hasTokens: secureStorage.hasTokens(),
  storageKeys: {
    accessToken: btoa('_luzi_auth_access'),
    refreshToken: btoa('_luzi_auth_refresh')
  }
});
```

## Migration Guide

If upgrading from the previous auth system:

1. **Run database migrations** to add refresh_tokens table
2. **Update environment variables** with new token duration settings
3. **Clear existing user sessions** to force re-authentication with new tokens
4. **Update any custom auth logic** to handle `accessToken` instead of `token`
5. **Replace direct sessionStorage calls** with secure storage utility
6. **Update API integrations** to expect `accessToken` field
7. **Test thoroughly** with the provided E2E test suite

## Changelog

- **v1.1.0**: Security improvements and API changes
  - **BREAKING**: Changed `token` field to `accessToken` in API responses
  - Added obfuscated storage keys for enhanced security
  - Updated all auth endpoints to return `accessToken`
  - Created secure storage utility for token management
  - Updated E2E tests to use new field names and storage keys
- **v1.0.0**: Initial token refresh implementation
  - Added refresh token database schema
  - Implemented refresh endpoint
  - Updated login/register to issue refresh tokens
  - Added automatic refresh via axios interceptors
  - Created comprehensive E2E test suite 