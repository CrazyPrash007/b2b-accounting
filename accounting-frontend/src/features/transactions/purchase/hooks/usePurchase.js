import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/purchase.api";

const STORAGE_KEY = "munim_purchase_v1_demo";

const purchaseApi = {
    list: api.listPurchases,
    create: api.createPurchase,
    update: api.updatePurchase,
    remove: api.deletePurchase,
};

const usePurchase = createUseResource(purchaseApi, STORAGE_KEY);

export default usePurchase;
