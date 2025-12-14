import createUseResource from "src/services/useResourceFactory";
import purchaseApi from "../api/purchase.api";

const STORAGE_KEY = "munim_purchase_v1_demo";

const usePurchase = createUseResource(purchaseApi, STORAGE_KEY);

export default usePurchase;
