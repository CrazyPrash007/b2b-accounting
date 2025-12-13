import createResourceHook from "src/services/useResourceFactory";
import customerApi from "src/features/party/customer/api/customer.api";

const useCustomer = createResourceHook(customerApi);

export default useCustomer;
