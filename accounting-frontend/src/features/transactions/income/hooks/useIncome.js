import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/income.api";

const STORAGE_KEY = "munim_income_v1_demo";

const incomeApi = {
    list: api.listIncomes,
    create: api.createIncome,
    update: api.updateIncome,
    remove: api.deleteIncome,
};

const useIncome = createUseResource(incomeApi, STORAGE_KEY);

export default useIncome;
