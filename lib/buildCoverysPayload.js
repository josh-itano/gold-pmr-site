/**
 * buildCoverysPayload.js
 *
 * Translates the web form's state into the flat, map-keyed payload that
 * fillCoverysApplication() consumes.
 *
 * This is the only place Gold's defaults live. Keep it separate from the UI
 * so the defaults can be reviewed, diffed, and tested without reading JSX.
 *
 * Pure module — no Node or DOM APIs. Imported by both the API route (server)
 * and CoverageApplication.jsx (client) for PREANSWERED / DISCLOSURE_KEYS /
 * requiredAttachments.
 */

/* ------------------------------------------------------------------ */
/* Broker constants — Part I. Never asked of the applicant.            */
/* Gold PM&R is NOT a licensed producer; this identifies the broker    */
/* submitting on the physician's behalf.                              */
/* ------------------------------------------------------------------ */

export const PRODUCER = {
  // Deliberately blank (decision 2026-08-17): the broker — Arthur J. Gallagher
  // Risk Management Services LLC — completes Part I when the physician sends
  // them the application. Empty values are skipped by put(), so the box stays
  // empty rather than showing a placeholder.
  agency: "",
};

/* ------------------------------------------------------------------ */
/* Form state                                                         */
/*                                                                    */
/* The shape below is the contract between the form, the API guard,   */
/* and this builder. Yes/No fields are the strings "Yes" | "No" | "". */
/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} ServiceLocation
 * @property {string} location
 * @property {string} specialty
 * @property {string} hoursPerWeek
 * @property {"Yes"|"No"|""} hasCurrentCoverage
 * @property {string} currentCarrier
 * @property {"Yes"|"No"|""} seekingCoverage
 *
 * @typedef {Object} License
 * @property {string} state
 * @property {string} number
 * @property {string} percentOfPractice
 * @property {string} servicesProvided
 *
 * @typedef {Object} PriorCarrier
 * @property {string} insurer
 * @property {string} coverageFrom
 * @property {string} coverageTo
 * @property {string} policyNumber
 * @property {string} annualPremium
 * @property {string} coverageType
 * @property {string} retroactiveDate
 * @property {string} limitsOfLiability
 * @property {string} specialtyPracticed
 * @property {"Yes"|"No"|""} tailPurchased
 * @property {string} statesCovered
 * @property {"Yes"|"No"|""} anyClaims
 *
 * @typedef {Object} Training
 * @property {string} institution
 * @property {string} [degree]      medical school only
 * @property {string} [specialty]   internship / residency / fellowship
 * @property {string} completed
 *
 * @typedef {Object} FormState
 * // applicant (Part II)
 * @property {string} lastName
 * @property {string} firstName
 * @property {string} middleInitial
 * @property {string} gender
 * @property {string} dateOfBirth
 * @property {string} npi
 * @property {string} email
 * @property {string} phone
 * @property {string} practiceName
 * @property {string} practiceWebsite
 * @property {string} practiceAddress
 * @property {string} residenceAddress
 * @property {boolean} practiceAddressIsMailing
 * @property {boolean} practiceAddressIsBilling
 * @property {boolean} residenceAddressIsMailing
 * @property {boolean} residenceAddressIsBilling
 * // coverage (Part III)
 * @property {"Occurrence"|"Claims-Made"|"Modified Claims-Made"} coverageType
 * @property {string} effectiveFrom
 * @property {string} effectiveTo
 * @property {string} retroactiveDate
 * @property {string} limitPerClaim
 * @property {string} limitAggregate
 * @property {string} scope            one of the SCOPE keys below
 * @property {string} hoursPerWeek
 * @property {string} hoursPerMonth
 * @property {string} partTimeSince
 * @property {string} practiceType     one of the practiceType branches below
 * @property {string} entityName
 * @property {ServiceLocation[]} serviceLocations
 * @property {License[]} licenses
 * @property {PriorCarrier[]} priorCarriers
 * // education (Part IV)
 * @property {Training} medicalSchool
 * @property {Training} internship
 * @property {Training} residency
 * @property {Training} fellowship
 * @property {"Yes"|"No"|""} ecfmgCertified
 * @property {"Yes"|"No"|""} boardCertified
 * @property {"ABMS"|"ABPS"|"AOA"|"ASMBS"|""} boardBody
 * @property {string} boardSpecialties
 * // practice (Part IV)
 * @property {string} specialty
 * @property {"Yes"|"No"|""} changedInPastFiveYears
 * @property {string} changedExplanation
 * @property {"Yes"|"No"|""} longTermCare
 * @property {"Yes"|"No"|""} ltcSeekingCoverage
 * @property {"Yes"|"No"|""} ltcPatientsWithoutPriorRelationship
 * @property {string} ltcPercentOfPractice
 * @property {"Yes"|"No"|""} medicalDirector
 * @property {"Yes"|"No"|""} mdSeekingCoverage
 * @property {string} mdPercentOfPractice
 * @property {string} mdLocations
 * @property {"Yes"|"No"|""} telemedicine
 * @property {string} teleHoursPerWeek
 * @property {string} teleOtherHoursPerWeek
 * @property {string} teleScopeAndVendors
 * @property {string[]} teleMedia
 * @property {string} teleMediaOther
 * @property {"Yes"|"No"|""} telePatientsWithoutPriorRelationship
 * @property {Array<{state:string, hoursPerWeek:string, percentOfPractice:string}>} teleByState
 * @property {"Yes"|"No"|""} painManagement
 * @property {string} painModalities
 * @property {"Yes"|"No"|""} chaperonePolicy
 * // pre-answered exposures the applicant confirmed or overrode
 * @property {Record<string, boolean>} overrides
 * @property {Record<string, string>} overrideDetail
 * // disclosures — never pre-filled
 * @property {Record<string, "Yes"|"No"|"">} disclosures
 */

