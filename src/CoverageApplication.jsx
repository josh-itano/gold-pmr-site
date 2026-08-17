import { useState, useEffect, useMemo } from "react";
import { C, F } from "./theme";
import { Btn, Input, Badge } from "./App";
import {
  PREANSWERED, DISCLOSURE_KEYS, ROW_LIMITS, COVERAGE_TYPES, SCOPES, PRACTICE_TYPES,
  BOARD_BODIES, TELE_MEDIA, requiredAttachments,
} from "../lib/buildCoverysPayload.js";

// ===== COVERAGE APPLICATION (unlisted, /coverage-application) =====
// An incoming physician (post-offer, pre-contract) answers nine short steps and
// downloads the Coverys professional liability application filled in, ready to
// sign and send to Gold's broker. Gold PM&R is not a licensed producer: this
// prepares a document, it does not solicit insurance or request a quote — the
// copy below is written to stay on that side of the line.
//
// NOTHING IS RETAINED. State lives in this component only; the download POSTs it
// to /api/coverage-application, which fills the .docx in memory and streams it
// back. No storage, no email, no analytics on this route. See
// docs/COVERAGE-APPLICATION.md before changing anything here.
//
// The state object IS the FormState contract in lib/buildCoverysPayload.js
// (same keys, same Yes/No strings). Don't rename fields here without updating
// the builder and the API guard.

const YN = ["Yes", "No"];
const blankTraining = { institution: "", specialty: "", degree: "", completed: "" };
const blankLocation = { location: "", specialty: "", hoursPerWeek: "", hasCurrentCoverage: "No", currentCarrier: "", seekingCoverage: "Yes" };
const blankLicense = { state: "", number: "", percentOfPractice: "", servicesProvided: "" };
const blankCarrier = { insurer: "", coverageFrom: "", coverageTo: "", policyNumber: "", annualPremium: "", coverageType: "", retroactiveDate: "", limitsOfLiability: "", specialtyPracticed: "", tailPurchased: "No", statesCovered: "", anyClaims: "No" };
const blankTeleState = { state: "", hoursPerWeek: "", percentOfPractice: "" };

// Gold's starting answers. Every one is visible on its step and can be changed.
const INITIAL = {
  lastName: "", firstName: "", middleInitial: "", gender: "", dateOfBirth: "", npi: "", email: "", phone: "",
  practiceName: "Gold Physical Medicine and Rehabilitation, PC", practiceWebsite: "www.goldpmr.com",
  practiceAddress: "", residenceAddress: "",
  practiceAddressIsMailing: true, practiceAddressIsBilling: true, residenceAddressIsMailing: false, residenceAddressIsBilling: false,
  coverageType: "Claims-Made", effectiveFrom: "", effectiveTo: "", retroactiveDate: "", limitPerClaim: "", limitAggregate: "",
  scope: "Full Time", hoursPerWeek: "", hoursPerMonth: "", partTimeSince: "",
  practiceType: "Individual / Independent Contractor", entityName: "",
  serviceLocations: [{ ...blankLocation }],
  licenses: [{ ...blankLicense }],
  priorCarriers: [{ ...blankCarrier }],
  medicalSchool: { ...blankTraining }, internship: { ...blankTraining }, residency: { ...blankTraining }, fellowship: { ...blankTraining },
  ecfmgCertified: "", boardCertified: "", boardBody: "", boardSpecialties: "",
  specialty: "Physical Medicine & Rehabilitation", changedInPastFiveYears: "", changedExplanation: "",
  longTermCare: "Yes", ltcSeekingCoverage: "Yes", ltcPatientsWithoutPriorRelationship: "", ltcPercentOfPractice: "",
  medicalDirector: "", mdSeekingCoverage: "", mdPercentOfPractice: "", mdLocations: "",
  telemedicine: "", teleHoursPerWeek: "", teleOtherHoursPerWeek: "", teleScopeAndVendors: "", teleMedia: [], teleMediaOther: "",
  telePatientsWithoutPriorRelationship: "", teleByState: [{ ...blankTeleState }],
  painManagement: "", painModalities: "", chaperonePolicy: "",
  overrides: {}, overrideDetail: {},
  disclosures: {},
};

const STEPS = [
  { id: "you", label: "About you", part: "Part II" },
  { id: "coverage", label: "Coverage requested", part: "Part III" },
  { id: "sites", label: "Sites & licensure", part: "Parts III–IV" },
  { id: "training", label: "Training & boards", part: "Part IV" },
  { id: "practice", label: "Your practice", part: "Part IV" },
  { id: "confirm", label: "Confirm pre-filled", part: "Part IV" },
  { id: "carriers", label: "Prior carriers", part: "Part VI" },
  { id: "disclosures", label: "Disclosures", part: "Parts VII–VIII" },
  { id: "review", label: "Review & download", part: "" },
];

/* Question wording for the disclosure step. The state keys must match
   DISCLOSURE_KEYS in lib/buildCoverysPayload.js — that file owns the mapping
   to the carrier's form; this one owns how the question reads. */
