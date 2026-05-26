#!/usr/bin/env node
// ◊·κ GymOS Per-Gym Builder
// Usage:
//   node scripts/build-gym.js configs/rage-mma.json
//   KONOMI_PRIVATE_KEY=... node scripts/build-gym.js configs/rage-mma.json  (mints signed trial)
//
// Reads a per-gym config, patches the master template, writes clients/<slug>.html
// Each gym gets a unique prime so the fallmesh sees them as distinct nodes.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const MASTER = path.join(ROOT, 'index.html');
const CLIENTS_DIR = path.join(ROOT, 'clients');

// Open extension primes — pool to draw from per gym
// (master GymOS = 23; assigned per build, rotating + persisted in build-state.json)
const PRIME_POOL = [29, 41, 43, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 113, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229];
const STATE_FILE = path.join(ROOT, 'configs', '.build-state.json');

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) { return { assigned: {} }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

function nextPrime(state, slug) {
  if (state.assigned[slug]) return state.assigned[slug];
  const used = new Set(Object.values(state.assigned));
  for (const p of PRIME_POOL) if (!used.has(p)) { state.assigned[slug] = p; return p; }
  throw new Error('Prime pool exhausted — expand PRIME_POOL in build-gym.js');
}

// ─── Konomi signing (matches forge-lab/forge/licence.js) ─────
function canonicalJSON(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJSON).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJSON(obj[k])).join(',') + '}';
}
function loadPrivKey() {
  const raw = process.env.KONOMI_PRIVATE_KEY;
  if (!raw) return null;
  const seed = Buffer.from(raw, 'base64');
  if (seed.length !== 32) throw new Error('KONOMI_PRIVATE_KEY must be 32-byte base64');
  const prefix = Buffer.from('302e020100300506032b657004220420', 'hex');
  return crypto.createPrivateKey({ key: Buffer.concat([prefix, seed]), format: 'der', type: 'pkcs8' });
}
function mintTrial(toolId, toolPrime, days) {
  const privKey = loadPrivKey();
  if (!privKey) return null;
  const issued = new Date();
  const expires = new Date(issued.getTime() + (days || 30) * 24 * 60 * 60 * 1000);
  const payload = {
    v: 1,
    forge_id: 'fg_gym_' + crypto.randomBytes(6).toString('hex'),
    tool_id: toolId,
    tool_prime: toolPrime,
    tier: 'trial',
    features: ['core', 'mesh_inbound', 'onboarding_console'],
    issued: issued.toISOString(),
    expires: expires.toISOString(),
    issuer: 'konomi'
  };
  const sig = crypto.sign(null, Buffer.from(canonicalJSON(payload), 'utf8'), privKey);
  return Buffer.from(JSON.stringify({ payload, sig: sig.toString('base64') })).toString('base64');
}

// ─── Slug helper ─────────────────────────────────────────────
function slugify(s) { return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32); }

