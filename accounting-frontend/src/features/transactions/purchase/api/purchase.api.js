// src/features/items/unit/api/purchase.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
import apiClient from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const purchaseApi = resourceApiFactory("/api/purchases");

// Add PDF download function
purchaseApi.downloadPDF = async (id) => {
    const company = getCurrentCompany();
    const response = await apiClient.get(`/api/purchases/${id}/pdf`, {
        params: { accountCompanyName: company._id },
        responseType: 'blob'
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PurchaseInvoice_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export default purchaseApi;
