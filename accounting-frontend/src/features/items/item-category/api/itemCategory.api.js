// src/features/items/item-category/api/itemCategory.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

// create an API for /api/item-categories
const api = resourceApiFactory("/api/item-categories");

export const listItemCategories = api.list;
export const createItemCategory = api.create;
export const updateItemCategory = api.update;
export const deleteItemCategory = api.remove;
