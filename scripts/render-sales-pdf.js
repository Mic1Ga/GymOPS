#!/usr/bin/env node
// scripts/render-sales-pdf.js · regenerate sales/<slug>.pdf from sales/<slug>.html
// keeps the downloadable PDF in sync with the live landing
// run after every sales-landing edit · run before every push

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const slug = process.argv[2] || 'gymops';
const htmlPath = path.join(ROOT, 'sales', `${slug}.html`);
const pdfPath  = path.join(ROOT, 'sales', `${slug}.pdf`);

if (!fs.existsSync(htmlPath)) {
  console.error(`sales/${slug}.html not found`);
  process.exit(1);
}

// find a chromium-class binary
const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const browser = candidates.find(p => fs.existsSync(p));
if (!browser) {
  console.error('no Chrome/Edge/Chromium found · install one or set $BROWSER');
  process.exit(1);
}

// windows file:/// URI
const fileUri = 'file:///' + htmlPath.replace(/\\/g, '/');

const cmd = `"${browser}" --headless --disable-gpu --no-margins --print-to-pdf-no-header --print-to-pdf="${pdfPath}" "${fileUri}"`;

try {
  execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] });
  const kb = Math.round(fs.statSync(pdfPath).size / 1024);
  console.log(`◊ sales/${slug}.pdf · ${kb}KB · rendered from sales/${slug}.html`);
} catch (e) {
  // Chrome writes the PDF then exits weirdly on Windows · check the file exists
  if (fs.existsSync(pdfPath)) {
    const kb = Math.round(fs.statSync(pdfPath).size / 1024);
    console.log(`◊ sales/${slug}.pdf · ${kb}KB · rendered (Chrome exit was noisy but PDF wrote)`);
  } else {
    console.error('render failed:', e.message);
    process.exit(1);
  }
}
