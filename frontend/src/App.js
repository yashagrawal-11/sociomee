import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const C = {
  rose:"#ff3d8f",roseDeep:"#d4006e",roseLt:"#ff85be",roseXlt:"#fff0f7",
  purple:"#7c3aed",purpleLt:"#c4b5fd",purpleXlt:"#f5f3ff",
  teal:"#0891b2",gold:"#f59e0b",goldLt:"#fef3c7",
  ink:"#0d0015",slate:"#3b1f4e",muted:"#8b6b9a",
  hairline:"rgba(124,58,237,0.12)",
  success:"#10b981",warn:"#f59e0b",danger:"#ef4444",
  glass:"rgba(255,255,255,0.68)",white:"#ffffff",
};

const BASE = "http://127.0.0.1:8000";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const PERSONAS = [
  {id:"dhruvrathee",label:"Dhruv Rathee",flag:"📊",lang:"hinglish"},
  {id:"carryminati",label:"CarryMinati",flag:"💀",lang:"hinglish"},
  {id:"samayraina",label:"Samay Raina",flag:"😶",lang:"hinglish"},
  {id:"rebelkid",label:"RebelKid",flag:"🔥",lang:"hinglish"},
  {id:"shahrukhkhan",label:"Shah Rukh Khan",flag:"🌙",lang:"hinglish"},
  {id:"mrbeast",label:"MrBeast",flag:"🤯",lang:"english"},
  {id:"alexhormozi",label:"Alex Hormozi",flag:"📈",lang:"english"},
  {id:"joerogan",label:"Joe Rogan",flag:"🎙️",lang:"english"},
  {id:"default",label:"Default",flag:"✨",lang:"hinglish"},
];

const PLATFORMS = [
  {id:"youtube",label:"YouTube",icon:"▶",color:"#ff0000"},
  {id:"instagram",label:"Instagram",icon:"📸",color:"#e1306c"},
  {id:"tiktok",label:"TikTok",icon:"🎵",color:"#010101"},
  {id:"x",label:"X",icon:"𝕏",color:"#000000"},
  {id:"facebook",label:"Facebook",icon:"f",color:"#1877f2"},
  {id:"threads",label:"Threads",icon:"@",color:"#000000"},
  {id:"pinterest",label:"Pinterest",icon:"P",color:"#e60023"},
  {id:"telegram",label:"Telegram",icon:"✈",color:"#2aabee"},
];

const TONES = [
  {id:"bold",emoji:"🔥",color:"#ff4d4d"},
  {id:"funny",emoji:"😂",color:C.warn},
  {id:"emotional",emoji:"💖",color:C.rose},
  {id:"informative",emoji:"📚",color:C.purple},
  {id:"aggressive",emoji:"⚡",color:"#6d28d9"},
];

const PRO_FEATURES = [
  {icon:"📜",text:"3000-5000 word deep research scripts"},
  {icon:"🌐",text:"Full SEO packs for all 8 platforms"},
  {icon:"💡",text:"Per-title improvement tips"},
  {icon:"🖼️",text:"Thumbnail analyzer"},
  {icon:"⚖️",text:"Thumbnail A/B comparator"},
  {icon:"📺",text:"YouTube account connect (soon)"},
  {icon:"🔍",text:"Competitor analysis (soon)"},
  {icon:"💳",text:"200 credits / day"},
];

const scoreColor = (n) => {
  const v = Number(n||0);
  if (v>=80) return C.success;
  if (v>=55) return C.warn;
  return C.danger;
};

