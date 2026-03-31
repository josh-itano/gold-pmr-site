import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  gold: "#C9A227", goldLight: "#E8D48B", dark: "#0A0E17", navy: "#111827",
  slate: "#1E293B", white: "#FFFFFF", light: "#F8FAFC", muted: "#94A3B8",
  mutedLight: "#CBD5E1", goldSoft: "rgba(201,162,39,0.08)", goldGlow: "rgba(201,162,39,0.15)",
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
  return <div style={{ textAlign: align, marginBottom: 56 }}>{badge && <div style={{ marginBottom: 16 }}><Badge>{badge}</Badge></div>}<h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 700, lineHeight: 1.15, marginBottom: subtitle ? 20 : 0, color: C.white }}>{title}</h2>{subtitle && <p style={{ color: C.muted, fontSize: 17, maxWidth: 620, margin: align === "center" ? "0 auto" : 0, lineHeight: 1.7 }}>{subtitle}</p>}</div>;
}

function Card({ icon, title, desc }) {
  return <div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 36, transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", position: "relative", overflow: "hidden", height: "100%", cursor: "default" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(201,162,39,0.2)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>{icon && <div style={{ fontSize: 28, marginBottom: 16 }}>{icon}</div>}<h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: C.white }}>{title}</h3><p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{desc}</p></div>;
}

function Btn({ children, primary, onClick, full, style: s = {} }) {
  const base = primary ? { background: C.gold, color: C.dark, border: "none", fontWeight: 700 } : { background: "transparent", color: C.white, border: "1px solid rgba(255,255,255,0.2)", fontWeight: 500 };
  return <button onClick={onClick} style={{ ...base, padding: "14px 32px", fontSize: 15, cursor: "pointer", transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)", fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5, width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, ...s }} onMouseEnter={e => { if (primary) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(201,162,39,0.3)"; } else { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; } }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; if (!primary) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = C.white; } }}>{children}</button>;
}

function Input({ label, type = "text", value, onChange, placeholder, options }) {
  const shared = { width: "100%", padding: "12px 16px", background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.1)", color: C.white, fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.3s" };
  return <div style={{ marginBottom: 20 }}>{label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.mutedLight, marginBottom: 6 }}>{label}</label>}{type === "select" ? <select value={value} onChange={e => onChange(e.target.value)} style={{ ...shared, cursor: "pointer" }} onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}>{options.map(o => <option key={o.value} value={o.value} style={{ background: C.slate }}>{o.label}</option>)}</select> : type === "textarea" ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...shared, resize: "vertical" }} onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={shared} onFocus={e => e.target.style.borderColor = C.gold} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />}</div>;
}

