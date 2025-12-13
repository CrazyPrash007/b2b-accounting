const { getCompanyModel } = require('../models/Company');
const { chatStarterConnection } = require('../db/mongo');

async function listCompanies(req, res, next) {
    try {
        const Company = getCompanyModel();

        const companies = await Company.find({ owner: req.user.ownerId }).lean();

        res.json({ success: true, data: companies });
    } catch (err) {
        next(err);
    }
}

module.exports = { listCompanies };
