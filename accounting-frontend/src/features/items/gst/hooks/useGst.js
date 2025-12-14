import createUseResource from "src/services/useResourceFactory";
import gstApi from "../api/gst.api";

const STORAGE_KEY = "munim_gst_v1_demo";

const useGst = createUseResource(gstApi, STORAGE_KEY);

export default useGst;