// ===== HOME =====
function HomePage({ nav }) {
  return <>
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", filter: "blur(80px)", background: `radial-gradient(circle, ${C.goldGlow}, transparent)`, top: "10%", right: "-10%", animation: "pulse 6s ease-in-out infinite" }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 40px 80px", textAlign: "center", position: "relative", zIndex: 2 }}>
        <Reveal><Badge>Physician-Led · Technology-Forward · Outcome-Driven</Badge></Reveal>
        <Reveal delay={0.1}><h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(72px, 8vw)", fontWeight: 700, lineHeight: 1.05, margin: "28px 0", background: `linear-gradient(135deg, ${C.white} 0%, ${C.white} 60%, ${C.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>The New Standard in<br/>Inpatient Rehabilitation</h1></Reveal>
        <Reveal delay={0.2}><p style={{ fontSize: 19, color: C.muted, maxWidth: 640, margin: "0 auto 44px", lineHeight: 1.7 }}>Gold PM&R combines physician excellence with proprietary technology to deliver measurably superior outcomes for rehabilitation facilities and their patients.</p></Reveal>
        <Reveal delay={0.3}><div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}><Btn primary onClick={() => nav("facilities")}>For Facilities →</Btn><Btn onClick={() => nav("physicians")}>For Physicians →</Btn></div></Reveal>
      </div>
    </section>
    <section style={{ background: C.navy, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 32, textAlign: "center" }}>
        {[{v:300,s:"+",l:"Beds Managed"},{v:12,s:"",l:"Facilities"},{v:4,s:"",l:"States"},{v:30,s:"+",l:"Providers"}].map((m,i) => <div key={i}><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700, color: C.gold }}><AnimNum target={m.v} suffix={m.s} /></div><div style={{ fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 2, fontWeight: 500 }}>{m.l}</div></div>)}
      </div>
    </section>
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "120px 40px" }}>
      <Reveal><SectionHeader badge="Who We Serve" title="Two Paths. One Standard." /></Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 24 }}>
        {[{p:"facilities",badge:"For Facilities",h:"Higher Reimbursement. Zero Compliance Risk. Better Outcomes.",d:"Gold physicians maximize CMG scores, maintain 100% CMS compliance, and deliver outcomes that become your strongest marketing asset.",cta:"Explore Partnership →"},{p:"physicians",badge:"For Physicians",h:"Best Tools. Best Support. Best Career in PM&R.",d:"70% compensation with AI documentation that makes you earn more per hour. Personalized schedules, paid leadership roles, and a mission worth showing up for.",cta:"Explore Careers →"}].map((c,i) => <Reveal key={i} delay={i*0.1}><div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 48, cursor: "pointer", transition: "all 0.4s" }} onClick={() => nav(c.p)} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.3)"; e.currentTarget.style.transform = "translateY(-4px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}><div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: C.gold, marginBottom: 20 }}>{c.badge}</div><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{c.h}</h3><p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{c.d}</p><span style={{ color: C.gold, fontSize: 15, fontWeight: 600 }}>{c.cta}</span></div></Reveal>)}
      </div>
    </section>
    <section style={{ background: C.navy, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}><div style={{ maxWidth: 560 }}><Badge>GoldOS Platform</Badge><h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, margin: "20px 0 16px" }}>Technology That No Competitor Can Match</h2><p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8 }}>AI documentation co-pilot, real-time compliance tracking, CMG optimization, and automated billing — purpose-built for PM&R by Gold Management Services MSO.</p></div><Btn primary onClick={() => nav("technology")}>Explore the Platform →</Btn></div></Reveal>
      </div>
    </section>
  </>;
}

