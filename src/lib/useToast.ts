"use client";

import { useContext } from "react";
import { ToastContext } from "./ToastContext";
import { ToastType } from "./toast";

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    success: (message: string, duration?: number) =>
      context.addToast(message, "success", duration),
    error: (message: string, duration?: number) =>
      context.addToast(message, "error", duration),
    warning: (message: string, duration?: number) =>
      context.addToast(message, "warning", duration),
    info: (message: string, duration?: number) =>
      context.addToast(message, "info", duration),
    toast: (message: string, type: ToastType, duration?: number) =>
      context.addToast(message, type, duration),
    removeToast: context.removeToast,
    clearToasts: context.clearToasts,
  };
}
