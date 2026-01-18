# Cypress E2E Testing Setup

This project uses Cypress for end-to-end testing with a fresh database for each test run.

## Setup

Cypress is already installed. No additional setup needed.

## Running Tests

### Open Cypress Test Runner (Interactive)

```bash
npm run cypress:open
```

This opens the Cypress Test Runner UI where you can:

- View all test files
- Run individual tests
- Watch tests in real-time
- Debug test failures

### Run All Tests Headless

```bash
npm run test:e2e
```

Or with Cypress directly:

```bash
npx cypress run
```

## Test Structure

### Test Helper API Endpoints

Before each test, the database is reset using helper endpoints that are **only available in development**:

- `POST /api/test/reset` - Clears all data from the database
- `POST /api/test/customers` - Creates a test customer
- `POST /api/test/stores` - Creates a test store

### Custom Cypress Commands

Available commands in tests:

```typescript
// Database management
cy.resetDatabase();

// Customer creation
cy.createTestCustomer({
  email: "test@example.com",
  name: "Test User",
  isAdmin: false,
});

// Store creation
cy.createTestStore("Test Store");

// Authentication flows
cy.login(email, password);
cy.requestOtp(email);
cy.verifyOtp(otp);
cy.logout();
```

## Writing Tests

Tests are located in `cypress/e2e/` directory.

Example test structure:

```typescript
describe("Feature Name", () => {
  beforeEach(() => {
    // Reset database before each test
    cy.resetDatabase();
  });

  it("should do something", () => {
    // Setup test data
    cy.createTestCustomer({ email: "test@example.com" });

    // Perform actions
    cy.visit("/customer/login");
    cy.get('input[type="email"]').type("test@example.com");

    // Assert results
    cy.url().should("include", "/customer/portal");
  });
});
```

## Key Test Files

- `cypress/e2e/auth.cy.ts` - Authentication and login flow tests
- `cypress/support/commands.ts` - Custom Cypress commands
- `cypress/support/e2e.ts` - Global test setup

## Database

Tests use the same database as your development environment. Before each test, all data is cleared via the reset endpoint, ensuring a clean state.

**Important**: Test endpoints are only available in `development` or `test` environments. They will return 403 in production.

## Debugging

### View test logs

```bash
npm run cypress:run -- --spec "cypress/e2e/auth.cy.ts"
```

### Debug mode

Open Cypress and pause tests using `cy.pause()` in your test code.

### Check for errors

Look at the browser console in the Cypress runner for JavaScript errors or network request failures.

## CI/CD Integration

To run tests in CI/CD pipeline:

```bash
# Start the Next.js server in background
npm run dev &
sleep 5  # Wait for server to start

# Run tests
npm run test:e2e

# Stop the server
kill %1
```
