import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/sale.api";

const STORAGE_KEY = "munim_sale_v1_demo";

const saleApi = {
    list: api.listSales,
    create: api.createSale,
    update: api.updateSale,
    remove: api.deleteSale,
};

const useSale = createUseResource(saleApi, STORAGE_KEY);

export default useSale;
