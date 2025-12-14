// src/features/transactions/payment/api/payment.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
import apiClient from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const paymentApi = resourceApiFactory("/api/payments");

// Add PDF download function
paymentApi.downloadPDF = async (id) => {
    const company = getCurrentCompany();
    const response = await apiClient.get(`/api/payments/${id}/pdf`, {
        params: { accountCompanyName: company._id },
        responseType: 'blob'
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Payment_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export default paymentApi;
