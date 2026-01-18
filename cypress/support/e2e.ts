// Import commands
import "./commands";

// Disable uncaught exception handling for Next.js
Cypress.on("uncaught:exception", (err, runnable) => {
  // Ignore specific errors that are expected
  if (
    err.message.includes("ResizeObserver") ||
    err.message.includes("SecurityError")
  ) {
    return false;
  }
  return true;
});
