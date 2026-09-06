# Backend Integration Guide

This guide explains how to connect the admin panels to your production backends.

## Overview

The admin panels use a flexible API client architecture that allows each product to connect to independent backends. The system supports:

- Environment-specific configuration
- Multiple backend simultaneously
- Health checks per product
- Error handling and retries
- Token-based authentication

## Step 1: Configure Backend URLs

Create a `.env.local` file in the project root:

```bash
# .env.local
REACT_APP_CURRENT_API_URL=http://localhost:3000/api/current
REACT_APP_JD_API_URL=http://localhost:3001/api/justice-desk
REACT_APP_VS_API_URL=http://localhost:3002/api/vakeel-sahib
REACT_APP_MD_API_URL=http://localhost:3003/api/medideals
```

For production, set these in your deployment environment (Docker, K8s, hosting platform):

```bash
# Production URLs
REACT_APP_CURRENT_API_URL=https://api.current.com/api/current
REACT_APP_JD_API_URL=https://api.justicedesk.com/api/justice-desk
REACT_APP_VS_API_URL=https://api.vakeelsahib.com/api/vakeel-sahib
REACT_APP_MD_API_URL=https://api.medideals.com/api/medideals
```

## Step 2: Implement Health Check Endpoint

Each backend should expose a health endpoint:

```
GET /api/{product}/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-06T10:30:00Z",
  "version": "1.0.0"
}
```

The admin panel calls this on startup to verify backend connectivity.

## Step 3: Implement Required API Endpoints

### CURRENT Backend

```
GET /api/current/metrics
Response: {
  "totalStories": 1247,
  "freshStories24h": 156,
  "lastFetch": "2026-09-06T10:30:00Z"
}

GET /api/current/providers
Response: [{
  "name": "Times of India",
  "status": "healthy|degraded|unavailable",
  "storiesCount": 245,
  "lastUpdate": "2026-09-06T10:29:00Z"
}]

GET /api/current/stories?limit=50&offset=0
Response: [{
  "id": "story-123",
  "title": "...",
  "source": "Times of India",
  "publishedAt": "2026-09-06T10:00:00Z",
  "category": "technology"
}]
```

### Justice Desk Backend

```
GET /api/justice-desk/users?limit=50&offset=0&kycStatus=pending|verified|rejected|submitted
Response: [{
  "id": "user-123",
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "kycStatus": "verified|pending|rejected|submitted",
  "documentsVerified": ["id_proof", "address_proof"],
  "createdAt": "2026-09-01T10:00:00Z"
}]

GET /api/justice-desk/kyc/metrics
Response: {
  "totalUsers": 456,
  "verifiedUsers": 234,
  "pendingKYC": 145,
  "rejectedKYC": 77
}

POST /api/justice-desk/users/:id/documents/:docId/verify
Response: { "success": true, "message": "Document verified" }

POST /api/justice-desk/users/:id/documents/:docId/reject
Body: { "reason": "Document unclear" }
Response: { "success": true, "message": "Document rejected" }
```

### Vakeel Sahib Backend

```
GET /api/vakeel-sahib/advocates?limit=50&offset=0&kycStatus=pending|verified|rejected
Response: [{
  "id": "advocate-123",
  "name": "Dr. Ashok Kumar",
  "email": "ashok@vakeel.com",
  "barEnrollmentStatus": "verified|pending|rejected",
  "panStatus": "verified|pending|rejected",
  "aadhaarStatus": "verified|pending|rejected|not_required",
  "createdAt": "2026-09-01T10:00:00Z"
}]

GET /api/vakeel-sahib/kyc/metrics
Response: {
  "totalAdvocates": 234,
  "kycComplete": 189,
  "pendingKYC": 35,
  "rejectedKYC": 10
}

POST /api/vakeel-sahib/advocates/:id/bar-enrollment/verify
Response: { "success": true, "status": "verified" }

POST /api/vakeel-sahib/advocates/:id/pan/verify
Response: { "success": true, "status": "verified" }

POST /api/vakeel-sahib/advocates/:id/reject
Body: { "reason": "Documents don't match" }
Response: { "success": true, "message": "Advocate rejected" }
```

### MediDeals Backend

```
GET /api/medideals/users?limit=50&offset=0&role=retailer|distributor|vendor
Response: [{
  "id": "user-123",
  "name": "Sharma Pharmacy",
  "company": "Sharma & Co",
  "role": "retailer|distributor|vendor",
  "kycStatus": "verified|pending|rejected",
  "documents": {
    "gst": "verified|pending|rejected|not_required",
    "drug_license": "verified|pending|rejected|not_required",
    "pan": "verified|pending|rejected|not_required"
  },
  "createdAt": "2026-09-01T10:00:00Z"
}]

GET /api/medideals/products?limit=50&offset=0
Response: [{
  "id": "product-123",
  "name": "Aspirin 500mg",
  "category": "analgesics",
  "seller": "PharmaPro",
  "price": 45,
  "quantity": 1000
}]

GET /api/medideals/orders?limit=50&offset=0&status=pending|confirmed|shipped|delivered|cancelled
Response: [{
  "id": "order-123",
  "buyer": "Sharma Pharmacy",
  "seller": "PharmaPro",
  "items": 50,
  "total": 45000,
  "status": "pending|confirmed|shipped|delivered|cancelled",
  "createdAt": "2026-09-01T10:00:00Z"
}]

GET /api/medideals/orders/:id
Response: {
  "id": "order-123",
  "buyer": "Sharma Pharmacy",
  "seller": "PharmaPro",
  "products": [{
    "id": "product-123",
    "name": "Aspirin 500mg",
    "quantity": 50,
    "unitPrice": 45,
    "subtotal": 2250
  }],
  "advancePayment": 4500,  // 10%
  "remainingBalance": 40500,  // 90% COD
  "paymentStatus": "partial|full|pending",
  "shippingMethod": "self|medideals",
  "estimatedDelivery": "2026-09-08T00:00:00Z",
  "status": "pending|confirmed|shipped|delivered|cancelled",
  "createdAt": "2026-09-01T10:00:00Z"
}

PATCH /api/medideals/orders/:id/status
Body: { "status": "shipped|delivered" }
Response: { "success": true, "status": "shipped" }

GET /api/medideals/kyc/metrics
Response: {
  "totalUsers": 1234,
  "retailers": 456,
  "distributors": 345,
  "vendors": 433,
  "kycVerified": 1100,
  "totalOrders": 5678,
  "revenue": 2345678
}

POST /api/medideals/users/:id/verify
Response: { "success": true, "kycStatus": "verified" }

GET /api/medideals/analytics/dashboard
Response: {
  "activeUsers": 234,
  "ordersThisWeek": 456,
  "revenueThisMonth": 2345678,
  "topProducts": [...]
}
```

