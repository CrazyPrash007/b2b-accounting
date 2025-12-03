import resourceApiFactory from "src/services/resourceApiFactory";

const api = resourceApiFactory("/api/bank");

export const listBanks = api.list;
export const createBank = api.create;
export const updateBank = api.update;
export const deleteBank = api.remove;
