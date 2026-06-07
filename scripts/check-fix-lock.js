#!/usr/bin/env node
// scripts/check-fix-lock.js · run before every push
// fails loudly if any FIX-LOCK invariant has been clobbered
// exits 0 on clean, 1 on regression

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };
const exists = p => fs.existsSync(path.join(ROOT, p));

let failed = 0;
const check = (id, name, ok, detail) => {
  const tag = ok ? '✓' : '✗';
  console.log(`${tag} ${id} · ${name}${ok ? '' : '\n     ' + detail}`);
  if (!ok) failed++;
};

const master = read('index.html') || '';
const client = read('clients/gymops.html') || '';
const sales  = read('sales/gymops.html') || '';
const license = read('LICENSE') || '';

// F1 · multi-select on every step · count CALL SITES only (skip the function def)
const toggleCount = (master.match(/toggleConfigType\(\s*\d/g) || []).length;
const singleCount = (master.match(/selectConfig\(\s*\d/g) || []).length;
check('F1', 'multi-select on every client-selection step',
  toggleCount >= 19 && singleCount === 0,
  `toggleConfigType( call sites=${toggleCount} (need ≥19) · selectConfig( call sites=${singleCount} (need 0)`);

// F2 · audit-shim data-tool
check('F2', 'audit-shim data-tool="gymops" in client',
  /data-tool="gymops"/.test(client),
  'expected data-tool="gymops" in clients/gymops.html');

// F3 · badges hidden
check('F3', 'Konomi/KCC badges hidden in client',
  /#kcc-badge,#konomi-badge\{display:none/.test(client),
  'expected `#kcc-badge,#konomi-badge{display:none !important;}` in client CSS');

// F4 · window.scroll not scrollTo
const scrollToBugMaster = /window\.scrollTo\(0,\s*0\)/.test(master);
const scrollToBugClient = /window\.scrollTo\(0,\s*0\)/.test(client);
check('F4', 'window.scroll() not scrollTo() (regression-prone)',
  !scrollToBugMaster && !scrollToBugClient,
  `master has bad scrollTo: ${scrollToBugMaster} · client has bad scrollTo: ${scrollToBugClient}`);

// F5 · USD only · scan for £ followed by digit (visible pricing)
const gbpInMaster = (master.match(/£[0-9]/g) || []).length;
const gbpInSales  = (sales.match(/£[0-9]/g) || []).length;
const gbpInClient = (client.match(/£[0-9]/g) || []).length;
check('F5', 'USD pricing only · no GBP',
  gbpInMaster === 0 && gbpInSales === 0 && gbpInClient === 0,
  `£ hits → master:${gbpInMaster} sales:${gbpInSales} client:${gbpInClient}`);

// F6 · doctrine markers stripped from client RENDERED surface
// strip comments, <script>, <style> · doctrine in JS/CSS doesn't matter to a normal viewer
// what matters is the visible body text the gym owner sees
const clientVisible = client
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
const doctrineHits = (clientVisible.match(/κ=φ⁴|Konomi|Fall[A-Z][a-z]|◊·κ/g) || []).length;
check('F6', 'doctrine markers stripped from client rendered HTML',
  doctrineHits === 0,
  `doctrine markers found in rendered client HTML (excl. script/style/comments): ${doctrineHits}`);

// F7 · sales path
check('F7', 'sales landing at sales/gymops.html (not sales.html at root)',
  exists('sales/gymops.html') && !exists('sales.html'),
  `sales/gymops.html exists: ${exists('sales/gymops.html')} · sales.html (bad) exists: ${exists('sales.html')}`);

// F8 · MIT license
check('F8', 'MIT license preamble',
  /MIT License/i.test(license),
  'LICENSE missing "MIT License" header');

console.log('');
if (failed === 0) {
  console.log('◊ FIX-LOCK clean · safe to push');
  process.exit(0);
} else {
  console.log(`✗ FIX-LOCK · ${failed} invariant(s) regressed · DO NOT PUSH until fixed`);
  console.log('  see FIX-LOCK.md for the patch each invariant locks in');
  process.exit(1);
}
