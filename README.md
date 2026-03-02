# B2B Accounting System

A comprehensive cloud-based accounting system with multi-company support, inventory management, and integrated real-time chat. Built with React + Vite frontend and Node.js/Express + MongoDB backend.

## Featuressss

### Core Accounting
- **Multi-Company Management** — Handle multiple businesses from one account
- **Dashboard Analytics** — Real-time business metrics with period filtering (today/week/month/year)
- **Party Management** — Customers & vendors with integrated chat invites
- **Inventory Management** — Items, categories, units, brands, GST configurations with automatic stock tracking
- **Transaction Processing** — Sales, purchases, receipts, payments with automatic inventory updates
- **Income & Expense Tracking** — Comprehensive financial tracking
- **Bank Integration** — Multiple bank account management

### Advanced Features
- **Automatic Stock Management** — Real-time inventory updates when items are sold or purchased
- **Real-time Chat** — Built-in mini chat overlay for customer/vendor communication
- **Cross-app Integration** — Seamless integration with B2B Fullstack platform
- **Excel Export** — Export data to Excel for reporting
- **Receipt Generation** — Automated receipt creation for transactions
- **Company Context** — Automatic data filtering by selected company
- **JWT Authentication** — Secure proto-token based authentication

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, Axios |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Auth | JWT (proto-token format) |
| Real-time | Socket.IO (via b2b-fullstack) |

## Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
cd b2b-accounting

# Install backend dependencies
cd accounting-backend
npm install

# Install frontend dependencies
cd ../accounting-frontend
npm install
```

### Environment Setup

#### Backend (`accounting-backend/.env`):
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/accounting_dev
CHAT_STARTER_MONGO_URI=mongodb://127.0.0.1:27017/chat-starter

# Frontend URLs for CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5174,http://localhost:4000,http://localhost:5173
```

#### Frontend (`accounting-frontend/.env`):
```env
# Accounting Backend API (port 4000)
VITE_API_BASE_URL=http://localhost:4000

# B2B Fullstack App URL (for navigation)
VITE_MAIN_APP_URL=http://localhost:5173

# Chat/Fullstack Backend API (port 5000)
VITE_CHAT_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**Important**: Copy `.env.example` to `.env` and configure for your environment.

### Running the Application

```bash
# Terminal 1 - Backend
cd accounting-backend
npm run dev

# Terminal 2 - Frontend
cd accounting-frontend
npm run dev
```

Open `http://localhost:5174` in your browser.

## Project Structure

```
b2b-accounting/
├── accounting-backend/
│   ├── src/
│   │   ├── controllers/     # Business logic for each module
│   │   │   ├── dashboard.controller.js  # Analytics & KPIs
│   │   │   ├── bank.controller.js
│   │   │   ├── customer.controller.js
│   │   │   ├── vendor.controller.js
│   │   │   ├── item.controller.js
│   │   │   ├── sale.controller.js       # Includes auto stock decrease
│   │   │   ├── purchase.controller.js   # Includes auto stock increase
│   │   │   ├── income.controller.js
│   │   │   ├── expense.controller.js
│   │   │   └── ...
│   │   ├── models/          # Mongoose schemas
│   │   │   ├── Bank.js
│   │   │   ├── Customer.js
│   │   │   ├── Vendor.js
│   │   │   ├── Item.js
│   │   │   ├── Sale.js
│   │   │   ├── Purchase.js
│   │   │   └── ...
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── validators/      # Request validation schemas
│   │   ├── db/              # Database connections
│   │   └── index.js         # Express server
│   ├── .env                 # Environment config (local)
│   ├── .env.production      # Production config
│   └── .env.example         # Template
├── accounting-frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── chat/        # Mini chat overlay
│   │   │   ├── layout/      # Layout components
│   │   │   └── ui/          # UI primitives
│   │   ├── featdashboard/   # Analytics and business metrics
│   │   │   ├── ures/        # Feature modules
│   │   │   ├── party/       # Customers & vendors
│   │   │   ├── items/       # Inventory management
│   │   │   ├── transactions/# Sales, purchases, receipts, payments
│   │   │   ├── masters/     # Master data (bank, GST, etc.)
│   │   │   └── company/     # Company management
│   │   ├── services/        # API clients
│   │   │   ├── apiClient.js         # Axios instance with auth
│   │   │   ├── resourceApiFactory.js # CRUD factory
│   │   │   └── useResourceFactory.js # React hooks factory
│   │   ├── contexts/        # React contexts (Auth, Company)
│   │   ├── layouts/         # Page layouts
│   │   └── utils/           # Utilities
│   ├── .env                 # Environment config (local)
│   ├── .env.production      # Production config
│   └── .env.example         # Template
└── README.md                # This file
```

## API Architecture

### Authentication
- **Format**: `Authorization: proto-token:<userId>`
- **Storage**: localStorage
- **Validation**: JWT-based with user ID extraction

