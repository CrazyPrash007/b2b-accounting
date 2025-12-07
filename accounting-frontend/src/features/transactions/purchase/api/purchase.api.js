// src/features/items/unit/api/purchase.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

const api = resourceApiFactory("/api/purchases");

export const listPurchases = api.list;
export const createPurchase = api.create;
export const updatePurchase = api.update;
export const deletePurchase = api.remove;
