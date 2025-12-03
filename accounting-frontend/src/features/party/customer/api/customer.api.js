// src/features/customers/customer/api/customer.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

// resource path (plural)
const api = resourceApiFactory("/api/customers");

export const listCustomers = api.list;
export const createCustomer = api.create;
export const updateCustomer = api.update;
export const deleteCustomer = api.remove;
