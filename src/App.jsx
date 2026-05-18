import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  gold: "#C9A227", goldLight: "#E8D48B",
  dark: "#0F172A",        // primary text + gold button text
  navy: "#F0F4F8",        // alternating section backgrounds
  slate: "#FFFFFF",       // card / form surfaces
  white: "#FFFFFF",       // main page background
  light: "#F8FAFC",
  muted: "#64748B",       // muted body text (readable on white)
  mutedLight: "#374151",  // label text (readable on white)
  goldSoft: "rgba(201,162,39,0.08)", goldGlow: "rgba(201,162,39,0.15)",
  green: "#10B981", red: "#EF4444", blue: "#3B82F6",
};

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
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>{children}</div>;
}

function AnimNum({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => { const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.3 }); if (ref.current) obs.observe(ref.current); return () => obs.disconnect(); }, []);
  useEffect(() => { if (!vis) return; const num = parseInt(String(target).replace(/\D/g, "")); if (isNaN(num)) return; let s = 0; const step = Math.max(1, Math.floor(num / 50)); const iv = setInterval(() => { s += step; if (s >= num) { setCount(num); clearInterval(iv); } else setCount(s); }, 25); return () => clearInterval(iv); }, [vis, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function Badge({ children }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", border: "1px solid rgba(201,162,39,0.3)", background: C.goldSoft, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.gold }}><span style={{ width: 6, height: 6, background: C.gold, borderRadius: "50%" }} />{children}</span>;
}

function SectionHeader({ badge, title, subtitle, align = "center" }) {
  return <div style={{ textAlign: align, marginBottom: 56 }}>{badge && <div style={{ marginBottom: 16 }}><Badge>{badge}</Badge></div>}<h2 className="sec-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, lineHeight: 1.15, marginBottom: subtitle ? 20 : 0, color: C.dark }}>{title}</h2>{subtitle && <p style={{ color: C.muted, fontSize: 17, maxWidth: 620, margin: align === "center" ? "0 auto" : 0, lineHeight: 1.7 }}>{subtitle}</p>}</div>;
}

function Card({ icon, title, desc }) {
  return <div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 36, transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", position: "relative", overflow: "hidden", height: "100%", cursor: "default", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(201,162,39,0.25)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}>{icon && <div style={{ fontSize: 28, marginBottom: 16 }}>{icon}</div>}<h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: C.dark }}>{title}</h3><p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{desc}</p></div>;
}

function Btn({ children, primary, onClick, full, style: s = {} }) {
  const base = primary ? { background: C.gold, color: C.dark, border: "none", fontWeight: 700 } : { background: "transparent", color: C.dark, border: "1px solid rgba(0,0,0,0.18)", fontWeight: 500 };
  return <button onClick={onClick} style={{ ...base, padding: "14px 32px", fontSize: 15, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5, width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, ...s }} onMouseEnter={e => { if (primary) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(201,162,39,0.3)"; } else { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; } }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; if (!primary) { e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)"; e.currentTarget.style.color = C.dark; } }}>{children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, options }) {
  const shared = { width: "100%", padding: "12px 16px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", color: C.dark, fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.3s" };
  return <div style={{ marginBottom: 20 }}>{label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.mutedLight, marginBottom: 6 }}>{label}</label>}{type === "select" ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...shared, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"}>{options.map(o => <option key={o.value} value={o.value} style={{ background: "#FFFFFF" }}>{o.label}</option>)}</select> : type === "textarea" ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...shared, resize: "vertical" }} onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={shared} onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.12)"} />}</div>;
}

// ===== HOME =====
function HomePage({ nav }) {
  return <>
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", filter: "blur(80px)", background: `radial-gradient(circle, ${C.goldGlow}, transparent)`, top: "10%", right: "-10%", animation: "pulse 6s ease-in-out infinite" }} />
      <div className="sec-hero" style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 40px 80px", textAlign: "center", position: "relative", zIndex: 2 }}>
        <Reveal><Badge>Physician-Led · Technology-Forward · Outcome-Driven</Badge></Reveal>
        <Reveal delay={0.1}><h1 className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(72px, 8vw)", fontWeight: 700, lineHeight: 1.05, margin: "28px 0", background: `linear-gradient(135deg, ${C.dark} 0%, ${C.dark} 60%, ${C.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>The New Standard in<br/>Inpatient Rehabilitation</h1></Reveal>
        <Reveal delay={0.2}><p style={{ fontSize: 19, color: C.muted, maxWidth: 640, margin: "0 auto 44px", lineHeight: 1.7 }}>Gold PM&R delivers integrated co-management of inpatient rehab patients—combining Physical Medicine & Rehabilitation with Internal Medicine through our providers or in collaboration with your existing physician teams—supported by proprietary technology that produces measurably superior outcomes for facilities and their patients.</p></Reveal>
        <Reveal delay={0.3}><div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}><Btn primary onClick={() => nav("facilities")}>For Facilities →</Btn><Btn onClick={() => nav("physicians")}>For Physicians →</Btn></div></Reveal>
      </div>
    </section>
    <section style={{ background: C.navy, borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 32, textAlign: "center" }}>
        {[{v:300,s:"+",l:"Beds Managed"},{v:12,s:"",l:"Facilities"},{v:4,s:"",l:"States"},{v:30,s:"+",l:"Providers"}].map((m,i) => <div key={i}><div className="stat-num" style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700, color: C.gold }}><AnimNum target={m.v} suffix={m.s} /></div><div style={{ fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 2, fontWeight: 500 }}>{m.l}</div></div>)}
      </div>
    </section>
    <section className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 40px" }}>
      <Reveal><SectionHeader badge="Who We Serve" title="Two Paths. One Standard." /></Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 24 }}>
        {[{p:"facilities",badge:"For Facilities",h:"Higher Reimbursement. Zero Compliance Risk. Better Outcomes.",d:"Gold physicians maximize CMI scores, maintain 100% CMS compliance, and deliver outcomes that become your strongest marketing asset.",cta:"Explore Partnership →"},{p:"physicians",badge:"For Physicians",h:"Best Tools. Best Support. Best Career in Post-Acute Medicine.",d:"PM&R and Internal Medicine physicians co-managing every patient. 70% compensation with documentation support that lets you earn more per hour. Personalized schedules, paid leadership roles, and a mission worth showing up for.",cta:"Explore Careers →"}].map((c,i) => <Reveal key={i} delay={i*0.1} style={{ height: "100%" }}><div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 48, cursor: "pointer", transition: "all 0.4s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", height: "100%", display: "flex", flexDirection: "column" }} onClick={() => nav(c.p)} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.3)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}><div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.gold, marginBottom: 20 }}>{c.badge}</div><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 16, color: C.dark }}>{c.h}</h3><p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 24, flex: 1 }}>{c.d}</p><span style={{ color: C.gold, fontSize: 15, fontWeight: 600 }}>{c.cta}</span></div></Reveal>)}
      </div>
    </section>
    <section style={{ background: C.navy, borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}><div style={{ maxWidth: 560 }}><Badge>GoldOS Platform</Badge><h2 className="sec-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, margin: "20px 0 16px", color: C.dark }}>Technology That No Competitor Can Match</h2><p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8 }}>AI documentation co-pilot, real-time compliance tracking, CMG/CMI optimization, and automated billing — purpose-built for integrated post-acute medical management by Gold Management Services MSO.</p></div><Btn primary onClick={() => nav("technology")}>Explore the Platform →</Btn></div></Reveal>
      </div>
    </section>
  </>;
}

