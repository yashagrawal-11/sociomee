import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const C = { rose:"#ff3d8f",purple:"#7c3aed",purpleXlt:"#f5f3ff",roseXlt:"#fff0f7",ink:"#0d0015",slate:"#3b1f4e",muted:"#8b6b9a",hairline:"rgba(124,58,237,0.12)",glass:"rgba(255,255,255,0.72)",white:"#ffffff",success:"#10b981" };

export function AuthCallback() {
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return; done.current = true;
    const params = new URLSearchParams(window.location.search);
    const token  = params.get("token");
    const error  = params.get("error");
    if (token) {
      handleCallback(token)
        .then(() => { setStatus("success"); setTimeout(() => { window.location.href = "/"; }, 1000); })
        .catch(() => { setMsg("Callback failed."); setStatus("error"); });
    } else { setMsg(error || "No token received."); setStatus("error"); }
  }, [handleCallback]);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:`linear-gradient(135deg,${C.purpleXlt},${C.roseXlt})`, fontFamily:"sans-serif" }}>
      {status === "loading" && <><div style={{ width:"44px",height:"44px",borderRadius:"50%",border:`3px solid ${C.purple}22`,borderTopColor:C.purple,animation:"spin 0.7s linear infinite" }}/><p style={{ color:C.muted,fontSize:"14px",fontWeight:"600",margin:0 }}>Signing you in…</p></>}
      {status === "success" && <><div style={{ fontSize:"48px" }}>✅</div><p style={{ color:C.success,fontSize:"16px",fontWeight:"700",margin:0 }}>Logged in! Redirecting…</p></>}
      {status === "error"   && <><div style={{ fontSize:"48px" }}>❌</div><p style={{ color:"#ef4444",fontSize:"14px",fontWeight:"600",margin:0,maxWidth:"300px",textAlign:"center" }}>{msg}</p><button onClick={() => window.location.href="/"} style={{ padding:"10px 24px",borderRadius:"99px",border:"none",background:C.purple,color:C.white,fontWeight:"700",cursor:"pointer" }}>Go back</button></>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
}

export default function LoginPage() {
  const { loginWithGoogle, loading } = useAuth();
  const [hov, setHov] = useState(false);
  const features = [
    { icon:"📜", text:"Scripts up to 5000 words" },
    { icon:"🌐", text:"SEO packs — 8 platforms"  },
    { icon:"🔬", text:"Deep research with GNews" },
    { icon:"🖼️", text:"Thumbnail analyzer"        },
    { icon:"💳", text:"20 free credits/month"    },
    { icon:"✦",  text:"Upgrade to Pro anytime"   },
  ];
  return (
    <div style={{ minHeight:"100vh", background:`radial-gradient(ellipse at 20% 0%,${C.purpleXlt},#f8f4ff 35%,${C.roseXlt} 70%,#f0f9ff)`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:"32px 16px" }}>
      <div style={{ width:"100%", maxWidth:"420px" }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:`linear-gradient(135deg,${C.rose},${C.purple})`, color:C.white, fontSize:"10px", fontWeight:"900", letterSpacing:"2.5px", textTransform:"uppercase", padding:"5px 14px", borderRadius:"99px", marginBottom:"16px" }}>✦ AI Content Studio</div>
          <h1 style={{ fontSize:"48px", fontWeight:"900", color:C.ink, lineHeight:1, letterSpacing:"-2px", marginBottom:"10px" }}>SocioMee<span style={{ color:C.rose }}>.</span></h1>
          <p style={{ fontSize:"14px", color:C.muted, lineHeight:1.6 }}>Generate scripts, SEO packs, and content for every platform — powered by AI.</p>
        </div>
        <div style={{ background:C.glass, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:`1px solid ${C.hairline}`, borderRadius:"24px", padding:"32px 28px", boxShadow:"0 20px 60px rgba(124,58,237,0.12)" }}>
          <h2 style={{ fontSize:"18px", fontWeight:"800", color:C.ink, textAlign:"center", marginBottom:"6px" }}>Sign in to get started</h2>
          <p style={{ fontSize:"13px", color:C.muted, textAlign:"center", marginBottom:"24px" }}>Free account · 20 credits/month · No card needed</p>
          <button onClick={loginWithGoogle} disabled={loading} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{ width:"100%", padding:"14px 20px", borderRadius:"14px", border:`1.5px solid ${hov ? C.purple : "rgba(124,58,237,0.25)"}`, background:hov ? `${C.purple}08` : "rgba(255,255,255,0.85)", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", transition:"all 0.2s", fontFamily:"inherit" }}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span style={{ fontSize:"15px", fontWeight:"700", color:C.ink }}>{loading ? "Loading…" : "Continue with Google"}</span>
          </button>
          <div style={{ height:"1px", background:`linear-gradient(90deg,transparent,${C.hairline},transparent)`, margin:"22px 0" }}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {features.map((f, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"7px" }}>
                <span style={{ fontSize:"15px", flexShrink:0 }}>{f.icon}</span>
                <span style={{ fontSize:"12px", color:C.slate, fontWeight:"500", lineHeight:1.4 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ textAlign:"center", fontSize:"11.5px", color:C.muted, marginTop:"20px" }}>By signing in you agree to our Terms of Service.</p>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
}