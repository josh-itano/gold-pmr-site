import { useState, useEffect, useRef, useCallback } from "react";
import {
  Coins, ShieldCheck, TrendingUp, Zap, BadgeCheck, RefreshCw,
  Bot, CalendarDays, GraduationCap, HandCoins, Stethoscope,
  BrainCircuit, ChartColumn, ShieldAlert, ChartLine, ReceiptText, LayoutDashboard,
} from "lucide-react";

// Brand Kit — Edition 01 · 2026. Page 05 (Color) + page 12 (UI color roles).
const C = {
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

// Service iconography — kit p07. One system, held everywhere: a single 1.6px
// stroke at 24px, charcoal, never filled, never multicolor. strokeWidth is in
// viewBox units, so leaving it at 1.6 is what "scale the stroke with the icon"
// means — the rendered stroke tracks the icon size automatically.
// Icons are decorative here: every card states the same thing in its heading.
const ICON = { size: 24, strokeWidth: 1.6, color: C.dark, "aria-hidden": true, focusable: false };

// Outfit for display, headings, numerals. Jost for body and UI. System
// fallback per kit page 12. The kit ships Light 300 / Regular 400 / Medium 500
// only — there is no bold in this identity.
const F = {
  display: "'Outfit', system-ui, sans-serif",
  body: "'Jost', system-ui, sans-serif",
};

// Kit p12 — "Honor reduced-motion." Motion-driven components consult this and
// render their end state immediately rather than animating toward it.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = () => setReduced(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return reduced;
}

function useReveal() {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, v];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, v] = useReveal();
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div style={style}>{children}</div>;
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>{children}</div>;
}

function AnimNum({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 }); if (ref.current) obs.observe(ref.current); return () => obs.disconnect(); }, []);
  useEffect(() => { if (!vis || reduced) return; const num = parseInt(String(target).replace(/\D/g, "")); if (isNaN(num)) return; let s = 0; const step = Math.max(1, Math.floor(num / 50)); const iv = setInterval(() => { s += step; if (s >= num) { setCount(num); clearInterval(iv); } else setCount(s); }, 25); return () => clearInterval(iv); }, [vis, target, reduced]);
  if (reduced) return <span>{target}{suffix}</span>;
  return <span ref={ref}>{count}{suffix}</span>;
}

// Eyebrow — kit type scale: 13/300, uppercase, letterspaced. Text is Deep Gold;
// the dot is the one decorative gold element.
// Ground is White, not the gold tint: Deep Gold over goldSoft-over-Mist measures
// 4.37:1 and misses AA. On White it is the kit's stated 5.12:1.
function Badge({ children }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", border: `1px solid ${C.line}`, background: C.white, fontSize: 13, fontWeight: 300, letterSpacing: 2, textTransform: "uppercase", color: C.deepGold }}><span style={{ width: 6, height: 6, background: C.gold, borderRadius: "50%" }} aria-hidden="true" />{children}</span>;
}

// Heading — kit type scale: 32/400.
function SectionHeader({ badge, title, subtitle, align = "center" }) {
  return <div style={{ textAlign: align, marginBottom: 56 }}>{badge && <div style={{ marginBottom: 16 }}><Badge>{badge}</Badge></div>}<h2 className="sec-title" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 400, lineHeight: 1.2, letterSpacing: -0.2, marginBottom: subtitle ? 20 : 0, color: C.dark }}>{title}</h2>{subtitle && <p style={{ color: C.muted, fontSize: 16, fontWeight: 300, maxWidth: 620, margin: align === "center" ? "0 auto" : 0, lineHeight: 1.7 }}>{subtitle}</p>}</div>;
}

function Card({ icon: Icon, title, desc }) {
  return <div style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 36, transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", position: "relative", overflow: "hidden", height: "100%", cursor: "default", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = C.goldLight; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,23,42,0.04)"; }}>{Icon && <div style={{ marginBottom: 16, display: "flex" }}><Icon {...ICON} /></div>}<h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 500, marginBottom: 12, color: C.dark }}>{title}</h3><p style={{ fontSize: 15, fontWeight: 300, color: C.muted, lineHeight: 1.7 }}>{desc}</p></div>;
}

// Primary = gold fill behind ink text. Kit p05 sanctions gold to draw the eye to
// "a single call to action" — that's a fill, not gold text. Secondary borders
// and hover text resolve to Deep Gold, never #C9A227.
// Outbound funnel to the careers site. careers.goldpmr.com owns the live
// openings and the GoldOS-connected apply flow; this marketing site funnels to
// it. Each touchpoint carries a distinct utm_content so recruiting can attribute
// where a candidate entered. Keep utm_source/medium/campaign stable — analytics
// groups on them; vary only content.
const CAREERS_URL = "https://careers.goldpmr.com/";
const careersUrl = (content) =>
  `${CAREERS_URL}?utm_source=goldpmr&utm_medium=website&utm_campaign=careers&utm_content=${content}`;

// minHeight 44 — kit p12, "tap targets at least 44 x 44 px."
// Renders a real <a> when `href` is given (crawlable, middle-clickable,
// right-click-open) — window.open would forfeit all three. External links get
// target=_blank + rel=noopener,noreferrer.
function Btn({ children, primary, onClick, href, external, full, style: s = {} }) {
  const base = primary ? { background: C.gold, color: C.dark, border: "1px solid transparent" } : { background: "transparent", color: C.dark, border: `1px solid ${C.line}` };
  const style = { ...base, fontWeight: 500, padding: "13px 32px", minHeight: 44, fontSize: 15, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", fontFamily: F.body, letterSpacing: 0.5, width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", boxSizing: "border-box", ...s };
  const onEnter = e => { if (primary) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(201,162,39,0.3)"; } else { e.currentTarget.style.borderColor = C.deepGold; e.currentTarget.style.color = C.deepGold; } };
  const onLeave = e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; if (!primary) { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.dark; } };
  if (href) return <a href={href} onClick={onClick} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>{children}</a>;
  return <button onClick={onClick} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>{children}</button>;
}

// No `outline: none` here — it would beat the global :focus-visible bronze ring,
// since inline styles outrank the stylesheet.
function Input({ label, type = "text", value, onChange, placeholder, options }) {
  const shared = { width: "100%", padding: "12px 16px", minHeight: 44, background: C.white, border: `1px solid ${C.line}`, color: C.dark, fontSize: 15, fontWeight: 300, fontFamily: F.body, transition: "border-color 0.3s" };
  return <div style={{ marginBottom: 20 }}>{label && <label style={{ display: "block", fontSize: 13, fontWeight: 400, color: C.mutedLight, marginBottom: 6 }}>{label}</label>}{type === "select" ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...shared, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = C.deepGold} onBlur={e => e.target.style.borderColor = C.line}>{options.map(o => <option key={o.value} value={o.value} style={{ background: C.white }}>{o.label}</option>)}</select> : type === "textarea" ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...shared, resize: "vertical" }} onFocus={e => e.target.style.borderColor = C.deepGold} onBlur={e => e.target.style.borderColor = C.line} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={shared} onFocus={e => e.target.style.borderColor = C.deepGold} onBlur={e => e.target.style.borderColor = C.line} />}</div>;
}

