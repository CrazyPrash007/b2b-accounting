import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/item.api";

const STORAGE_KEY = "munim_item_v1_demo";

const itemApi = {
    list: api.listItems,
    create: api.createItem,
    update: api.updateItem,
    remove: api.deleteItem,
};

const useItem = createUseResource(itemApi, STORAGE_KEY);

export default useItem;
