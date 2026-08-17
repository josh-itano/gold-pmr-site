/**
 * fillCoverysApplication.js
 *
 * Fills the Coverys Healthcare Provider Professional Liability Application
 * (revision APP MPL 001 07/25) by positional index of its native Word form
 * controls, and returns the completed .docx as a Buffer.
 *
 * Why positional: every legacy text field in the source document is named
 * "Text1", so field names carry no information. Checkboxes are content
 * controls with unique but meaningless w:id values. Document order is the
 * only stable identifier, which is why the map is pinned to a form revision.
 *
 * Server-only (jszip + Buffer). Never import from the client bundle.
 */

import JSZip from "jszip";
import fieldMap from "../data/coverys-field-map.json" with { type: "json" };

/**
 * @typedef {string | number | boolean | null | undefined} FieldValue
 * @typedef {Record<string, FieldValue>} CoverysAnswers  Flat payload keyed by the dotted names in coverys-field-map.json.
 */

const MAP = fieldMap.fields;
export const MAP_VERSION = fieldMap.mapVersion;
export const FORM_REVISION = fieldMap.revision;

/* ------------------------------------------------------------------ */
/* XML helpers                                                        */
/* ------------------------------------------------------------------ */

const BALLOT_EMPTY = "☐"; // ☐
const BALLOT_X = "☒"; // ☒

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Byte offsets of every match, in document order. */
function offsetsOf(xml, needle) {
  const out = [];
  let i = xml.indexOf(needle);
  while (i !== -1) {
    out.push(i);
    i = xml.indexOf(needle, i + needle.length);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Text fields                                                        */
/* ------------------------------------------------------------------ */

/**
 * A legacy FORMTEXT field looks like:
 *   <w:r>…<w:fldChar w:fldCharType="begin"><w:ffData>…<w:textInput/>…
 *   <w:r>…<w:instrText> FORMTEXT </w:instrText></w:r>
 *   <w:r>…<w:fldChar w:fldCharType="separate"/></w:r>
 *   <w:r>…<w:t> </w:t></w:r>          <-- the displayed result, 1..n runs
 *   <w:r>…<w:fldChar w:fldCharType="end"/></w:r>
 *
 * We rewrite the run(s) between "separate" and "end", preserving the first
 * run's formatting so the filled text inherits the form's Arial 10pt.
 */
function textFieldRegions(xml) {
  const regions = [];
  const SEPARATE = '<w:fldChar w:fldCharType="separate"/>';
  const END = '<w:fldChar w:fldCharType="end"/>';

  for (const ff of offsetsOf(xml, "<w:ffData>")) {
    const ffClose = xml.indexOf("</w:ffData>", ff);
    if (ffClose === -1) continue;
    // Only text inputs. Skip any other ffData kind defensively.
    if (!xml.slice(ff, ffClose).includes("<w:textInput")) continue;

    const sep = xml.indexOf(SEPARATE, ffClose);
    if (sep === -1) continue;
    // The "separate" fldChar sits inside its own run. Start the result region
    // AFTER that run closes, otherwise the region opens with a stray </w:r>
    // and the rewritten XML is unbalanced.
    const sepRunClose = xml.indexOf("</w:r>", sep);
    if (sepRunClose === -1) continue;
    const resultStart = sepRunClose + "</w:r>".length;

    const end = xml.indexOf(END, resultStart);
    if (end === -1) continue;
    // Walk back to the opening tag of the run that carries the "end" fldChar.
    const runStart = xml.lastIndexOf("<w:r ", end) > xml.lastIndexOf("<w:r>", end)
      ? xml.lastIndexOf("<w:r ", end)
      : xml.lastIndexOf("<w:r>", end);
    if (runStart === -1 || runStart < resultStart) continue;

    regions.push({ start: resultStart, end: runStart });
  }
  return regions;
}

/** Rebuild a result region as a single run carrying `value`. */
function renderResultRun(region, value) {
  const runMatch = region.match(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/);
  if (!runMatch) return region;

  let run = runMatch[0];
  const texts = run.match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g);
  const replacement = `<w:t xml:space="preserve">${escapeXml(value)}</w:t>`;

  if (!texts || texts.length === 0) {
    run = run.replace("</w:r>", `${replacement}</w:r>`);
  } else {
    run = run.replace(texts[0], replacement);
    for (const extra of texts.slice(1)) run = run.replace(extra, "");
  }
  return run;
}

/* ------------------------------------------------------------------ */
/* Checkboxes                                                         */
/* ------------------------------------------------------------------ */

function checkboxBlocks(xml) {
  const blocks = [];
  for (const cb of offsetsOf(xml, "<w14:checkbox>")) {
    const contentOpen = xml.indexOf("<w:sdtContent>", cb);
    if (contentOpen === -1) continue;
    const contentClose = xml.indexOf("</w:sdtContent>", contentOpen);
    if (contentClose === -1) continue;
    blocks.push({ prStart: cb, contentEnd: contentClose });
  }
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Fill                                                               */
/* ------------------------------------------------------------------ */

function resolve(answers) {
  const text = new Map();
  const ticked = new Set();
  const unknownKeys = [];

  for (const [key, raw] of Object.entries(answers)) {
    if (raw === null || raw === undefined || raw === "") continue;
    const field = MAP[key];
    if (!field) {
      unknownKeys.push(key);
      continue;
    }

    if (field.type === "text") {
      text.set(field.index, String(raw));
    } else if (field.type === "checkbox") {
      if (raw === true || raw === "true" || raw === 1) ticked.add(field.index);
    } else {
      // yesno — accept booleans or the strings "Yes"/"No" in any casing
      const v = typeof raw === "boolean" ? raw : String(raw).trim().toLowerCase() === "yes";
      ticked.add(v ? field.yes : field.no);
    }
  }
  return { text, ticked, unknownKeys };
}

/**
 * @param {Buffer|ArrayBuffer|Uint8Array} template  Raw bytes of the blank Coverys .docx
 * @param {CoverysAnswers} answers   Flat object keyed by the dotted names in the field map
 * @returns {Promise<{ buffer: Buffer, unknownKeys: string[], filledTextFields: number, tickedCheckboxes: number }>}
 *   `unknownKeys` are payload keys that aren't in the map — log these, they're silently dropped.
 */
export async function fillCoverysApplication(template, answers) {
  const zip = await JSZip.loadAsync(template);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Not a valid .docx: word/document.xml is missing.");

  let xml = await docFile.async("string");

  const { text, ticked, unknownKeys } = resolve(answers);

  const textRegions = textFieldRegions(xml);
  const boxes = checkboxBlocks(xml);

  if (textRegions.length !== fieldMap.counts.textFields || boxes.length !== fieldMap.counts.checkboxes) {
    throw new Error(
      `Template does not match field map ${MAP_VERSION} (${FORM_REVISION}). ` +
        `Found ${textRegions.length} text fields and ${boxes.length} checkboxes; ` +
        `expected ${fieldMap.counts.textFields} and ${fieldMap.counts.checkboxes}. ` +
        `Coverys has almost certainly issued a new form revision — re-map before shipping.`
    );
  }

  /* Edit back-to-front so earlier offsets stay valid. */
  const edits = [];

  textRegions.forEach((region, i) => {
    const value = text.get(i);
    if (value === undefined) return;
    edits.push({
      start: region.start,
      end: region.end,
      replacement: renderResultRun(xml.slice(region.start, region.end), value),
    });
  });

  boxes.forEach((box, i) => {
    if (!ticked.has(i)) return;
    const segment = xml
      .slice(box.prStart, box.contentEnd)
      .replace('<w14:checked w14:val="0"/>', '<w14:checked w14:val="1"/>')
      .split(BALLOT_EMPTY)
      .join(BALLOT_X);
    edits.push({ start: box.prStart, end: box.contentEnd, replacement: segment });
  });

  edits.sort((a, b) => b.start - a.start);
  for (const e of edits) {
    xml = xml.slice(0, e.start) + e.replacement + xml.slice(e.end);
  }

  zip.file("word/document.xml", xml);
  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return {
    buffer,
    unknownKeys,
    filledTextFields: text.size,
    tickedCheckboxes: ticked.size,
  };
}