### Request Flow
1. Client sends request with auth token
2. Middleware validates token and extracts userId
3. Middleware injects `accountCompanyName` from query params
4. Controller filters data by company context
5. Response sent to client

### Key Endpoints

| Module | Endpoint | Methods |
|-Dashboard | `/api/dashboard` | GET (with period filter) |
| Customers | `/api/customers` | GET, POST, PUT, DELETE |
| Vendors | `/api/vendors` | GET, POST, PUT, DELETE |
| Items | `/api/items` | GET, POST, PUT, DELETE |
| Sales | `/api/sales` | GET, POST, PUT, DELETE |
| Purchases | `/api/purchases` | GET, POST, PUT, DELETE |
| Receipts | `/api/receipts` | GET, POST, PUT, DELETE |
| Payments | `/api/payments` | GET, POST, PUT, DELETE |
| Income | `/api/income` | GET, POST, PUT, DELETE |
| Expense | `/api/expense` | GET, POST, PUT, DELETE |
| Banks | `/api/bank` | GET, POST, PUT, DELETE |
| GST | `/api/gst` | GET, POST, PUT, DELETE |

### Dashboard Analytics

The dashboard provides comprehensive business metrics:

**Endpoint**: `GET /api/dashboard?accountCompanyName=company123&period=month`

**Period Options**: `today`, `week`, `month`, `year`, `all` (default)

**Response**:
```json
{
  "totalSales": 150000,
  "totalPurchases": 100000,
  "totalExpenses": 25000,
  "totalIncome": 5000,
  "totalReceipts": 120000,
  "totalPayments": 90000,
  "lowStockItems": [...],
  "salesByCustomer": [...]
}
```

### Automatic Stock Management

Stock is automatically updated on transaction operations:

- **Sales**: Creating/updating/deleting a sale automatically decreases item stock
- **Purchases**: Creating/updating/deleting a purchase automatically increases item stock
- **Bulk Operations**: Uses MongoDB `bulkWrite` for atomic updates
- **Real-time**: Stock changes reflect immediately in inventoryE |
| GST | `/api/gst` | GET, POST, PUT, DELETE |

## Environment Configuration

### Development vs Production

The system uses environment-specific configuration files:
- `.env` - Local development (default)
- `.env.production` - Production deployment
- `.env.example` - Template with documentation

### Key Variables

**Backend**:
- `ALLOWED_ORIGINS` - **Critical**: Comma-separated frontend URLs for CORS
- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 4000)

**Frontend**:
- `VITE_API_BASE_URL` - **Critical**: Accounting backend URL
- `VITE_CHAT_API_URL` - Chat backend URL (b2b-fullstack)
- `VITE_MAIN_APP_URL` - Main app URL for navigation

See [ENVIRONMENT_CONFIGURATION.md](../ENVIRONMENT_CONFIGURATION.md) for complete details.

## Deployment

### Quick Deploy to Production

1. **Backend**:
   ```bash
   # Copy production config
   cp .env.production .env
   # Or set environment variables in platform dashboard
   npm start
   ```

2. **Frontend**:
   ```bash
   # Build (automatically uses .env.production)
   npm run build
   # Deploy dist/ folder
   ```

### Environment Variables for Production

**Backend**: Update `ALLOWED_ORIGINS` with production URLs  
**Frontend**: Update `VITE_API_BASE_URL` with production backend URL

See [REFACTOR_SUMMARY.md](../REFACTOR_SUMMARY.md) for deployment checklist.

## Integration with B2B Fullstack

This accounting system integrates with the B2B Fullstack chat platform:

- **Mini Chat Overlay**: Real-time chat embedded in accounting interface
- **Contact Sync**: Customers/vendors automatically added as chat contacts
- **Cross-navigation**: Navigate between accounting and main app
- **Shared Auth**: Single sign-on with proto-token authentication

## Development

### Adding a New Module

1. Create model in `accounting-backend/src/models/`
2. Create controller in `accounting-backend/src/controllers/`
3. Create routes in `accounting-backend/src/routes/`
4. Create frontend feature in `accounting-frontend/src/features/`
5. Add API integration using `resourceApiFactory`

### Code Patterns

**Backend Controller**:
```javascript
const getAll = async (req, res) => {
    const { accountCompanyName } = req.query;
    const items = await Model.find({ accountCompanyName });
    res.json(items);
};
```

**Frontend Hook**:
```javascript
const { items, loading, create, update, remove } = useResource('endpoint');
```

## Troubleshooting

### Common Issues

**CORS errors**: Check `ALLOWED_ORIGINS` includes frontend URL  
**Auth failures**: Verify token format is `proto-token:<userId>`  
**Company context**: Ensure `accountCompanyName` is set in requests  
**Chat not working**: Verify b2b-fullstack backend is running on port 5000

See logs for detailed error messages.

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.
