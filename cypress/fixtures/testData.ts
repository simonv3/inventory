// Test data fixtures

export const testUsers = {
  admin: {
    email: "admin@example.com",
    name: "Admin User",
    isAdmin: true,
  },
  storeManager: {
    email: "manager@example.com",
    name: "Store Manager",
    isAdmin: false,
  },
  regularCustomer: {
    email: "customer@example.com",
    name: "Regular Customer",
    isAdmin: false,
  },
};

export const testStores = {
  store1: {
    name: "Main Store",
  },
  store2: {
    name: "Secondary Store",
  },
};

export const testData = {
  users: testUsers,
  stores: testStores,
};
