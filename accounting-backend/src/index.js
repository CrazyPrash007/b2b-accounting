// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connect, connectChatStarter } = require('./db/mongo');
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
const errorHandler = require('./middlewares/errorHandler');

const PORT = process.env.PORT || 4000;

async function start() {
    await connect(process.env.MONGO_URI);
    await connectChatStarter(process.env.CHAT_STARTER_MONGO_URI);
    const app = express();

    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());

    // Health
    app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

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
