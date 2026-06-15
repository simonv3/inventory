// Admin product management — smoke coverage.
// Covers REQUIREMENTS.md FR-4.1 (read) and FR-4.2 (create dialog), store-scoped (FR-4.4).
describe("Admin products", () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAs({ email: "admin@example.com", isAdmin: true });
  });

  it("lists products for the active store (FR-4.4)", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestProduct({ storeId: store.id, name: "Carrots" });
      cy.createTestProduct({ storeId: store.id, name: "Spinach" });
    });

    cy.visit("/admin/products");

    // StoreContext defaults to the first (only) store, so both products load.
    cy.contains("Carrots").should("be.visible");
    cy.contains("Spinach").should("be.visible");
  });

  it("opens the New Product dialog (FR-4.2)", () => {
    cy.createTestStore("Main Store");

    cy.visit("/admin/products");
    cy.contains("button", "+ New Product").click();

    // The create dialog renders its form fields.
    cy.contains("New Product").should("be.visible");
    cy.contains("button", "Save").scrollIntoView().should("be.visible");
  });
});
