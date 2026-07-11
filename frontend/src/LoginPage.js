import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const BASE = "https://sociomeeai.com/api";

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
        .then(() => { setStatus("success"); setTimeout(() => { window.location.href = "/app"; }, 1000); })
        .catch(() => { setMsg("Callback failed."); setStatus("error"); });
    } else { setMsg(error || "No token received."); setStatus("error"); }
  }, [handleCallback]);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:"#0a0a0a", fontFamily:"'Poppins',sans-serif" }}>
      {status === "loading" && <><div style={{ width:"44px",height:"44px",borderRadius:"50%",border:"3px solid rgba(124,58,237,0.2)",borderTopColor:"#7c3aed",animation:"spin 0.7s linear infinite" }}/><p style={{ color:"rgba(255,255,255,0.5)",fontSize:"14px",fontWeight:"500",margin:0 }}>Signing you in…</p></>}
      {status === "success" && <><div style={{ fontSize:"48px" }}>✅</div><p style={{ color:"#10b981",fontSize:"16px",fontWeight:"600",margin:0 }}>Logged in! Redirecting…</p></>}
      {status === "error"   && <><div style={{ fontSize:"48px" }}>❌</div><p style={{ color:"#ef4444",fontSize:"14px",fontWeight:"500",margin:0,maxWidth:"300px",textAlign:"center" }}>{msg}</p><button onClick={() => window.location.href="/app"} style={{ padding:"10px 24px",borderRadius:"99px",border:"none",background:"linear-gradient(135deg,#7c3aed,#ff3d8f)",color:"#fff",fontWeight:"600",cursor:"pointer" }}>Go back</button></>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
}

