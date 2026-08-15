# Compensation Estimator — Data Provenance & Decisions

The estimator at `#comp-calc` on the Clinicians page (`/physicians`) was rebuilt
Aug 14 2026 (commits `044ef62`, `9dc51e7`) on real rate data, replacing two flat
per-encounter constants and an unsubstantiated "+12% AI lift" earnings claim.

Data module: `src/data/compRates.js`. UI: `CompEstimator` in `src/App.jsx`.

## The derivation

```
annual = (perDay × daysWeek × weeksYear)          visits per year
       × weightedAllowed                          mix-weighted Medicare allowed
       × PAYER_FACTOR (0.979)                     blended payer mix vs Medicare FFS
       × COLLECTION_RATE (0.956)                  net of denials / uncollected
       × compRate (0.70 MD / 0.60 APP)            provider share of collections
```

The payoff panel renders every intermediate as a ledger on purpose — the section
exists to show the math, not just a number.

## What's measured vs. what's chosen

| Input | Basis |
|---|---|
| Per-CPT allowed amounts (99221–23, 99231–33, 99238–39, 17 localities) | **Published** — CY2026 PFS, GPCI-adjusted per Addendum E (CMS-1832-F), CF $33.4009 |
| ALOS + default level mixes per care setting | **Measured** — Jan–Jul 2026 remittance extract (75,556 charges, 25 facilities, 29 providers) |
| `PAYER_FACTOR` 0.979 | **Measured** — same extract |
| `COLLECTION_RATE` 0.956 | **Chosen target** — ownership decision 2026-08-14. Measured was **0.863** (charges aged 5+ months). ~96% is the industry net-collection benchmark; using it raises every output ~10.8% above measured actuals |
| Discharge capture | **Assumed full** — actuals showed only ~11.9% of episodes billed a discharge |
| `COMP_RATE_MD` 0.70 | Public site-wide |
| `COMP_RATE_APP` 0.60 | Ownership approved for public display 2026-08-14 (first public appearance of this figure) |
| `APP_FACTOR` 0.85 | Statutory — Medicare pays NP/PA at 85% of PFS under own NPI |

**The estimate is deliberately forward-looking** on two axes (benchmark
collections, full discharge capture). If a candidate or diligence asks why the
number runs ahead of current-state billing, that is the answer — say it plainly.

## Invariants — do not remove

- The coding-compliance line ("The level mix describes a patient population over
  time… never by a target or an average"). The section shows a direct
  relationship between coding intensity and personal income; this line is the
  guardrail and does not ship without it.
- The estimate-not-an-offer disclaimer in the payoff panel.
- Level percentage inputs are never blocked or rewritten — non-100 totals
  normalize proportionally with a visible note.
- The "+12% AI lift" figure stays dead. Any future capture-improvement claim
  needs its own substantiation first.

## Known gaps (also documented in `compRates.js`)

- SNF/NF codes 99304–99316 not modeled (~8.5% of collections in actuals). The
  estimator silently misprices a SNF-heavy provider — don't add the codes
  without rate data.
- ACP 99497 (~$144K annualized) and facility stipends / directorships excluded —
  the latter are not professional-fee revenue and not part of the 70/60 split.
- Malpractice RVU component is estimated at 7.5% of work RVU (<1% effect on any
  rate). Replace with PPRRVU2026 components when convenient.
- Rates assume the 1.0 work GPCI floor, extended only through 1/31/2026. If
  lapsed: AZ, NV, Elsewhere-in-TX, Elsewhere-in-OR drop ~0.7–0.8%.

## Open items

1. **Stat-strip reconciliation.** Homepage says 19 facilities / 36+ providers /
   6 states; the billing extract behind these rates covers 25 / 29 / 4 over
   seven months. Probably definitional (managed vs. billed-through), but
   reconcile before anyone in diligence puts them side by side.
2. The page is labeled **Clinicians** (Aug 2026) but body copy claims specific
   to physicians (70% share, "physicians co-manage") intentionally remain —
   the NP/PA story lives in the estimator's role toggle.

## Reference values (for regression checks)

At Nevada / IRF / physician / 24 per day / 5 days / 43 weeks:
annual ≈ **$298,566**, average admission **$142.00**. San Jose ≈ +14.8% vs
Nevada; NP/PA ≈ −27% vs physician (0.85 × 0.60 ÷ 0.70).
