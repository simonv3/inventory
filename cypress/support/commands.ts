// Cypress support file - loads before each test

// Custom commands
Cypress.Commands.add("login", (email: string, password?: string) => {
  cy.visit("/customer/login");
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password || "123456");
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/customer/portal");
});

Cypress.Commands.add("requestOtp", (email: string) => {
  cy.visit("/customer/login");
  cy.get('input[type="email"]').type(email);
  cy.get('button:contains("Request OTP")').click();
  cy.contains("OTP sent to your email").should("be.visible");
});

Cypress.Commands.add("verifyOtp", (otp: string) => {
  cy.get('input[type="text"][placeholder*="OTP"]').type(otp);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add("logout", () => {
  cy.get("button:contains('Logout')").click();
  cy.url().should("eq", Cypress.env("baseUrl") + "/");
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

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password?: string): Chainable<void>;
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
    }
  }
}

export {};
