# goldpmr.com

Marketing site for Gold PM&R — a physician-owned post-acute rehabilitation
medicine group. Two audiences: **facilities** (partnership, ROI calculator,
compliance assessment) and **clinicians** (recruiting, compensation estimator).

Live at **https://www.goldpmr.com**. Pushes to `main` deploy straight to
production via Vercel — there is no staging branch.

## Stack

- React 19 + Vite, near-single-file app (`src/App.jsx`) with hand-rolled routing
  (`PATHS` / `nav()` / `applyMeta()`), inline styles from two token objects
  (`C` colors, `F` type, in `src/theme.js`). No CSS framework, no router library, no state manager.
- `src/data/compRates.js` — CY2026 Medicare rate data behind the comp estimator
  (see `docs/COMP-ESTIMATOR.md` before touching any number in it).
- `api/contact.js` — Vercel function for the facility contact form
  (Supabase insert + Resend notification from `mail.goldpmr.com`).
- `api/coverage-application.js` + `lib/` + `src/CoverageApplication.jsx` —
  unlisted `/coverage-application` page that fills the Coverys malpractice
  application in memory and streams it back; **nothing is retained**
  (`docs/COVERAGE-APPLICATION.md`).
- Careers/recruiting flows live on **careers.goldpmr.com**; this site only
  funnels out with UTM attribution (`docs/CAREERS-INTEGRATION.md`).

## Commands

```sh
npm run dev       # Vite dev server (localhost:5173)
npm run lint      # eslint — must be clean
npm run build     # production build — must be clean (runs verify:field-map first)
npm run verify:field-map   # Coverys template ↔ field-map guard; fails if the form was reissued
```

## Before you change things

- **Brand rules are enforced in code comments** — start at the `C` and `F`
  token definitions in `src/theme.js`. Headlines: `#C9A227` gold is
  decorative-only (it fails contrast as text; interactive gold is `C.deepGold`),
  there is no bold in the identity (weights 300/400/500), tap targets are 44px,
  and never set `outline: none` inline. Open brand questions live in
  `docs/BRAND-KIT-DEFERRALS.md`.
- **Calculator constants are decisions, not defaults.** The ROI calculator and
  comp estimator numbers were each deliberately chosen or measured;
  `docs/COMP-ESTIMATOR.md` records which is which and what must not ship
  without its disclaimers.
- **UTM values are load-bearing** — analytics groups on them. Vary
  `utm_content` per touchpoint; never change source/medium/campaign.

## Docs

| File | What it covers |
|---|---|
| `docs/COMP-ESTIMATOR.md` | Comp estimator data provenance, measured-vs-target constants, invariants, open items |
| `docs/CAREERS-INTEGRATION.md` | Careers funnel, UTM map, future live-jobs feed spec |
| `docs/BRAND-KIT-DEFERRALS.md` | Brand kit deviations awaiting human decisions; accessibility invariants |
| `docs/COVERAGE-APPLICATION.md` | Coverage-application page: no-retention rules, positional DOCX map + re-map procedure, open launch items |
