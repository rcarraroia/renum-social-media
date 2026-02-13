import { toast } from "sonner";

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

// Accept both string and number because sonner may return either type for toast ids
export const dismissToast = (toastId?: string | number) => {
  toast.dismiss(toastId as any);
};