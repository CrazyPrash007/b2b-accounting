// src/features/items/unit/hooks/useUnit.js
import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/unit.api";

const STORAGE_KEY = "munim_units_v1_demo";

// createUseResource expects an api object with methods: list, create, update, remove
// our unit.api exports functions listUnits/createUnit/updateUnit/deleteUnit
// so map them to the expected names.
const unitApi = {
    list: api.listUnits,
    create: api.createUnit,
    update: api.updateUnit,
    remove: api.deleteUnit,
};

const useUnit = createUseResource(unitApi, STORAGE_KEY);

export default useUnit;
