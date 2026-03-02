#!/usr/bin/env node
/**
 * Migration Script: Backfill MasterItem catalog from existing Item records
 *
 * What it does:
 * 1. Groups all non-deleted Items by normalized name (lowercase, trimmed, single-spaced)
 * 2. For each unique name, creates a MasterItem with the best metadata (description, brand, category, type, image)
 * 3. Links each Item to its MasterItem via `masterItemId` and sets `isFromMaster = true`
 * 4. Sets `userCount` on each MasterItem (distinct ownerId count)
 *
 * Usage:
 *   MONGO_URI=mongodb://... node src/scripts/migrate-master-items.js
 *
 * Idempotent: skips Items that already have a masterItemId set.
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI env var required');
    process.exit(1);
}

function normalizeString(v) {
    if (!v) return '';
    return String(v).trim().replace(/\s+/g, ' ').toLowerCase();
}

async function run() {
    console.log('🔌 Connecting to accounting DB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    const Item = require('../models/Item');
    const MasterItem = require('../models/MasterItem');

    // 1. Get all non-deleted items without a masterItemId
    const unlinkedItems = await Item.find({
        isDeleted: false,
        $or: [{ masterItemId: null }, { masterItemId: { $exists: false } }]
    }).lean();

    console.log(`📦 Found ${unlinkedItems.length} unlinked items to process`);

    if (unlinkedItems.length === 0) {
        console.log('✅ Nothing to migrate');
        await mongoose.disconnect();
        return;
    }

    // 2. Group by normalized name
    const groups = new Map(); // nameNorm -> { items: [...], bestItem: { ... } }
    for (const item of unlinkedItems) {
        const nameNorm = normalizeString(item.name || item.itemName);
        if (!nameNorm) continue;

        if (!groups.has(nameNorm)) {
            groups.set(nameNorm, { items: [], ownerIds: new Set() });
        }
        const group = groups.get(nameNorm);
        group.items.push(item);
        group.ownerIds.add(item.ownerId.toString());
    }

    console.log(`📋 Found ${groups.size} unique item names`);

    let created = 0;
    let linked = 0;
    let skipped = 0;
    let errors = 0;

    for (const [nameNorm, group] of groups) {
        try {
            // Check if MasterItem already exists for this nameNorm
            let masterItem = await MasterItem.findOne({ nameNorm, isDeleted: false });

            if (!masterItem) {
                // Pick the "best" item for metadata: prefer one with description, brand, image
                const sorted = [...group.items].sort((a, b) => {
                    // Score: has description (1), has brandName (1), has image (1), has category (1)
                    const score = (item) =>
                        (item.description ? 1 : 0) +
                        (item.brandName ? 1 : 0) +
                        (item.itemImage ? 1 : 0) +
                        (item.category ? 1 : 0);
                    return score(b) - score(a);
                });
                const best = sorted[0];

                masterItem = new MasterItem({
                    name: best.name || best.itemName,
                    description: best.description || '',
                    brandName: best.brandName || '',
                    itemType: best.itemType || 'Goods',
                    category: best.category || '',
                    itemImage: best.itemImage || '',
                    itemImageMimeType: best.itemImageMimeType || '',
                    status: 'active',
                    userCount: group.ownerIds.size,
                    createdFromItemId: best._id,
                });

                try {
                    await masterItem.save();
                    created++;
                } catch (err) {
                    if (err.code === 11000) {
                        // Race condition or duplicate — find existing
                        masterItem = await MasterItem.findOne({ nameNorm, isDeleted: false });
                        if (!masterItem) {
                            console.error(`  ⚠️ Duplicate key but no doc found for "${nameNorm}"`);
                            errors++;
                            continue;
                        }
                        skipped++;
                    } else {
                        throw err;
                    }
                }
            } else {
                // MasterItem already exists, update userCount
                skipped++;
            }

            // 3. Link all items in this group to the MasterItem
            const itemIds = group.items.map(i => i._id);
            const result = await Item.updateMany(
                { _id: { $in: itemIds } },
                { $set: { masterItemId: masterItem._id, isFromMaster: true } }
            );
            linked += result.modifiedCount;

            // 4. Update userCount to reflect ALL linked items (including previously linked)
            const distinctOwners = await Item.distinct('ownerId', {
                masterItemId: masterItem._id,
                isDeleted: false
            });
            await MasterItem.updateOne(
                { _id: masterItem._id },
                { $set: { userCount: distinctOwners.length } }
            );
        } catch (err) {
            console.error(`  ❌ Error processing "${nameNorm}":`, err.message);
            errors++;
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ MasterItems created: ${created}`);
    console.log(`  ⏭️  MasterItems skipped (already exist): ${skipped}`);
    console.log(`  🔗 Items linked: ${linked}`);
    console.log(`  ❌ Errors: ${errors}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected');
}

run().catch(err => {
    console.error('💥 Migration failed:', err);
    process.exit(1);
});
