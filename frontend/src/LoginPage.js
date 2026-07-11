import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

const BASE = "https://sociomeeai.com/api";

const G = {
  bg: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  blur: "blur(20px)",
  pill: "99px",
};

export function AuthCallback() {
  const { handleCallback } = useAuth();
  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return; done.current = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");
    const is_new = params.get("is_new");
    if (token) {
      handleCallback(token)
        .then(() => {
          setStatus("success");
          setTimeout(() => {
            window.location.href = is_new === "true" ? "/onboarding" : "/app";
          }, 800);
        })
        .catch(() => { setMsg("Callback failed."); setStatus("error"); });
    } else { setMsg(error || "No token received."); setStatus("error"); }
  }, [handleCallback]);
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:"#080810", fontFamily:"'DM Sans',sans-serif" }}>
      {status === "loading" && <><div style={{ width:"36px",height:"36px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.08)",borderTopColor:"rgba(255,255,255,0.6)",animation:"spin 0.7s linear infinite" }}/><p style={{ color:"rgba(255,255,255,0.4)",fontSize:"14px",margin:0 }}>Signing you in</p></>}
      {status === "success" && <p style={{ color:"rgba(255,255,255,0.7)",fontSize:"15px",margin:0 }}>Redirecting</p>}
      {status === "error" && <><p style={{ color:"rgba(239,68,68,0.8)",fontSize:"14px",margin:0,maxWidth:"300px",textAlign:"center" }}>{msg}</p><button onClick={() => window.location.href="/app"} style={{ padding:"10px 24px",borderRadius:"99px",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.06)",color:"#fff",fontWeight:"600",cursor:"pointer",fontFamily:"inherit" }}>Go back</button></>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
}

export default function LoginPage() {
  useEffect(() => { document.title = "Login | SocioMee"; return () => { document.title = "SocioMee"; }; }, []);

  const { loginWithGoogle, loginWithGithub, handleCallback, loading } = useAuth();
  const [step, setStep] = useState("main"); // main | email
  const [emailMode, setEmailMode] = useState("detect"); // detect | signin | signup | forgot | reset
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

  const inp = (val, set, ph, type="text") => (
    <input
      value={val} onChange={e => set(e.target.value)}
      placeholder={ph} type={type}
      style={{ width:"100%", padding:"13px 18px", borderRadius:G.pill, border:G.border, background:G.bg, color:"#fff", fontSize:"14px", fontFamily:"inherit", outline:"none", backdropFilter:G.blur }}
      onFocus={e => e.target.style.border="1px solid rgba(255,255,255,0.2)"}
      onBlur={e => e.target.style.border=G.border}
    />
  );

  const Btn = ({ onClick, children, secondary }) => (
    <button onClick={onClick} style={{ width:"100%", padding:"14px", borderRadius:G.pill, border:G.border, background:secondary?"transparent":G.bg, color:secondary?"rgba(255,255,255,0.5)":"#fff", fontWeight:"600", fontSize:"14px", cursor:"pointer", fontFamily:"inherit", backdropFilter:G.blur, transition:"all 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
      onMouseLeave={e => e.currentTarget.style.background=secondary?"transparent":G.bg}
    >{children}</button>
  );

  const IconBtn = ({ onClick, children }) => (
    <button onClick={onClick} style={{ flex:1, padding:"14px", borderRadius:G.pill, border:G.border, background:G.bg, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:G.blur, transition:"all 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
      onMouseLeave={e => e.currentTarget.style.background=G.bg}
    >{children}</button>
  );

  const detectUser = async () => {
    if (!email.trim()) { setErr("Enter your email"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${BASE}/auth/check-email`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) });
      const d = await r.json();
      setEmailMode(d.exists ? "signin" : "signup");
    } catch { setEmailMode("signin"); }
    finally { setBusy(false); }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) { setErr("Enter email and password"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${BASE}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Login failed");
      await handleCallback(d.token);
      window.location.href = "/app";
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleRegister = async () => {
    if (!name.trim()) { setErr("Enter your name"); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirmPw) { setErr("Passwords don't match"); return; }
    if (!ageConfirmed) { setErr("Please confirm you are 18 years or older"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${BASE}/auth/register`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, email, password, age_confirmed: ageConfirmed }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Registration failed");
      await handleCallback(d.token);
      window.location.href = "/onboarding";
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleForgot = async () => {
    if (!email.trim()) { setErr("Enter your email"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${BASE}/auth/forgot-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Failed");
      if (d.otp) setMsg(`Your OTP is: ${d.otp}`); else setMsg("OTP sent to your email.");
      setEmailMode("reset");
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleReset = async () => {
    if (!otp || !newPw) { setErr("Enter OTP and new password"); return; }
    if (newPw.length < 6) { setErr("Password must be at least 6 characters"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${BASE}/auth/reset-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ email, otp, new_password: newPw }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Reset failed");
      setMsg("Password reset. Sign in now.");
      setEmailMode("signin");
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const FacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  );
  const GithubIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#080810", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"400px" }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"28px", fontWeight:"800", color:"#fff", letterSpacing:"-0.5px", marginBottom:"6px" }}>SocioMee AI</div>
          <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.35)" }}>One topic. Infinite content.</div>
        </div>

        {step === "main" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <button onClick={loginWithGoogle} style={{ width:"100%", padding:"14px", borderRadius:G.pill, border:G.border, background:G.bg, color:"#fff", fontWeight:"600", fontSize:"14px", cursor:"pointer", fontFamily:"inherit", backdropFilter:G.blur, display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background=G.bg}
            >
              <GoogleIcon/> Continue with Google
            </button>

            <div style={{ display:"flex", gap:"10px" }}>
              <IconBtn onClick={loginWithGithub}><GithubIcon/></IconBtn>
              <IconBtn onClick={() => window.location.href=`${BASE}/auth/facebook/login`}><FacebookIcon/></IconBtn>
            </div>

            <button onClick={() => setStep("email")} style={{ width:"100%", padding:"14px", borderRadius:G.pill, border:G.border, background:"transparent", color:"rgba(255,255,255,0.55)", fontWeight:"600", fontSize:"14px", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Continue with Email
            </button>

            <p style={{ textAlign:"center", fontSize:"11px", color:"rgba(255,255,255,0.2)", marginTop:"8px", lineHeight:1.6 }}>
              By continuing, you agree to our{" "}
              <a href="/terms" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"underline" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"underline" }}>Privacy Policy</a>
            </p>
          </div>
        )}

        {step === "email" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {emailMode === "detect" && (
              <>
                {inp(email, setEmail, "Email address", "email")}
                {err && <p style={{ color:"rgba(239,68,68,0.8)", fontSize:"12px", textAlign:"center", margin:0 }}>{err}</p>}
                <Btn onClick={detectUser}>{busy ? "Checking..." : "Continue"}</Btn>
                <Btn secondary onClick={() => setStep("main")}>Back</Btn>
              </>
            )}

            {emailMode === "signin" && (
              <>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)", textAlign:"center", marginBottom:"4px" }}>{email}</div>
                {inp(password, setPassword, "Password", showPw?"text":"password")}
                <button onClick={() => setShowPw(p=>!p)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", textAlign:"right" }}>{showPw?"Hide":"Show"} password</button>
                {err && <p style={{ color:"rgba(239,68,68,0.8)", fontSize:"12px", textAlign:"center", margin:0 }}>{err}</p>}
                {msg && <p style={{ color:"rgba(16,185,129,0.8)", fontSize:"12px", textAlign:"center", margin:0 }}>{msg}</p>}
                <Btn onClick={handleLogin}>{busy ? "Signing in..." : "Sign In"}</Btn>
                <Btn secondary onClick={() => setEmailMode("forgot")}>Forgot password</Btn>
                <Btn secondary onClick={() => setStep("main")}>Back</Btn>
              </>
            )}

            {emailMode === "signup" && (
              <>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.35)", textAlign:"center", marginBottom:"4px" }}>{email}</div>
                {inp(name, setName, "Your name")}
                {inp(password, setPassword, "Create password", "password")}
                {inp(confirmPw, setConfirmPw, "Confirm password", "password")}
                <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", padding:"4px 0" }}>
                  <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} style={{ width:"16px", height:"16px", accentColor:"#fff", cursor:"pointer" }}/>
                  <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>I confirm I am 18 years or older</span>
                </label>
                {err && <p style={{ color:"rgba(239,68,68,0.8)", fontSize:"12px", textAlign:"center", margin:0 }}>{err}</p>}
                <Btn onClick={handleRegister}>{busy ? "Creating account..." : "Create Account"}</Btn>
                <Btn secondary onClick={() => setStep("main")}>Back</Btn>
              </>
            )}

            {emailMode === "forgot" && (
              <>
                {inp(email, setEmail, "Email address", "email")}
                {err && <p style={{ color:"rgba(239,68,68,0.8)", fontSize:"12px", textAlign:"center", margin:0 }}>{err}</p>}
                {msg && <p style={{ color:"rgba(16,185,129,0.8)", fontSize:"12px", textAlign:"center", margin:0 }}>{msg}</p>}
                <Btn onClick={handleForgot}>{busy ? "Sending..." : "Send OTP"}</Btn>
                <Btn secondary onClick={() => setEmailMode("signin")}>Back to sign in</Btn>
              </>
            )}

            {emailMode === "reset" && (
              <>
                {inp(otp, setOtp, "Enter OTP")}
                {inp(newPw, setNewPw, "New password", "password")}
                {err && <p style={{ color:"rgba(239,68,68,0.8)", fontSize:"12px", textAlign:"center", margin:0 }}>{err}</p>}
                {msg && <p style={{ color:"rgba(16,185,129,0.8)", fontSize:"12px", textAlign:"center", margin:0 }}>{msg}</p>}
                <Btn onClick={handleReset}>{busy ? "Resetting..." : "Reset Password"}</Btn>
              </>
            )}

            <p style={{ textAlign:"center", fontSize:"11px", color:"rgba(255,255,255,0.2)", marginTop:"4px", lineHeight:1.6 }}>
              By continuing, you agree to our{" "}
              <a href="/terms" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"underline" }}>Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" style={{ color:"rgba(255,255,255,0.4)", textDecoration:"underline" }}>Privacy Policy</a>
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}
