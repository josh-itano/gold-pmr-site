// Compensation estimator reference data.
//
// Rates are CY2026 Medicare Physician Fee Schedule allowed amounts for hospital
// inpatient E/M, GPCI-adjusted per Addendum E (CMS-1832-F), conversion factor
// $33.4009 (non-QP). Applies to IRF, ARU and LTAC. SNF/NF codes (99304–99316)
// are not modeled here — see NOT_MODELED at the bottom.
//
// Visit mix and payer factor are calibrated against Gold's Jan–Jul 2026
// remittance extract: 75,556 charges, 25 facilities, 29 providers. The
// collection rate is a forward-looking benchmark target — see its note in
// RATE_CONFIG.
//
// Caveat carried forward: the malpractice RVU component is estimated at 7.5% of
// work RVU (anchored on 99213 at 7.7% and 99309 at 7.3%, the two codes with
// published components). This moves any single rate by under ~1%, concentrated
// in low-MP-GPCI California localities. Replace with PPRRVU2026 components when
// convenient.
//
// Rates also assume the 1.0 work GPCI floor, extended through the end of
// CY2026. CY2027 GPCIs reportedly drop it: AZ, NV, Elsewhere-in-Texas and
// Elsewhere-in-Oregon each fall roughly 0.7–0.8%. This table is CY2026 only —
// see docs/COMP-ESTIMATOR.md open items for the 2027 refresh.

export const CPT_ORDER = [
  "99221", "99222", "99223",
  "99231", "99232", "99233",
  "99238", "99239",
];

// Category shares follow length of stay and are NOT user-editable:
// one admission + (ALOS − 2) progress notes + one discharge. Settings with
// billsDischarge: false (consult services) fold the discharge day into
// progress notes: one admission + (ALOS − 1) progress notes.
export const CATEGORIES = [
  {
    id: "initial",
    title: "Admissions",
    perStay: "One per stay",
    codes: [
      { code: "99221", idx: 0, level: "Level 1 · Low" },
      { code: "99222", idx: 1, level: "Level 2 · Moderate" },
      { code: "99223", idx: 2, level: "Level 3 · High" },
    ],
  },
  {
    id: "subsequent",
    title: "Progress notes",
    perStay: "Every day between admit and discharge",
    codes: [
      { code: "99231", idx: 3, level: "Level 1 · Low" },
      { code: "99232", idx: 4, level: "Level 2 · Moderate" },
      { code: "99233", idx: 5, level: "Level 3 · High" },
    ],
  },
  {
    id: "discharge",
    title: "Discharges",
    perStay: "One per stay",
    // Discharge splits on documented time, not decision-making level.
    note: "Split by documented time, not by decision-making level.",
    codes: [
      { code: "99238", idx: 6, level: "30 minutes or less" },
      { code: "99239", idx: 7, level: "More than 30 minutes" },
    ],
  },
];

