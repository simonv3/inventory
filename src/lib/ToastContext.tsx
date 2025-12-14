"use client";

import React, { createContext, useCallback, useState } from "react";
import {
  Toast,
  ToastContextType,
  ToastType,
  generateToastId,
  DEFAULT_TOAST_DURATION,
} from "./toast";

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = generateToastId();
      const finalDuration = duration ?? DEFAULT_TOAST_DURATION[type];

      setToasts((prev) => [
        ...prev,
        { id, message, type, duration: finalDuration },
      ]);

      // Auto-remove toast after duration
      if (finalDuration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, finalDuration);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts }}
    >
      {children}
    </ToastContext.Provider>
  );
}
