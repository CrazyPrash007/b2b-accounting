// src/features/transactions/payment/api/payment.api.js
import resourceApiFactory from "src/services/resourceApiFactory";

const paymentApi = resourceApiFactory("/api/payments");

export default paymentApi;
