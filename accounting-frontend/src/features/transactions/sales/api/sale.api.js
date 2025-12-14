// src/features/items/unit/api/sale.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
import apiClient from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const saleApi = resourceApiFactory("/api/sales");

// Add PDF download function
saleApi.downloadPDF = async (id) => {
    const company = getCurrentCompany();
    const response = await apiClient.get(`/api/sales/${id}/pdf`, {
        params: { accountCompanyName: company._id },
        responseType: 'blob'
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SalesInvoice_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export default saleApi;
