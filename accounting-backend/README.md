# Accounting Backend API

Node.js/Express REST API for the B2B Accounting System with multi-company support, comprehensive transaction management, and MongoDB persistence.

## Features

- **Multi-Company Architecture** — Company-scoped data isolation
- **Comprehensive CRUD** — Full create, read, update, delete for all entities
- **Dashboard Analytics** — Real-time business metrics and KPIs with period filtering
- **Automatic Stock Management** — Real-time inventory updates on sales and purchases
- **JWT Authentication** — Proto-token format with user ID extraction
- **Request Validation** — Input validation with custom validators
- **Error Handling** — Centralized error handling middleware
- **CORS Configuration** — Environment-driven allowed origins
- **Database Abstraction** — Mongoose ORM with schema validation

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (proto-token format)
- **Validation**: Custom validation middleware

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/accounting_dev
CHAT_STARTER_MONGO_URI=mongodb://127.0.0.1:27017/chat-starter

# Frontend URLs for CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:5174,http://localhost:4000,http://localhost:5173
```

### Run Development Server

```bash
npm run dev
```

Server starts on `http://localhost:4000`

## Project Structure

```
src/
├── controllers/          # Request handlers (business logic)
│   ├── bank.controller.js
│   ├── customer.controller.js
│   ├── vendor.controller.js
│   ├── item.controller.js
│   ├── sale.controller.js
│   ├── purchase.controller.js
│   ├── receipt.controller.js
│   ├── payment.controller.js
│   ├── income.controller.js
│   ├── expense.controller.js
│   └── ...
├── models/               # Mongoose schemas
│   ├── Bank.js
│   ├── Customer.js
│   ├── Vendor.js
│   ├── Item.js
│   ├── Sale.js
│   ├── Purchase.js
│   └── ...
├── routes/               # API route definitions
│   ├── auth.routes.js
│   ├── bank.routes.js
│   ├── customer.routes.js
│   └── ...
├── middlewares/          # Express middlewares
│   ├── auth.js          # Authentication middleware
│   ├── validate.js      # Request validation
│   └── errorHandler.js  # Error handling
├── validators/           # Validation schemas
├── db/                   # Database connections
│   └── mongo.js
└── index.js             # Express app entry point
```

## API Endpoints

### Authentication
All endpoints require `Authorization` header:
```
Authorization: proto-token:<userId>
```

### Core Endpoints

| Module | Endpoint | Methods | Query Params |
|--------|----------|---------|--------------|
| **Party Management** |
| Customers | `/api/customers` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Vendors | `/api/vendors` | GET, POST, PUT, DELETE | `accountCompanyName` |
| **Inventory** |
| Items | `/api/items` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Categories | `/api/item-categories` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Brands | `/api/brand` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Units | `/api/unit` | GET, POST, PUT, DELETE | `accountCompanyName` |
| **Transactions** |
| Sales | `/api/sales` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Purchases | `/api/purchases` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Receipts | `/api/receipts` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Payments | `/api/payments` | GET, POST, PUT, DELETE | `accountCompanyName` |
| **Financial** |
| Income | `/api/income` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Expense | `/api/expense` | GET, POST, PUT, DELETE | `accountCompanyName` |
| Banks | `/api/bank` | GET, POST, PUT, DELETE | `accountCompanyName` |
| GST | `/api/gst` | GET, POST, PUT, DELETE | `accountCompanyName` |
| **Company** |
| Companies | `/api/company` | GET, POST, PUT, DELETE | - |
| Enquiries | `/api/enquiry` | GET, POST, PUT, DELETE | `accountCompanyName` |
| **Analytics** |
| Dashboard | `/api/dashboard` | GET | `accountCompanyName`, `period` |

### Request/Response Examples

