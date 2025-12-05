// src/features/transactions/payment/api/payment.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

// resource path (plural)
const api = resourceApiFactory("/api/payments");

export const listPayments = api.list;
export const createPayment = api.create;
export const updatePayment = api.update;
export const deletePayment = api.remove;
