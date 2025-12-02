// src/features/items/unit/api/unit.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

const api = resourceApiFactory("/api/unit");

export const listUnits = api.list;
export const createUnit = api.create;
export const updateUnit = api.update;
export const deleteUnit = api.remove;
