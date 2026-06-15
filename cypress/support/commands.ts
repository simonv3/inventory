// Cypress support file - loads before each test

// Authenticate by forging the unsigned base64 `customerToken` cookie.
// The app's token is plain base64 JSON { customerId, email, timestamp } and
// middleware only checks for the cookie's presence, so this skips the OTP flow.
// Use this for any test that needs to be behind login.
Cypress.Commands.add(
  "loginAs",
  (data: { email: string; name?: string; isAdmin?: boolean }) => {
    cy.createTestCustomer(data).then((customer) => {
      const token = btoa(
        JSON.stringify({
          customerId: customer.id,
          email: customer.email,
          timestamp: Date.now(),
        }),
      );
      cy.setCookie("customerToken", token);
    });
  },
);

// Drive the real OTP UI: enter email and request a code.
// Only use when testing the login flow itself; otherwise prefer cy.loginAs.
Cypress.Commands.add("requestOtp", (email: string) => {
  cy.visit("/customer/login");
  cy.get('input[type="email"]').type(email);
  cy.get('button:contains("Send Code")').click();
  cy.contains(/OTP sent|check your email/i).should("be.visible");
});

Cypress.Commands.add("verifyOtp", (otp: string) => {
  cy.get('input[type="text"][placeholder="000000"]').type(otp);
  cy.get('button:contains("Verify & Sign In")').click();
});

Cypress.Commands.add("logout", () => {
  cy.get("button:contains('Logout')").click();
  cy.url().should("eq", Cypress.config("baseUrl") + "/");
});

// Reset database before each test
Cypress.Commands.add("resetDatabase", () => {
  cy.request({
    method: "POST",
    url: "/api/test/reset",
    headers: {
      "Content-Type": "application/json",
    },
    failOnStatusCode: false,
  }).then((response) => {
    cy.log("Database reset status: " + response.status);
    expect(response.status).to.eq(200);
  });
});

// Create a test customer
Cypress.Commands.add(
  "createTestCustomer",
  (data: { email: string; name?: string; isAdmin?: boolean }) => {
    cy.log("Creating test customer with data: " + JSON.stringify(data));
    cy.request({
      method: "POST",
      url: "/api/test/customers",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
      failOnStatusCode: false,
    }).then((response) => {
      cy.log("Created test customer:" + JSON.stringify(response.body));
      cy.log("Response status: " + response.status);
      expect(response.status).to.eq(201);
      return cy.wrap(response.body);
    });
  },
);

// Create a test store
Cypress.Commands.add("createTestStore", (name: string) => {
  cy.request({
    method: "POST",
    url: "/api/test/stores",
    headers: {
      "Content-Type": "application/json",
    },
    body: { name },
    failOnStatusCode: false,
  }).then((response) => {
    cy.log("Created test store, status: " + response.status);
    expect(response.status).to.eq(201);
    return cy.wrap(response.body);
  });
});

// Create a test product for a store. Products are store-scoped, so storeId is required.
Cypress.Commands.add(
  "createTestProduct",
  (data: {
    storeId: number;
    name: string;
    sku?: string;
    pricePerUnit?: number;
    unitOfMeasurement?: string;
    minimumStock?: number;
    showInStorefront?: boolean;
    isOrganic?: boolean;
  }) => {
    cy.request({
      method: "POST",
      url: "/api/test/products",
      headers: { "Content-Type": "application/json" },
      body: data,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(201);
      return cy.wrap(response.body);
    });
  },
);

// Link a customer to a store with a markup percent. Required for a customer to
// appear in a store's storefront cart and for their order markup to resolve.
Cypress.Commands.add(
  "linkCustomerToStore",
  (data: {
    customerId: number;
    storeId: number;
    markupPercent?: number;
    storeManager?: boolean;
  }) => {
    cy.request({
      method: "POST",
      url: "/api/test/customer-stores",
      headers: { "Content-Type": "application/json" },
      body: data,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(201);
      return cy.wrap(response.body);
    });
  },
);

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(data: {
        email: string;
        name?: string;
        isAdmin?: boolean;
      }): Chainable<void>;
      requestOtp(email: string): Chainable<void>;
      verifyOtp(otp: string): Chainable<void>;
      logout(): Chainable<void>;
      resetDatabase(): Chainable<void>;
      createTestCustomer(data: {
        email: string;
        name?: string;
        isAdmin?: boolean;
      }): Chainable<any>;
      createTestStore(name: string): Chainable<any>;
      createTestProduct(data: {
        storeId: number;
        name: string;
        sku?: string;
        pricePerUnit?: number;
        unitOfMeasurement?: string;
        minimumStock?: number;
        showInStorefront?: boolean;
        isOrganic?: boolean;
      }): Chainable<any>;
      linkCustomerToStore(data: {
        customerId: number;
        storeId: number;
        markupPercent?: number;
        storeManager?: boolean;
      }): Chainable<any>;
    }
  }
}

export {};