const DISCLOSURE_QUESTIONS = {
  claim_ever: "Have you ever had a claim?",
  claim_pending: "Do you know of any pending claim or incident — including a request for patient records — that may lead to a claim?",
  claim_reported: "If there are incidents, have they been reported to your current carrier?",
  lic_action: "Has your medical license ever been revoked, denied, suspended, surrendered, modified, or restricted?",
  dea_action: "Has your federal narcotic license ever been revoked, denied, suspended, surrendered, modified, or restricted?",
  priv_action: "Have hospital staff or similar privileges ever been affected as the result of an investigation?",
  society_action: "Has membership in a professional society ever been affected as the result of an investigation?",
  peer_review: "Have you been reviewed by a peer board pursuant to a disciplinary action against you?",
  board_complaint: "Has a complaint been filed against you by any State Board of Medicine?",
  dea_review: "Have you been reviewed by the DEA regarding prescribing practices?",
  medical_condition: "Do you currently have a medical condition that in any way impairs or limits your ability to practice medicine with reasonable skill and safety?",
  civil_criminal: "Have any civil or criminal charges been made against you by a state or federal authority?",
  conviction: "Have you been convicted of a criminal act, or found responsible for a civil complaint, filed by a state or federal authority?",
  ins_refused: "Have you ever had professional liability insurance refused, canceled, or non-renewed?",
};

// Enough validation to avoid an empty document — no more. The broker reviews
// the packet; the tool doesn't second-guess it.
function validateStep(id, s) {
  if (id === "you") {
    if (!s.lastName.trim() || !s.firstName.trim()) return "Enter your first and last name as they appear on your license.";
    if (!s.dateOfBirth.trim()) return "Enter your date of birth.";
    if (!/^\d{10}$/.test(s.npi.replace(/\D/g, ""))) return "Enter your 10-digit NPI.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) return "Enter a valid email address.";
  }
  if (id === "coverage" && !s.effectiveFrom.trim()) return "Enter the requested effective date.";
  return null;
}

/* ---------- primitives (site tokens; inline styles like the rest of App.jsx) ---------- */

const labelStyle = { display: "block", fontSize: 13, fontWeight: 400, color: C.mutedLight, marginBottom: 6 };
const hintStyle = { fontSize: 12, color: C.muted, marginTop: -14, marginBottom: 20, lineHeight: 1.5 };

function Field({ label, hint, wide, children }) {
  return <div className={wide ? "cov-wide" : undefined} style={{ marginBottom: 20 }}>
    {label && <span style={labelStyle}>{label}</span>}
    {children}
    {hint && <div style={{ ...hintStyle, marginTop: 6, marginBottom: 0 }}>{hint}</div>}
  </div>;
}

// Segmented single/multi choice as real buttons: 44 px targets, aria-pressed
// so state isn't conveyed by color alone (kit p12), bronze focus ring from the
// global :focus-visible rule.
function Choice({ options, value, onChange, multi }) {
  const isOn = (o) => (multi ? (value || []).includes(o) : value === o);
  const toggle = (o) => {
    if (!multi) return onChange(o);
    const cur = value || [];
    onChange(cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
  };
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
    {options.map((o) => {
      const on = isOn(o);
      return <button key={o} type="button" aria-pressed={on} onClick={() => toggle(o)}
        style={{ minHeight: 44, padding: "10px 16px", fontSize: 14, fontFamily: F.body, fontWeight: on ? 400 : 300, cursor: "pointer", transition: "all 0.2s",
          background: on ? C.dark : C.white, color: on ? C.white : C.dark, border: `1px solid ${on ? C.dark : C.line}` }}>
        {o}
      </button>;
    })}
  </div>;
}

function YesNo({ label, hint, value, onChange, children }) {
  return <div style={{ padding: "18px 0", borderBottom: `1px solid ${C.line}` }}>
    <div className="cov-yn" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: C.dark, fontWeight: 300 }}>{label}</p>
        {hint && <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{hint}</p>}
      </div>
      <div style={{ flexShrink: 0 }}><Choice options={YN} value={value} onChange={onChange} /></div>
    </div>
    {value === "Yes" && children && <div style={{ marginTop: 18, paddingLeft: 0 }}>{children}</div>}
  </div>;
}

function Block({ title, lede, children }) {
  return <div>
    <h2 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 500, lineHeight: 1.25, color: C.dark }}>{title}</h2>
    {lede && <p style={{ marginTop: 8, marginBottom: 28, fontSize: 14.5, lineHeight: 1.7, color: C.muted, fontWeight: 300 }}>{lede}</p>}
    {children}
  </div>;
}

function RowCard({ n, label, over, children }) {
  return <div style={{ border: `1px solid ${C.line}`, background: over ? "#FFFBEB" : C.light, padding: "16px 16px 0", marginBottom: 16 }}>
    <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: C.deepGold, fontFamily: F.display, fontWeight: 500, marginBottom: 14 }}>
      {label} {n}{over && <span style={{ color: C.amber, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}> — goes on an attached sheet</span>}
    </p>
    <div className="cov-grid">{children}</div>
  </div>;
}

