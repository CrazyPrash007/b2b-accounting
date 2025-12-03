// src/features/items/unit/hooks/useBank.js
import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/bank.api";

const STORAGE_KEY = "munim_banks_v1_demo";

// createUseResource expects an api object with methods: list, create, update, remove
// our unit.api exports functions listUnits/createUnit/updateUnit/deleteUnit
// so map them to the expected names.
const bankApi = {
    list: api.listBanks,
    create: api.createBank,
    update: api.updateBank,
    remove: api.deleteBank,
};

const useBank = createUseResource(bankApi, STORAGE_KEY);

export default useBank;