// ===== HOME =====
function HomePage({ nav }) {
  return <>
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", filter: "blur(80px)", background: `radial-gradient(circle, ${C.goldGlow}, transparent)`, top: "10%", right: "-10%", animation: "pulse 6s ease-in-out infinite" }} />
      <div className="sec-hero" style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 40px 80px", textAlign: "center", position: "relative", zIndex: 2 }}>
        <Reveal><Badge>Physician-Led · Technology-Forward · Outcome-Driven</Badge></Reveal>
        <Reveal delay={0.1}><h1 className="hero-title" style={{ fontFamily: F.display, fontSize: "min(56px, 8vw)", fontWeight: 500, lineHeight: 1.1, letterSpacing: -0.5, margin: "28px 0", color: C.dark }}>The New Standard in<br/>Inpatient Rehabilitation</h1></Reveal>
        <Reveal delay={0.2}><p style={{ fontSize: 18, fontWeight: 300, color: C.muted, maxWidth: 640, margin: "0 auto 44px", lineHeight: 1.8 }}>Gold PM&R delivers integrated co-management of inpatient rehab patients—combining Physical Medicine & Rehabilitation with Internal Medicine through our providers or in collaboration with your existing physician teams—supported by proprietary technology that produces measurably superior outcomes for facilities and their patients.</p></Reveal>
        <Reveal delay={0.3}><div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}><Btn primary onClick={() => nav("facilities")}>For Facilities →</Btn><Btn onClick={() => nav("physicians")}>For Physicians →</Btn></div></Reveal>
      </div>
    </section>
    {/* Ink navy field. Gold numerals are 7.4:1 here; on white they were 2.4:1
        and failed even the 3:1 large-display bar. Kit p07 calls this a
        "champagne on dark" feature moment. */}
    <section style={{ background: C.dark }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 32, textAlign: "center" }}>
        {[{v:600,s:"+",l:"Beds Managed"},{v:19,s:"",l:"Facilities"},{v:6,s:"",l:"States"},{v:36,s:"+",l:"Providers"}].map((m,i) => <div key={i}><div className="stat-num" style={{ fontFamily: F.display, fontSize: 48, fontWeight: 300, color: C.gold }}><AnimNum target={m.v} suffix={m.s} /></div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 300, marginTop: 4 }}>{m.l}</div></div>)}
      </div>
    </section>
    <section className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 40px" }}>
      <Reveal><SectionHeader badge="Who We Serve" title="Two Paths. One Standard." /></Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 24 }}>
        {[{p:"facilities",badge:"For Facilities",h:"Higher Reimbursement. Zero Compliance Risk. Better Outcomes.",d:"Gold physicians maximize CMI scores, maintain 100% CMS compliance, and deliver outcomes that become your strongest marketing asset.",cta:"Explore Partnership →"},{p:"physicians",badge:"For Physicians",h:"Best Tools. Best Support. Best Career in Post-Acute Medicine.",d:"PM&R and Internal Medicine physicians co-managing every patient. 70% compensation with documentation support that lets you earn more per hour. Personalized schedules, paid leadership roles, and a mission worth showing up for.",cta:"Explore Careers →"}].map((c,i) => <Reveal key={i} delay={i*0.1} style={{ height: "100%" }}><div role="link" tabIndex={0} style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 48, cursor: "pointer", transition: "all 0.4s", boxShadow: "0 1px 4px rgba(15,23,42,0.04)", height: "100%", display: "flex", flexDirection: "column" }} onClick={() => nav(c.p)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(c.p); } }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.goldLight; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(15,23,42,0.04)"; }}><div style={{ fontSize: 13, fontWeight: 300, letterSpacing: 3, textTransform: "uppercase", color: C.deepGold, marginBottom: 20 }}>{c.badge}</div><h3 style={{ fontFamily: F.display, fontSize: 26, fontWeight: 400, lineHeight: 1.3, marginBottom: 16, color: C.dark }}>{c.h}</h3><p style={{ color: C.muted, fontSize: 15, fontWeight: 300, lineHeight: 1.7, marginBottom: 24, flex: 1 }}>{c.d}</p><span style={{ color: C.deepGold, fontSize: 15, fontWeight: 400 }}>{c.cta}</span></div></Reveal>)}
      </div>
    </section>
    <section style={{ background: C.navy, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}><div style={{ maxWidth: 560 }}><Badge>GoldOS Platform</Badge><h2 className="sec-title" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 400, lineHeight: 1.2, margin: "20px 0 16px", color: C.dark }}>Technology That No Competitor Can Match</h2><p style={{ color: C.muted, fontSize: 16, fontWeight: 300, lineHeight: 1.8 }}>AI documentation co-pilot, real-time compliance tracking, CMG/CMI optimization, and automated billing — purpose-built for integrated post-acute medical management.</p></div><Btn primary onClick={() => nav("technology")}>Explore the Platform →</Btn></div></Reveal>
      </div>
    </section>
  </>;
}

