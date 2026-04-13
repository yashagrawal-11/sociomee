import { useState, useRef } from "react";

// ── Palette ────────────────────────────────────────────────
const C = {
  rose:    "#ff4da6",
  roseLt:  "#ff85c1",
  roseXlt: "#ffe4ec",
  purple:  "#c26dff",
  purpleLt:"#f3d6ff",
  ink:     "#1a0a12",
  muted:   "#9e6b86",
  white:   "#ffffff",
  card:    "#fff7fa",
  success: "#22c55e",
  warn:    "#f59e0b",
  danger:  "#ef4444",
};

// ── Static style objects ───────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${C.roseXlt} 0%, #f8d7ff 50%, #e8f0ff 100%)`,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "'Syne', 'DM Sans', sans-serif",
    padding: "40px 16px 80px",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "fixed", top: "-120px", right: "-120px",
    width: "420px", height: "420px", borderRadius: "50%",
    background: `radial-gradient(circle, ${C.purpleLt}cc, transparent 70%)`,
    pointerEvents: "none", zIndex: 0,
  },
  blob2: {
    position: "fixed", bottom: "-80px", left: "-80px",
    width: "340px", height: "340px", borderRadius: "50%",
    background: `radial-gradient(circle, ${C.roseXlt}cc, transparent 70%)`,
    pointerEvents: "none", zIndex: 0,
  },
  wrap: {
    width: "100%", maxWidth: "520px",
    position: "relative", zIndex: 1,
  },
  // Header chip
  chip: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: `linear-gradient(135deg, ${C.rose}, ${C.purple})`,
    color: C.white, fontSize: "11px", fontWeight: "700",
    letterSpacing: "1.5px", textTransform: "uppercase",
    padding: "5px 14px", borderRadius: "99px",
    marginBottom: "14px", boxShadow: `0 4px 14px ${C.rose}55`,
  },
  heading: {
    fontSize: "clamp(28px, 6vw, 42px)", fontWeight: "900",
    color: C.ink, lineHeight: 1.1, marginBottom: "6px",
  },
  headingSub: {
    fontSize: "15px", color: C.muted, marginBottom: "32px", fontWeight: "400",
  },
  card: {
    background: C.white,
    borderRadius: "24px",
    padding: "36px 32px",
    boxShadow: `0 32px 80px ${C.rose}18, 0 8px 24px rgba(0,0,0,0.06)`,
    border: `1px solid ${C.roseXlt}`,
  },
  label: {
    fontSize: "11px", fontWeight: "700", letterSpacing: "1px",
    textTransform: "uppercase", color: C.muted, marginBottom: "6px",
    display: "block",
  },
  inputWrap: { marginBottom: "18px" },
  input: {
    width: "100%", padding: "13px 16px",
    borderRadius: "12px", border: `1.5px solid #f0d6e8`,
    outline: "none", fontSize: "14px", fontWeight: "500",
    color: C.ink, background: C.card,
    boxShadow: "inset 0 2px 6px rgba(255,77,166,0.04)",
    transition: "border 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  select: {
    width: "100%", padding: "13px 16px",
    borderRadius: "12px", border: `1.5px solid #f0d6e8`,
    outline: "none", fontSize: "14px", fontWeight: "500",
    color: C.ink, background: C.card, cursor: "pointer",
    boxSizing: "border-box", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c26dff'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    backgroundSize: "20px",
    fontFamily: "inherit",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  btn: {
    width: "100%", padding: "15px",
    borderRadius: "14px", border: "none",
    background: `linear-gradient(135deg, ${C.rose}, ${C.purple})`,
    color: C.white, fontWeight: "800", fontSize: "15px",
    cursor: "pointer", marginTop: "6px",
    boxShadow: `0 12px 28px ${C.rose}44`,
    transition: "transform 0.15s, box-shadow 0.15s",
    fontFamily: "inherit", letterSpacing: "0.3px",
  },
  divider: {
    height: "1px", background: `linear-gradient(90deg, transparent, ${C.roseXlt}, transparent)`,
    margin: "28px 0",
  },
  // Score bar row
  scoreRow: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: "10px",
  },
  scoreBadge: {
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "4px 12px", borderRadius: "99px",
    fontSize: "12px", fontWeight: "700",
  },
  // Section heading in output
  sectionHd: {
    fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px",
    textTransform: "uppercase", color: C.muted, marginBottom: "10px",
  },
  // Pill tag
  pill: {
    display: "inline-block", padding: "5px 12px",
    borderRadius: "99px", fontSize: "13px", fontWeight: "600",
    marginRight: "7px", marginBottom: "7px", cursor: "default",
  },
  // Hook card
  hookCard: {
    background: C.card, border: `1px solid ${C.roseXlt}`,
    borderRadius: "12px", padding: "12px 16px",
    marginBottom: "8px", fontSize: "14px",
    color: C.ink, fontWeight: "500", lineHeight: 1.5,
  },
  // Tip line
  tip: {
    display: "flex", alignItems: "flex-start", gap: "8px",
    fontSize: "13px", color: "#4a2040", marginBottom: "7px",
    lineHeight: 1.45,
  },
  // Spinner
  spinnerWrap: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "40px 0", gap: "14px",
  },
};