/** Fixed row capacity of the carrier's tables. Anything beyond goes on an attached sheet. */
export const ROW_LIMITS = { serviceLocations: 4, licenses: 3, priorCarriers: 4, teleByState: 4 };

export const COVERAGE_TYPES = ["Occurrence", "Claims-Made", "Modified Claims-Made"];
export const SCOPES = ["Full Time", "Part Time", "Moonlighting", "FTCA Gap", "Locum Tenens", "Resident", "Fellow", "Intern"];
export const PRACTICE_TYPES = [
  "Individual / Independent Contractor",
  "Solo corporation",
  "Member of a group practice",
  "Member of a healthcare facility",
];
export const BOARD_BODIES = ["ABMS", "ABPS", "AOA", "ASMBS"];
export const TELE_MEDIA = ["Audio", "Video", "Virtual Network", "Other"];

/* ------------------------------------------------------------------ */
/* Pre-answered exposures                                             */
/*                                                                    */
/* These are the Part IV questions that don't arise in post-acute      */
/* physiatry or internal medicine. Each is answered No by default and  */
/* shown to the applicant for confirmation — never silently submitted. */
/* ------------------------------------------------------------------ */

/**
 * @type {Array<{ key: string, statement: string, defaultAnswer: string,
 *   whenDefault: Record<string, string|boolean>, ifOverridden: string }>}
 * `whenDefault` — map keys set when the applicant leaves the default in place.
 * `ifOverridden` — supplemental form or attachment triggered if they override.
 */
