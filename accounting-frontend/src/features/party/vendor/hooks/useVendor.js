// src/features/customers/customer/hooks/useVendor.js
import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/vendor.api";

const STORAGE_KEY = "munim_customers_v1_demo";

const vendorApi = {
    list: api.listVendors,
    create: api.createVendor,
    update: api.updateVendor,
    remove: api.deleteVendor,
};

const useVendor = createUseResource(vendorApi, STORAGE_KEY);

export default useVendor;
