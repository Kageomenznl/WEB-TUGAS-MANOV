const fs = require('node:fs');
const path = require('node:path');

const apiBaseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, '');
if (!apiBaseUrl) {
    throw new Error('Set API_BASE_URL in Netlify to the public HTTPS URL of the Flask API.');
}

let parsedUrl;
try {
    parsedUrl = new URL(apiBaseUrl);
} catch {
    throw new Error('API_BASE_URL must be a valid public HTTPS URL.');
}

if (parsedUrl.protocol !== 'https:' || parsedUrl.pathname !== '/' || parsedUrl.search || parsedUrl.hash) {
    throw new Error('API_BASE_URL must be the HTTPS origin only, e.g. https://monitor-energi-api.onrender.com.');
}

const target = path.join(__dirname, '..', 'frontend', 'assets', 'config.js');
fs.writeFileSync(
    target,
    `window.MONITOR_CONFIG = Object.freeze({ apiBaseUrl: ${JSON.stringify(apiBaseUrl)} });\n`,
    'utf8'
);
console.log(`Configured dashboard API: ${apiBaseUrl}`);
