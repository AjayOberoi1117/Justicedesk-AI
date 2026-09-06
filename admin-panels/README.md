# Unified Admin Panels

Professional, truth-telling admin control surfaces for CURRENT, Justice Desk, Vakeel Sahib, and MediDeals.

## Architecture

### Product Isolation
Each product operates in complete isolation via:
- **URL Parameters**: `?product=current|justice-desk|vakeel-sahib|medideals`
- **Storage Namespacing**: All localStorage/sessionStorage keys prefixed with `{product}:`
- **State Isolation**: Zustand store maintains per-product auth and backend status
- **API Segregation**: Separate API clients per product with independent baseURLs

### Core Features
- **Truth-telling dashboards**: Never fabricate data - show "unavailable" when backends are down
- **Real backend integration**: Configurable API endpoints via environment variables
- **Protected routes**: Authentication required for all admin pages
- **Responsive design**: Mobile-first UI that works on desktop, tablet, and mobile
- **Professional hierarchy**: Clear information structure with status indicators

## Project Structure

```
src/
├── api/                      # API clients and services
│   ├── client.ts            # Base Axios client with product-specific configs
│   ├── current.ts           # CURRENT (news) API service
│   ├── justice-desk.ts      # Justice Desk API service
│   ├── vakeel-sahib.ts      # Vakeel Sahib API service
│   ├── medideals.ts         # MediDeals API service
│   └── index.ts             # Exports
├── components/              # Reusable React components
│   ├── Layout.tsx           # Main layout with header/footer
│   ├── ProtectedRoute.tsx   # Auth guard component
│   └── StatusCard.tsx       # Status/metric display component
├── pages/                   # Page components
│   ├── LoginPage.tsx        # Authentication page
│   ├── NotFound.tsx         # 404 page
│   └── dashboards/          # Product-specific dashboards
│       ├── CurrentDashboard.tsx
│       ├── JusticeDeskDashboard.tsx
│       ├── VakeelSahibDashboard.tsx
│       └── MediDealsDashboard.tsx
├── utils/                   # Utility functions
│   └── storageIsolation.ts  # Storage testing and isolation verification
├── __tests__/              # Test files
│   └── productIsolation.test.ts
├── App.tsx                 # Main app component with routing
├── store.ts                # Zustand state management
├── types.ts                # TypeScript type definitions
└── main.tsx                # React entry point
```

## Product-Specific Dashboards

### CURRENT Admin
- **Purpose**: News ingestion and content management
- **Key Metrics**: Total stories, fresh stories (24h), provider status
- **Features**: Provider health monitoring, story count tracking
- **Data Model**: Metrics, provider status, story counts
- **KYC**: N/A (content platform)

### Justice Desk Admin
- **Purpose**: User management and professional verification
- **Key Metrics**: Total users, KYC verified, pending KYC, rejected KYC
- **Features**: User table with KYC status, document verification workflow
- **Data Model**: Users with KYC status, document verification state
- **KYC Language**: "Verified from submitted documents" (not government/authority verified)

### Vakeel Sahib Admin
- **Purpose**: Advocate network management
- **Key Metrics**: Total advocates, KYC complete, pending KYC
- **Features**: Advocate table with Bar Council/PAN/Aadhaar status
- **Data Model**: Advocates with mandatory (Bar, PAN) and optional (Aadhaar) docs
- **Zero Human Flow**: Target is zero routine human intervention via automated verification
- **KYC Policy**:
  - Bar Council Enrollment: **Mandatory**
  - PAN: **Mandatory**
  - Aadhaar: **Optional**

### MediDeals Admin
- **Purpose**: B2B pharma marketplace operations
- **Key Metrics**: Total users by role, KYC verified, orders, revenue
- **Features**: User management by role, product catalog, order tracking, payment state
- **Data Model**: Users (retailer/distributor/vendor), products, orders, payments
- **Business Roles**:
  - **Retailer**: Buy only • GST optional
  - **Distributor/Wholesaler**: Buy and sell • GST mandatory
  - **Vendor/Seller**: Sell only • GST mandatory
- **Payment Model**: 10% advance + 90% COD balance
- **Shipping**: Seller self-shipping or MediDeals shipping with courier estimation
- **KYC by Role**:
  - **Retailer**: Drug Licence (mandatory for allopathic) + GST (optional)
  - **Vendor**: GST (mandatory) + Drug Licence (mandatory for allopathic)
  - **Ayurvedic/Surgical buyers**: Drug Licence not required

## Environment Configuration

Set backend URLs via environment variables:

```bash
# .env or .env.local
REACT_APP_CURRENT_API_URL=http://localhost:3000/api/current
REACT_APP_JD_API_URL=http://localhost:3001/api/justice-desk
REACT_APP_VS_API_URL=http://localhost:3002/api/vakeel-sahib
REACT_APP_MD_API_URL=http://localhost:3003/api/medideals
```

