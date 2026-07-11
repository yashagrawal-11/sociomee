import { useState, useRef, useEffect, useCallback } from "react";

const C = {
  bg: "#0a0a0a",
  panel: "rgba(6,4,15,0.97)",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  purple: "#7c3aed",
  purpleLight: "#a78bfa",
  muted: "rgba(255,255,255,0.35)",
  white: "#fff",
  font: "Poppins, sans-serif",
};

const PLATFORMS = [
  { id:"custom",    label:"Custom",        w:null,  h:null  },
  { id:"yt-thumb",  label:"YT Thumbnail",  w:1280,  h:720   },
  { id:"ig-square", label:"IG Square",     w:1080,  h:1080  },
  { id:"ig-story",  label:"IG Story",      w:1080,  h:1920  },
  { id:"ig-post",   label:"IG Portrait",   w:1080,  h:1350  },
  { id:"twitter",   label:"X / Twitter",   w:1200,  h:675   },
  { id:"linkedin",  label:"LinkedIn",      w:1200,  h:627   },
  { id:"pinterest", label:"Pinterest",     w:1000,  h:1500  },
  { id:"facebook",  label:"Facebook",      w:1200,  h:630   },
];

const DEFAULT_ADJ = { brightness:100, contrast:100, saturation:100, blur:0, opacity:100, hue:0 };

const FILTERS = [
  { id:"none",      label:"None",     css:"" },
  { id:"vivid",     label:"Vivid",    css:"saturate(1.6) contrast(1.1)" },
  { id:"matte",     label:"Matte",    css:"contrast(0.85) saturate(0.8) brightness(1.05)" },
  { id:"noir",      label:"Noir",     css:"grayscale(1) contrast(1.2)" },
  { id:"warm",      label:"Warm",     css:"sepia(0.4) saturate(1.3) brightness(1.05)" },
  { id:"cool",      label:"Cool",     css:"hue-rotate(200deg) saturate(0.9)" },
  { id:"fade",      label:"Fade",     css:"brightness(1.1) contrast(0.85) saturate(0.7)" },
  { id:"punch",     label:"Punch",    css:"contrast(1.3) saturate(1.4)" },
];

function Slider({ label, value, min, max, step=1, unit="", onChange }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
        <span style={{ fontSize:"11px", color:C.muted, fontFamily:C.font }}>{label}</span>
        <span style={{ fontSize:"11px", color:C.purpleLight, fontFamily:C.font, fontWeight:"600" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:"100%", accentColor:C.purple, cursor:"pointer", height:"3px" }}/>
    </div>
  );
}