// ===== FACILITIES =====
function FacilitiesPage({ nav }) {
  const benefits = [
    { icon: "💰", title: "Higher Reimbursement", desc: "Documentation education produces higher CMI scores. Gold targets CMI ≥1.5 — facilities with poor documentation fall below and lose money per admission." },
    { icon: "🛡️", title: "Zero Compliance Risk", desc: "100% on-time CMS documentation. Even one missed documentation deadline can result in costly technical denials and preventable revenue loss = $30K–$80K. Our Compliance Watchdog tracks every deadline in real time." },
    { icon: "📊", title: "Superior Outcomes", desc: "Integrated PM&R and Internal Medicine leadership within a multidisciplinary rehab team drives superior outcomes compared to isolated single-specialty models. <8% return-to-acute, ≥82% discharge-to-community, <10% discharge to SNF." },
    { icon: "⚡", title: "GoldOS Technology", desc: "Real-time compliance dashboards, CMI optimization alerts, outcome analytics — capabilities no other physician group provides." },
    { icon: "✓", title: "Gold Bar Certified Physicians", desc: "Rigorous IRF-specific certification. Consistent quality, not physician roulette." },
    { icon: "🔄", title: "Continuity Guaranteed", desc: "Multi-provider model with built-in coverage redundancy. No scrambling when your solo independent medical director goes on vacation." },
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
  const compColor = compScore <= 3 ? C.green : compScore <= 7 ? C.gold : compScore <= 11 ? "#F59E0B" : C.red;

  return <>
    <section className="sec-hero" style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>For Facilities</Badge><h1 className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(56px, 7vw)", fontWeight: 700, lineHeight: 1.1, margin: "24px 0 20px", background: `linear-gradient(135deg, ${C.dark} 0%, ${C.dark} 60%, ${C.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your Physician Partner<br/>Should Make You Money</h1><p style={{ color: C.muted, fontSize: 19, maxWidth: 640, lineHeight: 1.7, marginBottom: 32 }}>Most physicians provide basic coverage. Gold delivers integrated co-management of your post-acute patients — partnering with your existing internal medicine team or providing our own when you don't have one — for higher CMI scores, zero compliance risk, and outcomes that become your competitive advantage.</p><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><Btn primary onClick={() => document.getElementById("roi")?.scrollIntoView({ behavior: "smooth" })}>Calculate Your ROI →</Btn><Btn onClick={() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })}>Take Compliance Assessment</Btn></div></Reveal>
    </section>
    <section className="sec-bot" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 100px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 20 }}>{benefits.map((b,i) => <Reveal key={i} delay={i*0.06}><Card {...b} /></Reveal>)}</div></section>

    {/* Case Study */}
    <section style={{ background: C.navy, borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Case Study" title="The Gold Effect: Before & After" subtitle="Illustrative scenario based on typical facility patterns." /></Reveal>
        <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 24 }}>
          {[{l:"CMI Score",b:"1.3",a:"1.6"},{l:"Doc Compliance",b:"86%",a:"100%"},{l:"Discharge Home",b:"74%",a:"83%"},{l:"Return to Acute",b:"14%",a:"6%"}].map((m,i) => <div key={i} style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 28, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}><div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>{m.l}</div><div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}><div><div style={{ fontSize: 13, color: C.red, fontWeight: 600, marginBottom: 4 }}>Before</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "rgba(0,0,0,0.3)" }}>{m.b}</div></div><div style={{ color: C.gold, fontSize: 20 }}>→</div><div><div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 4 }}>After</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: C.gold }}>{m.a}</div></div></div></div>)}
        </div></Reveal>
      </div>
    </section>

    {/* ROI Calculator */}
    <section id="roi" className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
      <Reveal><SectionHeader badge="ROI Calculator" title="Estimate Your Revenue Impact" subtitle="See what Gold's documentation excellence and compliance technology could mean for your bottom line." /></Reveal>
      <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 32 }}>
        <div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 40, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: C.dark }}>Your Facility</h3>
          <Input label="Number of IRF Beds" type="number" value={beds} onChange={v => setBeds(Math.max(1, parseInt(v) || 1))} />
          <Input label="Current Average CMI Score" type="select" value={avgCmg} onChange={setAvgCmg} options={[{value:"1.05",label:"Below 1.1"},{value:"1.15",label:"1.1–1.2"},{value:"1.25",label:"1.2–1.3"},{value:"1.35",label:"1.3–1.4"},{value:"1.45",label:"1.4–1.5"},{value:"1.55",label:"Above 1.5"}]} />
          <Input label="Technical Denials per Year" type="select" value={denials} onChange={setDenials} options={[{value:"0",label:"None"},{value:"1",label:"1"},{value:"2",label:"2–3"},{value:"4",label:"4–5"},{value:"6",label:"6+"}]} />
        </div>
        <div style={{ background: `linear-gradient(135deg, rgba(201,162,39,0.06), rgba(201,162,39,0.02))`, border: "1px solid rgba(201,162,39,0.2)", padding: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: C.dark }}>Estimated Annual Impact</h3>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>CMI Score Improvement</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: C.gold }}>${Math.max(0,cmgLift).toLocaleString()}</div></div>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Denial Prevention Savings</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: C.gold }}>${denialSavings.toLocaleString()}</div></div>
          <div style={{ borderTop: "1px solid rgba(201,162,39,0.2)", paddingTop: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Total Revenue Impact</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: C.gold }}>${totalImpact.toLocaleString()}</div><div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>per year · Gold target CMI ≥1.5, 100% compliance</div></div>
          <Btn primary full onClick={() => nav("contact")} style={{ marginTop: 24 }}>Discuss These Numbers →</Btn>
        </div>
      </div></Reveal>
    </section>

    {/* Compliance Assessment */}
    <section id="assessment" style={{ background: C.navy, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="sec-pad" style={{ maxWidth: 800, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Compliance Assessment" title="What's Your Risk Profile?" subtitle="Five questions. Instant results." /></Reveal>
        <Reveal delay={0.1}><div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 40, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {!compDone ? <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <span style={{ fontSize: 13, color: C.muted }}>Question {compStep + 1} of {compQ.length}</span>
              <div style={{ display: "flex", gap: 6 }}>{compQ.map((_,i) => <div key={i} style={{ width: 32, height: 4, background: i <= compStep ? C.gold : "rgba(0,0,0,0.1)", transition: "background 0.3s" }} />)}</div>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, lineHeight: 1.4, color: C.dark }}>{compQ[compStep].q}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {compQ[compStep].opts.map((opt,i) => <button key={i} onClick={() => { setCompAnswers({...compAnswers, [compStep]: compQ[compStep].sc[i]}); setCompStep(compStep+1); }} style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.1)", padding: "16px 20px", color: C.dark, fontSize: 15, textAlign: "left", cursor: "pointer", transition: "all 0.3s", fontFamily: "'DM Sans', sans-serif" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldSoft; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}>{opt}</button>)}
            </div>
          </> : <div style={{ textAlign: "center" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", border: `3px solid ${compColor}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: compColor }}>{compScore}</span></div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: compColor, marginBottom: 8 }}>{compRisk} Risk</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: C.dark }}>{compScore <= 3 ? "Your compliance looks solid." : compScore <= 7 ? "There's room for improvement." : "You may be leaving significant revenue on the table."}</h3>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, maxWidth: 480, margin: "0 auto 24px" }}>{compScore <= 3 ? "Even well-run facilities benefit from Gold's technology layer — real-time tracking prevents errors manual processes can't catch." : "Gold's physician training and compliance technology directly addresses these gaps. Let's talk specifics."}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}><Btn primary onClick={() => nav("contact")}>Schedule a Conversation</Btn><Btn onClick={() => { setCompStep(0); setCompAnswers({}); }}>Retake</Btn></div>
          </div>}
        </div></Reveal>
      </div>
    </section>
  </>;
}

// ===== PHYSICIANS =====
function PhysiciansPage({ nav }) {
  const [ppd, setPpd] = useState(30);
  const [dpw, setDpw] = useState("7");
  const [wpy, setWpy] = useState("26");
  const encounters = ppd * parseInt(dpw) * parseInt(wpy);
  const comp70 = Math.round(encounters * 78 * 0.70);
  const withLift = Math.round(encounters * 88 * 0.70);

  const cards = [
    { icon: "🤖", title: "AI-Powered Practice", desc: "Documentation co-pilot built for inpatient rehab eliminates 60–70% of documentation time. Automated billing. Compliance watchdog. Focus on patients." },
    { icon: "📅", title: "Your Schedule, Your Life", desc: "Personalized schedule — patient volume, hours, time off. Week-on/week-off, 4 day weeks, seasonal flexibility." },
    { icon: "📈", title: "Leadership Ladder", desc: "Site Leader → Medical Director → Regional Director, and more. Paid roles with $15K–$150K+ stipends. Clear path without leaving practice." },
    { icon: "🎓", title: "Gold Bar Certification", desc: "The only IRF-specific physician certification. CMG mastery, CMS compliance, IDT leadership. AMA CME certification pending (expected 2027)." },
    { icon: "💰", title: "Student Loan Assistance", desc: "Loan assistance may be offered for qualifying multi-year commitments, along with sign-on and relocation support depending on position and location." },
    { icon: "🏥", title: "Mission-Driven, Physician-Owned", desc: "Built around quality care, clinical excellence, and supporting physicians with the right tools and environment." },
  ];
  const positions = [
    { title: "IRF Medical Director", loc: "Las Vegas, NV", type: "Full-time" },
    { title: "Physiatrist — Inpatient Rehab", loc: "Denver, CO", type: "Full-time" },
    { title: "Internal Medicine — Post-Acute Co-Management", loc: "Denver, CO", type: "Full-time" },
    { title: "Physiatrist — Acute Rehab Unit", loc: "Phoenix, AZ", type: "Full-time" },
    { title: "PM&R Physician", loc: "Thousand Oaks, CA", type: "Full / Part-time" },
  ];

  return <>
    <section className="sec-hero" style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>For Physicians</Badge><h1 className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(56px, 7vw)", fontWeight: 700, lineHeight: 1.1, margin: "24px 0 20px", background: `linear-gradient(135deg, ${C.dark} 0%, ${C.dark} 60%, ${C.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Practice Medicine.<br/>We Handle Everything Else.</h1><p style={{ color: C.muted, fontSize: 19, maxWidth: 640, lineHeight: 1.7, marginBottom: 32 }}>A collaborative practice environment where PM&R and Internal Medicine physicians co-manage every patient. 70% compensation, AI documentation that lets you earn more per hour, personalized schedules, a leadership ladder — and a supportive team that believes in high quality patient care.</p><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><Btn primary onClick={() => document.getElementById("positions")?.scrollIntoView({ behavior: "smooth" })}>View Open Positions →</Btn><Btn onClick={() => document.getElementById("comp-calc")?.scrollIntoView({ behavior: "smooth" })}>Estimate Your Earnings</Btn></div></Reveal>
    </section>
    <section className="sec-bot" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 100px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))", gap: 20 }}>{cards.map((b,i) => <Reveal key={i} delay={i*0.06}><Card {...b} /></Reveal>)}</div></section>

    {/* Comp Estimator */}
    <section id="comp-calc" style={{ background: C.navy, borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Compensation Estimator" title="Model Your Earnings at Gold" subtitle="See what 70% of a bigger number looks like with AI-optimized documentation." /></Reveal>
        <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(380px, 100%), 1fr))", gap: 32 }}>
          <div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 40, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: C.dark }}>Your Practice Profile</h3>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.mutedLight, marginBottom: 6 }}>Patients Per Day: {ppd}</label><input type="range" min={10} max={40} value={ppd} onChange={e => setPpd(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.gold, marginBottom: 20 }} /></div>
            <Input label="Days Per Week" type="select" value={dpw} onChange={setDpw} options={[{value:"2",label:"2 days"},{value:"3",label:"3 days"},{value:"4",label:"4 days"},{value:"5",label:"5 days"},{value:"6",label:"6 days"},{value:"7",label:"7 days"}]} />
            <Input label="Weeks Per Year" type="select" value={wpy} onChange={setWpy} options={[{value:"26",label:"26 weeks"},{value:"34",label:"34 weeks"},{value:"48",label:"48 weeks"},{value:"52",label:"52 weeks"}]} />
          </div>
          <div style={{ background: `linear-gradient(135deg, rgba(201,162,39,0.06), rgba(201,162,39,0.02))`, border: "1px solid rgba(201,162,39,0.2)", padding: 40 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, color: C.dark }}>Estimated Compensation</h3>
            <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Standard (70%)</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: C.muted }}>${comp70.toLocaleString()}</div></div>
            <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>With Gold AI Lift (~12%)</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: C.gold }}>${withLift.toLocaleString()}</div></div>
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: 16, marginBottom: 24 }}><div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>+${(withLift - comp70).toLocaleString()}/year</div><div style={{ fontSize: 13, color: C.muted }}>Estimated additional earnings from AI-optimized documentation</div></div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>Based on {wpy} working weeks/year. Actual comp varies by facility, payer mix, and complexity.</div>
            <Btn primary full onClick={() => nav("contact")}>Let's Talk Compensation →</Btn>
          </div>
        </div></Reveal>
      </div>
    </section>

    {/* Positions */}
    <section id="positions" className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
      <Reveal><SectionHeader badge="Open Positions" title="Join the Gold Team" subtitle="PM&R and Internal Medicine roles across our anchor markets. All positions include Gold Bar certification, AI documentation tools, and scribe support." /></Reveal>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {positions.map((p,i) => <Reveal key={i} delay={i*0.06}><div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, cursor: "pointer", transition: "all 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} onClick={() => nav("contact")} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.25)"; e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}><div><h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: C.dark }}>{p.title}</h3><div style={{ fontSize: 14, color: C.muted }}>{p.loc} · {p.type}</div></div><span style={{ color: C.gold, fontSize: 14, fontWeight: 600 }}>Apply →</span></div></Reveal>)}
      </div>
      <Reveal delay={0.3}><div style={{ textAlign: "center", marginTop: 32 }}><p style={{ color: C.muted, fontSize: 15, marginBottom: 16 }}>Don't see your market? We're expanding.</p><Btn onClick={() => nav("contact")}>Contact Us About New Markets</Btn></div></Reveal>
    </section>

    {/* Gold Bar */}
    <section style={{ background: C.navy, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: 64, alignItems: "center" }}>
          <div><Badge>Gold Bar Certified</Badge><h2 className="sec-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, lineHeight: 1.2, margin: "20px 0 16px", color: C.dark }}>The Credential That Sets You Apart</h2><p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>A rigorous one-year curriculum covering CMG mastery, CMS compliance, IDT leadership, and facility financial impact. Earned through testing and demonstrated performance.</p>{["IRF-specific curriculum no residency teaches","AMA CME certification pending (expected 2027)","Recertification with performance accountability","Thought leadership and content creation opportunities"].map((item,i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}><span style={{ color: C.gold, fontSize: 14, marginTop: 2 }}>✦</span><span style={{ color: C.mutedLight, fontSize: 15, lineHeight: 1.6 }}>{item}</span></div>)}</div>
          <div style={{ background: `linear-gradient(135deg, ${C.goldSoft}, rgba(201,162,39,0.02))`, border: "1px solid rgba(201,162,39,0.15)", padding: 56, textAlign: "center" }}><div style={{ width: 100, height: 100, margin: "0 auto 24px", background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: C.dark }}>G</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 8, color: C.dark }}>Gold Bar</div><div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 24 }}>Certified Physician</div><div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin: "0 auto 24px" }} /><p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>The credential that tells facilities you don't just meet the standard — you set it.</p></div>
        </div></Reveal>
      </div>
    </section>
  </>;
}

