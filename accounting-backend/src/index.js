// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connect, connectChatStarter } = require('./db/mongo');
const authRoutes = require('./routes/auth.routes');
const itemCategoryRoutes = require('./routes/itemCategory.routes');
const unitRoutes = require('./routes/unit.routes');
const customerRoutes = require('./routes/customer.routes');
const vendorRoutes = require('./routes/vendor.routes');
const bankRoutes = require('./routes/bank.routes');
const gstRoutes = require('./routes/gst.routes');
const brandRoutes = require('./routes/brand.routes');
const itemRoutes = require('./routes/item.routes');
const incomeRoutes = require('./routes/income.routes');
const expenseRoutes = require('./routes/expense.routes');
const saleRoutes = require('./routes/sale.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const companyRoutes = require('./routes/company.routes');
const receiptRoutes = require('./routes/receipt.routes');
const paymentRoutes = require('./routes/payment.routes');
const enquiryRoutes = require('./routes/enquiry.routes');
const errorHandler = require('./middlewares/errorHandler');

const PORT = process.env.PORT || 4000;

const allowedOrigins = [
    "https://b2bbilling.com",
    "https://www.b2bbilling.com",
    "https://accounting.b2bbilling.com",
    "https://b2b-accounting.vercel.app",
    "https://b2b-fullstack.vercel.app",
    "http://localhost:5174",
    "http://localhost:4000"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
};

async function start() {
    await connect(process.env.MONGO_URI);
    await connectChatStarter(process.env.CHAT_STARTER_MONGO_URI);
    const app = express();

    app.use(cors(corsOptions));
    app.use(express.json());

    // Health
    app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

    // Auth routes (for validating tokens from main app)
    app.use('/api/auth', authRoutes);

    // API routes
    app.use('/api/companies', companyRoutes);
    app.use('/api/item-categories', itemCategoryRoutes);
    app.use('/api/unit', unitRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/vendors', vendorRoutes);
    app.use('/api/bank', bankRoutes);
    app.use('/api/gst', gstRoutes);
    app.use('/api/brand', brandRoutes);
    app.use('/api/items', itemRoutes);
    app.use('/api/income', incomeRoutes);
    app.use('/api/expense', expenseRoutes);
    app.use('/api/sales', saleRoutes);
    app.use('/api/purchases', purchaseRoutes);
    app.use('/api/receipts', receiptRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/enquiries', enquiryRoutes);

    // Global error handler
    app.use(errorHandler);

    app.listen(PORT, () => {
        console.log(`Accounting service listening on port ${PORT}`);
    });
}

start().catch((err) => {
    console.error('Failed to start', err);
    process.exit(1);
});
