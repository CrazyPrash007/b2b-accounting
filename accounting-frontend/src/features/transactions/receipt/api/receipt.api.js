// src/features/transactions/receipt/api/receipt.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

// resource path (plural)
const api = resourceApiFactory("/api/receipts");

export const listReceipts = api.list;
export const createReceipt = api.create;
export const updateReceipt = api.update;
export const deleteReceipt = api.remove;
