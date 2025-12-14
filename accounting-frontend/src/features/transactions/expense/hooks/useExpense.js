import createResourceHook from "src/services/useResourceFactory";
import expenseApi from "src/features/transactions/expense/api/expense.api";

const useExpense = createResourceHook(expenseApi);

export default useExpense;

