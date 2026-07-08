# Brand Kit — Open Items & Deviations

Raised while applying **GOLD Brand Kit, Edition 01 · 2026** to this site
(commit `8ef19da` and follow-ons). Nothing here blocks the site; each item needs
a decision from a person, not a code change.

Kit source: `Dropbox-Goldpmr/Goldpmr Team Folder/Brand Collateral/GOLD_Brand_Kit.pdf`

---

## 1. The kit has two contrast bugs

Both were found by auditing rendered text against its actual painted background,
and both fail the kit's own accessibility rule (p12: *"Body text clears WCAG AA
(4.5:1)"*). Neither is a site bug — the kit prescribes them.

**Root cause:** the contrast table on p05 only ever tests colors against **White**
and **Ink Navy**. It never tests anything against **Mist `#F0F4F8`** — the surface
p05 itself assigns to "sections / tiles" and p12 assigns to "cards, panels, inputs."

| Pairing | On White | On Mist | Kit says |
|---|---|---|---|
| Slate Gray `#64748B` | 4.76:1 ✅ | **4.31:1 ❌** | "Secondary" text |
| Deep Gold `#846B1A` | 5.12:1 ✅ | 4.64:1 ✅ | "AA 5.1:1" |
| Deep Gold on gold-tint over Mist | — | **4.37:1 ❌** | — |

**Worked around in code:**
- `C.muted` darkened `#64748B` → `#5D6B80` (5.41:1 White / 4.90:1 Mist).
- `Badge` ground moved from the gold tint to White, so Deep Gold hits its stated 5.12:1.

**Decision needed:** correct the kit at source, or these get re-derived on every
new surface. Recommend adding a Mist column to the p05 contrast table.

---

## 2. Hero weight deviates from the type scale

Kit p06 specifies `Display · 56/300`. Hero headlines ship at **Outfit Medium 500**
(commit `b9cf3d1`).

**Rationale:** at 56px, 300 thinned out until the eyebrow badge competed with the
headline for weight. 500 is the kit's heaviest shipped weight, and it is the
weight of the logo wordmark itself (p03: *"the GOLD wordmark in Outfit Medium"*),
so the largest type on the page now matches the mark above it.

**Still a deviation.** Kit p13 says new applications should be reviewed before
release. Section headings remain at 400 so the hero keeps a clear step above them.

---

## 3. Service icon package does not exist

Kit p07 says the 12-icon set ships "as SVG and PNG in the icon package (see
download card)." No such package is in `Brand Collateral/` — only the kit PDF and
`logo 3/` (23 logo and app-icon PNGs).

**Also:** the kit's 12 icons cover **clinical focus areas** (Rehabilitation
Medicine, Cardiac, Neuro Rehab, Wound Care, Pain Management…). The site's 18 card
icons are **business and product concepts** (reimbursement, compliance risk,
billing, dashboards). The supplied set would not have covered them even if it
existed.

**Consequence:** the site has standardized on **Lucide** (`lucide-react`), rendered
to the kit's p07 spec — 1.6px stroke at 24px, charcoal, never filled, never
multicolor. Kit p07 says *"pick one system and hold it everywhere."* When the
clinical package arrives, verify it is visually compatible with Lucide before it
lands near these pages, or the site will carry two line systems.

---

## 4. Logo descriptor: files and guide disagree

The supplied lockup PNGs render the descriptor as **"POST-ACUTE REHAB SPECIALISTS."**
The kit PDF renders it as **"PHYSICAL MEDICINE & REHABILITATION"** (p03, p09, p13),
and p02 names the short descriptor as "Physical Medicine & Rehabilitation."

The files are what ship, so the files are what the site uses. Someone should
decide which is the real descriptor.

---

## 5. Clear space is relaxed in the sticky nav

Kit p04: clear space equals the leaf height (`x`) on all four sides, and the
minimum lockup width is 120px.

At 120px wide the lockup is ~38px tall, so honoring `x` vertically would require a
~114px nav bar. The nav is **76px**, with horizontal clear space intact. The
descriptor is dropped at this size (notagline lockup) because its cap height would
be ~2px against the kit's 6px floor — which is what p04 prescribes: *"Drop the
descriptor first."*

---

## 6. Copy voice vs. the kit's "WE DON'T SAY" column

Not addressed; the copy is deliberate and owned elsewhere. Flagged only because
p02 names phrases close to what is live:

- Kit rejects *"We maximize census, throughput, and RVUs"* → site: "Gold physicians
  maximize CMI scores."
- Kit says *"Confident, never boastful… No superlatives, no hype"* → site:
  "Technology That No Competitor Can Match," "The New Standard in…," "Best Tools.
  Best Support. Best Career."

---

## 7. Substantiation: the 60–70% documentation-time claim

The site previously carried two different figures for the same product — 30–50%
(Technology) and 60–70% (Physicians). Reconciled to **60–70%** in both places
(commit `f42e68d`), per direction.

**Open:** 60–70% is now the only figure on the site, and it is the more aggressive
of the two. Kit p02: *"We measure outcomes and stand behind them."* Confirm the
number is sourced from measured data and can be produced when a facility asks.

---

## Accessibility invariants to preserve

Established in `8ef19da`; re-verify if surfaces or type change:

- Zero WCAG AA failures across all 5 pages, both contact form modes, all 4 quiz
  risk tiers. Audited against composited backgrounds, not assumed values.
- No text below 12px (labels) / 14px (body).
- 2px Deep Gold focus ring on every control. Never re-add `outline: none` inline —
  inline styles beat the `:focus-visible` stylesheet rule.
- `prefers-reduced-motion` honored in CSS **and** in the JS counters (`AnimNum`,
  `Reveal`).
- `#C9A227` is decorative only: 2.42:1 on white, so it fails even the 3:1
  large-text bar. It appears as text nowhere. The 5 remaining `color: C.gold` uses
  all sit on Ink Navy grounds (7.38:1).
- The kit defines no semantic palette. `green` / `red` / `amber` are conventional
  hues darkened until they clear AA on white. Flag for brand review.
