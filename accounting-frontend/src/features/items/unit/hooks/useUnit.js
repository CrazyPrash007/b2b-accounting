import createResourceHook from "src/services/useResourceFactory";
import unitApi from "src/features/items/unit/api/unit.api";

const useUnit = createResourceHook(unitApi);

export default useUnit;