// ===== FACILITIES =====
function FacilitiesPage({ nav }) {
  const benefits = [
    { icon: "💰", title: "Higher Reimbursement", desc: "Documentation education produces higher CMG scores. Gold targets CMG ≥1.0 — facilities with poor documentation fall below and lose money per admission." },
    { icon: "🛡️", title: "Zero Compliance Risk", desc: "100% on-time CMS documentation. One late note = $30K–$80K technical denial. Our Compliance Watchdog tracks every deadline in real time." },
    { icon: "📊", title: "Superior Outcomes", desc: "Lower return-to-acute, ≥80% discharge-to-community, reduced 30-day readmissions. Metrics that drive your referral pipeline." },
    { icon: "⚡", title: "GoldOS Technology", desc: "Real-time compliance dashboards, CMG optimization alerts, outcome analytics — capabilities no other physician group provides." },
    { icon: "✓", title: "Gold Bar Certified Physicians", desc: "Rigorous IRF-specific certification. Consistent quality, not physician roulette." },
    { icon: "🔄", title: "Continuity Guaranteed", desc: "Multi-provider model with built-in coverage redundancy. No scrambling when your solo medical director goes on vacation." },
  ];
  const [beds, setBeds] = useState(30);
  const [avgCmg, setAvgCmg] = useState("0.9");
  const [denials, setDenials] = useState("2");
  const cmgLift = Math.round(beds * 365 * 0.75 * (1.0 - parseFloat(avgCmg)) * 800);
  const denialSavings = parseInt(denials) * 55000;
  const totalImpact = Math.max(0, cmgLift) + denialSavings;

  const [compStep, setCompStep] = useState(0);
  const [compAnswers, setCompAnswers] = useState({});
  const compQ = [
    { q: "How often are PMR face-to-face notes completed on time?", opts: ["Always (100%)", "Usually (90%+)", "Sometimes (70-90%)", "Inconsistently (<70%)"], sc: [0,1,2,3] },
    { q: "How many technical denials in the past 12 months?", opts: ["None", "1-2", "3-5", "More than 5"], sc: [0,1,2,3] },
    { q: "Does your physician group provide real-time compliance tracking?", opts: ["Yes, with technology", "Yes, manually", "Partially", "No"], sc: [0,1,2,3] },
    { q: "What is your current CMG score average?", opts: ["Above 1.2", "1.0 – 1.2", "0.8 – 1.0", "Below 0.8 or unknown"], sc: [0,1,2,3] },
    { q: "How would you rate your physician's IDT leadership?", opts: ["Excellent", "Good", "Fair", "Poor"], sc: [0,1,2,3] },
  ];
  const compScore = Object.values(compAnswers).reduce((a,b) => a+b, 0);
  const compDone = compStep >= compQ.length;
  const compRisk = compScore <= 3 ? "Low" : compScore <= 7 ? "Moderate" : compScore <= 11 ? "High" : "Critical";
  const compColor = compScore <= 3 ? C.green : compScore <= 7 ? C.gold : compScore <= 11 ? "#F59E0B" : C.red;

  return <>
    <section style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>For Facilities</Badge><h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(56px, 7vw)", fontWeight: 700, lineHeight: 1.1, margin: "24px 0 20px", background: `linear-gradient(135deg, ${C.white} 0%, ${C.white} 60%, ${C.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your Physician Partner<br/>Should Make You Money</h1><p style={{ color: C.muted, fontSize: 19, maxWidth: 640, lineHeight: 1.7, marginBottom: 32 }}>Most physician groups fill a chair. Gold fills your revenue gap. Higher CMG scores, zero compliance risk, and outcomes that become your competitive advantage.</p><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><Btn primary onClick={() => document.getElementById("roi")?.scrollIntoView({ behavior: "smooth" })}>Calculate Your ROI →</Btn><Btn onClick={() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })}>Take Compliance Assessment</Btn></div></Reveal>
    </section>
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 100px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>{benefits.map((b,i) => <Reveal key={i} delay={i*0.06}><Card {...b} /></Reveal>)}</div></section>

    {/* Case Study */}
    <section style={{ background: C.navy, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Case Study" title="The Gold Effect: Before & After" /></Reveal>
        <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
          {[{l:"CMG Score",b:"0.85",a:"1.15"},{l:"Doc Compliance",b:"72%",a:"100%"},{l:"Discharge Home",b:"61%",a:"84%"},{l:"Return to Acute",b:"14%",a:"6%"}].map((m,i) => <div key={i} style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 28, textAlign: "center" }}><div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.muted, marginBottom: 16 }}>{m.l}</div><div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}><div><div style={{ fontSize: 13, color: C.red, fontWeight: 600, marginBottom: 4 }}>Before</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{m.b}</div></div><div style={{ color: C.gold, fontSize: 20 }}>→</div><div><div style={{ fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 4 }}>After</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: C.gold }}>{m.a}</div></div></div></div>)}
        </div></Reveal>
      </div>
    </section>

    {/* ROI Calculator */}
    <section id="roi" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
      <Reveal><SectionHeader badge="ROI Calculator" title="Estimate Your Revenue Impact" subtitle="See what Gold's documentation excellence and compliance technology could mean for your bottom line." /></Reveal>
      <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 32 }}>
        <div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Your Facility</h3>
          <Input label="Number of IRF Beds" type="number" value={beds} onChange={v => setBeds(Math.max(1, parseInt(v) || 1))} />
          <Input label="Current Average CMG Score" type="select" value={avgCmg} onChange={setAvgCmg} options={[{value:"0.7",label:"Below 0.8"},{value:"0.8",label:"0.8–0.9"},{value:"0.9",label:"0.9–1.0"},{value:"1.0",label:"1.0–1.1"},{value:"1.1",label:"Above 1.1"}]} />
          <Input label="Technical Denials per Year" type="select" value={denials} onChange={setDenials} options={[{value:"0",label:"None"},{value:"1",label:"1"},{value:"2",label:"2–3"},{value:"4",label:"4–5"},{value:"6",label:"6+"}]} />
        </div>
        <div style={{ background: `linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.03))`, border: "1px solid rgba(201,162,39,0.15)", padding: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Estimated Annual Impact</h3>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>CMG Score Improvement</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: C.gold }}>${Math.max(0,cmgLift).toLocaleString()}</div></div>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Denial Prevention Savings</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: C.gold }}>${denialSavings.toLocaleString()}</div></div>
          <div style={{ borderTop: "1px solid rgba(201,162,39,0.2)", paddingTop: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Total Revenue Impact</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: C.gold }}>${totalImpact.toLocaleString()}</div><div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>per year · Gold target CMG ≥1.0, 100% compliance</div></div>
          <Btn primary full onClick={() => nav("contact")} style={{ marginTop: 24 }}>Discuss These Numbers →</Btn>
        </div>
      </div></Reveal>
    </section>

    {/* Compliance Assessment */}
    <section id="assessment" style={{ background: C.navy, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Compliance Assessment" title="What's Your Risk Profile?" subtitle="Five questions. Instant results." /></Reveal>
        <Reveal delay={0.1}><div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 40 }}>
          {!compDone ? <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <span style={{ fontSize: 13, color: C.muted }}>Question {compStep + 1} of {compQ.length}</span>
              <div style={{ display: "flex", gap: 6 }}>{compQ.map((_,i) => <div key={i} style={{ width: 32, height: 4, background: i <= compStep ? C.gold : "rgba(255,255,255,0.1)", transition: "background 0.3s" }} />)}</div>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, lineHeight: 1.4 }}>{compQ[compStep].q}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {compQ[compStep].opts.map((opt,i) => <button key={i} onClick={() => { setCompAnswers({...compAnswers, [compStep]: compQ[compStep].sc[i]}); setCompStep(compStep+1); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", color: C.white, fontSize: 15, textAlign: "left", cursor: "pointer", transition: "all 0.3s", fontFamily: "'DM Sans', sans-serif" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.background = C.goldSoft; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>{opt}</button>)}
            </div>
          </> : <div style={{ textAlign: "center" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", border: `3px solid ${compColor}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: compColor }}>{compScore}</span></div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: compColor, marginBottom: 8 }}>{compRisk} Risk</div>
            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{compScore <= 3 ? "Your compliance looks solid." : compScore <= 7 ? "There's room for improvement." : "You may be leaving significant revenue on the table."}</h3>
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
  const [ppd, setPpd] = useState(12);
  const [dpw, setDpw] = useState("5");
  const [reimb, setReimb] = useState("185");
  const annual = ppd * parseInt(dpw) * 48 * parseInt(reimb);
  const comp70 = Math.round(annual * 0.70);
  const withLift = Math.round(annual * 1.15 * 0.70);

  const cards = [
    { icon: "🤖", title: "AI-Powered Practice", desc: "Custom PM&R documentation co-pilot eliminates 30–50% of documentation time. Automated billing. Compliance watchdog. Focus on patients." },
    { icon: "📅", title: "Your Schedule, Your Life", desc: "Personalized blueprints — patient load, hours, time off. Week-on/week-off, 4-day weeks, seasonal flexibility." },
    { icon: "📈", title: "Leadership Ladder", desc: "Site Leader → Regional Director → Clinical Education. Paid roles with $15K–$50K+ stipends. Clear path without leaving practice." },
    { icon: "🎓", title: "Gold Bar Certification", desc: "The only IRF-specific physician certification. CMG mastery, CMS compliance, IDT leadership. AMA-certified CME." },
    { icon: "💰", title: "Student Loan Assistance", desc: "$10K–$20K annual loan repayment for 3+ year commitments. Sign-on bonuses of $25K–$50K for relocation." },
    { icon: "🏥", title: "Mission, Not a Cash Grab", desc: "Physician-owned. Quality-obsessed. Best work, best tools, right reasons." },
  ];
  const positions = [
    { title: "IRF Medical Director", loc: "Las Vegas, NV", type: "Full-time" },
    { title: "Physiatrist — Inpatient Rehab", loc: "Denver, CO", type: "Full-time" },
    { title: "Physiatrist — Acute Rehab Unit", loc: "Phoenix, AZ", type: "Full-time" },
    { title: "PM&R Physician", loc: "Thousand Oaks, CA", type: "Full / Part-time" },
  ];

  return <>
    <section style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>For Physicians</Badge><h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(56px, 7vw)", fontWeight: 700, lineHeight: 1.1, margin: "24px 0 20px", background: `linear-gradient(135deg, ${C.white} 0%, ${C.white} 60%, ${C.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Practice Medicine.<br/>We Handle Everything Else.</h1><p style={{ color: C.muted, fontSize: 19, maxWidth: 640, lineHeight: 1.7, marginBottom: 32 }}>70% compensation. AI documentation that makes you earn more per hour. Personalized schedules. A leadership ladder. And a team that believes in doing this right.</p><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}><Btn primary onClick={() => document.getElementById("positions")?.scrollIntoView({ behavior: "smooth" })}>View Open Positions →</Btn><Btn onClick={() => document.getElementById("comp-calc")?.scrollIntoView({ behavior: "smooth" })}>Estimate Your Earnings</Btn></div></Reveal>
    </section>
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 100px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>{cards.map((b,i) => <Reveal key={i} delay={i*0.06}><Card {...b} /></Reveal>)}</div></section>

    {/* Comp Estimator */}
    <section id="comp-calc" style={{ background: C.navy, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Compensation Estimator" title="Model Your Earnings at Gold" subtitle="See what 70% of a bigger number looks like with AI-optimized documentation." /></Reveal>
        <Reveal delay={0.1}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 32 }}>
          <div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 40 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Your Practice Profile</h3>
            <div><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.mutedLight, marginBottom: 6 }}>Patients Per Day: {ppd}</label><input type="range" min={6} max={20} value={ppd} onChange={e => setPpd(parseInt(e.target.value))} style={{ width: "100%", accentColor: C.gold, marginBottom: 20 }} /></div>
            <Input label="Days Per Week" type="select" value={dpw} onChange={setDpw} options={[{value:"4",label:"4 days"},{value:"5",label:"5 days"},{value:"6",label:"6 days"}]} />
            <Input label="Avg Reimbursement Per Encounter" type="select" value={reimb} onChange={setReimb} options={[{value:"155",label:"$155 (low)"},{value:"185",label:"$185 (avg)"},{value:"215",label:"$215 (high)"},{value:"245",label:"$245 (optimized)"}]} />
          </div>
          <div style={{ background: `linear-gradient(135deg, rgba(201,162,39,0.08), rgba(201,162,39,0.03))`, border: "1px solid rgba(201,162,39,0.15)", padding: 40 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Estimated Compensation</h3>
            <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Standard (70%)</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>${comp70.toLocaleString()}</div></div>
            <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>With Gold AI Lift (~15%)</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 44, fontWeight: 700, color: C.gold }}>${withLift.toLocaleString()}</div></div>
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: 16, marginBottom: 24 }}><div style={{ fontSize: 14, color: C.green, fontWeight: 600 }}>+${(withLift - comp70).toLocaleString()}/year</div><div style={{ fontSize: 13, color: C.muted }}>Estimated additional earnings from AI-optimized documentation</div></div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>Assumes 48 working weeks/year. Actual comp varies by facility, payer mix, and complexity.</div>
            <Btn primary full onClick={() => nav("contact")}>Let's Talk Compensation →</Btn>
          </div>
        </div></Reveal>
      </div>
    </section>

    {/* Positions */}
    <section id="positions" style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
      <Reveal><SectionHeader badge="Open Positions" title="Join the Gold Team" subtitle="All positions include Gold Bar certification, AI documentation tools, and scribe support." /></Reveal>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {positions.map((p,i) => <Reveal key={i} delay={i*0.06}><div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, cursor: "pointer", transition: "all 0.3s" }} onClick={() => nav("contact")} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.2)"; e.currentTarget.style.transform = "translateX(4px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateX(0)"; }}><div><h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{p.title}</h3><div style={{ fontSize: 14, color: C.muted }}>{p.loc} · {p.type}</div></div><span style={{ color: C.gold, fontSize: 14, fontWeight: 600 }}>Apply →</span></div></Reveal>)}
      </div>
      <Reveal delay={0.3}><div style={{ textAlign: "center", marginTop: 32 }}><p style={{ color: C.muted, fontSize: 15, marginBottom: 16 }}>Don't see your market? We're expanding.</p><Btn onClick={() => nav("contact")}>Contact Us About New Markets</Btn></div></Reveal>
    </section>

    {/* Gold Bar */}
    <section style={{ background: C.navy, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 64, alignItems: "center" }}>
          <div><Badge>Gold Bar Certified</Badge><h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, lineHeight: 1.2, margin: "20px 0 16px" }}>The Credential That Sets You Apart</h2><p style={{ color: C.muted, fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>A rigorous one-year curriculum covering CMG mastery, CMS compliance, IDT leadership, and facility financial impact. Earned through testing and demonstrated performance.</p>{["IRF-specific curriculum no residency teaches","AMA-certified continuing medical education","Recertification with performance accountability","Thought leadership and content creation opportunities"].map((item,i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}><span style={{ color: C.gold, fontSize: 14, marginTop: 2 }}>✦</span><span style={{ color: C.mutedLight, fontSize: 15, lineHeight: 1.6 }}>{item}</span></div>)}</div>
          <div style={{ background: `linear-gradient(135deg, ${C.goldSoft}, rgba(201,162,39,0.02))`, border: "1px solid rgba(201,162,39,0.15)", padding: 56, textAlign: "center" }}><div style={{ width: 100, height: 100, margin: "0 auto 24px", background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: C.dark }}>G</div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Gold Bar</div><div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: C.gold, fontWeight: 600, marginBottom: 24 }}>Certified Physician</div><div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin: "0 auto 24px" }} /><p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>The credential that tells facilities you don't just meet the standard — you set it.</p></div>
        </div></Reveal>
      </div>
    </section>
  </>;
}

