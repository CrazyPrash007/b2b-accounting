import createUseResource from "src/services/useResourceFactory";
import saleApi from "../api/sale.api";

const STORAGE_KEY = "munim_sale_v1_demo";

const useSale = createUseResource(saleApi, STORAGE_KEY);

export default useSale;
