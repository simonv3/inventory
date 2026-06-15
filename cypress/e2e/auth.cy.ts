// Auth — core happy paths and access control.
// Covers REQUIREMENTS.md FR-2.* (OTP login) and FR-3.1/3.2 (route protection).
describe("Authentication", () => {
  beforeEach(() => {
    cy.resetDatabase();
  });

  it("shows the customer login form", () => {
    cy.visit("/customer/login");
    cy.contains("Customer Login").should("be.visible");
    cy.get('input[type="email"]').should("exist");
  });

  it("requests an OTP for a known email and advances to the code step (FR-2.1)", () => {
    cy.createTestCustomer({ email: "member@example.com", name: "Member" });

    cy.visit("/customer/login");
    cy.get('input[type="email"]').type("member@example.com");
    cy.contains("button", "Send Code").click();

    // The form swaps to the 6-digit code step.
    cy.get('input[placeholder="000000"]').should("be.visible");
    cy.contains("button", "Verify & Sign In").should("be.visible");
  });

  it("shows an error for an unknown email once customers exist (FR-2.5)", () => {
    // Seed a customer first so the first-customer bootstrap path does NOT fire
    // (with zero customers, any email is auto-provisioned as admin instead).
    cy.createTestCustomer({ email: "owner@example.com", isAdmin: true });

    cy.visit("/customer/login");
    cy.get('input[type="email"]').type("nobody@example.com");
    cy.contains("button", "Send Code").click();

    cy.contains(/not found/i).should("be.visible");
  });

  it("does not advance with an invalid email format", () => {
    cy.visit("/customer/login");
    cy.get('input[type="email"]').type("not-an-email");
    cy.contains("button", "Send Code").click();

    // HTML5 validation blocks the submit, so we stay on the email step.
    cy.get('input[placeholder="000000"]').should("not.exist");
  });

  it("lets an admin reach the dashboard via a session cookie (FR-3.2)", () => {
    cy.loginAs({ email: "admin@example.com", isAdmin: true });
    cy.createTestStore("Main Store");

    cy.visit("/admin");
    cy.contains("Admin Dashboard").should("be.visible");
  });

  it("redirects unauthenticated visitors away from the admin area (FR-3.1)", () => {
    cy.visit("/admin");
    cy.url().should("eq", Cypress.config("baseUrl") + "/");
  });
});
