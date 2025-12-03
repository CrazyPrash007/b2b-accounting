// src/features/customers/customer/hooks/useCustomer.js
import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/customer.api";

const STORAGE_KEY = "munim_customers_v1_demo";

const customerApi = {
    list: api.listCustomers,
    create: api.createCustomer,
    update: api.updateCustomer,
    remove: api.deleteCustomer,
};

const useCustomer = createUseResource(customerApi, STORAGE_KEY);

export default useCustomer;
