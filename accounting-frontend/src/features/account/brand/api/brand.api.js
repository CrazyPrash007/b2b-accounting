import resourceApiFactory from "src/services/resourceApiFactory";

const api = resourceApiFactory("/api/brand");

export const listBrands = api.list;
export const createBrand = api.create;
export const updateBrand = api.update;
export const deleteBrand = api.remove;
