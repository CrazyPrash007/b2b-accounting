import apiClient from "src/services/apiClient";
import createResourceApi from "src/services/resourceApiFactory";

const baseApi = createResourceApi("/api/income");

const incomeApi = {
    ...baseApi,

    // override create to use multipart
    create: async (formData) => {
        const res = await apiClient.post("/api/income", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res?.data?.data;
    },

    // override update
    update: async (id, formData) => {
        const res = await apiClient.put(`/api/income/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res?.data?.data;
    },
};

export default incomeApi;
