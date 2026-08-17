/**
 * verify-field-map.js
 *
 * Guards against the one failure mode that matters: Coverys reissues the form,
 * every positional index shifts, and the tool silently writes the applicant's
 * NPI into the "annual premium" box.
 *
 * Runs as `prebuild` (so every Vercel build and local `npm run build` is gated)
 * and on demand:
 *   npm run verify:field-map
 *
 * Exits non-zero if the template no longer matches the map.
 */

import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import fieldMap from "../data/coverys-field-map.json" with { type: "json" };

const TEMPLATE = new URL(
  "../assets/Coverys_Physician_application_-_All_states_2025.docx",
  import.meta.url
);

/** Anchors that must appear, in this order, in the document text. */
const ORDERED_ANCHORS = [
  "PART I – PRODUCER INFORMATON", // sic — the typo is in the carrier's form
  "PART II – APPLICANT INFORMATION",
  "PART III – COVERAGE INFORMATION",
  "Licensure",
  "Education",
  "Practice Activities",
  "Telemedicine",
  "Employees And Additional Insureds",
  "PART VI – PRIOR INSURANCE CARRIERS",
  "CLAIM HISTORY",
  "SUPPLEMENTAL INFORMATION",
];

function countOccurrences(haystack, needle) {
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n++;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}

async function main() {
  const buf = await readFile(TEMPLATE);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml").async("string");

  const failures = [];

  // 1. Control counts must match exactly.
  const textFields = countOccurrences(xml, "<w:textInput");
  const checkboxes = countOccurrences(xml, "<w14:checkbox>");

  if (textFields !== fieldMap.counts.textFields) {
    failures.push(`Text fields: found ${textFields}, map expects ${fieldMap.counts.textFields}.`);
  }
  if (checkboxes !== fieldMap.counts.checkboxes) {
    failures.push(`Checkboxes: found ${checkboxes}, map expects ${fieldMap.counts.checkboxes}.`);
  }

  // 2. Revision marker in the footer must be unchanged.
  const footer = await zip.file("word/footer1.xml")?.async("string");
  const revision = fieldMap.revision.replace(/\s+/g, "");
  const footerText = (footer ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, "");
  if (footer && !footerText.includes(revision)) {
    failures.push(`Footer no longer contains revision "${fieldMap.revision}". Coverys has reissued the form.`);
  }

  // 3. Section anchors must appear in the expected order.
  const plain = xml.replace(/<[^>]+>/g, "");
  let cursor = 0;
  for (const anchor of ORDERED_ANCHORS) {
    const at = plain.indexOf(anchor, cursor);
    if (at === -1) {
      failures.push(`Section anchor missing or moved: "${anchor}".`);
      break;
    }
    cursor = at;
  }

  // 4. Every index in the map must be in range.
  for (const [key, f] of Object.entries(fieldMap.fields)) {
    const idx = f.type === "yesno" ? [f.yes, f.no] : [f.index];
    const limit = f.type === "text" ? textFields : checkboxes;
    for (const i of idx) {
      if (i < 0 || i >= limit) failures.push(`${key}: index ${i} out of range (0..${limit - 1}).`);
    }
  }

  if (failures.length) {
    console.error(`\n✗ Field map ${fieldMap.mapVersion} does NOT match the template.\n`);
    for (const f of failures) console.error(`  · ${f}`);
    console.error(
      `\nDo not deploy. Re-map against the new revision before the form goes live —\n` +
        `a stale positional map writes correct answers into the wrong boxes, which is\n` +
        `worse than an outage because it looks like a valid application.\n`
    );
    process.exit(1);
  }

  console.log(
    `✓ Field map ${fieldMap.mapVersion} matches ${fieldMap.revision} ` +
      `(${textFields} text fields, ${checkboxes} checkboxes, ${Object.keys(fieldMap.fields).length} mapped keys).`
  );
}

main().catch((e) => {
  console.error("verify-field-map failed:", e);
  process.exit(1);
});
