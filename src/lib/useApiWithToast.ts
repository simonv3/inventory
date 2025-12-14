"use client";

import { useToast } from "./useToast";
import { parseApiError } from "./apiErrors";
import React from "react";

export function useApiWithToast() {
  const toast = useToast();

  const fetchData = React.useCallback(
    async <T>(
      url: string,
      options?: RequestInit,
      showSuccess = false,
      successMessage = "Operation successful"
    ): Promise<T | null> => {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorData: any = { error: `HTTP ${response.status}` };

          if (contentType?.includes("application/json")) {
            try {
              errorData = await response.json();
            } catch {
              // If JSON parsing fails, use default error
            }
          }

          const errorMessage = parseApiError(errorData);
          toast.error(errorMessage);
          return null;
        }

        const contentType = response.headers.get("content-type");
        let data: T;

        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }

        if (showSuccess) {
          toast.success(successMessage);
        }

        return data;
      } catch (error) {
        const errorMessage = parseApiError(error);
        toast.error(errorMessage);
        return null;
      }
    },
    [toast]
  );

  return {
    fetchData,
    toast,
  };
}
