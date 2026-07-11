/* eslint-disable */
import React, { useState, useRef, useCallback } from "react";

const BASE = "https://sociomeeai.com/api";
const UI_LANG = () => localStorage.getItem("sociomee_lang") || "en";
const st = (hi, mr, ta, bn, en) => {
  const l = UI_LANG();
  return l==="hi"?hi:l==="mr"?mr:l==="ta"?ta:l==="bn"?bn:en;
};
const LANGS = [
  { code:"en", label:"English" },
  { code:"hi", label:"Hindi" },
  { code:"auto", label:"Auto Detect" },
];

export default function SubtitleGenerator({ user }) {
  const [file,       setFile      ] = useState(null);
  const [lang,       setLang      ] = useState("auto");
  const [status,     setStatus    ] = useState("idle");
  const [progress,   setProgress  ] = useState(0);
  const [result,     setResult    ] = useState(null);
  const [error,      setError     ] = useState("");
  const [drag,       setDrag      ] = useState(false);
  const [copiedTxt,  setCopiedTxt ] = useState(false);
  const [copiedSrt,  setCopiedSrt ] = useState(false);
  const [copiedSrtEn,setCopiedSrtEn] = useState(false);
  const [showEn,     setShowEn     ] = useState(false);
  const fileRef  = useRef(null);
  const pollRef  = useRef(null);

  const handleFile = f => {
    if (!f) return;
    const allowed = ["video/mp4","video/webm","video/mov","video/quicktime","audio/mp3","audio/mpeg","audio/wav","audio/m4a","video/x-msvideo"];
    if (!allowed.includes(f.type) && !f.name.match(/\.(mp4|mov|webm|mp3|wav|m4a|avi)$/i)) {
      setError("Please upload a video or audio file (MP4, MOV, WebM, MP3, WAV)");
      return;
    }
    if (f.size > 500 * 1024 * 1024) { setError("Max file size is 500MB"); return; }
    setFile(f); setError(""); setResult(null); setStatus("ready");
  };

  const generate = async () => {
    if (!file) return;
    setStatus("uploading"); setProgress(10); setError(""); setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lang", lang);
      const uploadRes = await fetch(`${BASE}/subtitles/upload`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) { const e = await uploadRes.json().catch(()=>({})); throw new Error(e?.detail || "Upload failed"); }
      const { transcript_id } = await uploadRes.json();
      setProgress(30); setStatus("processing");

      // Poll for completion
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const poll = await fetch(`${BASE}/subtitles/status/${transcript_id}`);
          const data = await poll.json();
          if (data.status === "completed") {
            clearInterval(pollRef.current);
            setResult(data);
            setStatus("done");
            setProgress(100);
          } else if (data.status === "error") {
            clearInterval(pollRef.current);
            throw new Error("Transcription failed");
          } else {
            // Still processing - update progress
            setProgress(Math.min(90, 30 + attempts * 3));
          }
        } catch(e) {
          clearInterval(pollRef.current);
          setError(e.message || "Processing failed");
          setStatus("idle");
        }
      }, 3000);
    } catch(e) {
      setError(e.message || "Something went wrong");
      setStatus("idle");
    }
  };

  const downloadSrt = () => {
    if (!result?.srt) return;
    const blob = new Blob([result.srt], { type:"text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sociomee_subtitles_${file?.name?.replace(/\.[^.]+$/,"") || "video"}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyTxt = () => { navigator.clipboard.writeText(result?.text||""); setCopiedTxt(true); setTimeout(()=>setCopiedTxt(false),2000); };
  const copySrtEn = () => { navigator.clipboard.writeText(result?.srt_en||""); setCopiedSrtEn(true); setTimeout(()=>setCopiedSrtEn(false),2000); };
  const downloadSrtEn = () => {
    if (!result?.srt_en) return;
    const blob = new Blob([result.srt_en], { type:"text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sociomee_subtitles_english_${file?.name?.replace(/\.[^.]+$/,"") || "video"}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const copySrt = () => { navigator.clipboard.writeText(result?.srt||""); setCopiedSrt(true); setTimeout(()=>setCopiedSrt(false),2000); };

  const P = "#7c3aed", R = "#ff3d8f";
  const hairline = "rgba(167,139,250,0.15)";

  const statusLabels = {
    uploading: "Uploading video…",
    processing: "Generating subtitles… this may take a minute",
    done: "Subtitles ready!",
  };

  return (
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif"}}>

      {/* Header */}
      <div style={{marginBottom:"24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1.5px solid rgba(124,58,237,0.45)",borderRadius:"99px",padding:"6px 16px",marginBottom:"10px",boxShadow:"0 0 16px rgba(124,58,237,0.2)"}}>
          <span>🎬</span>
          <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"2px",textTransform:"uppercase",color:"#a78bfa"}}>{st("AI सबटाइटल जनरेटर","AI उपशीर्षक जनरेटर","AI வசன ஜெனரேட்டர்","AI সাবটাইটেল জেনারেটর","AI Subtitle Generator")}</span>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:"700",color:"#fff",fontFamily:"'Orbitron',sans-serif",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>{st("सबटाइटल्स","उपशीर्षके","வசனங்கள்","সাবটাইটেল","SUBTITLES")}</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>{st("वीडियो अपलोड करें | YouTube, CapCut & Premiere के लिए SRT सबटाइटल पाएं","व्हिडिओ अपलोड करा | YouTube, CapCut & Premiere साठी SRT उपशीर्षके मिळवा","வீடியோவை பதிவேற்றுங்கள் | YouTube, CapCut & Premiere க்கு SRT வசனங்கள் பெறுங்கள்","ভিডিও আপলোড করুন | YouTube, CapCut & Premiere এর জন্য SRT সাবটাইটেল পান","Upload your video | get subtitles as SRT file ready for YouTube, CapCut & Premiere.")}</p>
      </div>

      {/* Upload */}
      {!file ? (
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>fileRef.current?.click()}
          style={{border:`2px dashed ${drag?"#7c3aed":"rgba(124,58,237,0.35)"}`,borderRadius:"18px",padding:"60px 20px",textAlign:"center",cursor:"pointer",background:drag?"rgba(124,58,237,0.08)":"rgba(255,255,255,0.02)",transition:"all 0.2s"}}>
          <input ref={fileRef} type="file" accept="video/*,audio/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
          <div style={{fontSize:"48px",marginBottom:"16px"}}>🎙️</div>
          <p style={{color:"#a78bfa",fontWeight:"700",fontSize:"16px",marginBottom:"8px"}}>{st("वीडियो/ऑडियो यहाँ क्लिक या ड्रैग करें","व्हिडिओ/ऑडिओ येथे क्लिक किंवा ड्रॅग करा","வீடியோ/ஆடியோவை இங்கே கிளிக் அல்லது இழுக்கவும்","ভিডিও/অডিও এখানে ক্লিক বা ড্র্যাগ করুন","Click or drag video/audio here")}</p>
          <p style={{color:"rgba(255,255,255,0.25)",fontSize:"13px",marginBottom:"4px"}}>MP4, MOV, WebM, MP3, WAV · Max 500MB</p>
          <p style={{color:"rgba(255,255,255,0.15)",fontSize:"12px"}}>Perfect for documentaries, podcasts, vlogs</p>
        </div>
      ) : (
        <>
          {/* File info */}
          <div style={{background:"rgba(124,58,237,0.08)",border:`1.5px solid ${hairline}`,borderRadius:"14px",padding:"16px 20px",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <span style={{fontSize:"28px"}}>🎬</span>
              <div>
                <p style={{fontSize:"14px",fontWeight:"700",color:"#fff",marginBottom:"2px"}}>{file.name}</p>
                <p style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{(file.size/1024/1024).toFixed(1)} MB</p>
              </div>
            </div>
            {status === "idle" || status === "ready" ? (
              <button onClick={()=>{setFile(null);setStatus("idle");setResult(null);}} style={{fontSize:"12px",fontWeight:"700",color:"rgba(255,61,143,0.7)",background:"rgba(255,61,143,0.08)",border:"1px solid rgba(255,61,143,0.2)",borderRadius:"8px",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit"}}>✕ Remove</button>
            ) : null}
          </div>

          {/* Language selector */}
          {(status === "idle" || status === "ready") && (
            <div style={{marginBottom:"16px"}}>
              <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"10px"}}>{st("वीडियो भाषा","व्हिडिओ भाषा","வீடியோ மொழி","ভিডিও ভাষা","VIDEO LANGUAGE")}</div>
              <div style={{display:"flex",gap:"8px"}}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={()=>setLang(l.code)}
                    style={{padding:"9px 20px",borderRadius:"99px",cursor:"pointer",fontFamily:"inherit",fontWeight:"700",fontSize:"13px",transition:"all 0.3s",border:`1.5px solid rgba(124,58,237,${lang===l.code?"0.7":"0.2"})`,background:lang===l.code?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",color:"#fff",boxShadow:lang===l.code?"0 0 20px rgba(124,58,237,0.6),0 0 40px rgba(124,58,237,0.3)":"none"}}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {(status === "uploading" || status === "processing") && (
            <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${hairline}`,borderRadius:"14px",padding:"20px",marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"18px",height:"18px",borderRadius:"50%",border:`2px solid rgba(124,58,237,0.3)`,borderTopColor:"#ff3d8f",animation:"spin 0.7s linear infinite",flexShrink:0}}/>
                  <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.7)"}}>{statusLabels[status]}</span>
                </div>
                <span style={{fontSize:"12px",color:"#a78bfa",fontWeight:"700"}}>{progress}%</span>
              </div>
              <div style={{height:"6px",borderRadius:"99px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progress}%`,borderRadius:"99px",background:"linear-gradient(90deg,#7c3aed,#ff3d8f)",transition:"width 0.5s ease",boxShadow:"0 0 16px rgba(124,58,237,0.8),0 0 32px rgba(255,61,143,0.4)"}}/>
              </div>
              {status === "processing" && <p style={{fontSize:"11px",color:"rgba(255,255,255,0.2)",marginTop:"10px",textAlign:"center"}}>AssemblyAI is transcribing your video with AI… usually takes 1-3 minutes</p>}
            </div>
          )}

          {error && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px",color:"#f87171",fontSize:"13px",fontWeight:"600"}}>⚠ {error}</div>}

          {/* Results */}
          {status === "done" && result && (
            <>
              <div style={{background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:"14px",padding:"14px 18px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"10px"}}>
                <span style={{fontSize:"20px"}}>✅</span>
                <div>
                  <p style={{fontSize:"13px",fontWeight:"700",color:"#34d399"}}>Subtitles generated — {result.words} words transcribed</p>
                  <p style={{fontSize:"11px",color:"rgba(52,211,153,0.5)"}}>Ready to download as .srt or copy as text</p>
                </div>
              </div>

              {/* Tab toggle */}
              <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
                <button onClick={()=>setShowEn(false)}
                  style={{padding:"8px 20px",borderRadius:"99px",border:`1.5px solid rgba(124,58,237,${!showEn?"0.7":"0.2"})`,background:!showEn?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"700",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",boxShadow:!showEn?"0 0 18px rgba(124,58,237,0.5)":"none",transition:"all 0.3s"}}>
                  Original
                </button>
                {result?.srt_en && (
                  <button onClick={()=>setShowEn(true)}
                    style={{padding:"8px 20px",borderRadius:"99px",border:`1.5px solid rgba(124,58,237,${showEn?"0.7":"0.2"})`,background:showEn?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"700",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",boxShadow:showEn?"0 0 18px rgba(124,58,237,0.5)":"none",transition:"all 0.3s"}}>
                    🌐 English Translation
                  </button>
                )}
              </div>

              {/* Action buttons */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"16px"}}>
                <button onClick={showEn ? downloadSrtEn : downloadSrt}
                  className="subtitle-glow-btn"
                  style={{padding:"12px",borderRadius:"12px",border:"1.5px solid rgba(124,58,237,0.5)",background:"rgba(124,58,237,0.1)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 0 14px rgba(124,58,237,0.3)",transition:"all 0.3s"}}>
                  {st("⬇ डाउनलोड करें .srt","⬇ डाउनलोड करा .srt","⬇ பதிவிறக்கு .srt","⬇ ডাউনলোড করুন .srt","⬇ Download .srt")}
                </button>
                <button onClick={showEn ? copySrtEn : copySrt}
                  style={{padding:"12px",borderRadius:"12px",border:`1.5px solid ${(showEn?copiedSrtEn:copiedSrt)?"rgba(52,211,153,0.5)":"rgba(124,58,237,0.35)"}`,background:(showEn?copiedSrtEn:copiedSrt)?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)",backdropFilter:"blur(10px)",color:(showEn?copiedSrtEn:copiedSrt)?"#34d399":"#fff",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                  {(showEn?copiedSrtEn:copiedSrt)?"✓ Copied!":"📋 Copy SRT"}
                </button>
                <button onClick={copyTxt}
                  style={{padding:"12px",borderRadius:"12px",border:`1.5px solid ${copiedTxt?"rgba(52,211,153,0.5)":"rgba(124,58,237,0.35)"}`,background:copiedTxt?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)",backdropFilter:"blur(10px)",color:copiedTxt?"#34d399":"#fff",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                  {copiedTxt?"✓ Copied!":"📝 Copy Text"}
                </button>
              </div>

              {/* Text preview */}
              <div style={{marginBottom:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{showEn?"ENGLISH TRANSLATION":"TRANSCRIPT PREVIEW"}</div>
                <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"16px",fontSize:"13px",lineHeight:"1.8",color:"rgba(255,255,255,0.7)",maxHeight:"200px",overflowY:"auto",whiteSpace:"pre-wrap"}}>
                  {showEn ? (result.translated_text || "No translation available") : result.text}
                </div>
              </div>

              {/* SRT preview */}
              <div style={{marginBottom:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>SRT FORMAT PREVIEW</div>
                <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"16px",fontSize:"12px",lineHeight:"1.8",color:"rgba(255,255,255,0.5)",maxHeight:"160px",overflowY:"auto",whiteSpace:"pre-wrap",fontFamily:"monospace"}}>
                  {showEn ? (result.srt_en?.slice(0,500)||"No English SRT") : result.srt?.slice(0,500)}…
                </div>
              </div>

              <button onClick={()=>{setFile(null);setStatus("idle");setResult(null);setProgress(0);}}
                style={{width:"100%",padding:"12px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.35)",background:"rgba(124,58,237,0.08)",color:"#a78bfa",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                {st("+ और बनाएं","+ आणखी तयार करा","+ மேலும் உருவாக்கு","+ আরও তৈরি করুন","+ Generate Another")}
              </button>
            </>
          )}

          {/* Generate button */}
          {(status === "idle" || status === "ready") && (
            <button onClick={generate} disabled={!file}
              className="subtitle-btn"
              className="subtitle-glow-btn"
            style={{width:"100%",padding:"15px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.5)",background:"rgba(124,58,237,0.1)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"15px",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 0 16px rgba(124,58,237,0.3)",transition:"all 0.3s"}}>
              {st("🎬 सबटाइटल बनाएं","🎬 उपशीर्षके तयार करा","🎬 வசனங்கள் உருவாக்கு","🎬 সাবটাইটেল তৈরি করুন","🎬 Generate Subtitles")}
            </button>
          )}
        </>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .subtitle-btn:hover, .subtitle-glow-btn:hover {
          background: rgba(124,58,237,0.2) !important;
          border-color: rgba(124,58,237,1) !important;
          box-shadow: 0 0 28px rgba(124,58,237,0.8), 0 0 60px rgba(124,58,237,0.4) !important;
          transform: translateY(-2px) !important;
        }

      `}</style>
    </div>
  );
}
