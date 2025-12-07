import createUseResource from "src/services/useResourceFactory";
import * as api from "../api/expense.api";

const STORAGE_KEY = "munim_expense_v1_demo";

const expenseApi = {
    list: api.listExpenses,
    create: api.createExpense,
    update: api.updateExpense,
    remove: api.deleteExpense,
};

const useExpense = createUseResource(expenseApi, STORAGE_KEY);

export default useExpense;
