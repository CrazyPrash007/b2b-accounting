import apiClient from "src/services/apiClient";
import resourceApiFactory from "src/services/resourceApiFactory";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const baseApi = resourceApiFactory("/api/expense");

const expenseApi = {
    ...baseApi,

    // override CREATE → multipart/form-data
    create: async (formData, accountCompanyName) => {
        // Get company from parameter or from global context
        const companyId = accountCompanyName || getCurrentCompany();
        
        // If formData is a FormData object, append accountCompanyName
        if (formData instanceof FormData) {
            formData.append("accountCompanyName", companyId);
        } else {
            // If it's a plain object, add the property
            formData.accountCompanyName = companyId;
        }
        
        const res = await apiClient.post("/api/expense", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res?.data?.data;
    },

    // override UPDATE → multipart/form-data
    update: async (id, formData, accountCompanyName) => {
        // Get company from parameter or from global context
        const companyId = accountCompanyName || getCurrentCompany();
        
        // If formData is a FormData object, append accountCompanyName
        if (formData instanceof FormData) {
            formData.append("accountCompanyName", companyId);
        } else {
            // If it's a plain object, add the property
            formData.accountCompanyName = companyId;
        }
        
        const res = await apiClient.put(`/api/expense/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res?.data?.data;
    },
};

export default expenseApi;