export const PREANSWERED = [
  { key: "surgery", statement: "Performs surgery", defaultAnswer: "No surgery",
    whenDefault: { "surgery.none": true },
    ifOverridden: "Surgical activity grid and surgical location questions" },
  { key: "bariatric", statement: "Performs bariatric or weight-loss surgery", defaultAnswer: "No",
    whenDefault: { "bariatric.pediatricPatients": "No" },
    ifOverridden: "Bariatric procedure schedule and protocol questions" },
  { key: "deliveries", statement: "Performs childbirth deliveries", defaultAnswer: "No",
    whenDefault: { "obstetrics.performsDeliveries": "No" },
    ifOverridden: "Obstetric volume questions" },
  { key: "csection", statement: "Performs or assists with C-sections or VBACs", defaultAnswer: "No",
    whenDefault: { "obstetrics.performsCSectionOrVbac": "No", "obstetrics.assistsCSection": "No" },
    ifOverridden: "Obstetric assist questions" },
  { key: "spinal", statement: "Performs spinal surgery", defaultAnswer: "No",
    whenDefault: { "orthopedics.spinalSurgery": "No" },
    ifOverridden: "Orthopedic supplement" },
  { key: "entplastic", statement: "Performs plastic or reconstructive surgery", defaultAnswer: "No",
    whenDefault: { "ent.plasticSurgery": "No" },
    ifOverridden: "Plastic surgery explanation" },
  { key: "correctional", statement: "Provides services at a correctional facility", defaultAnswer: "No",
    whenDefault: { "correctional.providesServices": "No" },
    ifOverridden: "Correctional percentage and locations" },
  { key: "er", statement: "Staffs an emergency room", defaultAnswer: "No",
    whenDefault: { "emergencyRoom.staffs": "No" },
    ifOverridden: "ER hours per month" },
  { key: "homehealth", statement: "Practices home health care", defaultAnswer: "No",
    whenDefault: { "homeHealth.practices": "No" },
    ifOverridden: "Home health scope of treatment" },
  { key: "research", statement: "Participates in medical research, clinical trials, or off-label use of drugs or devices",
    defaultAnswer: "No",
    whenDefault: { "research.participates": "No" },
    ifOverridden: "APP 040 — Clinical Trials Addendum" },
  { key: "surgicenter", statement: "Owns, operates, or uses surgi-center facilities", defaultAnswer: "No",
    whenDefault: { "surgiCenter.ownsOperatesOrUses": "No" },
    ifOverridden: "Surgi-center supplement" },
];

/* ------------------------------------------------------------------ */
/* Disclosure keys — order matters, it matches the printed form.       */
/* ------------------------------------------------------------------ */

/** @type {Array<[stateKey: string, mapKey: string]>} */
export const DISCLOSURE_KEYS = [
  ["claim_ever", "claims.everHadClaim"],
  ["claim_pending", "claims.pendingClaimOrIncident"],
  ["claim_reported", "claims.incidentsReportedToCarrier"],
  ["lic_action", "supplemental.medicalLicense"],
  ["dea_action", "supplemental.federalNarcoticLicense"],
  ["priv_action", "supplemental.hospitalPrivileges"],
  ["society_action", "supplemental.professionalSociety"],
  ["peer_review", "supplemental.peerBoardReview"],
  ["board_complaint", "supplemental.stateBoardComplaint"],
  ["dea_review", "supplemental.deaReview"],
  ["medical_condition", "supplemental.medicalCondition"],
  ["civil_criminal", "supplemental.civilOrCriminalCharges"],
  ["conviction", "supplemental.conviction"],
  ["ins_refused", "supplemental.insuranceRefusedOrCanceled"],
];

/* ------------------------------------------------------------------ */

const yn = (v) => (v === "Yes" || v === "No" ? v : undefined);

/**
 * @param {FormState} s
 * @returns {Record<string, string|number|boolean>} flat, map-keyed answers
 */