// Allowed amounts in CPT_ORDER sequence. Physician (100% of PFS).
// APP own-NPI rates derive at APP_FACTOR.
export const LOCALITIES = [
  { id: "nv",      state: "Nevada",     label: "Nevada (statewide)",           r: [73.82, 115.84, 154.88, 43.68, 69.83, 105.90, 74.21, 105.68] },
  { id: "az",      state: "Arizona",    label: "Arizona (statewide)",          r: [73.40, 115.24, 154.10, 43.47, 69.49, 105.38, 73.63, 104.86] },
  { id: "co",      state: "Colorado",   label: "Colorado (statewide)",         r: [75.27, 118.03, 157.76, 44.47, 71.10, 107.85, 75.94, 108.11] },
  { id: "ca-la",   state: "California", label: "Los Angeles / Orange County",  r: [78.27, 122.58, 163.76, 46.11, 73.77, 111.94, 79.45, 113.06] },
  { id: "ca-ie",   state: "California", label: "Riverside / San Bernardino",   r: [76.40, 119.77, 160.07, 45.11, 72.13, 109.43, 77.18, 109.87] },
  { id: "ca-sac",  state: "California", label: "Sacramento",                   r: [77.16, 120.85, 161.44, 45.46, 72.73, 110.35, 78.30, 111.42] },
  { id: "ca-sd",   state: "California", label: "San Diego",                    r: [77.38, 121.14, 161.80, 45.55, 72.87, 110.59, 78.72, 111.99] },
  { id: "ca-sf",   state: "California", label: "San Francisco / Oakland",      r: [83.86, 131.06, 174.93, 49.18, 78.73, 119.53, 86.03, 122.32] },
  { id: "ca-sj",   state: "California", label: "San Jose",                     r: [85.07, 132.94, 177.42, 49.87, 79.84, 121.23, 87.34, 124.18] },
  { id: "ca-rest", state: "California", label: "Elsewhere in California",      r: [75.05, 117.62, 157.17, 44.28, 70.82, 107.44, 75.95, 108.09] },
  { id: "or-pdx",  state: "Oregon",     label: "Portland",                     r: [76.08, 119.24, 159.34, 44.89, 71.79, 108.93, 76.99, 109.58] },
  { id: "or-rest", state: "Oregon",     label: "Elsewhere in Oregon",          r: [73.21, 114.87, 153.58, 43.31, 69.24, 105.01, 73.62, 104.83] },
  { id: "tx-aus",  state: "Texas",      label: "Austin",                       r: [75.05, 117.70, 157.33, 44.35, 70.91, 107.56, 75.71, 107.78] },
  { id: "tx-dal",  state: "Texas",      label: "Dallas",                       r: [74.33, 116.67, 156.00, 44.00, 70.34, 106.67, 74.65, 106.31] },
  { id: "tx-ftw",  state: "Texas",      label: "Fort Worth",                   r: [74.22, 116.51, 155.81, 43.95, 70.25, 106.54, 74.49, 106.09] },
  { id: "tx-hou",  state: "Texas",      label: "Houston",                      r: [76.34, 119.88, 160.34, 45.24, 72.30, 109.64, 76.48, 108.94] },
  { id: "tx-rest", state: "Texas",      label: "Elsewhere in Texas",           r: [73.27, 115.07, 153.90, 43.43, 69.41, 105.24, 73.39, 104.53] },
];

// Care setting sets length of stay and the starting level distribution.
// ALOS values are median billable days per episode from the actuals.
// Level distributions are the observed charge mix.
// billsDischarge: false — consultants never bill discharge day management
// (99238/99239); the attending of record does. Their last visit is a
// subsequent-care visit instead.
export const SETTINGS = [
  {
    id: "irf",
    label: "Inpatient rehab (IRF or ARU)",
    blurb: "Rehabilitation hospital or acute rehab unit",
    alos: 10,
    levels: { initial: [0, 33, 67], subsequent: [1, 70, 29], discharge: [15, 85] },
  },
  {
    id: "ltac",
    label: "Long-term acute care (LTAC)",
    blurb: "Longer stays, higher medical complexity",
    alos: 12,
    levels: { initial: [0, 28, 72], subsequent: [1, 66, 33], discharge: [15, 85] },
  },
  {
    id: "acute",
    label: "Acute consult service",
    blurb: "Shorter episodes, higher admission share",
    alos: 4,
    billsDischarge: false,
    levels: { initial: [0, 35, 65], subsequent: [1, 72, 27], discharge: [15, 85] },
  },
];

export const RATE_CONFIG = {
  // Provider share of net collections. 70% is stated publicly on the site
  // (home page and physicians hero). 60% for APPs was approved for public
  // display by ownership 2026-08-14 and ships in the NP/PA toggle.
  COMP_RATE_MD: 0.70,
  COMP_RATE_APP: 0.60,

  // Medicare pays NP/PA/CNS at 85% of the physician fee schedule when billing
  // under their own NPI. Split/shared in hospital inpatient may bill at 100%.
  APP_FACTOR: 0.85,

  // Blended rate across payers relative to Medicare FFS, from the actuals:
  // Medicare FFS 58.3% @100%, commercial 21.9% @92.9%, Medicaid 11.9% @102.1%,
  // Medicare Advantage 7.3% @97.6%, self-pay 0.7% @1.4%.
  PAYER_FACTOR: 0.979,

  // Net collection rate. Forward-looking benchmark target (~96% is the widely
  // cited net-collection benchmark for well-performing RCM), set by ownership
  // Aug 2026. The measured rate in the Jan–Jul 2026 extract was 0.863 on
  // charges aged 5+ months — the estimate assumes benchmark collections, not
  // current-state actuals, same forward-looking basis as DISCHARGE CAPTURE
  // below. Raises every output ~10.8% vs the measured rate.
  COLLECTION_RATE: 0.956,

  // Starting values for the volume inputs. Median across the fuller-time
  // provider cohort was 24 encounters per worked day and ~213 worked days.
  DEFAULT_PER_DAY: 24,
  DEFAULT_DAYS_WEEK: 5,
  DEFAULT_WEEKS_YEAR: 43,
};