// ── Upgrade Popup ─────────────────────────────────────────────────────
function UpgradePopup({onClose,onSuccess,triggerReason="limit"}) {
  const [paying,setPaying]   = useState(false);
  const [payErr,setPayErr]   = useState("");
  const [success,setSuccess] = useState(false);

  const handleUpgrade = async () => {
    setPaying(true); setPayErr("");
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay SDK failed to load. Check your internet connection.");
      const res = await fetch(`${BASE}/payment/create-order`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({user_id: localStorage.getItem("sociomee_user_id") || "default_user", plan:"pro"}),
      });
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.detail||"Failed to create order."); }
      const order = await res.json();
      const rzp = new window.Razorpay({
        key:order.key_id, amount:order.amount, currency:order.currency,
        name:"SocioMee", description:order.plan_label, order_id:order.order_id,
        theme:{color:C.purple}, modal:{ondismiss:()=>setPaying(false)},
        handler: async (response) => {
          try {
            const verify = await fetch(`${BASE}/payment/verify`,{
              method:"POST",headers:{"Content-Type":"application/json"},
              body:JSON.stringify({
                user_id: localStorage.getItem("sociomee_user_id") || "default_user", plan:"pro",
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });
            const result = await verify.json();
            if (result.success) { setSuccess(true); setTimeout(()=>{ onSuccess(result); onClose(); }, 2200); }
            else { setPayErr("Payment could not be verified. Contact support."); }
          } catch { setPayErr("Verification failed. Contact support."); }
          finally { setPaying(false); }
        },
      });
      rzp.open();
    } catch(e) { setPayErr(e.message||"Payment failed. Please try again."); setPaying(false); }
  };

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) onClose(); }} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(13,0,21,0.72)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",animation:"fadeInBD 0.2s ease"}}>
      <div style={{width:"100%",maxWidth:"460px",background:"linear-gradient(145deg,#fff0f7 0%,#f5f3ff 55%,#eff6ff 100%)",borderRadius:"28px",boxShadow:`0 40px 100px rgba(124,58,237,0.28),0 0 0 1px rgba(124,58,237,0.15)`,overflow:"hidden",animation:"slideUpM 0.25s cubic-bezier(.4,0,.2,1)"}}>
        {success ? (
          <div style={{padding:"52px 32px",textAlign:"center"}}>
            <div style={{fontSize:"56px",marginBottom:"16px"}}>🎉</div>
            <h2 style={{fontSize:"22px",fontWeight:"900",color:C.ink,marginBottom:"8px"}}>Welcome to Pro!</h2>
            <p style={{fontSize:"14px",color:C.muted,lineHeight:1.6}}>Your account has been upgraded. Enjoy deep research scripts, full SEO packs, and thumbnail tools.</p>
          </div>
        ) : (
          <>
            <div style={{background:`linear-gradient(135deg,${C.purple},${C.rose})`,padding:"28px 32px 24px",position:"relative"}}>
              <button onClick={onClose} style={{position:"absolute",top:"16px",right:"16px",background:"rgba(255,255,255,0.2)",border:"none",color:C.white,width:"30px",height:"30px",borderRadius:"50%",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                <span style={{fontSize:"26px"}}>✦</span>
                <span style={{fontSize:"12px",fontWeight:"900",letterSpacing:"2px",textTransform:"uppercase",color:"rgba(255,255,255,0.85)"}}>SocioMee Pro</span>
              </div>
              {triggerReason==="limit" ? (
                <><h2 style={{fontSize:"21px",fontWeight:"900",color:C.white,marginBottom:"6px",lineHeight:1.2}}>You've used all 30 free credits today 🔒</h2><p style={{fontSize:"13px",color:"rgba(255,255,255,0.78)",lineHeight:1.5}}>Upgrade to Pro for 200 credits/day, deep research scripts, full SEO packs, and more.</p></>
              ) : (
                <><h2 style={{fontSize:"21px",fontWeight:"900",color:C.white,marginBottom:"6px",lineHeight:1.2}}>This is a Pro feature ✦</h2><p style={{fontSize:"13px",color:"rgba(255,255,255,0.78)",lineHeight:1.5}}>Upgrade to unlock deep research scripts, full SEO packs, and thumbnail tools.</p></>
              )}
            </div>
            <div style={{padding:"18px 32px 0"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {PRO_FEATURES.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"7px"}}>
                    <span style={{fontSize:"15px",flexShrink:0}}>{f.icon}</span>
                    <span style={{fontSize:"12px",color:C.slate,fontWeight:"500",lineHeight:1.4}}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:"18px 32px 28px"}}>
              <div style={{textAlign:"center",marginBottom:"16px"}}>
                <span style={{fontSize:"40px",fontWeight:"900",color:C.ink,letterSpacing:"-1px"}}>₹599</span>
                <span style={{fontSize:"15px",color:C.muted,fontWeight:"500"}}>/month</span>
                <div style={{fontSize:"11.5px",color:C.success,fontWeight:"700",marginTop:"3px"}}>Cancel anytime · Instant activation</div>
              </div>
              {payErr && <div style={{background:C.danger+"14",border:`1px solid ${C.danger}33`,borderRadius:"10px",padding:"10px 14px",fontSize:"12.5px",color:C.danger,fontWeight:"600",marginBottom:"12px",textAlign:"center"}}>⚠ {payErr}</div>}
              <button onClick={handleUpgrade} disabled={paying} style={{width:"100%",padding:"16px",borderRadius:"14px",border:"none",background:paying?"rgba(124,58,237,0.4)":`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontWeight:"900",fontSize:"16px",cursor:paying?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.3px",boxShadow:paying?"none":`0 12px 32px rgba(124,58,237,0.45)`,transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
                {paying ? <><div style={{width:"18px",height:"18px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:C.white,animation:"spin 0.7s linear infinite"}}/>Processing…</> : <>⚡ Upgrade to Pro — ₹599/month</>}
              </button>
              <div style={{textAlign:"center",marginTop:"12px",fontSize:"11px",color:C.muted,fontWeight:"500"}}>🔒 Secured by Razorpay · UPI, Cards, NetBanking accepted</div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes fadeInBD{from{opacity:0}to{opacity:1}} @keyframes slideUpM{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

// ── Micro components ──────────────────────────────────────────────────
function CopyBtn({text,size="sm"}) {
  const [copied,setCopied]=useState(false);
  const copy=()=>{navigator.clipboard.writeText(String(text||""));setCopied(true);setTimeout(()=>setCopied(false),1800);};
  const sz=size==="sm"?{padding:"4px 10px",fontSize:"11px"}:{padding:"7px 14px",fontSize:"12px"};
  return <button onClick={copy} style={{...sz,fontWeight:"800",cursor:"pointer",borderRadius:"8px",border:`1px solid ${copied?C.success+"55":C.hairline}`,background:copied?C.success+"18":"rgba(255,255,255,0.6)",color:copied?C.success:C.muted,fontFamily:"inherit",transition:"all 0.18s"}}>{copied?"✓ Copied":"Copy"}</button>;
}

function SectionHead({icon,title,copyText,children}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
      <span style={{fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.4px",textTransform:"uppercase",color:C.muted}}>
        {icon&&<span style={{marginRight:"6px"}}>{icon}</span>}{title}
      </span>
      <div style={{display:"flex",gap:"6px",alignItems:"center"}}>{children}{copyText&&<CopyBtn text={copyText}/>}</div>
    </div>
  );
}

function Card({children,style={}}) {
  return <div style={{background:C.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:`1px solid ${C.hairline}`,borderRadius:"20px",padding:"24px",boxShadow:"0 8px 32px rgba(124,58,237,0.07)",...style}}>{children}</div>;
}

function Divider() {
  return <div style={{height:"1px",background:`linear-gradient(90deg,transparent,${C.hairline} 40%,transparent)`,margin:"20px 0"}}/>;
}

function Pill({children,color=C.purple,style={}}) {
  return <span style={{display:"inline-block",padding:"5px 13px",borderRadius:"99px",fontSize:"12.5px",fontWeight:"600",background:color+"18",color,border:`1px solid ${color}30`,marginRight:"6px",marginBottom:"6px",...style}}>{children}</span>;
}

function ScoreBar({label,value,emoji}) {
  const col=scoreColor(value);
  return (
    <div style={{marginBottom:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <span style={{fontSize:"13px",fontWeight:"600",color:C.ink}}>{emoji} {label}</span>
        <span style={{fontSize:"12px",fontWeight:"800",padding:"2px 10px",borderRadius:"99px",background:col+"20",color:col,border:`1px solid ${col}33`}}>{value}/100</span>
      </div>
      <div style={{height:"6px",borderRadius:"99px",background:"rgba(200,160,220,0.3)",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,borderRadius:"99px",background:`linear-gradient(90deg,${col}88,${col})`,transition:"width 0.9s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 6px ${col}55`}}/>
      </div>
    </div>
  );
}

function Spinner({label="Generating…"}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"44px 0",gap:"16px"}}>
      <div style={{position:"relative",width:"52px",height:"52px"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:`3px solid ${C.purple}22`,borderTopColor:C.purple,animation:"spin 0.7s linear infinite"}}/>
        <div style={{position:"absolute",inset:"8px",borderRadius:"50%",border:`2px solid ${C.rose}22`,borderTopColor:C.rose,animation:"spin 1.1s linear infinite reverse"}}/>
      </div>
      <p style={{color:C.muted,fontSize:"13px",fontWeight:"700"}}>{label}</p>
    </div>
  );
}