// ===== FACILITIES =====
function FacilitiesPage({ nav }) {
  const benefits = [
    { icon: Coins, title: "Higher Reimbursement", desc: "Documentation education produces higher CMI scores. Gold targets CMI ≥1.5 — facilities with poor documentation fall below and lose money per admission." },
    { icon: ShieldCheck, title: "Zero Compliance Risk", desc: "100% on-time CMS documentation. Even one missed documentation deadline can result in costly technical denials and preventable revenue loss = $30K–$80K. Our Compliance Watchdog tracks every deadline in real time." },
    { icon: TrendingUp, title: "Superior Outcomes", desc: "Integrated PM&R and Internal Medicine leadership within a multidisciplinary rehab team drives superior outcomes compared to isolated single-specialty models. <8% return-to-acute, ≥82% discharge-to-community, <10% discharge to SNF." },
    { icon: Zap, title: "GoldOS Technology", desc: "Real-time compliance dashboards, CMI optimization alerts, outcome analytics — capabilities no other physician group provides." },
    { icon: BadgeCheck, title: "Gold Bar Certified Physicians", desc: "Rigorous IRF-specific certification. Consistent quality, not physician roulette." },
    { icon: RefreshCw, title: "Continuity Guaranteed", desc: "Multi-provider model with built-in coverage redundancy. No scrambling when your solo independent medical director goes on vacation." },
  ];
  const [beds, setBeds] = useState(30);
  const [avgCmg, setAvgCmg] = useState("1.25");
  const [denials, setDenials] = useState("2");
  const cmgLift = Math.round(beds * 365 * 0.75 * (1.5 - parseFloat(avgCmg)) * 800);
  const denialSavings = parseInt(denials) * 55000;
  const totalImpact = Math.max(0, cmgLift) + denialSavings;

  const [compStep, setCompStep] = useState(0);
  const [compAnswers, setCompAnswers] = useState({});
  const compQ = [
    { q: "How often are PMR face-to-face notes completed on time?", opts: ["Always (100%)", "Usually (90%+)", "Sometimes (70-90%)", "Inconsistently (<70%)"], sc: [0,1,2,3] },
    { q: "How many technical denials in the past 12 months?", opts: ["None", "1-2", "3-5", "More than 5"], sc: [0,1,2,3] },
    { q: "Does your physician group provide real-time compliance tracking?", opts: ["Yes, with technology", "Yes, manually", "Partially", "No"], sc: [0,1,2,3] },
    { q: "What is your current CMI score average?", opts: ["Above 1.5", "1.3 – 1.5", "1.1 – 1.3", "Below 1.1 or unknown"], sc: [0,1,2,3] },
    { q: "How would you rate your physician's IDT leadership?", opts: ["Excellent", "Good", "Fair", "Poor"], sc: [0,1,2,3] },
  ];
  const compScore = Object.values(compAnswers).reduce((a,b) => a+b, 0);
  const compDone = compStep >= compQ.length;
  const compRisk = compScore <= 3 ? "Low" : compScore <= 7 ? "Moderate" : compScore <= 11 ? "High" : "Critical";
  const compColor = compScore <= 3 ? C.green : compScore <= 7 ? C.deepGold : compScore <= 11 ? C.amber : C.red;

  return <>
    <section className="sec-hero" style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>For Facilities</Badge><h1 className="hero-title" style={{ fontFamily: F.display, fontSize: "min(48px, 7vw)", fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.5, margin: "24px 0 20px", color: C.dark }}>Your Physician Partner<br/>Should Make You Money</h1><p style={{ color: C.muted, fontSize: 18, fontWeight: 300, maxWidth: 640, lineHeight: 1.8, marginBottom: 32 }}>Most physicians provide basic coverage. Gold delivers integrated co-management of your post-acute patients — partnering with your existing internal medicine team or providing our own when you don't have one — for higher CMI scores, zero compliance risk, and outcomes that become your competitive advantage.</p><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><Btn primary onClick={() => document.getElementById("roi")?.scrollIntoView({ behavior: "smooth" })}>Calculate Your ROI →</Btn><Btn onClick={() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })}>Take Compliance Assessment</Btn></div></Reveal>
    </section>
    <section className="sec-bot" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 100px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 20 }}>{benefits.map((b,i) => <Reveal key={i} delay={i*0.06}><Card {...b} /></Reveal>)}</div></section>

    {/* Case Study */}
    <section style={{ background: C.navy, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Case Study" title="The Gold Effect: Before & After" subtitle="Illustrative scenario based on typical facility patterns." /></Reveal>
        <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 24 }}>
          {[{l:"CMI Score",b:"1.3",a:"1.6"},{l:"Doc Compliance",b:"86%",a:"100%"},{l:"Discharge Home",b:"74%",a:"83%"},{l:"Return to Acute",b:"14%",a:"6%"}].map((m,i) => <div key={i} style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 28, textAlign: "center", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}><div style={{ fontSize: 12, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>{m.l}</div><div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}><div><div style={{ fontSize: 13, color: C.red, fontWeight: 500, marginBottom: 4 }}>Before</div><div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 300, color: C.muted }}>{m.b}</div></div><div style={{ color: C.muted, fontSize: 20 }} aria-hidden="true">→</div><div><div style={{ fontSize: 13, color: C.green, fontWeight: 500, marginBottom: 4 }}>After</div><div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 400, color: C.deepGold }}>{m.a}</div></div></div></div>)}
        </div></Reveal>
      </div>
    </section>

    {/* ROI Calculator */}
    <section id="roi" className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
      <Reveal><SectionHeader badge="ROI Calculator" title="Estimate Your Revenue Impact" subtitle="See what Gold's documentation excellence and compliance technology could mean for your bottom line." /></Reveal>
      <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 32 }}>
        <div style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 40, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 24, color: C.dark }}>Your Facility</h3>
          <Input label="Number of IRF Beds" type="number" value={beds} onChange={v => setBeds(Math.max(1, parseInt(v) || 1))} />
          <Input label="Current Average CMI Score" type="select" value={avgCmg} onChange={setAvgCmg} options={[{value:"1.05",label:"Below 1.1"},{value:"1.15",label:"1.1–1.2"},{value:"1.25",label:"1.2–1.3"},{value:"1.35",label:"1.3–1.4"},{value:"1.45",label:"1.4–1.5"},{value:"1.55",label:"Above 1.5"}]} />
          <Input label="Technical Denials per Year" type="select" value={denials} onChange={setDenials} options={[{value:"0",label:"None"},{value:"1",label:"1"},{value:"2",label:"2–3"},{value:"4",label:"4–5"},{value:"6",label:"6+"}]} />
        </div>
        {/* The payoff panel is the feature moment — ink navy ground, champagne
            numerals. Gold reads 7.4:1 here vs 2.4:1 on the old gold-tint wash. */}
        <div style={{ background: C.dark, padding: 40 }}>
          <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 400, marginBottom: 24, color: C.white }}>Estimated Annual Impact</h3>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.72)", marginBottom: 4 }}>CMI Score Improvement</div><div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 300, color: C.gold }}>${Math.max(0,cmgLift).toLocaleString()}</div></div>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.72)", marginBottom: 4 }}>Denial Prevention Savings</div><div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 300, color: C.gold }}>${denialSavings.toLocaleString()}</div></div>
          <div style={{ borderTop: "1px solid rgba(201,162,39,0.35)", paddingTop: 24 }}><div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.72)", marginBottom: 4 }}>Total Revenue Impact</div><div style={{ fontFamily: F.display, fontSize: 44, fontWeight: 300, color: C.gold }}>${totalImpact.toLocaleString()}</div><div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.72)", marginTop: 8 }}>per year · Gold target CMI ≥1.5, 100% compliance</div></div>
          <Btn primary full onClick={() => nav("contact")} style={{ marginTop: 24 }}>Discuss These Numbers →</Btn>
        </div>
      </div></Reveal>
    </section>

    {/* Compliance Assessment */}
    <section id="assessment" style={{ background: C.navy, borderTop: `1px solid ${C.line}` }}>
      <div className="sec-pad" style={{ maxWidth: 800, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Compliance Assessment" title="What's Your Risk Profile?" subtitle="Five questions. Instant results." /></Reveal>
        <Reveal delay={0.1}><div style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 40, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
          {!compDone ? <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <span style={{ fontSize: 13, color: C.muted }}>Question {compStep + 1} of {compQ.length}</span>
              <div style={{ display: "flex", gap: 6 }}>{compQ.map((_,i) => <div key={i} style={{ width: 32, height: 4, background: i <= compStep ? C.deepGold : C.line, transition: "background 0.3s" }} />)}</div>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 500, marginBottom: 24, lineHeight: 1.4, color: C.dark }}>{compQ[compStep].q}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {compQ[compStep].opts.map((opt,i) => <button key={i} onClick={() => { setCompAnswers({...compAnswers, [compStep]: compQ[compStep].sc[i]}); setCompStep(compStep+1); }} style={{ background: "rgba(0,0,0,0.02)", border: `1px solid ${C.line}`, padding: "16px 20px", color: C.dark, fontSize: 15, textAlign: "left", cursor: "pointer", transition: "all 0.3s", fontFamily: F.body }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldSoft; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}>{opt}</button>)}
            </div>
          </> : <div style={{ textAlign: "center" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", border: `3px solid ${compColor}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><span style={{ fontFamily: F.display, fontSize: 36, fontWeight: 500, color: compColor }}>{compScore}</span></div>
            <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: compColor, marginBottom: 8 }}>{compRisk} Risk</div>
            <h3 style={{ fontSize: 24, fontWeight: 500, marginBottom: 16, color: C.dark }}>{compScore <= 3 ? "Your compliance looks solid." : compScore <= 7 ? "There's room for improvement." : "You may be leaving significant revenue on the table."}</h3>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 24px" }}>{compScore <= 3 ? "Even well-run facilities benefit from Gold's technology layer — real-time tracking prevents errors manual processes can't catch." : "Gold's physician training and compliance technology directly addresses these gaps. Let's talk specifics."}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}><Btn primary onClick={() => nav("contact")}>Schedule a Conversation</Btn><Btn onClick={() => { setCompStep(0); setCompAnswers({}); }}>Retake</Btn></div>
          </div>}
        </div></Reveal>
      </div>
    </section>
  </>;
}

