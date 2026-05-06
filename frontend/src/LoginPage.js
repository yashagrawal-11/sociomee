import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const BASE = "https://sociomee.in/api";

const C = {
  rose:"#ff3d8f", purple:"#7c3aed", purpleXlt:"#f5f3ff",
  roseXlt:"#fff0f7", ink:"#0d0015", slate:"#3b1f4e",
  muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)",
  glass:"rgba(255,255,255,0.72)", white:"#ffffff",
  success:"#10b981", danger:"#ef4444", warn:"#f59e0b",
};

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
  const { loginWithGoogle, handleCallback, loading } = useAuth();
  const [mode, setMode] = useState("signin"); // signin | signup | forgot | reset
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [hovGoogle, setHovGoogle] = useState(false);

  const inp = (val, set, ph, type="text", extra={}) => (
    <input value={val} onChange={e => set(e.target.value)} placeholder={ph} type={type}
      style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${C.hairline}`, background:"rgba(255,255,255,0.8)", color:C.ink, fontSize:"14px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", ...extra }}
      onFocus={e => e.target.style.border=`1.5px solid ${C.purple}`}
      onBlur={e => e.target.style.border=`1.5px solid ${C.hairline}`}
    />
  );

  const handleRegister = async () => {
    if (!name.trim()) { setErr("Enter your name"); return; }
    if (!email.trim()) { setErr("Enter your email"); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirmPw) { setErr("Passwords don't match"); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch(`${BASE}/auth/register`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name, email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Registration failed");
      await handleCallback(d.token);
      window.location.href = "/";
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) { setErr("Enter email and password"); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch(`${BASE}/auth/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Login failed");
      await handleCallback(d.token);
      window.location.href = "/";
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleForgot = async () => {
    if (!email.trim()) { setErr("Enter your email"); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch(`${BASE}/auth/forgot-password`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed");
      if (d.otp) setMsg(`Your OTP is: ${d.otp} (Dev mode — will be emailed in production)`);
      else setMsg("OTP sent to your email.");
      setMode("reset");
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleReset = async () => {
    if (!otp || !newPw) { setErr("Enter OTP and new password"); return; }
    if (newPw.length < 6) { setErr("Password must be at least 6 characters"); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch(`${BASE}/auth/reset-password`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email, otp, new_password: newPw }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed");
      setMsg("Password reset! Please login.");
      setTimeout(() => { setMode("signin"); setMsg(""); }, 2000);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

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

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:`linear-gradient(135deg,${C.rose},${C.purple})`, color:C.white, fontSize:"10px", fontWeight:"900", letterSpacing:"2.5px", textTransform:"uppercase", padding:"5px 14px", borderRadius:"99px", marginBottom:"14px" }}>✦ AI Content Studio</div>
          <h1 style={{ fontSize:"48px", fontWeight:"900", color:C.ink, lineHeight:1, letterSpacing:"-2px", marginBottom:"8px" }}>SocioMee<span style={{ color:C.rose }}>.</span></h1>
          <p style={{ fontSize:"13px", color:C.muted, lineHeight:1.6 }}>Generate scripts, SEO packs, and content for every platform.</p>
        </div>

        {/* Card */}
        <div style={{ background:C.glass, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:`1px solid ${C.hairline}`, borderRadius:"24px", padding:"28px", boxShadow:"0 20px 60px rgba(124,58,237,0.12)" }}>

          {/* Mode tabs */}
          {(mode === "signin" || mode === "signup") && (
            <div style={{ display:"flex", background:"rgba(124,58,237,0.06)", borderRadius:"12px", padding:"4px", marginBottom:"22px" }}>
              {[["signin","Sign In"],["signup","Sign Up"]].map(([m,l]) => (
                <button key={m} onClick={() => { setMode(m); setErr(""); setMsg(""); }}
                  style={{ flex:1, padding:"8px", borderRadius:"9px", border:"none", background:mode===m?C.white:"transparent", color:mode===m?C.purple:C.muted, fontWeight:"800", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.1)":"none", transition:"all 0.15s" }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Forgot Password */}
          {mode === "forgot" && (
            <div style={{ marginBottom:"18px" }}>
              <button onClick={() => { setMode("signin"); setErr(""); setMsg(""); }} style={{ background:"none", border:"none", color:C.purple, fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", marginBottom:"12px", padding:0 }}>← Back to Sign In</button>
              <h2 style={{ fontSize:"17px", fontWeight:"800", color:C.ink, marginBottom:"4px" }}>Forgot Password?</h2>
              <p style={{ fontSize:"12px", color:C.muted }}>Enter your email and we'll send an OTP.</p>
            </div>
          )}

          {/* Reset Password */}
          {mode === "reset" && (
            <div style={{ marginBottom:"18px" }}>
              <h2 style={{ fontSize:"17px", fontWeight:"800", color:C.ink, marginBottom:"4px" }}>Reset Password</h2>
              <p style={{ fontSize:"12px", color:C.muted }}>Enter the OTP sent to {email}</p>
            </div>
          )}

          {/* Error / Success */}
          {err && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}33`, borderRadius:"10px", padding:"10px 14px", marginBottom:"14px", fontSize:"12.5px", color:C.danger, fontWeight:"600" }}>⚠ {err}</div>}
          {msg && <div style={{ background:`${C.success}12`, border:`1px solid ${C.success}33`, borderRadius:"10px", padding:"10px 14px", marginBottom:"14px", fontSize:"12.5px", color:C.success, fontWeight:"600" }}>✅ {msg}</div>}

          {/* Sign Up Form */}
          {mode === "signup" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {inp(name, setName, "Your name")}
              {inp(email, setEmail, "Email address", "email")}
              <div style={{ position:"relative" }}>
                {inp(password, setPassword, "Password (min 6 chars)", showPw?"text":"password")}
                <button onClick={() => setShowPw(s=>!s)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:"12px", fontFamily:"inherit" }}>{showPw?"Hide":"Show"}</button>
              </div>
              {inp(confirmPw, setConfirmPw, "Confirm password", "password")}
              <button onClick={handleRegister} disabled={busy}
                style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", background:`linear-gradient(135deg,${C.purple},${C.rose})`, color:C.white, fontWeight:"800", fontSize:"14px", cursor:busy?"not-allowed":"pointer", fontFamily:"inherit", opacity:busy?0.7:1, marginTop:"4px" }}>
                {busy ? "Creating account…" : "✦ Create Account"}
              </button>
            </div>
          )}

          {/* Sign In Form */}
          {mode === "signin" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {inp(email, setEmail, "Email address", "email")}
              <div style={{ position:"relative" }}>
                {inp(password, setPassword, "Password", showPw?"text":"password")}
                <button onClick={() => setShowPw(s=>!s)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:"12px", fontFamily:"inherit" }}>{showPw?"Hide":"Show"}</button>
              </div>
              <div style={{ textAlign:"right" }}>
                <button onClick={() => { setMode("forgot"); setErr(""); setMsg(""); }} style={{ background:"none", border:"none", color:C.purple, fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", padding:0 }}>Forgot password?</button>
              </div>
              <button onClick={handleLogin} disabled={busy}
                style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", background:`linear-gradient(135deg,${C.purple},${C.rose})`, color:C.white, fontWeight:"800", fontSize:"14px", cursor:busy?"not-allowed":"pointer", fontFamily:"inherit", opacity:busy?0.7:1 }}>
                {busy ? "Signing in…" : "Sign In →"}
              </button>
            </div>
          )}

          {/* Forgot Form */}
          {mode === "forgot" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {inp(email, setEmail, "Email address", "email")}
              <button onClick={handleForgot} disabled={busy}
                style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", background:`linear-gradient(135deg,${C.purple},${C.rose})`, color:C.white, fontWeight:"800", fontSize:"14px", cursor:busy?"not-allowed":"pointer", fontFamily:"inherit", opacity:busy?0.7:1 }}>
                {busy ? "Sending…" : "Send OTP →"}
              </button>
            </div>
          )}

          {/* Reset Form */}
          {mode === "reset" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {inp(otp, setOtp, "Enter 6-digit OTP")}
              {inp(newPw, setNewPw, "New password (min 6 chars)", "password")}
              <button onClick={handleReset} disabled={busy}
                style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", background:`linear-gradient(135deg,${C.purple},${C.rose})`, color:C.white, fontWeight:"800", fontSize:"14px", cursor:busy?"not-allowed":"pointer", fontFamily:"inherit", opacity:busy?0.7:1 }}>
                {busy ? "Resetting…" : "Reset Password →"}
              </button>
            </div>
          )}

          {/* Divider + Google */}
          {(mode === "signin" || mode === "signup") && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"18px 0" }}>
                <div style={{ flex:1, height:"1px", background:C.hairline }}/>
                <span style={{ fontSize:"12px", color:C.muted, fontWeight:"600" }}>or</span>
                <div style={{ flex:1, height:"1px", background:C.hairline }}/>
              </div>
              <button onClick={loginWithGoogle} disabled={loading}
                onMouseEnter={() => setHovGoogle(true)} onMouseLeave={() => setHovGoogle(false)}
                style={{ width:"100%", padding:"12px 20px", borderRadius:"12px", border:`1.5px solid ${hovGoogle?C.purple:"rgba(124,58,237,0.25)"}`, background:hovGoogle?`${C.purple}08`:"rgba(255,255,255,0.85)", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", transition:"all 0.2s", fontFamily:"inherit" }}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span style={{ fontSize:"14px", fontWeight:"700", color:C.ink }}>{loading ? "Loading…" : "Continue with Google"}</span>
              </button>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginTop:"18px" }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"6px" }}>
                    <span style={{ fontSize:"14px", flexShrink:0 }}>{f.icon}</span>
                    <span style={{ fontSize:"11.5px", color:C.slate, fontWeight:"500", lineHeight:1.4 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:"11.5px", color:C.muted, marginTop:"16px" }}>By signing in you agree to our <a href="/terms" style={{ color:C.purple }}>Terms of Service</a>.</p>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:#8b6b9a88}`}</style>
    </div>
  );
}