// ── Helpers ────────────────────────────────────────────────
function scoreColor(n) {
  if (n >= 80) return C.success;
  if (n >= 55) return C.warn;
  return C.danger;
}

function ScoreBar({ label, value, emoji }) {
  const col = scoreColor(value);
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={S.scoreRow}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: C.ink }}>
          {emoji} {label}
        </span>
        <span style={{ ...S.scoreBadge, background: col + "22", color: col }}>
          {value}/100
        </span>
      </div>
      <div style={{ background: "#f0e0e8", borderRadius: "99px", height: "6px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "99px",
          width: `${value}%`,
          background: `linear-gradient(90deg, ${col}bb, ${col})`,
          transition: "width 0.9s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={S.spinnerWrap}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "50%",
        border: `3px solid ${C.roseXlt}`,
        borderTopColor: C.rose,
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: C.muted, fontSize: "13px", fontWeight: "600" }}>
        Generating content…
      </p>
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} style={{
      background: copied ? C.success + "22" : C.roseXlt,
      color: copied ? C.success : C.rose,
      border: "none", borderRadius: "8px",
      padding: "4px 10px", fontSize: "11px", fontWeight: "700",
      cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
      letterSpacing: "0.5px",
    }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Hashtag section ────────────────────────────────────────
function HashtagSection({ hashtags }) {
  const bands = { high: { col: C.success, label: "HIGH" }, medium: { col: C.warn, label: "MED" }, low: { col: C.danger, label: "LOW" } };
  // Support both {high:[],medium:[],low:[]} and [{band,tag}] tuple format
  let grouped = hashtags;
  if (Array.isArray(hashtags)) {
    grouped = { high: [], medium: [], low: [] };
    hashtags.forEach(([band, tag]) => {
      const k = band.toLowerCase();
      if (grouped[k]) grouped[k].push(tag);
    });
  }
  const allTags = Object.values(grouped).flat().join("  ");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <p style={S.sectionHd}>🏷️ Hashtags</p>
        <CopyBtn text={allTags} />
      </div>
      {Object.entries(bands).map(([key, { col, label }]) =>
        grouped[key]?.length > 0 && (
          <div key={key} style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "800", color: col, letterSpacing: "1px", marginRight: "8px" }}>{label}</span>
            {grouped[key].map((tag, i) => (
              <span key={i} style={{ ...S.pill, background: col + "18", color: col }}>
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [keyword, setKeyword]       = useState("");
  const [platform, setPlatform]     = useState("");
  const [contentType, setContentType] = useState("");
  const [tone, setTone]             = useState("");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [btnHov, setBtnHov]         = useState(false);
  const resultRef = useRef(null);

  const handleSubmit = async () => {
    if (!keyword || !platform || !contentType || !tone) {
      setError("Please fill in all fields before generating.");
      return;
    }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, platform, content_type: contentType, tone }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (e) {
      setError(e.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const scores = result?.scores || {};
  const hooks = result?.hooks || [];
  const captions = result?.captions || [];
  const cta = result?.cta || [];
  const ideas = result?.ideas || [];
  const tips = scores?.tips || [];

  return (
    <div style={S.page}>
      {/* Ambient blobs */}
      <div style={S.blob1} />
      <div style={S.blob2} />

      <div style={S.wrap}>
        {/* Header */}
        <div style={S.chip}>✦ AI Content Studio</div>
        <h1 style={S.heading}>SocioMee<span style={{ color: C.rose }}>.</span></h1>
        <p style={S.headingSub}>Generate platform-native content in seconds — scored, styled, ready to post.</p>

        {/* Input Card */}
        <div style={S.card}>
          <div style={S.inputWrap}>
            <label style={S.label}>Keyword / Niche</label>
            <input
              placeholder="e.g. skincare routine, crypto tips…"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={S.input}
              onFocus={e => { e.target.style.border = `1.5px solid ${C.rose}`; e.target.style.boxShadow = `0 0 0 3px ${C.rose}18`; }}
              onBlur={e  => { e.target.style.border = "1.5px solid #f0d6e8"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={S.row}>
            <div style={S.inputWrap}>
              <label style={S.label}>Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={S.select}>
                <option value="">Choose…</option>
                {["instagram","youtube","facebook","x","tiktok","telegram","pinterest","threads"].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={S.inputWrap}>
              <label style={S.label}>Content Type</label>
              <select value={contentType} onChange={e => setContentType(e.target.value)} style={S.select}>
                <option value="">Choose…</option>
                {["reel","post","story","thread","pin","short","carousel"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={S.inputWrap}>
            <label style={S.label}>Tone</label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                { val: "bold",        emoji: "🔥", color: "#ff4d4d" },
                { val: "funny",       emoji: "😂", color: "#f59e0b" },
                { val: "emotional",   emoji: "💖", color: C.rose },
                { val: "informative", emoji: "📚", color: C.purple },
              ].map(({ val, emoji, color }) => (
                <button
                  key={val}
                  onClick={() => setTone(val)}
                  style={{
                    padding: "8px 16px", borderRadius: "99px", border: "1.5px solid",
                    borderColor: tone === val ? color : "#f0d6e8",
                    background: tone === val ? color + "18" : C.card,
                    color: tone === val ? color : C.muted,
                    fontWeight: "700", fontSize: "13px", cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                  }}
                >
                  {emoji} {val.charAt(0).toUpperCase() + val.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ color: C.danger, fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>
              ⚠ {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            onMouseEnter={() => setBtnHov(true)}
            onMouseLeave={() => setBtnHov(false)}
            style={{
              ...S.btn,
              transform: btnHov && !loading ? "translateY(-2px)" : "none",
              boxShadow: btnHov && !loading ? `0 18px 38px ${C.rose}55` : `0 12px 28px ${C.rose}44`,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Generating…" : "Generate Content 🚀"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ ...S.card, marginTop: "20px" }}>
            <Spinner />
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div ref={resultRef} style={{ ...S.card, marginTop: "20px" }}>

            {/* Meta row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <div>
                <span style={{ fontSize: "18px", fontWeight: "900", color: C.ink }}>
                  {result.platform?.charAt(0).toUpperCase() + result.platform?.slice(1)} ✦ {result.keyword}
                </span>
              </div>
              <span style={{
                ...S.scoreBadge,
                background: scoreColor(scores.final_score) + "22",
                color: scoreColor(scores.final_score),
                fontSize: "13px",
              }}>
                ⭐ {scores.final_score}/100 {scores.level}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: C.muted, marginBottom: "20px" }}>
              {result.content_type} · {result.tone} · Best time: {result.best_time || "—"}
            </p>

            {/* Scores */}
            <ScoreBar label="AI Potential"      value={scores.ai_score}      emoji="🔥" />
            <ScoreBar label="Content Strength"  value={scores.content_score} emoji="🧠" />
            <ScoreBar label="Final Score"       value={scores.final_score}   emoji="⭐" />

            <div style={S.divider} />

            {/* Hooks */}
            {hooks.length > 0 && (
              <div style={{ marginBottom: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <p style={S.sectionHd}>📌 Hooks</p>
                  <CopyBtn text={hooks.join("\n")} />
                </div>
                {hooks.map((h, i) => <div key={i} style={S.hookCard}>{h}</div>)}
              </div>
            )}

            {/* Captions */}
            {captions.length > 0 && (
              <div style={{ marginBottom: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <p style={S.sectionHd}>✍️ Captions</p>
                  <CopyBtn text={captions.join("\n")} />
                </div>
                {captions.map((cap, i) => <div key={i} style={S.hookCard}>{cap}</div>)}
              </div>
            )}

            {/* CTA */}
            {cta.length > 0 && (
              <div style={{ marginBottom: "22px" }}>
                <p style={S.sectionHd}>📣 Call to Action</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {cta.map((c, i) => (
                    <span key={i} style={{ ...S.pill, background: C.rose + "15", color: C.rose, border: `1px solid ${C.rose}33` }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {result.hashtags && (
              <div style={{ marginBottom: "22px" }}>
                <HashtagSection hashtags={result.hashtags} />
              </div>
            )}

            {/* Content Ideas */}
            {ideas.length > 0 && (
              <div style={{ marginBottom: "22px" }}>
                <p style={S.sectionHd}>💡 Content Ideas</p>
                {ideas.map((idea, i) => (
                  <div key={i} style={{ ...S.hookCard, display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ color: C.rose, fontWeight: "800", minWidth: "18px" }}>{i + 1}</span>
                    {idea}
                  </div>
                ))}
              </div>
            )}

            {/* Tips */}
            {tips.length > 0 && (
              <div style={{ background: C.roseXlt + "88", borderRadius: "14px", padding: "16px 18px" }}>
                <p style={{ ...S.sectionHd, marginBottom: "12px" }}>💡 Improvement Tips</p>
                {tips.map((tip, i) => (
                  <div key={i} style={S.tip}>
                    <span style={{ color: C.rose, marginTop: "1px" }}>✅</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: "center", color: C.muted, fontSize: "12px", marginTop: "28px", fontWeight: "500" }}>
          SocioMee · AI Content Studio · Made with 💖
        </p>
      </div>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        select option { background: white; color: #1a0a12; }
      `}</style>
    </div>
  );
}