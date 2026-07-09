# Careers Funnel & Integration

How goldpmr.com connects to **careers.goldpmr.com** (custom Next.js app on Vercel,
GoldOS-connected).

## Current state — funnel by link-out (shipped)

The marketing site does **not** host job listings or physician intake. Both live
on the careers site. Every physician-side apply path funnels out with UTM
attribution; facility inquiries stay on this site's contact form.

Outbound touchpoints, each with a distinct `utm_content` (source/medium/campaign
are constant — analytics groups on them; vary only content):

| utm_content | Where |
|---|---|
| `physicians-hero` | Physicians hero — "View Open Positions →" |
| `positions` | Physicians "Open Positions" section — "View Open Roles →" |
| `comp-estimator` | Comp estimator payoff panel — "Explore Open Roles →" |
| `new-markets` | Physicians — "tell us where you are" |
| `footer-careers` | Footer · Company · Careers |
| `footer-positions` | Footer · Physicians · Open Positions |
| `contact-redirect` | Contact form — physician redirect banner |

All are real `<a>` tags (crawlable, middle-clickable), `target=_blank`,
`rel=noopener noreferrer`. Built by `careersUrl(content)` in `src/App.jsx`.

Base URL is the `CAREERS_URL` constant in `src/App.jsx`. If the live listings
move to a path (e.g. `/jobs`), change that one constant.

## Contact form is facility-only

The physician tab and resume upload were removed. `api/contact.js` validates
`type === 'facility'` and no longer emails a resume link. The Supabase insert is
unchanged; `resume_path` is now always null. Existing physician rows and the
`resumes` storage bucket are untouched. The upload/`resumePath` code in the
handler is unreachable (the site never sends a resume) and can be pruned in a
later low-risk cleanup once facility submissions are confirmed healthy.

---

## Fast-follow — stream live openings (NOT yet built)

Goal: render the top N current openings on the Physicians page and deep-link each
to its posting, so the marketing site shows the real, always-current list instead
of funneling to a generic landing page.

**Blocker:** the careers app exposes no jobs feed. Probed `/api/jobs`,
`/api/openings`, `/api/positions`, `/api/careers` — all 404. It is a custom
Next.js app, not a hosted ATS, so there is no vendor jobs API to consume.

### What the careers app needs to expose

A public, cacheable JSON endpoint — e.g. `GET https://careers.goldpmr.com/api/jobs`
— CORS-enabled for `https://goldpmr.com`, returning current openings:

```json
{
  "jobs": [
    {
      "id": "irf-md-lv-2026",
      "title": "IRF Medical Director",
      "location": "Las Vegas, NV",
      "type": "Full-time",
      "specialty": "PM&R",
      "url": "https://careers.goldpmr.com/jobs/irf-md-lv-2026",
      "posted_at": "2026-07-01"
    }
  ]
}
```

- `url` is the per-job deep link the marketing rows link to (append the same UTM
  params as the link-out touchpoints).
- Keep it a thin projection of live openings — no auth, no PII. It is public data.
- Set `Cache-Control` (e.g. `s-maxage=300`) so Vercel's edge caches it.

### What this repo builds once that exists

A "Top openings" strip in the Physicians `#positions` section that fetches the
feed and renders each role, deep-linking to `job.url` with
`utm_content=position-<id>`. Graceful fallback: if the fetch fails or returns
zero jobs, fall back to the current "View Open Roles →" link-out — so a feed
outage never leaves the section empty. Prefer fetching through a small function
in this repo that proxies + caches the feed, to avoid a hard client dependency on
the careers app's uptime and CORS.

Build the consumer against the **real** JSON shape, not this sketch — confirm
field names with whoever implements the endpoint.
