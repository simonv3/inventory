// Toast types and utilities
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Generate unique IDs for toasts
export const generateToastId = () => `toast-${Date.now()}-${Math.random()}`;

// Default duration for each toast type (in milliseconds)
export const DEFAULT_TOAST_DURATION: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
};
