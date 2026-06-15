// Admin sales management — E2E coverage.
// Covers listing, store scoping, the New Sale dialog (create), search filtering,
// editing markup via the dialog, and delete.
//
// A sale is store-scoped through its items' products (GET /api/sales filters by
// items.some.product.storeId) AND its customer must be linked to the active store
// — the customer dropdown and the row/search both resolve names from
// /api/customers?storeId=, which only returns store-linked customers. So every
// seeded sale needs: a store, a store-linked customer, and a product in that store.
describe("Admin sales", () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAs({ email: "admin@example.com", isAdmin: true });
  });

  // Seed a sale directly via the API. The POST route only needs an existing
  // customer and product(s); totals are computed server-side from markup.
  const seedSale = (data: {
    customerId: number;
    items: { productId: number; quantity: number }[];
    markupPercent: number;
  }) =>
    cy.request({
      method: "POST",
      url: "/api/sales",
      headers: { "Content-Type": "application/json" },
      body: data,
    });

  // Create a store with one store-linked customer and one product, then yield
  // their ids for seeding sales.
  const setupStore = (opts?: {
    customerName?: string;
    customerEmail?: string;
    productName?: string;
    pricePerUnit?: number;
  }) => {
    const {
      customerName = "Alice Buyer",
      customerEmail = "alice@example.com",
      productName = "Tomatoes",
      pricePerUnit = 10,
    } = opts || {};
    return cy.createTestStore("Main Store").then((store) =>
      cy
        .createTestCustomer({ name: customerName, email: customerEmail })
        .then((customer) => {
          cy.linkCustomerToStore({ customerId: customer.id, storeId: store.id });
          return cy
            .createTestProduct({ storeId: store.id, name: productName, pricePerUnit })
            .then((product) => ({
              storeId: store.id as number,
              customerId: customer.id as number,
              productId: product.id as number,
            }));
        }),
    );
  };

  it("lists sales for the active store", () => {
    setupStore().then(({ customerId, productId }) => {
      seedSale({
        customerId,
        items: [{ productId, quantity: 3 }],
        markupPercent: 20,
      });
    });

    cy.visit("/admin/sales");

    cy.contains("Sales").should("be.visible");
    cy.contains("Alice Buyer").should("be.visible");
    cy.contains("Tomatoes x3").should("be.visible");
    // pricePerUnit 10 x3 = 30 cost; +20% markup = 36 price.
    cy.contains("td", "$30.00").should("be.visible");
    cy.contains("td", "$36.00").should("be.visible");
    cy.contains("td", "20%").should("be.visible");
  });

  it("shows the empty state when there are no sales", () => {
    cy.createTestStore("Main Store");

    cy.visit("/admin/sales");

    cy.contains("No sales available").should("be.visible");
  });

  it("creates a new sale via the dialog", () => {
    setupStore({ customerName: "Bob Buyer", productName: "Carrots", pricePerUnit: 5 });

    cy.visit("/admin/sales");
    cy.contains("button", "+ New Sale").click();

    // Scope to the dialog title <h2> — "+ New Sale" button also contains "New Sale".
    cy.contains("h2", "New Sale").should("be.visible");
    // The dialog opens with markup defaulted to 20 and one empty item row.
    cy.contains("label", "Customer").parent().find("select").select("Bob Buyer");
    cy.contains("label", "Product").parent().find("select").select("Carrots");
    cy.contains("label", "Quantity").parent().find("input").type("4");
    cy.contains("button", "Save").click();

    // Dialog closes and the new sale appears in the table.
    cy.contains("h2", "New Sale").should("not.exist");
    cy.contains("Bob Buyer").should("be.visible");
    cy.contains("Carrots x4").should("be.visible");
    // 5 x4 = 20 cost; +20% = 24 price.
    cy.contains("td", "$20.00").should("be.visible");
    cy.contains("td", "$24.00").should("be.visible");
  });

  it("filters sales by customer name via search", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestProduct({ storeId: store.id, name: "Apples", pricePerUnit: 2 }).then(
        (product) => {
          cy.createTestCustomer({ name: "Carol", email: "carol@example.com" }).then(
            (c) => {
              cy.linkCustomerToStore({ customerId: c.id, storeId: store.id });
              seedSale({
                customerId: c.id,
                items: [{ productId: product.id, quantity: 1 }],
                markupPercent: 10,
              });
            },
          );
          cy.createTestCustomer({ name: "Dave", email: "dave@example.com" }).then(
            (d) => {
              cy.linkCustomerToStore({ customerId: d.id, storeId: store.id });
              seedSale({
                customerId: d.id,
                items: [{ productId: product.id, quantity: 1 }],
                markupPercent: 10,
              });
            },
          );
        },
      );
    });

    cy.visit("/admin/sales");
    cy.contains("Carol").should("be.visible");
    cy.contains("Dave").should("be.visible");

    cy.get('input[placeholder="Search by customer name, email, or date..."]').type(
      "Carol",
    );

    cy.contains("Carol").should("be.visible");
    cy.contains("Dave").should("not.exist");
  });

  it("edits a sale's markup via the dialog", () => {
    setupStore({ customerName: "Erin Buyer", pricePerUnit: 10 }).then(
      ({ customerId, productId }) => {
        seedSale({
          customerId,
          items: [{ productId, quantity: 2 }],
          markupPercent: 20,
        });
      },
    );

    cy.visit("/admin/sales");
    cy.contains("td", "20%").should("be.visible");

    cy.contains("button", "Edit").click();
    cy.contains("h2", "Edit Sale").should("be.visible");
    cy.contains("label", "Markup %").parent().find("input").clear().type("50");
    cy.contains("button", "Save").click();

    cy.contains("h2", "Edit Sale").should("not.exist");
    cy.contains("td", "50%").should("be.visible");
    cy.contains("td", "20%").should("not.exist");
  });

  it("deletes a sale", () => {
    setupStore({ customerName: "Frank Buyer" }).then(({ customerId, productId }) => {
      seedSale({
        customerId,
        items: [{ productId, quantity: 1 }],
        markupPercent: 20,
      });
    });

    // handleDelete blocks on window.confirm("Are you sure?"). Stub it at load
    // time so the native dialog never appears and the click proceeds.
    cy.visit("/admin/sales", {
      onBeforeLoad(win) {
        cy.stub(win, "confirm").returns(true);
      },
    });
    cy.contains("Frank Buyer").should("be.visible");

    cy.contains("button", "Delete").click();

    cy.contains("Frank Buyer").should("not.exist");
    cy.contains("No sales available").should("be.visible");
  });
});
