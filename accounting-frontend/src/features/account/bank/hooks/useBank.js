import createResourceHook from "src/services/useResourceFactory";
import bankApi from "src/features/account/bank/api/bank.api";

const useBank = createResourceHook(bankApi);

export default useBank;
