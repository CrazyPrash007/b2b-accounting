// src/features/customers/customer/api/vendor.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

// resource path (plural)
const api = resourceApiFactory("/api/vendors");

export const listVendors = api.list;
export const createVendor = api.create;
export const updateVendor = api.update;
export const deleteVendor = api.remove;
