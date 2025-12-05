// src/features/transactions/receipt/hooks/useReceipt.js
import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/receipt.api";

const STORAGE_KEY = "munim_receipts_v1_demo";

const receiptApi = {
    list: api.listReceipts,
    create: api.createReceipt,
    update: api.updateReceipt,
    remove: api.deleteReceipt,
};

const useReceipt = createUseResource(receiptApi, STORAGE_KEY);

export default useReceipt;
