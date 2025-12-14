// src/features/items/item-category/hooks/useItemCategories.js
import createUseResource from "src/services/useResourceFactory";
import itemCategoryApi from "../api/itemCategory.api";

const STORAGE_KEY = "munim_item_categories_v1_demo";

const useItemCategories = createUseResource(itemCategoryApi, STORAGE_KEY);
export default useItemCategories;