function ProLock({label,onUpgradeClick,children}) {
  return (
    <div style={{position:"relative"}}>
      <div style={{filter:"blur(3px)",pointerEvents:"none",userSelect:"none",opacity:0.45}}>{children}</div>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"10px",background:"rgba(245,243,255,0.85)",backdropFilter:"blur(2px)",borderRadius:"14px",border:`1.5px solid ${C.purple}33`}}>
        <span style={{fontSize:"24px"}}>🔒</span>
        <span style={{fontSize:"13px",fontWeight:"800",color:C.slate}}>{label}</span>
        <button onClick={onUpgradeClick} style={{padding:"8px 20px",borderRadius:"99px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontSize:"12.5px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit",boxShadow:`0 6px 18px ${C.purple}44`}}>✦ Unlock with Pro — ₹599/month</button>
      </div>
    </div>
  );
}

function CreditBadge({creditStatus,onUpgradeClick}) {
  if (!creditStatus) return null;
  const {credits_left=0,daily_limit=30,plan="free",plan_label="Free",resets_at=""} = creditStatus;
  const pct   = Math.round((credits_left/Math.max(daily_limit,1))*100);
  const col   = credits_left>daily_limit*0.5?C.success:credits_left>0?C.warn:C.danger;
  const isPro = plan!=="free";
  const reset = resets_at?new Date(resets_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";
  return (
    <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",background:C.glass,backdropFilter:"blur(16px)",border:`1px solid ${C.hairline}`,borderRadius:"14px",padding:"11px 16px",marginBottom:"22px",boxShadow:"0 4px 16px rgba(124,58,237,0.07)"}}>
      <span style={{fontSize:"10px",fontWeight:"900",letterSpacing:"1.2px",textTransform:"uppercase",padding:"3px 10px",borderRadius:"99px",background:isPro?`linear-gradient(135deg,${C.purple},${C.rose})`:"rgba(139,107,154,0.15)",color:isPro?C.white:C.muted,border:isPro?"none":"1px solid rgba(139,107,154,0.3)"}}>
        {isPro?`✦ ${plan_label}`:plan_label}
      </span>
      <div style={{display:"flex",alignItems:"center",gap:"8px",flex:1}}>
        <span style={{fontSize:"13px",fontWeight:"800",color:col}}>{credits_left}</span>
        <span style={{fontSize:"12px",color:C.muted,fontWeight:"500"}}>/ {daily_limit} credits</span>
        <div style={{flex:1,height:"5px",borderRadius:"99px",background:"rgba(200,160,220,0.25)",overflow:"hidden",minWidth:"48px"}}>
          <div style={{height:"100%",width:`${pct}%`,borderRadius:"99px",background:`linear-gradient(90deg,${col}88,${col})`,transition:"width 0.6s ease"}}/>
        </div>
      </div>
      {reset&&<span style={{fontSize:"10px",color:C.muted,fontWeight:"500"}}>Resets {reset}</span>}
      {!isPro&&(
        <button onClick={onUpgradeClick} style={{padding:"6px 14px",borderRadius:"99px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontSize:"11.5px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${C.purple}44`,whiteSpace:"nowrap"}}>
          ✦ Upgrade ₹599
        </button>
      )}
    </div>
  );
}

function TitlePicker({titlesWithScore=[],bestTitle="",isPro,onUpgradeClick}) {
  const [sel,setSel]=useState(0);
  if (!titlesWithScore.length&&!bestTitle) return null;
  const selTitle=titlesWithScore[sel]?.title||bestTitle;
  return (
    <div style={{marginBottom:"24px"}}>
      <SectionHead icon="🎯" title="Title Candidates" copyText={titlesWithScore.map(t=>t.title).join("\n")}/>
      {titlesWithScore.map((item,i)=>{
        const score=Number(item.seo_score||item.score||0);
        const col=scoreColor(score);
        const isA=i===sel;
        return (
          <button key={i} onClick={()=>setSel(i)} style={{width:"100%",textAlign:"left",cursor:"pointer",marginBottom:"8px",background:isA?`${C.purple}10`:"rgba(255,255,255,0.55)",border:`1.5px solid ${isA?C.purple:C.hairline}`,borderRadius:"12px",padding:"12px 16px",fontFamily:"inherit",boxShadow:isA?`0 0 0 3px ${C.purple}18`:"none",transition:"all 0.15s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px"}}>
              <span style={{fontWeight:"600",lineHeight:1.45,flex:1,color:C.ink,fontSize:"14px"}}>
                {isA&&<span style={{color:C.purple,marginRight:"6px"}}>✦</span>}{item.title}
              </span>
              <span style={{fontSize:"11px",fontWeight:"800",padding:"2px 9px",borderRadius:"99px",background:col+"20",color:col,border:`1px solid ${col}33`,flexShrink:0}}>{score}/100</span>
            </div>
            {isA&&item.tips?.length>0&&(
              isPro?(
                <div style={{marginTop:"8px",paddingTop:"8px",borderTop:`1px solid ${C.hairline}`}}>
                  {item.tips.map((tip,j)=><div key={j} style={{display:"flex",gap:"6px",fontSize:"11.5px",color:C.slate,marginBottom:"3px",lineHeight:1.45}}><span style={{color:C.rose,flexShrink:0}}>→</span><span>{tip}</span></div>)}
                </div>
              ):(
                <div style={{marginTop:"8px",paddingTop:"8px",borderTop:`1px solid ${C.hairline}`,display:"flex",alignItems:"center",gap:"6px"}}>
                  <span style={{fontSize:"12px"}}>🔒</span>
                  <span style={{fontSize:"11.5px",color:C.muted}}>SEO tips are Pro.{" "}<span onClick={onUpgradeClick} style={{color:C.purple,fontWeight:"700",cursor:"pointer",textDecoration:"underline"}}>Upgrade ₹599</span></span>
                </div>
              )
            )}
          </button>
        );
      })}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"10px",background:`${C.purple}08`,border:`1.5px solid ${C.purple}33`,borderRadius:"12px",padding:"12px 16px"}}>
        <span style={{fontWeight:"700",color:C.ink,fontSize:"14px",flex:1,marginRight:"10px"}}>{selTitle}</span>
        <CopyBtn text={selTitle} size="md"/>
      </div>
    </div>
  );
}

function PlatformSEOTabs({seoPacks={},defaultPlatform="youtube",isPro,onUpgradeClick}) {
  const all=Object.keys(seoPacks).filter(k=>seoPacks[k]&&Object.keys(seoPacks[k]).length>0);
  const [active,setActive]=useState(all.includes(defaultPlatform)?defaultPlatform:all[0]||"youtube");
  if (!all.length) return null;
  const meta={youtube:{icon:"▶",color:"#ff0000"},instagram:{icon:"📸",color:"#e1306c"},tiktok:{icon:"🎵",color:"#010101"},x:{icon:"𝕏",color:"#000000"},facebook:{icon:"f",color:"#1877f2"},threads:{icon:"@",color:"#000000"},pinterest:{icon:"P",color:"#e60023"},telegram:{icon:"✈",color:"#2aabee"}};
  const pack=seoPacks[active]||{};
  const content=(
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {(pack.description||pack.caption||pack.post)&&(<div><SectionHead icon="📝" title={active==="youtube"?"Description":"Caption / Post"} copyText={pack.description||pack.caption||pack.post}/><div style={{background:"rgba(255,255,255,0.55)",borderRadius:"12px",padding:"14px 16px",fontSize:"13px",lineHeight:1.7,whiteSpace:"pre-wrap",color:C.ink,border:`1px solid ${C.hairline}`,fontFamily:"inherit",maxHeight:"200px",overflowY:"auto"}}>{pack.description||pack.caption||pack.post}</div></div>)}
      {active==="youtube"&&pack.timestamps?.length>0&&(<div><SectionHead icon="⏱️" title="Timestamps" copyText={pack.timestamps.join("\n")}/><div style={{background:"rgba(255,255,255,0.55)",borderRadius:"10px",padding:"10px 14px",border:`1px solid ${C.hairline}`}}>{pack.timestamps.map((t,i)=><div key={i} style={{fontSize:"13px",color:C.ink,padding:"2px 0",borderBottom:i<pack.timestamps.length-1?`1px solid ${C.hairline}`:"none"}}>{t}</div>)}</div></div>)}
      {active==="youtube"&&pack.pinned_comment&&(<div><SectionHead icon="📌" title="Pinned Comment" copyText={pack.pinned_comment}/><div style={{background:`${C.purple}08`,border:`1px solid ${C.purple}22`,borderRadius:"10px",padding:"10px 14px",fontSize:"13px",lineHeight:1.6,color:C.ink}}>{pack.pinned_comment}</div></div>)}
      {active==="x"&&pack.tweet_variants?.length>0&&(<div><SectionHead icon="🐦" title="Tweets" copyText={pack.tweet_variants.join("\n\n")}/>{pack.tweet_variants.map((t,i)=><div key={i} style={{background:"rgba(255,255,255,0.55)",borderRadius:"10px",padding:"10px 14px",marginBottom:"7px",fontSize:"14px",color:C.ink,border:`1px solid ${C.hairline}`,lineHeight:1.55,position:"relative"}}>{t}<div style={{position:"absolute",top:"8px",right:"8px"}}><CopyBtn text={t}/></div></div>)}</div>)}
      {active==="tiktok"&&pack.hooks?.length>0&&(<div><SectionHead icon="🎣" title="TikTok Hooks" copyText={pack.hooks.join("\n")}/>{pack.hooks.map((h,i)=><div key={i} style={{background:"rgba(255,255,255,0.55)",borderRadius:"10px",padding:"10px 14px",marginBottom:"6px",fontSize:"13px",color:C.ink,border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${C.rose}`}}>{h}</div>)}</div>)}
      {pack.hashtags?.length>0&&(<div><SectionHead icon="🏷️" title="Hashtags" copyText={pack.hashtags.join(" ")}/><div style={{display:"flex",flexWrap:"wrap"}}>{pack.hashtags.map((h,i)=><Pill key={i} color={C.rose}>{h}</Pill>)}</div></div>)}
    </div>
  );
  return (
    <div style={{marginBottom:"24px"}}>
      <SectionHead icon="🌐" title="Platform SEO Packs"/>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
        {all.map(p=>{ const pm=meta[p]||{icon:"●",color:C.purple}; const isA=active===p; return <button key={p} onClick={()=>setActive(p)} style={{padding:"5px 13px",borderRadius:"99px",border:`1.5px solid ${isA?pm.color:C.hairline}`,background:isA?pm.color+"18":"rgba(255,255,255,0.5)",color:isA?pm.color:C.muted,fontWeight:"700",fontSize:"11.5px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.14s"}}>{pm.icon} {p.charAt(0).toUpperCase()+p.slice(1)}</button>; })}
      </div>
      {isPro?content:<ProLock label="Full platform SEO packs — Pro feature" onUpgradeClick={onUpgradeClick}>{content}</ProLock>}
    </div>
  );
}