function AddBtn({ onClick, remove, children }) {
  return <button type="button" onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", color: remove ? C.muted : C.deepGold, fontFamily: F.body, fontSize: 14, fontWeight: 400, padding: "8px 4px", minHeight: 44 }}>{remove ? "−" : "+"} {children}</button>;
}

function LimitNote({ count, limit, what }) {
  if (count <= limit) return null;
  const rows = count === limit + 1 ? `Row ${count} won't` : `Rows ${limit + 1}–${count} won't`;
  return <p style={{ fontSize: 13, color: C.amber, lineHeight: 1.6, margin: "4px 0 16px" }}>
    The carrier's form holds {limit} {what}. {rows} fit on the printed form — list {count === limit + 1 ? "it" : "them"} on a separate sheet and send it with your application.
  </p>;
}

function Divider({ children }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "28px 0 20px" }}>
    <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: C.mutedLight, fontFamily: F.display, fontWeight: 500, whiteSpace: "nowrap" }}>{children}</span>
    <span style={{ height: 1, flex: 1, background: C.line }} />
  </div>;
}

function Note({ children }) {
  return <div style={{ padding: "14px 18px", background: C.navy, borderLeft: `3px solid ${C.gold}`, fontSize: 13.5, lineHeight: 1.65, color: C.mutedLight, fontWeight: 300, marginBottom: 24 }}>{children}</div>;
}

const NO_PHI = "Please don't include patient names or other patient identifiers in any explanation — describe the circumstances only.";

/* ---------- page ---------- */

