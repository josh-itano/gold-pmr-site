// Brand Kit — Edition 01 · 2026. Page 05 (Color) + page 12 (UI color roles).
export const C = {
  // GOLDS. #C9A227 is DECORATIVE ONLY — the mark, rules, and large display on
  // dark grounds. It is 2.4:1 on white, so it fails even the 3:1 large-text bar.
  // Never text, never controls, never state. Any gold text/link uses deepGold.
  gold: "#C9A227",        // decorative accent (fills, rules, numerals on ink)
  goldLight: "#E8D48B",   // tint / glow
  deepGold: "#846B1A",    // Accent — links, active, interactive, focus ring (AA 5.1:1)

  // NEUTRALS — kit UI color roles.
  dark: "#0F172A",        // Ink — primary text, and now dark grounds
  navy: "#F0F4F8",        // Surface — alternating sections, cards, panels
  slate: "#FFFFFF",       // Ground — card surfaces
  white: "#FFFFFF",       // Ground — page background
  light: "#F8FAFC",
  line: "#E2E8F0",        // Line — dividers, borders

  // Muted. The kit names Slate Gray #64748B here, but that swatch is 4.76:1 on
  // White and only 4.31:1 on Mist — it fails the kit's own AA floor on the very
  // surface the kit tells you to put sections and tiles on. The kit's contrast
  // table never pairs Slate with Mist, so the conflict went unnoticed. Darkened
  // one step: 5.41:1 on White, 4.90:1 on Mist. Flag for brand review.
  muted: "#5D6B80",
  mutedLight: "#334155",  // label text, one step darker than Muted

  goldSoft: "rgba(201,162,39,0.08)", goldGlow: "rgba(201,162,39,0.15)",

  // SEMANTIC. The kit defines no success/danger palette. These are the
  // conventional hues darkened until they clear WCAG AA (4.5:1) on white,
  // per the kit's digital-accessibility rules. Flag for brand review.
  green: "#047857", red: "#B91C1C", amber: "#B45309",
};

// Outfit for display, headings, numerals. Jost for body and UI. System
// fallback per kit page 12. The kit ships Light 300 / Regular 400 / Medium 500
// only — there is no bold in this identity.
export const F = {
  display: "'Outfit', system-ui, sans-serif",
  body: "'Jost', system-ui, sans-serif",
};