function ThumbnailStudio({keyword,title,isPro,onUpgradeClick}) {
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState("");
  const [drag,setDrag]=useState(false);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [err,setErr]=useState("");
  const handleFile=f=>{if(!f||!f.type.startsWith("image/"))return;setFile(f);setPreview(URL.createObjectURL(f));setResult(null);setErr("");};
  const analyze=async()=>{
    if(!file){setErr("Upload a thumbnail first.");return;}
    setLoading(true);setErr("");setResult(null);
    try{
      const form=new FormData();
      form.append("file",file);form.append("keyword",keyword||"general");form.append("niche",keyword||"general");form.append("title",title||"");
      const res=await fetch(`${BASE}/thumbnail/analyze`,{method:"POST",body:form});
      if(!res.ok)throw new Error(`Server error ${res.status}`);
      setResult(await res.json());
    }catch(e){setErr(e.message||"Analysis failed.");}
    finally{setLoading(false);}
  };
  const sc=v=>v>=75?C.success:v>=50?C.warn:C.danger;
  if (!isPro) return (
    <div style={{marginTop:"24px",borderTop:`1px solid ${C.hairline}`,paddingTop:"24px"}}>
      <SectionHead icon="🖼️" title="Thumbnail Studio"/>
      <ProLock label="Thumbnail Studio — Pro feature" onUpgradeClick={onUpgradeClick}><div style={{padding:"20px",background:"rgba(255,255,255,0.4)",borderRadius:"12px",fontSize:"13px",color:C.muted,textAlign:"center"}}>Upload · Analyze · Score your thumbnail</div></ProLock>
    </div>
  );
  return (
    <div style={{marginTop:"24px",borderTop:`1px solid ${C.hairline}`,paddingTop:"24px"}}>
      <SectionHead icon="🖼️" title="Thumbnail Studio"/>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}} style={{border:`2px dashed ${drag?C.purple:file?C.success:"rgba(124,58,237,0.3)"}`,borderRadius:"14px",padding:"20px",textAlign:"center",background:drag?`${C.purple}08`:"rgba(255,255,255,0.4)",cursor:"pointer",transition:"all 0.2s",position:"relative"}}>
        <input type="file" accept="image/*" style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}} onChange={e=>handleFile(e.target.files[0])}/>
        {file?<div><span style={{color:C.success,fontWeight:"700",fontSize:"13px"}}>✅ {file.name}</span><br/><span style={{fontSize:"11px",color:C.muted}}>Drop another to replace</span></div>:<div><span style={{fontSize:"22px"}}>🖼️</span><br/><span style={{color:C.purple,fontWeight:"700",fontSize:"13px"}}>{drag?"Drop it!":"Click or drag thumbnail"}</span><br/><span style={{fontSize:"11px",color:C.muted}}>PNG, JPG, WEBP · 16:9</span></div>}
      </div>
      {preview&&<div style={{background:"#0f0f10",borderRadius:"14px",padding:"12px",marginTop:"12px",border:"1px solid #1e1e1e"}}><img src={preview} alt="preview" style={{width:"100%",borderRadius:"8px",aspectRatio:"16/9",objectFit:"cover",display:"block"}}/></div>}
      {err&&<div style={{marginTop:"10px",padding:"10px 14px",background:C.danger+"14",borderRadius:"10px",border:`1px solid ${C.danger}33`,fontSize:"12.5px",color:C.danger,fontWeight:"600"}}>⚠ {err}</div>}
      <button onClick={analyze} disabled={loading||!file} style={{width:"100%",marginTop:"12px",padding:"13px",borderRadius:"12px",border:"none",background:loading||!file?"rgba(124,58,237,0.3)":`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontWeight:"800",fontSize:"14px",cursor:loading||!file?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>{loading?"Analyzing…":"✦ Analyze Thumbnail"}</button>
      {result&&(
        <div style={{marginTop:"16px"}}>
          {result.fit_score!==undefined&&(<div style={{marginBottom:"10px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}><span style={{fontSize:"11px",fontWeight:"800",textTransform:"uppercase",letterSpacing:"1px",color:C.muted}}>Fit Score</span><span style={{fontSize:"12px",fontWeight:"800",padding:"2px 9px",borderRadius:"99px",background:sc(result.fit_score)+"20",color:sc(result.fit_score),border:`1px solid ${sc(result.fit_score)}33`}}>{result.fit_score}/100</span></div><div style={{height:"6px",borderRadius:"99px",background:"rgba(200,160,220,0.3)",overflow:"hidden"}}><div style={{height:"100%",width:`${result.fit_score}%`,borderRadius:"99px",background:`linear-gradient(90deg,${sc(result.fit_score)}88,${sc(result.fit_score)})`,transition:"width 0.9s ease"}}/></div></div>)}
          {result.verdict&&<div style={{background:"rgba(255,255,255,0.55)",border:`1px solid ${C.hairline}`,borderRadius:"10px",padding:"10px 14px",fontSize:"13px",fontWeight:"700",color:C.ink,marginBottom:"10px"}}>{/good|great|excellent|strong|high/i.test(result.verdict)?"✅":"⚠️"} {result.verdict}</div>}
          {result.suggestions?.map((s,i)=><div key={i} style={{display:"flex",gap:"8px",fontSize:"12.5px",color:C.slate,marginBottom:"6px",lineHeight:1.5,fontWeight:"500"}}><span style={{color:C.rose,flexShrink:0}}>→</span><span>{s}</span></div>)}
        </div>
      )}
    </div>
  );
}

function ResultPanel({result,platform,keyword,isPro,onUpgradeClick}) {
  if (!result) return null;
  const scores=result.scores||{};
  const beats=result.beats||[];
  const sections=result.sections||[];
  const seoPacks=result.seo_packs||{};
  const titlesWS=result.titles_with_score||[];
  const rawScript=result.script_text||"";
  const words=rawScript.split(/\s+/).filter(Boolean);
  const isCapped=!isPro&&words.length>500;
  const displayScript=isCapped?words.slice(0,500).join(" ")+"\n\n[...Full script available with Pro]":rawScript;
  return (
    <Card style={{marginTop:"20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
        <div>
          <span style={{fontSize:"17px",fontWeight:"900",color:C.ink,letterSpacing:"-0.5px"}}>{(result.platform||platform).charAt(0).toUpperCase()+(result.platform||platform).slice(1)}<span style={{color:C.rose}}> ✦ </span>{result.topic||keyword}</span>
          <p style={{fontSize:"11.5px",color:C.muted,marginTop:"4px"}}>{result.format_type||"long"} · {result.language||"hinglish"} · {result.personality_used||"default"}{result.word_count?` · ${result.word_count} words`:""}{result.content_mode==="deep_research"?" · Full Pipeline":""}</p>
        </div>
        {scores.final_score>0&&<span style={{flexShrink:0,fontSize:"12px",fontWeight:"800",padding:"4px 12px",borderRadius:"99px",background:scoreColor(scores.final_score)+"20",color:scoreColor(scores.final_score),border:`1px solid ${scoreColor(scores.final_score)}33`}}>⭐ {scores.final_score}/100</span>}
      </div>
      {result.content_mode==="deep_research"&&<div style={{display:"inline-flex",alignItems:"center",gap:"6px",background:`${C.purple}14`,border:`1px solid ${C.purple}30`,borderRadius:"99px",padding:"4px 12px",marginBottom:"18px",fontSize:"10.5px",fontWeight:"800",color:C.purple,textTransform:"uppercase",letterSpacing:"0.8px"}}>🔬 Deep Research · 6-Engine Pipeline</div>}
      {(scores.ai_score||scores.content_score||scores.final_score)>0&&(<>{scores.ai_score>0&&<ScoreBar label="AI Potential" value={scores.ai_score} emoji="🔥"/>}{scores.content_score>0&&<ScoreBar label="Content Strength" value={scores.content_score} emoji="🧠"/>}{scores.final_score>0&&<ScoreBar label="Final Score" value={scores.final_score} emoji="⭐"/>}<Divider/></>)}
      <TitlePicker titlesWithScore={titlesWS} bestTitle={result.best_title} isPro={isPro} onUpgradeClick={onUpgradeClick}/>
      {Object.keys(seoPacks).length>0&&<><PlatformSEOTabs seoPacks={seoPacks} defaultPlatform={platform} isPro={isPro} onUpgradeClick={onUpgradeClick}/><Divider/></>}
      {sections.length>0&&(<div style={{marginBottom:"22px"}}><SectionHead icon="📖" title={`Script Sections (${sections.length})`} copyText={sections.map(s=>`${s.title}\n${s.text}`).join("\n\n")}/>{sections.filter(s=>s.text).map((sec,i)=>(<div key={i} style={{background:"rgba(255,255,255,0.55)",borderRadius:"12px",padding:"12px 16px",marginBottom:"8px",border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${i%2===0?C.purple:C.rose}`}}><p style={{fontSize:"10px",fontWeight:"800",color:C.purple,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px"}}>{i+1}. {sec.title}</p><p style={{fontSize:"13px",lineHeight:1.7,color:C.ink,whiteSpace:"pre-line"}}>{sec.text}</p></div>))}</div>)}
      {displayScript&&(<div style={{marginBottom:"22px"}}><SectionHead icon="📜" title={`Full Script${isCapped?" (Preview — 500 words)":""}`} copyText={isPro?rawScript:displayScript}/><div style={{background:"rgba(255,255,255,0.55)",border:`1px solid ${C.hairline}`,borderRadius:"14px",padding:"16px",fontSize:"13px",color:C.ink,lineHeight:1.75,whiteSpace:"pre-wrap",fontFamily:"inherit",maxHeight:isPro?"480px":"none",overflowY:isPro?"auto":"visible"}}>{displayScript}</div>{isCapped&&(<div style={{marginTop:"10px",padding:"14px 16px",background:`${C.purple}08`,border:`1.5px solid ${C.purple}33`,borderRadius:"12px",textAlign:"center"}}><p style={{fontSize:"13px",color:C.slate,fontWeight:"600",marginBottom:"10px"}}>🔒 Full 3000-5000 word script is a Pro feature</p><button onClick={onUpgradeClick} style={{padding:"9px 22px",borderRadius:"99px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",boxShadow:`0 6px 18px ${C.purple}44`}}>✦ Unlock Full Script — ₹599/month</button></div>)}</div>)}
      {result.hook&&(<div style={{marginBottom:"18px"}}><SectionHead icon="🎣" title="Hook" copyText={result.hook}/><div style={{background:"rgba(255,255,255,0.55)",border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${C.rose}`,borderRadius:"12px",padding:"12px 16px",fontSize:"14px",fontWeight:"600",color:C.ink,lineHeight:1.55}}>{result.hook}</div></div>)}
      {beats.length>0&&(<div style={{marginBottom:"22px"}}><SectionHead icon="🥁" title={`Beats (${beats.length})`} copyText={beats.map(b=>b.text).join("\n\n")}/>{beats.map((b,i)=>(<div key={i} style={{background:"rgba(255,255,255,0.55)",border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${i%2===0?C.purple:C.rose}`,borderRadius:"12px",padding:"12px 16px",marginBottom:"8px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"5px"}}><span style={{fontSize:"10px",fontWeight:"800",color:C.purple,letterSpacing:"1px",textTransform:"uppercase"}}>Beat {b.beat} · {b.arc_label?b.arc_label.replace(/_/g," "):(b.emotion||"")}</span>{b.time_seconds!==undefined&&<span style={{fontSize:"10px",color:C.muted,fontWeight:"600"}}>⏱ {b.time_seconds}s</span>}</div><div style={{fontSize:"13px",lineHeight:1.65,whiteSpace:"pre-line",color:C.ink}}>{b.text}</div></div>))}</div>)}
      {result.search_queries?.length>0&&(<div style={{marginBottom:"20px"}}><SectionHead icon="🔍" title="SEO Queries" copyText={result.search_queries.join("\n")}/><div style={{display:"flex",flexWrap:"wrap"}}>{result.search_queries.map((q,i)=><Pill key={i} color={C.teal}>{q}</Pill>)}</div></div>)}
      {result.seo_hashtags?.length>0&&(<div style={{marginBottom:"20px"}}><SectionHead icon="🔖" title="SEO Hashtags" copyText={result.seo_hashtags.join(" ")}/><div style={{display:"flex",flexWrap:"wrap"}}>{result.seo_hashtags.map((h,i)=><Pill key={i} color={C.success}>{h}</Pill>)}</div></div>)}
      {result.research_errors?.length>0&&(<div style={{background:`${C.warn}12`,border:`1px solid ${C.warn}33`,borderRadius:"12px",padding:"12px 16px",marginBottom:"16px"}}><p style={{fontSize:"10.5px",fontWeight:"800",textTransform:"uppercase",letterSpacing:"1px",color:C.warn,marginBottom:"6px"}}>⚠ Pipeline Notes</p>{result.research_errors.map((e,i)=><p key={i} style={{fontSize:"12px",color:C.slate,marginBottom:"3px"}}>→ {e}</p>)}</div>)}
      <ThumbnailStudio keyword={keyword} title={result.best_title||result.hook||keyword} isPro={isPro} onUpgradeClick={onUpgradeClick}/>
      {result.credits_left!==undefined&&<p style={{textAlign:"center",fontSize:"12px",color:C.muted,fontWeight:"600",marginTop:"20px"}}>💳 {result.credits_left} credits remaining today</p>}
    </Card>
  );
}

// ── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const { user, token, isLoggedIn, isPro: authIsPro, logout, refreshToken } = useAuth();

  // ✅ FIX: always use latest token via ref so apiFetch never goes stale
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const apiFetch = useCallback(async (path, body) => {
    const headers = { "Content-Type": "application/json" };
    if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;
    const res = await fetch(`${BASE}${path}`, {
      method: "POST", headers, body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => `HTTP ${res.status}`);
      let d = t; try { d = JSON.parse(t).detail || t; } catch {}
      throw new Error(d);
    }
    return res.json();
  }, []);

  const [keyword,setKeyword]         = useState("");
  const [platform,setPlatform]       = useState("youtube");
  const [tone,setTone]               = useState("");
  const [personality,setPersonality] = useState("dhruvrathee");
  const [language,setLanguage]       = useState("hinglish");
  const [formatType,setFormatType]   = useState("long");
  const [result,setResult]           = useState(null);
  const [loading,setLoading]         = useState(false);
  const [error,setError]             = useState("");
  const [creditStatus,setCreditStatus] = useState(null);
  const [showUpgrade,setShowUpgrade] = useState(false);
  const [upgradeReason,setUpgradeReason] = useState("limit");
  const [btnHov,setBtnHov]           = useState(false);
  const resultRef = useRef(null);

  const isPro = authIsPro || (creditStatus?.plan && creditStatus.plan !== "free");

  useEffect(() => {
    if (user?.credit_status) {
      setCreditStatus(user.credit_status);
    } else if (user?.user_id) {
      fetch(`${BASE}/credits/${user.user_id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setCreditStatus(d); })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const p = PERSONAS.find(p => p.id === personality);
    if (p) setLanguage(p.lang);
  }, [personality]);

  const openUpgrade = (reason="limit") => { setUpgradeReason(reason); setShowUpgrade(true); };

  const handleUpgradeSuccess = (res) => {
    if (res?.credit_status) setCreditStatus(res.credit_status);
    refreshToken();
    if (user?.user_id) {
      fetch(`${BASE}/credits/${user.user_id}`).then(r=>r.ok?r.json():null).then(d=>{if(d)setCreditStatus(d);}).catch(()=>{});
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!keyword.trim()) { setError("Please enter a keyword or topic."); return; }
    if (!platform)       { setError("Please select a platform."); return; }
    if (!tone)           { setError("Please choose a tone."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      let data;
      if (platform === "youtube") {
        try { data = await apiFetch("/generate-full-content", {topic:keyword.trim(),persona:personality,language,country:"in",platform}); }
        catch { data = await apiFetch("/generate-platform-content", {topic:keyword.trim(),platform,tone,personality,format_type:formatType,language}); }
      } else {
        data = await apiFetch("/generate-platform-content", {topic:keyword.trim(),platform,tone,personality,format_type:formatType,language});
      }
      if (data?.credit_status) setCreditStatus(data.credit_status);
      else if (data?.credits_left !== undefined) setCreditStatus(prev => prev ? {...prev, credits_left:data.credits_left} : null);
      if (data?.error && (data.credit_status?.credits_left === 0 || data.credits_left === 0)) { openUpgrade("limit"); setLoading(false); return; }
      if (data?.error) { setError(data.error); setResult(null); setLoading(false); return; }
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 120);
    } catch(e) { setError(e.message || "Something went wrong. Is the backend running?"); }
    finally { setLoading(false); }
  }, [keyword, platform, tone, personality, language, formatType, apiFetch]);

  const selPersona = PERSONAS.find(p => p.id === personality);

  return (
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 20% 0%,${C.purpleXlt} 0%,#f8f4ff 35%,${C.roseXlt} 70%,#f0f9ff 100%)`,display:"flex",justifyContent:"center",alignItems:"flex-start",fontFamily:"'DM Sans','Syne',sans-serif",padding:"52px 16px 120px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:"-160px",right:"-120px",width:"520px",height:"520px",borderRadius:"50%",background:`radial-gradient(circle,${C.purpleXlt}dd,transparent 68%)`,pointerEvents:"none",zIndex:0,animation:"floatA 11s ease-in-out infinite"}}/>
      <div style={{position:"fixed",bottom:"-80px",left:"-80px",width:"420px",height:"420px",borderRadius:"50%",background:`radial-gradient(circle,${C.roseXlt}ee,transparent 68%)`,pointerEvents:"none",zIndex:0,animation:"floatB 13s ease-in-out infinite"}}/>

      <div style={{width:"100%",maxWidth:"580px",position:"relative",zIndex:1}}>
        <div style={{marginBottom:"28px"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:`linear-gradient(135deg,${C.rose},${C.purple})`,color:C.white,fontSize:"10px",fontWeight:"900",letterSpacing:"2.5px",textTransform:"uppercase",padding:"5px 14px",borderRadius:"99px",marginBottom:"14px",boxShadow:`0 6px 20px ${C.rose}44`}}>✦ AI Content Studio</div>
          <h1 style={{fontSize:"clamp(34px,8vw,52px)",fontWeight:"900",color:C.ink,lineHeight:1.0,letterSpacing:"-2px",marginBottom:"8px",fontFamily:"'Syne',sans-serif"}}>SocioMee<span style={{color:C.rose}}>.</span></h1>
          <p style={{fontSize:"14px",color:C.muted,fontWeight:"400",lineHeight:1.6}}>Transform any topic into a complete content pack — scripts, SEO, and metadata for every platform.</p>
        </div>

        {isLoggedIn && user && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,0.6)",backdropFilter:"blur(12px)",border:`1px solid ${C.hairline}`,borderRadius:"14px",padding:"10px 16px",marginBottom:"14px",boxShadow:"0 4px 16px rgba(124,58,237,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              {user.picture && <img src={user.picture} alt={user.name} style={{width:"32px",height:"32px",borderRadius:"50%",border:`2px solid ${C.purple}33`}}/>}
              <div>
                <p style={{fontSize:"13px",fontWeight:"700",color:C.ink,lineHeight:1.2}}>{user.name||user.email}</p>
                <p style={{fontSize:"10.5px",color:C.muted,fontWeight:"500"}}>{user.email}</p>
              </div>
            </div>
            <button onClick={logout} style={{padding:"5px 12px",borderRadius:"99px",border:`1px solid ${C.hairline}`,background:"rgba(255,255,255,0.7)",color:C.muted,fontSize:"11.5px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>Sign out</button>
          </div>
        )}

        <CreditBadge creditStatus={creditStatus||user?.credit_status} onUpgradeClick={()=>openUpgrade("upgrade")}/>

        <Card>
          <div style={{marginBottom:"18px"}}>
            <label style={{fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:"7px",display:"block"}}>Keyword / Topic</label>
            <input
              placeholder="e.g. skincare routine, crypto scam, fake influencers…"
              value={keyword} onChange={e=>setKeyword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
              style={{width:"100%",padding:"13px 16px",borderRadius:"12px",border:`1.5px solid ${C.hairline}`,outline:"none",fontSize:"14px",fontWeight:"500",color:C.ink,background:"rgba(255,255,255,0.7)",backdropFilter:"blur(8px)",boxSizing:"border-box",fontFamily:"inherit",transition:"border 0.2s,box-shadow 0.2s"}}
              onFocus={e=>{e.target.style.border=`1.5px solid ${C.purple}`;e.target.style.boxShadow=`0 0 0 3px ${C.purple}18`;}}
              onBlur={e=>{e.target.style.border=`1.5px solid ${C.hairline}`;e.target.style.boxShadow="none";}}
            />
          </div>

          <div style={{marginBottom:"18px"}}>
            <label style={{fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:"9px",display:"block"}}>Platform</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px"}}>
              {PLATFORMS.map(p=>(
                <button key={p.id} onClick={()=>setPlatform(p.id)} style={{padding:"9px 4px",borderRadius:"10px",border:`1.5px solid ${platform===p.id?p.color:C.hairline}`,background:platform===p.id?p.color+"16":"rgba(255,255,255,0.55)",color:platform===p.id?p.color:C.muted,fontWeight:"700",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:"3px"}}>
                  <span style={{fontSize:"14px"}}>{p.icon}</span><span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"18px"}}>
            {[
              {label:"Persona",value:personality,onChange:setPersonality,options:PERSONAS.map(p=>({value:p.id,label:`${p.flag} ${p.label}`}))},
              {label:"Format",value:formatType,onChange:setFormatType,options:[{value:"long",label:"Long Form"},{value:"short",label:"Short Form"}]},
            ].map(({label,value,onChange,options})=>(
              <div key={label}>
                <label style={{fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:"7px",display:"block"}}>{label}</label>
                <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${C.hairline}`,outline:"none",fontSize:"13px",fontWeight:"600",color:C.ink,background:"rgba(255,255,255,0.75)",cursor:"pointer",boxSizing:"border-box",appearance:"none",fontFamily:"inherit",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237c3aed'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"18px"}}>
                  {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          {selPersona&&(
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px",fontSize:"11.5px",color:C.muted,background:"rgba(124,58,237,0.06)",borderRadius:"8px",padding:"7px 12px"}}>
              <span>{selPersona.flag}</span>
              <span><strong style={{color:C.slate}}>{selPersona.label}</strong> · {language==="hinglish"?"Hinglish":"English"} · Auto-selected</span>
            </div>
          )}

          <div style={{marginBottom:"20px"}}>
            <label style={{fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:"9px",display:"block"}}>Tone</label>
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {TONES.map(({id,emoji,color})=>(
                <button key={id} onClick={()=>setTone(id)} style={{padding:"8px 15px",borderRadius:"99px",border:`1.5px solid ${tone===id?color:C.hairline}`,background:tone===id?color+"18":"rgba(255,255,255,0.5)",color:tone===id?color:C.muted,fontWeight:"700",fontSize:"12.5px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",boxShadow:tone===id?`0 4px 12px ${color}33`:"none"}}>
                  {emoji} {id.charAt(0).toUpperCase()+id.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {error&&<div style={{background:C.danger+"14",border:`1px solid ${C.danger}33`,borderRadius:"12px",padding:"12px 16px",color:C.danger,fontSize:"13px",fontWeight:"600",marginBottom:"14px"}}>⚠ {error}</div>}

          <button onClick={handleSubmit} disabled={loading} onMouseEnter={()=>setBtnHov(true)} onMouseLeave={()=>setBtnHov(false)} style={{width:"100%",padding:"15px",borderRadius:"14px",border:"none",background:`linear-gradient(135deg,${C.rose},${C.purple})`,color:C.white,fontWeight:"800",fontSize:"15px",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",letterSpacing:"0.3px",boxShadow:btnHov&&!loading?`0 18px 40px ${C.rose}55`:`0 10px 28px ${C.rose}44`,transform:btnHov&&!loading?"translateY(-2px)":"none",opacity:loading?0.75:1,transition:"all 0.15s"}}>
            {loading?"Generating…":"✦ Generate Content"}
          </button>

          {platform==="youtube"&&(
            <div style={{marginTop:"12px",display:"flex",alignItems:"center",gap:"8px",background:`${C.purple}10`,border:`1px solid ${C.purple}25`,borderRadius:"10px",padding:"9px 14px"}}>
              <span style={{fontSize:"13px"}}>🔬</span>
              <div>
                <span style={{fontSize:"11.5px",fontWeight:"700",color:C.purple}}>Full AI Pipeline · 6 Engines</span>
                <p style={{fontSize:"10.5px",color:C.muted,marginTop:"1px"}}>GNews → DeepSeek → Gemma{!isPro?" · 500-word preview on Free":" · Full 3000-word script"}</p>
              </div>
            </div>
          )}
        </Card>

        {loading&&<Card style={{marginTop:"20px"}}><Spinner label={platform==="youtube"?"Running 6-engine pipeline…":"Generating content…"}/></Card>}

        <div ref={resultRef}>
          <ResultPanel result={result} platform={platform} keyword={keyword} isPro={isPro} onUpgradeClick={()=>openUpgrade("feature")}/>
        </div>

        <p style={{textAlign:"center",color:C.muted,fontSize:"11.5px",marginTop:"32px",fontWeight:"500"}}>SocioMee · AI Content Studio · Built with 💜</p>
      </div>

      {showUpgrade&&<UpgradePopup triggerReason={upgradeReason} onClose={()=>setShowUpgrade(false)} onSuccess={handleUpgradeSuccess}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        select option{background:white;color:#0d0015}
        @keyframes floatA{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.03)}}
        @keyframes floatB{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(16px) scale(0.97)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:99px}
      `}</style>
    </div>
  );
}