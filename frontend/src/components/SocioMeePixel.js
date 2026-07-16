import { useState, useRef, useEffect, useCallback } from "react";

const FONT = "'DM Sans','Syne',sans-serif";
const FONT_HEAD = "'Poppins',sans-serif";
const C = {
  bg: "#080810",
  border: "rgba(255,255,255,0.07)",
  card: "rgba(255,255,255,0.04)",
  muted: "rgba(255,255,255,0.35)",
  dim: "rgba(255,255,255,0.18)",
  white: "#fff",
};

const PLATFORMS = [
  { id:"custom",    label:"Custom",       w:null, h:null },
  { id:"yt-thumb",  label:"YT Thumbnail", w:1280, h:720  },
  { id:"ig-square", label:"IG Square",    w:1080, h:1080 },
  { id:"ig-story",  label:"IG Story",     w:1080, h:1920 },
  { id:"ig-post",   label:"IG Portrait",  w:1080, h:1350 },
  { id:"twitter",   label:"X Post",       w:1200, h:675  },
  { id:"linkedin",  label:"LinkedIn",     w:1200, h:627  },
  { id:"pinterest", label:"Pinterest",    w:1000, h:1500 },
  { id:"facebook",  label:"Facebook",     w:1200, h:630  },
];

const DEFAULT_ADJ = { brightness:100, contrast:100, saturation:100, blur:0, opacity:100, hue:0 };

const FILTERS = [
  { id:"none",   label:"Original", css:"" },
  { id:"vivid",  label:"Vivid",    css:"saturate(1.6) contrast(1.1)" },
  { id:"matte",  label:"Matte",    css:"contrast(0.85) saturate(0.8) brightness(1.05)" },
  { id:"noir",   label:"Noir",     css:"grayscale(1) contrast(1.2)" },
  { id:"warm",   label:"Warm",     css:"sepia(0.4) saturate(1.3) brightness(1.05)" },
  { id:"cool",   label:"Cool",     css:"hue-rotate(200deg) saturate(0.9)" },
  { id:"fade",   label:"Fade",     css:"brightness(1.1) contrast(0.85) saturate(0.7)" },
  { id:"punch",  label:"Punch",    css:"contrast(1.3) saturate(1.4)" },
];