export function buildCoverysPayload(s) {
  const a = {};
  const put = (k, v) => {
    if (v !== undefined && v !== null && v !== "") a[k] = v;
  };

  /* Part I — broker */
  put("producer.agency", PRODUCER.agency);

  /* Part II — applicant */
  put("applicant.lastName", s.lastName);
  put("applicant.firstName", s.firstName);
  put("applicant.middleInitial", s.middleInitial);
  put("applicant.gender", s.gender);
  put("applicant.dateOfBirth", s.dateOfBirth);
  put("applicant.npi", s.npi);
  put("applicant.email", s.email);
  put("applicant.phone", s.phone);
  put("applicant.practiceName", s.practiceName);
  put("applicant.practiceWebsite", s.practiceWebsite);
  put("applicant.practiceAddress", s.practiceAddress);
  put("applicant.residenceAddress", s.residenceAddress);
  put("applicant.practiceAddressIsMailing", s.practiceAddressIsMailing);
  put("applicant.practiceAddressIsBilling", s.practiceAddressIsBilling);
  put("applicant.residenceAddressIsMailing", s.residenceAddressIsMailing);
  put("applicant.residenceAddressIsBilling", s.residenceAddressIsBilling);

  /* Part III — coverage */
  if (s.coverageType === "Occurrence") a["coverage.typeOccurrence"] = true;
  if (s.coverageType === "Claims-Made") a["coverage.typeClaimsMade"] = true;
  if (s.coverageType === "Modified Claims-Made") a["coverage.typeModifiedClaimsMade"] = true;

  put("coverage.effectiveFrom", s.effectiveFrom);
  put("coverage.effectiveTo", s.effectiveTo);
  put("coverage.retroactiveDate", s.retroactiveDate);
  put("coverage.limitPerClaim", s.limitPerClaim);
  put("coverage.limitAggregate", s.limitAggregate);

  const SCOPE = {
    "Full Time": "coverage.scopeFullTime",
    "Part Time": "coverage.scopePartTime",
    Moonlighting: "coverage.scopeMoonlighting",
    "FTCA Gap": "coverage.scopeFtcaGap",
    "Locum Tenens": "coverage.scopeLocumTenens",
    Resident: "coverage.scopeResident",
    Fellow: "coverage.scopeFellow",
    Intern: "coverage.scopeIntern",
  };
  if (SCOPE[s.scope]) a[SCOPE[s.scope]] = true;

  put("coverage.hoursPerWeek", s.hoursPerWeek);
  put("coverage.hoursPerMonth", s.hoursPerMonth);
  put("coverage.partTimeSince", s.partTimeSince);

  if (s.practiceType === "Individual / Independent Contractor") {
    a["practiceType.individualOrIC"] = true;
  } else if (s.practiceType === "Solo corporation") {
    a["practiceType.soloCorporation"] = true;
    put("practiceType.soloCorporationName", s.entityName);
  } else if (s.practiceType === "Member of a group practice") {
    a["practiceType.groupPractice"] = true;
    put("practiceType.groupPracticeName", s.entityName);
  } else if (s.practiceType === "Member of a healthcare facility") {
    a["practiceType.healthcareFacility"] = true;
    put("practiceType.healthcareFacilityName", s.entityName);
  }

  /* Service locations — the form holds exactly 4 rows */
  s.serviceLocations.slice(0, ROW_LIMITS.serviceLocations).forEach((r, i) => {
    const p = `serviceLocations.${i + 1}.`;
    put(p + "location", r.location);
    put(p + "specialty", r.specialty);
    put(p + "hoursPerWeek", r.hoursPerWeek);
    put(p + "currentCarrier", r.currentCarrier);
    put(p + "hasCurrentCoverage", yn(r.hasCurrentCoverage));
    put(p + "seekingCoverage", yn(r.seekingCoverage));
  });

  /* Licenses — 3 rows */
  s.licenses.slice(0, ROW_LIMITS.licenses).forEach((r, i) => {
    const p = `licenses.${i + 1}.`;
    put(p + "state", r.state);
    put(p + "number", r.number);
    put(p + "percentOfPractice", r.percentOfPractice);
    put(p + "servicesProvided", r.servicesProvided);
  });

  /* Education */
  put("education.medicalSchool.institution", s.medicalSchool.institution);
  put("education.medicalSchool.degree", s.medicalSchool.degree);
  put("education.medicalSchool.completed", s.medicalSchool.completed);
  ["internship", "residency", "fellowship"].forEach((k) => {
    put(`education.${k}.institution`, s[k].institution);
    put(`education.${k}.specialty`, s[k].specialty);
    put(`education.${k}.completed`, s[k].completed);
  });
  put("education.ecfmgCertified", yn(s.ecfmgCertified));
  put("education.boardCertified", yn(s.boardCertified));
  if (s.boardBody === "ABMS") a["education.boardABMS"] = true;
  if (s.boardBody === "ABPS") a["education.boardABPS"] = true;
  if (s.boardBody === "AOA") a["education.boardAOA"] = true;
  if (s.boardBody === "ASMBS") a["education.boardASMBS"] = true;
  put("education.boardSpecialties", s.boardSpecialties);

  /* Practice activities */
  put("practice.specialty", s.specialty);
  put("practice.changedInPastFiveYears", yn(s.changedInPastFiveYears));
  put("practice.changedExplanation", s.changedExplanation);

  put("longTermCare.practices", yn(s.longTermCare));
  if (s.longTermCare === "Yes") {
    put("longTermCare.seekingCoverage", yn(s.ltcSeekingCoverage));
    put("longTermCare.patientsWithoutPriorRelationship", yn(s.ltcPatientsWithoutPriorRelationship));
    put("longTermCare.percentOfPractice", s.ltcPercentOfPractice);
  }

  put("medicalDirector.serves", yn(s.medicalDirector));
  if (s.medicalDirector === "Yes") {
    put("medicalDirector.seekingCoverage", yn(s.mdSeekingCoverage));
    put("medicalDirector.percentOfPractice", s.mdPercentOfPractice);
    put("medicalDirector.locations", s.mdLocations);
  }

  put("painManagement.provides", yn(s.painManagement));
  if (s.painManagement === "Yes") put("painManagement.modalities", s.painModalities);
  put("homeHealth.chaperonePolicy", yn(s.chaperonePolicy));

  /* Telemedicine.
     NOTE: the Yes/No boxes on telemedicine Q5–Q8 and the Audio/Video/
     Virtual Network row are literal ☐ glyphs in the source document, not
     form controls. They cannot be ticked. The answers go into the adjacent
     text fields, led with "Yes —" / "No —" so the reader isn't guessing. */
  if (s.telemedicine === "Yes") {
    put("telemedicine.hoursPerWeek", s.teleHoursPerWeek);
    put("telemedicine.otherHoursPerWeek", s.teleOtherHoursPerWeek);
    put("telemedicine.scopeAndVendors", s.teleScopeAndVendors);
    if (s.teleMedia.length) put("telemedicine.mediaConfirmation", s.teleMedia.join(", "));
    put("telemedicine.mediaOther", s.teleMediaOther);
    if (s.telePatientsWithoutPriorRelationship) {
      a["telemedicine.patientsWithoutPriorRelationshipExplanation"] =
        `${s.telePatientsWithoutPriorRelationship} — see attached if applicable.`;
    }
    s.teleByState.slice(0, ROW_LIMITS.teleByState).forEach((r, i) => {
      const p = `telemedicine.byState.${i + 1}.`;
      put(p + "state", r.state);
      put(p + "hoursPerWeek", r.hoursPerWeek);
      put(p + "percentOfPractice", r.percentOfPractice);
    });
  }

  /* Pre-answered exposures. Defaults apply only where NOT overridden;
     an override is left blank so the applicant completes it by hand with
     the supplemental form, rather than the tool guessing. */
  for (const p of PREANSWERED) {
    if (s.overrides[p.key]) continue;
    Object.assign(a, p.whenDefault);
  }

  /* Prior carriers — 4 columns */
  s.priorCarriers.slice(0, ROW_LIMITS.priorCarriers).forEach((r, i) => {
    const p = `priorCarriers.${i + 1}.`;
    put(p + "insurer", r.insurer);
    put(p + "coverageFrom", r.coverageFrom);
    put(p + "coverageTo", r.coverageTo);
    put(p + "policyNumber", r.policyNumber);
    put(p + "annualPremium", r.annualPremium);
    put(p + "coverageType", r.coverageType);
    put(p + "retroactiveDate", r.retroactiveDate);
    put(p + "limitsOfLiability", r.limitsOfLiability);
    put(p + "specialtyPracticed", r.specialtyPracticed);
    put(p + "statesCovered", r.statesCovered);
    put(p + "tailPurchased", yn(r.tailPurchased));
    put(p + "anyClaims", yn(r.anyClaims));
  });

  /* Disclosures */
  for (const [stateKey, mapKey] of DISCLOSURE_KEYS) {
    put(mapKey, yn(s.disclosures[stateKey] ?? ""));
  }

  /* Signature blocks stay empty — signed by hand after download. */

  return a;
}

/**
 * Attachments the carrier will expect, derived from the answers.
 * @param {FormState} s
 * @returns {string[]}
 */
export function requiredAttachments(s) {
  const out = [
    "Curriculum vitae",
    "Current declarations page",
    "Loss runs, 10+ years or since start of practice",
  ];
  if (s.boardCertified === "Yes") out.push("Board certificate");
  if (s.medicalDirector === "Yes") out.push("Medical director contract");
  if (s.chaperonePolicy === "Yes") out.push("Chaperone policy");
  const flagged = DISCLOSURE_KEYS.filter(([k]) => s.disclosures[k] === "Yes").length;
  if (flagged) out.push(`Explanation sheet for each Yes disclosure (${flagged})`);
  for (const p of PREANSWERED) if (s.overrides[p.key]) out.push(p.ifOverridden);
  return out;
}
