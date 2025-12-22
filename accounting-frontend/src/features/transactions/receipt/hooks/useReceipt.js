// src/features/transactions/receipt/hooks/useReceipt.js
import createUseResource from "src/services/useResourceFactory";
import receiptApi from "../api/receipt.api";

const STORAGE_KEY = "munim_receipts_v1_demo";

const useReceipt = createUseResource(receiptApi, STORAGE_KEY);

export default useReceipt;
