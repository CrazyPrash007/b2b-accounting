import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/gst.api";

const STORAGE_KEY = "munim_gst_v1_demo";

const gstApi = {
    list: api.listGsts,
    create: api.createGst,
    update: api.updateGst,
    remove: api.deleteGst,
};

const useGst = createUseResource(gstApi, STORAGE_KEY);

export default useGst;
