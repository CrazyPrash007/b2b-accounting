import resourceApiFactory from "src/services/resourceApiFactory";

const api = resourceApiFactory("/api/gst");

export const listGsts = api.list;
export const createGst = api.create;
export const updateGst = api.update;
export const deleteGst = api.remove;
