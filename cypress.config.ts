import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3001",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    // Disable video recording for faster tests
    video: false,
    // Ensure tests wait for network requests
    requestTimeout: 10000,
  },
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
