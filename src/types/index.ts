// Types for the inventory app
export interface CustomerType {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerStore {
  id: number;
  customerId: number;
  storeId: number;
  customer?: Customer;
  store?: Store;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  customerTypeId?: number;
  customerType?: CustomerType;
  stores?: CustomerStore[];
  markupPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  isOrganic: boolean;
  showInStorefront: boolean;
  unitOfMeasurement: string;
  pricePerUnit: number;
  minimumStock: number;
  sourceId?: number;
  storeId: number;
  sku: string;
  source?: Source;
  store?: Store;
  categories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryReceived {
  id: number;
  productId: number;
  quantity: number;
  receivedDate: string;
  receiptUrl: string | null;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  costPrice: number;
  salePrice: number;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: number;
  customerId: number;
  saleDate: string;
  totalCost: number;
  totalPrice: number;
  markupPercent: number;
  customer?: Customer;
  items?: SaleItem[];
  createdAt: string;
  updatedAt: string;
}
