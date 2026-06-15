// Admin inventory-received management — E2E coverage.
// Covers listing, store scoping, the New Entry dialog (create), search filtering,
// inline edit, and delete. Inventory is store-scoped via product.storeId.
describe("Admin inventory", () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAs({ email: "admin@example.com", isAdmin: true });
  });

  // Seed an inventory-received entry directly via the API (no test endpoint
  // exists for inventory; the POST route only needs an existing product).
  const seedInventory = (data: {
    productId: number;
    quantity: number;
    receivedDate: string;
    receiptUrl?: string;
  }) =>
    cy.request({
      method: "POST",
      url: "/api/inventory",
      headers: { "Content-Type": "application/json" },
      body: data,
    });

  it("lists inventory entries for the active store", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestProduct({ storeId: store.id, name: "Carrots" }).then((p) => {
        seedInventory({ productId: p.id, quantity: 50, receivedDate: "2026-01-10" });
      });
      cy.createTestProduct({ storeId: store.id, name: "Spinach" }).then((p) => {
        seedInventory({ productId: p.id, quantity: 30, receivedDate: "2026-02-15" });
      });
    });

    cy.visit("/admin/inventory");

    cy.contains("Inventory Received").should("be.visible");
    cy.contains("Carrots").should("be.visible");
    cy.contains("Spinach").should("be.visible");
    cy.contains("td", "50").should("be.visible");
    cy.contains("td", "30").should("be.visible");
  });

  it("shows the empty state when there are no entries", () => {
    cy.createTestStore("Main Store");

    cy.visit("/admin/inventory");

    cy.contains("No inventory entries available").should("be.visible");
  });

  it("creates a new inventory entry via the dialog", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestProduct({ storeId: store.id, name: "Tomatoes" });
    });

    cy.visit("/admin/inventory");
    cy.contains("button", "+ New Entry").click();

    cy.contains("New Inventory Entry").should("be.visible");
    // Scope to the dialog's Product field — the Navbar also renders a <select>.
    cy.contains("label", "Product").parent().find("select").select("Tomatoes");
    cy.contains("label", "Quantity").parent().find('input').type("75");
    cy.contains("label", "Received Date")
      .parent()
      .find('input[type="date"]')
      .type("2026-03-01");
    cy.contains("button", "Save").click();

    // Dialog closes and the new entry appears in the table.
    cy.contains("New Inventory Entry").should("not.exist");
    cy.contains("Tomatoes").should("be.visible");
    cy.contains("td", "75").should("be.visible");
  });

  it("filters entries by product name via search", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestProduct({ storeId: store.id, name: "Apples" }).then((p) => {
        seedInventory({ productId: p.id, quantity: 12, receivedDate: "2026-01-05" });
      });
      cy.createTestProduct({ storeId: store.id, name: "Bananas" }).then((p) => {
        seedInventory({ productId: p.id, quantity: 24, receivedDate: "2026-01-06" });
      });
    });

    cy.visit("/admin/inventory");
    cy.contains("Apples").should("be.visible");
    cy.contains("Bananas").should("be.visible");

    cy.get('input[placeholder="Search by product name or date..."]').type("Apple");

    cy.contains("Apples").should("be.visible");
    cy.contains("Bananas").should("not.exist");
  });

  it("edits an entry's quantity inline", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestProduct({ storeId: store.id, name: "Lettuce" }).then((p) => {
        seedInventory({ productId: p.id, quantity: 40, receivedDate: "2026-01-20" });
      });
    });

    cy.visit("/admin/inventory");
    cy.contains("td", "40").should("be.visible");

    cy.contains("button", "Edit").click();
    cy.get('input[type="number"]').clear().type("99");
    cy.contains("button", "Save").click();

    cy.contains("td", "99").should("be.visible");
    cy.contains("td", "40").should("not.exist");
  });

  it("deletes an entry", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestProduct({ storeId: store.id, name: "Onions" }).then((p) => {
        seedInventory({ productId: p.id, quantity: 60, receivedDate: "2026-01-25" });
      });
    });

    // handleDelete blocks on window.confirm("Are you sure?"). Stub it at load
    // time so the native dialog never appears and the click proceeds.
    cy.visit("/admin/inventory", {
      onBeforeLoad(win) {
        cy.stub(win, "confirm").returns(true);
      },
    });
    cy.contains("Onions").should("be.visible");

    cy.contains("button", "Delete").click();

    cy.contains("Onions").should("not.exist");
    cy.contains("No inventory entries available").should("be.visible");
  });
});
