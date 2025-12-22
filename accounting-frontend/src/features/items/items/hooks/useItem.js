import createUseResource from "src/services/useResourceFactory";
import itemApi from "../api/item.api";

const STORAGE_KEY = "munim_item_v1_demo";

const useItem = createUseResource(itemApi, STORAGE_KEY);

export default useItem;
