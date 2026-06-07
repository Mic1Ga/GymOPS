# FIX-LOCK · GymOps invariants

Patches applied to gymos master + per-client builds.
**Every future push must verify these hold or revert and re-apply.**
Every locked behaviour is also marked in source with a `FIX-LOCK ·` comment so grep finds it.

---

## How to verify before pushing

```bash
node scripts/check-fix-lock.js   # runs every invariant below as an assertion
git diff --stat                  # confirm no FIX-LOCK comment was touched accidentally
```

If any invariant fails: STOP. Fix the regression locally. Re-run check. Then push.
Never push past a failing FIX-LOCK without an explicit user "override fix-lock for X" instruction.

---

## Invariants

### F1 · Multi-select on every client-selection step
**Master**: `index.html` configurator
**State**: `state.configChoices = [[], [], []]` (three arrays, not `[[], null, null]`)
**UI**: every `config-option` onclick calls `toggleConfigType(step, this, value)` — never `selectConfig`
**Result builder**: handles arrays for gymTypes, sizes, problems; merges team members (union, dedupe); ROI uses min-of-mins / max-of-maxes; package recommendation uses largest selected size
**Why**: gym owners legitimately span multiple programmes, sizes (multi-site / seasonal), and headaches. Forcing one choice misrepresents their reality.
**Verify**: `grep -c 'toggleConfigType(' index.html` should return ≥ 19 (9 programmes + 4 sizes + 6 problems). `grep -c 'selectConfig(' index.html` should return `0`.

### F2 · Audit-shim data-tool tag matches slug
**Master**: `<script src=".../audit-shim.js" data-tool="gymos" ...>`
**Client (gymops)**: `<script src=".../audit-shim.js" data-tool="gymops" ...>`
**Why**: EU AI Act Article 12 traceability must identify the actual tool, not the master.
**Verify**: `grep 'data-tool=' clients/gymops.html` → `data-tool="gymops"`

### F3 · Konomi / KCC / Fall* badges hidden in client build
**Client CSS**: `#kcc-badge,#konomi-badge{display:none !important;}`
**Why**: client doesn't see internal estate doctrine. Shims still run for future re-enable.
**Verify**: `grep '#kcc-badge,#konomi-badge' clients/gymops.html`

### F4 · `window.scroll()` not `window.scrollTo()` in showApp/exitApp
**Master + client**: `window.scroll(0, 0)` — the custom `scrollTo()` helper shadowed `window.scrollTo` and broke the "See It Working" button.
**Verify**: `grep -E 'window\.scrollTo\(0,\s*0\)' index.html clients/gymops.html` should return **nothing**.

### F5 · USD pricing only · never GBP
**Master + sales + clients**: every dollar figure rendered as `$`, not `£`.
**Why**: Michel sells globally · USD is the lingua franca · explicit user instruction.
**Verify**: `grep -E '£[0-9]' index.html sales/gymops.html clients/gymops.html` should return **nothing**.

### F6 · Doctrine markers stripped from client surface
**Client only**: no `◊·κ=φ⁴`, no `Konomi`, no `Fall*`, no `prime N` visible in user-facing HTML (header comment block excepted).
**Verify**: `grep -oE 'κ=φ⁴|Konomi|Fall[A-Z]|◊·κ' clients/gymops.html | grep -v '<!--' | wc -l` should be `0`.

### F7 · Sales landing lives at `sales/gymops.html` not `sales.html`
**Path**: `sales/gymops.html` mirrors per-client pattern.
**Why**: future gyms get their own sales landing under the same directory.
**Verify**: `test -f sales/gymops.html && ! test -f sales.html`

### F8 · MIT only · no proprietary clauses, no analytics, no telemetry
**Verify**: `head -3 LICENSE` should match MIT preamble.

---

## Push protocol (for both sjgant80-hub/gymos AND Mic1Ga/GymOPS)

1. Make changes locally on master
2. `node scripts/build-gym.js configs/gymops.json` — regenerate every client
3. Run `node scripts/check-fix-lock.js` (TODO: build this · for now run the verify commands above manually)
4. If clean: commit + push
5. If pushing to Mic1Ga/GymOPS: `git pull --rebase` first to avoid clobbering Michel's local edits. If conflict in a FIX-LOCK file, the FIX-LOCK wins unless Michel explicitly asked.

---

## How to add a new invariant

1. Apply the fix in code with a `// FIX-LOCK · short reason` comment
2. Add a section `### Fn · short title` here with: location, what, why, verify command
3. (Future) add an assertion to `scripts/check-fix-lock.js`

---

**◊·κ=φ⁴** · invariants live forever · or until explicitly overridden by the user.
