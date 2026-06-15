// Storefront ordering — the public cart flow at /[storeId]/cart.
// Covers REQUIREMENTS.md FR-3.4 (public, no auth), FR-6.1/6.2/6.5/6.7.
describe("Storefront ordering", () => {
  let storeId: number;

  beforeEach(() => {
    cy.resetDatabase();

    cy.createTestStore("Corner Grocery").then((store) => {
      storeId = store.id;

      cy.createTestCustomer({ email: "alice@example.com", name: "Alice" }).then(
        (customer) => {
          // Alice belongs to this store with a 10% markup.
          cy.linkCustomerToStore({
            customerId: customer.id,
            storeId,
            markupPercent: 10,
          });
        },
      );

      cy.createTestProduct({
        storeId,
        name: "Tomatoes",
        pricePerUnit: 2.0,
        unitOfMeasurement: "each",
        showInStorefront: true,
      });
    });
  });

  it("places an order without authentication and shows a payment link (FR-3.4, FR-6.7)", () => {
    cy.visit(`/${storeId}/cart`);
    cy.contains("Shopping Cart").should("be.visible");
    cy.contains("Corner Grocery").should("be.visible");

    // Pick the customer from the autocomplete.
    cy.get('input[placeholder="Search by name or email..."]').type("Alice");
    cy.contains("button", "Alice").click();

    // FR-6.5: markup auto-fills from the customer's per-store setting.
    cy.get("input[readonly]").should("have.value", "10");

    // Add a line item: 3 × Tomatoes.
    cy.get("select").select("Tomatoes");
    cy.get('input[placeholder="lb"]').type("3");

    cy.contains("button", "Place Order").click();

    // Order confirmation with an external payment link.
    cy.contains("Order Confirmed!").should("be.visible");
    cy.contains("Order ID:").should("be.visible");
    cy.contains("a", "Go to Payment")
      .should("have.attr", "href")
      .and("include", "amount=");
  });

  it("shows an Invalid Store message for a non-numeric store segment", () => {
    cy.visit("/not-a-number/cart");
    cy.contains("Invalid Store").should("be.visible");
  });
});
