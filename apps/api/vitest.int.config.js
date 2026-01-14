const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.int.test.js"],
    // opcional: integration tests suelen tardar más
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
