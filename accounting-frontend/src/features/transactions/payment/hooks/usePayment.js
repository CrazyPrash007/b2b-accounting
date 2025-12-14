// src/features/transactions/payment/hooks/usePayment.js
import createUseResource from "src/services/useResourceFactory";
import paymentApi from "../api/payment.api";

const STORAGE_KEY = "munim_payments_v1_demo";

const usePayment = createUseResource(paymentApi, STORAGE_KEY);

export default usePayment;
