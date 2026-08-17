/**
 * POST /api/coverage-application
 *
 * Fills the Coverys application in memory and streams it back as a download.
 *
 * NOTHING IS PERSISTED. No database write, no object storage, no email.
 * The request body contains the applicant's date of birth, license numbers,
 * and claims history — it must not be logged, echoed into an error message,
 * or forwarded anywhere. If you add observability here, log the SHAPE of the
 * request (field counts, duration, status) and never its contents.
 *
 * Runtime: Node (Vercel default for api/*.js) — jszip needs Buffer. This is
 * deliberately NOT `runtime: 'edge'` like api/contact.js.
 *
 * The blank template ships with the function via `includeFiles` in
 * vercel.json (belt) and the import.meta.url read below (braces).
 */

import { readFile } from "node:fs/promises";
import { fillCoverysApplication, MAP_VERSION, FORM_REVISION } from "../lib/fillCoverysApplication.js";
import { buildCoverysPayload } from "../lib/buildCoverysPayload.js";

const TEMPLATE = new URL(
  "../assets/Coverys_Physician_application_-_All_states_2025.docx",
  import.meta.url
);

/** A full form is well under 50 KB of JSON; anything near this isn't ours. */
const MAX_BODY_BYTES = 200 * 1024;

/** Rough guard against a payload that isn't our form. */
function looksLikeFormState(v) {
  if (!v || typeof v !== "object") return false;
  return (
    Array.isArray(v.serviceLocations) &&
    Array.isArray(v.licenses) &&
    Array.isArray(v.priorCarriers) &&
    v.disclosures && typeof v.disclosures === "object" &&
    v.overrides && typeof v.overrides === "object"
  );
}

function safeFilename(last) {
  const clean = String(last || "Applicant").replace(/[^A-Za-z0-9-]/g, "").slice(0, 40) || "Applicant";
  return `Coverys_Application_${clean}.docx`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const declared = Number(req.headers["content-length"] || 0);
  if (declared > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Request too large." });
  }

  if (!looksLikeFormState(req.body)) {
    return res.status(400).json({ error: "Request body isn't a coverage application." });
  }

  const started = Date.now();
  try {
    const state = req.body;
    const answers = buildCoverysPayload(state);
    const template = await readFile(TEMPLATE);

    const { buffer, unknownKeys, filledTextFields, tickedCheckboxes } =
      await fillCoverysApplication(template, answers);

    if (unknownKeys.length) {
      // Key NAMES only — these are schema identifiers, never applicant data.
      console.warn(
        `[coverage-application] dropped ${unknownKeys.length} unmapped keys: ${unknownKeys.join(", ")}`
      );
    }
    console.info(
      `[coverage-application] filled ${filledTextFields} text fields, ` +
        `${tickedCheckboxes} boxes (map ${MAP_VERSION}, form ${FORM_REVISION}) in ${Date.now() - started}ms`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename(state.lastName)}"`);
    res.setHeader("Content-Length", String(buffer.length));
    // Belt and braces: never let a proxy or the browser hold a copy.
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    return res.status(200).send(buffer);
  } catch (err) {
    // Deliberately opaque. An error string here could echo applicant data.
    console.error("[coverage-application] fill failed:", err && err.message);
    return res.status(500).json({
      error: "We couldn't build the application. Nothing was saved — please try again.",
    });
  }
}
