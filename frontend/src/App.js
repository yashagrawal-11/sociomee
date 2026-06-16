import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import YouTubeDashboard from "./YouTubeDashboard";
import ThreadsDashboard from "./ThreadsDashboard";
import InstagramDashboard from "./InstagramDashboard";
import PinterestDashboard from "./PinterestDashboard";
import RedditDashboard from "./RedditDashboard";
import HistoryPanel from "./HistoryPanel";
import TelegramScheduler from "./TelegramScheduler";
import DiscordScheduler from "./DiscordScheduler";
import Translator from "./Translator";
import VideoClipper from "./VideoClipper";
import SubtitleGenerator from "./SubtitleGenerator";
import HashtagGenerator from "./HashtagGenerator";
import TextToAudio from "./TextToAudio";
import HookGenerator from "./HookGenerator";
import BioWriter from "./BioWriter";
import LinkedInDashboard from "./LinkedInDashboard";
import { LinkedInPost, LinkedInHeadline, LinkedInAbout, LinkedInCarousel, LinkedInHashtags, LinkedInBestTime } from "./LinkedInTools";
import { FacebookPost, FacebookGroupPost, FacebookAdCopy, FacebookBestTime } from "./FacebookTools";
import ThumbnailStudioNew from "./ThumbnailStudio";
import ScreenRecorder from './components/ScreenRecorder';
import { KeywordResearch, TrendingVideos, EvergreenScore, DailyVideoIdeas } from "./YouTubeTools";
import SocioMeeNews from "./SocioMeeNews";
import SocioMeeNotes from "./components/SocioMeeNotes";
import SocioMeePDF from "./components/SocioMeePDF";
import SocioMeePixel from "./components/SocioMeePixel";
import SocioMeeShare from "./components/SocioMeeShare";
import SocioMeeCloud from "./components/SocioMeeCloud";
import SocioMeeCalendar from "./components/SocioMeeCalendar";
import { TikTokHook, TikTokCaption, TikTokVideoIdeas, TikTokHashtags, TikTokBestTime } from "./TikTokTools";
import { WhatsAppBroadcast, WhatsAppReplyTemplates, WhatsAppChannelPost } from "./WhatsAppTools";
import { XTweetGenerator, XThreadGenerator, XHookGenerator, XBestTime } from "./XTools";
import { initPush } from "./PushNotifications";
import { TelegramHookGenerator, TelegramPollGenerator, TelegramBestTime } from "./TelegramTools";
import { PinterestPinDesc, PinterestBoardNames, PinterestHashtags, PinterestBestTime } from "./PinterestTools";
import { ThreadsGenerator, ThreadsBio, ThreadsHook } from "./ThreadsTools";
import { RedditTitle, RedditSubfinder, RedditBestTime } from "./RedditTools";

// ══════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ══════════════════════════════════════════════════════════════════════
const LIGHT_THEME = {
  rose:"#ff3d8f",    roseXlt:"#fff0f7",
  purple:"#7c3aed",  purpleXlt:"#f5f3ff",
  teal:"#0891b2",    ink:"#0d0015",
  slate:"#3b1f4e",   muted:"#8b6b9a",
  hairline:"rgba(124,58,237,0.12)",
  glass:"rgba(255,255,255,0.68)",
  inputBg:"rgba(255,255,255,0.7)",
  selectBg:"rgba(255,255,255,0.75)",
  pillBg:"rgba(255,255,255,0.5)",
  pageBg:"radial-gradient(ellipse at 20% 0%,#f5f3ff 0%,#f8f4ff 35%,#fff0f7 70%,#f0f9ff 100%)",
  blobA:"radial-gradient(circle,#f5f3ffdd,transparent 68%)",
  blobB:"radial-gradient(circle,#fff0f7ee,transparent 68%)",
  cardBorder:"rgba(124,58,237,0.12)",
  white:"#ffffff",   success:"#10b981",
  warn:"#f59e0b",    danger:"#ef4444",
};

const DARK_THEME = {
  rose:"#ff6eb5",    roseXlt:"#1f0818",
  purple:"#a78bfa",  purpleXlt:"#150d2a",
  teal:"#22d3ee",    ink:"rgba(255,255,255,0.9)",
  slate:"rgba(255,255,255,0.6)",   muted:"rgba(255,255,255,0.4)",
  hairline:"rgba(255,255,255,0.08)",
  glass:"rgba(255,255,255,0.04)",
  inputBg:"rgba(15,8,30,0.9)",
  selectBg:"rgba(15,8,30,0.95)",
  pillBg:"rgba(255,255,255,0.06)",
  pageBg:"#0a0a0a",
  blobA:"radial-gradient(circle,#2d1a5055,transparent 68%)",
  blobB:"radial-gradient(circle,#2a081855,transparent 68%)",
  cardBorder:"rgba(167,139,250,0.15)",
  white:"#ede8ff",   success:"#34d399",
  warn:"#fbbf24",    danger:"#f87171",
};

let C = { ...DARK_THEME };

const BASE = "https://sociomee.in/api";

// ══════════════════════════════════════════════════════════════════════
// STATIC DATA
// ══════════════════════════════════════════════════════════════════════
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
  {id:"youtube",   label:"YouTube",   img:"/icons/youtube.png",   color:"#ff0000"},
  {id:"instagram", label:"Instagram", img:"/icons/instagram.png", color:"#e1306c"},
  {id:"linkedin",  label:"LinkedIn",  img:"/icons/linkedin.png?v=2",  color:"#0077b5"},
  {id:"reddit",    label:"Reddit",    img:"/icons/reddit.png",    color:"#ff4500"},
  {id:"facebook",  label:"Facebook",  img:"/icons/facebook.png",  color:"#1877f2"},
  {id:"threads",   label:"Threads",   img:"/icons/threads.png",   color:"#ffffff"},
  {id:"pinterest", label:"Pinterest", img:"/icons/pinterest.png", color:"#e60023"},
  {id:"telegram",  label:"Telegram",  img:"/icons/telegram.png",  color:"#2aabee"},
];

const TONES = [
  {id:"bold",emoji:"🔥",color:"#ff4d4d"},
  {id:"funny",emoji:"😂",color:"#f59e0b"},
  {id:"emotional",emoji:"💖",color:"#ff3d8f"},
  {id:"informative",emoji:"📚",color:"#7c3aed"},
  {id:"aggressive",emoji:"⚡",color:"#6d28d9"},
  {id:"sales",emoji:"💸",color:"#10b981"},
  {id:"dramatic",emoji:"🎭",color:"#dc2626"},
  {id:"casual",emoji:"😎",color:"#0891b2"},
];

// ══════════════════════════════════════════════════════════════════════
// RAZORPAY LOADER
// ══════════════════════════════════════════════════════════════════════
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ══════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════
const scoreColor = n => {
  const v = Number(n || 0);
  if (v >= 80) return C.success;
  if (v >= 55) return C.warn;
  return C.danger;
};

// ══════════════════════════════════════════════════════════════════════
// RAZORPAY CHECKOUT
// ══════════════════════════════════════════════════════════════════════
async function runRazorpayCheckout({ planId, userId, email, onSuccess, onError }) {
  const loaded = await loadRazorpay();
  if (!loaded) { onError("Razorpay SDK failed to load. Check your internet."); return; }
  const res = await fetch(`${BASE}/payment/create-order`, {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ user_id:userId, plan:planId, email }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); onError(e.detail||"Failed to create order."); return; }
  const order = await res.json();
  new window.Razorpay({
    key:order.key_id, amount:order.amount, currency:order.currency,
    name:"SocioMee", description:order.plan_label, order_id:order.order_id,
    prefill:{ email }, theme:{ color:C.purple }, modal:{ ondismiss:()=>{} },
    handler: async response => {
      try {
        const verify = await fetch(`${BASE}/payment/verify`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ user_id:userId, plan:planId, email,
            razorpay_order_id:response.razorpay_order_id,
            razorpay_payment_id:response.razorpay_payment_id,
            razorpay_signature:response.razorpay_signature }),
        });
        const result = await verify.json();
        if (result.success) onSuccess(result);
        else onError("Payment verified but upgrade failed. Contact support.");
      } catch { onError("Verification failed. Contact support."); }
    },
  }).open();
}

// ══════════════════════════════════════════════════════════════════════
// PRICING POPUP
// ══════════════════════════════════════════════════════════════════════
// PRICING POPUP REPLACEMENT for App.js
// Replace the entire PricingPopup function with this

