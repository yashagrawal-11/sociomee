import { useState, useRef, useEffect, useCallback } from "react";

const C = {
  bg: "#0a0a0a",
  sidebar: "rgba(6,4,15,0.97)",
  border: "rgba(255,255,255,0.07)",
  purple: "#7c3aed",
  purpleLight: "rgba(255,255,255,0.7)",
  muted: "rgba(255,255,255,0.35)",
  white: "#fff",
  font: "Poppins, sans-serif",
};

function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px", padding:"60px 20px" }}>
      <div style={{ width:"36px", height:"36px", borderRadius:"50%", border:"3px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.8s linear infinite" }}/>
      <p style={{ fontSize:"13px", color:C.muted, fontFamily:C.font, margin:0 }}>{text}</p>
    </div>
  );
}

function AISummaryPanel({ summary, keyPoints, onClose, onSendToGenerator }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:"600px", maxHeight:"85vh", background:"rgba(10,8,20,0.98)", border:"1px solid rgba(124,58,237,0.25)", borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(124,58,237,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:C.font }}>AI Analysis</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:C.muted, width:"28px", height:"28px", borderRadius:"8px", cursor:"pointer", fontSize:"16px" }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
          {summary && (
            <div style={{ marginBottom:"20px" }}>
              <p style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1.5px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"10px" }}>Summary</p>
              <div style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.15)", borderRadius:"12px", padding:"16px" }}>
                <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.8)", lineHeight:1.8, fontFamily:C.font, margin:0 }}>{summary}</p>
              </div>
            </div>
          )}
          {keyPoints?.length > 0 && (
            <div>
              <p style={{ fontSize:"10px", fontWeight:"700", color:C.purpleLight, letterSpacing:"1.5px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"10px" }}>Key Points</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {keyPoints.map((pt, i) => (
                  <div key={i} style={{ display:"flex", gap:"10px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"10px", padding:"12px 14px" }}>
                    <span style={{ fontSize:"11px", fontWeight:"800", color:C.purpleLight, fontFamily:C.font, flexShrink:0 }}>{String(i+1).padStart(2,"0")}</span>
                    <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.75)", lineHeight:1.6, fontFamily:C.font, margin:0 }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"8px" }}>
          <button onClick={() => { navigator.clipboard?.writeText(`${summary}\n\n${keyPoints?.join("\n")}`); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
            style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>
            {copied ? "Copied!" : "Copy"}
          </button>
          {onSendToGenerator && (
            <button onClick={() => { onSendToGenerator(summary); onClose(); }}
              style={{ flex:1, padding:"9px", borderRadius:"99px", border:"none", background:"linear-gradient(135deg,#7c3aed,#9b5cf6)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:C.font }}>
              ✦ Generate Content
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SocioMeePDF({ onSendToGenerator, user }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileObj, setFileObj] = useState(null);
  const [thumbs, setThumbs] = useState([]);
  const [thumbsLoading, setThumbsLoading] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const renderTaskRef = useRef(null);
  const thumbCanvasRef = useRef(document.createElement("canvas"));

  useEffect(() => {
    if (window.pdfjsLib) return;
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    };
    document.head.appendChild(script);
  }, []);

  const renderPage = useCallback(async (doc, pageNum, s) => {
    if (!canvasRef.current || !doc) return;
    if (renderTaskRef.current) renderTaskRef.current.cancel();
    setRendering(true);
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: s });
      const canvas = canvasRef.current;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch(e) { if (e?.name !== "RenderingCancelledException") console.error(e); }
    finally { setRendering(false); }
  }, []);

  const generateThumbs = useCallback(async (doc) => {
    setThumbsLoading(true);
    const tc = thumbCanvasRef.current;
    const results = [];
    const total = Math.min(doc.numPages, 30);
    for (let i = 1; i <= total; i++) {
      try {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 0.2 });
        tc.width = vp.width; tc.height = vp.height;
        await page.render({ canvasContext: tc.getContext("2d"), viewport: vp }).promise;
        results.push({ page: i, dataUrl: tc.toDataURL() });
      } catch(e) { results.push({ page: i, dataUrl: null }); }
    }
    setThumbs(results);
    setThumbsLoading(false);
  }, []);

  useEffect(() => { if (pdfDoc) renderPage(pdfDoc, currentPage, scale); }, [pdfDoc, currentPage, scale, renderPage]);

  const loadPDF = async (file) => {
    if (!window.pdfjsLib) { alert("PDF viewer loading, try again in a moment."); return; }
    setLoading(true);
    setFileName(file.name);
    setFileObj(file);
    setCurrentPage(1);
    setAiResult(null);
    setExtractedText("");
    setThumbs([]);
    try {
      const ab = await file.arrayBuffer();
      const doc = await window.pdfjsLib.getDocument({ data: ab }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      generateThumbs(doc);
      let text = "";
      for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
        const pg = await doc.getPage(i);
        const ct = await pg.getTextContent();
        text += ct.items.map(it=>it.str).join(" ") + "\n";
      }
      setExtractedText(text);
    } catch(e) { console.error(e); alert("Could not load PDF."); }
    finally { setLoading(false); }
  };

  const handleFile = (file) => {
    if (!file || file.type !== "application/pdf") { alert("Please upload a PDF file."); return; }
    if (file.size > 50*1024*1024) { alert("File too large. Max 50MB."); return; }
    loadPDF(file);
  };

  const analyzeWithAI = async (mode) => {
    if (!extractedText) return;
    setAiLoading(true);
    try {
      const docSnippet = extractedText.slice(0, 2500);
      const prompt = mode === "summary"
        ? `Summarize this document in 3-4 sentences and list 5 key points. Return ONLY valid JSON with no extra text: {"summary":"your summary here","keyPoints":["point1","point2","point3","point4","point5"]}. Document: ${docSnippet}`
        : `You are reviewing a brand deal contract for a content creator. Find payment terms, deliverables, deadlines, exclusivity and red flags. Return ONLY valid JSON: {"summary":"overview paragraph","keyPoints":["finding1","finding2","finding3","finding4","finding5"]}. Contract: ${docSnippet}`;

      const token = localStorage.getItem("sociomee_token");
      const res = await fetch("https://sociomeeai.com/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || data.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
      const clean = text.replace(/```json|```/g,"").trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setAiResult(JSON.parse(jsonMatch[0]));
      } else {
        setAiResult({ summary: text.slice(0, 500), keyPoints: [] });
      }
    } catch(e) {
      console.error(e);
      setAiResult({ summary: "Could not analyze. Please try again.", keyPoints: [] });
    }
    finally { setAiLoading(false); }
  };

  const downloadPDF = () => {
    if (!fileObj) return;
    const url = URL.createObjectURL(fileObj);
    const a = document.createElement("a"); a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  const sharePDF = async () => {
    if (navigator.share && fileObj) {
      try { await navigator.share({ files:[fileObj], title:fileName }); return; } catch(e) {}
    }
    navigator.clipboard?.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  const changeZoom = (d) => setScale(s => Math.min(3, Math.max(0.5, parseFloat((s+d).toFixed(1)))));

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:C.bg, fontFamily:C.font, overflow:"hidden" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .pdf-btn:hover{background:rgba(124,58,237,0.18)!important;border-color:rgba(124,58,237,0.4)!important;color:#a78bfa!important;}
        .pdf-nav:hover{background:rgba(255,255,255,0.1)!important;}
        .pdf-thumb:hover{border-color:rgba(124,58,237,0.5)!important;transform:scale(1.03);}
        .pdf-upload:hover{border-color:rgba(124,58,237,0.5)!important;background:rgba(124,58,237,0.06)!important;}
      `}</style>

      {/* Top Header */}
      <div style={{ padding:"10px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"rgba(255,255,255,0.01)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"9px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(124,58,237,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <h2 style={{ fontSize:"13px", fontWeight:"800", color:C.white, margin:0, fontFamily:C.font }}>SocioMee PDF</h2>
            {fileName && <p style={{ fontSize:"10px", color:C.muted, margin:0, fontFamily:C.font, maxWidth:"200px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fileName}</p>}
          </div>
        </div>

        {pdfDoc && (
          <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
            <button onClick={()=>analyzeWithAI("summary")} disabled={aiLoading} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              {aiLoading ? <div style={{ width:"10px", height:"10px", borderRadius:"50%", border:"2px solid rgba(124,58,237,0.3)", borderTopColor:"#7c3aed", animation:"spin 0.8s linear infinite" }}/> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
              {aiLoading ? "Analyzing..." : "Summarize"}
            </button>
            <button onClick={()=>analyzeWithAI("contract")} disabled={aiLoading} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Review Deal
            </button>
            <div style={{ width:"1px", height:"18px", background:C.border }}/>
            <button onClick={sharePDF} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            <button onClick={downloadPDF} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
            <button onClick={()=>{setPdfDoc(null);setFileName("");setThumbs([]);setCurrentPage(1);}}
              style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.3)", fontSize:"11px", cursor:"pointer", fontFamily:C.font }}>
              New
            </button>
          </div>
        )}
      </div>

      {!pdfDoc ? (
        /* Upload Zone — centered */
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
          <div className="pdf-upload"
            onDragOver={e=>{e.preventDefault();setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
            onClick={()=>fileInputRef.current?.click()}
            style={{ width:"100%", maxWidth:"500px", padding:"64px 40px", border:`2px dashed ${dragOver?"rgba(124,58,237,0.6)":"rgba(255,255,255,0.1)"}`, borderRadius:"24px", background:dragOver?"rgba(124,58,237,0.08)":"rgba(255,255,255,0.02)", cursor:"pointer", textAlign:"center", transition:"all 0.2s ease" }}>
            {loading ? <LoadingSpinner text="Loading PDF..."/> : (
              <>
                <div style={{ width:"72px", height:"72px", borderRadius:"18px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(124,58,237,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <h3 style={{ fontSize:"22px", fontWeight:"800", color:C.white, margin:"0 0 10px", fontFamily:C.font }}>Drop your PDF here</h3>
                <p style={{ fontSize:"14px", color:C.muted, margin:"0 0 28px", lineHeight:1.7, fontFamily:C.font }}>Upload brand deals, contracts, media kits or press releases. AI will read it and tell you what matters.</p>
                <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"11px 24px", borderRadius:"99px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(124,58,237,0.35)", color:"rgba(255,255,255,0.7)", fontSize:"13px", fontWeight:"700", fontFamily:C.font }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Choose PDF file
                </div>
                <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.18)", margin:"20px 0 0", fontFamily:C.font }}>Max 50MB. Your file never leaves your browser.</p>

              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>
        </div>
      ) : (
        /* PDF Viewer with thumbnail sidebar */
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Thumbnail Sidebar */}
          <div style={{ width:"130px", flexShrink:0, borderRight:`1px solid ${C.border}`, background:"#1c1c1c", overflowY:"auto", padding:"12px 8px", display:"flex", flexDirection:"column", gap:"10px" }}>
            <p style={{ fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.35)", letterSpacing:"1.5px", textTransform:"uppercase", fontFamily:C.font, margin:"0 0 8px", textAlign:"center" }}>Pages</p>
            {thumbsLoading && thumbs.length === 0 && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"20px 0" }}>
                <div style={{ width:"16px", height:"16px", borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.8s linear infinite" }}/>
              </div>
            )}
            {thumbs.map(t => (
              <div key={t.page} className="pdf-thumb" onClick={()=>setCurrentPage(t.page)}
                style={{ cursor:"pointer", borderRadius:"6px", overflow:"hidden", border:`1.5px solid ${currentPage===t.page?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.12)"}`, background:"#2a2a2a", transition:"all 0.15s", position:"relative", aspectRatio:"3/4" }}>
                {t.dataUrl ? (
                  <img src={t.dataUrl} alt={`Page ${t.page}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                ) : (
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                )}
                <div style={{ position:"absolute", bottom:"3px", right:"4px", fontSize:"9px", fontWeight:"700", color:currentPage===t.page?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.35)", fontFamily:C.font, background:"rgba(0,0,0,0.5)", padding:"1px 5px", borderRadius:"4px" }}>{t.page}</div>
                {currentPage===t.page && <div style={{ position:"absolute", inset:0, border:"2px solid rgba(124,58,237,0.6)", borderRadius:"7px", pointerEvents:"none" }}/>}
              </div>
            ))}
          </div>

          {/* Main viewer */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {/* Toolbar */}
            <div style={{ padding:"7px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:"10px", flexShrink:0, background:"rgba(255,255,255,0.01)" }}>
              <button className="pdf-nav" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage<=1}
                style={{ width:"26px", height:"26px", borderRadius:"6px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.03)", color:currentPage<=1?"rgba(255,255,255,0.15)":C.muted, cursor:currentPage<=1?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontSize:"12px", color:C.muted, fontFamily:C.font, minWidth:"70px", textAlign:"center" }}>{currentPage} / {totalPages}</span>
              <button className="pdf-nav" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage>=totalPages}
                style={{ width:"26px", height:"26px", borderRadius:"6px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.03)", color:currentPage>=totalPages?"rgba(255,255,255,0.15)":C.muted, cursor:currentPage>=totalPages?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <div style={{ width:"1px", height:"18px", background:C.border }}/>
              <button className="pdf-nav" onClick={()=>changeZoom(-0.2)} style={{ width:"26px", height:"26px", borderRadius:"6px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.03)", color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <span style={{ fontSize:"11px", color:C.muted, fontFamily:C.font, minWidth:"38px", textAlign:"center" }}>{Math.round(scale*100)}%</span>
              <button className="pdf-nav" onClick={()=>changeZoom(0.2)} style={{ width:"26px", height:"26px", borderRadius:"6px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.03)", color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button onClick={()=>setScale(1.4)} style={{ padding:"3px 8px", borderRadius:"5px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.25)", fontSize:"10px", cursor:"pointer", fontFamily:C.font }}>Reset</button>
              <div style={{ width:"1px", height:"18px", background:C.border }}/>
              <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:C.font }}>Go to</span>
              <input type="number" min="1" max={totalPages} defaultValue={currentPage}
                onKeyDown={e=>{if(e.key==="Enter"){const v=parseInt(e.target.value);if(v>=1&&v<=totalPages)setCurrentPage(v);}}}
                style={{ width:"44px", padding:"3px 6px", borderRadius:"5px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"11px", fontFamily:C.font, textAlign:"center", outline:"none" }}/>
              {rendering && (
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:"5px" }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"50%", border:"2px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.8s linear infinite" }}/>
                  <span style={{ fontSize:"10px", color:C.muted, fontFamily:C.font }}>Rendering...</span>
                </div>
              )}
            </div>

            {/* Canvas — centered */}
            <div style={{ flex:1, overflowY:"auto", overflowX:"auto", background:"#525659", display:"flex", justifyContent:"center", alignItems:"flex-start", padding:"24px" }}>
              <div style={{ boxShadow:"0 8px 48px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)", borderRadius:"3px", overflow:"hidden", height:"fit-content" }}>
                <canvas ref={canvasRef} style={{ display:"block" }}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {aiResult && (
        <AISummaryPanel summary={aiResult.summary} keyPoints={aiResult.keyPoints}
          onClose={()=>setAiResult(null)}
          onSendToGenerator={onSendToGenerator ? text=>{onSendToGenerator(text);setAiResult(null);} : null}/>
      )}

      <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>
    </div>
  );
}
