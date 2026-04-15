const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: [
      "src/**/*.int.test.js",
      "src/**/*.http.test.js"  // HTTP tests run with MySQL
    ],
    // opcional: integration tests suelen tardar más
    testTimeout: 20000,
    hookTimeout: 20000,
    // Ejecutar tests secuencialmente para evitar race conditions con DB compartida
    fileParallelism: false,
    maxConcurrency: 1,
  },
});
