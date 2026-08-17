# Coverage application — `/coverage-application`

An **unlisted** page where an incoming Gold PM&R physician answers nine short
steps and downloads the Coverys professional liability application
(form **APP MPL 001 07/25**), filled in and ready to sign. Built Aug 16 2026
from the `coverage-application-package` spec; interim tool until the
offer → contract → onboarding flow absorbs it. Build it simply; don't
over-engineer for a future that hasn't been designed.

## What this is — and isn't

Gold PM&R is **not a licensed insurance producer**. This is an intake that
produces a document the physician sends to Gold's broker. It is not a quote
request, not an application to a carrier, and Gold is not soliciting
insurance. Page copy stays on the right side of that line: "prepare your
application", never "get a quote" or "apply for coverage".

Physicians reach it **post-offer, pre-contract**, via a link Gold sends them.
Gold needs the resulting premium figure to write into the agreement.

## Non-negotiable: nothing is retained

Date of birth, license numbers, claims history, board actions, and a
disability-related question all pass through this endpoint.

- **No database write, no object storage, no email, no analytics** on this
  route. (The site has no analytics anywhere; keep it that way here.)
- `api/coverage-application.js` fills the document **in memory** and streams
  it back. The browser saves it; the physician sends it to the broker.
- Request bodies are never logged. Logs carry shape only — field counts,
  duration, map/form version. Applicant values never go into error messages
  (they end up in logs). The 500 response is deliberately opaque.
- Response headers: `Cache-Control: no-store…`, `X-Robots-Tag: noindex`.
- The form state lives only in React state; a `beforeunload` guard warns
  before the tab closes with unsaved answers.

If a future requirement makes retention necessary, that is a Kate conversation
**before** a code change, not after.

## Unlisted, not secret

The URL is public but deliberately unlisted so a random indexed form doesn't
send the broker noise from physicians unconnected to Gold:

- Not in the nav `links`, the footer columns, or `public/sitemap.xml`.
- `META.coverage.noindex` → `applyMeta()` upserts `<meta name="robots"
  content="noindex, nofollow">` on this route and removes it on navigation
  away (client-side routing keeps the head across page swaps).
- `vercel.json` adds `X-Robots-Tag: noindex, nofollow` and `Cache-Control:
  no-store` on the path (the SPA rewrite serves `index.html`, so this is the
  only server-side signal).
- **Do not** add a `Disallow` to `robots.txt` — that advertises the URL and
  blocks crawlers from ever seeing the noindex.

## Files

```
assets/Coverys_Physician_application_-_All_states_2025.docx   blank template (committed; not served)
data/coverys-field-map.json          302 keys → 358 form controls, pinned to APP MPL 001 07/25
lib/fillCoverysApplication.js        DOCX fill by positional index (jszip; server-only)
lib/buildCoverysPayload.js           FormState → map keys; owns Gold's defaults, PREANSWERED, DISCLOSURE_KEYS, ROW_LIMITS
api/coverage-application.js          POST route, Node runtime, streams the .docx back
src/CoverageApplication.jsx          the 9-step form (state IS FormState — same keys)
src/theme.js                         C / F brand tokens, moved out of App.jsx so both files can import them
scripts/verify-field-map.js          template↔map guard; runs as `prebuild`
```

## How the fill works

The Coverys file is a real Word form: **212 legacy `FORMTEXT` fields** and
**146 `w14:checkbox` content controls**. Every text field is named `Text1`, so
names are useless. The map addresses controls **by position in document
order**, zero-based. Validated against the real document at full coverage
(212/212, 146/146) by rendering every page with each field labeled by its key.

That makes the map exact but brittle in one specific way: **if Coverys
reissues the form, indices shift and the tool writes correct answers into the
wrong boxes.** That failure is worse than an outage because the output still
looks like a valid application. Hence `scripts/verify-field-map.js`: it checks
control counts, the footer revision marker, section-anchor order, and index
bounds, and it runs as `prebuild` — so every `npm run build`, local or on
Vercel, fails if the template no longer matches the map. The fill function
also refuses to run on a count mismatch.

The template ships with the function via `includeFiles: "assets/**"` in
`vercel.json` (belt) and an `import.meta.url` read that Vercel's file tracer
follows (braces).

### Five boxes cannot be ticked

In the Telemedicine (cont.) section, the Yes/No boxes on questions 5–8 and the
Audio / Video / Virtual Network / Other row are **literal ☐ glyphs in body
text**, not form controls. `buildCoverysPayload.js` routes those answers into
the adjacent text fields, led with "Yes —" / "No —". Don't "fix" this by
string-replacing the glyphs — the replacement hits every ☐ in the paragraph,
including ones that should stay unticked.

## Form structure

Nine steps, mobile-first (most physicians will do this on a phone):

