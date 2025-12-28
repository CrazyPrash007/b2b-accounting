# Accounting Frontend

React + Vite frontend for the B2B Accounting System with multi-company support, real-time chat integration, and comprehensive financial management UI.

## Features

- **Multi-Company Dashboard** — Switch between companies with context preservation
- **Party Management** — Customer and vendor management with chat integration
- **Inventory Control** — Items, categories, brands, units, GST configurations
- **Transaction Processing** — Sales, purchases, receipts, payments with invoice generation
- **Financial Tracking** — Income and expense management with categorization
- **Real-time Chat** — Mini chat overlay for customer/vendor communication
- **Excel Export** — Export tables to Excel for reporting
- **Responsive Design** — Mobile-friendly interface with TailwindCSS
- **Optimized Performance** — Code splitting, lazy loading, optimistic UI updates

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| Styling | TailwindCSS |
| HTTP Client | Axios |
| Routing | React Router v6 |
| State | React Context + Hooks |
| Real-time | Socket.IO Client |

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```env
# Accounting Backend API (port 4000)
VITE_API_BASE_URL=http://localhost:4000

# B2B Fullstack App URL (for navigation)
VITE_MAIN_APP_URL=http://localhost:5173

# Chat/Fullstack Backend API (port 5000)
VITE_CHAT_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Run Development Server

```bash
npm run dev
```

App runs on `http://localhost:5174`

### Build for Production

```bash
npm run build
```

Output in `dist/` folder.

## Project Structure

```
src/
├── components/              # Reusable components
│   ├── chat/               # Mini chat overlay
│   │   └── MiniChatOverlay.jsx
│   ├── layout/             # Layout components
│   │   ├── Sidebar.jsx
│   │   └── TopNav.jsx
│   └── ui/                 # UI primitives
│       ├── Button.jsx
│       ├── Modal.jsx
│       └── Table.jsx
├── features/               # Feature-based modules
│   ├── party/             # Customer & vendor management
│   │   ├── customer/
│   │   │   ├── CustomerPage.jsx
│   │   │   └── hooks/useCustomer.js
│   │   └── vendor/
│   │       ├── VendorPage.jsx
│   │       └── hooks/useVendor.js
│   ├── items/             # Inventory management
│   │   ├── items/
│   │   ├── categories/
│   │   ├── brands/
│   │   └── units/
│   ├── transactions/      # Financial transactions
│   │   ├── sales/
│   │   ├── purchase/
│   │   ├── receipt/
│   │   └── payment/
│   ├── masters/           # Master data
│   │   ├── bank/
│   │   ├── gst/
│   │   ├── income/
│   │   └── expense/
│   └── company/           # Company management
│       └── CompanySelector.jsx
├── services/              # API integration
│   ├── apiClient.js       # Axios instance with auth
│   ├── resourceApiFactory.js  # CRUD factory
│   └── useResourceFactory.js  # React hooks factory
├── contexts/              # React contexts
│   ├── AuthContext.jsx    # Authentication state
│   └── CompanyContext.jsx # Selected company state
├── layouts/               # Page layouts
│   ├── MainLayout.jsx
│   └── AuthLayout.jsx
├── utils/                 # Utilities
│   ├── excelExport.js
│   └── formatters.js
├── App.jsx                # App component
├── AppRoutes.jsx          # Route configuration
└── main.jsx              # Entry point
```

## Key Concepts

### Authentication

**Token Format**: `proto-token:<userId>`

```javascript
// Stored in localStorage
localStorage.setItem('token', 'proto-token:64abc...');

// Auto-injected in all API requests via apiClient
```

### Company Context

```javascript
// Company is automatically injected in all API calls
const { selectedCompany } = useCompany();

// API client adds: ?accountCompanyName=company123
```

### API Integration Pattern

**Using Resource Factory**:
```javascript
import { useResource } from '../../services/useResourceFactory';

const CustomerPage = () => {
  const { items, loading, create, update, remove } = useResource('customers');
  
  // items auto-filtered by company context
  // create, update, remove handle optimistic updates
};
```

**Direct API Calls**:
```javascript
import { authFetch } from '../../services/apiClient';

const response = await authFetch('/api/items?accountCompanyName=company123');
```

### Mini Chat Integration

```javascript
import MiniChatOverlay from '../../components/chat/MiniChatOverlay';

// Renders chat overlay with real-time messaging
<MiniChatOverlay />
```

## Components

### Layout Components

**Sidebar** - Main navigation menu  
**TopNav** - Header with company selector and user menu  
**MainLayout** - Combines sidebar, top nav, and content area

### Feature Components

**CustomerPage** - Customer CRUD with table and modal  
**ItemPage** - Inventory management with categories  
**SalesPage** - Sales invoice creation and management  
**PurchasePage** - Purchase order processing