Default fallback URLs point to localhost with default ports.

## Running the Panels

### Development
```bash
# Install dependencies
npm install

# Start dev server (port 4173)
npm run dev

# Access panels
http://localhost:4173/?product=current           # CURRENT
http://localhost:4173/?product=justice-desk      # Justice Desk
http://localhost:4173/?product=vakeel-sahib      # Vakeel Sahib
http://localhost:4173/?product=medideals         # MediDeals
```

### Build
```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build

# Preview build
npm run preview
```

### Testing
```bash
# Run tests
npm test
```

## Key Principles

### 1. Truth-Telling
Never fabricate data. Always show:
- ✓ Real numbers when backend is healthy
- ✗ "Unavailable" when backend is disconnected
- ⚠ Error messages when API calls fail
- Timestamps for when data was last refreshed

### 2. Product Isolation
Verify zero cross-product state leakage:
- Different localStorage namespaces per product
- Independent auth sessions
- Separate API clients with isolated tokens
- Clear storage on logout per product

### 3. Professional UX
- Immediate navigation (cached/stale-while-revalidate)
- Clear loading and error states
- Responsive design (mobile-first)
- Accessible forms and tables
- Destructive action confirmations

### 4. Backend Integration
- Real API clients ready to connect
- Proper error handling and retries
- Auth token management
- Health check endpoints
- No mock data in production

## Testing

### Product Isolation Tests
Run tests to verify cross-product separation:
```bash
npm test -- productIsolation
```

Tests verify:
- Storage key namespacing
- Auth state isolation
- Backend status separation
- Storage doesn't leak between products
- Logout clears only the active product's data

### Manual Testing Checklist
- [ ] Login to each product independently
- [ ] Verify localStorage keys are namespaced
- [ ] Switch between products - verify auth state
- [ ] Refresh page - auth persists for current product
- [ ] Clear browser storage - all products cleared
- [ ] Each product shows its own data (or "unavailable")

## API Endpoints (Expected)

### CURRENT
- `GET /api/current/health` - Health check
- `GET /api/current/metrics` - Dashboard metrics
- `GET /api/current/providers` - Provider status
- `GET /api/current/stories` - List stories

### Justice Desk
- `GET /api/justice-desk/health` - Health check
- `GET /api/justice-desk/users` - List users with KYC status
- `GET /api/justice-desk/kyc/metrics` - KYC statistics
- `POST /api/justice-desk/users/:id/documents/:docId/verify` - Verify document

### Vakeel Sahib
- `GET /api/vakeel-sahib/health` - Health check
- `GET /api/vakeel-sahib/advocates` - List advocates
- `GET /api/vakeel-sahib/kyc/metrics` - KYC statistics
- `POST /api/vakeel-sahib/advocates/:id/bar-enrollment/verify` - Verify enrollment
- `POST /api/vakeel-sahib/advocates/:id/pan/verify` - Verify PAN

### MediDeals
- `GET /api/medideals/health` - Health check
- `GET /api/medideals/users` - List users by role
- `GET /api/medideals/products` - List products
- `GET /api/medideals/orders` - List orders
- `GET /api/medideals/kyc/metrics` - KYC statistics
- `POST /api/medideals/users/:id/verify` - Verify KYC

## Deployment

The admin panels are deployed as a unified frontend serving all four products. Each product is accessed via URL parameter, ensuring:
- Single deployment, multiple products
- Consistent UX across products
- Shared infrastructure and caching
- Independent backend integrations

### Production Checklist
- [ ] All API endpoints configured and tested
- [ ] Auth tokens work with each backend
- [ ] Health checks passing for all products
- [ ] Real data showing (no fake zeros)
- [ ] Error states clear and actionable
- [ ] Storage isolation verified
- [ ] Cross-browser compatibility tested
- [ ] Mobile responsiveness verified
- [ ] Performance acceptable (lighthouse > 80)

## Troubleshooting

### Backend Unavailable
If a product's backend is down:
1. Dashboard shows "Unavailable" with error details
2. Check backend API URL in environment config
3. Verify backend service is running
4. Check network connectivity

### Data Not Loading
- [ ] Check browser console for API errors
- [ ] Verify backend endpoints in API services
- [ ] Confirm auth token is set
- [ ] Check network tab for request/response status

### Storage Isolation Issues
- [ ] Clear browser storage and try again
- [ ] Check storage keys start with `{product}:`
- [ ] Verify session storage is also isolated
- [ ] Run isolation tests: `npm test -- productIsolation`

## License

Proprietary - All rights reserved