const TABS = [
  { id:"adjust",  label:"Adjust",  icon:"M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" },
  { id:"filter",  label:"Filters", icon:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" },
  { id:"text",    label:"Text",    icon:"M4 7V4h16v3M9 20h6M12 4v16" },
  { id:"resize",  label:"Resize",  icon:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" },
  { id:"export",  label:"Export",  icon:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" },
];

function SvgIcon({ d, size=14, stroke=1.8 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d.split("M").filter(Boolean).map((p,i)=><path key={i} d={"M"+p}/>)}</svg>;
}

function Slider({ label, value, min, max, step=1, unit="", onChange }) {
  return (
    <div style={{ marginBottom:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
        <span style={{ fontSize:"11px", color:C.muted, fontFamily:FONT }}>{label}</span>
        <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.7)", fontFamily:FONT, fontWeight:"600" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{ width:"100%", cursor:"pointer", height:"3px" }}/>
    </div>
  );
}

export default function SocioMeePixel({ user }) {
  const rawPlan = user?.plan || user?.plan_label || user?.subscription || "free";
  const plan = rawPlan.toLowerCase().includes("premium") ? "premium" : rawPlan.toLowerCase().includes("pro") ? "pro" : "free";
  const isPremium = plan === "premium";
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [adj, setAdj] = useState(DEFAULT_ADJ);
  const [filter, setFilter] = useState("none");
  const [platform, setPlatform] = useState("custom");
  const [customW, setCustomW] = useState(1280);
  const [customH, setCustomH] = useState(720);
  const [texts, setTexts] = useState([]);
  const [selText, setSelText] = useState(null);
  const [activeTab, setActiveTab] = useState("adjust");
  const [dragOver, setDragOver] = useState(false);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [exportFmt, setExportFmt] = useState("png");
  const [exportQ, setExportQ] = useState(90);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imgRef = useRef(new Image());

  const buildFilter = useCallback(() => {
    const f = FILTERS.find(f=>f.id===filter)?.css||"";
    return `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) blur(${adj.blur}px) hue-rotate(${adj.hue}deg) opacity(${adj.opacity}%) ${f}`.trim();
  }, [adj, filter]);

  const plat = PLATFORMS.find(p=>p.id===platform);
  const tw = plat?.w||customW;
  const th = plat?.h||customH;

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;
    const draw = () => {
      ctx.clearRect(0,0,tw,th);
      ctx.filter = buildFilter();
      const scale = Math.min(tw/img.naturalWidth, th/img.naturalHeight);
      const w = img.naturalWidth*scale, h = img.naturalHeight*scale;
      const x = (tw-w)/2, y = (th-h)/2;
      ctx.drawImage(img, x, y, w, h);
      ctx.filter = "none";
      texts.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.opacity/100;
        ctx.fillStyle = t.color;
        ctx.font = `${t.italic?"italic ":""}${t.bold?"bold ":""} ${t.size}px ${t.font}`;
        ctx.textAlign = t.align;
        if (t.shadow) { ctx.shadowColor="rgba(0,0,0,0.8)"; ctx.shadowBlur=8; }
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });
    };
    if (img.complete && img.src && img.src.includes(image.substring(0,30))) {
      canvas.width = tw; canvas.height = th;
      draw();
    } else {
      img.onload = () => { canvas.width = tw; canvas.height = th; draw(); };
      img.src = image;
    }
  }, [image, adj, filter, tw, th, texts, buildFilter]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => { setImage(e.target.result); setAdj(DEFAULT_ADJ); setFilter("none"); setTexts([]); setSelText(null); };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    const t = { id:Date.now(), text:"Your Text Here", x:tw/2, y:th/2, size:48, color:"#ffffff", font:"Poppins, sans-serif", bold:true, italic:false, align:"center", opacity:100, shadow:true };
    setTexts(prev=>[...prev,t]); setSelText(t.id); setActiveTab("text");
  };

  const updateText = (id, fields) => setTexts(prev=>prev.map(t=>t.id===id?{...t,...fields}:t));
  const deleteText = (id) => { setTexts(prev=>prev.filter(t=>t.id!==id)); setSelText(null); };

  const removeBg = async () => {
    if (!image) return;
    if (!isPremium) { alert("Remove Background is a Pro+ feature. Upgrade to Pro+ to use it."); return; }
    setBgRemoving(true);
    try {
      const res = await fetch("https://sociomeeai.com/api/removebg", { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include", body:JSON.stringify({image}) });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(res.status + ": " + errText);
      }
      const data = await res.json();
      setImage(data.image);
    } catch(err) { alert("Background removal failed: " + (err?.message || "unknown error. Please try again.")); }
    finally { setBgRemoving(false); }
  };

  const exportImage = () => {
    if (!canvasRef.current) return;
    const mime = exportFmt==="jpg"?"image/jpeg":exportFmt==="webp"?"image/webp":"image/png";
    const q = exportFmt==="png"?1:exportQ/100;
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL(mime, q);
    a.download = `${fileName.replace(/\.[^.]+$/,"")}_pixel.${exportFmt}`;
    a.click();
  };

  const selTextObj = texts.find(t=>t.id===selText);

  const panelStyle = { width:"260px", flexShrink:0, borderLeft:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)", backdropFilter:"blur(20px)", display:"flex", flexDirection:"column", overflow:"hidden" };

  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 600); }, []);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"32px 24px", fontFamily:FONT, background:C.bg }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"20px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"24px", padding:"52px 44px", maxWidth:"420px", width:"100%" }}>
        <div style={{ width:"68px", height:"68px", borderRadius:"20px", background:"rgba(255,255,255,0.06)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", alignItems:"center" }}>
          <div style={{ width:"60%", height:"16px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
          <div style={{ width:"80%", height:"12px", borderRadius:"6px", background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
          <div style={{ width:"70%", height:"12px", borderRadius:"6px", background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
        </div>
        <div style={{ width:"160px", height:"42px", borderRadius:"12px", background:"rgba(255,255,255,0.06)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
      </div>
    </div>
  );

  if (!image) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"32px 24px", fontFamily:FONT, background:C.bg }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        input[type=range]{-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.08);border-radius:99px;height:3px;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;cursor:pointer;border:2px solid rgba(255,255,255,0.3);}
      `}</style>
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px", textAlign:"center", background:"rgba(255,255,255,0.03)", border:`1px solid ${dragOver?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`, borderRadius:"20px", padding:"40px 32px", maxWidth:"360px", width:"100%", backdropFilter:"blur(24px)", transition:"all 0.2s", cursor:"pointer" }}
        onClick={()=>fileInputRef.current?.click()}>
        <div style={{ width:"68px", height:"68px", borderRadius:"20px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C12 2 11.5 7.5 9 9C9 9 4 10.5 2 12C2 12 7 13.5 9 15C9 15 11.5 20.5 12 22C12 22 12.5 16.5 15 15C15 15 20 13.5 22 12C22 12 17 10.5 15 9C15 9 12.5 3.5 12 2Z" fill="currentColor" stroke="none"/></svg>
        </div>
        <div>
          <h3 style={{ fontSize:"22px", fontWeight:"700", color:"#fff", margin:"0 0 10px", fontFamily:FONT_HEAD }}>Drop your image here</h3>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:1.8, margin:0 }}>Edit, resize for any platform, add text overlays and export. Supports JPG, PNG, WebP, GIF.</p>
        </div>
        <button onClick={e=>{e.stopPropagation();fileInputRef.current?.click();}}
          style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 28px", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.85)", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Choose Image
        </button>

      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:C.bg, fontFamily:FONT, overflow:"hidden" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        input[type=range]{-webkit-appearance:none;appearance:none;background:rgba(255,255,255,0.08);border-radius:99px;height:3px;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;cursor:pointer;border:2px solid rgba(255,255,255,0.2);}
        .px-tab:hover{background:rgba(255,255,255,0.06)!important;color:rgba(255,255,255,0.8)!important;}
        .px-btn:hover{background:rgba(255,255,255,0.08)!important;border-color:rgba(255,255,255,0.15)!important;color:#fff!important;}
        .px-filter:hover{border-color:rgba(255,255,255,0.2)!important;background:rgba(255,255,255,0.06)!important;}
        .px-platform:hover{background:rgba(255,255,255,0.06)!important;border-color:rgba(255,255,255,0.12)!important;}
        ::-webkit-scrollbar{width:2px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:99px}
        @media(max-width:768px){.px-editor-main{flex-direction:column!important;}.px-side{display:none!important;}.px-mobile-tabs{display:flex!important;}.px-mobile-panel{display:flex!important;}}
      `}</style>

      {/* Header */}
      <div style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"rgba(255,255,255,0.01)", backdropFilter:"blur(10px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C12 2 11.5 7.5 9 9C9 9 4 10.5 2 12C2 12 7 13.5 9 15C9 15 11.5 20.5 12 22C12 22 12.5 16.5 15 15C15 15 20 13.5 22 12C22 12 17 10.5 15 9C15 9 12.5 3.5 12 2Z" fill="currentColor" stroke="none"/></svg>
          <span style={{ fontSize:"13px", fontWeight:"600", color:C.white, fontFamily:FONT }}>SocioMee Pixel</span>
          {fileName && <span style={{ fontSize:"10px", color:C.muted, fontFamily:FONT }}>{fileName} · {tw}×{th}</span>}
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          <button onClick={addText} className="px-btn" style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Text
          </button>
          <button onClick={removeBg} disabled={bgRemoving} className="px-btn" style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}>
            {bgRemoving?<div style={{ width:"10px",height:"10px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite" }}/>:"✦"} Remove BG
          </button>
          <button onClick={exportImage} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"#fff", fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export {exportFmt.toUpperCase()}
          </button>
          <button onClick={()=>{setImage(null);setFileName("");}} className="px-btn" style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"11px", cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}>New</button>
        </div>
      </div>

      {/* Editor */}
      <div className="px-editor-main" style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* Left tabs - desktop */}
        <div className="px-side" style={{ width:"52px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)", display:"flex", flexDirection:"column", alignItems:"center", paddingTop:"8px", gap:"2px" }}>
          {TABS.map(tab=>(
            <button key={tab.id} className="px-tab" onClick={()=>setActiveTab(tab.id)}
              style={{ width:"40px", height:"40px", borderRadius:"10px", border:"none", background:activeTab===tab.id?"rgba(255,255,255,0.1)":"transparent", color:activeTab===tab.id?"#fff":C.muted, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"3px", transition:"all 0.15s", padding:0 }}
              title={tab.label}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {tab.id==="adjust" && <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>}
                {tab.id==="filter" && <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>}
                {tab.id==="text" && <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>}
                {tab.id==="resize" && <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></>}
                {tab.id==="export" && <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}
              </svg>
              <span style={{ fontSize:"8px", fontFamily:FONT, fontWeight:"600" }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflow:"auto", padding:"20px", position:"relative", background:"rgba(0,0,0,0.3)" }}
          onDragOver={e=>{e.preventDefault();setDragOver(true)}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}>
          <div style={{ position:"relative", boxShadow:"0 24px 80px rgba(0,0,0,0.6)", borderRadius:"4px", overflow:"hidden" }}>
            <canvas ref={canvasRef} style={{ display:"block", maxWidth:"100%", maxHeight:"calc(100vh - 160px)", transform:`scale(${zoom})`, transformOrigin:"top center", imageRendering:"pixelated" }}/>
          </div>
          <div style={{ position:"absolute", bottom:"12px", right:"12px", display:"flex", gap:"4px" }}>
            {[0.5,0.75,1,1.25,1.5].map(z=>(
              <button key={z} onClick={()=>setZoom(z)} style={{ padding:"4px 8px", borderRadius:"6px", border:`1px solid ${zoom===z?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`, background:zoom===z?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)", color:zoom===z?"#fff":C.muted, fontSize:"10px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>
                {z===1?"100%":z*100+"%"}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={panelStyle}>
          <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
            <span style={{ fontSize:"11px", fontWeight:"600", color:C.muted, fontFamily:FONT, textTransform:"uppercase", letterSpacing:"1px" }}>{TABS.find(t=>t.id===activeTab)?.label}</span>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
            {activeTab==="adjust" && <>
              <button onClick={()=>setAdj(DEFAULT_ADJ)} style={{ fontSize:"10px", color:C.muted, background:"transparent", border:"none", cursor:"pointer", fontFamily:FONT, marginBottom:"12px", padding:0 }}>Reset all</button>
              <Slider label="Brightness" value={adj.brightness} min={0} max={200} unit="%" onChange={v=>setAdj(p=>({...p,brightness:v}))}/>
              <Slider label="Contrast"   value={adj.contrast}   min={0} max={200} unit="%" onChange={v=>setAdj(p=>({...p,contrast:v}))}/>
              <Slider label="Saturation" value={adj.saturation} min={0} max={200} unit="%" onChange={v=>setAdj(p=>({...p,saturation:v}))}/>
              <Slider label="Hue Rotate" value={adj.hue}        min={0} max={360} unit="°" onChange={v=>setAdj(p=>({...p,hue:v}))}/>
              <Slider label="Blur"       value={adj.blur}       min={0} max={20}  unit="px" onChange={v=>setAdj(p=>({...p,blur:v}))}/>
              <Slider label="Opacity"    value={adj.opacity}    min={0} max={100} unit="%" onChange={v=>setAdj(p=>({...p,opacity:v}))}/>
            </>}
            {activeTab==="filter" && <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
              {FILTERS.map(f=>(
                <button key={f.id} className="px-filter" onClick={()=>setFilter(f.id)}
                  style={{ padding:"10px 8px", borderRadius:"10px", border:`1px solid ${filter===f.id?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`, background:filter===f.id?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)", cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
                  <div style={{ height:"32px", borderRadius:"6px", background:"rgba(255,255,255,0.05)", marginBottom:"6px", overflow:"hidden" }}>
                    {image && <img src={image} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter:f.css }}/>}
                  </div>
                  <span style={{ fontSize:"10px", fontWeight:"600", color:filter===f.id?"#fff":C.muted, fontFamily:FONT }}>{f.label}</span>
                </button>
              ))}
            </div>}
            {activeTab==="text" && <>
              <button onClick={addText} style={{ width:"100%", padding:"9px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.8)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, marginBottom:"14px" }}>+ Add Text Layer</button>
              {texts.length === 0 && <p style={{ fontSize:"12px", color:C.dim, fontFamily:FONT, textAlign:"center", padding:"20px 0" }}>No text layers yet.</p>}
              {texts.map(t=>(
                <div key={t.id} onClick={()=>setSelText(t.id)}
                  style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${selText===t.id?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`, background:selText===t.id?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)", cursor:"pointer", marginBottom:"6px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:"12px", color:C.white, fontFamily:FONT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{t.text}</span>
                    <button onClick={e=>{e.stopPropagation();deleteText(t.id);}} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:"12px" }}>✕</button>
                  </div>
                </div>
              ))}
              {selTextObj && <>
                <div style={{ height:"1px", background:"rgba(255,255,255,0.06)", margin:"12px 0" }}/>
                <textarea value={selTextObj.text} onChange={e=>updateText(selText,{text:e.target.value})} rows={2}
                  style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px", padding:"8px", color:C.white, fontSize:"12px", fontFamily:FONT, resize:"none", outline:"none", boxSizing:"border-box", marginBottom:"12px" }}/>
                <Slider label="Font Size" value={selTextObj.size} min={12} max={200} onChange={v=>updateText(selText,{size:v})}/>
                <Slider label="Opacity"   value={selTextObj.opacity} min={0} max={100} unit="%" onChange={v=>updateText(selText,{opacity:v})}/>
                <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
                  {["left","center","right"].map(a=>(
                    <button key={a} onClick={()=>updateText(selText,{align:a})}
                      style={{ flex:1, padding:"6px", borderRadius:"7px", border:`1px solid ${selTextObj.align===a?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`, background:selTextObj.align===a?"rgba(255,255,255,0.08)":"transparent", color:selTextObj.align===a?"#fff":C.muted, fontSize:"10px", cursor:"pointer", fontFamily:FONT }}>
                      {a}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  <button onClick={()=>updateText(selText,{bold:!selTextObj.bold})} style={{ flex:1, padding:"6px", borderRadius:"7px", border:`1px solid ${selTextObj.bold?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`, background:selTextObj.bold?"rgba(255,255,255,0.08)":"transparent", color:selTextObj.bold?"#fff":C.muted, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>B</button>
                  <button onClick={()=>updateText(selText,{italic:!selTextObj.italic})} style={{ flex:1, padding:"6px", borderRadius:"7px", border:`1px solid ${selTextObj.italic?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`, background:selTextObj.italic?"rgba(255,255,255,0.08)":"transparent", color:selTextObj.italic?"#fff":C.muted, fontSize:"11px", fontStyle:"italic", cursor:"pointer", fontFamily:FONT }}>I</button>
                  <button onClick={()=>updateText(selText,{shadow:!selTextObj.shadow})} style={{ flex:1, padding:"6px", borderRadius:"7px", border:`1px solid ${selTextObj.shadow?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`, background:selTextObj.shadow?"rgba(255,255,255,0.08)":"transparent", color:selTextObj.shadow?"#fff":C.muted, fontSize:"10px", cursor:"pointer", fontFamily:FONT }}>Shadow</button>
                </div>
              </>}
            </>}
            {activeTab==="resize" && <>
              <p style={{ fontSize:"11px", fontWeight:"600", color:C.muted, fontFamily:FONT, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>Presets</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginBottom:"16px" }}>
                {PLATFORMS.map(p=>(
                  <button key={p.id} className="px-platform" onClick={()=>setPlatform(p.id)}
                    style={{ padding:"8px 12px", borderRadius:"9px", border:`1px solid ${platform===p.id?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)"}`, background:platform===p.id?"rgba(255,255,255,0.07)":"transparent", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s" }}>
                    <span style={{ fontSize:"12px", fontWeight:"500", color:platform===p.id?"#fff":C.muted, fontFamily:FONT }}>{p.label}</span>
                    {p.w && <span style={{ fontSize:"10px", color:C.dim, fontFamily:FONT }}>{p.w}×{p.h}</span>}
                  </button>
                ))}
              </div>
              {platform==="custom" && <div style={{ display:"flex", gap:"8px" }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:"10px", color:C.muted, fontFamily:FONT, marginBottom:"4px" }}>Width</p>
                  <input type="number" value={customW} onChange={e=>setCustomW(Number(e.target.value))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px", padding:"7px 10px", color:C.white, fontSize:"12px", fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:"10px", color:C.muted, fontFamily:FONT, marginBottom:"4px" }}>Height</p>
                  <input type="number" value={customH} onChange={e=>setCustomH(Number(e.target.value))} style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px", padding:"7px 10px", color:C.white, fontSize:"12px", fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
                </div>
              </div>}
            </>}
            {activeTab==="export" && <>
              <p style={{ fontSize:"11px", fontWeight:"600", color:C.muted, fontFamily:FONT, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>Format</p>
              <div style={{ display:"flex", gap:"6px", marginBottom:"16px" }}>
                {["png","jpg","webp"].map(f=>(
                  <button key={f} onClick={()=>setExportFmt(f)} style={{ flex:1, padding:"8px", borderRadius:"9px", border:`1px solid ${exportFmt===f?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`, background:exportFmt===f?"rgba(255,255,255,0.08)":"transparent", color:exportFmt===f?"#fff":C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              {exportFmt!=="png" && <Slider label="Quality" value={exportQ} min={10} max={100} unit="%" onChange={setExportQ}/>}
              <button onClick={exportImage} style={{ width:"100%", padding:"11px", borderRadius:"11px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export {exportFmt.toUpperCase()}
              </button>
            </>}
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="px-mobile-tabs" style={{ display:"none", borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)", backdropFilter:"blur(20px)" }}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{ flex:1, padding:"10px 4px 8px", border:"none", background:"transparent", color:activeTab===tab.id?"#fff":C.muted, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", borderTop:`2px solid ${activeTab===tab.id?"rgba(255,255,255,0.6)":"transparent"}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {tab.id==="adjust" && <><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>}
              {tab.id==="filter" && <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>}
              {tab.id==="text" && <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>}
              {tab.id==="resize" && <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></>}
              {tab.id==="export" && <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}
            </svg>
            <span style={{ fontSize:"9px", fontFamily:FONT, fontWeight:"600" }}>{tab.label}</span>
          </button>
        ))}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>
    </div>
  );
}