// ===== TECHNOLOGY =====
function TechnologyPage({ nav }) {
  const [af, setAf] = useState(0);
  const features = [
    { name: "AI Documentation Co-Pilot", icon: "🧠", desc: "Ambient listening generates structured notes mapped to IRF-PAI items, CMS requirements, and CMG diagnoses.", bullets: ["30–50% documentation time reduction","Maps to IRF Gold Documentation standards","Learns physician preferences","PM&R-specific, not generic"] },
    { name: "CMG Optimizer", icon: "📊", desc: "Real-time documentation analysis against the CMG Motor Matrix. Flags missing diagnoses affecting reimbursement.", bullets: ["Directly increases facility revenue","Catches missed diagnoses pre-billing","Benchmarks against CMG ≥1.0 target","Documentation becomes revenue driver"] },
    { name: "Compliance Watchdog", icon: "🛡️", desc: "Countdown timers on every required documentation item. Escalation alerts. Eliminates $30K–$80K denial risk.", bullets: ["Real-time CMS deadline tracking","Automated escalation chain","Zero late documentation tolerance","Prevents avoidable technical denials"] },
    { name: "Facility Scorecards", icon: "📈", desc: "Automated dashboards: CMG, discharge rates, RTA, readmissions, PEM scores for every Gold facility.", bullets: ["Real-time outcome visibility","National benchmark comparisons","Exportable facility reports","Data-driven sales conversations"] },
    { name: "Automated Billing", icon: "💰", desc: "AI-assisted coding, claims submission, denial prevention, real-time tracking. Replacing outsourced billing.", bullets: ["Faster collections cycle","Denial pattern recognition","Provider pay transparency"] },
    { name: "Provider Dashboard", icon: "👤", desc: "Personal metrics, compensation, scheduling, Gold Bar progress, census visibility — one interface.", bullets: ["Real-time earnings visibility","Schedule management","Gold Bar progress tracking","HIPAA-compliant comms hub"] },
  ];
  return <>
    <section className="sec-hero" style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>GoldOS Platform</Badge><h1 className="hero-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(56px, 7vw)", fontWeight: 700, lineHeight: 1.1, margin: "24px 0 20px", background: `linear-gradient(135deg, ${C.dark} 0%, ${C.dark} 60%, ${C.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>The Intelligence Layer<br/>for Post-Acute Medical Management</h1><p style={{ color: C.muted, fontSize: 19, maxWidth: 640, lineHeight: 1.7 }}>Owned by Gold Management Services MSO. Purpose-built for integrated post-acute medical management — PM&R and Internal Medicine on one platform. A proprietary platform that makes physicians faster and facilities more profitable.</p></Reveal>
    </section>
    <section className="sec-bot" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 80px" }}>
      <Reveal><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 16, marginBottom: 64 }}>{["EMR-Agnostic","AI-Assisted, Physician-Controlled","Data as Competitive Advantage","Built for Practice, Empowering Facilities"].map((p,i) => <div key={i} style={{ background: C.goldSoft, border: "1px solid rgba(201,162,39,0.2)", padding: "16px 20px", textAlign: "center" }}><span style={{ fontSize: 14, fontWeight: 600, color: C.gold }}>{p}</span></div>)}</div></Reveal>
      <Reveal><div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 0 }} className="grid-2-stack">
        <div style={{ borderRight: "1px solid rgba(0,0,0,0.08)" }}>{features.map((f,i) => <button key={i} onClick={() => setAf(i)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "18px 20px", background: af === i ? C.goldSoft : "transparent", border: "none", borderLeft: `3px solid ${af === i ? C.gold : "transparent"}`, color: af === i ? C.dark : C.muted, fontSize: 14, fontWeight: af === i ? 600 : 400, cursor: "pointer", textAlign: "left", transition: "all 0.3s", fontFamily: "'DM Sans', sans-serif" }}><span style={{ fontSize: 20 }}>{f.icon}</span> {f.name}</button>)}</div>
        <div style={{ padding: "32px 40px", background: C.slate, border: "1px solid rgba(0,0,0,0.08)", minHeight: 340 }}><h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: C.dark }}>{features[af].name}</h3><p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{features[af].desc}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>{features[af].bullets.map((b,i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)" }}><span style={{ color: C.gold, marginTop: 1 }}>✦</span><span style={{ fontSize: 14, color: C.mutedLight, lineHeight: 1.5 }}>{b}</span></div>)}</div></div>
      </div></Reveal>
    </section>
    {/* Roadmap */}
    <section style={{ background: C.navy, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Roadmap" title="Building in Public" subtitle="Transparency builds trust." /></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: 24 }}>
          {[{ph:"Phase 1 — 2026",t:"Foundation",items:["AI Scribe MVP","Compliance Watchdog","HIPAA Comms System","Data Schema Definition"],st:"In Progress"},{ph:"Phase 2 — 2027",t:"Automation",items:["In-House Billing","CMG Optimizer","Provider Dashboards","Gold Bar LMS"],st:"Planned"},{ph:"Phase 3 — 2028",t:"Intelligence",items:["Facility Scorecards","Predictive Models","Market Intelligence","Full Integration"],st:"Planned"}].map((p,i) => <Reveal key={i} delay={i*0.1}><div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 32, height: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.gold }}>{p.ph}</span><span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: i===0?"rgba(16,185,129,0.1)":"rgba(0,0,0,0.04)", color: i===0?C.green:C.muted }}>{p.st}</span></div><h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: C.dark }}>{p.t}</h3>{p.items.map((item,j) => <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><div style={{ width: 6, height: 6, background: i===0?C.gold:"rgba(0,0,0,0.2)", borderRadius: "50%" }} /><span style={{ fontSize: 14, color: C.mutedLight }}>{item}</span></div>)}</div></Reveal>)}
        </div>
      </div>
    </section>
    <section className="sec-pad" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px", textAlign: "center" }}><Reveal><h2 className="sec-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, marginBottom: 16, color: C.dark }}>See GoldOS in Action</h2><p style={{ color: C.muted, fontSize: 16, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>We'll walk you through the platform and discuss what it means for your operation.</p><Btn primary onClick={() => nav("contact")}>Request a Demo →</Btn></Reveal></section>
  </>;
}

// ===== CONTACT =====
function ContactPage() {
  const [type, setType] = useState("facility");
  const [form, setForm] = useState({ name: "", email: "", org: "", phone: "", message: "", address: "", resume: null });
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
      data.append("type", type);
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("phone", form.phone);
      data.append("message", form.message);
      if (type === "facility") { data.append("org", form.org); data.append("address", form.address); }
      if (type === "physician" && form.resume) data.append("resume", form.resume);
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
    <Reveal><SectionHeader badge="Get in Touch" title="Start a Conversation" subtitle="Facility exploring a physician partnership or physiatrist exploring your next chapter — we're ready." /></Reveal>
    <Reveal delay={0.1}>{!submitted ? <div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 40, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>{[{v:"facility",l:"I'm a Facility"},{v:"physician",l:"I'm a Physician"}].map(t => <button key={t.v} onClick={() => setType(t.v)} style={{ flex: 1, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.3s", border: `1px solid ${type===t.v?C.gold:"rgba(0,0,0,0.12)"}`, background: type===t.v?C.gold:"transparent", color: type===t.v?C.dark:C.muted, fontFamily: "'DM Sans', sans-serif" }}>{t.l}</button>)}</div>
      <div className="grid-contact" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "0 20px" }}><Input label="Full Name" value={form.name} onChange={v => set("name",v)} placeholder="Dr. Jane Smith" /><Input label="Email" type="email" value={form.email} onChange={v => set("email",v)} placeholder="jane@example.com" />{type==="facility" ? <Input label="Facility / Organization" value={form.org} onChange={v => set("org",v)} /> : <div style={{ marginBottom: 20, minWidth: 0 }}><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.mutedLight, marginBottom: 6 }}>Resume / CV</label><label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 16px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)", fontSize: 15, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "border-color 0.3s" }} onMouseEnter={e => e.currentTarget.style.borderColor = C.gold} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.12)"}><span style={{ color: form.resume ? C.dark : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>{form.resume ? form.resume.name : "Choose file (PDF, DOC, DOCX)"}</span><span style={{ color: C.gold, fontSize: 13, fontWeight: 600, marginLeft: 12, flexShrink: 0 }}>Upload</span><input type="file" accept=".pdf,.doc,.docx" onChange={e => set("resume", e.target.files[0] || null)} style={{ display: "none" }} /></label></div>}<Input label="Phone" type="tel" value={form.phone} onChange={v => set("phone",v)} placeholder="(555) 123-4567" /></div>
      {type === "facility" && <Input label="Address" value={form.address} onChange={v => set("address",v)} placeholder="123 Main St, City, State ZIP" />}
      <Input label={type==="facility"?"Tell us about your facility":"Tell us about your career goals"} type="textarea" value={form.message} onChange={v => set("message",v)} />
      <Btn primary full onClick={handleSubmit} style={{ marginTop: 8 }}>{submitting ? "Submitting..." : "Submit Inquiry →"}</Btn>
      {error && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: C.red, fontSize: 13 }}>{error}</div>}
    </div> : <div style={{ background: C.slate, border: "1px solid rgba(0,0,0,0.08)", padding: 56, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}><div style={{ fontSize: 48, marginBottom: 16 }}>✓</div><h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: C.dark }}>Thank You</h3><p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>We've received your inquiry. A member of the Gold team will reach out within one business day.</p></div>}</Reveal>
  </section>;
}

// ===== APP =====
export default function App() {
  const [page, setPage] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [mm, setMm] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 60); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  const nav = useCallback((p) => { setPage(p); setMm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const links = [{l:"About",p:"home"},{l:"Facilities",p:"facilities"},{l:"Physicians",p:"physicians"},{l:"Technology",p:"technology"}];

  return <div style={{ background: C.white, color: C.dark, fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>{`
      * { margin: 0; padding: 0; box-sizing: border-box; }
      ::selection { background: ${C.gold}; color: ${C.white}; }
      html { scroll-behavior: smooth; }
      @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
      select option { background: #FFFFFF; color: ${C.dark}; }
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

    <nav className="nav-outer" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.08)", transition: "all 0.4s", padding: "0 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => nav("home")}><div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: C.dark, fontFamily: "'Playfair Display', serif" }}>G</div><span style={{ fontWeight: 700, fontSize: 17, letterSpacing: 1, color: C.dark }}>GOLD <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>PM&R</span></span></div>
        <div className="nd" style={{ display: "flex", gap: 28, alignItems: "center" }}>{links.map(l => <span key={l.p} onClick={() => nav(l.p)} style={{ color: page===l.p?C.gold:C.muted, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "color 0.3s" }} onMouseEnter={e => e.target.style.color = C.gold} onMouseLeave={e => { if (page!==l.p) e.target.style.color = C.muted; }}>{l.l}</span>)}<Btn primary onClick={() => nav("contact")} style={{ padding: "8px 20px", fontSize: 13 }}>Get in Touch</Btn></div>
        <button className="nm" onClick={() => setMm(!mm)} style={{ display: "none", background: "none", border: "none", color: C.dark, fontSize: 22, cursor: "pointer", padding: "4px 8px" }}>☰</button>
      </div>
      {mm && <div style={{ padding: "12px 0 20px", display: "flex", flexDirection: "column", gap: 12 }}>{links.map(l => <span key={l.p} onClick={() => nav(l.p)} style={{ color: page===l.p?C.gold:C.muted, fontSize: 15, cursor: "pointer", padding: "4px 0" }}>{l.l}</span>)}<Btn primary onClick={() => nav("contact")} style={{ width: "100%", marginTop: 8 }}>Get in Touch</Btn></div>}
    </nav>

    {page === "home" && <HomePage nav={nav} />}
    {page === "facilities" && <FacilitiesPage nav={nav} />}
    {page === "physicians" && <PhysiciansPage nav={nav} />}
    {page === "technology" && <TechnologyPage nav={nav} />}
    {page === "contact" && <ContactPage />}

    {page !== "contact" && <section style={{ background: `linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.02))`, borderTop: "1px solid rgba(201,162,39,0.2)" }}><div className="cta-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}><div><h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: C.dark }}>Ready to Raise the Standard?</h3><p style={{ color: C.muted, fontSize: 15 }}>Let's talk about what Gold can do for your facility or your career.</p></div><Btn primary onClick={() => nav("contact")}>Schedule a Conversation →</Btn></div></section>}

    <footer style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: C.navy }}><div className="footer-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 40px 32px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))", gap: 40, marginBottom: 40 }}>
      <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: C.dark, fontFamily: "'Playfair Display', serif" }}>G</div><span style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>GOLD PM&R</span></div><p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>Setting the standard in post-acute medical management.</p><p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>NV · CA · CO · AZ</p></div>
      {[{t:"Company",ls:[{l:"About",p:"home"},{l:"Technology",p:"technology"},{l:"Careers",p:"physicians"},{l:"Contact",p:"contact"}]},{t:"Facilities",ls:[{l:"Partnership",p:"facilities"},{l:"ROI Calculator",p:"facilities"},{l:"Compliance Quiz",p:"facilities"},{l:"Case Studies",p:"facilities"}]},{t:"Physicians",ls:[{l:"Open Positions",p:"physicians"},{l:"Compensation",p:"physicians"},{l:"Gold Bar",p:"physicians"},{l:"Culture",p:"physicians"}]}].map((col,i) => <div key={i}><div style={{ fontWeight: 600, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: C.dark, marginBottom: 14 }}>{col.t}</div>{col.ls.map(link => <div key={link.l} style={{ marginBottom: 8 }}><span onClick={() => nav(link.p)} style={{ color: C.muted, fontSize: 14, cursor: "pointer", transition: "color 0.3s" }} onMouseEnter={e => e.target.style.color = C.gold} onMouseLeave={e => e.target.style.color = C.muted}>{link.l}</span></div>)}</div>)}
    </div><div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><span style={{ color: C.muted, fontSize: 12 }}>© 2026 Gold PM&R PC & Gold Management Services MSO LLC</span><span style={{ color: C.muted, fontSize: 12 }}>Physician-Led · Technology-Forward · Outcome-Driven</span></div></div></footer>
  </div>;
}