**Create Customer** (POST `/api/customers`):
```json
// Request
{
  "name": "John Doe",
  "mobileNumber": "9876543210",
  "email": "john@example.com",
  "accountCompanyName": "company123"
}

// Response
{
  "_id": "64abc...",
  "name": "John Doe",
  "mobileNumber": "9876543210",
  "email": "john@example.com",
  "accountCompanyName": "company123",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Get All Items** (GET `/api/items?accountCompanyName=company123`):
```json
// Response
[
  {
    "_id": "64def...",
    "name": "Product A",
    "hsnCode": "1234",
    "salePrice": 100,
    "purchasePrice": 80,
    "accountCompanyName": "company123"
  }
]
```

**Get Dashboard Analytics** (GET `/api/dashboard?accountCompanyName=company123&period=month`):
```json
// Response
{
  "totalSales": 150000,
  "totalPurchases": 100000,
  "totalExpenses": 25000,
  "totalIncome": 5000,
  "totalReceipts": 120000,
  "totalPayments": 90000,
  "lowStockItems": [
    {
      "_id": "64def...",
      "name": "Product A",
      "stock": 5,
      "unit": "Pcs"
    }
  ],
  "salesByCustomer": [
    {
      "customer": "John Doe",
      "totalAmount": 50000
    }
  ]
}
```

**Note**: Period parameter accepts: `today`, `week`, `month`, `year`, or `all` (default: `all`)

## Middleware

### Authentication (`auth.js`)
- Validates `Authorization` header
- Extracts userId from proto-token
- Attaches user info to `req` object

### Validation (`validate.js`)
- Request body validation
- Query parameter validation
- Returns 400 with error details on failure

### Error Handler (`errorHandler.js`)
- Catches all errors
- Formats error responses
- Logs errors for debugging

## Database Models

### Common Fields
Alstock: Number (default: 0, auto-updated),
  gst: ObjectId (ref: 'Gst'),
  accountCompanyName: String (required, indexed)
}
```

**Note**: Stock is automatically managed - decreases on sales, increases on purchasesupdatedAt` - Auto-updated timestamp

### Key Models

**Customer/Vendor**:
```javascript
{
  name: String (required),
  mobileNumber: String,
  email: String,
  address: String,
  gstNumber: String,
  accountCompanyName: String (required, indexed)
}
```

**Item**:
```javascript
{
  name: String (required),
  hsnCode: String,
  unit: ObjectId (ref: 'Unit'),
  category: ObjectId (ref: 'ItemCategory'),
  brand: ObjectId (ref: 'Brand'),
  salePrice: Number,
  purchasePrice: Number,
  gst: ObjectId (ref: 'Gst'),
  accountCompanyName: String (required, indexed)
}
```

**Sale/Purchase**:
``invoiceDate: Date (required),
  party: ObjectId (ref: 'Customer' or 'Vendor'),
  items: [{
    item: ObjectId,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  totalAmount: Number,
  accountCompanyName: String (required, indexed)
}
```

**Automatic Stock Management**:
- **Sales**: When created/updated/deleted, item stock is automatically decreased/adjusted
- **Purchases**: When created/updated/deleted, item stock is automatically increased/adjusted
- **Bulk Operations**: Uses MongoDB `bulkWrite` for atomic updatesate: Date,
  accountCompanyName: String (required, indexed)
}
```

## Environment Configuration

### Development
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/accounting_dev
ALLOWED_ORIGINS=http://localhost:5174,http://localhost:4000,http://localhost:5173
```

### Production
```env
PORT=4000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/accounting_prod
ALLOWED_ORIGINS=https://accounting.b2bbilling.com,https://b2bbilling.com
```

**Critical**: Update `ALLOWED_ORIGINS` for production deployment.

## Deployment

### Production Build
```bash
# Set environment variables
cp .env.production .env

# Start server
npm start
```

### Platform Deployment (Vercel, Heroku, etc.)
1. Set environment variables in platform dashboard
2. Deploy repository
3. Verify `ALLOWED_ORIGINS` includes frontend URLs

## Development

### Adding a New Endpoint

1. **Create Model** (`src/models/NewModel.js`):
```javascript
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  accountCompanyName: { type: String, required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('NewModel', schema);
```

2. **Create Controller** (`src/controllers/newModel.controller.js`):
```javascript
const Model = require('../models/NewModel');

exports.getAll = async (req, res, next) => {
  try {
    const { accountCompanyName } = req.query;
    const items = await Model.find({ accountCompanyName });
    res.json(items);
  } catch (err) {
    next(err);
  }
};
```

3. **Create Routes** (`src/routes/newModel.routes.js`):
```javascript
const router = require('express').Router();
const controller = require('../controllers/newModel.controller');

router.get('/', controller.getAll);
router.post('/', controller.create);

module.exports = router;
```

4. **Register Routes** (`src/index.js`):
```javascript
app.use('/api/new-model', require('./routes/newModel.routes'));
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**:
- Check `MONGO_URI` is correct
- Verify MongoDB is running
- Check network/firewall settings

**CORS Errors**:
- Verify `ALLOWED_ORIGINS` includes frontend URL
- Check comma-separated format (no spaces)
- Restart server after `.env` changes

**Auth Failures**:
- Verify token format: `proto-token:<userId>`
- Check token is sent in `Authorization` header
- Ensure userId is valid MongoDB ObjectId

**Data Not Filtered by Company**:
- Verify `accountCompanyName` is in request
- Check model has `accountCompanyName` field
- Ensure query filters by company

## Scripts

```bash
npm run dev     # Start development server with nodemon
npm start       # Start production server
```

## License

Proprietary - All rights reserved