function PricingPopup({ onClose, onSuccess, userId, email, mode="upgrade" }) {
  const [paying,    setPaying   ] = useState(null);
  const [payErr,    setPayErr   ] = useState("");
  const [doneMsg,   setDoneMsg  ] = useState("");
  const [coupon,    setCoupon   ] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [discount,  setDiscount ] = useState(null);
  const [showCoupon, setShowCoupon] = useState(false);
  const [billing,   setBilling  ] = useState("annual"); // default annual

  const COUPONS = {
    "SOCIO10":      { type:"pct",  value:10,  label:"10% off" },
    "SOCIOMEE143":  { type:"pct",  value:15,  label:"15% off" },
    "SOCIOLOVE7":   { type:"flat", value:100, label:"₹100 off" },
    "SOCIOSAVE7":   { type:"flat", value:150, label:"₹150 off" },
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (COUPONS[code]) {
      setDiscount({ code, ...COUPONS[code] });
      setCouponMsg(`✅ Code applied — ${COUPONS[code].label}!`);
    } else {
      setDiscount(null);
      setCouponMsg("❌ Invalid code");
    }
  };

  const calcPrice = (base) => {
    if (!discount) return base;
    if (discount.type === "pct") return Math.round(base * (1 - discount.value / 100));
    return Math.max(0, base - discount.value);
  };

  const plans = [
    {
      id:"free", label:"Free", monthly:0, annual:0,
      credits:20, uploads:0,
      features:["20 credits/month","Short scripts ≤500 words","Basic SEO — 2 platforms","Community support"],
      cta:"Get Started Free", highlight:false, disabled:false, badge:null,
    },
    {
      id_monthly:"pro_monthly", id_annual:"pro_annual",
      label:"Pro", monthly:499, annual:3999,
      credits:200, uploads:4,
      features:["200 credits/month","3000-5000 word scripts","Full SEO — 8 platforms","4 YouTube uploads/month","Thumbnail analyzer","Priority support"],
      cta:"Upgrade to Pro", highlight:false, disabled:false, badge:null,
    },
    {
      id_monthly:"premium_monthly", id_annual:"premium_annual",
      label:"Premium", monthly:2999, annual:23999,
      credits:500, uploads:15,
      features:["500 credits/month","Unlimited word scripts","Full SEO — all platforms","15 YouTube uploads/month","Advanced AI analytics","Dedicated support","Early access to features"],
      cta:"Go Premium", highlight:true, disabled:false, badge:"Most Popular",
    },
  ];

  const topups = [
    { id:"topup_99",  label:"Starter Pack", price:99,  credits:50,  cta:"Buy 50 Credits" },
    { id:"topup_199", label:"Value Pack",   price:199, credits:120, badge:"Best Value",   cta:"Buy 120 Credits" },
  ];

  const pay = async (planId, price) => {
    if (planId === "free") { onClose(); return; }
    setPaying(planId); setPayErr("");
    const finalPrice = calcPrice(price);
    await runRazorpayCheckout({
      planId, userId, email,
      onSuccess: result => {
        setDoneMsg(result.message || "Payment successful! 🎉");
        setPaying(null);
        setTimeout(() => { onSuccess(result); onClose(); }, 2000);
      },
      onError: msg => { setPayErr(msg); setPaying(null); },
    });
  };

  const isNocredits = mode === "nocredits";

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(13,0,21,0.85)",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto" }}>
      <div style={{ width:"100%",maxWidth:"700px",background:C.pageBg.includes("150d")||C.pageBg.includes("0d08")?"linear-gradient(145deg,#1f0d35,#150d2a 50%,#0d0820)":"linear-gradient(145deg,#fff0f7,#f5f3ff 50%,#eff6ff)",borderRadius:"28px",boxShadow:"0 40px 100px rgba(124,58,237,0.4)",overflow:"hidden",animation:"slideUp 0.25s ease",position:"relative" }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${C.purple},${C.rose})`,padding:"28px 32px 24px",position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute",top:"16px",right:"16px",background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",width:"32px",height:"32px",borderRadius:"50%",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>✕</button>
          <div style={{ fontSize:"11px",fontWeight:"900",letterSpacing:"2px",textTransform:"uppercase",color:"rgba(255,255,255,0.8)",marginBottom:"8px" }}>✦ SocioMee Plans</div>
          <h2 style={{ fontSize:"24px",fontWeight:"900",color:"#fff",lineHeight:1.2,marginBottom:"6px" }}>
            {isNocredits ? "You're out of credits 🔒" : "Choose Your Plan"}
          </h2>
          <p style={{ fontSize:"13px",color:"rgba(255,255,255,0.85)",lineHeight:1.5 }}>
            {isNocredits ? "Top up instantly or upgrade for more credits every month." : "Upgrade to unlock more credits, uploads, and AI features."}
          </p>

          {/* Billing toggle */}
          <div style={{ display:"flex",alignItems:"center",gap:"12px",marginTop:"16px",background:"rgba(255,255,255,0.15)",borderRadius:"99px",padding:"4px",width:"fit-content" }}>
            <button onClick={() => setBilling("monthly")} style={{ padding:"6px 18px",borderRadius:"99px",border:"none",background:billing==="monthly"?"#fff":"transparent",color:billing==="monthly"?C.purple:"rgba(255,255,255,0.8)",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s" }}>Monthly</button>
            <button onClick={() => setBilling("annual")} style={{ padding:"6px 18px",borderRadius:"99px",border:"none",background:billing==="annual"?"#fff":"transparent",color:billing==="annual"?C.purple:"rgba(255,255,255,0.8)",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"6px" }}>
              Annual <span style={{ fontSize:"10px",background:"#fbbf24",color:"#78350f",padding:"2px 6px",borderRadius:"99px",fontWeight:"900" }}>SAVE 30%</span>
            </button>
          </div>
        </div>

        {doneMsg && (
          <div style={{ padding:"16px 32px",background:C.success+"18",borderBottom:`1px solid ${C.success}33`,textAlign:"center" }}>
            <span style={{ fontSize:"20px" }}>🎉</span>
            <p style={{ fontSize:"14px",fontWeight:"700",color:C.success,marginTop:"6px" }}>{doneMsg}</p>
          </div>
        )}
        {payErr && (
          <div style={{ padding:"10px 32px",background:C.danger+"12",borderBottom:`1px solid ${C.danger}22` }}>
            <p style={{ fontSize:"12.5px",color:C.danger,fontWeight:"600" }}>⚠ {payErr}</p>
          </div>
        )}

        <div style={{ padding:"24px" }}>

          {/* Top-up section for nocredits mode */}
          {isNocredits && (
            <div style={{ marginBottom:"24px" }}>
              <p style={{ fontSize:"11px",fontWeight:"900",letterSpacing:"1.4px",textTransform:"uppercase",color:C.muted,marginBottom:"12px" }}>⚡ Quick Top-Up — Buy Credits Instantly</p>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"8px" }}>
                {topups.map(t => (
                  <div key={t.id} style={{ background:C.glass,border:`1.5px solid ${C.purple}33`,borderRadius:"16px",padding:"16px",display:"flex",flexDirection:"column",gap:"8px",position:"relative" }}>
                    {t.badge && <div style={{ position:"absolute",top:"-10px",right:"12px",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:"#fff",fontSize:"9px",fontWeight:"900",padding:"2px 8px",borderRadius:"99px" }}>{t.badge}</div>}
                    <div style={{ fontSize:"13px",fontWeight:"800",color:C.ink }}>{t.label}</div>
                    <div style={{ fontSize:"24px",fontWeight:"900",color:C.ink }}>₹{calcPrice(t.price)}</div>
                    <div style={{ fontSize:"12px",fontWeight:"700",color:C.purple }}>+{t.credits} credits</div>
                    <button onClick={() => pay(t.id, t.price)} disabled={!!paying} style={{ width:"100%",padding:"9px",borderRadius:"10px",border:"none",background:`linear-gradient(135deg,${C.teal},${C.purple})`,color:"#fff",fontWeight:"800",fontSize:"12px",cursor:paying?"not-allowed":"pointer",fontFamily:"inherit",opacity:paying&&paying!==t.id?0.6:1 }}>
                      {paying===t.id?"Processing…":t.cta}
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ height:"1px",background:`linear-gradient(90deg,transparent,${C.hairline},transparent)`,margin:"20px 0" }}/>
              <p style={{ fontSize:"11px",fontWeight:"900",letterSpacing:"1.4px",textTransform:"uppercase",color:C.muted,marginBottom:"12px" }}>📦 Or Upgrade for Monthly Credits</p>
            </div>
          )}

          {/* Plans */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"20px" }}>
            {plans.map(plan => {
              const isFree = plan.id === "free";
              const planId = isFree ? "free" : billing==="annual" ? plan.id_annual : plan.id_monthly;
              const basePrice = isFree ? 0 : billing==="annual" ? plan.annual : plan.monthly;
              const finalP = calcPrice(basePrice);
              const saving = basePrice - finalP;

              return (
                <div key={plan.label} style={{ background:plan.highlight?`linear-gradient(145deg,${C.purple}22,${C.rose}18)`:C.glass,border:`2px solid ${plan.highlight?C.purple:C.hairline}`,borderRadius:"18px",padding:"18px",display:"flex",flexDirection:"column",gap:"8px",position:"relative" }}>
                  {plan.badge && (
                    <div style={{ position:"absolute",top:"-12px",left:"50%",transform:"translateX(-50%)",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:"#fff",fontSize:"9px",fontWeight:"900",letterSpacing:"1px",textTransform:"uppercase",padding:"4px 12px",borderRadius:"99px",whiteSpace:"nowrap" }}>{plan.badge}</div>
                  )}
                  {billing==="annual" && !isFree && (
                    <div style={{ position:"absolute",top:"-12px",right:"10px",background:"#fbbf24",color:"#78350f",fontSize:"9px",fontWeight:"900",padding:"3px 8px",borderRadius:"99px" }}>BEST DEAL</div>
                  )}
                  <div style={{ fontSize:"15px",fontWeight:"900",color:C.ink }}>{plan.label}</div>
                  <div style={{ display:"flex",alignItems:"baseline",gap:"3px",flexWrap:"wrap" }}>
                    {saving > 0 && <span style={{ fontSize:"12px",color:C.muted,textDecoration:"line-through" }}>₹{basePrice}</span>}
                    <span style={{ fontSize:"24px",fontWeight:"900",color:C.ink,letterSpacing:"-1px" }}>
                      {isFree ? "Free" : `₹${finalP}`}
                    </span>
                    {!isFree && <span style={{ fontSize:"11px",color:C.muted }}>/{billing==="annual"?"yr":"mo"}</span>}
                  </div>
                  {saving > 0 && <div style={{ fontSize:"10px",color:C.success,fontWeight:"700" }}>You save ₹{saving}!</div>}
                  {billing==="annual" && !isFree && (
                    <div style={{ fontSize:"10px",color:C.muted }}>≈ ₹{Math.round(finalP/12)}/month</div>
                  )}
                  <div style={{ fontSize:"11px",fontWeight:"700",color:C.purple }}>{plan.credits} credits/mo · {plan.uploads > 0 ? `${plan.uploads} uploads` : "No uploads"}</div>
                  <div style={{ flex:1,marginTop:"4px" }}>
                    {plan.features.map((f,i) => (
                      <div key={i} style={{ fontSize:"11px",color:C.slate,marginBottom:"4px",display:"flex",gap:"5px",alignItems:"flex-start" }}>
                        <span style={{ color:C.success,flexShrink:0,marginTop:"1px" }}>✓</span><span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => pay(planId, basePrice)} disabled={paying===planId}
                    style={{ width:"100%",padding:"10px",borderRadius:"12px",border:"none",background:isFree?`${C.purple}18`:plan.highlight?`linear-gradient(135deg,${C.purple},${C.rose})`:C.purple,color:isFree?C.purple:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",opacity:paying&&paying!==planId?0.6:1,border:isFree?`1.5px solid ${C.purple}44`:"none" }}>
                    {paying===planId ? "Processing…" : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Top-up for non-nocredits mode */}
          {!isNocredits && (
            <>
              <p style={{ fontSize:"11px",fontWeight:"900",letterSpacing:"1.4px",textTransform:"uppercase",color:C.muted,marginBottom:"12px" }}>⚡ Quick Top-Up — Buy Credits</p>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"20px" }}>
                {topups.map(t => (
                  <div key={t.id} style={{ background:C.glass,border:`1.5px solid ${C.hairline}`,borderRadius:"14px",padding:"16px",display:"flex",flexDirection:"column",gap:"8px",position:"relative" }}>
                    {t.badge && <div style={{ position:"absolute",top:"-10px",right:"12px",background:C.warn,color:"#fff",fontSize:"9px",fontWeight:"900",padding:"2px 8px",borderRadius:"99px" }}>{t.badge}</div>}
                    <div style={{ fontSize:"13px",fontWeight:"800",color:C.ink }}>{t.label}</div>
                    <span style={{ fontSize:"22px",fontWeight:"900",color:C.ink }}>₹{calcPrice(t.price)}</span>
                    <div style={{ fontSize:"12px",fontWeight:"700",color:C.purple }}>+{t.credits} credits</div>
                    <button onClick={() => pay(t.id, t.price)} disabled={!!paying} style={{ width:"100%",padding:"9px",borderRadius:"10px",border:"none",background:`linear-gradient(135deg,${C.teal},${C.purple})`,color:"#fff",fontWeight:"800",fontSize:"12px",cursor:paying?"not-allowed":"pointer",fontFamily:"inherit",opacity:paying&&paying!==t.id?0.6:1 }}>
                      {paying===t.id?"Processing…":t.cta}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Coupon code */}
          <div style={{ marginBottom:"16px" }}>
            <button onClick={() => setShowCoupon(s => !s)} style={{ background:"none",border:"none",color:C.purple,fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",padding:"4px 0",textDecoration:"underline" }}>🎟️ Have a promo code?</button>
            {showCoupon && (
              <div style={{ background:`${C.purple}08`,border:`1.5px solid ${C.purple}22`,borderRadius:"14px",padding:"16px",marginTop:"10px" }}>
                <div style={{ display:"flex",gap:"8px" }}>
                  <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} onKeyDown={e => e.key==="Enter" && applyCoupon()} placeholder="Enter code e.g. SOCIO10" style={{ flex:1,padding:"10px 14px",borderRadius:"10px",border:`1.5px solid ${C.hairline}`,background:C.glass,color:C.ink,fontSize:"13px",fontFamily:"inherit",outline:"none",letterSpacing:"1px",fontWeight:"700" }} />
                  <button onClick={applyCoupon} style={{ padding:"10px 18px",borderRadius:"10px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"inherit" }}>Apply</button>
                </div>
                {couponMsg && <p style={{ fontSize:"12px",fontWeight:"700",color:couponMsg.startsWith("✅")?C.success:C.danger,marginTop:"8px" }}>{couponMsg}</p>}
              </div>
            )}
          </div>

          <p style={{ textAlign:"center",fontSize:"11px",color:C.muted }}>🔒 Secured by Razorpay · UPI, Cards, NetBanking · Instant activation</p>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MICRO COMPONENTS
// ══════════════════════════════════════════════════════════════════════
function CopyBtn({ text, size="sm" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(String(text||"")); setCopied(true); setTimeout(()=>setCopied(false), 1800); };
  const sz = size==="sm" ? { padding:"4px 10px",fontSize:"11px" } : { padding:"7px 14px",fontSize:"12px" };
  return <button onClick={copy} style={{ ...sz,fontWeight:"800",cursor:"pointer",borderRadius:"8px",border:`1px solid ${copied?C.success+"55":C.hairline}`,background:copied?C.success+"18":C.glass,color:copied?C.success:C.muted,fontFamily:"inherit",transition:"all 0.18s" }}>{copied?"✓ Copied":"Copy"}</button>;
}

function SectionHead({ icon, title, copyText, children }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
      <span style={{ fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.4px",textTransform:"uppercase",color:C.muted }}>
        {icon&&<span style={{ marginRight:"6px" }}>{icon}</span>}{title}
      </span>
      <div style={{ display:"flex",gap:"6px",alignItems:"center" }}>{children}{copyText&&<CopyBtn text={copyText}/>}</div>
    </div>
  );
}

function Card({ children, style={} }) {
  return <div style={{ background:C.glass,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:`1px solid ${C.hairline}`,borderRadius:"20px",padding:"24px",boxShadow:C.glass.includes("22,14")||C.glass.includes("30,20")?"0 8px 32px rgba(0,0,0,0.3)":"0 8px 32px rgba(124,58,237,0.07)",...style }}>{children}</div>;
}

function Divider() {
  return <div style={{ height:"1px",background:`linear-gradient(90deg,transparent,${C.hairline},transparent)`,margin:"20px 0" }}/>;
}

function Pill({ children, color=C.purple }) {
  return <span style={{ display:"inline-block",padding:"5px 13px",borderRadius:"99px",fontSize:"12.5px",fontWeight:"600",background:color+"18",color,border:`1px solid ${color}30`,marginRight:"6px",marginBottom:"6px" }}>{children}</span>;
}

function ScoreBar({ label, value, emoji }) {
  const col = scoreColor(value);
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px" }}>
        <span style={{ fontSize:"13px",fontWeight:"600",color:C.ink }}>{emoji} {label}</span>
        <span style={{ fontSize:"12px",fontWeight:"800",padding:"2px 10px",borderRadius:"99px",background:col+"20",color:col,border:`1px solid ${col}33` }}>{value}/100</span>
      </div>
      <div style={{ height:"6px",borderRadius:"99px",background:"rgba(200,160,220,0.3)",overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${value}%`,borderRadius:"99px",background:`linear-gradient(90deg,${col}88,${col})`,transition:"width 0.9s ease" }}/>
      </div>
    </div>
  );
}

function Spinner({ label="Generating…" }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"44px 0",gap:"16px" }}>
      <div style={{ position:"relative",width:"52px",height:"52px" }}>
        <div style={{ position:"absolute",inset:0,borderRadius:"50%",border:`3px solid ${C.purple}22`,borderTopColor:C.purple,animation:"spin 0.7s linear infinite" }}/>
        <div style={{ position:"absolute",inset:"8px",borderRadius:"50%",border:`2px solid ${C.rose}22`,borderTopColor:C.rose,animation:"spin 1.1s linear infinite reverse" }}/>
      </div>
      <p style={{ color:C.muted,fontSize:"13px",fontWeight:"700" }}>{label}</p>
    </div>
  );
}