export default function CoverageApplication() {
  const [step, setStep] = useState(0);
  const [s, setS] = useState(INITIAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (v) => setS((p) => ({ ...p, [k]: v }));
  const setNested = (k, f) => (v) => setS((p) => ({ ...p, [k]: { ...p[k], [f]: v } }));
  const setDisc = (k) => (v) => setS((p) => ({ ...p, disclosures: { ...p.disclosures, [k]: v } }));
  const rowUpdate = (key, i, field) => (v) => setS((p) => ({ ...p, [key]: p[key].map((r, j) => (j === i ? { ...r, [field]: v } : r)) }));
  const addRow = (key, blank) => () => setS((p) => ({ ...p, [key]: [...p[key], { ...blank }] }));
  const removeRow = (key, i) => () => setS((p) => ({ ...p, [key]: p[key].filter((_, j) => j !== i) }));
  const toggleOverride = (k) => setS((p) => ({ ...p, overrides: { ...p.overrides, [k]: !p.overrides[k] } }));

  const overridden = useMemo(() => Object.values(s.overrides).filter(Boolean).length, [s.overrides]);
  const flagged = useMemo(() => DISCLOSURE_KEYS.filter(([k]) => s.disclosures[k] === "Yes").length, [s.disclosures]);
  const dirty = s !== INITIAL;

  // Everything lives in memory. Warn before the tab closes with unsaved answers.
  useEffect(() => {
    if (!dirty || submitted) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, submitted]);

  const cur = STEPS[step];
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  const go = (dir) => {
    setError(null);
    if (dir > 0) {
      const msg = validateStep(cur.id, s);
      if (msg) { setError(msg); return; }
    }
    setStep((n) => Math.min(STEPS.length - 1, Math.max(0, n + dir)));
    document.getElementById("cov-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* Posts the form state, receives the filled .docx, and hands it straight to
     the browser. No upload, no email, no server-side copy. */
  async function handleDownload() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/coverage-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Coverys_Application_${(s.lastName || "Applicant").replace(/[^A-Za-z0-9-]/g, "")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSubmitted(true);
      document.getElementById("cov-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      setError("We couldn't build the application. Nothing was saved — please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Plain helper (not a component) so inputs keep identity — and focus — across renders.
  const tf = (label, k, extra = {}) => <Input label={label} value={s[k]} onChange={set(k)} {...extra} />;

  return <section id="cov-top" className="sec-hero" style={{ maxWidth: 800, margin: "0 auto", padding: "140px 40px 100px", scrollMarginTop: 90 }}>
    <style>{`
      .cov-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 0 20px; }
      .cov-wide { grid-column: 1 / -1; }
      .cov-card { padding: 40px; }
      @media (max-width: 640px) {
        .cov-grid { grid-template-columns: 1fr; }
        .cov-card { padding: 24px 20px; }
        .cov-yn { flex-direction: column; }
        .cov-nav { flex-direction: column-reverse; align-items: stretch !important; }
      }
    `}</style>

    <div style={{ textAlign: "center", marginBottom: 40 }}>
      <Badge>For Incoming Clinicians</Badge>
      <h1 style={{ fontFamily: F.display, fontSize: 32, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.2, margin: "16px 0 14px", color: C.dark }}>Prepare Your Coverage Application</h1>
      <p style={{ color: C.muted, fontSize: 16, fontWeight: 300, maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
        Answer nine short steps and we'll fill in the carrier's professional liability application for you to review, sign, and send to Gold's broker. Nothing you enter here is stored by Gold PM&amp;R.
      </p>
    </div>

    {submitted ? <Done lastName={s.lastName} onBack={() => setSubmitted(false)} /> : <div style={{ background: C.slate, border: `1px solid ${C.line}`, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
      {/* progress */}
      <div style={{ padding: "20px 40px 0" }} className="cov-card-head">
        <div role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Application progress" style={{ height: 3, background: C.line }}>
          <div style={{ height: "100%", width: `${pct}%`, background: C.gold, transition: "width 0.4s" }} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <span style={{ fontSize: 13, color: C.dark, fontFamily: F.display, fontWeight: 500 }}>Step {step + 1} of {STEPS.length}</span>
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: C.muted }}>{cur.label}{cur.part ? ` · ${cur.part}` : ""}</span>
        </div>
      </div>

      <div className="cov-card">
        {/* ---------------- ABOUT YOU ---------------- */}
        {cur.id === "you" && <Block title="About you" lede="Everything here is copied straight onto the carrier's application, so match your license exactly.">
          <div className="cov-grid">
            {tf("Last name", "lastName")}
            {tf("First name", "firstName")}
            {tf("Middle initial", "middleInitial")}
            {tf("Date of birth", "dateOfBirth", { placeholder: "MM/DD/YYYY" })}
            {tf("NPI number", "npi", { placeholder: "10 digits" })}
            {tf("Gender", "gender")}
            {tf("Email", "email", { type: "email" })}
            {tf("Phone", "phone", { type: "tel" })}
            <div className="cov-wide">{tf("Residence address", "residenceAddress", { placeholder: "Street, city, state, ZIP" })}</div>
          </div>
          <Divider>Practice</Divider>
          <div className="cov-grid">
            {tf("Practice name", "practiceName")}
            {tf("Practice website", "practiceWebsite")}
            <div className="cov-wide">{tf("Practice address", "practiceAddress", { placeholder: "Street, city, state, ZIP" })}</div>
          </div>
          <div className="cov-grid">
            <Field label="Use the practice address as">
              <Choice multi options={["Mailing", "Billing"]}
                value={[s.practiceAddressIsMailing && "Mailing", s.practiceAddressIsBilling && "Billing"].filter(Boolean)}
                onChange={(v) => setS((p) => ({ ...p, practiceAddressIsMailing: v.includes("Mailing"), practiceAddressIsBilling: v.includes("Billing"), residenceAddressIsMailing: v.includes("Mailing") ? false : p.residenceAddressIsMailing, residenceAddressIsBilling: v.includes("Billing") ? false : p.residenceAddressIsBilling }))} />
            </Field>
            <Field label="Use the residence address as">
              <Choice multi options={["Mailing", "Billing"]}
                value={[s.residenceAddressIsMailing && "Mailing", s.residenceAddressIsBilling && "Billing"].filter(Boolean)}
                onChange={(v) => setS((p) => ({ ...p, residenceAddressIsMailing: v.includes("Mailing"), residenceAddressIsBilling: v.includes("Billing"), practiceAddressIsMailing: v.includes("Mailing") ? false : p.practiceAddressIsMailing, practiceAddressIsBilling: v.includes("Billing") ? false : p.practiceAddressIsBilling }))} />
            </Field>
          </div>
        </Block>}

        {/* ---------------- COVERAGE ---------------- */}
        {cur.id === "coverage" && <Block title="Coverage requested" lede="If you're not sure about limits, leave them blank — the broker will use our group's standard.">
          <Field label="Type of coverage"><Choice options={COVERAGE_TYPES} value={s.coverageType} onChange={set("coverageType")} /></Field>
          <div className="cov-grid">
            {tf("Requested effective date", "effectiveFrom", { placeholder: "MM/DD/YYYY" })}
            {tf("Through", "effectiveTo", { placeholder: "MM/DD/YYYY" })}
            <div>{tf("Retroactive date", "retroactiveDate", { placeholder: "MM/DD/YYYY" })}<div style={hintStyle}>Claims-made only</div></div>
            {tf("Per claim limit", "limitPerClaim", { placeholder: "$1,000,000" })}
            {tf("Annual aggregate", "limitAggregate", { placeholder: "$3,000,000" })}
          </div>
          <Field label="Scope of coverage"><Choice options={SCOPES} value={s.scope} onChange={set("scope")} /></Field>
          <div className="cov-grid">
            {tf("Hours per week", "hoursPerWeek")}
            {tf("or hours per month", "hoursPerMonth")}
          </div>
          {s.scope === "Part Time" && <div>{tf("Date you began practicing part time", "partTimeSince", { placeholder: "MM/DD/YYYY" })}<div style={hintStyle}>20 hrs/week or 80 hrs/month or less</div></div>}
          <Field label="Type of practice"><Choice options={PRACTICE_TYPES} value={s.practiceType} onChange={set("practiceType")} /></Field>
          {s.practiceType !== "Individual / Independent Contractor" && tf("Entity name", "entityName")}
        </Block>}

        {/* ---------------- SITES & LICENSURE ---------------- */}
        {cur.id === "sites" && <Block title="Where you practice" lede="List each facility where you see patients. The carrier prices by location, so this drives your premium more than anything else on the form.">
          {s.serviceLocations.map((r, i) => <RowCard key={i} n={i + 1} label="Service location" over={i >= ROW_LIMITS.serviceLocations}>
            <div className="cov-wide"><Input label="Facility name, city & state" value={r.location} onChange={rowUpdate("serviceLocations", i, "location")} /></div>
            <Input label="Specialty / activities" value={r.specialty} onChange={rowUpdate("serviceLocations", i, "specialty")} />
            <Input label="Hours per week" value={r.hoursPerWeek} onChange={rowUpdate("serviceLocations", i, "hoursPerWeek")} />
            <Field label="Current coverage here?"><Choice options={YN} value={r.hasCurrentCoverage} onChange={rowUpdate("serviceLocations", i, "hasCurrentCoverage")} /></Field>
            <Field label="Requesting coverage here?"><Choice options={YN} value={r.seekingCoverage} onChange={rowUpdate("serviceLocations", i, "seekingCoverage")} /></Field>
            {r.hasCurrentCoverage === "Yes" && <div className="cov-wide"><Input label="Current carrier at this location" value={r.currentCarrier} onChange={rowUpdate("serviceLocations", i, "currentCarrier")} /></div>}
            {i > 0 && <div className="cov-wide" style={{ marginBottom: 12, marginTop: -8 }}><AddBtn remove onClick={removeRow("serviceLocations", i)}>Remove this location</AddBtn></div>}
          </RowCard>)}
          <LimitNote count={s.serviceLocations.length} limit={ROW_LIMITS.serviceLocations} what="service locations" />
          <AddBtn onClick={addRow("serviceLocations", blankLocation)}>Add another location</AddBtn>

          <Divider>Medical licensure</Divider>
          {s.licenses.map((r, i) => <RowCard key={i} n={i + 1} label="License" over={i >= ROW_LIMITS.licenses}>
            <Input label="State" value={r.state} onChange={rowUpdate("licenses", i, "state")} />
            <Input label="License number" value={r.number} onChange={rowUpdate("licenses", i, "number")} />
            <Input label="% of practice" value={r.percentOfPractice} onChange={rowUpdate("licenses", i, "percentOfPractice")} />
            <Input label="Services provided" value={r.servicesProvided} onChange={rowUpdate("licenses", i, "servicesProvided")} />
            {i > 0 && <div className="cov-wide" style={{ marginBottom: 12, marginTop: -8 }}><AddBtn remove onClick={removeRow("licenses", i)}>Remove this license</AddBtn></div>}
          </RowCard>)}
          <LimitNote count={s.licenses.length} limit={ROW_LIMITS.licenses} what="licenses" />
          <AddBtn onClick={addRow("licenses", blankLicense)}>Add another license</AddBtn>
        </Block>}

        {/* ---------------- TRAINING ---------------- */}
        {cur.id === "training" && <Block title="Training & board certification" lede="Attach your CV when you send the application — the carrier requires it either way.">
          {[["medicalSchool", "Medical school", "School, state / province, country"], ["internship", "Internship", "Institution"], ["residency", "Residency", "Institution"], ["fellowship", "Fellowship", "Institution"]].map(([k, label, ph]) => <div key={k}>
            <Divider>{label}</Divider>
            <div className="cov-grid">
              <div className="cov-wide"><Input label={label} value={s[k].institution} onChange={setNested(k, "institution")} placeholder={ph} /></div>
              {k === "medicalSchool"
                ? <Input label="Degree" value={s[k].degree} onChange={setNested(k, "degree")} placeholder="MD / DO" />
                : <Input label="Specialty" value={s[k].specialty} onChange={setNested(k, "specialty")} />}
              <Input label="Completed" value={s[k].completed} onChange={setNested(k, "completed")} placeholder="MM/YYYY" />
            </div>
          </div>)}
          <div style={{ marginTop: 8 }}>
            <YesNo label="Are you a foreign medical graduate certified by the ECFMG?" value={s.ecfmgCertified} onChange={set("ecfmgCertified")} />
            <YesNo label="Are you certified by an approved specialty board?" hint="Attach a copy of the certificate" value={s.boardCertified} onChange={set("boardCertified")}>
              <Field label="Certifying body"><Choice options={BOARD_BODIES} value={s.boardBody} onChange={set("boardBody")} /></Field>
              {tf("Specialties", "boardSpecialties")}
            </YesNo>
          </div>
        </Block>}

        {/* ---------------- PRACTICE ---------------- */}
        {cur.id === "practice" && <Block title="Your practice" lede="These are the exposures that actually shape a post-acute premium. Answer carefully — an unreported exposure is an uncovered one.">
          {tf("Medical specialty & subspecialties", "specialty", { placeholder: "e.g. Physical Medicine & Rehabilitation" })}
          <Note>{NO_PHI}</Note>
          <div>
            <YesNo label="Have your practice, employment, or procedures changed in the past five years?" value={s.changedInPastFiveYears} onChange={set("changedInPastFiveYears")}>
              {tf("Explain, including dates", "changedExplanation", { type: "textarea" })}
            </YesNo>

            <YesNo label="Do you practice in a long-term care facility?" value={s.longTermCare} onChange={set("longTermCare")}>
              <Field label="Are you seeking coverage for this exposure?"><Choice options={YN} value={s.ltcSeekingCoverage} onChange={set("ltcSeekingCoverage")} /></Field>
              <Field label="Do you see patients without a previously established relationship?"><Choice options={YN} value={s.ltcPatientsWithoutPriorRelationship} onChange={set("ltcPatientsWithoutPriorRelationship")} /></Field>
              {tf("Percentage of your overall practice", "ltcPercentOfPractice", { placeholder: "%" })}
            </YesNo>

            <YesNo label="Do you serve as a medical director?" value={s.medicalDirector} onChange={set("medicalDirector")}>
              <Field label="Are you seeking coverage for this exposure?"><Choice options={YN} value={s.mdSeekingCoverage} onChange={set("mdSeekingCoverage")} /></Field>
              {tf("Percentage of your overall practice", "mdPercentOfPractice", { placeholder: "%" })}
              {tf("Where", "mdLocations")}
              <div style={hintStyle}>Attach a copy of the contract</div>
            </YesNo>

            <YesNo label="Do you provide telemedicine services?" value={s.telemedicine} onChange={set("telemedicine")}>
              <div className="cov-grid">
                {tf("Telemedicine hours per week", "teleHoursPerWeek")}
                {tf("All other hours per week", "teleOtherHoursPerWeek")}
              </div>
              {tf("Scope of services and any companies you contract with", "teleScopeAndVendors", { type: "textarea" })}
              <Field label="Media used" hint="Select all that apply"><Choice multi options={TELE_MEDIA} value={s.teleMedia} onChange={set("teleMedia")} /></Field>
              {s.teleMedia.includes("Other") && tf("Other media — describe", "teleMediaOther")}
              <Field label="Do you treat patients without a previously established relationship?"><Choice options={YN} value={s.telePatientsWithoutPriorRelationship} onChange={set("telePatientsWithoutPriorRelationship")} /></Field>
              <Divider>Telemedicine by state</Divider>
              {s.teleByState.map((r, i) => <RowCard key={i} n={i + 1} label="State" over={i >= ROW_LIMITS.teleByState}>
                <Input label="State" value={r.state} onChange={rowUpdate("teleByState", i, "state")} />
                <Input label="Hours per week" value={r.hoursPerWeek} onChange={rowUpdate("teleByState", i, "hoursPerWeek")} />
                <Input label="% of practice" value={r.percentOfPractice} onChange={rowUpdate("teleByState", i, "percentOfPractice")} />
                {i > 0 && <div className="cov-wide" style={{ marginBottom: 12, marginTop: -8 }}><AddBtn remove onClick={removeRow("teleByState", i)}>Remove this state</AddBtn></div>}
              </RowCard>)}
              <LimitNote count={s.teleByState.length} limit={ROW_LIMITS.teleByState} what="states" />
              <AddBtn onClick={addRow("teleByState", blankTeleState)}>Add another state</AddBtn>
            </YesNo>

            <YesNo label="Do you provide pain management services?" value={s.painManagement} onChange={set("painManagement")}>
              {tf("Treatments and modalities used", "painModalities", { type: "textarea" })}
            </YesNo>

            <YesNo label="Do you have a chaperone policy?" hint="Attach a copy if yes" value={s.chaperonePolicy} onChange={set("chaperonePolicy")} />
          </div>
        </Block>}

        {/* ---------------- CONFIRM PRE-FILLED ---------------- */}
        {cur.id === "confirm" && <Block title="Confirm what we've pre-filled" lede="The carrier's form asks about exposures that don't come up in post-acute physiatry or internal medicine. We've answered them the way they almost always go. Read them, and change any that are wrong for you.">
          <div style={{ border: `1px solid ${C.line}` }}>
            {PREANSWERED.map((p, i) => {
              const changed = !!s.overrides[p.key];
              return <div key={p.key} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.line}`, background: changed ? "#FFFBEB" : C.white }}>
                <span aria-hidden="true" style={{ flexShrink: 0, width: 20, textAlign: "center", fontSize: 13, color: changed ? C.amber : C.green, fontFamily: F.display, marginTop: 2 }}>{changed ? "!" : "✓"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, lineHeight: 1.45, color: C.dark, fontWeight: 300 }}>{p.statement}</p>
                  <p style={{ fontSize: 12, marginTop: 4, color: C.muted }}>
                    Answered <span style={{ color: changed ? C.amber : C.mutedLight, fontWeight: 500 }}>{changed ? "Yes — left blank for you to complete" : p.defaultAnswer}</span>
                  </p>
                  {changed && <p style={{ fontSize: 12.5, marginTop: 6, color: C.mutedLight, lineHeight: 1.5 }}>We won't guess at the follow-up questions. You'll answer this section by hand on the downloaded form and add: <span style={{ fontWeight: 400 }}>{p.ifOverridden}</span>.</p>}
                </div>
                <button type="button" aria-pressed={changed} onClick={() => toggleOverride(p.key)}
                  style={{ flexShrink: 0, fontSize: 12.5, padding: "8px 12px", minHeight: 36, background: C.white, border: `1px solid ${C.line}`, color: C.deepGold, fontFamily: F.body, fontWeight: 400, cursor: "pointer" }}>
                  {changed ? "Undo" : "This applies to me"}
                </button>
              </div>;
            })}
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: C.muted }}>
            {overridden === 0 ? `All ${PREANSWERED.length} answered as pre-filled.` : `${overridden} of ${PREANSWERED.length} changed. Each one adds a supplemental form to your packet.`}
          </p>
        </Block>}

        {/* ---------------- PRIOR CARRIERS ---------------- */}
        {cur.id === "carriers" && <Block title="Prior insurance carriers" lede="The carrier wants ten years, most recent first. Send your declarations page and loss runs with the application.">
          {s.priorCarriers.map((r, i) => <RowCard key={i} n={i + 1} label="Carrier" over={i >= ROW_LIMITS.priorCarriers}>
            <div className="cov-wide"><Input label="Insurer / carrier" value={r.insurer} onChange={rowUpdate("priorCarriers", i, "insurer")} /></div>
            <Input label="From" value={r.coverageFrom} onChange={rowUpdate("priorCarriers", i, "coverageFrom")} placeholder="MM/DD/YYYY" />
            <Input label="To" value={r.coverageTo} onChange={rowUpdate("priorCarriers", i, "coverageTo")} placeholder="MM/DD/YYYY" />
            <Input label="Policy number" value={r.policyNumber} onChange={rowUpdate("priorCarriers", i, "policyNumber")} />
            <Input label="Annual premium" value={r.annualPremium} onChange={rowUpdate("priorCarriers", i, "annualPremium")} />
            <Input label="Coverage type" value={r.coverageType} onChange={rowUpdate("priorCarriers", i, "coverageType")} placeholder="Occurrence / Claims-made" />
            <Input label="Retroactive date" value={r.retroactiveDate} onChange={rowUpdate("priorCarriers", i, "retroactiveDate")} />
            <Input label="Limits of liability" value={r.limitsOfLiability} onChange={rowUpdate("priorCarriers", i, "limitsOfLiability")} placeholder="$1M / $3M" />
            <Input label="Specialty practiced" value={r.specialtyPracticed} onChange={rowUpdate("priorCarriers", i, "specialtyPracticed")} />
            <Input label="States covered" value={r.statesCovered} onChange={rowUpdate("priorCarriers", i, "statesCovered")} />
            <Field label="Tail purchased?"><Choice options={YN} value={r.tailPurchased} onChange={rowUpdate("priorCarriers", i, "tailPurchased")} /></Field>
            <Field label="Any claims?"><Choice options={YN} value={r.anyClaims} onChange={rowUpdate("priorCarriers", i, "anyClaims")} /></Field>
            {i > 0 && <div className="cov-wide" style={{ marginBottom: 12, marginTop: -8 }}><AddBtn remove onClick={removeRow("priorCarriers", i)}>Remove this carrier</AddBtn></div>}
          </RowCard>)}
          <LimitNote count={s.priorCarriers.length} limit={ROW_LIMITS.priorCarriers} what="carriers" />
          <AddBtn onClick={addRow("priorCarriers", blankCarrier)}>Add another carrier</AddBtn>
        </Block>}

        {/* ---------------- DISCLOSURES ---------------- */}
        {cur.id === "disclosures" && <Block title="Claims history & disclosures" lede="These are yours to answer and no one else's — nothing here is pre-filled. A Yes doesn't disqualify you; an omission does.">
          <Note>Answers in this section go to the carrier with your signed application. Gold PM&amp;R does not retain them. For any Yes, the carrier wants the circumstances on a separate sheet — {NO_PHI.charAt(0).toLowerCase() + NO_PHI.slice(1)}</Note>
          <div>
            {DISCLOSURE_KEYS.map(([k]) => <YesNo key={k} label={DISCLOSURE_QUESTIONS[k]} value={s.disclosures[k] || ""} onChange={setDisc(k)} />)}
          </div>
          {flagged > 0 && <p style={{ marginTop: 20, fontSize: 13, color: C.amber }}>{flagged} item{flagged > 1 ? "s" : ""} flagged. Attach a separate sheet for each — we'll list them at the end.</p>}
        </Block>}

        {/* ---------------- REVIEW ---------------- */}
        {cur.id === "review" && <Block title="Review & download" lede="We'll generate the carrier's own application, filled in with your answers, for you to read and sign.">
          <dl style={{ borderTop: `1px solid ${C.line}`, margin: 0 }}>
            {[
              ["Applicant", [s.firstName, s.middleInitial, s.lastName].filter(Boolean).join(" ") || "—"],
              ["NPI", s.npi || "—"],
              ["Specialty", s.specialty || "—"],
              ["Coverage", `${s.coverageType}, ${s.scope}`],
              ["Effective", s.effectiveFrom ? `${s.effectiveFrom} – ${s.effectiveTo || "?"}` : "—"],
              ["Limits", s.limitPerClaim ? `${s.limitPerClaim} / ${s.limitAggregate || "?"}` : "Group standard"],
              ["Service locations", `${s.serviceLocations.filter((r) => r.location).length} listed`],
              ["Licenses", `${s.licenses.filter((l) => l.state).length} listed`],
              ["Prior carriers", `${s.priorCarriers.filter((c) => c.insurer).length} listed`],
              ["Pre-filled sections", overridden === 0 ? `All ${PREANSWERED.length} confirmed` : `${overridden} changed`],
              ["Disclosures flagged", String(flagged)],
            ].map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: `1px solid ${C.line}`, fontSize: 14 }}>
              <dt style={{ color: C.muted, fontWeight: 300 }}>{k}</dt>
              <dd style={{ color: C.dark, fontWeight: 400, textAlign: "right", margin: 0 }}>{v}</dd>
            </div>)}
          </dl>

          <div style={{ marginTop: 28 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: C.mutedLight, fontFamily: F.display, fontWeight: 500, marginBottom: 12 }}>Send these with your signed application</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, color: C.dark, fontWeight: 300 }}>
              {requiredAttachments(s).map((a) => <li key={a} style={{ display: "flex", gap: 10, padding: "5px 0" }}><span aria-hidden="true" style={{ color: C.deepGold }}>+</span>{a}</li>)}
            </ul>
          </div>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: C.dark, fontWeight: 300 }}>
              Your answers build the file and download straight to your device — Gold PM&amp;R keeps no copy. Read it line by line, sign it, and send it to our broker with your attachments. Signing is what makes it an application; the broker's signature and the State Disclosure Addendum are completed with them.
            </p>
          </div>
        </Block>}

        {error && <p role="alert" style={{ marginTop: 20, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: C.red, fontSize: 13.5, lineHeight: 1.5 }}>{error}</p>}

        <div className="cov-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 32, paddingTop: 24, borderTop: `1px solid ${C.line}` }}>
          {step > 0 ? <Btn onClick={() => go(-1)}>← Back</Btn> : <span />}
          {step === STEPS.length - 1
            ? <Btn primary onClick={handleDownload} style={busy ? { opacity: 0.7, pointerEvents: "none" } : {}}>{busy ? "Building your application…" : "Download my application →"}</Btn>
            : <Btn primary onClick={() => go(1)}>Continue →</Btn>}
        </div>
      </div>
    </div>}

    <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 24, lineHeight: 1.6 }}>
      Fills Coverys form APP MPL 001 07/25. Gold PM&amp;R is not a licensed insurance producer; this tool prepares a document for you to sign and send to our broker.
    </p>
  </section>;
}

function Done({ lastName, onBack }) {
  return <div style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 56, textAlign: "center", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }} className="cov-card">
    <div style={{ fontSize: 40, marginBottom: 12, color: C.green }}>✓</div>
    <h2 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, lineHeight: 1.2, color: C.dark }}>Check your downloads</h2>
    <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.7, color: C.muted, fontWeight: 300, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
      The carrier's form is filled in and saved to your device. Read it through, sign it, and send it with your attachments to our broker. Gold PM&amp;R kept no copy of your answers.
    </p>
    <div style={{ marginTop: 28, display: "inline-block", textAlign: "left", border: `1px solid ${C.line}`, background: C.navy, padding: "14px 20px" }}>
      <p style={{ fontSize: 13, color: C.dark, fontWeight: 300, lineHeight: 1.6 }}>
        <span style={{ fontWeight: 500 }}>Coverys_Application_{(lastName || "Applicant").replace(/[^A-Za-z0-9-]/g, "")}.docx</span><br />
        <span style={{ color: C.muted }}>Unsigned draft · sign by hand after review</span>
      </p>
    </div>
    <p style={{ marginTop: 24, fontSize: 13, lineHeight: 1.6, color: C.muted, fontWeight: 300, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
      Closing this page clears everything you entered. Nothing is recoverable, so don't close it until the file has saved.
    </p>
    <div style={{ marginTop: 28 }}><Btn onClick={onBack}>Go back and edit</Btn></div>
  </div>;
}
