import apiClient from "src/services/apiClient";
import createResourceApi from "src/services/resourceApiFactory";

const baseApi = createResourceApi("/api/expense");

const expenseApi = {
    ...baseApi,

    // override CREATE → multipart/form-data
    create: async (formData) => {
        const res = await apiClient.post("/api/expense", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res?.data?.data;
    },

    // override UPDATE → multipart/form-data
    update: async (id, formData) => {
        const res = await apiClient.put(`/api/expense/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res?.data?.data;
    },
};

export default expenseApi;
