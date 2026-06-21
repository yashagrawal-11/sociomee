import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthCallback } from "./LoginPage";
import { ConfirmAge } from "./LoginPage";
import LoginPage from "./LoginPage";
import App from "./App";
import YouTubeCallback from "./YouTubeCallback";

function Router() {
  const { isLoggedIn, loading } = useAuth();
  const path = window.location.pathname;

  const pulse = {animation:"pulse 1.5s ease-in-out infinite",background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",backgroundSize:"200% 100%"};
  if (loading) return (
    <div style={{display:"flex",minHeight:"100vh",background:"#0a0a0a",fontFamily:"sans-serif"}}>
      <div style={{width:"220px",flexShrink:0,background:"rgba(6,4,15,0.97)",borderRight:"1px solid rgba(124,58,237,0.1)",padding:"20px 16px",display:"flex",flexDirection:"column",gap:"12px"}}>
        <div style={{height:"22px",borderRadius:"6px",width:"110px",...pulse}}/>
        <div style={{height:"44px",borderRadius:"10px",marginTop:"4px",...pulse}}/>
        <div style={{height:"12px",borderRadius:"4px",width:"60px",marginTop:"12px",...pulse}}/>
        {[1,2,3,4,5,6,7].map(i=><div key={i} style={{height:"32px",borderRadius:"8px",...pulse}}/>)}
        <div style={{height:"12px",borderRadius:"4px",width:"50px",marginTop:"4px",...pulse}}/>
        {[1,2,3].map(i=><div key={i} style={{height:"28px",borderRadius:"6px",...pulse}}/>)}
      </div>
      <div style={{flex:1,padding:"48px 32px"}}>
        <div style={{maxWidth:"860px",margin:"0 auto",display:"flex",flexDirection:"column",gap:"20px"}}>
          <div style={{height:"40px",borderRadius:"8px",width:"260px",...pulse}}/>
          <div style={{height:"18px",borderRadius:"4px",width:"160px",...pulse}}/>
          <div style={{height:"54px",borderRadius:"99px",...pulse,marginTop:"4px"}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
            {[1,2,3,4,5,6,7,8].map(i=><div key={i} style={{height:"70px",borderRadius:"28px",...pulse}}/>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"16px"}}>
            {[1,2,3].map(i=><div key={i} style={{height:"44px",borderRadius:"99px",...pulse}}/>)}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
            {[1,2,3,4,5,6,7,8,9,10].map(i=><div key={i} style={{height:"34px",width:"80px",borderRadius:"99px",...pulse}}/>)}
          </div>
          <div style={{height:"54px",borderRadius:"99px",...pulse}}/>
        </div>
      </div>
      <style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}*{box-sizing:border-box;margin:0;padding:0}"}</style>
    </div>
  );

  // YouTube OAuth callback — must be before login check
  if (path === "/youtube/callback") return <YouTubeCallback />;

  // Google login callback
  if (path.includes("/auth/callback")) return <AuthCallback />;
  if (path === "/app/confirm-age") return <ConfirmAge />;

  if (!isLoggedIn) return <LoginPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);