export default function LoginPage() {
  useEffect(() => {
    document.title = "Login | SocioMee";
    return () => { document.title = "SocioMee"; };
  }, []);
  const { loginWithGoogle, loginWithGithub, handleCallback, loading } = useAuth();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const inputStyle = {
    width:"100%", padding:"13px 16px", borderRadius:"99px",
    border:"1px solid rgba(255,255,255,0.1)",
    background:"rgba(255,255,255,0.06)",
    color:"#ffffff", fontSize:"14px",
    fontFamily:"'Poppins',sans-serif",
    outline:"none", boxSizing:"border-box",
    transition:"border-color 0.2s ease",
  };

  const inp = (val, set, ph, type="text") => (
    <input value={val} onChange={e => set(e.target.value)} placeholder={ph} type={type}
      style={inputStyle}
      onFocus={e => { e.target.style.border="1px solid rgba(124,58,237,0.6)"; e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.1)"; }}
      onBlur={e => { e.target.style.border="1px solid rgba(255,255,255,0.1)"; e.target.style.boxShadow="none"; }}
    />
  );

  const [btnHov, setBtnHov] = useState(false);
  const btnPrimary = { width:"100%", padding:"14px", borderRadius:"99px", border:"none", background:btnHov?"radial-gradient(ellipse at 30% 30%,#9b5cf6,#7c3aed 50%,#4c1d95)":"rgba(255,255,255,0.06)", color:"#fff", fontWeight:"600", fontSize:"15px", cursor:"pointer", fontFamily:"'Poppins',sans-serif", letterSpacing:"0.02em", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", transition:"all 0.2s ease", boxShadow:btnHov?"0 0 28px rgba(124,58,237,0.6)":"none" };

  const handleRegister = async () => {
    if (!name.trim()) { setErr("Enter your name"); return; }
    if (!email.trim()) { setErr("Enter your email"); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirmPw) { setErr("Passwords don't match"); return; }
    if (!ageConfirmed) { setErr("Please confirm you are 18 years or older"); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch(`${BASE}/auth/register`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, email, password, age_confirmed: ageConfirmed }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Registration failed");
      await handleCallback(d.token);
      window.location.href = "/app";
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) { setErr("Enter email and password"); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch(`${BASE}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Login failed");
      await handleCallback(d.token);
      window.location.href = "/app";
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleForgot = async () => {
    if (!email.trim()) { setErr("Enter your email"); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      const r = await fetch(`${BASE}/auth/forgot-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed");
      if (d.otp) setMsg(`Your OTP is: ${d.otp}`);
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
      const r = await fetch(`${BASE}/auth/reset-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, otp, new_password:newPw }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed");
      setMsg("Password reset! Please login.");
      setTimeout(() => { setMode("signin"); setMsg(""); }, 2000);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const features = [
    { icon:"", text:"Scripts up to 5000 words" },
    { icon:"", text:"SEO packs — 8 platforms"  },
    { icon:"", text:"Deep research with GNews" },
    { icon:"", text:"Thumbnail analyzer"        },
    { icon:"", text:"20 free credits/month"    },
    { icon:"", text:"Upgrade to Pro anytime"   },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Poppins',sans-serif", padding:"24px 16px", boxSizing:"border-box" }}>

      {/* Background glow */}
      <div style={{ position:"fixed", top:"-20%", left:"50%", transform:"translateX(-50%)", width:"600px", height:"400px", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ width:"100%", maxWidth:"400px", position:"relative", zIndex:1 }}>

        {/* Logo + tagline */}
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", background:"linear-gradient(135deg,#7c3aed,#ff3d8f)", color:"#fff", fontSize:"10px", fontWeight:"700", letterSpacing:"2px", textTransform:"uppercase", padding:"5px 14px", borderRadius:"99px", marginBottom:"16px" }}>✦ AI Content Studio</div>
          <h1 style={{ fontSize:"clamp(28px,6vw,44px)", fontWeight:"700", color:"#ffffff", fontFamily:"'Orbitron',sans-serif", letterSpacing:"0.08em", lineHeight:1, marginBottom:"8px", textShadow:"0 0 40px rgba(124,58,237,0.3)" }}>SOCIOMEE AI</h1>
          
        </div>

        {/* Card */}
        <div style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"28px", padding:"28px", boxShadow:"0 20px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.06)" }}>

          {/* Mode tabs */}
          {(mode === "signin" || mode === "signup") && (
            <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:"99px", padding:"4px", marginBottom:"22px", border:"1px solid rgba(255,255,255,0.06)" }}>
              {[["signin","Sign In"],["signup","Sign Up"]].map(([m,l]) => (
                <button key={m} onClick={() => { setMode(m); setErr(""); setMsg(""); }}
                  style={{ flex:1, padding:"9px", borderRadius:"99px", border:"none", background:mode===m?"rgba(124,58,237,0.15)":"transparent", color:mode===m?"#fff":"rgba(255,255,255,0.35)", fontWeight:"600", fontSize:"13px", cursor:"pointer", fontFamily:"'Poppins',sans-serif", transition:"all 0.2s ease", boxShadow:"none", border:mode===m?"1px solid rgba(124,58,237,0.35)":"1px solid transparent" }}>
                  {l}
                </button>
              ))}
            </div>
          )}

          {/* Forgot heading */}
          {mode === "forgot" && (
            <div style={{ marginBottom:"18px" }}>
              <button onClick={() => { setMode("signin"); setErr(""); setMsg(""); }} style={{ background:"none", border:"none", color:"#a78bfa", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:"'Poppins',sans-serif", marginBottom:"12px", padding:0 }}>← Back to Sign In</button>
              <h2 style={{ fontSize:"17px", fontWeight:"700", color:"#fff", marginBottom:"4px" }}>Forgot Password?</h2>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)" }}>Enter your email and we'll send an OTP.</p>
            </div>
          )}

          {/* Reset heading */}
          {mode === "reset" && (
            <div style={{ marginBottom:"18px" }}>
              <h2 style={{ fontSize:"17px", fontWeight:"700", color:"#fff", marginBottom:"4px" }}>Reset Password</h2>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)" }}>Enter the OTP sent to {email}</p>
            </div>
          )}

          {/* Error / Success */}
          {err && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"10px", padding:"10px 14px", marginBottom:"14px", fontSize:"12.5px", color:"#fca5a5", fontWeight:"500" }}>⚠ {err}</div>}
          {msg && <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:"10px", padding:"10px 14px", marginBottom:"14px", fontSize:"12.5px", color:"#6ee7b7", fontWeight:"500" }}>✅ {msg}</div>}

          {/* Sign Up */}
          {mode === "signup" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {inp(name, setName, "Your name")}
              {inp(email, setEmail, "Email address", "email")}
              <div style={{ position:"relative" }}>
                {inp(password, setPassword, "Password (min 6 chars)", showPw?"text":"password")}
                <button onClick={() => setShowPw(s=>!s)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", fontSize:"12px", fontFamily:"'Poppins',sans-serif" }}>{showPw?"Hide":"Show"}</button>
              </div>
              {inp(confirmPw, setConfirmPw, "Confirm password", "password")}
              <label style={{ display:"flex", alignItems:"flex-start", gap:"10px", cursor:"pointer", padding:"4px 2px", userSelect:"none" }}>
                <div onClick={() => setAgeConfirmed(a => !a)} style={{ width:"18px", height:"18px", minWidth:"18px", borderRadius:"6px", border: ageConfirmed ? "1px solid rgba(124,58,237,0.8)" : "1px solid rgba(255,255,255,0.2)", background: ageConfirmed ? "linear-gradient(135deg,#9b5cf6,#7c3aed)" : "rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", marginTop:"1px", transition:"all 0.2s ease", boxShadow: ageConfirmed ? "0 0 12px rgba(124,58,237,0.5)" : "none" }}>
                  {ageConfirmed && <span style={{ color:"#fff", fontSize:"11px", fontWeight:"700", lineHeight:1 }}>✓</span>}
                </div>
                <span onClick={() => setAgeConfirmed(a => !a)} style={{ fontSize:"12.5px", lineHeight:1.5, color:"rgba(255,255,255,0.55)", fontFamily:"'Poppins',sans-serif" }}>
                  I confirm I am 18 years of age or older
                </span>
              </label>
              <button onClick={handleRegister} disabled={busy} onMouseEnter={()=>setBtnHov(true)} onMouseLeave={()=>setBtnHov(false)} style={{ ...btnPrimary, opacity:busy?0.6:1, marginTop:"4px" }}>
                {busy ? "Creating account…" : "✦ Create Account"}
              </button>
            </div>
          )}

          {/* Sign In */}
          {mode === "signin" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {inp(email, setEmail, "Email address", "email")}
              <div style={{ position:"relative" }}>
                {inp(password, setPassword, "Password", showPw?"text":"password")}
                <button onClick={() => setShowPw(s=>!s)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", fontSize:"12px", fontFamily:"'Poppins',sans-serif" }}>{showPw?"Hide":"Show"}</button>
              </div>
              <div style={{ textAlign:"right" }}>
                <button onClick={() => { setMode("forgot"); setErr(""); setMsg(""); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontSize:"12px", fontWeight:"500", cursor:"pointer", fontFamily:"'Poppins',sans-serif", padding:0 }}>Forgot password?</button>
              </div>
              <button onClick={handleLogin} disabled={busy} onMouseEnter={()=>setBtnHov(true)} onMouseLeave={()=>setBtnHov(false)} style={{ ...btnPrimary, opacity:busy?0.6:1 }}>
                {busy ? "Signing in…" : "Sign In →"}
              </button>
            </div>
          )}

          {/* Forgot */}
          {mode === "forgot" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {inp(email, setEmail, "Email address", "email")}
              <button onClick={handleForgot} disabled={busy} onMouseEnter={()=>setBtnHov(true)} onMouseLeave={()=>setBtnHov(false)} style={{ ...btnPrimary, opacity:busy?0.6:1 }}>
                {busy ? "Sending…" : "Send OTP →"}
              </button>
            </div>
          )}

          {/* Reset */}
          {mode === "reset" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {inp(otp, setOtp, "Enter 6-digit OTP")}
              {inp(newPw, setNewPw, "New password (min 6 chars)", "password")}
              <button onClick={handleReset} disabled={busy} onMouseEnter={()=>setBtnHov(true)} onMouseLeave={()=>setBtnHov(false)} style={{ ...btnPrimary, opacity:busy?0.6:1 }}>
                {busy ? "Resetting…" : "Reset Password →"}
              </button>
            </div>
          )}

          {/* Google + features */}
          {(mode === "signin" || mode === "signup") && (
            <>
              <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"18px 0" }}>
                <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.08)" }}/>
                <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.25)", fontWeight:"500" }}>or</span>
                <div style={{ flex:1, height:"1px", background:"rgba(255,255,255,0.08)" }}/>
              </div>
              <button onClick={loginWithGoogle} disabled={loading}
                style={{ width:"100%", padding:"13px 20px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", fontFamily:"'Poppins',sans-serif", transition:"all 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.border="1px solid rgba(124,58,237,0.4)"; e.currentTarget.style.background="rgba(124,58,237,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.border="1px solid rgba(255,255,255,0.1)"; e.currentTarget.style.background="rgba(255,255,255,0.06)"; }} >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span style={{ fontSize:"14px", fontWeight:"500", color:"rgba(255,255,255,0.85)" }}>{loading ? "Loading…" : "Continue with Google"}</span>
              </button>
              <button onClick={loginWithGithub} disabled={loading}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", padding:"13px 20px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:"14px", fontWeight:"500", cursor:"pointer", fontFamily:"'Poppins',sans-serif", marginTop:"10px", transition:"all 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.border="1px solid rgba(124,58,237,0.4)"; e.currentTarget.style.background="rgba(124,58,237,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.border="1px solid rgba(255,255,255,0.1)"; e.currentTarget.style.background="rgba(255,255,255,0.06)"; }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                <span style={{ color:"rgba(255,255,255,0.85)" }}>{loading ? "Loading…" : "Continue with GitHub"}</span>
              </button>


            </>
          )}
        </div>

        <p style={{ textAlign:"center", fontSize:"11.5px", color:"rgba(255,255,255,0.2)", marginTop:"16px" }}>
          By signing in you agree to our <a href="/terms" style={{ color:"#a78bfa", textDecoration:"none" }}>Terms of Service</a>.
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Poppins:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        input::placeholder { color:rgba(255,255,255,0.25); }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

export function VerifyEmail() {
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return; done.current = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) { setMsg("No verification token found."); setStatus("error"); return; }
    fetch(`${BASE}/auth/verify-email`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.detail || "Verification failed");
        setStatus("success");
        setTimeout(() => { window.location.href = "/app"; }, 2000);
      })
      .catch(e => { setMsg(e.message); setStatus("error"); });
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:"#0a0a0a", fontFamily:"'Poppins',sans-serif", padding:"24px", textAlign:"center" }}>
      {status === "loading" && (
        <>
          <div style={{ width:"44px",height:"44px",borderRadius:"50%",border:"3px solid rgba(124,58,237,0.2)",borderTopColor:"#7c3aed",animation:"spin 0.7s linear infinite" }}/>
          <p style={{ color:"rgba(255,255,255,0.5)",fontSize:"14px",fontWeight:"500",margin:0 }}>Verifying your email…</p>
        </>
      )}
      {status === "success" && (
        <>
          <div style={{ fontSize:"40px" }}>✦</div>
          <p style={{ color:"#fff",fontSize:"16px",fontWeight:"700",margin:0 }}>Email verified!</p>
          <p style={{ color:"rgba(255,255,255,0.5)",fontSize:"13px",margin:0 }}>Redirecting you to SocioMee…</p>
        </>
      )}
      {status === "error" && (
        <>
          <p style={{ color:"#ef4444",fontSize:"15px",fontWeight:"700",margin:0 }}>Verification failed</p>
          <p style={{ color:"rgba(255,255,255,0.5)",fontSize:"13px",margin:0 }}>{msg}</p>
          <a href="/app" style={{ color:"#a78bfa",fontSize:"13px",marginTop:"8px" }}>Back to SocioMee</a>
        </>
      )}
    </div>
  );
}

export function ConfirmAge() {
  const { handleCallback } = useAuth();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleConfirm = async () => {
    if (!checked) { setErr("Please confirm you are 18 years or older"); return; }
    setBusy(true); setErr("");
    try {
      const params = new URLSearchParams(window.location.search);
      const pending = params.get("pending");
      const r = await fetch(`${BASE}/auth/confirm-age`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pending }),
      });
      if (r.status === 429) {
        throw new Error("You're moving a bit fast — please wait a moment and try again.");
      }
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Confirmation failed");
      await handleCallback(data.token);
      window.location.href = "/app";
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0a0a", fontFamily:"'Poppins',sans-serif", padding:"24px" }}>
      <div style={{ maxWidth:"380px", width:"100%", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", padding:"32px", textAlign:"center" }}>
        <h2 style={{ color:"#fff", fontSize:"18px", marginBottom:"10px" }}>One last step</h2>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"13px", marginBottom:"24px", lineHeight:1.6 }}>Before continuing, please confirm your age.</p>
        <label style={{ display:"flex", alignItems:"flex-start", gap:"10px", cursor:"pointer", userSelect:"none", marginBottom:"20px", textAlign:"left" }}>
          <div onClick={() => setChecked(c => !c)} style={{ width:"18px", height:"18px", minWidth:"18px", borderRadius:"6px", border: checked ? "1px solid rgba(124,58,237,0.8)" : "1px solid rgba(255,255,255,0.2)", background: checked ? "linear-gradient(135deg,#9b5cf6,#7c3aed)" : "rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", marginTop:"1px", transition:"all 0.2s ease" }}>
            {checked && <span style={{ color:"#fff", fontSize:"11px", fontWeight:"700" }}>✓</span>}
          </div>
          <span onClick={() => setChecked(c => !c)} style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.55)" }}>I confirm I am 18 years of age or older</span>
        </label>
        {err && <p style={{ fontSize:"12px", color:"#ef4444", marginBottom:"14px" }}>{err}</p>}
        <button onClick={handleConfirm} disabled={busy}
          style={{ width:"100%", padding:"14px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.08)", background: busy ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#9b5cf6,#7c3aed)", color:"#fff", fontWeight:"600", fontSize:"14px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Confirming…" : "✦ Continue"}
        </button>
      </div>
    </div>
  );
}
