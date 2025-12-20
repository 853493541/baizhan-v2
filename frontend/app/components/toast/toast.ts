import { toast } from "react-hot-toast";

/**
 * Success toast
 */
export const toastSuccess = (message: string) => {
  toast.success(message);
};

/**
 * Error toast
 */
export const toastError = (message: string) => {
  toast.error(message);
};

/**
 * Info / neutral toast (optional)
 */
export const toastInfo = (message: string) => {
  toast(message);
};
