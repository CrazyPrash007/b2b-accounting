// src/features/items/unit/api/sale.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

const api = resourceApiFactory("/api/sales");

export const listSales = api.list;
export const createSale = api.create;
export const updateSale = api.update;
export const deleteSale = api.remove;