// Derived helpers — pure, no React.

export function categoryShares(alos, billsDischarge = true) {
  if (!billsDischarge) {
    return {
      initial: 1 / alos,
      subsequent: Math.max(0, (alos - 1) / alos),
      discharge: 0,
    };
  }
  return {
    initial: 1 / alos,
    subsequent: Math.max(0, (alos - 2) / alos),
    discharge: 1 / alos,
  };
}

function normalize(arr) {
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum > 0 ? arr.map((v) => v / sum) : arr.map(() => 1 / arr.length);
}

/** Share of all visits, per CPT, in CPT_ORDER sequence. */
export function visitMix(alos, levels, billsDischarge = true) {
  const cat = categoryShares(alos, billsDischarge);
  const i = normalize(levels.initial);
  const s = normalize(levels.subsequent);
  const d = normalize(levels.discharge);
  return [
    cat.initial * i[0], cat.initial * i[1], cat.initial * i[2],
    cat.subsequent * s[0], cat.subsequent * s[1], cat.subsequent * s[2],
    cat.discharge * d[0], cat.discharge * d[1],
  ];
}

/** Allowed amount per CPT for a locality, adjusted for role. */
export function ratesFor(locality, role) {
  const f = role === "app" ? RATE_CONFIG.APP_FACTOR : 1;
  return locality.r.map((v) => v * f);
}

/** Average allowed amount within one category. */
export function categoryAverage(rates, levels, categoryId) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  const n = normalize(levels[categoryId]);
  return cat.codes.reduce((acc, c, k) => acc + rates[c.idx] * n[k], 0);
}

/**
 * Full estimate. Returns every intermediate value so the UI can show the
 * derivation rather than just the total.
 */
export function estimate({ locality, role, alos, billsDischarge = true, levels, perDay, daysWeek, weeksYear }) {
  const rates = ratesFor(locality, role);
  const mix = visitMix(alos, levels, billsDischarge);
  const weightedAllowed = rates.reduce((a, v, i) => a + v * mix[i], 0);
  const afterPayer = weightedAllowed * RATE_CONFIG.PAYER_FACTOR;
  const perEncounter = afterPayer * RATE_CONFIG.COLLECTION_RATE;
  const encounters = perDay * daysWeek * weeksYear;
  const collections = encounters * perEncounter;
  const compRate = role === "app" ? RATE_CONFIG.COMP_RATE_APP : RATE_CONFIG.COMP_RATE_MD;
  const annual = collections * compRate;
  return {
    rates, mix, weightedAllowed, afterPayer, perEncounter,
    encounters, collections, compRate,
    annual, monthly: annual / 12,
    categoryAverages: {
      initial: categoryAverage(rates, levels, "initial"),
      subsequent: categoryAverage(rates, levels, "subsequent"),
      discharge: categoryAverage(rates, levels, "discharge"),
    },
  };
}

// Known gaps, kept here so they stay visible to whoever edits this next:
//
// NOT_MODELED
//  - SNF/NF codes 99304–99316. These were 8.5% of collections in the actuals
//    (~$724K annualized; 99308 is the 4th-highest-volume code overall).
//  - Advance care planning 99497 (~$144K annualized).
//  - Facility stipends and medical directorship fees, which are not
//    professional-fee revenue and are not part of the 70/60 split.
//
// DISCHARGE CAPTURE
//  In the actuals, only ~11.9% of episodes with an admission also carried a
//  discharge charge. The IRF and LTAC SETTINGS above assume FULL capture
//  (acute consult bills no discharge by design — see billsDischarge), so the estimator
//  shows what a provider earns when discharge day management is billed. That is
//  the right basis for a forward-looking recruiting tool, but it means the
//  estimate runs ahead of current-state billing until capture is fixed.
