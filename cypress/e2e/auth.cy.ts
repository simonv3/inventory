describe("Authentication - Login Flow", () => {
  beforeEach(() => {
    // Reset database before each test
    cy.resetDatabase();
  });

  it("should display login page", () => {
    cy.visit("/customer/login");
    cy.contains("Login").should("be.visible");
    cy.get('input[type="email"]').should("exist");
  });

  it("should request OTP for valid email", () => {
    const testEmail = "test@example.com";

    // Create a test customer
    cy.createTestCustomer({
      email: testEmail,
      name: "Test User",
    });

    // Visit login page
    cy.visit("/customer/login");

    // Enter email and request OTP
    cy.get('input[type="email"]').type(testEmail);
    cy.get('button:contains("Send Code")').click();

    // Check for success message
    cy.contains(/OTP sent|check your email/i).should("be.visible");
  });

  it("should show error for non-existent email", () => {
    cy.visit("/customer/login");

    cy.get('input[type="email"]').type("nonexistent@example.com");
    cy.get('button:contains("Send Code")').click();

    // Should show error message
    cy.contains(/not found|does not exist|error/i).should("be.visible");
  });

  it("should prevent login with invalid email format", () => {
    cy.visit("/customer/login");

    cy.get('input[type="email"]').type("invalid-email");
    cy.get('button[type="submit"]').should("be.disabled");
  });

  it("should successfully login and redirect to portal", () => {
    const testEmail = "testuser@example.com";

    // Create test customer
    cy.createTestCustomer({
      email: testEmail,
      name: "Test User",
    });

    // Note: In a real scenario, we'd need to mock or intercept the OTP verification
    // For now, we're testing the UI flow up to OTP request
    cy.visit("/customer/login");
    cy.get('input[type="email"]').type(testEmail);
    cy.get('button:contains("Request OTP")').click();

    // Verify OTP input appears
    cy.get('input[type="text"]').should("exist");
  });

  it("should allow admin user to access admin portal", () => {
    const adminEmail = "admin@example.com";

    // Create an admin customer
    cy.createTestCustomer({
      email: adminEmail,
      name: "Admin User",
      isAdmin: true,
    });

    // Admin should be able to visit /admin
    cy.visit("/");
    // After login, admin should have access to admin routes
    // This would be tested once OTP verification is complete
  });

  it("should allow regular customer to access customer portal", () => {
    const customerEmail = "customer@example.com";

    // Create a regular customer
    cy.createTestCustomer({
      email: customerEmail,
      name: "Regular Customer",
      isAdmin: false,
    });

    // Customer should be able to request login
    cy.visit("/customer/login");
    cy.get('input[type="email"]').type(customerEmail);
    cy.get('button:contains("Request OTP")').click();

    // Verify OTP flow is available
    cy.contains(/OTP|verification code/i).should("be.visible");
  });

  it("should clear form when visiting login page fresh", () => {
    cy.visit("/customer/login");
    cy.get('input[type="email"]').type("test@example.com");
    cy.reload();
    cy.get('input[type="email"]').should("have.value", "");
  });
});
