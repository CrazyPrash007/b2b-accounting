// src/features/transactions/receipt/api/receipt.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
import apiClient from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const receiptApi = resourceApiFactory("/api/receipts");

// Fetch PDF blob for preview/download
receiptApi.getPdfBlob = async (id) => {
    const company = getCurrentCompany();
    const response = await apiClient.get(`/api/receipts/${id}/pdf`, {
        params: { accountCompanyName: company._id },
        responseType: 'blob'
    });
    return new Blob([response.data], { type: 'application/pdf' });
};

export default receiptApi;
