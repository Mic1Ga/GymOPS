# ◊ GymOS forge · production demo setup

For the in-meeting build flow. 4-minute setup. One-time.

## What you need

- Node 18+ (you have this)
- Your `KONOMI_PRIVATE_KEY` (32-byte base64 seed — the one that signs every estate trial)
- This repo cloned: `gh repo clone sjgant80-hub/gymos`

## Setup (one-time on your laptop)

```powershell
# 1. clone if not already
gh repo clone sjgant80-hub/gymos
cd gymos

# 2. set your Konomi key (use the same one as the rest of the estate)
$env:KONOMI_PRIVATE_KEY = "<your 32-byte base64 seed>"

# 3. start the local trial signer (keep this window open during demos)
node scripts/trial-sign-server.mjs
```

You should see:

```
◊·κ=1 · trial-sign-server LIVE on http://127.0.0.1:9991
  endpoints:
    GET  /health      → confirms server is up
    POST /sign-trial  → { tool_id, tool_prime, gym_name, days } → signed envelope
  forge.html will call this automatically while the BUILD flow runs.
  key stays on this machine. Never sent over network.
  Ctrl+C to stop.
```

## Demo flow (in front of Michel)

1. Open `https://sjgant80-hub.github.io/gymos/forge.html` in your browser.
2. Look at the header — green dot · "signer · ready" means the local signer is reachable.
   - If red: switch to your PowerShell window, confirm `trial-sign-server.mjs` is running, click "re-check" in the forge.
3. Fill in the gym's specs together with Michel:
   - **Gym identity**: name, slug auto-fills, product name (GymOps / white-label), logo text, tagline
   - **Contact + trial**: name, email, phone, website, start date. **Default trial = 14 days.**
   - **Brand colors**: three color pickers (matches the gym's existing brand)
   - **Konomi visibility**: ✓ checked = badges hidden on client's build (shim code preserved for future re-enable)
   - **Optional**: socials + provider integrations to pre-seed
4. Click **◊ BUILD & DOWNLOAD**.
   - Browser calls `127.0.0.1:9991/sign-trial` → gets Ed25519-signed envelope
   - Fetches master `index.html` (287 KB)
   - Patches: title · meta · NODE · brand · logo · product name · hero · onboarding pre-seed · connections pre-seed · signed trial · manifest
   - Downloads as `<slug>.html`
5. Hand the file to Michel — USB / email / SharePoint / their drive. Client opens it. Trial auto-activates. 14 days later: in-app upgrade path to persistent Konomi licence.

## What's in the delivered HTML

| Layer | What |
|---|---|
| Identity | Gym name, slug, product name, logo, tagline, brand colors |
| Prime | Unique extension prime (29-229 pool) for mesh visibility |
| Onboarding console | Pre-filled with contact details (gym_name, email, phone, website, start_date) |
| Connection fields | Pre-seeded social URLs + provider picks (CRM/booking/phone) |
| Konomi trial | **Ed25519-signed envelope · 14 days default · auto-activates on first load** |
| Konomi visibility | Badges CSS-hidden by default (toggleable per gym) |
| LLM cascade | Internal T0→T4 fallback already in master (Anthropic / OpenAI / Gemini / OnlyBrains / WebLLM offline) |
| Audit chain | Konomi prevHash + Ed25519 signature on every state change |
| Mesh | BroadcastChannel('fall-signal') · talks to peer Fall* tools when on the same origin |
| Sovereignty | IndexedDB local · no telemetry · runs from file:// · MIT |

## After the trial expires

The gym sees the Konomi licence upgrade path inside the tool. To convert:

```powershell
# Mint a persistent licence (no expiry)
KONOMI_PRIVATE_KEY=... node scripts/mint-licence.mjs --tool-id <slug> --tier persistent --features all
```

Hand the persistent envelope to the gym (or email them a one-line `localStorage.setItem(...)` snippet to paste in dev tools). Trial → paid · zero re-install · same `<slug>.html` file just upgrades.

## CLI fallback (if forge.html isn't accessible)

```powershell
# Edit configs/<gym-slug>.json with the same fields, then:
$env:KONOMI_PRIVATE_KEY = "..."
node scripts/build-gym.js configs/<gym-slug>.json
# Output: clients/<gym-slug>.html
```

## Troubleshooting

- **Signer offline in forge** → PowerShell window with `trial-sign-server.mjs` got closed. Restart it.
- **Signer rejects with "32-byte"** → Your `KONOMI_PRIVATE_KEY` is the wrong length. Check it's the 32-byte base64 seed (not the PKCS8 DER form).
- **Browser blocks localhost:9991** → unlikely on modern Chrome, but if it happens: enable "Allow insecure private network requests" in `chrome://flags`.
- **Forge fetches master but build fails** → check browser console; likely the master's structure changed and a regex no longer matches. Master & forge are kept in sync — re-pull the repo.

## Security notes

- `trial-sign-server.mjs` binds **127.0.0.1 only** — never exposed to LAN/internet.
- `KONOMI_PRIVATE_KEY` lives in your PowerShell session env vars — never written to disk by the signer.
- Each signed envelope is bound to a specific `tool_id` (slug) and `tool_prime` — can't be replayed against a different gym's build.

◊·κ=1 · prime 23 · phi=1.618 · kappa=0.618
