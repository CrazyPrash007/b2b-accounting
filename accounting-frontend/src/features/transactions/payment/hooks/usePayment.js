// src/features/transactions/payment/hooks/usePayment.js
import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/payment.api";

const STORAGE_KEY = "munim_payments_v1_demo";

const paymentApi = {
    list: api.listPayments,
    create: api.createPayment,
    update: api.updatePayment,
    remove: api.deletePayment,
};

const usePayment = createUseResource(paymentApi, STORAGE_KEY);

export default usePayment;
