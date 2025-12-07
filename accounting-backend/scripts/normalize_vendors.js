// scripts/normalize_vendors.js
const mongoose = require('mongoose');
const Vendor = require('../src/models/Vendor'); // adjust path if needed
require('dotenv').config();

function normalizeString(v) {
    if (v === undefined || v === null) return "";
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/accounting_dev';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        const coll = mongoose.connection.db.collection('vendors');
        const cursor = coll.find({});
        let count = 0;
        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const vendorNameNorm = normalizeString(doc.vendorName);
            const companyNameNorm = normalizeString(doc.companyName);
            if (doc.vendorNameNorm !== vendorNameNorm || doc.companyNameNorm !== companyNameNorm) {
                await coll.updateOne({ _id: doc._id }, { $set: { vendorNameNorm, companyNameNorm } });
                count++;
            }
        }
        console.log('Updated normalized fields on', count, 'vendor docs.');

        try {
            await coll.createIndex(
                { ownerId: 1, vendorNameNorm: 1, companyNameNorm: 1 },
                { unique: true, partialFilterExpression: { isDeleted: false }, name: "ownerId_vendorNameNorm_companyNameNorm_unique" }
            );
            console.log('Index ensured.');
        } catch (e) {
            console.error('Error creating index — likely duplicates exist. Resolve duplicates then re-run. Error:', e);
        }
    } finally {
        await mongoose.disconnect();
    }
}

run().catch(err => { console.error(err); process.exit(1); });