// ===== PHYSICIANS =====
function PhysiciansPage() {
  const [ppd, setPpd] = useState(30);
  const [dpw, setDpw] = useState("7");
  const [wpy, setWpy] = useState("26");
  const encounters = ppd * parseInt(dpw) * parseInt(wpy);
  const comp70 = Math.round(encounters * 78 * 0.70);
  const withLift = Math.round(encounters * 88 * 0.70);

  const cards = [
    { icon: Bot, title: "AI-Powered Practice", desc: "Documentation co-pilot built for inpatient rehab eliminates 60–70% of documentation time. Automated billing. Compliance watchdog. Focus on patients." },
    { icon: CalendarDays, title: "Your Schedule, Your Life", desc: "Personalized schedule — patient volume, hours, time off. Week-on/week-off, 4 day weeks, seasonal flexibility." },
    { icon: TrendingUp, title: "Leadership Ladder", desc: "Site Leader → Medical Director → Regional Director, and more. Paid roles with $15K–$150K+ stipends. Clear path without leaving practice." },
    { icon: GraduationCap, title: "Gold Bar Certification", desc: "The only IRF-specific physician certification. CMG mastery, CMS compliance, IDT leadership. AMA CME certification pending (expected 2027)." },
    { icon: HandCoins, title: "Student Loan Assistance", desc: "Loan assistance may be offered for qualifying multi-year commitments, along with sign-on and relocation support depending on position and location." },
    { icon: Stethoscope, title: "Mission-Driven, Physician-Owned", desc: "Built around quality care, clinical excellence, and supporting physicians with the right tools and environment." },
  ];
  // Live openings and applications are owned by careers.goldpmr.com (GoldOS-
  // connected). This page no longer hardcodes a positions list — a static list
  // here would misrepresent what's actually open. When the careers app exposes a
  // jobs JSON feed, a live "top openings" strip can render here and deep-link
  // each role to its posting; until then, funnel out.
  return <>
    <section className="sec-hero" style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>For Physicians</Badge><h1 className="hero-title" style={{ fontFamily: F.display, fontSize: "min(48px, 7vw)", fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.5, margin: "24px 0 20px", color: C.dark }}>Practice Medicine.<br/>We Handle Everything Else.</h1><p style={{ color: C.muted, fontSize: 18, fontWeight: 300, maxWidth: 640, lineHeight: 1.8, marginBottom: 32 }}>A collaborative practice environment where PM&R and Internal Medicine physicians co-manage every patient. 70% compensation, AI documentation that lets you earn more per hour, personalized schedules, a leadership ladder — and a supportive team that believes in high quality patient care.</p><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><Btn primary href={careersUrl("physicians-hero")} external>View Open Positions →</Btn><Btn onClick={() => document.getElementById("comp-calc")?.scrollIntoView({ behavior: "smooth" })}>Estimate Your Earnings</Btn></div></Reveal>
    </section>
    <section className="sec-bot" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 100px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 20 }}>{cards.map((b,i) => <Reveal key={i} delay={i*0.06}><Card {...b} /></Reveal>)}</div></section>

    {/* Comp Estimator */}
    <section id="comp-calc" style={{ background: C.navy, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Compensation Estimator" title="Model Your Earnings at Gold" subtitle="See what 70% of a bigger number looks like with AI-optimized documentation." /></Reveal>
        <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 32 }}>
          <div style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 40, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 24, color: C.dark }}>Your Practice Profile</h3>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 500, color: C.mutedLight, marginBottom: 6 }}>Patients Per Day: {ppd}</label><input type="range" min={10} max={40} value={ppd} onChange={e => setPpd(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.gold, marginBottom: 20 }} /></div>
            <Input label="Days Per Week" type="select" value={dpw} onChange={setDpw} options={[{value:"2",label:"2 days"},{value:"3",label:"3 days"},{value:"4",label:"4 days"},{value:"5",label:"5 days"},{value:"6",label:"6 days"},{value:"7",label:"7 days"}]} />
            <Input label="Weeks Per Year" type="select" value={wpy} onChange={setWpy} options={[{value:"26",label:"26 weeks"},{value:"34",label:"34 weeks"},{value:"48",label:"48 weeks"},{value:"52",label:"52 weeks"}]} />
          </div>
          <div style={{ background: C.dark, padding: 40 }}>
            <h3 style={{ fontFamily: F.display, fontSize: 18, fontWeight: 400, marginBottom: 24, color: C.white }}>Estimated Compensation</h3>
            <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.72)", marginBottom: 4 }}>Standard (70%)</div><div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 300, color: "rgba(255,255,255,0.72)" }}>${comp70.toLocaleString()}</div></div>
            <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.72)", marginBottom: 4 }}>With Gold AI Lift (~12%)</div><div style={{ fontFamily: F.display, fontSize: 44, fontWeight: 300, color: C.gold }}>${withLift.toLocaleString()}</div></div>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", padding: 16, marginBottom: 24 }}><div style={{ fontSize: 14, color: C.white, fontWeight: 400 }}>+${(withLift - comp70).toLocaleString()}/year</div><div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.72)" }}>Estimated additional earnings from AI-optimized documentation</div></div>
            <div style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.72)", lineHeight: 1.6, marginBottom: 20 }}>Based on {wpy} working weeks/year. Actual comp varies by facility, payer mix, and complexity.</div>
            <Btn primary full href={careersUrl("comp-estimator")} external>Explore Open Roles →</Btn>
          </div>
        </div></Reveal>
      </div>
    </section>

    {/* Open Roles — funnels to the careers site, which owns the live list */}
    <section id="positions" className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
      <Reveal><SectionHeader badge="Open Positions" title="Join the Gold Team" subtitle="PM&R and Internal Medicine roles across our markets — every role includes Gold Bar certification, AI documentation tools, and scribe support. Current openings and applications live on our careers site, connected directly to our recruiting team." /></Reveal>
      <Reveal delay={0.1}><div style={{ background: C.navy, border: `1px solid ${C.line}`, padding: "48px 40px", textAlign: "center" }}>
        <h3 style={{ fontFamily: F.display, fontSize: 22, fontWeight: 400, marginBottom: 12, color: C.dark }}>See What's Open Right Now</h3>
        <p style={{ color: C.muted, fontSize: 15, fontWeight: 300, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 28px" }}>Browse current physician openings across our markets and apply in minutes — always up to date, straight from our recruiting team.</p>
        <Btn primary href={careersUrl("positions")} external>View Open Roles →</Btn>
        <p style={{ color: C.muted, fontSize: 14, fontWeight: 300, marginTop: 24 }}>Don't see your market? We're always expanding — <a href={careersUrl("new-markets")} target="_blank" rel="noopener noreferrer" style={{ color: C.deepGold, fontWeight: 400 }}>tell us where you are →</a></p>
      </div></Reveal>
    </section>

    {/* Gold Bar */}
    <section style={{ background: C.navy, borderTop: `1px solid ${C.line}` }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 64, alignItems: "center" }}>
          <div><Badge>Gold Bar Certified</Badge><h2 className="sec-title" style={{ fontFamily: F.display, fontSize: 32, fontWeight: 400, lineHeight: 1.2, margin: "20px 0 16px", color: C.dark }}>The Credential That Sets You Apart</h2><p style={{ color: C.muted, fontSize: 16, fontWeight: 300, lineHeight: 1.8, marginBottom: 24 }}>A rigorous one-year curriculum covering CMG mastery, CMS compliance, IDT leadership, and facility financial impact. Earned through testing and demonstrated performance.</p>{["IRF-specific curriculum no residency teaches","AMA CME certification pending (expected 2027)","Recertification with performance accountability","Thought leadership and content creation opportunities"].map((item,i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}><span style={{ color: C.deepGold, fontSize: 14, marginTop: 2 }} aria-hidden="true">✦</span><span style={{ color: C.mutedLight, fontSize: 15, fontWeight: 300, lineHeight: 1.6 }}>{item}</span></div>)}</div>
          {/* Was a hand-built gold gradient square with a serif "G" — a redrawn
              mark, which kit p13 forbids outright. Now the supplied tile asset. */}
          <div style={{ background: C.white, border: `1px solid ${C.line}`, padding: 56, textAlign: "center" }}><img src="/GOLD-tile-dark.png" alt="" width={96} height={96} style={{ display: "block", margin: "0 auto 24px" }} /><div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 400, marginBottom: 8, color: C.dark }}>Gold Bar</div><div style={{ fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: C.deepGold, fontWeight: 300, marginBottom: 24 }}>Certified Physician</div><div style={{ width: 60, height: 1, background: C.gold, margin: "0 auto 24px" }} /><p style={{ color: C.muted, fontSize: 14, fontWeight: 300, lineHeight: 1.7 }}>The credential that tells facilities you don't just meet the standard — you set it.</p></div>
        </div></Reveal>
      </div>
    </section>
  </>;
}

