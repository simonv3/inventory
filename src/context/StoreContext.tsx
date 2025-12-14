"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface StoreContextType {
  currentStoreId: number | null;
  setCurrentStoreId: (storeId: number) => void;
  stores: Array<{ id: number; name: string }>;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [stores, setStores] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch("/api/stores", {
          credentials: "include",
        });
        if (response.ok) {
          const storesData = await response.json();
          setStores(storesData);
          
          // Set first store as default
          if (storesData.length > 0) {
            const savedStoreId = localStorage.getItem("currentStoreId");
            const storeId = savedStoreId 
              ? parseInt(savedStoreId) 
              : storesData[0].id;
            setCurrentStoreId(storeId);
          }
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleSetCurrentStoreId = (storeId: number) => {
    setCurrentStoreId(storeId);
    localStorage.setItem("currentStoreId", storeId.toString());
  };

  return (
    <StoreContext.Provider
      value={{
        currentStoreId,
        setCurrentStoreId: handleSetCurrentStoreId,
        stores,
        loading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
