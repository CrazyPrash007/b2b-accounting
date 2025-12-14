import createUseResource from "src/services/useResourceFactory";
import brandApi from "../api/brand.api";

const STORAGE_KEY = "munim_brands_v1_demo";

const useBrand = createUseResource(brandApi, STORAGE_KEY);

export default useBrand;
