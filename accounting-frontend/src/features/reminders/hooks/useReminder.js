// src/features/reminders/hooks/useReminder.js
import createUseResource from "src/services/useResourceFactory";
import reminderApi from "../api/reminder.api";

const useReminder = createUseResource(reminderApi);

export default useReminder;
