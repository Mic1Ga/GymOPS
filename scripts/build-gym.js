#!/usr/bin/env node
// ◊·κ GymOS Per-Gym Builder
// Usage:
//   node scripts/build-gym.js configs/gymops.json
//   KONOMI_PRIVATE_KEY=... node scripts/build-gym.js configs/gymops.json  (mints signed trial)
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
  // The product subtext ("gym-os" by default) can be overridden via cfg.product_subtext or hidden
  if (cfg.gym_logo_text) {
    var subtext = cfg.product_subtext !== undefined ? cfg.product_subtext : 'gym-os';
    var subHtml = subtext ? `<span class="dot"> · ${esc(subtext)}</span>` : '';
    html = html.replace(/<div class="app-nav-logo">Gym<span class="dot">OS<\/span><\/div>/,
      `<div class="app-nav-logo">${esc(cfg.gym_logo_text)}${subHtml}</div>`);
  }

  // 4a) Product name override — replace "GymOS" mentions in hero/labels with cfg.product_name if set
  if (cfg.product_name) {
    html = html.replace(/\bGymOS\b/g, cfg.product_name);
  }

  // 4c) Hide Konomi/KCC badges for this gym (shims still run silently in the code)
  // Set `konomi_visible: false` to hide. Reversible — flip flag, rebuild, badges return.
  if (cfg.konomi_visible === false) {
    var hideCss = `\n/* gym build: hide Konomi/KCC badges (shims still run for future re-enable) */\n#kcc-badge,#konomi-badge{display:none !important;}\n`;
    html = html.replace('</style>', hideCss + '</style>');
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
    // Landing nav: <div class="nav-logo">Gym<span class="dot">OS</span></div>
    var navText = cfg.gym_logo_text || cfg.gym_name;
    var navSub = cfg.product_subtext !== undefined ? cfg.product_subtext : 'OS';
    var navSubHtml = navSub ? `<span class="dot">${esc(navSub)}</span>` : '';
    html = html.replace(
      /<div class="nav-logo">Gym<span class="dot">OS<\/span><\/div>/,
      `<div class="nav-logo">${esc(navText)}${navSubHtml}</div>`
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

  // 5b) Pre-seed connection-fields data — every key the agency already knows
  // (public socials, known IDs, etc.) gets baked in. Secrets stay blank for the gym to fill.
  const preConn = {};
  function pre(key, val) { if (val !== undefined && val !== null && val !== '') preConn[key] = val; }
  if (cfg.socials) {
    pre('social_instagram',     cfg.socials.instagram);
    pre('social_facebook',      cfg.socials.facebook);
    pre('social_tiktok',        cfg.socials.tiktok);
    pre('social_youtube',       cfg.socials.youtube);
    pre('social_linkedin',      cfg.socials.linkedin);
    pre('social_x',             cfg.socials.x);
    pre('social_whatsapp_link', cfg.socials.whatsapp_link);
    pre('social_maps',          cfg.socials.maps);
    pre('social_spotify',       cfg.socials.spotify);
  }
  if (cfg.crm)       { pre('crm_provider',     cfg.crm.provider);     pre('crm_location_id', cfg.crm.location_id); pre('crm_pipeline_id', cfg.crm.pipeline_id); }
  if (cfg.booking)   { pre('booking_provider', cfg.booking.provider); pre('booking_location_id', cfg.booking.location_id); pre('booking_public_url', cfg.booking.public_url); }
  if (cfg.phone)     { pre('phone_provider',   cfg.phone.provider);   pre('phone_number', cfg.phone.number); pre('phone_cap', cfg.phone.cap); pre('phone_escalation', cfg.phone.escalation); }
  if (cfg.analytics) { pre('ga4_id', cfg.analytics.ga4_id); pre('gtm_id', cfg.analytics.gtm_id); pre('meta_pixel_id', cfg.analytics.meta_pixel_id); pre('tiktok_pixel_id', cfg.analytics.tiktok_pixel_id); }
  if (cfg.reviews)   { pre('google_place_id', cfg.reviews.google_place_id); pre('google_review_link', cfg.reviews.google_review_link); pre('trustpilot_url', cfg.reviews.trustpilot_url); pre('review_trigger', cfg.reviews.trigger); }
  if (cfg.youtube)   { pre('youtube_channel_id', cfg.youtube.channel_id); }
  if (cfg.tiktok)    { pre('tiktok_handle', cfg.tiktok.handle); pre('tiktok_scheduler', cfg.tiktok.scheduler); }
  if (cfg.linkedin)  { pre('linkedin_page', cfg.linkedin.page); pre('linkedin_page_id', cfg.linkedin.page_id); }
  if (cfg.sms)       { pre('twilio_number', cfg.sms.number); pre('twilio_sender_name', cfg.sms.sender_name); }
  if (Object.keys(preConn).length > 0) {
    const connSeed = `
<script>
(function connSeed(){
  function tryPrefill(){
    try {
      var existing = JSON.parse(localStorage.getItem('gymos_connections_v1') || '{}');
      var preset = ${JSON.stringify(preConn)};
      var merged = Object.assign(preset, existing); // existing wins (don't clobber)
      localStorage.setItem('gymos_connections_v1', JSON.stringify(merged));
    } catch(_){}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryPrefill, { once:true });
  else tryPrefill();
})();
</script>`;
    html = html.replace('</body>', connSeed + '\n</body>');
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