// ===== TECHNOLOGY =====
function TechnologyPage({ nav }) {
  const [af, setAf] = useState(0);
  const features = [
    { name: "AI Documentation Co-Pilot", icon: BrainCircuit, desc: "The note is drafted before you walk in. It reads prior encounters, labs, imaging, orders, and vitals from the EHR, then ambient listening at the bedside finalizes it — structured to IRF-PAI items, CMS requirements, and CMG diagnoses.", bullets: ["60–70% documentation time reduction","Maps to IRF Gold Documentation standards","Learns physician preferences","Specialty-specific, not generic"] },
    { name: "CMG Optimizer", icon: ChartColumn, desc: "Real-time documentation analysis against the CMG Motor Matrix. Flags missing diagnoses affecting reimbursement.", bullets: ["Directly increases facility revenue","Catches missed diagnoses pre-billing","Benchmarks against CMG ≥1.0 target","Documentation becomes revenue driver"] },
    { name: "Compliance Watchdog", icon: ShieldAlert, desc: "Countdown timers on every required documentation item. Escalation alerts. Eliminates $30K–$80K denial risk.", bullets: ["Real-time CMS deadline tracking","Automated escalation chain","Zero late documentation tolerance","Prevents avoidable technical denials"] },
    { name: "Facility Scorecards", icon: ChartLine, desc: "Automated dashboards: CMG, discharge rates, RTA, readmissions, PEM scores for every Gold facility.", bullets: ["Real-time outcome visibility","National benchmark comparisons","Exportable facility reports","Data-driven sales conversations"] },
    { name: "Automated Billing", icon: ReceiptText, desc: "AI-assisted coding, claims submission, denial prevention, real-time tracking. Replacing outsourced billing.", bullets: ["Faster collections cycle","Denial pattern recognition","Provider pay transparency"] },
    { name: "Provider Dashboard", icon: LayoutDashboard, desc: "Personal metrics, compensation, scheduling, Gold Bar progress, census visibility — one interface.", bullets: ["Real-time earnings visibility","Schedule management","Gold Bar progress tracking","HIPAA-compliant comms hub"] },
  ];
  return <>
    <section className="sec-hero" style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>GoldOS Platform</Badge><h1 className="hero-title" style={{ fontFamily: F.display, fontSize: "min(48px, 7vw)", fontWeight: 500, lineHeight: 1.15, letterSpacing: -0.5, margin: "24px 0 20px", color: C.dark }}>The Intelligence Layer<br/>for Post-Acute Medical Management</h1><p style={{ color: C.muted, fontSize: 18, fontWeight: 300, maxWidth: 640, lineHeight: 1.8 }}>Purpose-built for integrated post-acute medical management — PM&R and Internal Medicine on one platform. A proprietary platform that makes physicians faster and facilities more profitable.</p></Reveal>
    </section>
    <section className="sec-bot" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 80px" }}>
      <Reveal><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 16, marginBottom: 64 }}>{["EHR-Agnostic","AI-Assisted, Physician-Controlled","Data as Competitive Advantage","Built for Practice, Empowering Facilities"].map((p,i) => <div key={i} style={{ background: C.navy, border: `1px solid ${C.line}`, padding: "16px 20px", textAlign: "center" }}><span style={{ fontSize: 14, fontWeight: 500, color: C.deepGold }}>{p}</span></div>)}</div></Reveal>
      <Reveal><div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 0 }} className="grid-2-stack">
        <div style={{ borderRight: `1px solid ${C.line}` }}>{features.map((f,i) => <button key={i} onClick={() => setAf(i)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "18px 20px", background: af === i ? C.goldSoft : "transparent", border: "none", borderLeft: `3px solid ${af === i ? C.deepGold : "transparent"}`, color: af === i ? C.dark : C.muted, fontSize: 14, fontWeight: af === i ? 600 : 400, cursor: "pointer", textAlign: "left", transition: "all 0.3s", fontFamily: F.body }}><f.icon {...ICON} size={20} color="currentColor" /> {f.name}</button>)}</div>
        <div style={{ padding: "32px 40px", background: C.slate, border: `1px solid ${C.line}`, minHeight: 340 }}><h3 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8, color: C.dark }}>{features[af].name}</h3><p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{features[af].desc}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>{features[af].bullets.map((b,i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "rgba(0,0,0,0.02)", border: `1px solid ${C.line}` }}><span style={{ color: C.deepGold, marginTop: 1 }} aria-hidden="true">✦</span><span style={{ fontSize: 14, color: C.mutedLight, lineHeight: 1.5 }}>{b}</span></div>)}</div></div>
      </div></Reveal>
    </section>
    {/* Roadmap */}
    <section style={{ background: C.navy, borderTop: `1px solid ${C.line}` }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Roadmap" title="Building in Public" subtitle="Transparency builds trust." /></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
          {[{ph:"Phase 1 — 2026",t:"Foundation",items:["AI Assisted Documentation MVP","Compliance Watchdog","Gold Bar LMS","Data Schema Definition"],st:"In Progress"},{ph:"Phase 2 — 2027",t:"Automation",items:["EHR-Agnostic Integration Layer","CMG Optimizer","HIPAA Comms System","Provider Dashboards"],st:"Planned"},{ph:"Phase 3 — 2028",t:"Intelligence",items:["Facility Scorecards","Predictive Models","Market Intelligence","Risk Stratification"],st:"Planned"}].map((p,i) => <Reveal key={i} delay={i*0.1}><div style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 32, height: "100%", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}><span style={{ fontSize: 12, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase", color: C.deepGold }}>{p.ph}</span><span style={{ fontSize: 12, fontWeight: 400, padding: "4px 10px", whiteSpace: "nowrap", background: i===0?"rgba(4,120,87,0.1)":"rgba(15,23,42,0.04)", color: i===0?C.green:C.muted }}>{p.st}</span></div><h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 400, marginBottom: 16, color: C.dark }}>{p.t}</h3>{p.items.map((item,j) => <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}><div style={{ width: 6, height: 6, flexShrink: 0, marginTop: 7, background: i===0?C.deepGold:C.line, borderRadius: "50%" }} /><span style={{ fontSize: 14, color: C.mutedLight, lineHeight: 1.5 }}>{item}</span></div>)}</div></Reveal>)}
        </div>
      </div>
    </section>
    <section className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px", textAlign: "center" }}><Reveal><h2 className="sec-title" style={{ fontFamily: F.display, fontSize: 36, fontWeight: 500, marginBottom: 16, color: C.dark }}>See GoldOS in Action</h2><p style={{ color: C.muted, fontSize: 16, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>We'll walk you through the platform and discuss what it means for your operation.</p><Btn primary onClick={() => nav("contact")}>Request a Demo →</Btn></Reveal></section>
  </>;
}

// ===== CONTACT =====
// Facility inquiries only. Physician intake now lives on careers.goldpmr.com
// (GoldOS-connected), so the physician tab and resume upload were removed.
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", org: "", phone: "", message: "", address: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const validate = () => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) return "Please enter a valid phone number (at least 10 digits).";
    return null;
  };
  const handleSubmit = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true);
    setError(null);
    try {
      const data = new FormData();
      data.append("type", "facility");
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("message", form.message);
      data.append("org", form.org);
      data.append("address", form.address);
      const res = await fetch("/api/contact", { method: "POST", body: data });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Submission failed. Please try again.");
      }
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  return <section className="sec-hero" style={{ maxWidth: 800, margin: "0 auto", padding: "140px 40px 100px" }}>
    <Reveal><SectionHeader badge="Get in Touch" title="Start a Conversation" subtitle="Exploring a physician partnership for your facility? We're ready to talk." /></Reveal>
    <Reveal delay={0.1}>{!submitted ? <div style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 40, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
      <div style={{ marginBottom: 28, padding: "14px 18px", background: C.navy, border: `1px solid ${C.line}`, fontSize: 14, fontWeight: 300, color: C.mutedLight, lineHeight: 1.6 }}>Physician looking to join Gold? Head to <a href={careersUrl("contact-redirect")} target="_blank" rel="noopener noreferrer" style={{ color: C.deepGold, fontWeight: 400 }}>careers.goldpmr.com →</a> to see open roles and apply.</div>
      <div className="grid-contact" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "0 20px" }}><Input label="Full Name" value={form.name} onChange={v => set("name",v)} placeholder="Jane Smith" /><Input label="Email" type="email" value={form.email} onChange={v => set("email",v)} placeholder="jane@example.com" /><Input label="Facility / Organization" value={form.org} onChange={v => set("org",v)} /><Input label="Phone" type="tel" value={form.phone} onChange={v => set("phone",v)} placeholder="(555) 123-4567" /></div>
      <Input label="Address" value={form.address} onChange={v => set("address",v)} placeholder="123 Main St, City, State ZIP" />
      <Input label="Tell us about your facility" type="textarea" value={form.message} onChange={v => set("message",v)} />
      <Btn primary full onClick={handleSubmit} style={{ marginTop: 8 }}>{submitting ? "Submitting..." : "Submit Inquiry →"}</Btn>
      {error && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: C.red, fontSize: 13 }}>{error}</div>}
    </div> : <div style={{ background: C.slate, border: `1px solid ${C.line}`, padding: 56, textAlign: "center", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}><div style={{ fontSize: 48, marginBottom: 16 }}>✓</div><h3 style={{ fontSize: 24, fontWeight: 500, marginBottom: 12, color: C.dark }}>Thank You</h3><p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>We've received your inquiry. A member of the Gold team will reach out within one business day.</p></div>}</Reveal>
  </section>;
}