## Step 4: Implement Authentication (Optional)

If your backends require authentication:

```typescript
// src/api/client.ts - Add token to requests
apiClient.setAuthToken('current', 'your-token-here')
```

The token will be added to all requests as:
```
Authorization: Bearer your-token-here
```

For JWT tokens, implement refresh token logic in your backend and return a new token when the current one expires.

## Step 5: Testing Integration

### Start Dev Server
```bash
npm run dev
```

Access each product:
- http://localhost:4173/?product=current
- http://localhost:4173/?product=justice-desk
- http://localhost:4173/?product=vakeel-sahib
- http://localhost:4173/?product=medideals

### Verify Health Checks
Open browser DevTools console and check:
```javascript
// Check backend status
window.useAppStore.getState().backendStatus['current']
// Should show: { connected: true, healthy: true, lastChecked: Date }
```

### Verify Data Loading
- Dashboard should show real numbers
- No "Unavailable" messages if backend is running
- Timestamps should be recent

### Test Table Operations
- Search across displayed data
- Sort by columns
- Paginate through results
- Click rows to drill down

## Step 6: Error Handling

The admin panels automatically handle:

```
401 Unauthorized
  → Redirect to login
  → Clear auth token
  → Show "Unauthorized" error

404 Not Found
  → Show "Endpoint not implemented"
  → Log endpoint path to console
  → Return empty data

500 Server Error
  → Show "Backend error"
  → Log error details
  → Allow retry

Network Timeout
  → Show "Network timeout"
  → Allow retry
  → Fall back to cache if available

CORS Error
  → Check backend CORS headers
  → Add required origins: https://admin.example.com
```

## Step 7: Performance Optimization

### Implement Caching

```typescript
// Backend should support cache headers
Cache-Control: max-age=300  // 5 minutes for list endpoints
Cache-Control: max-age=3600  // 1 hour for metrics
ETag: "hash-of-data"
```

Frontend will use these for stale-while-revalidate pattern.

### Implement Pagination

Always paginate large datasets:
```
GET /api/current/stories?limit=50&offset=0
```

Default: 50 items per page
Max: 100 items per page

### Implement Search

For searchable endpoints:
```
GET /api/justice-desk/users?search=rajesh&limit=50&offset=0
```

## Step 8: Deployment

### Build
```bash
npm run build
```

### Deploy dist/ folder
```bash
# Docker
COPY dist/ /usr/share/nginx/html/

# Vercel
vercel --prod

# AWS S3 + CloudFront
aws s3 sync dist/ s3://admin-bucket/
```

### Configure Environment
Set environment variables in your deployment:
```
REACT_APP_CURRENT_API_URL=https://api.current.com/api/current
REACT_APP_JD_API_URL=https://api.justicedesk.com/api/justice-desk
REACT_APP_VS_API_URL=https://api.vakeelsahib.com/api/vakeel-sahib
REACT_APP_MD_API_URL=https://api.medideals.com/api/medideals
```

### Verify
```bash
# Check production build
curl https://admin.example.com/?product=current

# Check backend connectivity
curl https://admin.example.com/api/current/health  # Should show backend health
```

## Troubleshooting

### Backend returns 404 for endpoints
- Verify endpoint path matches specification
- Check API version (v1, v2, etc)
- Ensure trailing slashes consistency

### Backend returns 401 Unauthorized
- Verify auth token is set
- Check token expiration
- Verify token format (Bearer token)

### CORS errors
- Add admin domain to backend CORS whitelist
- Verify Content-Type headers
- Check preflight OPTIONS requests

### Data showing as "Unavailable"
- Check backend /health endpoint
- Verify network connectivity
- Check browser console for errors
- Verify API URLs in environment

### Performance issues
- Check backend query performance
- Implement indexes on frequently searched fields
- Add caching headers
- Paginate large result sets

---

## API Contract Versioning

When updating APIs:

1. Add new endpoints without breaking existing ones
2. Deprecate old endpoints (add Deprecated header)
3. Support both old and new for 6 months
4. Update admin panel to use new endpoints
5. Remove old endpoints after sunset period

Example:
```
Old: GET /api/current/stories
New: GET /api/current/v2/stories (additional fields)

During transition: Support both, use new if available
```

---

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Auth Tokens**: Never log or expose in URLs
3. **CORS**: Whitelist admin domain only
4. **Rate Limiting**: Implement per-user request limits
5. **Input Validation**: Validate all inputs on backend
6. **SQL Injection**: Use parameterized queries
7. **XSS Protection**: Sanitize data on display
8. **CSRF**: Implement CSRF tokens if needed

---

For questions or issues, check the main README.md or OPERATIONAL_STATUS.md.
