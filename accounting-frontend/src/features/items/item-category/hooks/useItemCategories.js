// src/features/items/item-category/hooks/useItemCategories.js
import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/itemCategory.api";

const STORAGE_KEY = "munim_item_categories_v1_demo";

const itemCategoryApi = {
    list: api.listItemCategories,
    create: api.createItemCategory,
    update: api.updateItemCategory,
    remove: api.deleteItemCategory,
};

const useItemCategories = createUseResource(itemCategoryApi, STORAGE_KEY);
export default useItemCategories;