export default function SocioMeePixel() {
  const [image, setImage]           = useState(null); // data URL
  const [fileName, setFileName]     = useState("");
  const [adj, setAdj]               = useState(DEFAULT_ADJ);
  const [filter, setFilter]         = useState("none");
  const [platform, setPlatform]     = useState("custom");
  const [customW, setCustomW]       = useState(1280);
  const [customH, setCustomH]       = useState(720);
  const [texts, setTexts]           = useState([]);
  const [selText, setSelText]       = useState(null);
  const [activeTab, setActiveTab]   = useState("adjust"); // adjust | filter | text | resize | export
  const [dragOver, setDragOver]     = useState(false);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [exportFmt, setExportFmt]   = useState("png");
  const [exportQ, setExportQ]       = useState(90);
  const [zoom, setZoom]             = useState(1);

  const canvasRef    = useRef(null);
  const fileInputRef = useRef(null);
  const imgRef       = useRef(new Image());

  // Build CSS filter string from adjustments
  const buildFilter = useCallback(() => {
    const f = FILTERS.find(f => f.id === filter)?.css || "";
    return `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) blur(${adj.blur}px) hue-rotate(${adj.hue}deg) opacity(${adj.opacity}%) ${f}`.trim();
  }, [adj, filter]);

  // Target dimensions
  const pl = PLATFORMS.find(p => p.id === platform);
  const tw = pl?.w || customW;
  const th = pl?.h || customH;

  // Draw canvas whenever image/adjustments/texts change
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    img.onload = () => {
      canvas.width  = tw;
      canvas.height = th;
      ctx.filter = buildFilter();
      // Cover fit
      const ir = img.width / img.height;
      const cr = tw / th;
      let sx=0,sy=0,sw=img.width,sh=img.height;
      if (ir > cr) { sw = img.height*cr; sx=(img.width-sw)/2; }
      else { sh = img.width/cr; sy=(img.height-sh)/2; }
      ctx.drawImage(img, sx,sy,sw,sh, 0,0,tw,th);
      ctx.filter = "none";
      // Draw text overlays
      texts.forEach(t => {
        ctx.font = `${t.bold?"bold ":""}${t.italic?"italic ":""}${t.size}px ${t.font||"Poppins, sans-serif"}`;
        ctx.fillStyle = t.color || "#ffffff";
        ctx.globalAlpha = (t.opacity||100)/100;
        ctx.textAlign = t.align || "center";
        if (t.shadow) {
          ctx.shadowColor = "rgba(0,0,0,0.7)";
          ctx.shadowBlur = 8;
        }
        ctx.fillText(t.text, t.x, t.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });
    };
    img.src = image;
  }, [image, adj, filter, texts, tw, th, buildFilter]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) { alert("Please upload an image file."); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => { setImage(e.target.result); setAdj(DEFAULT_ADJ); setFilter("none"); setTexts([]); };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    const t = { id: Date.now(), text:"Your Text Here", x:tw/2, y:th/2, size:48, color:"#ffffff", font:"Poppins, sans-serif", bold:true, italic:false, align:"center", opacity:100, shadow:true };
    setTexts(prev => [...prev, t]);
    setSelText(t.id);
    setActiveTab("text");
  };

  const updateText = (id, fields) => setTexts(prev => prev.map(t => t.id===id ? {...t,...fields} : t));
  const deleteText = (id) => { setTexts(prev => prev.filter(t => t.id!==id)); setSelText(null); };

  const removeBg = async () => {
    if (!image) return;
    setBgRemoving(true);
    try {
      // Use remove.bg API via a simple fetch with form data
      const token = localStorage.getItem("sociomee_token");
      const res = await fetch("https://sociomeeai.com/api/removebg", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) throw new Error("BG removal failed");
      const data = await res.json();
      setImage(data.image);
    } catch(e) {
      // Fallback: use CSS mix-blend-mode trick notification
      alert("Background removal requires a remove.bg API key. For now, try uploading a PNG with transparent background.");
    } finally {
      setBgRemoving(false);
    }
  };

  const exportImage = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const mimeType = exportFmt === "jpg" ? "image/jpeg" : exportFmt === "webp" ? "image/webp" : "image/png";
    const quality = exportFmt === "png" ? 1 : exportQ/100;
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const a = document.createElement("a");
    const base = fileName.replace(/\.[^.]+$/, "");
    a.href = dataUrl;
    a.download = `${base}_sociomee.${exportFmt}`;
    a.click();
  };

  const resetAdj = () => setAdj(DEFAULT_ADJ);

  const selTextObj = texts.find(t => t.id === selText);

  const TAB_BTNS = [
    { id:"adjust",  label:"Adjust",   icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> },
    { id:"filter",  label:"Filters",  icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg> },
    { id:"text",    label:"Text",     icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
    { id:"resize",  label:"Resize",   icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg> },
    { id:"export",  label:"Export",   icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:C.bg, fontFamily:C.font, overflow:"hidden" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        input[type=range]{-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.1);border-radius:99px;height:3px;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#7c3aed;cursor:pointer;border:2px solid rgba(255,255,255,0.3);}
        .pixel-tab:hover{background:rgba(255,255,255,0.06)!important;color:rgba(255,255,255,0.7)!important;}
        .pixel-btn:hover{background:rgba(124,58,237,0.2)!important;border-color:rgba(124,58,237,0.4)!important;color:#a78bfa!important;}
        .pixel-upload:hover{border-color:rgba(124,58,237,0.5)!important;background:rgba(124,58,237,0.06)!important;}
        .filter-card:hover{border-color:rgba(124,58,237,0.4)!important;transform:scale(1.03);}
        .platform-btn:hover{background:rgba(255,255,255,0.06)!important;}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:99px}
      `}</style>

      {/* Header */}
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"9px", background:"rgba(236,72,153,0.15)", border:"1px solid rgba(236,72,153,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:"15px" }}>✦</span>
          </div>
          <div>
            <h2 style={{ fontSize:"13px", fontWeight:"800", color:C.white, margin:0, fontFamily:C.font }}>SocioMee Pixel</h2>
            {fileName && <p style={{ fontSize:"10px", color:C.muted, margin:0, fontFamily:C.font }}>{fileName} · {tw}×{th}</p>}
          </div>
        </div>
        {image && (
          <div style={{ display:"flex", gap:"6px" }}>
            <button onClick={addText} className="pixel-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:`1px solid ${C.border}`, background:C.card, color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Text
            </button>
            <button onClick={removeBg} disabled={bgRemoving} className="pixel-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:`1px solid ${C.border}`, background:C.card, color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              {bgRemoving ? <div style={{ width:"10px", height:"10px", borderRadius:"50%", border:"2px solid rgba(124,58,237,0.3)", borderTopColor:"#7c3aed", animation:"spin 0.8s linear infinite" }}/> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18M10.5 10.5A3 3 0 0 0 9 13a3 3 0 0 0 3 3 3 3 0 0 0 2.5-1.5"/><path d="M12 9a3 3 0 0 1 3 3"/><path d="M17.5 6.5A9 9 0 0 0 12 5C7 5 3 9 3 14s4 7 9 7a9 9 0 0 0 6.5-2.5"/></svg>}
              Remove BG
            </button>
            <button onClick={exportImage} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 14px", borderRadius:"8px", border:"none", background:"linear-gradient(135deg,#7c3aed,#9b5cf6)", color:"#fff", fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:C.font }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export {exportFmt.toUpperCase()}
            </button>
            <button onClick={()=>fileInputRef.current?.click()} style={{ padding:"6px 10px", borderRadius:"8px", border:`1px solid ${C.border}`, background:C.card, color:C.muted, fontSize:"11px", cursor:"pointer", fontFamily:C.font }}>New</button>
          </div>
        )}
      </div>

      {!image ? (
        /* Upload */
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px" }}>
          <div className="pixel-upload"
            onDragOver={e=>{e.preventDefault();setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
            onClick={()=>fileInputRef.current?.click()}
            style={{ width:"100%", maxWidth:"520px", padding:"64px 40px", border:`2px dashed ${dragOver?"rgba(236,72,153,0.6)":"rgba(255,255,255,0.1)"}`, borderRadius:"24px", background:dragOver?"rgba(236,72,153,0.06)":"rgba(255,255,255,0.02)", cursor:"pointer", textAlign:"center", transition:"all 0.2s" }}>
            <div style={{ width:"72px", height:"72px", borderRadius:"18px", background:"rgba(236,72,153,0.1)", border:"1px solid rgba(236,72,153,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:"28px" }}>✦</div>
            <h3 style={{ fontSize:"22px", fontWeight:"800", color:C.white, margin:"0 0 10px", fontFamily:C.font }}>Drop your image here</h3>
            <p style={{ fontSize:"14px", color:C.muted, margin:"0 0 28px", lineHeight:1.7, fontFamily:C.font }}>Edit, resize for any platform, add text overlays and export in any format. Supports JPG, PNG, WebP, GIF.</p>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"11px 24px", borderRadius:"99px", background:"rgba(236,72,153,0.12)", border:"1px solid rgba(236,72,153,0.3)", color:"#f9a8d4", fontSize:"13px", fontWeight:"700", fontFamily:C.font }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Choose Image
            </div>
            <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap", marginTop:"24px" }}>
              {["Thumbnails","Posters","Banners","Stories","Posts"].map(t=>(
                <span key={t} style={{ fontSize:"10px", padding:"3px 10px", borderRadius:"99px", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.25)", fontFamily:C.font }}>{t}</span>
              ))}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>
        </div>
      ) : (
        /* Editor */
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Left Panel — Tools */}
          <div style={{ width:"220px", flexShrink:0, borderRight:`1px solid ${C.border}`, background:C.panel, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              {TAB_BTNS.map(tb => (
                <button key={tb.id} className="pixel-tab" onClick={()=>setActiveTab(tb.id)}
                  style={{ flex:1, padding:"8px 4px", border:"none", background:activeTab===tb.id?"rgba(124,58,237,0.12)":"transparent", color:activeTab===tb.id?C.purpleLight:C.muted, fontSize:"9px", fontWeight:"700", cursor:"pointer", fontFamily:C.font, display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", transition:"all 0.15s", borderBottom:activeTab===tb.id?`2px solid ${C.purple}`:"2px solid transparent" }}>
                  {tb.icon}
                  {tb.label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div style={{ flex:1, overflowY:"auto", padding:"14px 12px" }}>

              {activeTab === "adjust" && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                    <span style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font }}>Adjustments</span>
                    <button onClick={resetAdj} style={{ fontSize:"10px", color:C.muted, background:"none", border:"none", cursor:"pointer", fontFamily:C.font }}>Reset</button>
                  </div>
                  <Slider label="Brightness" value={adj.brightness} min={0} max={200} unit="%" onChange={v=>setAdj(a=>({...a,brightness:v}))}/>
                  <Slider label="Contrast"   value={adj.contrast}   min={0} max={200} unit="%" onChange={v=>setAdj(a=>({...a,contrast:v}))}/>
                  <Slider label="Saturation" value={adj.saturation} min={0} max={200} unit="%" onChange={v=>setAdj(a=>({...a,saturation:v}))}/>
                  <Slider label="Hue Rotate" value={adj.hue}        min={0} max={360} unit="°" onChange={v=>setAdj(a=>({...a,hue:v}))}/>
                  <Slider label="Blur"       value={adj.blur}       min={0} max={20}  step={0.5} unit="px" onChange={v=>setAdj(a=>({...a,blur:v}))}/>
                  <Slider label="Opacity"    value={adj.opacity}    min={0} max={100} unit="%" onChange={v=>setAdj(a=>({...a,opacity:v}))}/>
                </>
              )}

              {activeTab === "filter" && (
                <>
                  <p style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"12px" }}>Filters</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                    {FILTERS.map(f => (
                      <button key={f.id} className="filter-card" onClick={()=>setFilter(f.id)}
                        style={{ padding:"8px", borderRadius:"8px", border:`1px solid ${filter===f.id?"rgba(124,58,237,0.6)":C.border}`, background:filter===f.id?"rgba(124,58,237,0.12)":C.card, color:filter===f.id?C.purpleLight:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.15s", textAlign:"center" }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "text" && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                    <p style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, margin:0 }}>Text Layers</p>
                    <button onClick={addText} style={{ fontSize:"18px", color:C.purpleLight, background:"none", border:"none", cursor:"pointer", lineHeight:1 }}>+</button>
                  </div>
                  {texts.length === 0 && (
                    <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.2)", textAlign:"center", padding:"20px 0", fontFamily:C.font }}>No text layers yet. Click + to add.</p>
                  )}
                  {texts.map(t => (
                    <div key={t.id} onClick={()=>setSelText(t.id)}
                      style={{ padding:"8px 10px", borderRadius:"8px", border:`1px solid ${selText===t.id?"rgba(124,58,237,0.5)":C.border}`, background:selText===t.id?"rgba(124,58,237,0.08)":C.card, cursor:"pointer", marginBottom:"6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:"12px", color:C.white, fontFamily:C.font, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"130px" }}>{t.text}</span>
                      <button onClick={e=>{e.stopPropagation();deleteText(t.id)}} style={{ background:"none", border:"none", color:"rgba(239,68,68,0.6)", cursor:"pointer", fontSize:"14px" }}>✕</button>
                    </div>
                  ))}
                  {selTextObj && (
                    <div style={{ marginTop:"14px", paddingTop:"14px", borderTop:`1px solid ${C.border}` }}>
                      <p style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"10px" }}>Edit Text</p>
                      <textarea value={selTextObj.text} onChange={e=>updateText(selText,{text:e.target.value})}
                        style={{ width:"100%", padding:"8px", borderRadius:"8px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"12px", fontFamily:C.font, resize:"none", outline:"none", boxSizing:"border-box", marginBottom:"8px" }} rows={2}/>
                      <Slider label="Size"    value={selTextObj.size}    min={8}  max={200} onChange={v=>updateText(selText,{size:v})}/>
                      <Slider label="X Pos"   value={selTextObj.x}      min={0}  max={tw}  onChange={v=>updateText(selText,{x:v})}/>
                      <Slider label="Y Pos"   value={selTextObj.y}      min={0}  max={th}  onChange={v=>updateText(selText,{y:v})}/>
                      <Slider label="Opacity" value={selTextObj.opacity} min={0}  max={100} unit="%" onChange={v=>updateText(selText,{opacity:v})}/>
                      <div style={{ display:"flex", gap:"6px", marginBottom:"10px" }}>
                        <input type="color" value={selTextObj.color} onChange={e=>updateText(selText,{color:e.target.value})}
                          style={{ width:"36px", height:"28px", borderRadius:"6px", border:`1px solid ${C.border}`, background:"none", cursor:"pointer", padding:"2px" }}/>
                        {["left","center","right"].map(a=>(
                          <button key={a} onClick={()=>updateText(selText,{align:a})}
                            style={{ flex:1, padding:"4px", borderRadius:"6px", border:`1px solid ${selTextObj.align===a?"rgba(124,58,237,0.5)":C.border}`, background:selTextObj.align===a?"rgba(124,58,237,0.12)":"transparent", color:selTextObj.align===a?C.purpleLight:C.muted, fontSize:"10px", cursor:"pointer", fontFamily:C.font }}>
                            {a[0].toUpperCase()+a.slice(1)}
                          </button>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <button onClick={()=>updateText(selText,{bold:!selTextObj.bold})}
                          style={{ flex:1, padding:"5px", borderRadius:"6px", border:`1px solid ${selTextObj.bold?"rgba(124,58,237,0.5)":C.border}`, background:selTextObj.bold?"rgba(124,58,237,0.12)":"transparent", color:selTextObj.bold?C.purpleLight:C.muted, fontWeight:"800", fontSize:"12px", cursor:"pointer", fontFamily:C.font }}>B</button>
                        <button onClick={()=>updateText(selText,{italic:!selTextObj.italic})}
                          style={{ flex:1, padding:"5px", borderRadius:"6px", border:`1px solid ${selTextObj.italic?"rgba(124,58,237,0.5)":C.border}`, background:selTextObj.italic?"rgba(124,58,237,0.12)":"transparent", color:selTextObj.italic?C.purpleLight:C.muted, fontStyle:"italic", fontSize:"12px", cursor:"pointer", fontFamily:C.font }}>I</button>
                        <button onClick={()=>updateText(selText,{shadow:!selTextObj.shadow})}
                          style={{ flex:1, padding:"5px", borderRadius:"6px", border:`1px solid ${selTextObj.shadow?"rgba(124,58,237,0.5)":C.border}`, background:selTextObj.shadow?"rgba(124,58,237,0.12)":"transparent", color:selTextObj.shadow?C.purpleLight:C.muted, fontSize:"10px", cursor:"pointer", fontFamily:C.font }}>Shadow</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === "resize" && (
                <>
                  <p style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"12px" }}>Platform Presets</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginBottom:"16px" }}>
                    {PLATFORMS.map(p => (
                      <button key={p.id} className="platform-btn" onClick={()=>setPlatform(p.id)}
                        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:"8px", border:`1px solid ${platform===p.id?"rgba(124,58,237,0.5)":C.border}`, background:platform===p.id?"rgba(124,58,237,0.1)":C.card, cursor:"pointer", transition:"all 0.15s", fontFamily:C.font }}>
                        <span style={{ fontSize:"11px", fontWeight:"600", color:platform===p.id?C.purpleLight:C.muted }}>{p.label}</span>
                        {p.w && <span style={{ fontSize:"9px", color:"rgba(255,255,255,0.2)", fontFamily:C.font }}>{p.w}×{p.h}</span>}
                      </button>
                    ))}
                  </div>
                  {platform === "custom" && (
                    <>
                      <p style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"8px" }}>Custom Size</p>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:"10px", color:C.muted, margin:"0 0 4px", fontFamily:C.font }}>Width</p>
                          <input type="number" value={customW} onChange={e=>setCustomW(Number(e.target.value))} min={1} max={8000}
                            style={{ width:"100%", padding:"6px 8px", borderRadius:"7px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"12px", fontFamily:C.font, outline:"none", boxSizing:"border-box" }}/>
                        </div>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:"10px", color:C.muted, margin:"0 0 4px", fontFamily:C.font }}>Height</p>
                          <input type="number" value={customH} onChange={e=>setCustomH(Number(e.target.value))} min={1} max={8000}
                            style={{ width:"100%", padding:"6px 8px", borderRadius:"7px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"12px", fontFamily:C.font, outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === "export" && (
                <>
                  <p style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"12px" }}>Export Settings</p>
                  <p style={{ fontSize:"10px", color:C.muted, margin:"0 0 6px", fontFamily:C.font }}>Format</p>
                  <div style={{ display:"flex", gap:"5px", marginBottom:"16px" }}>
                    {["png","jpg","webp"].map(f => (
                      <button key={f} onClick={()=>setExportFmt(f)}
                        style={{ flex:1, padding:"7px", borderRadius:"7px", border:`1px solid ${exportFmt===f?"rgba(124,58,237,0.5)":C.border}`, background:exportFmt===f?"rgba(124,58,237,0.12)":C.card, color:exportFmt===f?C.purpleLight:C.muted, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:C.font, textTransform:"uppercase" }}>
                        {f}
                      </button>
                    ))}
                  </div>
                  {exportFmt !== "png" && (
                    <Slider label="Quality" value={exportQ} min={10} max={100} unit="%" onChange={setExportQ}/>
                  )}
                  <div style={{ padding:"12px", borderRadius:"10px", background:"rgba(124,58,237,0.06)", border:`1px solid rgba(124,58,237,0.15)`, marginBottom:"12px" }}>
                    <p style={{ fontSize:"11px", color:C.muted, margin:"0 0 4px", fontFamily:C.font }}>Output Size</p>
                    <p style={{ fontSize:"14px", fontWeight:"700", color:C.white, margin:0, fontFamily:C.font }}>{tw} × {th} px</p>
                  </div>
                  <button onClick={exportImage}
                    style={{ width:"100%", padding:"10px", borderRadius:"99px", border:"none", background:"linear-gradient(135deg,#7c3aed,#9b5cf6)", color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:C.font }}>
                    Download {exportFmt.toUpperCase()}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Canvas area */}
          <div style={{ flex:1, background:"#2d2d2d", overflow:"auto", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative" }}>
            {/* Zoom controls */}
            <div style={{ position:"absolute", bottom:"16px", right:"16px", display:"flex", gap:"6px", zIndex:10 }}>
              <button onClick={()=>setZoom(z=>Math.max(0.1,z-0.1))} style={{ width:"28px", height:"28px", borderRadius:"7px", border:`1px solid ${C.border}`, background:"rgba(10,8,20,0.9)", color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button onClick={()=>setZoom(1)} style={{ padding:"0 8px", height:"28px", borderRadius:"7px", border:`1px solid ${C.border}`, background:"rgba(10,8,20,0.9)", color:C.muted, fontSize:"10px", cursor:"pointer", fontFamily:C.font }}>
                {Math.round(zoom*100)}%
              </button>
              <button onClick={()=>setZoom(z=>Math.min(3,z+0.1))} style={{ width:"28px", height:"28px", borderRadius:"7px", border:`1px solid ${C.border}`, background:"rgba(10,8,20,0.9)", color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>

            {/* Checkerboard bg for transparency */}
            <div style={{ transform:`scale(${zoom})`, transformOrigin:"center center", boxShadow:"0 8px 48px rgba(0,0,0,0.8)", position:"relative" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(45deg,#3a3a3a 25%,transparent 25%),linear-gradient(-45deg,#3a3a3a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a3a3a 75%),linear-gradient(-45deg,transparent 75%,#3a3a3a 75%)", backgroundSize:"16px 16px", backgroundPosition:"0 0,0 8px,8px -8px,-8px 0px", borderRadius:"2px" }}/>
              <canvas ref={canvasRef} style={{ display:"block", position:"relative", maxWidth:"100%" }}/>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>
    </div>
  );
}
