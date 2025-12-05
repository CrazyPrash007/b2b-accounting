// src/features/items/unit/api/item.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

const api = resourceApiFactory("/api/items");

export const listItems = api.list;
export const createItem = api.create;
export const updateItem = api.update;
export const deleteItem = api.remove;