| # | Step | Form section |
|---|------|--------------|
| 1 | About you (+ practice name/address) | Part II |
| 2 | Coverage requested | Part III |
| 3 | Sites & licensure | Parts III–IV |
| 4 | Training & boards | Part IV |
| 5 | Your practice (LTC, med director, telemedicine, pain, chaperone) | Part IV |
| 6 | Confirm pre-filled | Part IV |
| 7 | Prior carriers | Part VI |
| 8 | Disclosures | Parts VII–VIII |
| 9 | Review & download | — |

**Part I (producer) is never shown and is left blank on purpose.** The
broker — Arthur J. Gallagher Risk Management Services LLC — completes Part I
when the physician sends them the application (Josh's call, 2026-08-17).
`PRODUCER.agency` in `lib/buildCoverysPayload.js` is `""` so nothing is
written there.

**The component's state object is the `FormState` contract** documented as a
JSDoc typedef in `lib/buildCoverysPayload.js` — same keys, same
`"Yes" | "No" | ""` strings. The API guard (`looksLikeFormState`) checks the
shape. Rename a field in one place and you must rename it in all three. (The
original prototype component used different keys and would have 400'd on every
submission — that's why the form was rebuilt on FormState directly.)

### Fixed row counts

The carrier's tables have fixed capacity: **4 service locations, 3 licenses,
4 prior carriers, 4 telemedicine states** (`ROW_LIMITS`). The UI lets the
applicant add more, marks the overflow rows, and tells them those rows go on
an attached sheet. Nothing is silently truncated.

### Step 6 — the pre-filled step

Eleven Part IV exposures that don't arise in post-acute physiatry or internal
medicine (surgery, bariatric, deliveries, C-sections, spinal, ENT plastics,
correctional, ER staffing, home health, research, surgi-center) are answered
`No` by default and shown as a reviewable list. Every default is **visible and
overridable**. When an applicant overrides one, the builder deliberately writes
**nothing** for that exposure — it doesn't guess at follow-ups — and the review
step names the supplemental form they now need. Don't "improve" this by
inferring answers.

### Step 8 — disclosures

Never pre-filled. Carries the visible "Gold does not retain these answers"
line — true only while the retention rules above hold. The carrier's form has
**no free-text boxes** for disclosure explanations (they go on separate
sheets), so the UI doesn't collect explanation text it would only discard. The
free-text boxes that do exist (practice changes, telemedicine scope, pain
modalities, medical director locations) carry a "no patient identifiers" note.

## Signatures

All signature fields are left empty. The physician signs by hand after
downloading. The form needs an applicant signature, a producer (broker)
signature, and a second signature on the State Disclosure Addendum. State-
conditional notice pages (ME/NH variant, ME/NJ anti-fraud statements) are not
selected by this tool; applicant and broker handle that.

## Local development

There is no `vercel dev` in this repo. `npm run dev` serves the UI; the
download button will 404 without something answering `/api/coverage-application`.
For an end-to-end local run, a throwaway Node shim that imports the handler,
parses JSON into `req.body`, adds `res.status/json/send`, and proxies
everything else to Vite is enough (that's how it was verified — the downloaded
`.docx` was unzipped and every UI-entered value checked against its adjacent
label in `word/document.xml`). Preview deploys on a branch are the real test.

## When Coverys reissues the form

1. Drop the new `.docx` into `assets/` (same filename, or update the three
   path references).
2. `npm run verify:field-map` — it will fail and tell you why.
3. Re-derive indices by walking the new document in order: label each control
   by surrounding text, render a calibration copy with every field printed as
   its own key, confirm placement page by page. That catches off-by-one
   immediately.
4. Bump `mapVersion` and `revision` in `data/coverys-field-map.json`.
5. Re-render all pages and check them before shipping.

Do not hand-edit indices without a calibration render. Positional maps fail
silently.

## Open items (before the link goes to a physician)

- [ ] Kate reviews the page copy for producer-licensing posture, and the
      no-retention design for the disclosure and medical-condition questions.
- [ ] Production E2E at https://www.goldpmr.com/coverage-application with a
      real physician's data pattern (not lorem ipsum): fill, download, open
      in Word, confirm every answer landed. (Local browser E2E done Aug 16;
      prod function verified Aug 17 — POST returns the filled .docx with the
      right headers — so what remains is a human read-through in Word.)
- [ ] Decide who sends the link and how (post-offer email template).

## Shipped (Aug 16 2026, commit `d4cf34b`, merged to `main` Aug 17)

- Positional DOCX fill, verified 0 unmapped keys / well-formed XML on a
  realistic sample; verifier wired as `prebuild`.
- 9-step form on FormState with Gold defaults, row-limit notices, override
  semantics, no-PHI notes, beforeunload guard, mobile layout.
- Route unlisted + noindex (meta + header); no analytics; nothing persisted.
