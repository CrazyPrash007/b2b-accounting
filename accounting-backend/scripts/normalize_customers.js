// scripts/normalize_customers.js
const mongoose = require('mongoose');
const Customer = require('../src/models/Customer'); // adjust path if necessary
require('dotenv').config();

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/accounting_dev';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        const coll = mongoose.connection.db.collection('customers');

        // 1) backfill normalized fields for all docs (including soft-deleted — but index ignores deleted)
        const cursor = coll.find({});
        let count = 0;
        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const customerNameNorm = normalizeString(doc.customerName);
            const companyNameNorm = normalizeString(doc.companyName);
            // only update if differs
            if (doc.customerNameNorm !== customerNameNorm || doc.companyNameNorm !== companyNameNorm) {
                await coll.updateOne({ _id: doc._id }, { $set: { customerNameNorm, companyNameNorm } });
                count++;
            }
        }
        console.log('Updated normalized fields on', count, 'documents.');

        // 2) ensure unique index on normalized fields exists (will fail if duplicates exist)
        try {
            await coll.createIndex(
                { ownerId: 1, customerNameNorm: 1, companyNameNorm: 1 },
                { unique: true, partialFilterExpression: { isDeleted: false }, name: "ownerId_customerNameNorm_companyNameNorm_unique" }
            );
            console.log('Index ensured.');
        } catch (e) {
            console.error('Error creating index — likely duplicates exist. Resolve duplicates then re-run. Error:', e);
        }
    } finally {
        await mongoose.disconnect();
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
