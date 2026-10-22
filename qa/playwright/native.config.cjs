const { defineConfig, devices } = require('@playwright/test');
const base = require('./playwright.config.cjs');
module.exports = defineConfig({
  ...base, testMatch: 'native.spec.js', webServer: undefined,
  fullyParallel: false, workers: 1,
  projects: [{ name: 'iphone-native', use: { ...devices['iPhone 17 Pro'], browserName: 'webkit', serviceWorkers: 'block' } }],
});
