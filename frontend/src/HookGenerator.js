/* eslint-disable */
import React, { useState } from "react";
const BASE = "https://sociomeeai.com/api";
const BLOCKED_KEYWORDS = ["porn","sex","nude","naked","xxx","rape","kill","murder","suicide","bomb","drug","weed","cocaine","hack","terror","isis","racist","nigger","fuck","shit","bitch","ass","bastard","chut","lund","gaand","bhosda","madarchod","behenchod","randi","harami","sala","kamina","chudai","sexy","nangi","nanga","zavla","ghanta","zadpa","maila","oombu","sunni","punda","otha","choda","magi","baal","shala"];
const isBlocked = (text) => { const lower = text.toLowerCase(); return BLOCKED_KEYWORDS.some(w => lower.includes(w)); };
const TONES = [
  { id:"curiosity", label:"Curiosity" },
  { id:"shock",     label:"Shock" },
  { id:"pov",       label:"POV" },
  { id:"number",    label:"Numbers" },
  { id:"story",     label:"Story" },
  { id:"question",  label:"Question" },
  { id:"hinglish",  label:"Hinglish" },
];
const PLATFORMS = [
  { id:"youtube",   label:"YouTube" },
  { id:"instagram", label:"Instagram" },
  { id:"linkedin",  label:"LinkedIn" },
];
const LANGS = [
  { id:"hinglish", label:"Hinglish" },
  { id:"english",  label:"English" },
];
const C = {
  ink:"rgba(255,255,255,0.9)", muted:"rgba(255,255,255,0.4)",
  hairline:"rgba(255,255,255,0.08)", glass:"rgba(255,255,255,0.02)",
  success:"#34d399", danger:"#f87171",
};

export default function HookGenerator({ user }) {
  const userId = user?.user_id || user?.id || localStorage.getItem("sociomee_user_id") || "";
  const [topic,    setTopic   ] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [tone,     setTone    ] = useState("curiosity");
  const [language, setLanguage] = useState("hinglish");
  const [hooks,    setHooks   ] = useState([]);
  const [loading,  setLoading ] = useState(false);
  const [error,    setError   ] = useState("");
  const [copied,   setCopied  ] = useState("");

  const generate = async () => {
    if (!topic.trim()) { setError("Enter a topic first."); return; }
    if (isBlocked(topic)) { setError("This topic is not allowed."); return; }
    setLoading(true); setError(""); setHooks([]);
    try {
      const r = await fetch(`${BASE}/youtube/hooks`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ user_id: userId, topic, platform, tone, language }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); }
      else if (Array.isArray(d.hooks)) { setHooks(d.hooks); }
      else if (Array.isArray(d)) { setHooks(d); }
      else { setError("Unexpected response. Try again."); }
    } catch(e) { setError("Network error. Please try again."); }
    setLoading(false);
  };

  const copy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(""), 2000);
  };

  const Pill = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${active?"rgba(255,255,255,0.25)":C.hairline}`, background:active?"rgba(255,255,255,0.08)":"transparent", color:active?"#f5f5f7":C.muted, fontWeight:700, fontSize:11.5, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Input card */}
      <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:16, padding:20, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Hook Generator</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>Enter a topic and get 10 viral hooks instantly.</div>

        {/* Topic input + generate */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==="Enter" && generate()}
            placeholder="e.g. skincare, crypto, GTA 6, cricket..."
            style={{ flex:1, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:"rgba(255,255,255,0.03)", color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" }} />
          <button onClick={generate} disabled={loading || !topic.trim()} style={{ padding:"10px 20px", borderRadius:99, border:"1px solid rgba(255,255,255,0.12)", background:(loading||!topic.trim())?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.08)", color:"#f5f5f7", fontWeight:800, fontSize:12, cursor:(loading||!topic.trim())?"not-allowed":"pointer", fontFamily:"inherit", opacity:(loading||!topic.trim())?0.4:1, transition:"all 0.15s", whiteSpace:"nowrap" }}>
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Style */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:8 }}>Style</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {TONES.map(t => <Pill key={t.id} label={t.label} active={tone===t.id} onClick={() => setTone(t.id)} />)}
          </div>
        </div>

        {/* Platform + Language row */}
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:8 }}>Platform</div>
            <div style={{ display:"flex", gap:6 }}>
              {PLATFORMS.map(p => <Pill key={p.id} label={p.label} active={platform===p.id} onClick={() => setPlatform(p.id)} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:8 }}>Language</div>
            <div style={{ display:"flex", gap:6 }}>
              {LANGS.map(l => <Pill key={l.id} label={l.label} active={language===l.id} onClick={() => setLanguage(l.id)} />)}
            </div>
          </div>
        </div>
      </div>

      {error && <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", fontSize:12, color:C.danger, marginBottom:12 }}>{error}</div>}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
          {[1,2,3,4,5].map(i => <div key={i} style={{ height:44, borderRadius:10, background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite" }} />)}
        </div>
      )}

      {/* Results */}
      {!loading && hooks.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:10 }}>{hooks.length} Hooks Generated</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {hooks.map((h, i) => {
              const text = typeof h === "string" ? h : (h.hook || h.text || JSON.stringify(h));
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 14px" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.2)", width:18, textAlign:"center", flexShrink:0 }}>{i+1}</span>
                  <span style={{ flex:1, fontSize:13, color:C.ink, lineHeight:1.6 }}>{text}</span>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={() => copy(text, i)} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:copied===i?"#34d399":"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"color 0.15s" }}>
                      {copied===i ? "Copied" : "Copy"}
                    </button>
                    <button onClick={() => window.dispatchEvent(new CustomEvent("sociomee:generate", { detail:{ content:text, platform } }))} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)", color:"#f5f5f7", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      Generate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
