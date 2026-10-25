const { defineConfig, devices } = require('@playwright/test');
const base = require('./playwright.config.cjs');
module.exports = defineConfig({
  ...base,
  testMatch: 'integrity.spec.js',
  webServer: undefined,
  workers: 1,
  projects: [{ name: 'integrity-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } }],
});
