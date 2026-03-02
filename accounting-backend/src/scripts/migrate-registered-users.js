#!/usr/bin/env node
/**
 * Migration Script: Backfill registeredUserId / registeredCompanyId on existing Customers & Vendors
 *
 * What it does:
 * 1. Finds all non-deleted Customers/Vendors that have a mobile number but no registeredUserId
 * 2. Checks if that mobile number belongs to a registered user (in chat-starter DB)
 * 3. If match found → sets registeredUserId, registeredCompanyId, isFromRegistered
 * 4. If no match found → creates/updates an UnregisteredContact record
 *
 * Usage:
 *   MONGO_URI=mongodb://... CHAT_STARTER_MONGO_URI=mongodb://... node src/scripts/migrate-registered-users.js
 *
 * Idempotent: skips records that already have registeredUserId set.
 */

const mongoose = require('mongoose');
const { connect, connectChatStarter } = require('../db/mongo');
const { checkMobileRegistered, normalizePhone } = require('../utils/registeredUserSearch');

const MONGO_URI = process.env.MONGO_URI;
const CHAT_STARTER_MONGO_URI = process.env.CHAT_STARTER_MONGO_URI;

if (!MONGO_URI || !CHAT_STARTER_MONGO_URI) {
    console.error('❌ MONGO_URI and CHAT_STARTER_MONGO_URI env vars required');
    process.exit(1);
}

async function run() {
    console.log('🔌 Connecting...');
    await connect(MONGO_URI);
    await connectChatStarter(CHAT_STARTER_MONGO_URI);
    console.log('✅ Both DBs connected');

    const Customer = require('../models/Customer');
    const Vendor = require('../models/Vendor');
    const UnregisteredContact = require('../models/UnregisteredContact');

    const stats = {
        customersProcessed: 0,
        customersLinked: 0,
        customersUnregistered: 0,
        vendorsProcessed: 0,
        vendorsLinked: 0,
        vendorsUnregistered: 0,
        unregisteredCreated: 0,
        errors: 0,
    };

    // Helper to process a batch of docs (Customers or Vendors)
    async function processBatch(Model, modelName, source) {
        const docs = await Model.find({
            isDeleted: false,
            mobileNumber: { $exists: true, $ne: '' },
            $or: [
                { registeredUserId: null },
                { registeredUserId: { $exists: false } }
            ]
        }).lean();

        console.log(`\n📋 Processing ${docs.length} ${modelName}s with mobile numbers...`);

        for (const doc of docs) {
            try {
                const normalized = normalizePhone(doc.mobileNumber);
                if (!normalized || normalized.length < 10) continue;

                stats[`${modelName}sProcessed`]++;

                // Check if registered
                const matches = await checkMobileRegistered(doc.mobileNumber);

                if (matches.length > 0) {
                    // Use the first match
                    const user = matches[0];
                    // Find the best-matching company (by mobile)
                    let bestCompany = user.companies.find(c => {
                        const compNorm = normalizePhone(c.mobile);
                        return compNorm === normalized;
                    });
                    // If no direct mobile match, use first company
                    if (!bestCompany && user.companies.length > 0) {
                        bestCompany = user.companies[0];
                    }

                    await Model.updateOne(
                        { _id: doc._id },
                        {
                            $set: {
                                registeredUserId: user.userId,
                                registeredCompanyId: bestCompany?.companyId || null,
                                isFromRegistered: true,
                            }
                        }
                    );
                    stats[`${modelName}sLinked`]++;
                } else {
                    // Not registered — track as unregistered contact
                    stats[`${modelName}sUnregistered`]++;

                    try {
                        await UnregisteredContact.findOneAndUpdate(
                            { mobileNorm: normalized },
                            {
                                $setOnInsert: {
                                    mobileNorm: normalized,
                                    mobileRaw: doc.mobileNumber,
                                    name: doc.customerName || doc.vendorName || doc.name || '',
                                    email: doc.emailAddress || '',
                                    companyName: doc.companyName || '',
                                    source,
                                    firstReportedBy: doc.ownerId,
                                },
                                $inc: { reportCount: 1 },
                            },
                            { upsert: true, new: true }
                        );
                        stats.unregisteredCreated++;
                    } catch (err) {
                        if (err.code !== 11000) throw err;
                        // Duplicate key — already exists, just increment
                        await UnregisteredContact.updateOne(
                            { mobileNorm: normalized },
                            { $inc: { reportCount: 1 } }
                        );
                    }
                }
            } catch (err) {
                console.error(`  ❌ Error processing ${modelName} ${doc._id}:`, err.message);
                stats.errors++;
            }
        }
    }

    await processBatch(Customer, 'customer', 'customer');
    await processBatch(Vendor, 'vendor', 'vendor');

    console.log('\n📊 Migration Summary:');
    console.log(`  Customers processed: ${stats.customersProcessed}`);
    console.log(`  Customers linked: ${stats.customersLinked}`);
    console.log(`  Customers unregistered: ${stats.customersUnregistered}`);
    console.log(`  Vendors processed: ${stats.vendorsProcessed}`);
    console.log(`  Vendors linked: ${stats.vendorsLinked}`);
    console.log(`  Vendors unregistered: ${stats.vendorsUnregistered}`);
    console.log(`  Unregistered contacts created/updated: ${stats.unregisteredCreated}`);
    console.log(`  Errors: ${stats.errors}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
}

run().catch(err => {
    console.error('💥 Migration failed:', err);
    process.exit(1);
});
