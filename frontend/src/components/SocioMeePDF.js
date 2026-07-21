import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument, degrees } from "pdf-lib";

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
      <div style={{ width:"100%", maxWidth:"600px", maxHeight:mob?"95vh":"85vh", background:"rgba(8,8,8,0.97)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
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
              style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:C.font }}>
              ✦ Generate Content
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const mob = typeof window !== "undefined" && window.innerWidth <= 767;

export default function SocioMeePDF({ onSendToGenerator, user, creditStatus }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(typeof window!=="undefined"&&window.innerWidth<=767?0.7:1.4);
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
  const [showOrganize, setShowOrganize] = useState(false);
  const [pageOps, setPageOps] = useState([]);
  const [organizeSaving, setOrganizeSaving] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [splitFrom, setSplitFrom] = useState(1);
  const [splitTo, setSplitTo] = useState(1);
  const [splitSaving, setSplitSaving] = useState(false);
  const [showPageNum, setShowPageNum] = useState(false);
  const [pageNumSaving, setPageNumSaving] = useState(false);
  const [compressSaving, setCompressSaving] = useState(false);
  const [showToImage, setShowToImage] = useState(false);
  const [toImageSaving, setToImageSaving] = useState(false);
  const [toImageProgress, setToImageProgress] = useState(0);
  const [showImgToPdf, setShowImgToPdf] = useState(false);
  const [imgToPdfFiles, setImgToPdfFiles] = useState([]);
  const [imgToPdfSaving, setImgToPdfSaving] = useState(false);
  const [showProtect, setShowProtect] = useState(false);
  const [protectPassword, setProtectPassword] = useState("");
  const [protectSaving, setProtectSaving] = useState(false);
  const [mobileView, setMobileView] = useState("viewer"); // viewer | tools
  const livePlan = creditStatus?.plan || user?.plan || "free";
  const isPremiumPlan = livePlan === "premium_monthly" || livePlan === "premium_annual";

  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const fileInputRef = useRef(null);
  const renderTaskRef = useRef(null);
  const textTaskRef = useRef(null);
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
    if (textTaskRef.current) textTaskRef.current.cancel();
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
      if (textLayerRef.current) {
        const textLayerDiv = textLayerRef.current;
        textLayerDiv.innerHTML = "";
        textLayerDiv.style.width = viewport.width + "px";
        textLayerDiv.style.height = viewport.height + "px";
        textLayerDiv.style.setProperty("--scale-factor", s);
        const textContent = await page.getTextContent();
        const textTask = window.pdfjsLib.renderTextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: viewport,
        });
        textTaskRef.current = textTask;
        await textTask.promise;
      }
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

  // ── Phase 1: pdf-lib powered editing ──────────────────────────
  const openOrganize = () => {
    setPageOps(thumbs.map((t, i) => ({ origIndex: i, rotation: 0, deleted: false })));
    setShowOrganize(true);
  };

  const rotatePageOp = (idx) => {
    setPageOps(ops => ops.map((o, i) => i === idx ? { ...o, rotation: (o.rotation + 90) % 360 } : o));
  };

  const toggleDeletePageOp = (idx) => {
    setPageOps(ops => ops.map((o, i) => i === idx ? { ...o, deleted: !o.deleted } : o));
  };

  const movePageOp = (idx, dir) => {
    setPageOps(ops => {
      const next = [...ops];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return ops;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const saveOrganizedPdf = async () => {
    setOrganizeSaving(true);
    try {
      const srcBytes = await fileObj.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcBytes);
      const newDoc = await PDFDocument.create();
      const kept = pageOps.filter(o => !o.deleted);
      const copiedPages = await newDoc.copyPages(srcDoc, kept.map(o => o.origIndex));
      copiedPages.forEach((page, i) => {
        const rot = kept[i].rotation;
        if (rot) page.setRotation(degrees(page.getRotation().angle + rot));
        newDoc.addPage(page);
      });
      const outBytes = await newDoc.save();
      const newFile = new File([outBytes], fileName || "document.pdf", { type: "application/pdf" });
      setShowOrganize(false);
      setFileObj(newFile);
      await loadPDF(newFile);
    } catch (e) {
      console.error("Organize save failed:", e);
      alert("Could not save changes. Please try again.");
    } finally {
      setOrganizeSaving(false);
    }
  };

  const runSplit = async () => {
    if (!fileObj) return;
    const from = Math.max(1, Math.min(splitFrom, totalPages));
    const to = Math.max(from, Math.min(splitTo, totalPages));
    setSplitSaving(true);
    try {
      const srcBytes = await fileObj.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcBytes);
      const newDoc = await PDFDocument.create();
      const indices = [];
      for (let i = from - 1; i <= to - 1; i++) indices.push(i);
      const pages = await newDoc.copyPages(srcDoc, indices);
      pages.forEach(p => newDoc.addPage(p));
      const outBytes = await newDoc.save();
      const blob = new Blob([outBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${(fileName||"document").replace(/\.pdf$/i,"")}_p${from}-${to}.pdf`; a.click();
      URL.revokeObjectURL(url);
      setShowSplit(false);
    } catch (e) {
      console.error("Split failed:", e);
      alert("Could not split PDF. Please try again.");
    } finally {
      setSplitSaving(false);
    }
  };

  const runCompress = async () => {
    if (!fileObj) return;
    setCompressSaving(true);
    try {
      const token = localStorage.getItem("sociomee_token");
      const form = new FormData();
      form.append("file", fileObj, fileName || "document.pdf");
      const res = await fetch("https://sociomeeai.com/api/pdf/compress", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Compress request failed");
      const blob = await res.blob();
      const newFile = new File([blob], fileName || "document.pdf", { type: "application/pdf" });
      setFileObj(newFile);
      await loadPDF(newFile);
    } catch (e) {
      console.error("Compress failed:", e);
      alert("Could not compress this PDF. Please try again.");
    } finally {
      setCompressSaving(false);
    }
  };

  const runExportImages = async () => {
    if (!pdfDoc) return;
    setToImageSaving(true);
    setToImageProgress(0);
    try {
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(fileName||"document").replace(/\.pdf$/i,"")}_page${i}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setToImageProgress(i);
        await new Promise(r => setTimeout(r, 200));
      }
      setShowToImage(false);
    } catch (e) {
      console.error("Export images failed:", e);
      alert("Could not export pages as images. Please try again.");
    } finally {
      setToImageSaving(false);
    }
  };

  const addImgToPdfFiles = (files) => {
    setImgToPdfFiles(prev => [...prev, ...Array.from(files)]);
  };

  const removeImgToPdfFile = (idx) => {
    setImgToPdfFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const runImageToPdf = async () => {
    if (imgToPdfFiles.length === 0) return;
    setImgToPdfSaving(true);
    try {
      const newDoc = await PDFDocument.create();
      for (const f of imgToPdfFiles) {
        const bytes = await f.arrayBuffer();
        let img;
        if (f.type === "image/png") {
          img = await newDoc.embedPng(bytes);
        } else {
          img = await newDoc.embedJpg(bytes);
        }
        const page = newDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const outBytes = await newDoc.save();
      const blob = new Blob([outBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "images.pdf"; a.click();
      URL.revokeObjectURL(url);
      setShowImgToPdf(false);
      setImgToPdfFiles([]);
    } catch (e) {
      console.error("Image to PDF failed:", e);
      alert("Could not create PDF from these images. Please try again.");
    } finally {
      setImgToPdfSaving(false);
    }
  };

  const runProtect = async () => {
    if (!fileObj || !protectPassword || protectPassword.length < 4) return;
    setProtectSaving(true);
    try {
      const token = localStorage.getItem("sociomee_token");
      const form = new FormData();
      form.append("file", fileObj, fileName || "document.pdf");
      form.append("password", protectPassword);
      const res = await fetch("https://sociomeeai.com/api/pdf/protect", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Protect request failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(fileName||"document").replace(/\.pdf$/i,"")}_protected.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setShowProtect(false);
      setProtectPassword("");
    } catch (e) {
      console.error("Protect failed:", e);
      alert("Could not password-protect this PDF. Please try again.");
    } finally {
      setProtectSaving(false);
    }
  };

  const runAddPageNumbers = async () => {
    if (!fileObj) return;
    setPageNumSaving(true);
    try {
      const srcBytes = await fileObj.arrayBuffer();
      const doc = await PDFDocument.load(srcBytes);
      const pages = doc.getPages();
      pages.forEach((page, i) => {
        const { width } = page.getSize();
        page.drawText(`${i + 1} / ${pages.length}`, {
          x: width / 2 - 20,
          y: 18,
          size: 10,
        });
      });
      const outBytes = await doc.save();
      const newFile = new File([outBytes], fileName || "document.pdf", { type: "application/pdf" });
      setShowPageNum(false);
      setFileObj(newFile);
      await loadPDF(newFile);
    } catch (e) {
      console.error("Page numbering failed:", e);
      alert("Could not add page numbers. Please try again.");
    } finally {
      setPageNumSaving(false);
    }
  };


  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:C.bg, fontFamily:C.font, overflow:"hidden" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .pdf-btn:hover{background:rgba(255,255,255,0.14)!important;border-color:rgba(255,255,255,0.3)!important;color:#ffffff!important;transform:translateY(-1px);}
.pdf-btn:active{transform:translateY(0);}
        .pdf-nav:hover{background:rgba(255,255,255,0.1)!important;}
        .pdf-thumb:hover{border-color:rgba(124,58,237,0.5)!important;transform:scale(1.03);}
        .pdf-upload:hover{border-color:rgba(124,58,237,0.5)!important;background:rgba(124,58,237,0.06)!important;}
        .textLayer{position:absolute;text-align:initial;overflow:hidden;line-height:1;text-size-adjust:none;forced-color-adjust:none;transform-origin:0 0;z-index:1;}
        .textLayer span,.textLayer br{color:transparent;position:absolute;white-space:pre;cursor:text;transform-origin:0% 0%;}
        .textLayer ::selection{background:rgba(0,120,255,0.35);}
      `}</style>

      {/* Top Header */}
      <div style={{ borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", flexShrink:0, background:"rgba(255,255,255,0.01)" }}>
        {mob && <div style={{ width:"52px", flexShrink:0, height:"44px" }}/>}
        {!mob && <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"9px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(124,58,237,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            {fileName ? (
              <h2 style={{ fontSize:"13px", fontWeight:"700", color:C.white, margin:0, fontFamily:C.font, maxWidth:"280px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{fileName}</h2>
            ) : (
              <h2 style={{ fontSize:"13px", fontWeight:"700", color:C.white, margin:0, fontFamily:C.font }}>PDF</h2>
            )}
          </div>
        </div>}

        {pdfDoc && (
          <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"nowrap", overflowX:"auto", flex:1, padding:mob?"8px 8px":"0 16px 0 0", scrollbarWidth:"thin" }}>
            <button onClick={()=>analyzeWithAI("summary")} disabled={aiLoading} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:mob?"6px 10px":"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:mob?"10px":"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              {aiLoading ? <div style={{ width:"10px", height:"10px", borderRadius:"50%", border:"2px solid rgba(124,58,237,0.3)", borderTopColor:"#7c3aed", animation:"spin 0.8s linear infinite" }}/> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
              {aiLoading ? "Analyzing..." : "Summarize"}
            </button>
            <button onClick={()=>analyzeWithAI("contract")} disabled={aiLoading} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              Review Deal
            </button>
            <div style={{ width:"1px", height:"18px", background:C.border }}/>
            <button onClick={openOrganize} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              Organize
            </button>
            <button onClick={()=>{setSplitFrom(1);setSplitTo(totalPages);setShowSplit(true);}} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><line x1="12" y1="3" x2="12" y2="21" strokeDasharray="3 3"/></svg>
              Split
            </button>
            <button onClick={()=>setShowPageNum(true)} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
              Numbering
            </button>
            <button onClick={runCompress} disabled={compressSaving} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:compressSaving?"wait":"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              {compressSaving?"Compressing...":"Compress"}
            </button>
            <button onClick={()=>setShowToImage(true)} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              To Images
            </button>
            <button onClick={()=>setShowImgToPdf(true)} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Img to PDF
            </button>
            <button onClick={()=>{ if(!isPremiumPlan){ if(window.confirm("Password Protect is a Pro+ feature. View pricing?")) window.location.href="/pricing"; return; } setShowProtect(true); }} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Protect{!isPremiumPlan && " ✦"}
            </button>
            <div style={{ width:"1px", height:"18px", background:C.border }}/>
            <button onClick={sharePDF} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            <button onClick={downloadPDF} className="pdf-btn"
              style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 14px", flexShrink:0, whiteSpace:"nowrap", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.75)", fontSize:"11.5px", fontWeight:"600", cursor:"pointer", fontFamily:C.font, transition:"all 0.2s" }}>
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
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px", textAlign:"center", width:"100%", maxWidth:"360px", padding:"40px 32px", border:`1px solid ${dragOver?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`, borderRadius:"20px", background:"rgba(255,255,255,0.03)", backdropFilter:"blur(24px)", cursor:"pointer", transition:"all 0.2s" }}>
            {loading ? <LoadingSpinner text="Loading PDF..."/> : (
              <>
                <div style={{ width:"68px", height:"68px", borderRadius:"20px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div>
                  <h3 style={{ fontSize:"22px", fontWeight:"700", color:"#fff", margin:"0 0 10px", fontFamily:C.font }}>Drop your PDF here</h3>
                  <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:1.8, margin:0, fontFamily:C.font }}>Upload brand deals, contracts, media kits or press releases. AI will read it and tell you what matters.</p>
                </div>
                <button onClick={e=>{e.stopPropagation();fileInputRef.current?.click();}}
                  style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 28px", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.85)", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Choose PDF file
                </button>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display:"none" }} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>
        </div>
      ) : (
        /* PDF Viewer with thumbnail sidebar */
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Thumbnail Sidebar */}
          <div style={{ width:"130px", flexShrink:0, borderRight:`1px solid ${C.border}`, background:"#1c1c1c", overflowY:"auto", padding:"12px 8px", display:mob?"none":"flex", flexDirection:"column", gap:"10px" }}>
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
            <div style={{ padding:mob?"6px 8px":"7px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:mob?"6px":"10px", flexShrink:0, background:"rgba(255,255,255,0.01)", overflowX:"auto" }}>
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
            <div style={{ flex:1, overflowY:"auto", overflowX:"auto", background:"#525659", display:"flex", justifyContent:"center", alignItems:"flex-start", padding:mob?"8px":"24px" }}
              ref={el=>{
                if(!el||el._touchBound) return;
                el._touchBound=true;
                let lastDist=null;
                el.addEventListener("touchstart",e=>{
                  if(e.touches.length===2){
                    lastDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
                  }
                },{passive:true});
                let scaleRef=1.4;
                let rafId=null;
                el.addEventListener("touchmove",e=>{
                  if(e.touches.length===2&&lastDist){
                    const dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
                    const delta=(dist-lastDist)*0.008;
                    lastDist=dist;
                    scaleRef=Math.min(3,Math.max(0.4,scaleRef+delta));
                    if(rafId) cancelAnimationFrame(rafId);
                    rafId=requestAnimationFrame(()=>{
                      setScale(parseFloat(scaleRef.toFixed(2)));
                      rafId=null;
                    });
                    e.preventDefault();
                  }
                },{passive:false});
                el.addEventListener("touchend",()=>{lastDist=null;},{passive:true});
              }}>
              <div style={{ boxShadow:"0 8px 48px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)", borderRadius:"3px", overflow:"hidden", height:"fit-content", position:"relative" }}>
                <canvas ref={canvasRef} style={{ display:"block", willChange:"transform" }}/>
                <div ref={textLayerRef} className="textLayer" style={{ position:"absolute", top:0, left:0 }}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOrganize && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={e => e.target===e.currentTarget && setShowOrganize(false)}>
          <div style={{ width:"100%", maxWidth:"720px", maxHeight:"85vh", background:"rgba(8,8,8,0.97)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                </div>
                <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:C.font }}>Organize Pages</span>
              </div>
              <button onClick={()=>setShowOrganize(false)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:C.muted, width:"28px", height:"28px", borderRadius:"8px", cursor:"pointer", fontSize:"16px" }}>X</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
              <p style={{ fontSize:"11px", color:C.muted, fontFamily:C.font, margin:"0 0 16px" }}>Rotate, delete, or reorder pages. Changes apply when you save.</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(110px, 1fr))", gap:"14px" }}>
                {pageOps.map((op, idx) => {
                  const thumb = thumbs[op.origIndex];
                  return (
                    <div key={idx} style={{ opacity: op.deleted ? 0.35 : 1, transition:"opacity 0.15s" }}>
                      <div style={{ borderRadius:"8px", overflow:"hidden", border:"1.5px solid rgba(255,255,255,0.12)", background:"#2a2a2a", aspectRatio:"3/4", position:"relative" }}>
                        {thumb?.dataUrl ? (
                          <img src={thumb.dataUrl} alt={`Page ${op.origIndex+1}`} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transform:`rotate(${op.rotation}deg)`, transition:"transform 0.2s" }}/>
                        ) : (
                          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                          </div>
                        )}
                        <div style={{ position:"absolute", bottom:"3px", right:"4px", fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.7)", fontFamily:C.font, background:"rgba(0,0,0,0.5)", padding:"1px 5px", borderRadius:"4px" }}>{op.origIndex+1}</div>
                      </div>
                      <div style={{ display:"flex", gap:"3px", marginTop:"6px", justifyContent:"center" }}>
                        <button onClick={()=>movePageOp(idx,-1)} disabled={idx===0} title="Move left" style={{ width:"22px", height:"22px", borderRadius:"5px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:idx===0?"rgba(255,255,255,0.15)":C.muted, cursor:idx===0?"not-allowed":"pointer", fontSize:"10px" }}>L</button>
                        <button onClick={()=>rotatePageOp(idx)} title="Rotate" style={{ width:"22px", height:"22px", borderRadius:"5px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:C.muted, cursor:"pointer", fontSize:"10px" }}>R</button>
                        <button onClick={()=>toggleDeletePageOp(idx)} title={op.deleted?"Restore":"Delete"} style={{ width:"22px", height:"22px", borderRadius:"5px", border:"1px solid rgba(255,255,255,0.1)", background: op.deleted ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.04)", color: op.deleted ? "#f87171" : C.muted, cursor:"pointer", fontSize:"10px" }}>D</button>
                        <button onClick={()=>movePageOp(idx,1)} disabled={idx===pageOps.length-1} title="Move right" style={{ width:"22px", height:"22px", borderRadius:"5px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:idx===pageOps.length-1?"rgba(255,255,255,0.15)":C.muted, cursor:idx===pageOps.length-1?"not-allowed":"pointer", fontSize:"10px" }}>R</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"8px" }}>
              <button onClick={()=>setShowOrganize(false)} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>Cancel</button>
              <button onClick={saveOrganizedPdf} disabled={organizeSaving} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:organizeSaving?"wait":"pointer", fontFamily:C.font, opacity:organizeSaving?0.6:1 }}>{organizeSaving?"Saving...":"Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {showSplit && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={e => e.target===e.currentTarget && setShowSplit(false)}>
          <div style={{ width:"100%", maxWidth:"400px", background:"rgba(8,8,8,0.97)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/></svg>
                </div>
                <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:C.font }}>Split PDF</span>
              </div>
              <button onClick={()=>setShowSplit(false)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:C.muted, width:"28px", height:"28px", borderRadius:"8px", cursor:"pointer", fontSize:"16px" }}>X</button>
            </div>
            <div style={{ padding:"20px" }}>
              <p style={{ fontSize:"11px", color:C.muted, fontFamily:C.font, margin:"0 0 16px" }}>Choose the page range to extract into a new PDF (document has {totalPages} pages).</p>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", fontFamily:C.font, display:"block", marginBottom:"6px" }}>From page</label>
                  <input type="number" min="1" max={totalPages} value={splitFrom} onChange={e=>setSplitFrom(parseInt(e.target.value)||1)}
                    style={{ width:"100%", padding:"8px 10px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"13px", fontFamily:C.font, textAlign:"center", outline:"none", boxSizing:"border-box" }}/>
                </div>
                <span style={{ color:"rgba(255,255,255,0.3)", marginTop:"18px" }}>to</span>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", fontFamily:C.font, display:"block", marginBottom:"6px" }}>To page</label>
                  <input type="number" min="1" max={totalPages} value={splitTo} onChange={e=>setSplitTo(parseInt(e.target.value)||1)}
                    style={{ width:"100%", padding:"8px 10px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"13px", fontFamily:C.font, textAlign:"center", outline:"none", boxSizing:"border-box" }}/>
                </div>
              </div>
            </div>
            <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"8px" }}>
              <button onClick={()=>setShowSplit(false)} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>Cancel</button>
              <button onClick={runSplit} disabled={splitSaving} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:splitSaving?"wait":"pointer", fontFamily:C.font, opacity:splitSaving?0.6:1 }}>{splitSaving?"Splitting...":"Split & Download"}</button>
            </div>
          </div>
        </div>
      )}

      {showPageNum && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={e => e.target===e.currentTarget && setShowPageNum(false)}>
          <div style={{ width:"100%", maxWidth:"380px", background:"rgba(8,8,8,0.97)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
                </div>
                <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:C.font }}>Add Page Numbers</span>
              </div>
              <button onClick={()=>setShowPageNum(false)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:C.muted, width:"28px", height:"28px", borderRadius:"8px", cursor:"pointer", fontSize:"16px" }}>X</button>
            </div>
            <div style={{ padding:"20px" }}>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", fontFamily:C.font, lineHeight:1.7, margin:0 }}>This adds page and total numbering to the bottom center of every page in this document. The original file will be replaced with the numbered version.</p>
            </div>
            <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"8px" }}>
              <button onClick={()=>setShowPageNum(false)} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>Cancel</button>
              <button onClick={runAddPageNumbers} disabled={pageNumSaving} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:pageNumSaving?"wait":"pointer", fontFamily:C.font, opacity:pageNumSaving?0.6:1 }}>{pageNumSaving?"Adding...":"Add Page Numbers"}</button>
            </div>
          </div>
        </div>
      )}

      {showToImage && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={e => e.target===e.currentTarget && !toImageSaving && setShowToImage(false)}>
          <div style={{ width:"100%", maxWidth:"380px", background:"rgba(8,8,8,0.97)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:C.font }}>Export as Images</span>
              </div>
              <button onClick={()=>!toImageSaving && setShowToImage(false)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:C.muted, width:"28px", height:"28px", borderRadius:"8px", cursor:"pointer", fontSize:"16px" }}>X</button>
            </div>
            <div style={{ padding:"20px" }}>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", fontFamily:C.font, lineHeight:1.7, margin:0 }}>
                {toImageSaving
                  ? `Downloading page ${toImageProgress} of ${totalPages}...`
                  : `Each of the ${totalPages} pages will download as a separate PNG image.`}
              </p>
            </div>
            <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"8px" }}>
              <button onClick={()=>!toImageSaving && setShowToImage(false)} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>Cancel</button>
              <button onClick={runExportImages} disabled={toImageSaving} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:toImageSaving?"wait":"pointer", fontFamily:C.font, opacity:toImageSaving?0.6:1 }}>{toImageSaving?"Exporting...":"Export All Pages"}</button>
            </div>
          </div>
        </div>
      )}

      {showImgToPdf && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={e => e.target===e.currentTarget && setShowImgToPdf(false)}>
          <div style={{ width:"100%", maxWidth:"480px", maxHeight:"85vh", background:"rgba(8,8,8,0.97)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:C.font }}>Images to PDF</span>
              </div>
              <button onClick={()=>setShowImgToPdf(false)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:C.muted, width:"28px", height:"28px", borderRadius:"8px", cursor:"pointer", fontSize:"16px" }}>X</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
              <p style={{ fontSize:"11px", color:C.muted, fontFamily:C.font, margin:"0 0 14px" }}>Images will become pages in a new PDF, in the order added.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
                {imgToPdfFiles.map((f, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:"8px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.7)", fontFamily:C.font, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                    <button onClick={()=>removeImgToPdfFile(i)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontSize:"14px" }}>X</button>
                  </div>
                ))}
              </div>
              <label className="pdf-upload" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"14px", border:"2px dashed rgba(255,255,255,0.1)", borderRadius:"12px", cursor:"pointer", color:C.muted, fontSize:"12px", fontFamily:C.font }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add images
                <input type="file" accept="image/png,image/jpeg" multiple style={{ display:"none" }} onChange={e=>{addImgToPdfFiles(e.target.files);e.target.value="";}}/>
              </label>
            </div>
            <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"8px" }}>
              <button onClick={()=>setShowImgToPdf(false)} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>Cancel</button>
              <button onClick={runImageToPdf} disabled={imgToPdfSaving || imgToPdfFiles.length===0} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:(imgToPdfSaving||imgToPdfFiles.length===0)?"not-allowed":"pointer", fontFamily:C.font, opacity:(imgToPdfSaving||imgToPdfFiles.length===0)?0.5:1 }}>{imgToPdfSaving?"Creating...":"Create PDF"}</button>
            </div>
          </div>
        </div>
      )}

      {showProtect && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(10px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={e => e.target===e.currentTarget && setShowProtect(false)}>
          <div style={{ width:"100%", maxWidth:"380px", background:"rgba(8,8,8,0.97)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:C.font }}>Password Protect</span>
              </div>
              <button onClick={()=>setShowProtect(false)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:C.muted, width:"28px", height:"28px", borderRadius:"8px", cursor:"pointer", fontSize:"16px" }}>X</button>
            </div>
            <div style={{ padding:"20px" }}>
              <p style={{ fontSize:"11px", color:C.muted, fontFamily:C.font, margin:"0 0 14px" }}>Set a password to lock this PDF. Anyone opening it will need this password.</p>
              <input type="password" value={protectPassword} onChange={e=>setProtectPassword(e.target.value)} placeholder="Enter password (min 4 characters)"
                style={{ width:"100%", padding:"10px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"13px", fontFamily:C.font, outline:"none", boxSizing:"border-box" }}/>
            </div>
            <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:"8px" }}>
              <button onClick={()=>setShowProtect(false)} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>Cancel</button>
              <button onClick={runProtect} disabled={protectSaving || protectPassword.length<4} style={{ flex:1, padding:"9px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:(protectSaving||protectPassword.length<4)?"not-allowed":"pointer", fontFamily:C.font, opacity:(protectSaving||protectPassword.length<4)?0.5:1 }}>{protectSaving?"Protecting...":"Protect & Download"}</button>
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
