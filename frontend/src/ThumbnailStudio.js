/* eslint-disable */
import React, { useState, useRef } from "react";
const BASE = "https://sociomeeai.com/api";
const C = {
  ink:"rgba(255,255,255,0.9)", muted:"rgba(255,255,255,0.4)",
  hairline:"rgba(255,255,255,0.08)", glass:"rgba(255,255,255,0.02)",
  success:"#34d399", danger:"#f87171", warn:"#fbbf24",
};
const NICHES = ["General","Gaming","Tech","Education","Finance","Fitness","Food","Travel","Comedy","Motivation","Bollywood","Cricket","Beauty","Vlog","Music"];

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"5px 12px", borderRadius:99, border:`1.5px solid ${active?"rgba(255,255,255,0.25)":C.hairline}`, background:active?"rgba(255,255,255,0.08)":"transparent", color:active?"#f5f5f7":C.muted, fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

function UploadBox({ label, file, onFile }) {
  const ref = useRef();
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <label onClick={() => ref.current?.click()} style={{ flex:1, minWidth:200, borderRadius:12, border:`1.5px dashed ${C.hairline}`, background:preview?"transparent":"rgba(255,255,255,0.02)", cursor:"pointer", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:140, position:"relative" }}>
      <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={e => onFile(e.target.files[0])} />
      {preview
        ? <img src={preview} alt={label} style={{ width:"100%", height:"100%", objectFit:"contain", maxHeight:180 }} />
        : <>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.hairline}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:10, color:C.muted }}>Click to upload</div>
          </>
      }
    </label>
  );
}

export default function ThumbnailStudio({ user }) {
  const userId = user?.user_id || user?.id || localStorage.getItem("sociomee_user_id") || "";
  const token = localStorage.getItem("sociomee_token") || "";
  const [tab,     setTab    ] = useState("ab");
  const [niche,   setNiche  ] = useState("General");
  const [fileA,   setFileA  ] = useState(null);
  const [fileB,   setFileB  ] = useState(null);
  const [fileSng, setFileSng] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult ] = useState(null);
  const [error,   setError  ] = useState("");

  const analyze = async (files, mode) => {
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("niche", niche);
      fd.append("mode", mode);
      if (mode === "ab") { fd.append("thumbnail_a", files[0]); fd.append("thumbnail_b", files[1]); }
      else fd.append("thumbnail", files[0]);
      const r = await fetch(`${BASE}/thumbnail/analyze`, { method:"POST", headers:{"Authorization":`Bearer ${token}`}, body:fd });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setResult(d);
    } catch(e) { setError("Analysis failed. Please try again."); }
    setLoading(false);
  };

  const ScoreBar = ({ label, score, color }) => (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, marginBottom:5 }}>
        <span>{label}</span><span style={{ color: color || (score>=70?C.success:score>=50?C.warn:C.muted), fontWeight:800 }}>{score}</span>
      </div>
      <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${score}%`, background:color||(score>=70?C.success:score>=50?C.warn:C.muted), borderRadius:99, transition:"width 0.6s ease" }} />
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:20 }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14 }}>
        <Pill label="A/B Test" active={tab==="ab"} onClick={() => { setTab("ab"); setResult(null); setError(""); }} />
        <Pill label="Analyze Single" active={tab==="single"} onClick={() => { setTab("single"); setResult(null); setError(""); }} />
      </div>

      {/* Niche */}
      <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:10 }}>Niche</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {NICHES.map(n => <Pill key={n} label={n} active={niche===n} onClick={() => setNiche(n)} />)}
        </div>
      </div>

      {/* Upload area */}
      <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:12 }}>
          {tab==="ab" ? "Upload Two Thumbnails" : "Upload Thumbnail"}
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:14 }}>
          {tab==="ab"
            ? <><UploadBox label="Thumbnail A" file={fileA} onFile={setFileA} /><UploadBox label="Thumbnail B" file={fileB} onFile={setFileB} /></>
            : <UploadBox label="Thumbnail" file={fileSng} onFile={setFileSng} />
          }
        </div>
        <button onClick={() => tab==="ab" ? analyze([fileA,fileB],"ab") : analyze([fileSng],"single")}
          disabled={loading || (tab==="ab" ? (!fileA||!fileB) : !fileSng)}
          style={{ width:"100%", padding:"11px", borderRadius:99, border:"1px solid rgba(255,255,255,0.12)", background:(loading||(tab==="ab"?(!fileA||!fileB):!fileSng))?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.08)", color:"#f5f5f7", fontWeight:800, fontSize:13, cursor:(loading||(tab==="ab"?(!fileA||!fileB):!fileSng))?"not-allowed":"pointer", fontFamily:"inherit", opacity:(loading||(tab==="ab"?(!fileA||!fileB):!fileSng))?0.4:1, transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {loading ? <><div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.15)", borderTopColor:"rgba(255,255,255,0.6)", animation:"spin 0.7s linear infinite" }}/> Analyzing...</> : (tab==="ab" ? "Run A/B Test" : "Analyze Thumbnail")}
        </button>
      </div>

      {error && <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", fontSize:12, color:C.danger, marginBottom:12 }}>{error}</div>}

      {/* Results */}
      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {tab==="ab" && result.winner && (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 18px" }}>
              <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:8 }}>Winner</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#f5f5f7", letterSpacing:"-0.5px" }}>Thumbnail {result.winner}</div>
              {result.reason && <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginTop:8 }}>{result.reason}</div>}
            </div>
          )}

          {/* Scores */}
          {(result.scores_a || result.scores || result.score) && (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 18px" }}>
              <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:14 }}>
                {tab==="ab" ? "Score Breakdown" : "Analysis"}
              </div>
              {tab==="ab" ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>Thumbnail A</div>
                    {result.scores_a && Object.entries(result.scores_a).map(([k,v]) => <ScoreBar key={k} label={k.replace(/_/g," ")} score={v} />)}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>Thumbnail B</div>
                    {result.scores_b && Object.entries(result.scores_b).map(([k,v]) => <ScoreBar key={k} label={k.replace(/_/g," ")} score={v} />)}
                  </div>
                </div>
              ) : (
                <div>
                  {(result.scores || result.score) && typeof (result.scores||result.score) === "object"
                    ? Object.entries(result.scores||result.score).map(([k,v]) => <ScoreBar key={k} label={k.replace(/_/g," ")} score={v} />)
                    : <ScoreBar label="Overall Score" score={result.scores||result.score||0} />
                  }
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {(result.suggestions||result.tips||result.improvements)?.length > 0 && (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 18px" }}>
              <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:12 }}>Suggestions</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(result.suggestions||result.tips||result.improvements).map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"9px 12px", background:"rgba(255,255,255,0.02)", borderRadius:9, border:"1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.25)", width:16, flexShrink:0, marginTop:1 }}>{i+1}</span>
                    <span style={{ fontSize:12.5, color:"rgba(255,255,255,0.7)", lineHeight:1.6 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
