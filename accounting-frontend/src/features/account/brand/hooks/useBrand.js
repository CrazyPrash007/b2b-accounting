// src/features/account/brand/hooks/useBrand.js
import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/brand.api";

const STORAGE_KEY = "munim_brands_v1_demo";

const brandApi = {
    list: api.listBrands,
    create: api.createBrand,
    update: api.updateBrand,
    remove: api.deleteBrand,
};

const useBrand = createUseResource(brandApi, STORAGE_KEY);

export default useBrand;
