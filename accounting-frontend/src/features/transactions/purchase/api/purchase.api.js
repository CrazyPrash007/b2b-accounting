// src/features/items/unit/api/purchase.api.js
import resourceApiFactory from "src/services/resourceApiFactory";
import apiClient from "src/services/apiClient";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const purchaseApi = resourceApiFactory("/api/purchases");

// Fetch PDF blob for preview/download
purchaseApi.getPdfBlob = async (id) => {
    const company = getCurrentCompany();
    const response = await apiClient.get(`/api/purchases/${id}/pdf`, {
        params: { accountCompanyName: company._id },
        responseType: 'blob'
    });
    return new Blob([response.data], { type: 'application/pdf' });
};

export default purchaseApi;
