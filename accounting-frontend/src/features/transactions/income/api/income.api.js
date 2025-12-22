import apiClient from "src/services/apiClient";
import resourceApiFactory from "src/services/resourceApiFactory";
import { getCurrentCompany } from "src/services/companyContextAccessor";

const baseApi = resourceApiFactory("/api/income");

const incomeApi = {
    ...baseApi,

    // override create to use multipart
    create: async (formData, accountCompanyName) => {
        // Get company from parameter or from global context
        const companyId = accountCompanyName || getCurrentCompany();
        
        // If formData is a FormData object, delete existing and set accountCompanyName
        if (formData instanceof FormData) {
            formData.delete("accountCompanyName");
            formData.append("accountCompanyName", companyId);
        } else {
            // If it's a plain object, add the property
            formData.accountCompanyName = companyId;
        }
        
        const res = await apiClient.post("/api/income", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res?.data?.data;
    },

    // override update
    update: async (id, formData, accountCompanyName) => {
        // Get company from parameter or from global context
        const companyId = accountCompanyName || getCurrentCompany();
        
        // If formData is a FormData object, delete existing and set accountCompanyName
        if (formData instanceof FormData) {
            formData.delete("accountCompanyName");
            formData.append("accountCompanyName", companyId);
        } else {
            // If it's a plain object, add the property
            formData.accountCompanyName = companyId;
        }
        
        const res = await apiClient.put(`/api/income/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res?.data?.data;
    },
};

export default incomeApi;
