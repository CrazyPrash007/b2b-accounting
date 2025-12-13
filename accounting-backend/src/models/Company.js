// src/models/Company.js
const { getChatStarterConnection } = require("../db/mongo");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const CompanySchema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
        gst: { type: String, default: null },
        registrationType: { type: String, default: "unregistered" },
        companyName: { type: String, required: true },
        businessType: { type: String, default: "" },
        industryType: { type: String, default: "" },
        establishedFrom: { type: Date },
        address1: { type: String, default: "" },
        address2: { type: String, default: "" },
        country: { type: String, default: "" },
        pincode: { type: String, default: "" },
        state: { type: String, default: "" },
        city: { type: String, default: "" },
        mobile: { type: String, default: "" },
        email: { type: String, default: "" }
    },
    { timestamps: true }
);

CompanySchema.index({ owner: 1, companyName: 1 }, { unique: true });

/**
 * IMPORTANT FIX:
 * Instead of exporting the model directly, we export a FUNCTION
 * that returns the model ONLY when requested.
 */
function getCompanyModel() {
    const conn = getChatStarterConnection(); // guaranteed initialized AFTER index.js runs connectChatStarter()
    if (!conn) {
        throw new Error("❌ chatStarterConnection not initialized yet.");
    }
    return conn.models.Company || conn.model("Company", CompanySchema);
}

module.exports = {
    getCompanyModel
};
