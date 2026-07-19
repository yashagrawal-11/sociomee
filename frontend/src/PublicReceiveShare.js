import { useState, useEffect } from "react";

function formatBytes(b) {
  if (!b) return "0 B";
  const units = ["B","KB","MB","GB"];
  let i = 0; let n = b;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function PublicReceiveShare({ code }) {
  const [state, setState] = useState("loading"); // loading | ready | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchShare = async () => {
      try {
        const resp = await fetch(`https://sociomeeai.com/api/share/${code}`);
        const json = await resp.json();
        if (cancelled) return;
        if (!resp.ok) { setErrorMsg(json.detail || "This share link has expired or doesn't exist."); setState("error"); return; }
        setData(json);
        setState("ready");
      } catch (e) {
        if (!cancelled) { setErrorMsg("Could not load this share. Please check your connection."); setState("error"); }
      }
    };
    fetchShare();
    return () => { cancelled = true; };
  }, [code]);

  const downloadFile = () => {
    if (!data?.file) return;
    const a = document.createElement("a");
    a.href = data.file;
    a.download = `SocioMee_${data.name || "file"}`;
    a.click();
  };

  const cardStyle = { width:"100%", maxWidth:"420px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"24px", padding:"36px 32px", textAlign:"center", backdropFilter:"blur(24px)" };
  const font = "'Poppins',sans-serif";

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:font }}>
      <div style={{ marginBottom:"24px", display:"flex", alignItems:"center", gap:"8px" }}>
        <img src="/app/logo192.png" alt="SocioMee" style={{ width:"28px", height:"28px", borderRadius:"8px", objectFit:"contain" }}/>
        <span style={{ fontSize:"15px", fontWeight:"700", color:"#fff" }}>SocioMee Share</span>
      </div>
      {state === "loading" && (
        <div style={cardStyle}>
          <div style={{ width:"36px", height:"36px", margin:"0 auto 16px", borderRadius:"50%", border:"3px solid rgba(255,255,255,0.15)", borderTopColor:"#fff", animation:"spin 0.8s linear infinite" }}/>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.5)", margin:0 }}>Loading shared file...</p>
        </div>
      )}
      {state === "error" && (
        <div style={cardStyle}>
          <div style={{ width:"52px", height:"52px", margin:"0 auto 16px", borderRadius:"14px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 style={{ fontSize:"16px", fontWeight:"700", color:"#fff", margin:"0 0 8px" }}>Link unavailable</h3>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", margin:0, lineHeight:1.6 }}>{errorMsg}</p>
        </div>
      )}
      {state === "ready" && data && (
        <div style={cardStyle}>
          <div style={{ width:"52px", height:"52px", margin:"0 auto 16px", borderRadius:"14px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h3 style={{ fontSize:"16px", fontWeight:"700", color:"#fff", margin:"0 0 4px", wordBreak:"break-word" }}>{data.name}</h3>
          <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", margin:"0 0 4px" }}>{formatBytes(data.size)}</p>
          <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", margin:"0 0 20px" }}>Sent by {data.sender}</p>
          {data.message && (
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.04)", borderRadius:"10px", padding:"10px 14px", margin:"0 0 20px", lineHeight:1.6 }}>{data.message}</p>
          )}
          <button onClick={downloadFile} style={{ width:"100%", padding:"13px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.14)", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", fontFamily:font }}>Download File</button>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
