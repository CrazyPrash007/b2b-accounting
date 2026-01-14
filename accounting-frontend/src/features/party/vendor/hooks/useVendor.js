// src/features/party/vendor/hooks/useVendor.js
import createUseResource from "src/services/useResourceFactory";
import vendorApi from "../api/vendor.api";

const STORAGE_KEY = "munim_vendors_v1_demo";

const useVendor = createUseResource(vendorApi, STORAGE_KEY);

export default useVendor;
