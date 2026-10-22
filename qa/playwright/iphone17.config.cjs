const { defineConfig, devices } = require('@playwright/test');
const base = require('./playwright.config.cjs');

// Separate, explicitly invoked check; does not expand the regular browser matrix.
module.exports = defineConfig({
  ...base,
  testMatch: 'iphone17.spec.js',
  // The test owns an ephemeral server so it can stop it for the cache fallback.
  webServer: undefined,
  fullyParallel: false,
  workers: 1,
  projects: [{
    name: 'iphone-17-pro',
    use: { ...devices['iPhone 17 Pro'], browserName: 'webkit', serviceWorkers: 'allow' },
  }],
});