// ===== APP =====
// Client-side routing. Each page is a real URL so deep links, back/forward, and
// sharing work; unknown paths resolve to home. Requires the SPA rewrite in
// vercel.json so the server hands every non-/api path to this app. document.title
// is per-page for shareability (the shell HTML is JS-rendered, so this is what a
// browser tab / link preview shows).
const PATHS = { home: "/", facilities: "/facilities", physicians: "/physicians", technology: "/technology", contact: "/contact" };
const ORIGIN = "https://www.goldpmr.com";
// Per-route SEO metadata. index.html carries homepage-framed static defaults for
// non-JS crawlers and social scrapers; these update title/description/canonical/OG
// on the rendered DOM, which JS-rendering crawlers (Google) read per route.
const META = {
  home: { title: "Gold PM&R — Post-Acute Rehab Specialists", desc: "Gold PM&R is a physician-owned rehabilitation medicine group delivering comprehensive, high-quality PM&R across the post-acute continuum — inpatient rehab, ARU, SNF, and LTAC." },
  facilities: { title: "For Facilities — Gold PM&R", desc: "Physician partnership that raises CMI, keeps 100% CMS compliance, and delivers post-acute outcomes that become your competitive advantage." },
  physicians: { title: "For Physicians — Gold PM&R", desc: "PM&R and Internal Medicine physicians co-managing every patient — 70% compensation, AI documentation, personalized schedules, and a paid leadership ladder." },
  technology: { title: "GoldOS Platform — Gold PM&R", desc: "GoldOS is the intelligence layer for post-acute medical management: AI documentation, real-time compliance tracking, CMG optimization, and outcome analytics." },
  contact: { title: "Get in Touch — Gold PM&R", desc: "Facility exploring a physician partnership? Start a conversation with the Gold PM&R team." },
};
const pageFromPath = (path) => Object.keys(PATHS).find(k => PATHS[k] === path) || "home";