// ─── Main build ──────────────────────────────────────────────
function buildGym(configPath) {
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!cfg.gym_name) throw new Error('config missing gym_name');
  const slug = cfg.slug || slugify(cfg.gym_name);
  const state = loadState();
  const prime = cfg.prime || nextPrime(state, slug);
  if (!cfg.prime) saveState(state);

  let html = fs.readFileSync(MASTER, 'utf8');

  // 1) Title + meta description
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${cfg.gym_name} · GymOS</title>`);
  if (cfg.tagline) {
    html = html.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${esc(cfg.tagline)}">`)
              || html.replace('</head>', `<meta name="description" content="${esc(cfg.tagline)}">\n</head>`);
  }

  // 2) NODE override — patch the existing window.NODE assignment we injected earlier
  const nodeBlock = `
  window.NODE = {
    id: '${slug}',
    name: ${JSON.stringify(cfg.gym_name)},
    prime: ${prime},
    layers: 7,
    built: '${new Date().toISOString().slice(0,10)}',
    branded_by: 'gymos',
    master_prime: 23
  };`;
  html = html.replace(/window\.NODE = \{[\s\S]*?\};/, nodeBlock);

  // 3) Brand colour overrides — find :root CSS block and inject overrides
  if (cfg.brand) {
    const tokens = [];
    if (cfg.brand.primary)   tokens.push(`--gym-primary: ${cfg.brand.primary};`);
    if (cfg.brand.accent)    tokens.push(`--gym-accent: ${cfg.brand.accent};`);
    if (cfg.brand.text)      tokens.push(`--gym-text: ${cfg.brand.text};`);
    if (tokens.length) {
      const overrideCss = `\n/* per-gym brand override · ${cfg.gym_name} */\n:root { ${tokens.join(' ')} }\n`;
      html = html.replace('</style>', overrideCss + '</style>');
    }
  }

  // 4) Replace logo text (Gym + OS dot) with gym name (best-effort, falls back if structure changed)
  if (cfg.gym_logo_text) {
    html = html.replace(/<div class="app-nav-logo">Gym<span class="dot">OS<\/span><\/div>/,
      `<div class="app-nav-logo">${esc(cfg.gym_logo_text)}<span class="dot"> · gym-os</span></div>`);
  }

  // 4b) Landing page branding — hero + tagline + nav logo
  if (cfg.gym_name) {
    // Hero headline
    html = html.replace(
      /<h1>Your Gym Gets<br>a <span class="highlight">Full AI Team<\/span><\/h1>/,
      `<h1>${esc(cfg.gym_name)} Gets<br>a <span class="highlight">Full AI Team</span></h1>`
    );
    // Hero badge: Now in Pilot Programme → Branded Build
    html = html.replace(
      /<div class="hero-badge">◊ Now in Pilot Programme<\/div>/,
      `<div class="hero-badge">◊ ${esc(cfg.gym_name)} · Sovereign Build · Prime ${prime}</div>`
    );
    // Landing nav brand (different selector from app nav — find first occurrence with Gym + OS)
    html = html.replace(
      /<a href="#"[^>]*class="logo"[^>]*>[\s\S]*?<\/a>/,
      `<a href="#" class="logo"><strong>${esc(cfg.gym_name)}</strong> <span style="opacity:.6;font-weight:400">· gym-os</span></a>`
    );
  }

  // 5) Pre-seed client basics (so Onboarding console has gym info ready)
  if (cfg.gym_name || cfg.contact_email) {
    const seed = `
<script>
(function gymSeed(){
  function tryPrefill(){
    try {
      var existing = localStorage.getItem('gymos_onboarding_v1');
      if (existing) {
        var p = JSON.parse(existing);
        if (p.client && p.client.gym_name) return; // already set
      }
      var preset = {
        phase: 1,
        cards: {},
        client: {
          gym_name: ${JSON.stringify(cfg.gym_name || '')},
          contact_name: ${JSON.stringify(cfg.contact_name || '')},
          business_email: ${JSON.stringify(cfg.contact_email || '')},
          business_phone: ${JSON.stringify(cfg.contact_phone || '')},
          website: ${JSON.stringify(cfg.website || '')},
          start_date: ${JSON.stringify(cfg.start_date || '')}
        }
      };
      localStorage.setItem('gymos_onboarding_v1', JSON.stringify(preset));
    } catch(_){}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryPrefill, { once:true });
  else tryPrefill();
})();
</script>`;
    html = html.replace('</body>', seed + '\n</body>');
  }

  // 6) Trial licence — auto-activate on first boot if KONOMI_PRIVATE_KEY set
  const trialEnv = mintTrial(slug, prime, cfg.trial_days || 30);
  if (trialEnv) {
    const licenceSeed = `
<script>
(function preActivate(){
  function ap(){
    try {
      var k = 'konomi_licence_' + ${JSON.stringify(slug)};
      if (localStorage.getItem(k)) return;
      localStorage.setItem(k, ${JSON.stringify(trialEnv)});
    } catch(_){}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ap, { once:true });
  else ap();
})();
</script>`;
    html = html.replace('</body>', licenceSeed + '\n</body>');
  }

  // 7) Build manifest comment (top of file)
  const manifest = `<!--
  ◊·κ=1 · per-gym branded build
  gym_name:    ${cfg.gym_name}
  slug:        ${slug}
  prime:       ${prime}
  master:      sjgant80-hub/gymos (prime 23)
  built:       ${new Date().toISOString()}
  trial:       ${trialEnv ? 'signed (' + (cfg.trial_days||30) + ' days)' : 'unsigned · set KONOMI_PRIVATE_KEY to mint'}
-->\n`;
  html = manifest + html;

  // 8) Write
  if (!fs.existsSync(CLIENTS_DIR)) fs.mkdirSync(CLIENTS_DIR, { recursive: true });
  const outPath = path.join(CLIENTS_DIR, slug + '.html');
  fs.writeFileSync(outPath, html);

  return {
    slug, prime, gym_name: cfg.gym_name,
    out: outPath,
    size_kb: Math.round(html.length / 1024),
    trial_signed: !!trialEnv,
    url_pages: 'https://sjgant80-hub.github.io/gymos/clients/' + slug + '.html'
  };
}

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ─── CLI ─────────────────────────────────────────────────────
if (require.main === module) {
  const cfgPath = process.argv[2];
  if (!cfgPath) {
    console.error('Usage: node scripts/build-gym.js configs/<gym>.json');
    console.error('       KONOMI_PRIVATE_KEY=... node scripts/build-gym.js configs/<gym>.json   (signs trial)');
    process.exit(1);
  }
  try {
    const r = buildGym(path.resolve(cfgPath));
    console.log('◊·κ GYM BUILD');
    console.log('═'.repeat(60));
    console.log('gym:       ' + r.gym_name);
    console.log('slug:      ' + r.slug);
    console.log('prime:     ' + r.prime);
    console.log('size:      ' + r.size_kb + ' KB');
    console.log('trial:     ' + (r.trial_signed ? '✓ signed' : '✗ unsigned (set KONOMI_PRIVATE_KEY)'));
    console.log('output:    ' + r.out);
    console.log('live URL:  ' + r.url_pages);
    console.log('═'.repeat(60));
    console.log('Commit + push, then share the live URL with the gym.');
  } catch (e) {
    console.error('build failed:', e.message);
    process.exit(1);
  }
}

module.exports = { buildGym };
