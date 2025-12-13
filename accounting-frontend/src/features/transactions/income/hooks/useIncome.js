import createResourceHook from "src/services/useResourceFactory";
import incomeApi from "src/features/transactions/income/api/income.api";

const useIncome = createResourceHook(incomeApi);

export default useIncome;

