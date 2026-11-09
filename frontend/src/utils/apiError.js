import { toast } from "react-toastify";

export const notifyApiError = (error, fallback) => {
  if (error?.isAuthExpired) return;
  toast.error(error?.response?.data?.message || fallback);
};
