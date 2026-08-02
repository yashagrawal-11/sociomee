/* eslint-disable */
import React, { useState, useRef } from "react";

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
const hairline = "rgba(255,255,255,0.08)";

export default function SubtitleGenerator({ user, onCreditUse }) {
  const [file,        setFile       ] = useState(null);
  const [lang,        setLang       ] = useState("auto");
  const [status,      setStatus     ] = useState("idle");
  const [progress,    setProgress   ] = useState(0);
  const [result,      setResult     ] = useState(null);
  const [error,       setError      ] = useState("");
  const [drag,        setDrag       ] = useState(false);
  const [copiedTxt,   setCopiedTxt  ] = useState(false);
  const [copiedSrt,   setCopiedSrt  ] = useState(false);
  const [copiedSrtEn, setCopiedSrtEn] = useState(false);
  const [showEn,      setShowEn     ] = useState(false);
  const fileRef = useRef(null);
  const pollRef = useRef(null);

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
      const uploadRes = await fetch(`${BASE}/subtitles/upload`, { method:"POST", body:formData });
      if (!uploadRes.ok) { const e = await uploadRes.json().catch(()=>({})); throw new Error(e?.detail || "Upload failed"); }
      const { transcript_id } = await uploadRes.json();
      setProgress(30); setStatus("processing");
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const poll = await fetch(`${BASE}/subtitles/status/${transcript_id}`);
          const data = await poll.json();
          if (data.status === "completed") {
            clearInterval(pollRef.current);
            setResult(data); setStatus("done"); setProgress(100); if(onCreditUse) onCreditUse();
          } else if (data.status === "error") {
            clearInterval(pollRef.current);
            throw new Error("Transcription failed");
          } else {
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
    a.href = url; a.download = `sociomee_subtitles_${file?.name?.replace(/\.[^.]+$/,"") || "video"}.srt`; a.click();
    URL.revokeObjectURL(url);
  };
  const downloadSrtEn = () => {
    if (!result?.srt_en) return;
    const blob = new Blob([result.srt_en], { type:"text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sociomee_subtitles_english_${file?.name?.replace(/\.[^.]+$/,"") || "video"}.srt`; a.click();
    URL.revokeObjectURL(url);
  };
  const copyTxt   = () => { navigator.clipboard.writeText(result?.text||"");   setCopiedTxt(true);   setTimeout(()=>setCopiedTxt(false),2000); };
  const copySrt   = () => { navigator.clipboard.writeText(result?.srt||"");    setCopiedSrt(true);   setTimeout(()=>setCopiedSrt(false),2000); };
  const copySrtEn = () => { navigator.clipboard.writeText(result?.srt_en||""); setCopiedSrtEn(true); setTimeout(()=>setCopiedSrtEn(false),2000); };

  const statusLabels = {
    uploading:  "Uploading video...",
    processing: "Generating subtitles... this may take a minute",
    done:       "Subtitles ready",
  };

  const btnBase     = { padding:"12px", borderRadius:"12px", border:`1.5px solid ${hairline}`, background:"rgba(255,255,255,0.04)", backdropFilter:"blur(16px)", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" };
  const tabActive   = { padding:"8px 20px", borderRadius:"99px", border:"1.5px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.08)", backdropFilter:"blur(16px)", color:"#fff", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" };
  const tabInactive = { padding:"8px 20px", borderRadius:"99px", border:`1.5px solid ${hairline}`, background:"transparent", color:"rgba(255,255,255,0.4)", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" };
  const langActive  = { padding:"9px 20px", borderRadius:"99px", border:"1.5px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.08)", backdropFilter:"blur(16px)", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" };
  const langInactive= { padding:"9px 20px", borderRadius:"99px", border:`1.5px solid ${hairline}`, background:"transparent", color:"rgba(255,255,255,0.4)", fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" };

  return (
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif"}}>

      <div style={{marginBottom:"24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.04)",backdropFilter:"blur(16px)",border:`1.5px solid ${hairline}`,borderRadius:"99px",padding:"6px 16px",marginBottom:"10px"}}>
          <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"2px",textTransform:"uppercase",color:"rgba(255,255,255,0.4)"}}>{st("AI सबटाइटल जनरेटर","AI उपशीर्षक जनरेटर","AI வசன ஜெனரேட்டர்","AI সাবটাইটেল জেনারেটর","AI Subtitle Generator")}</span>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:"700",color:"#fff",fontFamily:"'Orbitron',sans-serif",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>{st("सबटाइटल्स","उपशीर्षके","வசனங்கள்","সাবটাইটেল","SUBTITLES")}</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>{st("वीडियो अपलोड करें | YouTube, CapCut & Premiere के लिए SRT सबटाइटल पाएं","व्हिडिओ अपलोड करा | YouTube, CapCut & Premiere साठी SRT उपशीर्षके मिळवा","வீடியோவை பதிவேற்றுங்கள் | YouTube, CapCut & Premiere க்கு SRT வசனங்கள் பெறுங்கள்","ভিডিও আপলোড করুন | YouTube, CapCut & Premiere এর জন্য SRT সাবটাইটেল পান","Upload your video | get subtitles as SRT file ready for YouTube, CapCut & Premiere.")}</p>
      </div>

      {!file ? (
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>fileRef.current?.click()}
          style={{border:`2px dashed ${drag?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.1)"}`,borderRadius:"18px",padding:"60px 20px",textAlign:"center",cursor:"pointer",background:drag?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)",transition:"all 0.2s"}}>
          <input ref={fileRef} type="file" accept="video/*,audio/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
          <p style={{color:"rgba(255,255,255,0.5)",fontWeight:"700",fontSize:"16px",marginBottom:"8px"}}>{st("वीडियो/ऑडियो यहाँ क्लिक या ड्रैग करें","व्हिडिओ/ऑडिओ येथे क्लिक किंवा ड्रॅग करा","வீடியோ/ஆடியோவை இங்கே கிளிக் அல்லது இழுக்கவும்","ভিডিও/অডিও এখানে ক্লিক বা ড্র্যাগ করুন","Click or drag video / audio here")}</p>
          <p style={{color:"rgba(255,255,255,0.25)",fontSize:"13px",marginBottom:"4px"}}>MP4, MOV, WebM, MP3, WAV — Max 500MB</p>
          <p style={{color:"rgba(255,255,255,0.15)",fontSize:"12px"}}>Perfect for documentaries, podcasts, vlogs</p>
        </div>
      ) : (
        <>
          <div style={{background:"rgba(255,255,255,0.04)",border:`1.5px solid ${hairline}`,borderRadius:"14px",padding:"16px 20px",marginBottom:"16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"10px"}}>
            <div>
              <p style={{fontSize:"14px",fontWeight:"700",color:"#fff",marginBottom:"2px"}}>{file.name}</p>
              <p style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{(file.size/1024/1024).toFixed(1)} MB</p>
            </div>
            {(status === "idle" || status === "ready") && (
              <button onClick={()=>{setFile(null);setStatus("idle");setResult(null);}} style={{fontSize:"12px",fontWeight:"700",color:"rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.04)",border:`1px solid ${hairline}`,borderRadius:"8px",padding:"6px 12px",cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
            )}
          </div>

          {(status === "idle" || status === "ready") && (
            <div style={{marginBottom:"16px"}}>
              <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"10px"}}>{st("वीडियो भाषा","व्हिडिओ भाषा","வீடியோ மொழி","ভিডিও ভাষা","VIDEO LANGUAGE")}</div>
              <div style={{display:"flex",gap:"8px"}}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={()=>setLang(l.code)} style={lang===l.code?langActive:langInactive}>{l.label}</button>
                ))}
              </div>
            </div>
          )}

          {(status === "uploading" || status === "processing") && (
            <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${hairline}`,borderRadius:"14px",padding:"20px",marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"16px",height:"16px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:"rgba(255,255,255,0.6)",animation:"spin 0.7s linear infinite",flexShrink:0}}/>
                  <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.7)"}}>{statusLabels[status]}</span>
                </div>
                <span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontWeight:"700"}}>{progress}%</span>
              </div>
              <div style={{height:"4px",borderRadius:"99px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progress}%`,borderRadius:"99px",background:"rgba(255,255,255,0.3)",transition:"width 0.5s ease"}}/>
              </div>
              {status === "processing" && <p style={{fontSize:"11px",color:"rgba(255,255,255,0.2)",marginTop:"10px",textAlign:"center"}}>AssemblyAI is transcribing your video... usually takes 1-3 minutes</p>}
            </div>
          )}

          {error && <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px",color:"#f87171",fontSize:"13px",fontWeight:"600"}}>{error}</div>}

          {status === "done" && result && (
            <>
              <div style={{background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:"14px",padding:"14px 18px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"10px"}}>
                <div>
                  <p style={{fontSize:"13px",fontWeight:"700",color:"#34d399"}}>Subtitles generated — {result.words} words transcribed</p>
                  <p style={{fontSize:"11px",color:"rgba(52,211,153,0.5)"}}>Ready to download as .srt or copy as text</p>
                </div>
              </div>

              <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
                <button onClick={()=>setShowEn(false)} style={!showEn?tabActive:tabInactive}>Original</button>
                {result?.srt_en && (
                  <button onClick={()=>setShowEn(true)} style={showEn?tabActive:tabInactive}>English Translation</button>
                )}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"16px"}}>
                <button onClick={showEn?downloadSrtEn:downloadSrt} style={btnBase}>Download .srt</button>
                <button onClick={showEn?copySrtEn:copySrt} style={{...btnBase,border:`1.5px solid ${(showEn?copiedSrtEn:copiedSrt)?"rgba(52,211,153,0.4)":hairline}`,color:(showEn?copiedSrtEn:copiedSrt)?"#34d399":"#fff"}}>
                  {(showEn?copiedSrtEn:copiedSrt)?"Copied":"Copy SRT"}
                </button>
                <button onClick={copyTxt} style={{...btnBase,border:`1.5px solid ${copiedTxt?"rgba(52,211,153,0.4)":hairline}`,color:copiedTxt?"#34d399":"#fff"}}>
                  {copiedTxt?"Copied":"Copy Text"}
                </button>
              </div>

              <div style={{marginBottom:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{showEn?"ENGLISH TRANSLATION":"TRANSCRIPT PREVIEW"}</div>
                <div className="sm-scroll" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"16px",fontSize:"13px",lineHeight:"1.8",color:"rgba(255,255,255,0.7)",maxHeight:"200px",overflowY:"auto",whiteSpace:"pre-wrap"}}>
                  {showEn ? (result.translated_text || "No translation available") : result.text}
                </div>
              </div>

              <div style={{marginBottom:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>SRT FORMAT PREVIEW</div>
                <div className="sm-scroll" style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"16px",fontSize:"12px",lineHeight:"1.8",color:"rgba(255,255,255,0.5)",maxHeight:"160px",overflowY:"auto",whiteSpace:"pre-wrap",fontFamily:"monospace"}}>
                  {showEn ? (result.srt_en?.slice(0,500)||"No English SRT") : result.srt?.slice(0,500)}...
                </div>
              </div>

              <button onClick={()=>{setFile(null);setStatus("idle");setResult(null);setProgress(0);}}
                style={{width:"100%",padding:"12px",borderRadius:"99px",border:`1.5px solid ${hairline}`,background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.5)",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                {st("+ और बनाएं","+ आणखी तयार करा","+ மேலும் உருவாக்கு","+ আরও তৈরি করুন","+ Generate Another")}
              </button>
            </>
          )}

          {(status === "idle" || status === "ready") && (
            <button onClick={generate} disabled={!file}
              style={{width:"100%",padding:"15px",borderRadius:"99px",border:`1.5px solid ${hairline}`,background:"rgba(255,255,255,0.04)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"15px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.3s"}}>
              {st("सबटाइटल बनाएं","उपशीर्षके तयार करा","வசனங்கள் உருவாக்கு","সাবটাইটেল তৈরি করুন","Generate Subtitles")}
            </button>
          )}
        </>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .sm-scroll::-webkit-scrollbar{width:4px}
        .sm-scroll::-webkit-scrollbar-track{background:transparent}
        .sm-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
        .sm-scroll::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}
      `}</style>
    </div>
  );
}