// ===== TECHNOLOGY =====
function TechnologyPage({ nav }) {
  const [af, setAf] = useState(0);
  const features = [
    { name: "AI Documentation Co-Pilot", icon: "🧠", desc: "Ambient listening generates structured notes mapped to IRF-PAI items, CMS requirements, and CMG diagnoses.", bullets: ["30–50% documentation time reduction","Maps to IRF-PAI automatically","Learns physician preferences","PM&R-specific, not generic"] },
    { name: "CMG Optimizer", icon: "📊", desc: "Real-time documentation analysis against the CMG Motor Matrix. Flags missing diagnoses affecting reimbursement.", bullets: ["Directly increases facility revenue","Catches missed diagnoses pre-billing","Benchmarks against CMG ≥1.0 target","Documentation becomes revenue driver"] },
    { name: "Compliance Watchdog", icon: "🛡️", desc: "Countdown timers on every required documentation item. Escalation alerts. Eliminates $30K–$80K denial risk.", bullets: ["Real-time CMS deadline tracking","Automated escalation chain","Zero late documentation tolerance","Prevents avoidable technical denials"] },
    { name: "Facility Scorecards", icon: "📈", desc: "Automated dashboards: CMG, discharge rates, RTA, readmissions, PEM scores for every Gold facility.", bullets: ["Real-time outcome visibility","National benchmark comparisons","Exportable facility reports","Data-driven sales conversations"] },
    { name: "Automated Billing", icon: "💰", desc: "AI-assisted coding, claims submission, denial prevention, real-time tracking. Replacing outsourced billing.", bullets: ["Billing cost: 6.5% → 3–4%","Faster collections cycle","Denial pattern recognition","Provider pay transparency"] },
    { name: "Provider Dashboard", icon: "👤", desc: "Personal metrics, compensation, scheduling, Gold Bar progress, census visibility — one interface.", bullets: ["Real-time earnings visibility","Schedule management","Gold Bar progress tracking","HIPAA-compliant comms hub"] },
  ];
  return <>
    <section style={{ padding: "140px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
      <Reveal><Badge>GoldOS Platform</Badge><h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "min(56px, 7vw)", fontWeight: 700, lineHeight: 1.1, margin: "24px 0 20px", background: `linear-gradient(135deg, ${C.white} 0%, ${C.white} 60%, ${C.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>The Intelligence Layer<br/>for PM&R Excellence</h1><p style={{ color: C.muted, fontSize: 19, maxWidth: 640, lineHeight: 1.7 }}>Owned by Gold Management Services MSO. Purpose-built for inpatient rehabilitation. A proprietary platform that makes physicians faster and facilities more profitable.</p></Reveal>
    </section>
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px 80px" }}>
      <Reveal><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 64 }}>{["EMR-Agnostic","AI-Assisted, Physician-Controlled","Data as Competitive Advantage","Built for Practice, Sold to Facility"].map((p,i) => <div key={i} style={{ background: C.goldSoft, border: "1px solid rgba(201,162,39,0.15)", padding: "16px 20px", textAlign: "center" }}><span style={{ fontSize: 14, fontWeight: 600, color: C.gold }}>{p}</span></div>)}</div></Reveal>
      <Reveal><div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 0 }} className="grid-2-stack">
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>{features.map((f,i) => <button key={i} onClick={() => setAf(i)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "18px 20px", background: af === i ? C.goldSoft : "transparent", border: "none", borderLeft: `3px solid ${af === i ? C.gold : "transparent"}`, color: af === i ? C.white : C.muted, fontSize: 14, fontWeight: af === i ? 600 : 400, cursor: "pointer", textAlign: "left", transition: "all 0.3s", fontFamily: "'DM Sans', sans-serif" }}><span style={{ fontSize: 20 }}>{f.icon}</span> {f.name}</button>)}</div>
        <div style={{ padding: "32px 40px", background: C.slate, border: "1px solid rgba(255,255,255,0.06)", minHeight: 340 }}><h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{features[af].name}</h3><p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>{features[af].desc}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>{features[af].bullets.map((b,i) => <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}><span style={{ color: C.gold, marginTop: 1 }}>✦</span><span style={{ fontSize: 14, color: C.mutedLight, lineHeight: 1.5 }}>{b}</span></div>)}</div></div>
      </div></Reveal>
    </section>
    {/* Roadmap */}
    <section style={{ background: C.navy, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px" }}>
        <Reveal><SectionHeader badge="Roadmap" title="Building in Public" subtitle="Transparency builds trust." /></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[{ph:"Phase 1 — 2026",t:"Foundation",items:["AI Scribe MVP","Compliance Watchdog","HIPAA Comms System","Data Schema Definition"],st:"In Progress"},{ph:"Phase 2 — 2027",t:"Automation",items:["In-House Billing","CMG Optimizer","Provider Dashboards","Gold Bar LMS"],st:"Planned"},{ph:"Phase 3 — 2028",t:"Intelligence",items:["Facility Scorecards","Predictive Models","Market Intelligence","Full Integration"],st:"Planned"}].map((p,i) => <Reveal key={i} delay={i*0.1}><div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 32, height: "100%" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.gold }}>{p.ph}</span><span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", background: i===0?"rgba(16,185,129,0.15)":"rgba(255,255,255,0.05)", color: i===0?C.green:C.muted }}>{p.st}</span></div><h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{p.t}</h3>{p.items.map((item,j) => <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><div style={{ width: 6, height: 6, background: i===0?C.gold:"rgba(255,255,255,0.2)", borderRadius: "50%" }} /><span style={{ fontSize: 14, color: C.mutedLight }}>{item}</span></div>)}</div></Reveal>)}
        </div>
      </div>
    </section>
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 40px", textAlign: "center" }}><Reveal><h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, marginBottom: 16 }}>See GoldOS in Action</h2><p style={{ color: C.muted, fontSize: 16, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>We'll walk you through the platform and discuss what it means for your operation.</p><Btn primary onClick={() => nav("contact")}>Request a Demo →</Btn></Reveal></section>
  </>;
}

// ===== CONTACT =====
function ContactPage() {
  const [type, setType] = useState("facility");
  const [form, setForm] = useState({ name: "", email: "", org: "", phone: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });
  return <section style={{ maxWidth: 800, margin: "0 auto", padding: "140px 40px 100px" }}>
    <Reveal><SectionHeader badge="Get in Touch" title="Start a Conversation" subtitle="Facility exploring a physician partnership or physiatrist exploring your next chapter — we're ready." /></Reveal>
    <Reveal delay={0.1}>{!submitted ? <div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 40 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>{[{v:"facility",l:"I'm a Facility"},{v:"physician",l:"I'm a Physician"}].map(t => <button key={t.v} onClick={() => setType(t.v)} style={{ flex: 1, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.3s", border: `1px solid ${type===t.v?C.gold:"rgba(255,255,255,0.1)"}`, background: type===t.v?C.gold:"transparent", color: type===t.v?C.dark:C.muted, fontFamily: "'DM Sans', sans-serif" }}>{t.l}</button>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}><Input label="Full Name" value={form.name} onChange={v => set("name",v)} placeholder="Dr. Jane Smith" /><Input label="Email" type="email" value={form.email} onChange={v => set("email",v)} placeholder="jane@example.com" /><Input label={type==="facility"?"Facility / Organization":"Current Practice"} value={form.org} onChange={v => set("org",v)} /><Input label="Phone" type="tel" value={form.phone} onChange={v => set("phone",v)} placeholder="(555) 123-4567" /></div>
      <Input label={type==="facility"?"Tell us about your facility":"Tell us about your career goals"} type="textarea" value={form.message} onChange={v => set("message",v)} />
      <Btn primary full onClick={() => setSubmitted(true)} style={{ marginTop: 8 }}>Submit Inquiry →</Btn>
    </div> : <div style={{ background: C.slate, border: "1px solid rgba(255,255,255,0.06)", padding: 56, textAlign: "center" }}><div style={{ fontSize: 48, marginBottom: 16 }}>✓</div><h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Thank You</h3><p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>We've received your inquiry. A member of the Gold team will reach out within one business day.</p></div>}</Reveal>
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

  return <div style={{ background: C.dark, color: C.white, fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
    <style>{`* { margin: 0; padding: 0; box-sizing: border-box; } ::selection { background: ${C.gold}; color: ${C.dark}; } html { scroll-behavior: smooth; } @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } } select option { background: ${C.slate}; } @media (max-width: 768px) { .grid-2-stack { grid-template-columns: 1fr !important; } .nd { display: none !important; } .nm { display: block !important; } }`}</style>

    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(10,14,23,0.95)" : "rgba(10,14,23,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "all 0.4s", padding: "0 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => nav("home")}><div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: C.dark, fontFamily: "'Playfair Display', serif" }}>G</div><span style={{ fontWeight: 700, fontSize: 17, letterSpacing: 1 }}>GOLD <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>PM&R</span></span></div>
        <div className="nd" style={{ display: "flex", gap: 28, alignItems: "center" }}>{links.map(l => <span key={l.p} onClick={() => nav(l.p)} style={{ color: page===l.p?C.gold:C.muted, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "color 0.3s" }} onMouseEnter={e => e.target.style.color = C.gold} onMouseLeave={e => { if (page!==l.p) e.target.style.color = C.muted; }}>{l.l}</span>)}<Btn primary onClick={() => nav("contact")} style={{ padding: "8px 20px", fontSize: 13 }}>Get in Touch</Btn></div>
        <button className="nm" onClick={() => setMm(!mm)} style={{ display: "none", background: "none", border: "none", color: C.white, fontSize: 22, cursor: "pointer" }}>☰</button>
      </div>
      {mm && <div style={{ padding: "12px 0 20px", display: "flex", flexDirection: "column", gap: 12 }}>{links.map(l => <span key={l.p} onClick={() => nav(l.p)} style={{ color: page===l.p?C.gold:C.muted, fontSize: 15, cursor: "pointer", padding: "4px 0" }}>{l.l}</span>)}<Btn primary onClick={() => nav("contact")} style={{ width: "100%", marginTop: 8 }}>Get in Touch</Btn></div>}
    </nav>

    {page === "home" && <HomePage nav={nav} />}
    {page === "facilities" && <FacilitiesPage nav={nav} />}
    {page === "physicians" && <PhysiciansPage nav={nav} />}
    {page === "technology" && <TechnologyPage nav={nav} />}
    {page === "contact" && <ContactPage />}

    {page !== "contact" && <section style={{ background: `linear-gradient(135deg, rgba(201,162,39,0.1), rgba(201,162,39,0.03))`, borderTop: "1px solid rgba(201,162,39,0.15)" }}><div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}><div><h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Ready to Raise the Standard?</h3><p style={{ color: C.muted, fontSize: 15 }}>Let's talk about what Gold can do for your facility or your career.</p></div><Btn primary onClick={() => nav("contact")}>Schedule a Conversation →</Btn></div></section>}

    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: C.navy }}><div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 40px 32px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, marginBottom: 40 }}>
      <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: C.dark, fontFamily: "'Playfair Display', serif" }}>G</div><span style={{ fontWeight: 700, fontSize: 15 }}>GOLD PM&R</span></div><p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>Setting the standard in physiatric care.</p><p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>NV · CA · CO · AZ</p></div>
      {[{t:"Company",ls:[{l:"About",p:"home"},{l:"Technology",p:"technology"},{l:"Careers",p:"physicians"},{l:"Contact",p:"contact"}]},{t:"Facilities",ls:[{l:"Partnership",p:"facilities"},{l:"ROI Calculator",p:"facilities"},{l:"Compliance Quiz",p:"facilities"},{l:"Case Studies",p:"facilities"}]},{t:"Physicians",ls:[{l:"Open Positions",p:"physicians"},{l:"Compensation",p:"physicians"},{l:"Gold Bar",p:"physicians"},{l:"Culture",p:"physicians"}]}].map((col,i) => <div key={i}><div style={{ fontWeight: 600, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", color: C.white, marginBottom: 14 }}>{col.t}</div>{col.ls.map(link => <div key={link.l} style={{ marginBottom: 8 }}><span onClick={() => nav(link.p)} style={{ color: C.muted, fontSize: 14, cursor: "pointer", transition: "color 0.3s" }} onMouseEnter={e => e.target.style.color = C.gold} onMouseLeave={e => e.target.style.color = C.muted}>{link.l}</span></div>)}</div>)}
    </div><div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}><span style={{ color: C.muted, fontSize: 12 }}>© 2026 Gold PM&R PC & Gold Management Services MSO LLC</span><span style={{ color: C.muted, fontSize: 12 }}>Physician-Led · Technology-Forward · Outcome-Driven</span></div></div></footer>
  </div>;
}
