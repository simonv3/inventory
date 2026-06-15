// Admin customers management — E2E coverage.
//
// Two surfaces share the CustomersManager component:
//   • Global page  /admin/customers              → storeId=null, AdminOnlyGuard
//   • Store page   /admin/stores/<id>/customers  → storeId=<id>, NOT guarded
//
// Store context changes what renders: the Markup % column and the
// Set Manager/Manager toggle only appear on the store-scoped page, and creating
// a customer only works there (POST /api/customers needs a store, which the form
// only sends via body when storeId is in context — fetchData adds no x-store-id).
//
// Auth is a forged base64 customerToken cookie; middleware only checks presence,
// AdminOnlyGuard enforces admin client-side.

// btoa-encode a customerToken for an already-created customer (cy.loginAs both
// creates AND logs in, which would 409 on a duplicate email — use this to log in
// as a customer that already exists, e.g. a seeded store manager).
const loginAsExisting = (customer: { id: number; email: string }) => {
  const token = btoa(
    JSON.stringify({
      customerId: customer.id,
      email: customer.email,
      timestamp: Date.now(),
    }),
  );
  cy.setCookie("customerToken", token);
};

describe("Admin customers — all-stores view", () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAs({ email: "admin@example.com", isAdmin: true });
  });

  it("lists customers from every store", () => {
    cy.createTestStore("Store A").then((a) => {
      cy.createTestCustomer({ name: "Alice", email: "alice@example.com" }).then(
        (al) => {
          cy.linkCustomerToStore({
            customerId: al.id,
            storeId: a.id,
            storeManager: true,
            markupPercent: 8,
          });
        },
      );
    });
    cy.createTestStore("Store B").then((b) => {
      cy.createTestCustomer({ name: "Bob", email: "bob@example.com" }).then((bo) => {
        cy.linkCustomerToStore({ customerId: bo.id, storeId: b.id, markupPercent: 6 });
      });
    });

    cy.visit("/admin/customers");

    cy.contains("Customers").should("be.visible");
    cy.contains("td", "Alice").should("be.visible");
    cy.contains("td", "Bob").should("be.visible");
    // Stores column shows each customer's store membership.
    cy.contains("td", "Store A").should("be.visible");
    cy.contains("td", "Store B").should("be.visible");
    // No store in context → Markup column is "—" for everyone.
    cy.contains("th", "Markup %").should("be.visible");
  });

  it("filters customers by name via search", () => {
    cy.createTestStore("Store A").then((a) => {
      cy.createTestCustomer({ name: "Alice", email: "alice@example.com" }).then((al) =>
        cy.linkCustomerToStore({ customerId: al.id, storeId: a.id }),
      );
      cy.createTestCustomer({ name: "Bob", email: "bob@example.com" }).then((bo) =>
        cy.linkCustomerToStore({ customerId: bo.id, storeId: a.id }),
      );
    });

    cy.visit("/admin/customers");
    cy.contains("td", "Alice").should("be.visible");
    cy.contains("td", "Bob").should("be.visible");

    cy.get('input[placeholder="Search by name or email..."]').type("Alice");

    cy.contains("td", "Alice").should("be.visible");
    cy.contains("td", "Bob").should("not.exist");
  });

  it("renames a customer inline", () => {
    cy.createTestStore("Store A").then((a) => {
      cy.createTestCustomer({ name: "Alice", email: "alice@example.com" }).then((al) =>
        cy.linkCustomerToStore({ customerId: al.id, storeId: a.id }),
      );
    });

    cy.visit("/admin/customers");

    // Enter edit mode for Alice's row, then operate within <tbody> — only the row
    // being edited has a text input there (the search box is outside the table).
    cy.contains("td", "Alice").parent("tr").contains("button", "Edit").click();
    cy.get("tbody").find('input[type="text"]').clear().type("Zoe");
    cy.get("tbody").contains("button", "Save").click();

    cy.contains("td", "Zoe").should("be.visible");
    cy.contains("td", "Alice").should("not.exist");
  });

  it("adds a store association via the Stores dialog", () => {
    cy.createTestStore("Store B"); // exists, Alice not yet a member
    cy.createTestStore("Store A").then((a) => {
      cy.createTestCustomer({ name: "Alice", email: "alice@example.com" }).then((al) =>
        cy.linkCustomerToStore({ customerId: al.id, storeId: a.id }),
      );
    });

    cy.visit("/admin/customers");
    cy.contains("td", "Alice").parent("tr").contains("button", "Stores").click();

    cy.contains("h2", "Manage Stores for Alice").should("be.visible");
    cy.contains("label", "Store B").find('input[type="checkbox"]').check();
    cy.contains("button", "Save").click();

    cy.contains("h2", "Manage Stores").should("not.exist");
    cy.contains("td", "Alice")
      .parent("tr")
      .within(() => {
        cy.contains("Store A").should("exist");
        cy.contains("Store B").should("exist");
      });
  });

  it("removes a store association via the Stores dialog", () => {
    cy.createTestStore("Store A").then((a) => {
      cy.createTestStore("Store B").then((b) => {
        cy.createTestCustomer({ name: "Alice", email: "alice@example.com" }).then(
          (al) => {
            cy.linkCustomerToStore({ customerId: al.id, storeId: a.id });
            cy.linkCustomerToStore({ customerId: al.id, storeId: b.id });
          },
        );
      });
    });

    cy.visit("/admin/customers");
    cy.contains("td", "Alice").parent("tr").contains("button", "Stores").click();

    cy.contains("h2", "Manage Stores for Alice").should("be.visible");
    cy.contains("label", "Store B").find('input[type="checkbox"]').uncheck();
    cy.contains("button", "Save").click();

    cy.contains("h2", "Manage Stores").should("not.exist");
    cy.contains("td", "Alice")
      .parent("tr")
      .within(() => {
        cy.contains("Store A").should("exist");
        cy.contains("Store B").should("not.exist");
      });
  });

  it("navigates to filtered sales when the email is clicked", () => {
    cy.createTestStore("Store A").then((a) => {
      cy.createTestCustomer({ name: "Alice", email: "alice@example.com" }).then((al) =>
        cy.linkCustomerToStore({ customerId: al.id, storeId: a.id }),
      );
    });

    cy.visit("/admin/customers");
    cy.contains("button", "alice@example.com").click();

    cy.url().should("include", "/admin/sales?customerId=");
  });

  it("deletes a customer", () => {
    cy.createTestStore("Store A").then((a) => {
      cy.createTestCustomer({ name: "Alice", email: "alice@example.com" }).then((al) =>
        cy.linkCustomerToStore({ customerId: al.id, storeId: a.id }),
      );
    });

    // handleDelete blocks on window.confirm("Are you sure?"). Stub at load time.
    cy.visit("/admin/customers", {
      onBeforeLoad(win) {
        cy.stub(win, "confirm").returns(true);
      },
    });
    cy.contains("td", "Alice").should("be.visible");

    cy.contains("td", "Alice").parent("tr").contains("button", "Delete").click();

    cy.contains("td", "Alice").should("not.exist");
  });

  it("bulk-deletes selected customers", () => {
    cy.createTestStore("Store A").then((a) => {
      cy.createTestCustomer({ name: "Alice", email: "alice@example.com" }).then((al) =>
        cy.linkCustomerToStore({ customerId: al.id, storeId: a.id }),
      );
    });

    // bulkDelete also goes through window.confirm.
    cy.visit("/admin/customers", {
      onBeforeLoad(win) {
        cy.stub(win, "confirm").returns(true);
      },
    });

    cy.contains("td", "Alice")
      .parent("tr")
      .find('input[type="checkbox"]')
      .check();
    cy.contains("button", "Delete Selected").click();

    cy.contains("td", "Alice").should("not.exist");
  });

  it("redirects a non-admin away from the all-customers page", () => {
    // Overwrite the admin cookie with a plain (non-admin) customer.
    cy.loginAs({ email: "viewer@example.com" });

    cy.visit("/admin/customers");

    // AdminOnlyGuard bounces to "/", which then forwards a logged-in non-admin
    // to their portal — either way they never see the admin customers page.
    cy.url().should("not.include", "/admin/customers");
    cy.url().should("include", "/customer/portal");
  });
});

