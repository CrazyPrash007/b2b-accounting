// src/features/transactions/payment/api/payment.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
import apiClient from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const paymentApi = resourceApiFactory("/api/payments");

// Fetch PDF blob for preview/download
paymentApi.getPdfBlob = async (id) => {
    const company = getCurrentCompany();
    const response = await apiClient.get(`/api/payments/${id}/pdf`, {
        params: { accountCompanyName: company._id },
        responseType: 'blob'
    });
    return new Blob([response.data], { type: 'application/pdf' });
};

export default paymentApi;