function ProLock({ label, onUpgradeClick, children }) {
  return (
    <div style={{ position:"relative" }}>
      <div style={{ filter:"blur(3px)",pointerEvents:"none",userSelect:"none",opacity:0.4 }}>{children}</div>
      <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"10px",background:C.purpleXlt+"ee",backdropFilter:"blur(2px)",borderRadius:"14px",border:`1.5px solid ${C.purple}33` }}>
        <span style={{ fontSize:"24px" }}>🔒</span>
        <span style={{ fontSize:"13px",fontWeight:"800",color:C.slate }}>{label}</span>
        <button onClick={onUpgradeClick} style={{ padding:"8px 20px",borderRadius:"99px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontSize:"12.5px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit" }}>✦ Unlock with Pro</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// CREDIT BADGE
// ══════════════════════════════════════════════════════════════════════
function CreditBadge({ creditStatus, onUpgradeClick }) {
  if (!creditStatus) return null;
  const plan       = creditStatus.plan       || "free";
  const plan_label = creditStatus.plan_label || plan.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  const next_reset = creditStatus.next_reset || creditStatus.resets_at || "";
  const isPro      = plan !== "free";
  const rawLeft    = creditStatus.credits_remaining !== undefined ? creditStatus.credits_remaining
                   : creditStatus.credits           !== undefined ? creditStatus.credits
                   : creditStatus.credits_left      !== undefined ? creditStatus.credits_left : 20;
  const rawLimit   = creditStatus.monthly_limit !== undefined ? creditStatus.monthly_limit
                   : creditStatus.daily_limit   !== undefined ? creditStatus.daily_limit : 20;
  const left  = Math.max(0, Number(rawLeft));
  const limit = Math.max(1, Number(rawLimit === 30 ? 20 : rawLimit));
  const pct   = Math.min(100, Math.round((left/limit)*100));
  const col   = left > limit*0.5 ? C.success : left > limit*0.15 ? C.warn : C.danger;
  const reset = next_reset ? new Date(next_reset).toLocaleDateString([],{month:"short",day:"numeric"}) : "";
  return (
    <div style={{ display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",background:C.glass,backdropFilter:"blur(16px)",border:`1px solid ${C.hairline}`,borderRadius:"14px",padding:"11px 16px",marginBottom:"22px",boxShadow:"0 4px 16px rgba(124,58,237,0.07)" }}>
      <span style={{ fontSize:"10px",fontWeight:"900",letterSpacing:"1.2px",textTransform:"uppercase",padding:"3px 10px",borderRadius:"99px",background:isPro?`linear-gradient(135deg,${C.purple},${C.rose})`:"rgba(139,107,154,0.15)",color:isPro?C.white:C.muted,border:isPro?"none":"1px solid rgba(139,107,154,0.3)" }}>
        {isPro?`✦ ${plan_label}`:plan_label}
      </span>
      <div style={{ display:"flex",alignItems:"center",gap:"8px",flex:1,minWidth:0 }}>
        <span style={{ fontSize:"14px",fontWeight:"900",color:col,flexShrink:0 }}>{left}</span>
        <span style={{ fontSize:"12px",color:C.muted,fontWeight:"500",flexShrink:0 }}>/ {limit} credits</span>
        <div style={{ flex:1,height:"6px",borderRadius:"99px",background:"rgba(200,160,220,0.25)",overflow:"hidden",minWidth:"48px" }}>
          <div style={{ height:"100%",width:`${pct}%`,borderRadius:"99px",background:`linear-gradient(90deg,${col}88,${col})`,transition:"width 0.6s ease",boxShadow:`0 0 6px ${col}55` }}/>
        </div>
      </div>
      {reset && <span style={{ fontSize:"10px",color:C.muted,flexShrink:0 }}>Resets {reset}</span>}
      {!isPro && <button onClick={onUpgradeClick} style={{ padding:"6px 14px",borderRadius:"99px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontSize:"11.5px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>✦ Upgrade</button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TITLE PICKER
// ══════════════════════════════════════════════════════════════════════
function TitlePicker({ titlesWithScore=[], bestTitle="", isPro, onUpgradeClick }) {
  const [sel, setSel] = useState(0);
  if (!titlesWithScore.length && !bestTitle) return null;
  const selTitle = titlesWithScore[sel]?.title || bestTitle;
  return (
    <div style={{ marginBottom:"24px" }}>
      <SectionHead icon="🎯" title="Title Candidates" copyText={titlesWithScore.map(t=>t.title).join("\n")}/>
      {titlesWithScore.map((item,i) => {
        const score = Number(item.seo_score||0); const col = scoreColor(score); const isA = i===sel;
        return (
          <button key={i} onClick={()=>setSel(i)} style={{ width:"100%",textAlign:"left",cursor:"pointer",marginBottom:"8px",background:isA?`${C.purple}10`:C.pillBg,border:`1.5px solid ${isA?C.purple:C.hairline}`,borderRadius:"12px",padding:"12px 16px",fontFamily:"inherit",transition:"all 0.15s" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px" }}>
              <span style={{ fontWeight:"600",lineHeight:1.45,flex:1,color:C.ink,fontSize:"14px" }}>
                {isA&&<span style={{ color:C.purple,marginRight:"6px" }}>✦</span>}{item.title}
              </span>
              <span style={{ fontSize:"11px",fontWeight:"800",padding:"2px 9px",borderRadius:"99px",background:col+"20",color:col,border:`1px solid ${col}33`,flexShrink:0 }}>{score}/100</span>
            </div>
            {isA && item.tips?.length > 0 && (
              isPro ? (
                <div style={{ marginTop:"8px",paddingTop:"8px",borderTop:`1px solid ${C.hairline}` }}>
                  {item.tips.map((tip,j)=><div key={j} style={{ display:"flex",gap:"6px",fontSize:"11.5px",color:C.slate,marginBottom:"3px" }}><span style={{ color:C.rose }}>→</span><span>{tip}</span></div>)}
                </div>
              ) : (
                <div style={{ marginTop:"8px",paddingTop:"8px",borderTop:`1px solid ${C.hairline}`,display:"flex",alignItems:"center",gap:"6px" }}>
                  <span style={{ fontSize:"12px" }}>🔒</span>
                  <span style={{ fontSize:"11.5px",color:C.muted }}>SEO tips are Pro only.{" "}<span onClick={onUpgradeClick} style={{ color:C.purple,fontWeight:"700",cursor:"pointer",textDecoration:"underline" }}>Upgrade</span></span>
                </div>
              )
            )}
          </button>
        );
      })}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"10px",background:`${C.purple}08`,border:`1.5px solid ${C.purple}33`,borderRadius:"12px",padding:"12px 16px" }}>
        <span style={{ fontWeight:"700",color:C.ink,fontSize:"14px",flex:1,marginRight:"10px" }}>{selTitle}</span>
        <CopyBtn text={selTitle} size="md"/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PLATFORM SEO TABS
// ══════════════════════════════════════════════════════════════════════
function PlatformSEOTabs({ seoPacks={}, defaultPlatform="youtube", isPro, onUpgradeClick }) {
  const all = Object.keys(seoPacks).filter(k=>seoPacks[k]&&Object.keys(seoPacks[k]).length>0);
  const [active, setActive] = useState(all.includes(defaultPlatform)?defaultPlatform:all[0]||"youtube");
  if (!all.length) return null;
  const meta = { youtube:{icon:"▶",color:"#ff0000"},instagram:{icon:"📸",color:"#e1306c"},tiktok:{icon:"🎵",color:"#010101"},x:{icon:"𝕏",color:"#000000"},facebook:{icon:"f",color:"#1877f2"},threads:{icon:"@",color:"#000000"},pinterest:{icon:"P",color:"#e60023"},telegram:{icon:"✈",color:"#2aabee"} };
  const pack = seoPacks[active]||{};
  const content = (
    <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
      {(pack.description||pack.caption||pack.post) && (
        <div>
          <SectionHead icon="📝" title={active==="youtube"?"Description":"Caption"} copyText={pack.description||pack.caption||pack.post}/>
          <div style={{ background:C.glass,borderRadius:"12px",padding:"14px 16px",fontSize:"13px",lineHeight:1.7,whiteSpace:"pre-wrap",color:C.ink,border:`1px solid ${C.hairline}`,maxHeight:"200px",overflowY:"auto" }}>{pack.description||pack.caption||pack.post}</div>
        </div>
      )}
      {active==="youtube"&&pack.timestamps?.length>0 && (
        <div>
          <SectionHead icon="⏱️" title="Timestamps" copyText={pack.timestamps.join("\n")}/>
          <div style={{ background:C.glass,borderRadius:"10px",padding:"10px 14px",border:`1px solid ${C.hairline}` }}>
            {pack.timestamps.map((t,i)=><div key={i} style={{ fontSize:"13px",color:C.ink,padding:"2px 0",borderBottom:i<pack.timestamps.length-1?`1px solid ${C.hairline}`:"none" }}>{t}</div>)}
          </div>
        </div>
      )}
      {pack.hashtags?.length>0 && (
        <div>
          <SectionHead icon="🏷️" title="Hashtags" copyText={pack.hashtags.join(" ")}/>
          <div style={{ display:"flex",flexWrap:"wrap" }}>{pack.hashtags.map((h,i)=><Pill key={i} color={C.rose}>{h}</Pill>)}</div>
        </div>
      )}
    </div>
  );
  return (
    <div style={{ marginBottom:"24px" }}>
      <SectionHead icon="🌐" title="Platform SEO Packs"/>
      <div style={{ display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px" }}>
        {all.map(p=>{ const pm=meta[p]||{icon:"●",color:C.purple}; const isA=active===p; return <button key={p} onClick={()=>setActive(p)} style={{ padding:"5px 13px",borderRadius:"99px",border:`1.5px solid ${isA?pm.color:C.hairline}`,background:isA?pm.color+"18":C.pillBg,color:isA?pm.color:C.muted,fontWeight:"700",fontSize:"11.5px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.14s" }}>{pm.icon} {p.charAt(0).toUpperCase()+p.slice(1)}</button>; })}
      </div>
      {isPro ? content : <ProLock label="Full platform SEO packs — Pro feature" onUpgradeClick={onUpgradeClick}>{content}</ProLock>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// THUMBNAIL STUDIO
// ══════════════════════════════════════════════════════════════════════
function ThumbnailStudio({ keyword, title, isPro, onUpgradeClick }) {
  const [file,    setFile   ] = useState(null);
  const [preview, setPreview] = useState("");
  const [drag,    setDrag   ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result,  setResult ] = useState(null);
  const [err,     setErr    ] = useState("");

  const handleFile = f => { if(!f||!f.type.startsWith("image/")) return; setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setErr(""); };
  const analyze = async () => {
    if(!file){ setErr("Upload a thumbnail first."); return; }
    setLoading(true); setErr(""); setResult(null);
    try {
      const form = new FormData();
      form.append("file",file); form.append("keyword",keyword||"general"); form.append("niche",keyword||"general"); form.append("title",title||"");
      const res = await fetch(`${BASE}/thumbnail/analyze`,{ method:"POST",body:form });
      if(!res.ok) throw new Error(`Server error ${res.status}`);
      setResult(await res.json());
    } catch(e){ setErr(e.message||"Analysis failed."); }
    finally{ setLoading(false); }
  };

  if(!isPro) return (
    <div style={{ marginTop:"24px",borderTop:`1px solid ${C.hairline}`,paddingTop:"24px" }}>
      <SectionHead icon="🖼️" title="Thumbnail Studio"/>
      <ProLock label="Thumbnail Studio — Pro feature" onUpgradeClick={onUpgradeClick}>
        <div style={{ padding:"20px",background:C.glass,borderRadius:"12px",fontSize:"13px",color:C.muted,textAlign:"center" }}>Upload · Analyze · Score your thumbnail</div>
      </ProLock>
    </div>
  );
  const sc = v => v>=75?C.success:v>=50?C.warn:C.danger;
  return (
    <div style={{ marginTop:"24px",borderTop:`1px solid ${C.hairline}`,paddingTop:"24px" }}>
      <SectionHead icon="🖼️" title="Thumbnail Studio"/>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}} style={{ border:`2px dashed ${drag?C.purple:file?C.success:"rgba(124,58,237,0.3)"}`,borderRadius:"14px",padding:"20px",textAlign:"center",background:drag?`${C.purple}14`:C.glass,cursor:"pointer",position:"relative" }}>
        <input type="file" accept="image/*" style={{ position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%" }} onChange={e=>handleFile(e.target.files[0])}/>
        {file ? <span style={{ color:C.success,fontWeight:"700",fontSize:"13px" }}>✅ {file.name}</span> : <><span style={{ fontSize:"22px" }}>🖼️</span><br/><span style={{ color:C.purple,fontWeight:"700",fontSize:"13px" }}>{drag?"Drop it!":"Click or drag thumbnail"}</span><br/><span style={{ fontSize:"11px",color:C.muted }}>PNG, JPG, WEBP · 16:9</span></>}
      </div>
      {preview && <div style={{ background:"#0f0f10",borderRadius:"12px",padding:"10px",marginTop:"10px" }}><img src={preview} alt="preview" style={{ width:"100%",borderRadius:"8px",aspectRatio:"16/9",objectFit:"cover",display:"block" }}/></div>}
      {err && <div style={{ marginTop:"8px",padding:"8px 12px",background:C.danger+"14",borderRadius:"8px",fontSize:"12.5px",color:C.danger,fontWeight:"600" }}>⚠ {err}</div>}
      <button onClick={analyze} disabled={loading||!file} style={{ width:"100%",marginTop:"10px",padding:"12px",borderRadius:"12px",border:"none",border:"1.5px solid rgba(124,58,237,0.6)",background:loading||!file?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.15)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:loading||!file?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading||!file?"none":"0 0 24px rgba(124,58,237,0.5)" }}>{loading?"Analyzing…":"✦ Analyze Thumbnail"}</button>
      {result && (
        <div style={{ marginTop:"14px" }}>
          {result.fit_score!==undefined && (
            <div style={{ marginBottom:"10px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"4px" }}>
                <span style={{ fontSize:"11px",fontWeight:"800",textTransform:"uppercase",color:C.muted }}>Fit Score</span>
                <span style={{ fontSize:"12px",fontWeight:"800",padding:"2px 9px",borderRadius:"99px",background:sc(result.fit_score)+"20",color:sc(result.fit_score),border:`1px solid ${sc(result.fit_score)}33` }}>{result.fit_score}/100</span>
              </div>
              <div style={{ height:"6px",borderRadius:"99px",background:"rgba(200,160,220,0.3)",overflow:"hidden" }}><div style={{ height:"100%",width:`${result.fit_score}%`,borderRadius:"99px",background:`linear-gradient(90deg,${sc(result.fit_score)}88,${sc(result.fit_score)})` }}/></div>
            </div>
          )}
          {result.verdict && <div style={{ background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:"10px",padding:"10px 14px",fontSize:"13px",fontWeight:"700",color:C.ink,marginBottom:"8px" }}>{/good|great|excellent|strong/i.test(result.verdict)?"✅":"⚠️"} {result.verdict}</div>}
          {result.suggestions?.map((s,i)=><div key={i} style={{ display:"flex",gap:"8px",fontSize:"12px",color:C.slate,marginBottom:"4px" }}><span style={{ color:C.rose }}>→</span><span>{s}</span></div>)}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SCRIPT RENDERER
// ══════════════════════════════════════════════════════════════════════
function ScriptRenderer({ text, capped }) {
  if (!text) return null;
  function isHeader(para) {
    const stripped = para.trim().replace(/[-—:]+$/,"").trim();
    const words = stripped.split(/\s+/);
    if (words.length===0||words.length>8) return false;
    const upperChars = [...stripped].filter(c=>c>="A"&&c<="Z").length;
    const alphaChars = [...stripped].filter(c=>c.match(/[a-zA-Z]/)).length;
    return alphaChars>0&&upperChars/alphaChars>0.7;
  }
  const paragraphs = text.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean);
  return (
    <div style={{ fontFamily:"inherit" }}>
      {paragraphs.map((para,i) => {
        if (isHeader(para)) return (
          <div key={i} style={{ display:"flex",alignItems:"center",gap:"10px",margin:`${i===0?0:28}px 0 12px` }}>
            <div style={{ height:"2px",width:"18px",background:`linear-gradient(90deg,${C.purple},${C.rose})`,borderRadius:"99px",flexShrink:0 }}/>
            <span style={{ fontSize:"10px",fontWeight:"900",letterSpacing:"2.5px",textTransform:"uppercase",color:C.purple }}>{para.replace(/[-—]+$/,"").trim()}</span>
            <div style={{ flex:1,height:"1px",background:`linear-gradient(90deg,${C.hairline},transparent)` }}/>
          </div>
        );
        return <p key={i} style={{ fontSize:"13.5px",lineHeight:2.0,color:C.ink,marginBottom:"16px",fontFamily:"inherit" }}>{para}</p>;
      })}
      {capped && <p style={{ fontSize:"12px",color:C.muted,fontStyle:"italic",borderTop:`1px solid ${C.hairline}`,paddingTop:"12px",marginTop:"4px" }}>[...Full script available with Pro]</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TELEGRAM ICON
// ══════════════════════════════════════════════════════════════════════
function TGIcon({ size=16, color="#fff" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════
// TELEGRAM CONNECT + SEND
// ══════════════════════════════════════════════════════════════════════
function TelegramSend({ result, platform, user }) {
  const userId = localStorage.getItem("sociomee_user_id") || user?.user_id || "";
  const [tgStatus,    setTgStatus   ] = useState("checking");
  const [tgInfo,      setTgInfo     ] = useState(null);
  const [connectLink, setConnectLink] = useState("");
  const [sendStatus,  setSendStatus ] = useState("idle");
  const [sendMsg,     setSendMsg    ] = useState("");
  const [polling,     setPolling    ] = useState(false);
  const [channel,     setChannel    ] = useState("");
  const [chStatus,    setChStatus   ] = useState("idle");
  const [chMsg,       setChMsg      ] = useState("");
  const [showChInput, setShowChInput] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE}/telegram/connect-status?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setTgStatus(d.connected ? "connected" : "disconnected"); if (d.connected) setTgInfo(d); })
      .catch(() => setTgStatus("disconnected"));
  }, [userId]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${BASE}/telegram/connect-status?user_id=${userId}`);
        const d = await r.json();
        if (d.connected) { setTgStatus("connected"); setTgInfo(d); setPolling(false); clearInterval(interval); }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, userId]);

  const handleSaveChannel = async () => {
    if (!channel.trim()) return;
    setChStatus("saving"); setChMsg("");
    try {
      const ch = channel.startsWith("@") ? channel : "@" + channel;
      const r  = await fetch(`${BASE}/telegram/save-channel?user_id=${userId}&channel=${encodeURIComponent(ch)}`, { method:"POST" });
      const d  = await r.json();
      if (d.success) { setChStatus("saved"); setChMsg(`Channel ${d.channel} saved! Now add @sociomee_bot as admin, then click Verify.`); }
      else { setChStatus("error"); setChMsg(d.detail || "Failed."); }
    } catch(e) { setChStatus("error"); setChMsg(e.message); }
  };

  const handleVerifyChannel = async () => {
    setChStatus("verifying"); setChMsg("");
    try {
      const r = await fetch(`${BASE}/telegram/verify-channel?user_id=${userId}`, { method:"POST" });
      const d = await r.json();
      if (d.success) { setChStatus("verified"); setChMsg(`✅ ${d.channel} verified!`); setTgInfo(prev => ({ ...prev, channel: d.channel, channel_verified: true })); }
      else { setChStatus("error"); setChMsg(d.detail || "Verification failed."); }
    } catch(e) { setChStatus("error"); setChMsg(e.message); }
  };

  const handleRemoveChannel = async () => {
    await fetch(`${BASE}/telegram/remove-channel?user_id=${userId}`, { method:"POST" });
    setChStatus("idle"); setChMsg(""); setChannel(""); setShowChInput(false);
    setTgInfo(prev => ({ ...prev, channel: null, channel_verified: false }));
  };

  const handleConnect = async () => {
    try {
      const r = await fetch(`${BASE}/telegram/connect-link?user_id=${userId}`);
      const d = await r.json();
      setConnectLink(d.link); setPolling(true);
      window.open(d.link.replace("tg://", "https://t.me/").replace("resolve?domain=", ""), "_blank");
    } catch(e) { setSendMsg("Failed to generate connect link."); }
  };

  const handleSend = async () => {
    if (!result) return;
    setSendStatus("sending"); setSendMsg("");
    try {
      const r = await fetch(`${BASE}/telegram/send-content`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ user_id:userId, topic:result.topic||"", platform:platform||"youtube",
          script_text:result.script_text||"", best_title:result.best_title||"", hook:result.hook||"",
          hashtags:result.seo_hashtags||[], description:result.seo_description||result.youtube_description||"" }),
      });
      const d = await r.json();
      if (d.success) { setSendStatus("sent"); setSendMsg(`✅ Sent ${d.messages_sent} messages to your Telegram!`); setTimeout(() => setSendStatus("idle"), 4000); }
      else { setSendStatus("error"); setSendMsg(d.detail || "Failed to send."); }
    } catch(e) { setSendStatus("error"); setSendMsg(e.message || "Network error."); }
  };

  const handleDisconnect = async () => {
    await fetch(`${BASE}/telegram/disconnect?user_id=${userId}`, { method:"POST" });
    setTgStatus("disconnected"); setTgInfo(null); setConnectLink("");
  };

  if (!result) return null;

  return (
    <div style={{ marginTop:"16px", paddingTop:"16px", borderTop:`1px solid ${C.hairline}` }}>
      {tgStatus === "connected" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
            <button onClick={handleSend} disabled={sendStatus==="sending"} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"10px 20px",borderRadius:"99px",border:"none",background:sendStatus==="sent"?C.success:"linear-gradient(135deg,#2aabee,#1a8ac0)",color:"#fff",fontWeight:"800",fontSize:"13px",cursor:sendStatus==="sending"?"not-allowed":"pointer",fontFamily:"inherit",opacity:sendStatus==="sending"?0.7:1,boxShadow:"0 4px 16px rgba(42,171,238,0.35)" }}>
              <TGIcon />
              {sendStatus==="sending"?"Sending…":sendStatus==="sent"?"Sent ✓":"Send to Telegram"}
            </button>
            <span style={{ fontSize:"11.5px",color:C.success,fontWeight:"700" }}>✅ @{tgInfo?.telegram_username || tgInfo?.full_name || "Connected"}</span>
            {tgInfo?.channel_verified && <span style={{ fontSize:"11px",color:"#2aabee",fontWeight:"700" }}>+ {tgInfo.channel} 📢</span>}
            <button onClick={handleDisconnect} style={{ fontSize:"11px",color:"#a78bfa",background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:"99px",padding:"5px 14px",cursor:"pointer",fontFamily:"inherit",fontWeight:"700",marginLeft:"auto" }}>Disconnect</button>
          </div>
          {sendMsg && <span style={{ fontSize:"12.5px",fontWeight:"600",color:sendStatus==="sent"?C.success:C.danger }}>{sendMsg}</span>}
        </div>
      )}
      {tgStatus === "disconnected" && (
        <div>
          {!connectLink ? (
            <button onClick={handleConnect} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"10px 20px",borderRadius:"99px",border:`1.5px dashed #2aabee55`,background:"rgba(42,171,238,0.08)",color:"#2aabee",fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"inherit" }}>
              <TGIcon size={15} color="#2aabee" /> Connect Telegram to Send
            </button>
          ) : (
            <div style={{ background:"rgba(42,171,238,0.08)",border:"1.5px solid #2aabee33",borderRadius:"14px",padding:"14px 16px" }}>
              <p style={{ fontSize:"13px",fontWeight:"700",color:C.ink,marginBottom:"8px" }}><TGIcon size={14} color="#2aabee" /> &nbsp;Open Telegram and tap Start</p>
              <a href={connectLink} target="_blank" rel="noreferrer" style={{ display:"inline-flex",alignItems:"center",gap:"7px",padding:"8px 18px",borderRadius:"99px",border:"none",background:"linear-gradient(135deg,#2aabee,#1a8ac0)",color:"#fff",fontWeight:"800",fontSize:"12.5px",textDecoration:"none" }}><TGIcon size={14} /> Open Telegram</a>
              <p style={{ fontSize:"11.5px",color:C.muted,marginTop:"8px" }}>{polling ? "⏳ Waiting for you to tap Start…" : "Tap the link to open Telegram"}</p>
            </div>
          )}
        </div>
      )}
      {tgStatus === "checking" && <p style={{ fontSize:"12px",color:C.muted }}>Checking Telegram connection…</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// RESULT PANEL
// ══════════════════════════════════════════════════════════════════════
function ResultPanel({ result, platform, keyword, isPro, onUpgradeClick, user }) {
  if (!result) return null;
  const scores   = result.scores||{};
  const sections = result.sections||[];
  const seoPacks = result.seo_packs||{};
  const titlesWS = result.titles_with_score||[];
  const rawScript= result.script_text||"";

  let isCapped = false; let displayScript = rawScript;
  if (!isPro && rawScript) {
    const allWords = rawScript.split(/\s+/).filter(Boolean);
    if (allWords.length>500) {
      isCapped = true;
      let wordCount=0,charPos=0;
      for (let i=0;i<rawScript.length&&wordCount<500;i++) {
        if(/\S/.test(rawScript[i])&&(i===0||/\s/.test(rawScript[i-1]))) wordCount++;
        charPos=i;
      }
      displayScript = rawScript.slice(0,charPos+1);
    }
  }
  const downloadPDF = () => {
    const title = result.best_title || result.topic || keyword;
    const script = result.script_text || "";
    const desc = result.seo_description || result.youtube_description || "";
    const hashtags = (result.seo_hashtags || []).join(" ");
    const hook = result.hook || "";
    const plt = (result.platform || platform || "").toUpperCase();
    const date = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',Arial,sans-serif;background:#0a0a0a;color:#ffffff;max-width:820px;margin:0 auto;padding:48px 40px;min-height:100vh}.header{padding:32px 36px;border-bottom:1px solid rgba(124,58,237,0.3);margin-bottom:40px;display:flex;align-items:center;justify-content:space-between}.logo{font-family:'Orbitron',sans-serif;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:2px}.tagline{font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-top:4px}.meta{font-size:11px;color:rgba(255,255,255,0.35);text-align:right;line-height:1.8}.section{margin-bottom:32px;padding-left:18px;border-left:3px solid #7c3aed}.section-title{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#a78bfa;margin-bottom:12px}.title-box{background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:10px;padding:16px 20px;font-size:17px;font-weight:800;line-height:1.5;color:#fff}.hook-box{font-size:15px;font-weight:700;line-height:1.7;color:rgba(255,255,255,0.9);font-style:italic}.script{font-size:13px;line-height:2.1;white-space:pre-wrap;color:rgba(255,255,255,0.8)}.desc{font-size:12px;line-height:1.9;white-space:pre-wrap;color:rgba(255,255,255,0.7)}.hashtags{font-size:13px;color:#a78bfa;font-weight:600;line-height:2}.footer{margin-top:48px;text-align:center;font-size:11px;color:rgba(255,255,255,0.2);border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;letter-spacing:1px}</style></head><body><div class="header"><div><div class="logo">SOCIOMEE</div><div class="tagline">ONE TOPIC. INFINITE CONTENT.</div></div><div class="meta">✦ AI Content Studio<br/>${plt}<br/>${date}</div></div>${title?`<div class="section"><div class="section-title">🎯 Best Title</div><div class="title-box">${title}</div></div>`:""}${hook?`<div class="section"><div class="section-title">🎣 Hook</div><p class="hook-box">${hook}</p></div>`:""}${script?`<div class="section"><div class="section-title">📜 Full Script</div><div class="script">${script}</div></div>`:""}${desc?`<div class="section"><div class="section-title">📋 YouTube Description</div><div class="desc">${desc}</div></div>`:""}${hashtags?`<div class="section"><div class="section-title">🏷️ Hashtags</div><div class="hashtags">${hashtags}</div></div>`:""}<div class="footer">GENERATED BY SOCIOMEE · SOCIOMEE.IN · AI CONTENT STUDIO</div></body></html>`;
    const blob = new Blob([html], { type:"text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title||"sociomee").slice(0,50).replace(/[^a-z0-9]/gi,"-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card style={{ marginTop:"20px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px" }}>
        <div>
          <span style={{ fontSize:"17px",fontWeight:"900",color:C.ink }}>
            {(result.platform||platform).charAt(0).toUpperCase()+(result.platform||platform).slice(1)}
            <span style={{ color:C.rose }}> ✦ </span>{result.topic||keyword}
          </span>
          <p style={{ fontSize:"11.5px",color:C.muted,marginTop:"4px" }}>
            {result.format_type||"long"} · {result.language||"hinglish"} · {result.personality_used||"default"}
            {result.word_count?` · ${result.word_count} words`:""}
            {result.content_mode==="deep_research"?" · Full Pipeline":""}
          </p>
        </div>
        {scores.final_score>0&&<span style={{ flexShrink:0,fontSize:"12px",fontWeight:"800",padding:"4px 12px",borderRadius:"99px",background:scoreColor(scores.final_score)+"20",color:scoreColor(scores.final_score),border:`1px solid ${scoreColor(scores.final_score)}33` }}>⭐ {scores.final_score}/100</span>}
      </div>

      {result.content_mode==="deep_research"&&<div style={{ display:"inline-flex",alignItems:"center",gap:"6px",background:`${C.purple}14`,border:`1px solid ${C.purple}30`,borderRadius:"99px",padding:"4px 12px",marginBottom:"18px",fontSize:"10.5px",fontWeight:"800",color:C.purple,textTransform:"uppercase" }}>🔬 Deep Research · 6-Engine Pipeline</div>}

      {(scores.ai_score||scores.content_score||scores.final_score)>0&&(
        <>{scores.ai_score>0&&<ScoreBar label="AI Potential" value={scores.ai_score} emoji="🔥"/>}
        {scores.content_score>0&&<ScoreBar label="Content Strength" value={scores.content_score} emoji="🧠"/>}
        {scores.final_score>0&&<ScoreBar label="Final Score" value={scores.final_score} emoji="⭐"/>}<Divider/></>
      )}

      <TitlePicker titlesWithScore={titlesWS} bestTitle={result.best_title} isPro={isPro} onUpgradeClick={onUpgradeClick}/>

      {false && (
        <div style={{ marginBottom:"20px" }}>
          <SectionHead icon="📋" title="YouTube Description" copyText={result.seo_description||result.youtube_description}/>
          <div style={{ background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:"12px",padding:"16px",fontSize:"13px",lineHeight:1.8,color:C.ink,whiteSpace:"pre-wrap",fontFamily:"inherit",maxHeight:"220px",overflowY:"auto" }}>
            {result.seo_description||result.youtube_description}
          </div>
        </div>
      )}

      {Object.keys(seoPacks).length>0&&<><PlatformSEOTabs seoPacks={seoPacks} defaultPlatform={platform} isPro={isPro} onUpgradeClick={onUpgradeClick}/><Divider/></>}

      {sections.length>0&&(
        <div style={{ marginBottom:"22px" }}>
          <SectionHead icon="📖" title={`Script Sections (${sections.length})`} copyText={sections.map(s=>`${s.title}\n${s.text}`).join("\n\n")}/>
          {sections.filter(s=>s.text).map((sec,i)=>(
            <div key={i} style={{ background:C.glass,borderRadius:"12px",padding:"12px 16px",marginBottom:"8px",border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${i%2===0?C.purple:C.rose}` }}>
              <p style={{ fontSize:"10px",fontWeight:"800",color:C.purple,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px" }}>{i+1}. {sec.title}</p>
              <p style={{ fontSize:"13px",lineHeight:1.7,color:C.ink,whiteSpace:"pre-line" }}>{sec.text}</p>
            </div>
          ))}
        </div>
      )}

      {displayScript&&(
        <div style={{ marginBottom:"22px" }}>
          <SectionHead icon="📜" title={`Full Script${isCapped?" (Preview — 500 words)":""}`} copyText={isPro?rawScript:displayScript}/>
          <div style={{ background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:"14px",padding:"20px 24px",maxHeight:isPro?"520px":"none",overflowY:isPro?"auto":"visible" }}>
            <ScriptRenderer text={displayScript} capped={isCapped}/>
          </div>
          {isCapped&&(
            <div style={{ marginTop:"10px",padding:"14px 16px",background:`${C.purple}08`,border:`1.5px solid ${C.purple}33`,borderRadius:"12px",textAlign:"center" }}>
              <p style={{ fontSize:"13px",color:C.slate,fontWeight:"600",marginBottom:"10px" }}>🔒 Full 3000-5000 word script is a Pro feature</p>
              <button onClick={onUpgradeClick} style={{ padding:"9px 22px",borderRadius:"99px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"inherit" }}>✦ Unlock Full Script</button>
            </div>
          )}
        </div>
      )}

      {result.hook&&(
        <div style={{ marginBottom:"18px" }}>
          <SectionHead icon="🎣" title="Hook" copyText={result.hook}/>
          <div style={{ background:C.glass,border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${C.rose}`,borderRadius:"12px",padding:"12px 16px",fontSize:"14px",fontWeight:"600",color:C.ink }}>{result.hook}</div>
        </div>
      )}

      {result.search_queries?.length>0&&(
        <div style={{ marginBottom:"20px" }}>
          <SectionHead icon="🔍" title="SEO Queries" copyText={result.search_queries.join("\n")}/>
          <div style={{ display:"flex",flexWrap:"wrap" }}>{result.search_queries.map((q,i)=><Pill key={i} color={C.purple}>{q}</Pill>)}</div>
        </div>
      )}

      {result.seo_hashtags?.length>0&&(
        <div style={{ marginBottom:"20px" }}>
          <SectionHead icon="🔖" title="SEO Hashtags" copyText={result.seo_hashtags.join(" ")}/>
          <div style={{ display:"flex",flexWrap:"wrap" }}>{result.seo_hashtags.map((h,i)=><Pill key={i} color={C.success}>{h}</Pill>)}</div>
        </div>
      )}

      {false&&(
        <div style={{ background:`${C.warn}12`,border:`1px solid ${C.warn}33`,borderRadius:"12px",padding:"12px 16px",marginBottom:"16px" }}>
          <p style={{ fontSize:"10.5px",fontWeight:"800",textTransform:"uppercase",color:C.warn,marginBottom:"6px" }}>⚠ Pipeline Notes</p>
          {result.research_errors.map((e,i)=><p key={i} style={{ fontSize:"12px",color:C.slate,marginBottom:"3px" }}>→ {e}</p>)}
        </div>
      )}
      
      <div style={{ display:"flex",justifyContent:"center",marginTop:"20px",marginBottom:"8px" }}>
        {platform!=="threads" && <button onClick={downloadPDF} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"11px 28px",borderRadius:"99px",border:"none",border:"1.5px solid rgba(124,58,237,0.6)",background:"rgba(124,58,237,0.15)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 0 24px rgba(124,58,237,0.5)" }}>
          Download as PDF
        </button>}
      </div>
      
      <ThumbnailStudio keyword={keyword} title={result.best_title||result.hook||keyword} isPro={isPro} onUpgradeClick={onUpgradeClick}/>
      {result.credits!==undefined&&<p style={{ textAlign:"center",fontSize:"12px",color:C.muted,fontWeight:"600",marginTop:"20px" }}>💳 {result.credits} credits remaining this month</p>}
      <TelegramSend result={result} platform={platform} user={user} />
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════
const TRANS = {
  en: { generate:"Generate", channels:"Channels", tools:"Tools", history:"History", thumbnail:"Thumbnail Studio", seo:"SEO Analyzer", calendar:"Content Calendar", guides:"Guides & Blog", signout:"Sign out", upgrade:"✦ Upgrade to Pro", translator:"Translator", videoclipper:"Video Clipper", subtitles:"Subtitles", hashtags:"Hashtags", language:"Language", channelSettings:"Channel Settings", oneTopicInfinite:"One Topic. Infinite Content." },
  hi: { generate:"जनरेट करें", channels:"चैनल", tools:"टूल्स", history:"इतिहास", thumbnail:"थंबनेल स्टूडियो", seo:"SEO एनालाइज़र", calendar:"कंटेंट कैलेंडर", guides:"गाइड्स और ब्लॉग", signout:"साइन आउट", upgrade:"✦ Pro में अपग्रेड करें", translator:"अनुवादक", videoclipper:"वीडियो क्लिपर", subtitles:"सबटाइटल्स", hashtags:"हैशटैग्स", language:"भाषा", channelSettings:"चैनल सेटिंग्स", oneTopicInfinite:"एक Topic. Infinite Content." },
  mr: { generate:"निर्माण करा", channels:"चॅनेल", tools:"साधने", history:"इतिहास", thumbnail:"थंबनेल स्टुडिओ", seo:"SEO विश्लेषक", calendar:"कंटेंट कॅलेंडर", guides:"मार्गदर्शक", signout:"साइन आउट", upgrade:"✦ Pro मध्ये अपग्रेड करा", translator:"अनुवादक", videoclipper:"व्हिडिओ क्लिपर", subtitles:"उपशीर्षके", hashtags:"हॅशटॅग्स", language:"भाषा", channelSettings:"चॅनेल सेटिंग्ज", oneTopicInfinite:"एक Topic. Infinite Content." },
  ta: { generate:"உருவாக்கு", channels:"சேனல்கள்", tools:"கருவிகள்", history:"வரலாறு", thumbnail:"தம்ப்நெயில் ஸ்டுடியோ", seo:"SEO பகுப்பாய்வி", calendar:"உள்ளடக்க நாட்காட்டி", guides:"வழிகாட்டிகள்", signout:"வெளியேறு", upgrade:"✦ Pro க்கு மேம்படுத்து", translator:"மொழிபெயர்ப்பாளர்", videoclipper:"வீடியோ கிளிப்பர்", subtitles:"வசனங்கள்", hashtags:"ஹேஷ்டேக்கள்", language:"மொழி", channelSettings:"சேனல் அமைப்புகள்", oneTopicInfinite:"ஒரு தலைப்பு. Infinite Content." },
  bn: { generate:"তৈরি করুন", channels:"চ্যানেল", tools:"সরঞ্জাম", history:"ইতিহাস", thumbnail:"থাম্বনেইল স্টুডিও", seo:"SEO বিশ্লেষক", calendar:"কন্টেন্ট ক্যালেন্ডার", guides:"গাইড", signout:"সাইন আউট", upgrade:"✦ Pro তে আপগ্রেড করুন", translator:"অনুবাদক", videoclipper:"ভিডিও ক্লিপার", subtitles:"সাবটাইটেল", hashtags:"হ্যাশট্যাগ", language:"ভাষা", channelSettings:"চ্যানেল সেটিংস", oneTopicInfinite:"এক বিষয়. Infinite Content." },
};

function ComingSoonCard({ platform, icon, color, message }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:`${color}15`, border:`2px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
        <img src={icon} alt={platform} style={{ width:"40px", height:"40px", objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
      </div>
      <h2 style={{ fontSize:"20px", fontWeight:"800", color:"#fff", fontFamily:"'Orbitron',sans-serif", letterSpacing:"2px", marginBottom:"12px", textTransform:"uppercase" }}>{platform}</h2>
      <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(124,58,237,0.1)", border:"1.5px solid rgba(124,58,237,0.3)", borderRadius:"99px", padding:"6px 18px", marginBottom:"16px" }}>
        <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#a78bfa", animation:"pulse 1.5s infinite" }}/>
        <span style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"2px", color:"#a78bfa", textTransform:"uppercase" }}>Coming Soon</span>
      </div>
      <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.4)", maxWidth:"400px", margin:"0 auto", lineHeight:"1.7" }}>{message}</p>
    </div>
  );
}


function CustomSelect({ value, onChange, options, label, grid=false, centered=false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => o.id === value);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative", userSelect:"none" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%", padding:"11px 16px", borderRadius:"99px",
        border:`1.5px solid ${open ? "rgba(124,58,237,0.9)" : "rgba(124,58,237,0.3)"}`,
        background: open ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.08)",
        backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
        color:"#fff", fontSize:"13px", fontFamily:"inherit", cursor:"pointer",
        display:"flex", alignItems:"center",
        justifyContent: centered ? "center" : "space-between",
        gap:"8px", boxShadow: open ? "0 0 20px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" : "inset 0 1px 0 rgba(255,255,255,0.05)",
        transition:"all 0.2s", outline:"none"
      }}>
        {centered && <span style={{flex:1}}/>}
        <span style={{ fontWeight:"600", color: selected ? "#fff" : "rgba(255,255,255,0.4)" }}>{selected?.label || label}</span>
        {centered && <span style={{flex:1, display:"flex", justifyContent:"flex-end"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
        </span>}
        {!centered && <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition:"transform 0.2s", flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
        </>}
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", left:0, right:0, zIndex:999,
          background:"rgba(8,5,20,0.98)", border:"1px solid rgba(124,58,237,0.35)",
          borderRadius:"16px", padding:"6px",
          backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
          boxShadow:"0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
          maxHeight:"280px", overflowY:"auto", scrollbarWidth:"none", msOverflowStyle:"none",
          display: grid ? "grid" : "block",
          gridTemplateColumns: grid ? "1fr 1fr" : "unset",
          gap: grid ? "1px" : "0",
          overflow: grid ? "hidden" : "auto",
        }}>
          {options.map((opt, i) => {
            const isActive = opt.id === value;
            const isLastOdd = grid && i === options.length - 1 && options.length % 2 !== 0;
            return (
              <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false); }}
                style={{
                  display:"flex", alignItems:"center", justifyContent: grid ? "flex-start" : "space-between",
                  width:"100%", padding: grid ? "10px 12px" : "9px 12px",
                  border:"none", gridColumn: isLastOdd ? "1 / -1" : "auto",
                  background: isActive ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.02)",
                  color: isActive ? "#c4b5fd" : "rgba(255,255,255,0.65)",
                  fontSize:"12.5px", fontWeight: isActive ? "700" : "500",
                  cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                  borderLeft: grid ? "none" : isActive ? "2px solid #7c3aed" : "2px solid transparent",
                  transition:"all 0.12s",
                  borderRadius: grid ? "0" : "8px",
                }}
                onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.background="rgba(124,58,237,0.12)"; e.currentTarget.style.color="#fff"; }}}
                onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.background="rgba(255,255,255,0.02)"; e.currentTarget.style.color="rgba(255,255,255,0.65)"; }}}>
                <span>{opt.label}</span>
                {!grid && isActive && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChannelSettingsModal({ user, onClose, BASE }) {
  const userId = localStorage.getItem("sociomee_user_id") || user?.user_id || "";
  const [ytChannel, setYtChannel] = useState(null);
  const [tgStatus, setTgStatus] = useState(null);
  const [dcStatus, setDcStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("sociomee_token") || "";
    Promise.allSettled([
      fetch(BASE+"/youtube/status/"+userId, { headers:{ Authorization:"Bearer "+token } }).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(BASE+"/telegram/connect-status?user_id="+userId).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(BASE+"/discord/status?user_id="+userId).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([yt,tg,dc]) => {
      if (yt.value?.connected) { const ch = yt.value.channels?.[0] || yt.value; setYtChannel({title: ch.channel_title||ch.title||ch.name, thumbnail: ch.thumbnail_url||ch.thumbnail, subscribers: ch.subscribers, channel_id: ch.channel_id}); } else if (yt.value?.channel_title||yt.value?.title) setYtChannel(yt.value);
      if (tg.value) setTgStatus(tg.value);
      if (dc.value) setDcStatus(dc.value);
      setLoading(false);
    });
  }, [userId]);
  const disconnectYT = async () => { const t=localStorage.getItem("sociomee_token")||""; await fetch(BASE+"/youtube/disconnect/"+userId,{method:"POST",headers:{Authorization:"Bearer "+t}}).catch(()=>{}); setYtChannel(null); };
  const disconnectTG = async () => { await fetch(BASE+"/telegram/disconnect?user_id="+userId,{method:"POST"}).catch(()=>{}); setTgStatus({connected:false}); };
  const RemoveBtn = ({onClick}) => <button onClick={onClick} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,61,143,0.2)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,61,143,0.08)"} style={{padding:"6px 14px",borderRadius:"99px",border:"1.5px solid rgba(255,61,143,0.4)",background:"rgba(255,61,143,0.08)",color:"#ff3d8f",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Remove</button>;
  const DisconnectBtn = ({onClick}) => <button onClick={onClick} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.25)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} style={{padding:"6px 14px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.4)",background:"rgba(124,58,237,0.1)",color:"#a78bfa",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Disconnect</button>;
  const YTIcon = ({s=20}) => <svg viewBox="0 0 24 24" width={s} height={s}><path fill="#ff0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/><path fill="#fff" d="M9.8 15.5V8.5l6.4 3.5-6.4 3.5z"/></svg>;
  const TGSvg = ({s=20}) => <svg viewBox="0 0 24 24" width={s} height={s} fill="#2aabee"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
  const DCSvg = ({s=20}) => <svg viewBox="0 0 24 24" width={s} height={s} fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>;
  const Row = ({icon,name,sub,onRemove,accent}) => (
    <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:accent+"08",border:"1px solid "+accent+"20",marginBottom:"8px"}}>
      <div style={{width:"38px",height:"38px",borderRadius:"50%",background:accent+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{name}</div>
        {sub&&<div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{sub}</div>}
      </div>
      {onRemove&&<RemoveBtn onClick={onRemove}/>}
    </div>
  );
  const Sec = ({icon,label,count,children}) => (
    <div style={{marginBottom:"20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
        {icon}
        <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)"}}>{label}</span>
        <span style={{fontSize:"10px",fontWeight:"700",color:"#a78bfa",marginLeft:"auto"}}>{count}/5</span>
      </div>
      {children}
    </div>
  );
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:"460px",background:"rgba(10,8,20,0.98)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"20px",padding:"24px",maxHeight:"82vh",overflowY:"auto",scrollbarWidth:"none",msOverflowStyle:"none",boxShadow:"0 24px 80px rgba(0,0,0,0.9),0 0 60px rgba(124,58,237,0.12)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"4px"}}>
          <div>
            <h2 style={{fontSize:"16px",fontWeight:"800",color:"#fff",margin:0}}>Channel Settings</h2>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"2px"}}>Plan: {user?.plan_label||"Free"} · Manage connected accounts</p>
          </div>
          <button onClick={onClose} style={{width:"30px",height:"30px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{height:"1px",background:"rgba(255,255,255,0.07)",margin:"16px 0"}}/>
        {loading ? <div style={{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.3)",fontSize:"13px"}}>Loading...</div> : (<>
          <Sec icon={<img src="/icons/youtube.png" style={{width:20,height:20,objectFit:"contain"}} alt="yt"/>} label="YouTube Channels" count={ytChannel?1:0}>
            {ytChannel ? (<div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,0,0,0.05)",border:"1px solid rgba(255,0,0,0.15)",marginBottom:"8px"}}>{ytChannel.thumbnail?<img src={ytChannel.thumbnail} style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/>:<YTIcon/>}<div style={{flex:1,minWidth:0}}><div style={{fontSize:"13px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ytChannel.title||"Channel"}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{ytChannel.subscribers?Number(ytChannel.subscribers).toLocaleString()+" subs":""}</div></div><DisconnectBtn onClick={disconnectYT}/></div>) : <div style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",padding:"8px 0"}}>No YouTube channels connected</div>}
          </Sec>
          <Sec icon={<img src="/icons/telegram.png" style={{width:20,height:20,objectFit:"contain"}} alt="tg"/>} label="Telegram" count={tgStatus?.connected?1:0}>
            {tgStatus?.connected ? (<div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(42,171,238,0.05)",border:"1px solid rgba(42,171,238,0.15)",marginBottom:"8px"}}><div style={{width:"38px",height:"38px",borderRadius:"50%",background:"rgba(42,171,238,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><img src="/icons/telegram.png" style={{width:22,height:22,objectFit:"contain"}} alt="tg"/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:"13px",fontWeight:"700",color:"#fff"}}>{"@"+(tgStatus.telegram_username||tgStatus.full_name||"Connected")}</div>{tgStatus.channel&&<div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{tgStatus.channel}</div>}</div><DisconnectBtn onClick={disconnectTG}/></div>) : <div style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",padding:"8px 0"}}>No Telegram connected</div>}
          </Sec>
          <Sec icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>} label="Discord" count={dcStatus?.connected||dcStatus?.webhook_url?1:0}>
            {dcStatus?.connected||dcStatus?.webhook_url ? (<div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(88,101,242,0.05)",border:"1px solid rgba(88,101,242,0.15)",marginBottom:"8px"}}><div style={{width:"38px",height:"38px",borderRadius:"50%",background:"rgba(88,101,242,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:"13px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{dcStatus.server_name||"Discord Server"}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{dcStatus.channel_name||"Channel connected"}</div></div><DisconnectBtn onClick={()=>setDcStatus(null)}/></div>) : <div style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",padding:"8px 0"}}>No Discord connected</div>}
          </Sec>
          <div style={{height:"1px",background:"rgba(255,255,255,0.07)",marginBottom:"16px"}}/>
          <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",marginBottom:"12px"}}>Other Accounts</div>
          {[{name:"Threads",icon:"/icons/threads.png"},{name:"Instagram",icon:"/icons/instagram.png"},{name:"Pinterest",icon:"/icons/pinterest.png"}].map(a=>(
            <div key={a.name} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:"8px"}}>
              <img src={a.icon} style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt={a.name}/>
              <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.5)",flex:1}}>{a.name}</span>
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",fontWeight:"600",background:"rgba(255,255,255,0.05)",padding:"3px 8px",borderRadius:"99px"}}>Coming Soon</span>
            </div>
          ))}
        </>)}
      </div>
    </div>
  );
}


function SkeletonScreen() {
  const pulse = {animation:'pulse 1.5s ease-in-out infinite',background:'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',backgroundSize:'200% 100%'};
  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#0a0a0a'}}>
      <div style={{width:'220px',flexShrink:0,background:'rgba(6,4,15,0.97)',borderRight:'1px solid rgba(124,58,237,0.1)',padding:'20px 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
        <div style={{height:'22px',borderRadius:'6px',width:'110px',...pulse}}/>
        <div style={{height:'44px',borderRadius:'10px',marginTop:'4px',...pulse}}/>
        <div style={{height:'12px',borderRadius:'4px',width:'60px',marginTop:'12px',...pulse}}/>
        {[1,2,3,4,5,6,7].map(i=><div key={i} style={{height:'32px',borderRadius:'8px',...pulse}}/>)}
        <div style={{height:'12px',borderRadius:'4px',width:'50px',marginTop:'4px',...pulse}}/>
        {[1,2,3].map(i=><div key={i} style={{height:'28px',borderRadius:'6px',...pulse}}/>)}
      </div>
      <div style={{flex:1,padding:'48px 32px'}}>
        <div style={{maxWidth:'860px',margin:'0 auto',display:'flex',flexDirection:'column',gap:'20px'}}>
          <div style={{height:'40px',borderRadius:'8px',width:'260px',...pulse}}/>
          <div style={{height:'18px',borderRadius:'4px',width:'160px',...pulse}}/>
          <div style={{height:'54px',borderRadius:'99px',...pulse,marginTop:'4px'}}/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
            {[1,2,3,4,5,6,7,8].map(i=><div key={i} style={{height:'70px',borderRadius:'28px',...pulse}}/>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'}}>
            {[1,2,3].map(i=><div key={i} style={{height:'44px',borderRadius:'99px',...pulse}}/>)}
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {[1,2,3,4,5,6,7,8,9,10].map(i=><div key={i} style={{height:'34px',width:'80px',borderRadius:'99px',...pulse}}/>)}
          </div>
          <div style={{height:'54px',borderRadius:'99px',...pulse}}/>
        </div>
      </div>
    </div>
  );
}


// Plan gate helper
function isPro(plan) {
  return plan === "pro_monthly" || plan === "pro_annual" || plan === "premium_monthly" || plan === "premium_annual";
}
function isPremium(plan) {
  return plan === "premium_monthly" || plan === "premium_annual";
}

function PlanGate({ plan, required="pro", onUpgrade, children, toolName="" }) {
  const allowed = required === "pro" ? isPro(plan) : isPremium(plan);
  if (allowed) return children;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",minHeight:"60vh",fontFamily:"Poppins,sans-serif",padding:"40px 24px",textAlign:"center"}}>
      <div style={{width:"64px",height:"64px",borderRadius:"16px",background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",marginBottom:"20px"}}>🔒</div>
      <h2 style={{fontSize:"20px",fontWeight:"800",color:"#fff",margin:"0 0 8px",fontFamily:"Poppins,sans-serif"}}>{toolName || "Pro Feature"}</h2>
      <p style={{fontSize:"14px",color:"rgba(255,255,255,0.45)",margin:"0 0 24px",lineHeight:1.7,maxWidth:"360px"}}>This tool is available on the Pro plan and above. Upgrade to unlock all SocioMee Store tools, YouTube uploads and full AI features.</p>
      <button onClick={onUpgrade}
        style={{padding:"12px 28px",borderRadius:"99px",border:"none",background:"linear-gradient(135deg,#7c3aed,#9b5cf6)",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:"Poppins,sans-serif"}}>
        Upgrade to Pro — ₹499/month
      </button>
      <p style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",marginTop:"12px",fontFamily:"Poppins,sans-serif"}}>Cancel anytime. Instant access after payment.</p>
    </div>
  );
}

export default function App() {
  const { user, token, isLoggedIn, logout, refreshToken, loading: authLoading } = useAuth();
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const apiFetch = useCallback(async (path, body) => {
    const headers = { "Content-Type":"application/json" };
    if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;
    const res = await fetch(`${BASE}${path}`, { method:"POST", headers, body:JSON.stringify(body) });
    if (!res.ok) {
      const t = await res.text().catch(()=>`HTTP ${res.status}`);
      let d=t; try{ d=JSON.parse(t).detail||t; } catch{}
      throw new Error(typeof d==="object"?JSON.stringify(d):d);
    }
    return res.json();
  }, []);

  const [keyword,      setKeyword    ] = useState("");
  const [platform,     setPlatform   ] = useState("youtube");
  const [tone,         setTone       ] = useState("casual");
  const [personality,  setPersonality] = useState("dhruvrathee");
  const [language,     setLanguage   ] = useState("hinglish");
  const [formatType,   setFormatType ] = useState("long");
  const [result,       setResult     ] = useState(null);
  const [loading,      setLoading    ] = useState(false);
  const [error,        setError      ] = useState("");
  const [creditStatus, setCreditStatus] = useState(null);
  const [showPricing,  setShowPricing] = useState(false);
  const [pricingMode,  setPricingMode] = useState("upgrade");
  const [activeTab,    setActiveTab  ] = useState("generate");
  const [sidebarOpen,  setSidebarOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [channelSettingsOpen, setChannelSettingsOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showUsagePopup, setShowUsagePopup] = useState(false);
  const [showPlansPopup, setShowPlansPopup] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifSettings, setNotifSettings] = useState({newFeatures:true,weeklyTips:true,usageAlerts:true,proOffers:false});
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [openGroups, setOpenGroups] = useState({youtube:true, instagram:false, telegram:false, pinterest:false, threads:false, reddit:false, linkedin:false, facebook:false, tiktok:false, whatsapp:false, xtools:false, analytics:false});
  const toggleGroup = (g) => setOpenGroups(prev=>({...prev,[g]:!prev[g]}));
  const [youtubeInitialTab, setYoutubeInitialTab] = useState("analytics");
  const resultRef = useRef(null);

  const plan  = creditStatus?.plan || user?.plan || "free";
  const isPro = plan !== "free";
  const UI_LANG = localStorage.getItem("sociomee_lang") || "en";
  const t = (k) => TRANS[UI_LANG]?.[k] || TRANS.en[k] || k;

  const LANGS = [
    { code:"en", label:"English" },
    { code:"hi", label:"हिंदी" },
    { code:"mr", label:"मराठी" },
    { code:"ta", label:"தமிழ்" },
    { code:"bn", label:"বাংলা" },
  ];

  // Listen for screen recorder navigation events
  useEffect(() => {
    const handler = (e) => setActiveTab(e.detail);
    window.addEventListener("sociomee_navigate", handler);
    return () => window.removeEventListener("sociomee_navigate", handler);
  }, []);

  useEffect(() => {
    let startX = 0; let startY = 0;
    const ts = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    const tm = (e) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && startX < 40 && dx > 10) e.preventDefault();
    };
    const te = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < Math.abs(dy)) return;
      if (dx > 60 && startX < 40) setSidebarOpen(true);
      if (dx < -60) setSidebarOpen(false);
    };
    document.addEventListener("touchstart", ts, {passive:true});
    document.addEventListener("touchmove", tm, {passive:false});
    document.addEventListener("touchend", te, {passive:true});
    return () => { document.removeEventListener("touchstart",ts); document.removeEventListener("touchmove",tm); document.removeEventListener("touchend",te); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", sidebarOpen);
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!user?.user_id) return;
    fetch(`${BASE}/credits/${user.user_id}`, { headers:{ Authorization:`Bearer ${localStorage.getItem("sociomee_token")||""}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setCreditStatus({ plan:d.plan||"free", plan_label:d.plan_label||"Free", credits_remaining:d.credits_remaining??d.credits??20, credits:d.credits_remaining??d.credits??20, monthly_limit:d.monthly_limit??20, next_reset:d.next_reset||"" });
      }).catch(()=>{});
  }, [user]);

  // Init push notifications
  useEffect(() => {
    if (user?.user_id) initPush(user.user_id);
  }, [user?.user_id]);

  const openPricing = (mode="upgrade") => { setPricingMode(mode); setShowPricing(true); };

  const handlePaymentSuccess = res => {
    if (res?.credit_status) setCreditStatus(res.credit_status);
    else if (user?.user_id) {
      fetch(`${BASE}/credits/${user.user_id}`).then(r=>r.ok?r.json():null).then(d=>{if(d)setCreditStatus(d);}).catch(()=>{});
    }
    refreshToken();
  };

  const handleSubmit = useCallback(async () => {
    if (!keyword.trim()) { setError("Please enter a keyword or topic."); return; }
    if (!platform)       { setError("Please select a platform."); return; }
    if (!tone)           { setError("Please choose a tone."); return; }
    const currentCredits = creditStatus?.credits_remaining ?? creditStatus?.credits ?? 20;
    if (Number(currentCredits) <= 0) { openPricing("nocredits"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      let data;
      if (platform === "youtube") {
        try { data = await apiFetch("/generate-full-content", { topic:keyword.trim(), persona:personality, language, country:"in", platform }); }
        catch { data = await apiFetch("/generate-platform-content", { topic:keyword.trim(), platform, tone, personality, format_type:formatType, language }); }
      } else {
        data = await apiFetch("/generate-platform-content", { topic:keyword.trim(), platform, tone, personality, format_type:formatType, language });
      }
      if (data?.credit_status) setCreditStatus(data.credit_status);
      if (user?.user_id) {
        fetch(`${BASE}/credits/${user.user_id}`).then(r=>r.ok?r.json():null).then(d=>{ if(d) setCreditStatus({ plan:d.plan||"free", plan_label:d.plan_label||"Free", credits_remaining:d.credits_remaining??d.credits??20, credits:d.credits_remaining??d.credits??20, monthly_limit:d.monthly_limit??20, next_reset:d.next_reset||"" }); }).catch(()=>{});
      }
      if (data?.error && data?.credits <= 0) { openPricing("nocredits"); setLoading(false); return; }
      if (data?.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 120);
    } catch(e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [keyword, platform, tone, personality, language, formatType, apiFetch, creditStatus, user]);

  const selPersona = PERSONAS.find(p => p.id === personality);
  const toggleTab = (tab) => { setActiveTab(tab); setSidebarOpen(false); };

  const PAGE_TITLES = {
    generate:"App | SocioMee", youtube:"YouTube | SocioMee",
    threads:"Threads | SocioMee", instagram:"Instagram | SocioMee",
    pinterest:"Pinterest | SocioMee", reddit:"Reddit | SocioMee",
    tgschedule:"Telegram | SocioMee", discord:"Discord | SocioMee",
    history:"History | SocioMee", thumbnail:"Thumbnail Studio | SocioMee",
    translator:"Translator | SocioMee", videoclipper:"Video Clipper | SocioMee",
    subtitles:"Subtitles | SocioMee", hashtags:"Hashtag Generator | SocioMee",
    texttaudio:"Text to Audio | SocioMee", hookgenerator:"Hook Generator | SocioMee",
    biowriter:"Bio Writer | SocioMee",
  };
  useEffect(() => { document.title = PAGE_TITLES[activeTab] || "SocioMee"; }, [activeTab]);

  const sbBtn = (tab, label, icon) => (
    <button key={tab} onClick={()=>toggleTab(tab)}
      style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 12px", borderRadius:"8px", border:"none", borderLeft:activeTab===tab?"3px solid #7c3aed":"3px solid transparent", background:activeTab===tab?"rgba(124,58,237,0.12)":"transparent", color:activeTab===tab?"#c4b5fd":"rgba(255,255,255,0.4)", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit", textAlign:"left", width:"100%", transition:"all 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color="rgba(255,255,255,0.75)";}}
      onMouseLeave={e=>{e.currentTarget.style.background=activeTab===tab?"rgba(124,58,237,0.12)":"transparent";e.currentTarget.style.color=activeTab===tab?"#c4b5fd":"rgba(255,255,255,0.4)";}}>
      {icon}{label}
    </button>
  );

  const CHANNELS = [
    { id:"youtube",    label:"YouTube",   color:"#ff0000", icon:<img src="/icons/youtube.png"   style={{width:16,height:16,objectFit:"contain"}} alt="yt"/> },
    { id:"threads",    label:"Threads",   color:"#ffffff", icon:<img src="/icons/threads.png"   style={{width:16,height:16,objectFit:"contain"}} alt="threads"/> },
    { id:"instagram",  label:"Instagram", color:"#e1306c", icon:<img src="/icons/instagram.png" style={{width:16,height:16,objectFit:"contain"}} alt="ig"/> },
    { id:"pinterest",  label:"Pinterest", color:"#e60023", icon:<img src="/icons/pinterest.png" style={{width:16,height:16,objectFit:"contain"}} alt="pin"/> },
    { id:"reddit",     label:"Reddit",    color:"#ff4500", icon:<img src="/icons/reddit.png"    style={{width:16,height:16,objectFit:"contain"}} alt="reddit"/> },
    { id:"tgschedule", label:"Telegram",  color:"#2aabee", icon:<img src="/icons/telegram.png"  style={{width:16,height:16,objectFit:"contain"}} alt="tg"/> },
    { id:"discord",    label:"Discord",   color:"#5865F2", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg> },
  ];

  if (authLoading) return <SkeletonScreen/>;
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", fontFamily:"'DM Sans','Syne',sans-serif", color:"#fff", overflowX:"clip", width:"100%", position:"relative" }}>

      {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)", zIndex:98 }}/>}

      <button onClick={()=>setSidebarOpen(s=>!s)} id="hamburger-btn" className={sidebarOpen?"hidden":""} style={{ position:"absolute", top:"14px", left:"14px", zIndex:101, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"6px", cursor:"pointer", display:"none", flexDirection:"column", gap:"3px", alignItems:"center" }}>
        <span style={{ width:"14px", height:"1.5px", background:"rgba(255,255,255,0.7)", display:"block", borderRadius:"2px" }}/><span style={{ width:"14px", height:"1.5px", background:"rgba(255,255,255,0.7)", display:"block", borderRadius:"2px" }}/><span style={{ width:"14px", height:"1.5px", background:"rgba(255,255,255,0.7)", display:"block", borderRadius:"2px" }}/>
      </button>

      {/* SIDEBAR */}
      <div id="app-sidebar" className={sidebarOpen?"open":""} style={{ width:"220px",flexShrink:0,background:"rgba(8,8,8,0.98)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,height:"100dvh",zIndex:200,overflowY:"auto",overflowX:"hidden",scrollbarWidth:"none",msOverflowStyle:"none",transition:"transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)" }}>

        {/* Logo */}
        <div style={{padding:"16px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:"16px",fontWeight:"900",fontFamily:"'Orbitron',sans-serif",color:"#fff",letterSpacing:"2px"}}>SOCIOMEE</div>
          {sidebarOpen && <button onClick={()=>setSidebarOpen(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",width:"28px",height:"28px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.5)",fontSize:"14px",fontWeight:"300"}}>✕</button>}
        </div>

        {/* Profile */}
        {isLoggedIn && (
          <button onClick={()=>{ if(profilePanelOpen){ setProfilePanelOpen(false); setLangMenuOpen(false); } else setProfilePanelOpen(true); }} style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 16px",border:"none",background:profilePanelOpen?"rgba(124,58,237,0.1)":"transparent",cursor:"pointer",fontFamily:"inherit",width:"100%",textAlign:"left",flexShrink:0,transition:"all 0.15s",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            {user?.picture
              ? <img src={user.picture} alt="" referrerPolicy="no-referrer" style={{width:"34px",height:"34px",borderRadius:"50%",objectFit:"cover",flexShrink:0}}/>
              : <div style={{width:"34px",height:"34px",borderRadius:"50%",background:"linear-gradient(135deg,#7c3aed,#ff3d8f)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:"800",color:"#fff",flexShrink:0}}>{(user?.email||"U")[0].toUpperCase()}</div>
            }
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"12px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name||user?.email?.split("@")[0]||"User"}</div>
              <div style={{fontSize:"10px",color:"#a78bfa",fontWeight:"600"}}>✦ {creditStatus?.plan_label||"Free"}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" style={{transform:profilePanelOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        )}

        {/* Nav */}
        <nav style={{flex:1,display:"flex",flexDirection:"column",padding:"8px 8px",gap:"1px",overflowY:"auto",overflowX:"hidden",scrollbarWidth:"none",msOverflowStyle:"none"}}>

          {/* Generate */}
          <button onClick={()=>{setActiveTab("generate");setSidebarOpen(false);}} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"8px",border:"none",background:activeTab==="generate"?"rgba(124,58,237,0.15)":"transparent",color:activeTab==="generate"?"#c4b5fd":"rgba(255,255,255,0.45)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s",borderLeft:activeTab==="generate"?"3px solid #7c3aed":"3px solid transparent"}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Generate
          </button>

          {/* Channels label */}
          <div style={{fontSize:"9px",fontWeight:"700",color:"rgba(255,255,255,0.18)",letterSpacing:"1.5px",padding:"12px 12px 4px",textTransform:"uppercase"}}>Connect</div>

          {CHANNELS.map(ch=>(
            <button key={ch.id} onClick={()=>{toggleTab(ch.id);setSidebarOpen(false);}}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:"8px",border:"none",borderLeft:activeTab===ch.id?`3px solid ${ch.color}`:"3px solid transparent",background:activeTab===ch.id?`${ch.color}14`:"transparent",color:activeTab===ch.id?ch.color:"rgba(255,255,255,0.4)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}>
              <span style={{display:"flex",alignItems:"center",gap:"8px"}}>{ch.icon}{ch.label}</span>
            </button>
          ))}

          {/* Tools label */}
          <div style={{fontSize:"9px",fontWeight:"700",color:"rgba(255,255,255,0.18)",letterSpacing:"1.5px",padding:"12px 12px 4px",textTransform:"uppercase"}}>Tools</div>

          {/* YouTube Tools */}
          <button onClick={()=>toggleGroup("youtube")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.youtube?"rgba(255,0,0,0.06)":"transparent",color:openGroups.youtube?"#ff6b6b":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/youtube.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>YouTube Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.youtube?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.youtube && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,0,0,0.15)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"videoclipper",label:"Video Clipper",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>},
                {tab:"subtitles",label:"Subtitles",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>},
                {tab:"hookgenerator",label:"Hook Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"thumbnail",label:"Thumbnail Studio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:"Text to Audio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>},
                {tab:"yt-keyword",label:"Keyword Research",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>},
                {tab:"yt-trending",label:"Trending Videos",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>},
                {tab:"seo",label:"SEO Analyzer",fn:()=>{setYoutubeInitialTab("seo");setActiveTab("youtube");setSidebarOpen(false);},icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>},
                {tab:"yt-evergreen",label:"Evergreen Score",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V12M12 12C12 8 8 6 6 6c1 3 3 5 6 6zM12 12C12 8 16 6 18 6c-1 3-3 5-6 6z"/></svg>},
                {tab:"yt-ideas",label:"Daily Video Ideas",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>},
                {tab:"screenrecorder",label:"Screen Recorder",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>},
              ].map(item=>(
                <button key={item.tab} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #7c3aed":"2px solid transparent",background:activeTab===item.tab?"rgba(124,58,237,0.12)":"transparent",color:activeTab===item.tab?"#c4b5fd":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#c4b5fd":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(124,58,237,0.12)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          {/* Instagram Tools */}
          <button onClick={()=>toggleGroup("instagram")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.instagram?"rgba(225,48,108,0.06)":"transparent",color:openGroups.instagram?"#f472b6":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/instagram.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Instagram Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.instagram?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.instagram && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(225,48,108,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"hashtags",label:"Hashtag Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>},
                {tab:"biowriter",label:"Bio Writer",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"hookgenerator",label:"Hook Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:"Text to Audio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-ig"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #e1306c":"2px solid transparent",background:activeTab===item.tab?"rgba(225,48,108,0.1)":"transparent",color:activeTab===item.tab?"#f9a8d4":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#f9a8d4":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(225,48,108,0.1)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          {/* Telegram Tools */}
          <button onClick={()=>toggleGroup("telegram")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.telegram?"rgba(37,199,220,0.06)":"transparent",color:openGroups.telegram?"#2aabee":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="#2aabee"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.086l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.646.5z"/></svg>Telegram Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.telegram?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.telegram && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(37,199,220,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"tg-hook",label:"Hook Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"tg-poll",label:"Poll Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>},
                {tab:"tg-besttime",label:"Best Time to Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"tg-scheduler",label:"Broadcast Scheduler",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:"Text to Audio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-tg"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #2aabee":"2px solid transparent",background:activeTab===item.tab?"rgba(37,199,220,0.1)":"transparent",color:activeTab===item.tab?"#7dd3fc":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#7dd3fc":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(37,199,220,0.1)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          
          {/* Pinterest Tools */}
          <button onClick={()=>toggleGroup("pinterest")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.pinterest?"rgba(230,0,35,0.06)":"transparent",color:openGroups.pinterest?"#ff6b8a":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/pinterest.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Pinterest Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.pinterest?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.pinterest && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(230,0,35,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"pt-pindesc",label:"Pin Description",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"pt-board",label:"Board Names",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>},
                {tab:"pt-hashtag",label:"Hashtag Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>},
                {tab:"pt-besttime",label:"Best Time to Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:"Text to Audio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-pt"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #e60023":"2px solid transparent",background:activeTab===item.tab?"rgba(230,0,35,0.1)":"transparent",color:activeTab===item.tab?"#ff6b8a":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#ff6b8a":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(230,0,35,0.1)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          {/* Threads Tools */}
          <button onClick={()=>toggleGroup("threads")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.threads?"rgba(255,255,255,0.06)":"transparent",color:openGroups.threads?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/threads.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Threads Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.threads?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.threads && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,255,255,0.12)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"th-thread",label:"Thread Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
                {tab:"th-bio",label:"Bio Writer",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"th-hook",label:"Hook Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:"Text to Audio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-th"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #ffffff":"2px solid transparent",background:activeTab===item.tab?"rgba(255,255,255,0.08)":"transparent",color:activeTab===item.tab?"#ffffff":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#ffffff":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(255,255,255,0.08)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          {/* Reddit Tools */}
          <button onClick={()=>toggleGroup("reddit")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.reddit?"rgba(255,69,0,0.06)":"transparent",color:openGroups.reddit?"#fb923c":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/reddit.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Reddit Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.reddit?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.reddit && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,69,0,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"rd-title",label:"Post Title Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"rd-subreddit",label:"Subreddit Finder",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>},
                {tab:"rd-besttime",label:"Best Time to Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:"Text to Audio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-rd"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #ff4500":"2px solid transparent",background:activeTab===item.tab?"rgba(255,69,0,0.1)":"transparent",color:activeTab===item.tab?"#fb923c":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#fb923c":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(255,69,0,0.1)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          
          {/* LinkedIn Tools */}
          <button onClick={()=>toggleGroup("linkedin")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.linkedin?"rgba(0,119,181,0.06)":"transparent",color:openGroups.linkedin?"#60a5fa":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/linkedin.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>LinkedIn Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.linkedin?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.linkedin && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(0,119,181,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"li-post",label:"Post Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"li-headline",label:"Headline Writer",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"li-about",label:"About Section",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>},
                {tab:"li-carousel",label:"Carousel Ideas",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M17 7V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"/></svg>},
                {tab:"li-hashtag",label:"Hashtag Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>},
                {tab:"li-besttime",label:"Best Time to Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:"Text to Audio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-li"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #0077b5":"2px solid transparent",background:activeTab===item.tab?"rgba(0,119,181,0.1)":"transparent",color:activeTab===item.tab?"#60a5fa":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#60a5fa":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(0,119,181,0.1)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          {/* Facebook Tools */}
          <button onClick={()=>toggleGroup("facebook")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.facebook?"rgba(24,119,242,0.06)":"transparent",color:openGroups.facebook?"#93c5fd":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/facebook.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Facebook Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.facebook?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.facebook && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(24,119,242,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"fb-post",label:"Post Caption",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"fb-group",label:"Group Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
                {tab:"fb-ad",label:"Ad Copy",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>},
                {tab:"fb-besttime",label:"Best Time to Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:"Text to Audio",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-fb"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #1877f2":"2px solid transparent",background:activeTab===item.tab?"rgba(24,119,242,0.1)":"transparent",color:activeTab===item.tab?"#93c5fd":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#93c5fd":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(24,119,242,0.1)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
          
          {/* TikTok Tools */}
          <button onClick={()=>toggleGroup("tiktok")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.tiktok?"rgba(255,0,80,0.06)":"transparent",color:openGroups.tiktok?"#ff6b8a":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/tiktok.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>TikTok Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.tiktok?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.tiktok && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,0,80,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"tt-hook",label:"Hook Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"tt-caption",label:"Caption Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"tt-ideas",label:"Video Idea Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>},
                {tab:"tt-hashtag",label:"Hashtag Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>},
                {tab:"tt-besttime",label:"Best Time to Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-tt"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #ff0050":"2px solid transparent",background:activeTab===item.tab?"rgba(255,0,80,0.1)":"transparent",color:activeTab===item.tab?"#ff6b8a":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#ff6b8a":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(255,0,80,0.1)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          {/* WhatsApp Tools */}
          <button onClick={()=>toggleGroup("whatsapp")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.whatsapp?"rgba(37,211,102,0.06)":"transparent",color:openGroups.whatsapp?"#4ade80":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/whatsapp.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>WhatsApp Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.whatsapp?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.whatsapp && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(37,211,102,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"wa-broadcast",label:"Broadcast Messages",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.93 3.25 2 2 0 0 1 3.89 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>},
                {tab:"wa-reply",label:"Reply Templates",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
                {tab:"wa-channel",label:"Channel Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-wa"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #25d366":"2px solid transparent",background:activeTab===item.tab?"rgba(37,211,102,0.1)":"transparent",color:activeTab===item.tab?"#4ade80":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#4ade80":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(37,211,102,0.1)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}

          {/* X Tools */}
          <button onClick={()=>toggleGroup("xtools")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.xtools?"rgba(255,255,255,0.06)":"transparent",color:openGroups.xtools?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/x.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>X Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.xtools?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.xtools && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,255,255,0.12)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"x-post",label:"Post Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"x-thread",label:"Thread Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
                {tab:"x-hook",label:"Hook Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"x-besttime",label:"Best Time to Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:"Translator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
              ].map(item=>(
                <button key={item.tab+"-x"} onClick={()=>{toggleTab(item.tab);setSidebarOpen(false);}}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #ffffff":"2px solid transparent",background:activeTab===item.tab?"rgba(255,255,255,0.08)":"transparent",color:activeTab===item.tab?"#ffffff":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#ffffff":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(255,255,255,0.08)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
          {/* Analytics & Tools */}
          <button onClick={()=>toggleGroup("analytics")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.analytics?"rgba(124,58,237,0.06)":"transparent",color:openGroups.analytics?"#a78bfa":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Analytics & Tools</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.analytics?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.analytics && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(124,58,237,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"history",label:"History",fn:()=>toggleTab("history"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"calendar",label:"SocioMee Calendar",fn:()=>toggleTab("calendar"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
                {tab:"news",label:"SocioMee News",fn:()=>toggleTab("news"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>},
                {tab:"notes",label:"SocioMee Notes",fn:()=>toggleTab("notes"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>},
                {tab:"vault",label:"SocioMee Cloud",fn:()=>toggleTab("vault"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>},
                {tab:"share",label:"SocioMee Share",fn:()=>toggleTab("share"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>},
                {tab:"pixel",label:"SocioMee Pixel",fn:()=>toggleTab("pixel"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>},
                {tab:"pdf",label:"SocioMee PDF",fn:()=>toggleTab("pdf"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
                {tab:"guides",label:"Guides & Blog",fn:()=>window.open("https://sociomee.in/blog","_blank"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>},
              ].map(item=>(
                <button key={item.tab} onClick={item.fn}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid #7c3aed":"2px solid transparent",background:activeTab===item.tab?"rgba(124,58,237,0.12)":"transparent",color:activeTab===item.tab?"#c4b5fd":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#c4b5fd":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(124,58,237,0.12)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div style={{flexShrink:0,borderTop:"1px solid rgba(255,255,255,0.05)",padding:"12px 8px"}}>
          {!isPro&&<a href="https://sociomee.in/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"10px",borderRadius:"99px",background:"linear-gradient(135deg,#7c3aed,#9b5cf6)",color:"#fff",fontSize:"13px",fontWeight:"700",textDecoration:"none",boxShadow:"0 0 20px rgba(124,58,237,0.35)",marginBottom:"8px"}}>✦ Upgrade to Pro</a>}
          <button onClick={logout} style={{width:"100%",padding:"9px",borderRadius:"99px",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>Sign out</button>
        </div>

      </div>

      {/* PROFILE SLIDE-UP OVERLAY */}
      {profilePanelOpen && <div onClick={()=>setProfilePanelOpen(false)} style={{position:"fixed",inset:0,zIndex:9998}}/>}
      <div style={{position:"fixed",bottom:"60px",left:0,width:"220px",zIndex:9999,background:"rgba(10,8,20,0.98)",backdropFilter:"blur(24px)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:"16px 16px 0 0",padding:"16px 14px 20px",transform:profilePanelOpen?"translateY(0)":"translateY(120%)",visibility:profilePanelOpen?"visible":"hidden",pointerEvents:profilePanelOpen?"all":"none",transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)"}}>
        <div style={{width:"32px",height:"3px",borderRadius:"99px",background:"rgba(255,255,255,0.12)",margin:"0 auto 14px"}}/>
        <button onClick={()=>{setShowPlansPopup(true);setProfilePanelOpen(false);}} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",borderRadius:"10px",border:"none",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.7)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:"4px",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span style={{flex:1}}>Plans</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button onClick={()=>{setShowUsagePopup(true);setProfilePanelOpen(false);}} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",borderRadius:"10px",border:"none",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.7)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:"4px",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{flex:1}}>Usage</span>
          <span style={{fontSize:"11px",color:"#a78bfa",fontWeight:"700"}}>{creditStatus?.credits_remaining||0}/{creditStatus?.monthly_limit||20}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button onClick={()=>{setChannelSettingsOpen(true);setProfilePanelOpen(false);}} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",borderRadius:"10px",border:"none",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.7)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:"4px",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          <span style={{flex:1}}>Channel Settings</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button onClick={()=>{setShowNotificationsModal(true);setProfilePanelOpen(false);}} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",borderRadius:"10px",border:"none",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.7)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:"4px",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span style={{flex:1}}>Notifications</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button onClick={()=>{setShowDeleteModal(true);setProfilePanelOpen(false);}} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",borderRadius:"10px",border:"none",background:"rgba(255,255,255,0.03)",color:"rgba(239,68,68,0.8)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:"4px",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          <span style={{flex:1}}>Delete Account</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div style={{position:"relative"}}><button onClick={()=>setLangMenuOpen(l=>!l)} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",borderRadius:langMenuOpen?"0 0 10px 10px":"10px",border:"none",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.7)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span style={{flex:1}}>Language</span>
          <span style={{fontSize:"11px",color:"#a78bfa",fontWeight:"700"}}>{LANGS.find(l=>l.code===UI_LANG)?.label||"English"}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" style={{transform:langMenuOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {langMenuOpen && (
          <div style={{position:"absolute",bottom:"100%",left:0,right:0,background:"rgba(8,6,18,0.98)",border:"1px solid rgba(124,58,237,0.2)",borderBottom:"none",borderRadius:"10px 10px 0 0",padding:"6px 6px 4px",zIndex:300}}>
            {LANGS.map(({code,label})=>{ const isActive=UI_LANG===code; return (
              <button key={code} onClick={()=>{localStorage.setItem("sociomee_lang",code);window.location.reload();}} style={{display:"flex",alignItems:"center",gap:"8px",width:"100%",padding:"8px 10px",borderRadius:"8px",border:"none",background:isActive?"rgba(124,58,237,0.15)":"transparent",color:isActive?"#a78bfa":"rgba(255,255,255,0.6)",fontSize:"12px",fontWeight:isActive?"700":"500",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}} onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="rgba(255,255,255,0.05)";}} onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent";}}>
                <span>{label}</span>
                {isActive&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="3" style={{marginLeft:"auto"}}><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );})}
          </div>
        )}
        </div>
      </div>

      {showNotificationsModal && (
        <div onClick={()=>setShowNotificationsModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"rgba(13,13,20,0.98)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"360px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
              <div style={{fontSize:"16px",fontWeight:"800",color:"#fff",fontFamily:"Poppins,sans-serif"}}>🔔 Notifications</div>
              <button onClick={()=>setShowNotificationsModal(false)} style={{width:"30px",height:"30px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            {[{key:"newFeatures",label:"New Features",desc:"Get notified when we launch new tools"},{key:"weeklyTips",label:"Weekly Tips",desc:"Creator tips every week"},{key:"usageAlerts",label:"Usage Alerts",desc:"Alert when credits are running low"},{key:"proOffers",label:"Pro Offers",desc:"Exclusive deals and discounts"}].map(({key,label,desc})=>(
              <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px",borderRadius:"10px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",marginBottom:"8px"}}>
                <div><div style={{fontSize:"13px",fontWeight:"700",color:"#fff",fontFamily:"Poppins,sans-serif"}}>{label}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",fontFamily:"Poppins,sans-serif",marginTop:"2px"}}>{desc}</div></div>
                <button onClick={()=>setNotifSettings(p=>({...p,[key]:!p[key]}))} style={{width:"44px",height:"24px",borderRadius:"99px",border:"none",background:notifSettings[key]?"#7c3aed":"rgba(255,255,255,0.1)",cursor:"pointer",position:"relative",transition:"all 0.2s",flexShrink:0}}>
                  <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",position:"absolute",top:"3px",transition:"all 0.2s",left:notifSettings[key]?"23px":"3px"}}/>
                </button>
              </div>
            ))}
            <button onClick={()=>setShowNotificationsModal(false)} style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#7c3aed,#9333ea)",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:"pointer",fontFamily:"Poppins,sans-serif",marginTop:"8px"}}>Save Preferences</button>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div onClick={()=>{setShowDeleteModal(false);setDeleteConfirm('');}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"rgba(13,13,20,0.98)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"360px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
              <div style={{fontSize:"16px",fontWeight:"800",color:"#ef4444",fontFamily:"Poppins,sans-serif"}}>🗑️ Delete Account</div>
              <button onClick={()=>{setShowDeleteModal(false);setDeleteConfirm('');}} style={{width:"30px",height:"30px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:"10px",padding:"12px",marginBottom:"16px"}}>
              <div style={{fontSize:"12px",color:"rgba(239,68,68,0.9)",fontFamily:"Poppins,sans-serif",lineHeight:"1.6"}}>⚠️ This will permanently delete your account, all your generated content, saved history, and credits. This action cannot be undone.</div>
            </div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontFamily:"Poppins,sans-serif",marginBottom:"8px"}}>Type <span style={{color:"#ef4444",fontWeight:"700"}}>DELETE</span> to confirm</div>
            <input value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="Type DELETE here" style={{width:"100%",padding:"10px 12px",borderRadius:"8px",border:"1px solid rgba(239,68,68,0.2)",background:"rgba(255,255,255,0.03)",color:"#fff",fontSize:"13px",fontFamily:"Poppins,sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"12px"}}/>
            <button disabled={deleteConfirm!=="DELETE"} onClick={()=>{if(deleteConfirm==="DELETE"){fetch("/api/auth/delete-account",{method:"DELETE",headers:{"Authorization":"Bearer "+localStorage.getItem("token")}}).then(()=>{localStorage.clear();window.location.href="/";});}}} style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:deleteConfirm==="DELETE"?"#ef4444":"rgba(239,68,68,0.2)",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:deleteConfirm==="DELETE"?"pointer":"not-allowed",fontFamily:"Poppins,sans-serif",opacity:deleteConfirm==="DELETE"?1:0.5,transition:"all 0.2s"}}>Delete My Account Permanently</button>
          </div>
        </div>
      )}
      {/* USAGE POPUP */}
      {showPlansPopup && (
        <div onClick={()=>setShowPlansPopup(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:"400px",background:"rgba(10,8,20,0.98)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"20px",padding:"24px",boxShadow:"0 24px 80px rgba(0,0,0,0.9),0 0 60px rgba(124,58,237,0.12)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
              <div><h2 style={{fontSize:"16px",fontWeight:"800",color:"#fff",margin:0}}>Your Plan</h2><p style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"3px"}}>Manage your subscription</p></div>
              <button onClick={()=>setShowPlansPopup(false)} style={{width:"30px",height:"30px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(255,61,143,0.08))",border:"1px solid rgba(124,58,237,0.3)",borderRadius:"16px",padding:"20px",marginBottom:"16px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.4)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px"}}>Current Plan</div>
              <div style={{fontSize:"24px",fontWeight:"900",color:"#fff",marginBottom:"4px"}}>✦ {creditStatus?.plan_label||"Free"}</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>{creditStatus?.credits_remaining||0} of {creditStatus?.monthly_limit||20} credits remaining</div>
            </div>
            {plan==="free" && (
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <a href="https://sociomee.in/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px",borderRadius:"99px",background:"linear-gradient(135deg,#7c3aed,#ff3d8f)",color:"#fff",fontWeight:"800",fontSize:"14px",textDecoration:"none",boxShadow:"0 4px 20px rgba(124,58,237,0.4)"}}>✦ Upgrade to Pro — ₹499/mo</a>
                <a href="https://sociomee.in/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px",borderRadius:"99px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",fontWeight:"700",fontSize:"14px",textDecoration:"none"}}>View All Plans</a>
              </div>
            )}
            {plan==="pro" && (
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <a href="https://sociomee.in/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px",borderRadius:"99px",background:"linear-gradient(135deg,#7c3aed,#ff3d8f)",color:"#fff",fontWeight:"800",fontSize:"14px",textDecoration:"none",boxShadow:"0 4px 20px rgba(124,58,237,0.4)"}}>⬆ Upgrade to Premium — ₹1,999/mo</a>
                <button style={{padding:"13px",borderRadius:"99px",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.3)",color:"#a78bfa",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Cancel Subscription</button>
              </div>
            )}
            {(plan==="premium"||plan==="premium_annual") && (
              <button style={{width:"100%",padding:"13px",borderRadius:"99px",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.3)",color:"#a78bfa",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Cancel Subscription</button>
            )}
          </div>
        </div>
      )}
      {showUsagePopup && (
        <div onClick={()=>setShowUsagePopup(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:"400px",background:"rgba(10,8,20,0.98)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"20px",padding:"24px",boxShadow:"0 24px 80px rgba(0,0,0,0.9),0 0 60px rgba(124,58,237,0.12)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
              <div><h2 style={{fontSize:"16px",fontWeight:"800",color:"#fff",margin:0}}>Credit Usage</h2><p style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"3px"}}>Track your credit usage and history</p></div>
              <button onClick={()=>setShowUsagePopup(false)} style={{width:"30px",height:"30px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"20px"}}>
              <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"14px",padding:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.35)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>Credits Left</div>
                <div style={{fontSize:"28px",fontWeight:"900",color:"#fff"}}>{creditStatus?.credits_remaining||0}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.3)"}}>of {creditStatus?.monthly_limit||20}</div>
              </div>
              <div style={{background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"14px",padding:"16px"}}>
                <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.35)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>Plan</div>
                <div style={{fontSize:"16px",fontWeight:"900",color:"#fff"}}>{creditStatus?.plan_label||"Free"}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"4px"}}>Current plan</div>
              </div>
            </div>
            <div style={{marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                <span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>Used this month</span>
                <span style={{fontSize:"12px",fontWeight:"700",color:"#a78bfa"}}>{(creditStatus?.monthly_limit||20)-(creditStatus?.credits_remaining||0)}</span>
              </div>
              <div style={{height:"8px",borderRadius:"99px",background:"rgba(255,255,255,0.08)"}}>
                <div style={{height:"100%",borderRadius:"99px",background:"linear-gradient(90deg,#7c3aed,#ff3d8f)",width:`${Math.min(100,(((creditStatus?.monthly_limit||20)-(creditStatus?.credits_remaining||0))/(creditStatus?.monthly_limit||20))*100)}%`,transition:"width 0.3s"}}/>
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"12px",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>Resets on</span>
              <span style={{fontSize:"12px",fontWeight:"700",color:"#fff"}}>{creditStatus?.next_reset?new Date(creditStatus.next_reset).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"Monthly"}</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {activeTab==="notes" && isLoggedIn && (
        <div style={{ marginLeft:"220px", flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee Notes" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeeNotes onSendToGenerator={()=>setActiveTab("generate")}/>
          </PlanGate>
        </div>
      )}
      {activeTab==="vault" && isLoggedIn && (
        <div style={{ marginLeft:"220px", flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee Cloud" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeeCloud/>
          </PlanGate>
        </div>
      )}
      {activeTab==="calendar" && isLoggedIn && (
        <div style={{ marginLeft:"220px", flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:100 }}>
          <SocioMeeCalendar/>
        </div>
      )}
      {activeTab==="share" && isLoggedIn && (
        <div style={{ marginLeft:"220px", flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee Share" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeeShare/>
          </PlanGate>
        </div>
      )}
      {activeTab==="pixel" && isLoggedIn && (
        <div style={{ marginLeft:"220px", flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee Pixel" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeePixel/>
          </PlanGate>
        </div>
      )}
      {activeTab==="pdf" && isLoggedIn && (
        <div style={{ marginLeft:"220px", flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee PDF" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeePDF onSendToGenerator={(text)=>setActiveTab("generate")}/>
          </PlanGate>
        </div>
      )}
      <div id="main-content" style={{ marginLeft:"220px", flex:1, padding:"48px 32px 80px", minHeight:"100vh", overflowX:"hidden", display:(activeTab==="notes"||activeTab==="pdf"||activeTab==="pixel"||activeTab==="share"||activeTab==="vault"||activeTab==="calendar")?"none":"block" }}>
        <div style={{ maxWidth:"860px", margin:"0 auto" }}>

          <div style={{ marginBottom:"28px" }}>
            
            <h1 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:"700", fontFamily:"'Orbitron',sans-serif", color:"#fff", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"6px" }}>SOCIOMEE</h1>
            <p style={{ fontSize:"15px", color:"rgba(255,255,255,0.35)" }}>{t("oneTopicInfinite")}</p>
          </div>

          {!isLoggedIn && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <h2 style={{ color:"#fff", fontFamily:"'Orbitron',sans-serif", fontSize:"22px", marginBottom:"12px" }}>Welcome to SocioMee</h2>
              <p style={{ color:"rgba(255,255,255,0.4)", marginBottom:"24px" }}>Please log in to access all tools.</p>
              <a href="/app/login" style={{ padding:"12px 32px", borderRadius:"99px", background:"linear-gradient(135deg,#7c3aed,#ff3d8f)", color:"#fff", fontWeight:"800", textDecoration:"none", fontSize:"14px" }}>Log In</a>
            </div>
          )}

          {activeTab==="generate" && isLoggedIn && (
            <>
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:"18px", padding:"24px", backdropFilter:"blur(16px)", marginBottom:"20px" }}>

                {/* Keyword Input */}
                <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"10px" }}>KEYWORD / TOPIC</div>
                <input value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  placeholder="e.g. skincare routine, crypto scam, fake influencers..."
                  style={{ width:"100%", padding:"14px 22px", borderRadius:"99px", border:"1.5px solid rgba(124,58,237,0.25)", outline:"none", fontSize:"15px", color:"#fff", background:"rgba(255,255,255,0.05)", fontFamily:"inherit", boxSizing:"border-box", marginBottom:"20px", transition:"border 0.2s" }}
                  onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="rgba(124,58,237,0.25)"}/>

                {/* Platform Grid */}
                <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"10px" }}>PLATFORM</div>
                <div className="platform-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"20px" }}>
                  {PLATFORMS.map(p=>(
                    <button key={p.id} onClick={()=>setPlatform(p.id)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"6px", padding:"12px 8px", borderRadius:"28px", border:`1.5px solid ${platform===p.id?p.color:"rgba(255,255,255,0.08)"}`, background:platform===p.id?`${p.color}18`:"rgba(255,255,255,0.03)", color:platform===p.id?p.color:"rgba(255,255,255,0.5)", fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:platform===p.id?`0 0 12px ${p.color}30`:"none" }}>
                      <img src={p.img} alt={p.label} style={{ width:"22px", height:"22px", objectFit:"contain" }} onError={e=>e.target.style.display="none"}/><span className="platform-label">{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* DESKTOP: Persona Language Format in one row */}
                <div className="plf-desktop" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"20px" }}>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"8px" }}>PERSONA</div>
                    <CustomSelect value={personality} onChange={setPersonality} label="Select Persona" options={PERSONAS.map(p => ({ id:p.id, label:p.label }))}/>
                  </div>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"8px" }}>LANGUAGE</div>
                    <CustomSelect value={language} onChange={setLanguage} label="Select Language" options={[{id:"hinglish",label:"Hinglish"},{id:"hindi",label:"Hindi"},{id:"english",label:"English"},{id:"marathi",label:"Marathi"},{id:"tamil",label:"Tamil"},{id:"bengali",label:"Bengali"}]}/>
                  </div>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"8px" }}>FORMAT</div>
                    <CustomSelect value={formatType} onChange={setFormatType} label="Select Format" options={[{id:"long",label:"Long Form"},{id:"short",label:"Short Form"},{id:"thread",label:"Thread"},{id:"reel",label:"Reel Script"}]}/>
                  </div>
                </div>

                {/* MOBILE: Persona + Language side by side, smaller font */}
                <div className="plf-mobile" style={{ display:"none", gap:"8px", marginBottom:"16px" }}>
                  <div style={{ flex:"3" }}>
                    <div style={{ fontSize:"9px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"6px" }}>PERSONA</div>
                    <CustomSelect value={personality} onChange={setPersonality} label="Persona" options={PERSONAS.map(p => ({ id:p.id, label:p.label }))}/>
                  </div>
                  <div style={{ flex:"2" }}>
                    <div style={{ fontSize:"9px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"6px" }}>LANGUAGE</div>
                    <CustomSelect value={language} onChange={setLanguage} label="Language" options={[{id:"hinglish",label:"Hinglish"},{id:"hindi",label:"Hindi"},{id:"english",label:"English"},{id:"marathi",label:"Marathi"},{id:"tamil",label:"Tamil"},{id:"bengali",label:"Bengali"}]}/>
                  </div>
                </div>

                {/* TONE - Pills desktop, Dropdown mobile */}
                <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"10px" }}>TONE</div>
                <div className="tone-pills" style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"16px" }}>
                  {[
                    {id:"bold",label:"Bold",emoji:"🔥"},{id:"funny",label:"Funny",emoji:"😂"},
                    {id:"emotional",label:"Emotional",emoji:"💖"},{id:"informative",label:"Informative",emoji:"📚"},
                    {id:"aggressive",label:"Aggressive",emoji:"⚡"},{id:"sales",label:"Sales",emoji:"💸"},
                    {id:"dramatic",label:"Dramatic",emoji:"🎭"},{id:"casual",label:"Casual",emoji:"😎"},
                    {id:"motivational",label:"Motivational",emoji:"🚀"},{id:"storytelling",label:"Storytelling",emoji:"📖"},
                    {id:"educational",label:"Educational",emoji:"🎓"},{id:"trending",label:"Trending",emoji:"📈"},
                    {id:"cinematic",label:"Cinematic",emoji:"🎬"},
                  ].map(tn=>(
                    <button key={tn.id} onClick={()=>setTone(tn.id)}
                      style={{ padding:"7px 14px", borderRadius:"99px", border:`1.5px solid ${tone===tn.id?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.1)"}`, background:tone===tn.id?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)", color:tone===tn.id?"#c4b5fd":"rgba(255,255,255,0.6)", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:tone===tn.id?"0 0 10px rgba(124,58,237,0.3)":"none" }}>
                      {tn.emoji} {tn.label}
                    </button>
                  ))}
                </div>
                <div className="tone-dropdown" style={{ display:"none", marginBottom:"16px", width:"100%" }}>
                  <CustomSelect centered={true} value={tone} onChange={setTone} grid={true} label="😎 Casual" options={[
                    {id:"bold",label:"🔥 Bold"},{id:"funny",label:"😂 Funny"},
                    {id:"emotional",label:"💖 Emotional"},{id:"informative",label:"📚 Informative"},
                    {id:"aggressive",label:"⚡ Aggressive"},{id:"sales",label:"💸 Sales"},
                    {id:"dramatic",label:"🎭 Dramatic"},{id:"casual",label:"😎 Casual"},
                    {id:"motivational",label:"🚀 Motivational"},{id:"storytelling",label:"📖 Storytelling"},
                    {id:"educational",label:"🎓 Educational"},{id:"cinematic",label:"🎬 Cinematic"},
                  ]}/>
                </div>

                {/* FORMAT - mobile only dropdown (desktop is in PLF row) */}
                <div className="format-mobile-only" style={{ display:"none", marginBottom:"16px" }}>
                  <div style={{ fontSize:"9px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"6px" }}>FORMAT</div>
                  <CustomSelect centered={true} value={formatType} onChange={setFormatType} grid={true} label="Long Form" options={[{id:"long",label:"Long Form"},{id:"short",label:"Short Form"},{id:"thread",label:"Thread"},{id:"reel",label:"Reel Script"}]}/>
                </div>


                {/* Persona info line */}
                {selPersona && (
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"16px", fontWeight:"600" }}>
                    <span style={{ color:"#a78bfa", fontWeight:"700" }}>{selPersona.flag} {selPersona.label}</span>
                    {" · "}{language.charAt(0).toUpperCase()+language.slice(1)}{" · Auto-selected"}
                  </div>
                )}

                {error && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:"10px", padding:"12px 16px", marginBottom:"16px", color:"#f87171", fontSize:"13px" }}>⚠ {error}</div>}

                {/* Generate Button - Glass style */}
                <button onClick={handleSubmit} disabled={loading||!keyword.trim()}
                  className="gen-btn"
                  style={{ width:"100%", padding:"16px", borderRadius:"99px", border:"1.5px solid rgba(124,58,237,0.6)", background:loading||!keyword.trim()?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.15)", backdropFilter:"blur(16px)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer", fontFamily:"inherit", boxShadow:loading||!keyword.trim()?"none":"0 0 24px rgba(124,58,237,0.5),0 0 60px rgba(124,58,237,0.2)", transition:"all 0.3s", opacity:loading||!keyword.trim()?0.5:1, letterSpacing:"1px" }}>
                  {loading ? (
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                      <span style={{ width:"16px", height:"16px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite", display:"inline-block" }}/>
                      {platform==="youtube"?"Running 6-engine pipeline…":"Generating content…"}
                    </span>
                  ) : "✦ Generate Content"}
                </button>
              </div>

              {loading && (
                <div style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:"18px", padding:"32px", marginBottom:"20px", textAlign:"center" }}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"50%", border:"3px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.7s linear infinite", margin:"0 auto 16px" }}/>
                  <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"14px" }}>{platform==="youtube"?"Running 6-engine AI pipeline…":"Generating your content…"}</p>
                </div>
              )}

              <div ref={resultRef}>
                {result && <ResultPanel result={result} platform={platform} keyword={keyword} isPro={isPro} onUpgradeClick={()=>openPricing("upgrade")} user={user}/>}
              </div>
            </>
          )}

          {activeTab==="youtube"    && isLoggedIn && <YouTubeDashboard user={user} initialTab={youtubeInitialTab}/>}
          {activeTab==="threads"    && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><ComingSoonCard platform="Threads" icon="/icons/threads.png" color="#ffffff" message="Threads integration coming soon! Schedule posts, analyze engagement and grow your audience."/></div>}
          {activeTab==="instagram"  && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><ComingSoonCard platform="Instagram" icon="/icons/instagram.png" color="#e1306c" message="Instagram integration coming soon. Direct posting, Reels analytics and hashtag performance."/></div>}
          {activeTab==="pinterest"  && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><ComingSoonCard platform="Pinterest" icon="/icons/pinterest.png" color="#e60023" message="Pinterest integration coming soon. Schedule pins and grow your Pinterest presence."/></div>}
          {activeTab==="reddit"     && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><ComingSoonCard platform="Reddit" icon="/icons/reddit.png" color="#ff4500" message="Reddit integration coming soon. Post to subreddits and track upvotes."/></div>}
          {activeTab==="tgschedule" && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><TelegramScheduler user={user}/></div>}
          {activeTab==="discord"    && isLoggedIn && <DiscordScheduler user={user}/>}
          {activeTab==="history"    && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><HistoryPanel user={user} onReuse={(topic,platform)=>{ setKeyword(topic); setPlatform(platform); setActiveTab("generate"); }}/></div>}
          {activeTab==="news" && isLoggedIn && <SocioMeeNews userId={user?.email||"anonymous"}/>}

          {activeTab==="translator" && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><Translator user={user}/></div>}
          {activeTab==="videoclipper"&&isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><VideoClipper user={user}/></div>}
          {activeTab==="subtitles"  && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><SubtitleGenerator user={user}/></div>}
          {activeTab==="tg-hook"     && isLoggedIn && <TelegramHookGenerator userId={user?.id||localStorage.getItem("sociomee_user_id")||""}/>}
      {activeTab==="tg-poll"     && isLoggedIn && <TelegramPollGenerator userId={user?.id||localStorage.getItem("sociomee_user_id")||""}/>}
      {activeTab==="tg-besttime" && isLoggedIn && <TelegramBestTime userId={user?.id||localStorage.getItem("sociomee_user_id")||""}/>}
      {activeTab==="tg-scheduler"&& isLoggedIn && <TelegramScheduler user={user}/>}
      {activeTab==="pt-pindesc"   && isLoggedIn && <PinterestPinDesc/>}
      {activeTab==="pt-board"     && isLoggedIn && <PinterestBoardNames/>}
      {activeTab==="pt-hashtag"   && isLoggedIn && <PinterestHashtags/>}
      {activeTab==="pt-besttime"  && isLoggedIn && <PinterestBestTime/>}
      {activeTab==="th-thread"    && isLoggedIn && <ThreadsGenerator/>}
      {activeTab==="th-bio"       && isLoggedIn && <ThreadsBio/>}
      {activeTab==="th-hook"      && isLoggedIn && <ThreadsHook/>}
      {activeTab==="rd-title"     && isLoggedIn && <RedditTitle/>}
      {activeTab==="rd-subreddit" && isLoggedIn && <RedditSubfinder/>}
      {activeTab==="rd-besttime"  && isLoggedIn && <RedditBestTime/>}
      {activeTab==="li-post"      && isLoggedIn && <LinkedInPost/>}
      {activeTab==="li-headline"  && isLoggedIn && <LinkedInHeadline/>}
      {activeTab==="li-about"     && isLoggedIn && <LinkedInAbout/>}
      {activeTab==="li-carousel"  && isLoggedIn && <LinkedInCarousel/>}
      {activeTab==="li-hashtag"   && isLoggedIn && <LinkedInHashtags/>}
      {activeTab==="li-besttime"  && isLoggedIn && <LinkedInBestTime/>}
      {activeTab==="fb-post"      && isLoggedIn && <FacebookPost/>}
      {activeTab==="fb-group"     && isLoggedIn && <FacebookGroupPost/>}
      {activeTab==="fb-ad"        && isLoggedIn && <FacebookAdCopy/>}
      {activeTab==="fb-besttime"  && isLoggedIn && <FacebookBestTime/>}
      {activeTab==="tt-hook"      && isLoggedIn && <TikTokHook/>}
      {activeTab==="tt-caption"   && isLoggedIn && <TikTokCaption/>}
      {activeTab==="tt-ideas"     && isLoggedIn && <TikTokVideoIdeas/>}
      {activeTab==="tt-hashtag"   && isLoggedIn && <TikTokHashtags/>}
      {activeTab==="tt-besttime"  && isLoggedIn && <TikTokBestTime/>}
      {activeTab==="wa-broadcast" && isLoggedIn && <WhatsAppBroadcast/>}
      {activeTab==="wa-reply"     && isLoggedIn && <WhatsAppReplyTemplates/>}
      {activeTab==="wa-channel"   && isLoggedIn && <WhatsAppChannelPost/>}
      {activeTab==="x-post"       && isLoggedIn && <XTweetGenerator/>}
      {activeTab==="x-thread"     && isLoggedIn && <XThreadGenerator/>}
      {activeTab==="x-hook"       && isLoggedIn && <XHookGenerator/>}
      {activeTab==="x-besttime"   && isLoggedIn && <XBestTime/>}
      {activeTab==="yt-keyword"   && isLoggedIn && <KeywordResearch/>}
      {activeTab==="yt-trending"  && isLoggedIn && <TrendingVideos/>}
      {activeTab==="yt-evergreen" && isLoggedIn && <EvergreenScore/>}
      {activeTab==="yt-ideas"     && isLoggedIn && <DailyVideoIdeas/>}
      {activeTab==="screenrecorder" && isLoggedIn && <ScreenRecorder/>}
      {activeTab==="hashtags"   && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><HashtagGenerator user={user}/></div>}
          {activeTab==="texttaudio" && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><TextToAudio user={user}/></div>}
          {activeTab==="hookgenerator"&&isLoggedIn&& <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><HookGenerator user={user}/></div>}
          {activeTab==="biowriter"  && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><BioWriter user={user}/></div>}
          {activeTab==="thumbnail"  && isLoggedIn && <ThumbnailStudioNew/>}

          <p style={{ textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:"11.5px", marginTop:"32px" }}>SocioMee · One Topic. Infinite Content · Built with 💜</p>
        </div>
      </div>

      {channelSettingsOpen && (
        <ChannelSettingsModal user={{...user, plan_label: creditStatus?.plan_label||"Free"}} onClose={()=>setChannelSettingsOpen(false)} BASE={BASE}/>
      )}
      {showPricing && (
        <PricingPopup
          mode={pricingMode}
          userId={user?.user_id||localStorage.getItem("sociomee_user_id")||"default_user"}
          email={user?.email||localStorage.getItem("sociomee_email")||""}
          onClose={()=>setShowPricing(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800;900&family=Orbitron:wght@400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes shimmer{to{background-position:400px 0;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(16px)}}
        #app-sidebar{transform:translateX(0);}
        #hamburger-btn{display:none;}
        nav::-webkit-scrollbar{display:none;} html,body,#root{overflow-x:hidden!important;} ::-webkit-scrollbar:horizontal{height:0!important;display:none!important;}
        input::placeholder{color:rgba(255,255,255,0.25);}
        .gen-btn:hover:not(:disabled){background:rgba(124,58,237,0.25)!important;border-color:rgba(124,58,237,1)!important;box-shadow:0 0 40px rgba(124,58,237,0.8),0 0 80px rgba(124,58,237,0.3)!important;transform:translateY(-2px);}
        select{appearance:none;-webkit-appearance:none;}
        select option{background:#0a0a0a;color:#fff;}
        html,body{overflow-x:hidden!important;} @media(max-width:768px){ .tone-pills{display:none!important;} .tone-dropdown{display:block!important;} .format-mobile-only{display:block!important;} .plf-desktop{display:none!important;} .plf-mobile{display:flex!important;} .plf-mobile button{font-size:11px!important;padding:9px 10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;} .platform-grid button{border-radius:50%!important;width:48px!important;height:48px!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;} .platform-grid button img{width:24px!important;height:24px!important;} .platform-label{display:none!important;} .platform-grid{gap:6px!important;} .custom-select-btn{padding:7px 10px!important;font-size:11px!important;} .custom-select-drop{font-size:11px!important;} .persona-lang-grid{grid-template-columns:1fr!important;gap:8px!important;} 
          #app-sidebar{transform:translateX(-100%);width:240px!important;}
          #app-sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,0.5);}
          #main-content{margin-left:0!important;padding:60px 16px 80px!important;} #main-content.notes-mode{padding:0!important;}
          #hamburger-btn{display:flex!important;} #hamburger-btn.hidden{display:none!important;}
        }
      `}</style>
    </div>
  );
}