describe("Store-scoped customers & store managers", () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAs({ email: "admin@example.com", isAdmin: true });
  });

  it("shows the empty state when no customers belong to the store", () => {
    // The admin is not linked to this store, so the store roster is empty.
    cy.createTestStore("Main Store").then((store) => {
      cy.visit(`/admin/stores/${store.id}/customers`);
    });

    cy.contains("No customers available").should("be.visible");
  });

  it("lists only the store's customers with their per-store markup", () => {
    cy.createTestStore("Other Store").then((other) => {
      cy.createTestCustomer({ name: "Outsider", email: "out@example.com" }).then((o) =>
        cy.linkCustomerToStore({ customerId: o.id, storeId: other.id }),
      );
    });
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestCustomer({ name: "Member Meg", email: "meg@example.com" }).then((m) => {
        cy.linkCustomerToStore({
          customerId: m.id,
          storeId: store.id,
          markupPercent: 8,
        });
      });
      cy.visit(`/admin/stores/${store.id}/customers`);
    });

    cy.contains("td", "Member Meg").should("be.visible");
    cy.contains("td", "8").should("be.visible"); // per-store markup
    cy.contains("td", "Outsider").should("not.exist"); // belongs to another store
  });

  it("creates a customer scoped to the store", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.visit(`/admin/stores/${store.id}/customers`);
    });

    cy.contains("button", "+ New Customer").click();

    // "+ New Customer" button also contains "New Customer" — scope to the title.
    cy.contains("h2", "New Customer").should("be.visible");
    cy.get('input[name="name"]').type("Grace");
    cy.get('input[name="email"]').type("grace@example.com");
    cy.contains("button", "Save").click();

    cy.contains("h2", "New Customer").should("not.exist");
    cy.contains("td", "Grace").should("be.visible");
  });

  it("promotes a customer to store manager", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestCustomer({ name: "Member Meg", email: "meg@example.com" }).then((m) => {
        cy.linkCustomerToStore({
          customerId: m.id,
          storeId: store.id,
          storeManager: false,
        });
      });
      cy.visit(`/admin/stores/${store.id}/customers`);
    });

    cy.contains("button", "Set Manager").should("be.visible").click();

    // After toggling, the label becomes exactly "Manager" (not "Set Manager").
    cy.contains("button", /^Manager$/).should("be.visible");
    cy.contains("button", "Set Manager").should("not.exist");
  });

  it("edits a customer's per-store markup inline", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestCustomer({ name: "Member Meg", email: "meg@example.com" }).then((m) => {
        cy.linkCustomerToStore({
          customerId: m.id,
          storeId: store.id,
          markupPercent: 5,
        });
      });
      cy.visit(`/admin/stores/${store.id}/customers`);
    });

    cy.contains("td", "5").should("be.visible");

    cy.contains("button", "Edit").click();
    // The only number input in <tbody> is the markup field for the edited row.
    cy.get("tbody").find('input[type="number"]').clear().type("12");
    cy.get("tbody").contains("button", "Save").click();

    cy.contains("td", "12").should("be.visible");
  });

  it("lets a non-admin store manager view the store roster without admin powers", () => {
    cy.createTestStore("Main Store").then((store) => {
      cy.createTestCustomer({ name: "Manager Mae", email: "mae@example.com" }).then(
        (mae) => {
          cy.linkCustomerToStore({
            customerId: mae.id,
            storeId: store.id,
            storeManager: true,
          });
          cy.createTestCustomer({ name: "Regular Rita", email: "rita@example.com" }).then(
            (rita) => {
              cy.linkCustomerToStore({ customerId: rita.id, storeId: store.id });
            },
          );
          // Log in AS the (non-admin) store manager.
          loginAsExisting(mae);
          cy.visit(`/admin/stores/${store.id}/customers`);
        },
      );
    });

    cy.contains("Customers").should("be.visible");
    cy.contains("td", "Manager Mae").should("be.visible");
    cy.contains("td", "Regular Rita").should("be.visible");
    // Admin-only affordances are hidden for a store manager.
    cy.contains("button", "Login As").should("not.exist");
    cy.contains("View All Customers").should("not.exist");
  });
});
