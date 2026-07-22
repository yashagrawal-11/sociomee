import { useState, useEffect } from "react";

export default function Onboarding() {
  const [selected, setSelected] = useState(null);
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimIn(true), 80);
  }, []);

  const proceed = (type) => {
    setSelected(type);
    localStorage.setItem("sm_onboarded", "1");
    localStorage.setItem("sm_persona_type", type);
    setTimeout(() => { window.location.href = "/pricing"; }, 400);
  };

  const cards = [
    {
      id: "creator",
      label: "Creator",
      sub: "YouTube, Instagram, podcasts, short videos",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-1a6 6 0 0 1 12 0v1"/>
        </svg>
      )
    },
    {
      id: "business",
      label: "Business",
      sub: "Brands, agencies, startups, marketing teams",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          <line x1="12" y1="12" x2="12" y2="16"/>
          <line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
      )
    }
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "Poppins, sans-serif", padding: "24px",
      opacity: animIn ? 1 : 0, transform: animIn ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s ease, transform 0.5s ease"
    }}>
      <img src="/s_logo.png" alt="SocioMee" style={{ width: "44px", marginBottom: "32px" }}/>
      <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "rgba(124,58,237,0.7)", marginBottom: "12px" }}>
        WELCOME
      </p>
      <h1 style={{
        fontFamily: "Orbitron, sans-serif", fontSize: "clamp(22px, 5vw, 32px)",
        fontWeight: 900, color: "#fff", letterSpacing: "2px", marginBottom: "10px",
        textAlign: "center", textShadow: "0 0 30px rgba(124,58,237,0.4)"
      }}>
        HOW WILL YOU USE SOCIOMEE?
      </h1>
      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "48px", textAlign: "center" }}>
        Help us personalise your experience
      </p>
      <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "520px", flexWrap: "nowrap", justifyContent: "center" }}>
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => proceed(card.id)}
            style={{
              flex: "1 1 0", minWidth: "0", padding: "24px 16px",
              borderRadius: "20px", border: `1.5px solid ${selected === card.id ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.08)"}`,
              background: selected === card.id ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
              color: "#fff", cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "14px",
              transition: "all 0.2s ease", transform: selected === card.id ? "translateY(-4px)" : "translateY(0)",
              backdropFilter: "blur(10px)"
            }}
            onMouseEnter={e => { if (selected !== card.id) { e.currentTarget.style.borderColor = "rgba(124,58,237,0.35)"; e.currentTarget.style.background = "rgba(124,58,237,0.07)"; }}}
            onMouseLeave={e => { if (selected !== card.id) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}}
          >
            <div style={{
              width: "72px", height: "72px", borderRadius: "18px",
              background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#a78bfa"
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, marginBottom: "6px" }}>{card.label}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{card.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <button
        onClick={() => { localStorage.setItem("sm_onboarded", "1"); window.location.href = "/pricing"; }}
        style={{ marginTop: "36px", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
      >
        Skip for now →
      </button>
    </div>
  );
}
