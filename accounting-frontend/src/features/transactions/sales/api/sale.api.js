// src/features/items/unit/api/sale.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
import apiClient from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const saleApi = resourceApiFactory("/api/sales");

// Fetch PDF blob for preview/download
saleApi.getPdfBlob = async (id) => {
    const company = getCurrentCompany();
    const response = await apiClient.get(`/api/sales/${id}/pdf`, {
        params: { accountCompanyName: company._id },
        responseType: 'blob'
    });
    return new Blob([response.data], { type: 'application/pdf' });
};

export default saleApi;