// Reflect the active route into the document head so JS-rendering crawlers get
// per-page title/description/canonical/OG. Social scrapers (no JS) fall back to
// the homepage-framed statics in index.html — that's the Tier-1 boundary.
function applyMeta(pageKey) {
  const m = META[pageKey] || META.home;
  const url = ORIGIN + (PATHS[pageKey] || "/");
  document.title = m.title;
  const set = (sel, attr, val) => { const el = document.head.querySelector(sel); if (el) el.setAttribute(attr, val); };
  set('meta[name="description"]', "content", m.desc);
  set('meta[property="og:title"]', "content", m.title);
  set('meta[property="og:description"]', "content", m.desc);
  set('meta[property="og:url"]', "content", url);
  set('meta[name="twitter:title"]', "content", m.title);
  set('meta[name="twitter:description"]', "content", m.desc);
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement("link"); link.setAttribute("rel", "canonical"); document.head.appendChild(link); }
  link.setAttribute("href", url);
}

export default function App() {
  const [page, setPage] = useState(() => (typeof window === "undefined" ? "home" : pageFromPath(window.location.pathname)));
  const [scrolled, setScrolled] = useState(false);
  const [mm, setMm] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 60); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  // Sync page -> URL + title. On first load, canonicalize an unknown path to the
  // resolved page's URL (e.g. /bogus -> /) with replaceState so we don't add a
  // history entry. Back/forward is handled by popstate.
  useEffect(() => {
    const canonical = PATHS[page] || "/";
    if (window.location.pathname !== canonical) window.history.replaceState({ page }, "", canonical);
    applyMeta(page);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onPop = () => { const p = pageFromPath(window.location.pathname); setPage(p); applyMeta(p); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const nav = useCallback((p) => {
    setPage(p);
    setMm(false);
    const path = PATHS[p] || "/";
    if (window.location.pathname !== path) window.history.pushState({ page: p }, "", path);
    applyMeta(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  const links = [{l:"About",p:"home"},{l:"Facilities",p:"facilities"},{l:"Physicians",p:"physicians"},{l:"Technology",p:"technology"}];

  return <div style={{ background: C.white, color: C.dark, fontFamily: F.body, fontWeight: 300, minHeight: "100vh", overflowX: "hidden" }}>
    <style>{`
      * { margin: 0; padding: 0; box-sizing: border-box; }
      ::selection { background: ${C.gold}; color: ${C.dark}; }
      html { scroll-behavior: smooth; }
      @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
      select option { background: #FFFFFF; color: ${C.dark}; }

      /* Kit p12 — "Visible focus state on every control: a 2 px bronze ring,
         not color alone." Bronze = Deep Gold. */
      :focus-visible {
        outline: 2px solid ${C.deepGold};
        outline-offset: 2px;
      }

      /* Kit p12 — "Honor reduced-motion and dark-mode preferences." */
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      @media (max-width: 768px) {
        .grid-2-stack { grid-template-columns: 1fr !important; border-right: none !important; }
        .nd { display: none !important; }
        .nm { display: block !important; }
        .nav-outer { padding-left: 20px !important; padding-right: 20px !important; }
        .sec-hero { padding-top: 80px !important; padding-bottom: 60px !important; padding-left: 20px !important; padding-right: 20px !important; }
        .sec-pad { padding-top: 60px !important; padding-bottom: 60px !important; padding-left: 20px !important; padding-right: 20px !important; }
        .sec-bot { padding-top: 20px !important; padding-bottom: 60px !important; padding-left: 20px !important; padding-right: 20px !important; }
        .sec-title { font-size: 28px !important; }
        .stat-num { font-size: 36px !important; }
        .hero-title { font-size: clamp(32px, 10vw, 56px) !important; }
        .grid-contact { grid-template-columns: 1fr !important; }
        .footer-inner { padding: 40px 20px 24px !important; }
        .cta-inner { padding: 40px 20px !important; }
      }
    `}</style>

    {/* Nav links were <span onClick> — invisible to keyboard and screen readers.
        Now real <button>s: focusable, Enter/Space-activated, 44px tap targets,
        with aria-current marking the active page (not color alone — kit p12). */}
    <nav className="nav-outer" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.line}`, transition: "all 0.4s", padding: "0 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 76 }}>
        <button onClick={() => nav("home")} aria-label="Gold PM&R — home" style={{ display: "flex", alignItems: "center", cursor: "pointer", background: "none", border: "none", padding: 0, minHeight: 44 }}><img src="/GOLD-lockup-on-light.png" alt="Gold PM&R — Post-Acute Rehab Specialists" width={121} height={38} style={{ height: 38, width: "auto", display: "block" }} /></button>
        <div className="nd" style={{ display: "flex", gap: 8, alignItems: "center" }}>{links.map(l => <button key={l.p} onClick={() => nav(l.p)} aria-current={page===l.p ? "page" : undefined} style={{ color: page===l.p?C.deepGold:C.muted, background: "none", border: "none", fontFamily: F.body, fontSize: 14, fontWeight: page===l.p?400:300, cursor: "pointer", transition: "color 0.3s", padding: "0 12px", minHeight: 44 }} onMouseEnter={e => e.currentTarget.style.color = C.deepGold} onMouseLeave={e => { if (page!==l.p) e.currentTarget.style.color = C.muted; }}>{l.l}</button>)}<Btn primary onClick={() => nav("contact")} style={{ padding: "10px 20px", fontSize: 13, marginLeft: 16 }}>Get in Touch</Btn></div>
        <button className="nm" onClick={() => setMm(!mm)} aria-expanded={mm} aria-label="Toggle navigation menu" style={{ display: "none", background: "none", border: "none", color: C.dark, fontSize: 22, cursor: "pointer", minWidth: 44, minHeight: 44 }}>☰</button>
      </div>
      {mm && <div style={{ padding: "12px 0 20px", display: "flex", flexDirection: "column", gap: 4 }}>{links.map(l => <button key={l.p} onClick={() => nav(l.p)} aria-current={page===l.p ? "page" : undefined} style={{ color: page===l.p?C.deepGold:C.muted, background: "none", border: "none", fontFamily: F.body, fontSize: 15, fontWeight: 300, cursor: "pointer", textAlign: "left", minHeight: 44 }}>{l.l}</button>)}<Btn primary onClick={() => nav("contact")} style={{ width: "100%", marginTop: 8 }}>Get in Touch</Btn></div>}
    </nav>

    {page === "home" && <HomePage nav={nav} />}
    {page === "facilities" && <FacilitiesPage nav={nav} />}
    {page === "physicians" && <PhysiciansPage />}
    {page === "technology" && <TechnologyPage nav={nav} />}
    {page === "contact" && <ContactPage />}

    {page !== "contact" && <section style={{ background: C.navy, borderTop: `1px solid ${C.line}` }}><div className="cta-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}><div><h3 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 400, marginBottom: 4, color: C.dark }}>Ready to Raise the Standard?</h3><p style={{ color: C.muted, fontSize: 15, fontWeight: 300 }}>{page === "physicians" ? "Explore open roles and build your career with Gold." : "Let's talk about what Gold can do for your facility or your career."}</p></div>{page === "physicians" ? <Btn primary href={careersUrl("cta-band")} external>View Open Roles →</Btn> : <Btn primary onClick={() => nav("contact")}>Schedule a Conversation →</Btn>}</div></section>}

    {/* Ink Navy footer with the on-dark lockup. Together with the metrics band
        and the two result panels this brings ink navy to roughly the kit's 22%. */}
    <footer style={{ background: C.dark }}><div className="footer-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 40px 32px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 40, marginBottom: 40 }}>
      <div><img src="/GOLD-lockup-on-dark.png" alt="Gold PM&R — Post-Acute Rehab Specialists" width={140} height={44} style={{ height: 44, width: "auto", display: "block", marginBottom: 24 }} /><p style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, fontWeight: 300, lineHeight: 1.6 }}>Setting the standard in post-acute medical management.</p><p style={{ color: "rgba(255,255,255,0.72)", fontSize: 14, fontWeight: 300, marginTop: 8 }}>NV · CA · CO · AZ · OR · TX</p></div>
      {[{t:"Company",ls:[{l:"About",p:"home"},{l:"Technology",p:"technology"},{l:"Careers",href:careersUrl("footer-careers")},{l:"Contact",p:"contact"}]},{t:"Facilities",ls:[{l:"Partnership",p:"facilities"},{l:"ROI Calculator",p:"facilities"},{l:"Compliance Quiz",p:"facilities"},{l:"Case Studies",p:"facilities"}]},{t:"Physicians",ls:[{l:"Open Positions",href:careersUrl("footer-positions")},{l:"Compensation",p:"physicians"},{l:"Gold Bar",p:"physicians"},{l:"Culture",p:"physicians"}]}].map((col,i) => { const fstyle = { color: "rgba(255,255,255,0.72)", background: "none", border: "none", fontFamily: F.body, fontSize: 14, fontWeight: 300, cursor: "pointer", transition: "color 0.3s", textAlign: "left", padding: "6px 0", minHeight: 32, textDecoration: "none", display: "inline-block" }; const enter = e => e.currentTarget.style.color = C.goldLight; const leave = e => e.currentTarget.style.color = "rgba(255,255,255,0.72)"; return <div key={i}><div style={{ fontWeight: 300, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: C.goldLight, marginBottom: 14 }}>{col.t}</div>{col.ls.map(link => <div key={link.l}>{link.href ? <a href={link.href} target="_blank" rel="noopener noreferrer" style={fstyle} onMouseEnter={enter} onMouseLeave={leave}>{link.l}</a> : <button onClick={() => nav(link.p)} style={fstyle} onMouseEnter={enter} onMouseLeave={leave}>{link.l}</button>}</div>)}</div>; })}
    </div><div style={{ borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><span style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 300 }}>© 2026 Gold Physical Medicine and Rehabilitation, PC & Gold Management Services, LLC</span><span style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 300 }}>Physician-Led · Technology-Forward · Outcome-Driven</span></div></div></footer>
  </div>;
}
