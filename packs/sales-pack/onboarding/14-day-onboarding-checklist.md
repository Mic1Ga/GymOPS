# GymOps · 14-Day Onboarding Checklist

**Goal**: by Day 14 the gym has captured ≥10 leads through GymOps, posted ≥6 pieces of content, and member retention conversations are running on autopilot.

If they hit those, they renew. If they don't, we know exactly where the gap is.

---

## Day 0 · Activation (the call that comes 30 minutes after signing)

- [ ] Send live URL — `https://sjgant80-hub.github.io/gymos/clients/{slug}.html`
- [ ] Send signed Konomi trial envelope (30-day or 12-month — depends on plan)
- [ ] 10-minute screen-share: open the URL, paste the trial envelope, confirm the badge says "active"
- [ ] Walk them through these 4 first actions:
  - Settings → Gym Profile → fill in name, location, programmes, opening hours
  - Settings → AI Engine → paste either Claude or OpenAI API key (we recommend Claude · cheapest at quality)
  - Settings → Email Provider → connect SendGrid (free tier = 100 emails/day, plenty)
  - Onboarding tab → walk Phase 1 of the wizard
- [ ] Tell them their homework: by Day 3 they must have ✓ all of Phase 1

**End-of-call line**: *"I'll check in Wednesday. If you've finished Phase 1 by then, we move to socials. If not, that's fine, we walk you through it again. No pressure."*

---

## Day 3 · Phase 1 Check-in (15 min)

- [ ] Verify Phase 1 is ✓
- [ ] If not: do it together right now on the call
- [ ] Walk through Phase 2 (the content engine)
- [ ] Set their tone of voice — examples of social posts they like + don't like
- [ ] Generate first AI post together · the gym owner picks the platform
- [ ] Make sure they post it (or schedule it) before the call ends

**End-of-call line**: *"By Friday I want to see 3 posts up on your account. Even if they're basic. The point is to break the 'I never post' habit."*

---

## Day 7 · First Week Review (20 min)

- [ ] Are there 3+ posts up? If yes, celebrate. If no, find the friction.
- [ ] Walk through Phase 3 — the AI receptionist for FAQs
- [ ] Have them paste their 10 most-common gym FAQs into the WhatsApp / Email auto-reply panel
- [ ] Connect Meta (Facebook + Instagram) — they'll need an admin role on the page
- [ ] Connect WhatsApp Business API if they have it (skip if they don't · revisit later)
- [ ] Generate the first member retention email (any member who hasn't shown up in 14 days)
- [ ] Show them the Bloom report — the system is starting to learn their style

**End-of-call line**: *"Next call we look at numbers. How many leads, how many replies, what the AI got right and what it didn't. Track everything in the Leads tab."*

---

## Day 14 · Renewal Conversation (30 min)

- [ ] Pull up their Leads tab — count the captures
- [ ] Pull up their content history — count posts published
- [ ] Pull up retention messages sent
- [ ] Compare to baseline (what they were doing before — usually 0)
- [ ] Address any blocked workflows directly
- [ ] Ask: **"Where has this saved you the most time so far?"** (lets them sell themselves)
- [ ] Ask: **"What would make this 10x more useful?"** (roadmap input + price-anchor opportunity)
- [ ] Walk them through renewal options — annual saves them ~20%
- [ ] Send Konomi production licence envelope after payment clears

**Soft close**: *"I can swap your trial envelope for the production one tonight. Same URL, just unlocks the rest of the year. Want to do that now or after you've slept on it?"*

---

## Troubleshooting · top issues you'll hit

| Issue | Cause | Fix |
|---|---|---|
| "Test Connection" fails for Meta | Token expired / wrong scope | Regenerate token with `pages_manage_posts` + `pages_read_engagement` |
| AI posts sound robotic | Tone-of-voice not set | Settings → Gym Profile → "How you sound" — 3 example posts |
| WhatsApp button doesn't send | Business API not connected | Most gyms skip this · use email + DM links instead |
| "Audit chain broken" badge | They wiped browser data | Re-init from Settings → Reset audit chain (it'll just start fresh) |
| Lost their data | They cleared browser storage | Always export to backup .json file on Day 3, again on Day 14 |
| Can't find the trial envelope | Lost the email | Resend from your laptop · regenerate signed envelope |

---

## Per-call energy

You're a partner, not a vendor. The gym owner does the work — you make sure they don't get stuck.

If a call goes past 30 minutes, you're doing the work for them. Stop. Let them try. Re-call Wednesday.

If they ghost two check-ins, send one direct message: *"Still want to do this? No judgement either way — just want to free up the time slots if not."* Most come back.

---

◊·κ=1 · internal doc · do not share with the gym
