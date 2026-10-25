const { defineConfig } = require('@playwright/test');
const base = require('./playwright.config.cjs');
module.exports = defineConfig({...base, testMatch:'pdf.spec.js', outputDir:__dirname+'/pdf-results'});