### UI Components

**Modal** - Reusable modal wrapper  
**Table** - Data table with sorting and filtering  
**Button** - Styled button variants  
**Form Controls** - Input, select, textarea components

## Services

### apiClient.js

Axios instance with:
- Base URL from environment
- Auth token injection
- Company context injection
- Error handling
- Request/response interceptors

```javascript
import { authFetch, API_BASE_URL } from './apiClient';

// GET request
const data = await authFetch('/api/customers');

// POST request
const created = await authFetch('/api/customers', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' })
});
```

### resourceApiFactory.js

CRUD operations factory:

```javascript
import resourceApiFactory from './resourceApiFactory';

const customerApi = resourceApiFactory('customers');

await customerApi.getAll();
await customerApi.create({ name: 'John' });
await customerApi.update(id, { name: 'Jane' });
await customerApi.remove(id);
```

### useResourceFactory.js

React hooks for CRUD with state management:

```javascript
const { items, loading, error, create, update, remove, refresh } = 
  useResource('customers');
```

## Routing

```javascript
// AppRoutes.jsx
<Routes>
  <Route path="/" element={<MainLayout />}>
    <Route path="customers" element={<CustomerPage />} />
    <Route path="vendors" element={<VendorPage />} />
    <Route path="items" element={<ItemPage />} />
    <Route path="sales" element={<SalesPage />} />
    {/* ... */}
  </Route>
</Routes>
```

## Environment Variables

### Development (.env)
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_CHAT_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_MAIN_APP_URL=http://localhost:5173
```

### Production (.env.production)
```env
VITE_API_BASE_URL=https://accounting-api.b2bbilling.com
VITE_CHAT_API_URL=https://api.b2bbilling.com/api
VITE_SOCKET_URL=https://api.b2bbilling.com
VITE_MAIN_APP_URL=https://b2bbilling.com
```

**Important**: Vite automatically uses `.env.production` when building.

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting

**Vercel**:
```bash
vercel --prod
```

**Netlify**:
```bash
netlify deploy --prod --dir=dist
```

**Manual**:
1. Upload `dist/` folder to hosting
2. Configure server for SPA routing (redirect all to index.html)
3. Set environment variables in hosting platform

### Environment Variables in Platform

Set these in your hosting platform dashboard:
- `VITE_API_BASE_URL`
- `VITE_CHAT_API_URL`
- `VITE_SOCKET_URL`
- `VITE_MAIN_APP_URL`

## Development

### Adding a New Feature

1. **Create Feature Module**:
```
src/features/new-feature/
├── NewFeaturePage.jsx
├── components/
│   ├── NewFeatureModal.jsx
│   └── NewFeatureTable.jsx
└── hooks/
    └── useNewFeature.js
```

2. **Add API Integration**:
```javascript
const { items, create, update, remove } = useResource('new-feature');
```

3. **Add Route**:
```javascript
<Route path="new-feature" element={<NewFeaturePage />} />
```

### Code Style

- **Components**: PascalCase (e.g., `CustomerPage.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCustomer.js`)
- **Utils**: camelCase (e.g., `excelExport.js`)
- **CSS**: TailwindCSS utility classes

### Best Practices

- Use resource factory for standard CRUD operations
- Keep components focused and reusable
- Extract complex logic to custom hooks
- Use context for global state (auth, company)
- Implement optimistic UI updates for better UX
- Handle loading and error states consistently

## Troubleshooting

### Common Issues

**API calls fail with CORS error**:
- Check backend `ALLOWED_ORIGINS` includes frontend URL
- Verify `VITE_API_BASE_URL` points to correct backend

**Auth token not working**:
- Check token format: `proto-token:<userId>`
- Verify token is in localStorage
- Ensure backend auth middleware is working

**Company context not applied**:
- Verify company is selected in CompanySelector
- Check `accountCompanyName` is in API requests
- Ensure backend filters by company

**Chat overlay not connecting**:
- Verify `VITE_SOCKET_URL` is correct
- Check b2b-fullstack backend is running
- Verify token is valid

**Environment variables not loading**:
- Ensure `.env` file exists and is in project root
- Restart dev server after changing `.env`
- For production, rebuild with `npm run build`

## Scripts

```bash
npm run dev      # Start development server (Vite)
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

## Performance Optimization

- **Code Splitting**: Routes lazy-loaded with React.lazy()
- **Memoization**: Use React.memo for expensive components
- **Debouncing**: Search inputs debounced for API calls
- **Virtual Scrolling**: Large tables use virtualization
- **Optimistic Updates**: UI updates before API confirmation

## License

Proprietary - All rights reserved
