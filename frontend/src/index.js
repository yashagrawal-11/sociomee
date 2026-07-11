import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthCallback } from "./LoginPage";
import LoginPage from "./LoginPage";
import App from "./App";
import YouTubeCallback from "./YouTubeCallback";

const pulse = {animation:"pulse 1.5s ease-in-out infinite",background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",backgroundSize:"200% 100%"};

function OnboardingPage() {
  const { user } = useAuth();
  const [selected, setSelected] = React.useState(null);

  const Card = ({ id, icon, title, desc }) => (
    <div onClick={() => setSelected(id)} style={{ flex:1, padding:"28px 20px", borderRadius:"20px", border:selected===id?"1px solid rgba(255,255,255,0.25)":"1px solid rgba(255,255,255,0.08)", background:selected===id?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.03)", cursor:"pointer", textAlign:"center", transition:"all 0.15s", backdropFilter:"blur(20px)" }}>
      <div style={{ fontSize:"32px", marginBottom:"12px" }}>{icon}</div>
      <div style={{ fontSize:"15px", fontWeight:"700", color:"#fff", marginBottom:"6px" }}>{title}</div>
      <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>{desc}</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#080810", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"480px" }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"22px", fontWeight:"800", color:"#fff", marginBottom:"8px" }}>How will you use SocioMee?</div>
          <div style={{ fontSize:"14px", color:"rgba(255,255,255,0.35)" }}>This helps us personalise your experience</div>
        </div>
        <div style={{ display:"flex", gap:"12px", marginBottom:"20px" }}>
          <Card id="solo" icon="🎯" title="Solo Creator" desc="I create content for my personal brand or channel"/>
          <Card id="business" icon="🏢" title="Business" desc="I manage content for a brand, agency or team"/>
        </div>
        {selected && (
          <button onClick={() => window.location.href="/pricing"} style={{ width:"100%", padding:"14px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", fontFamily:"inherit", backdropFilter:"blur(20px)", transition:"all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}
          >Continue</button>
        )}
      </div>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap');`}</style>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#0a0a0a",fontFamily:"sans-serif"}}>
      <div style={{width:"220px",flexShrink:0,background:"rgba(6,4,15,0.97)",borderRight:"1px solid rgba(124,58,237,0.1)",padding:"20px 16px",display:"flex",flexDirection:"column",gap:"12px"}}>
        <div style={{height:"22px",borderRadius:"6px",width:"110px",...pulse}}/>
        <div style={{height:"44px",borderRadius:"10px",marginTop:"4px",...pulse}}/>
        <div style={{height:"12px",borderRadius:"4px",width:"60px",marginTop:"12px",...pulse}}/>
        {[1,2,3,4,5,6,7].map(i=><div key={i} style={{height:"32px",borderRadius:"8px",...pulse}}/>)}
      </div>
      <div style={{flex:1,padding:"48px 32px"}}>
        <div style={{maxWidth:"860px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"20px"}}>
          <div style={{height:"40px",borderRadius:"8px",width:"260px",...pulse}}/>
          <div style={{height:"54px",borderRadius:"99px",...pulse,marginTop:"4px"}}/>
        </div>
      </div>
      <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}*{box-sizing:border-box;margin:0;padding:0}"}</style>
    </div>
  );
}

function Router() {
  const { isLoggedIn, loading } = useAuth();
  const path = window.location.pathname;

  if (loading) return <SkeletonLoader/>;

  if (path === "/youtube/callback" || path === "/youtube/callback/") return <YouTubeCallback/>;
  if (path.includes("/auth/callback")) return <AuthCallback/>;
  if (path === "/onboarding") return isLoggedIn ? <OnboardingPage/> : <LoginPage/>;
  if (path === "/login") return isLoggedIn ? <App/> : <LoginPage/>;
  if (!isLoggedIn) return <LoginPage/>;
  return <App/>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Router/>
    </AuthProvider>
  </React.StrictMode>
);
