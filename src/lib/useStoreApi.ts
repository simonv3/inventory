"use client";

import { useStore } from "@/context/StoreContext";

export function useStoreApi() {
  const { currentStoreId } = useStore();

  const fetchWithStore = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (currentStoreId) {
      headers.set("x-store-id", currentStoreId.toString());
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  return { fetchWithStore, currentStoreId };
}

export default useStore;
