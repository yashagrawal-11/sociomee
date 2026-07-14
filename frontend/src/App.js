import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import YouTubeDashboard from "./YouTubeDashboard";
import ThreadsDashboard from "./ThreadsDashboard";
import InstagramDashboard from "./InstagramDashboard";
import PinterestDashboard from "./PinterestDashboard";
import FacebookDashboard from "./FacebookDashboard";
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
import SocioMeeReminders from "./components/SocioMeeReminders";
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

const BASE = window.location.origin + "/api";

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
  {id:"x",         label:"X",         img:"/icons/x.png",         color:"#ffffff"},
  {id:"facebook",  label:"Facebook",  img:"/icons/facebook.png",  color:"#1877f2"},
  {id:"threads",   label:"Threads",   img:"/icons/threads.png",   color:"#ffffff"},
  {id:"pinterest", label:"Pinterest", img:"/icons/pinterest.png", color:"#e60023"},
  {id:"telegram",  label:"Telegram",  img:"/icons/telegram.png",  color:"#2aabee"},
  {id:"reddit",    label:"Reddit",    img:"/icons/reddit.png",    color:"#ff4500"},
  {id:"quora",     label:"Quora",     img:"/icons/quora.png",     color:"#b92b27"},
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
function PricingPopup({ onClose, onSuccess, userId, email, mode="upgrade" }) {
  const [paying,     setPaying    ] = useState(null);
  const [payErr,     setPayErr    ] = useState("");
  const [doneMsg,    setDoneMsg   ] = useState("");
  const [coupon,     setCoupon    ] = useState("");
  const [couponMsg,  setCouponMsg ] = useState("");
  const [discount,   setDiscount  ] = useState(null);
  const [billing,    setBilling   ] = useState("monthly");
  const [fading,     setFading    ] = useState(false);

  const isNocredits = mode === "nocredits";

  const switchBilling = (next) => {
    if (next === billing) return;
    setFading(true);
    setTimeout(() => { setBilling(next); setFading(false); }, 180);
  };

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponMsg("checking...");
    try {
      const res = await fetch(`${BASE}/validate-coupon`, {
        method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include",
        body: JSON.stringify({ code, plan:"pro_monthly" }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscount({ code, value: data.discount_pct });
        setCouponMsg("activated");
      } else {
        setDiscount(null);
        setCouponMsg("invalid code");
      }
    } catch {
      setDiscount(null);
      setCouponMsg("could not validate. try again.");
    }
  };

  const calcPrice = (base) => {
    if (!discount || !base) return base;
    return Math.round(base * (1 - discount.value / 100));
  };

  const plans = [
    { id:"free", label:"Free", monthly:0, annual:0, credits:20, uploads:0,
      features:["20 credits/month","Short scripts ≤500 words","Basic SEO — 2 platforms","Community support"],
      cta:"Get Started Free" },
    { id_m:"pro_monthly", id_a:"pro_annual", label:"Pro", monthly:499, annual:3999, credits:200, uploads:4, popular:true,
      features:["150 credits/month","3000–5000 word scripts","Full SEO — 8 platforms","4 YouTube uploads/month","Thumbnail analyzer","Priority support"],
      cta:"Upgrade to Pro" },
    { id_m:"premium_monthly", id_a:"premium_annual", label:"Premium", monthly:1999, annual:15999, credits:500, uploads:15,
      features:["300 credits/month","Unlimited word scripts","Full SEO — all platforms","15 YouTube uploads/month","Advanced AI analytics","Dedicated support","Early access"],
      cta:"Go Premium" },
  ];

  const topups = [
    { id:"topup_99",  label:"Starter Pack", price:99,  credits:20,  cta:"Buy 20 Credits" },
    { id:"topup_249", label:"Value Pack",   price:249, credits:60,  cta:"Buy 60 Credits", badge:"Best Value" },
  ];

  const pay = async (planId, price) => {
    if (planId === "free") { onClose(); return; }
    setPaying(planId); setPayErr("");
    // Topups use one-time orders; plans use subscriptions
    const isTopup = planId.startsWith("topup_");
    if (isTopup) {
      const finalPrice = calcPrice(price);
      await runRazorpayCheckout({
        planId, userId, email,
        onSuccess: result => {
          setDoneMsg(result.message || "Credits added!");
          setPaying(null);
          setTimeout(() => { onSuccess(result); onClose(); }, 2000);
        },
        onError: msg => { setPayErr(msg); setPaying(null); },
      });
    } else {
      // Subscription autopay flow
      try {
        const loaded = await loadRazorpay();
        if (!loaded) { setPayErr("Razorpay SDK failed to load."); setPaying(null); return; }
        const res = await fetch(`${BASE}/subscription/create`, {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ user_id: userId, email, plan: planId }),
        });
        if (!res.ok) { const e = await res.json().catch(()=>({})); setPayErr(e.detail||"Failed to create subscription."); setPaying(null); return; }
        const sub = await res.json();
        new window.Razorpay({
          key: sub.key_id,
          subscription_id: sub.subscription_id,
          name: "SocioMee",
          description: sub.plan_label,
          prefill: { email },
          theme: { color: "#7c3aed" },
          modal: { ondismiss: () => setPaying(null) },
          handler: async response => {
            try {
              const verify = await fetch(`${BASE}/subscription/verify`, {
                method: "POST", headers: {"Content-Type":"application/json"},
                body: JSON.stringify({
                  user_id: userId, email, plan: planId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const result = await verify.json();
              if (result.success) {
                setDoneMsg(result.message || "Subscription active!");
                setPaying(null);
                setTimeout(() => { onSuccess(result); onClose(); }, 2000);
              } else {
                setPayErr("Verification failed. Contact support.");
                setPaying(null);
              }
            } catch { setPayErr("Verification failed. Contact support."); setPaying(null); }
          },
        }).open();
      } catch(e) { setPayErr(e.message || "Something went wrong."); setPaying(null); }
    }
  };

  const S = {
    overlay: { position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.95)",backdropFilter:"blur(32px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto" },
    modal: { width:"100%",maxWidth:"680px",background:"#0a0a0f",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"24px",boxShadow:"0 32px 80px rgba(0,0,0,0.9),0 0 0 1px rgba(255,255,255,0.04)",overflow:"hidden",animation:"smPop 0.2s ease",fontFamily:"Poppins,sans-serif" },
    header: { background:"linear-gradient(135deg,#7c3aed,#ff3d8f)",padding:"24px 28px 20px",position:"relative" },
    headerTitle: { fontSize:"22px",fontWeight:"900",color:"#fff",margin:"0 0 4px",fontFamily:"Orbitron,sans-serif",letterSpacing:"1px" },
    headerSub: { fontSize:"12px",color:"rgba(255,255,255,0.8)",margin:0 },
    closeBtn: { position:"absolute",top:"16px",right:"16px",background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",width:"28px",height:"28px",borderRadius:"50%",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center" },
    toggle: { display:"flex",gap:"4px",background:"rgba(0,0,0,0.3)",borderRadius:"99px",padding:"3px",marginTop:"14px",width:"fit-content" },
    toggleBtn: (active) => ({ padding:"5px 16px",borderRadius:"99px",border:"none",background:active?"#fff":"transparent",color:active?"#7c3aed":"rgba(255,255,255,0.7)",fontWeight:"800",fontSize:"11px",cursor:"pointer",fontFamily:"Poppins,sans-serif",transition:"all 0.15s" }),
    body: { padding:"20px 24px" },
    sectionLabel: { fontSize:"10px",fontWeight:"700",letterSpacing:"2px",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:"10px" },
    topupGrid: { display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px" },
    topupCard: { background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"14px",position:"relative" },
    plansGrid: { display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"16px" },
    planCard: (highlight) => ({ background:highlight?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${highlight?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)"}`,borderRadius:"16px",padding:"16px",display:"flex",flexDirection:"column",gap:"6px",position:"relative",boxShadow:highlight?"0 8px 32px rgba(0,0,0,0.4)":"none" }),
    planName: { fontSize:"13px",fontWeight:"800",color:"#ede8ff" },
    planPrice: { fontSize:"22px",fontWeight:"900",color:"#fff",letterSpacing:"-0.5px" },
    planSub: { fontSize:"10px",color:"rgba(167,139,250,0.8)",fontWeight:"600" },
    feature: { fontSize:"10px",color:"rgba(196,181,253,0.75)",display:"flex",gap:"5px",alignItems:"flex-start" },
    pillBtn: (primary) => ({ width:"100%",padding:"9px 0",borderRadius:"99px",border:"none",background:primary?"linear-gradient(135deg,#7c3aed,#9b5cf6)":"rgba(124,58,237,0.15)",color:primary?"#fff":"rgba(167,139,250,0.9)",fontWeight:"800",fontSize:"11px",cursor:"pointer",fontFamily:"Poppins,sans-serif",marginTop:"auto",transition:"all 0.15s",border:primary?"none":"1px solid rgba(124,58,237,0.25)" }),
    couponWrap: { background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"12px 14px",marginBottom:"12px" },
    couponInput: { flex:1,padding:"8px 12px",borderRadius:"99px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"12px",fontFamily:"Poppins,sans-serif",outline:"none",letterSpacing:"1px",fontWeight:"700" },
    couponBtn: { padding:"8px 16px",borderRadius:"99px",border:"none",background:"linear-gradient(135deg,#7c3aed,#9b5cf6)",color:"#fff",fontWeight:"800",fontSize:"11px",cursor:"pointer",fontFamily:"Poppins,sans-serif" },
    badge: { position:"absolute",top:"-9px",right:"10px",background:"linear-gradient(135deg,#7c3aed,#ff3d8f)",color:"#fff",fontSize:"8px",fontWeight:"900",padding:"2px 7px",borderRadius:"99px" },
    popularTag: { position:"absolute",top:"-9px",left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#7c3aed,#9b5cf6)",color:"#fff",fontSize:"8px",fontWeight:"900",padding:"2px 10px",borderRadius:"99px",whiteSpace:"nowrap" },
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={S.overlay}>
      <div style={S.modal}>
        <style>{`@keyframes smPop{from{opacity:0;transform:scale(0.97) translateY(8px)}to{opacity:1;transform:none}}`}</style>

        {/* Header */}
        <div style={S.header}>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
          <div style={{ fontSize:"9px",fontWeight:"700",letterSpacing:"2px",color:"rgba(255,255,255,0.7)",textTransform:"uppercase",marginBottom:"6px" }}>✦ SocioMee Plans</div>
          <h2 style={S.headerTitle}>{isNocredits ? "out of credits." : "choose your plan."}</h2>
          <p style={S.headerSub}>{isNocredits ? "top up instantly or upgrade for more every month." : "upgrade to unlock more credits, uploads and AI features."}</p>
          <div style={S.toggle}>
            <button style={S.toggleBtn(billing==="monthly")} onClick={() => switchBilling("monthly")}>Monthly</button>
            <button style={S.toggleBtn(billing==="annual")} onClick={() => switchBilling("annual")}>
              Annual <span style={{ background:"#fbbf24",color:"#78350f",fontSize:"8px",padding:"1px 5px",borderRadius:"99px",fontWeight:"900",marginLeft:"3px" }}>SAVE 33%</span>
            </button>
          </div>
        </div>

        <div style={S.body}>
          {doneMsg && <div style={{ padding:"10px 14px",background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:"10px",marginBottom:"12px",textAlign:"center",fontSize:"13px",fontWeight:"700",color:"#34d399" }}>🎉 {doneMsg}</div>}
          {payErr && <div style={{ padding:"8px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"10px",marginBottom:"12px",fontSize:"12px",color:"#f87171",fontWeight:"600" }}>⚠ {payErr}</div>}

          {/* Top-ups */}
          {isNocredits && <p style={S.sectionLabel}>⚡ Quick top-up</p>}
          {isNocredits && (
            <div style={S.topupGrid}>
              {topups.map(t => (
                <div key={t.id} style={S.topupCard}>
                  {t.badge && <div style={S.badge}>{t.badge}</div>}
                  <div style={{ fontSize:"11px",fontWeight:"700",color:"#ede8ff",marginBottom:"4px" }}>{t.label}</div>
                  <div style={{ fontSize:"20px",fontWeight:"900",color:"#fff" }}>₹{calcPrice(t.price)}</div>
                  <div style={{ fontSize:"10px",color:"#a78bfa",fontWeight:"600",marginBottom:"8px" }}>+{t.credits} credits</div>
                  <button onClick={() => pay(t.id, t.price)} disabled={!!paying} style={S.pillBtn(true)}>{paying===t.id?"processing…":t.cta}</button>
                </div>
              ))}
            </div>
          )}

          {/* Plans */}
          <p style={S.sectionLabel}>{isNocredits ? "📦 or upgrade for monthly credits" : "📦 plans"}</p>
          <div style={S.plansGrid}>
            {plans.map(plan => {
              const isFree = plan.id === "free";
              const planId = isFree ? "free" : billing==="annual" ? plan.id_a : plan.id_m;
              const base = isFree ? 0 : billing==="annual" ? plan.annual : plan.monthly;
              const final = calcPrice(base);
              return (
                <div key={plan.label} style={S.planCard(plan.popular)}>
                  {plan.popular && <div style={S.popularTag}>✦ POPULAR</div>}
                  <div style={S.planName}>{plan.label}</div>
                  <div style={{ opacity:fading?0:1,transition:"opacity 0.15s" }}>
                    <div style={S.planPrice}>{isFree ? "Free" : `₹${final}`}</div>
                    {!isFree && <div style={{ fontSize:"9px",color:"rgba(255,255,255,0.4)" }}>/{billing==="annual"?"yr":"mo"}{discount&&base!==final?` (${discount.value}% off)`:""}</div>}
                  </div>
                  <div style={S.planSub}>{plan.credits} credits · {plan.uploads>0?`${plan.uploads} uploads`:"no uploads"}</div>
                  <div style={{ height:"1px",background:"rgba(255,255,255,0.06)",margin:"6px 0" }}/>
                  <div style={{ flex:1 }}>
                    {plan.features.map((f,i) => (
                      <div key={i} style={{ ...S.feature,marginBottom:"3px" }}>
                        <span style={{ color:"#7c3aed",flexShrink:0 }}>✓</span><span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => pay(planId, base)} disabled={!!paying} style={{ ...S.pillBtn(plan.popular||!isFree),marginTop:"10px",opacity:paying&&paying!==planId?0.5:1 }}>
                    {paying===planId?"processing…":plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Non-nocredits topups */}
          {!isNocredits && (
            <>
              <p style={S.sectionLabel}>⚡ quick top-up</p>
              <div style={S.topupGrid}>
                {topups.map(t => (
                  <div key={t.id} style={S.topupCard}>
                    {t.badge && <div style={S.badge}>{t.badge}</div>}
                    <div style={{ fontSize:"11px",fontWeight:"700",color:"#ede8ff",marginBottom:"4px" }}>{t.label}</div>
                    <div style={{ fontSize:"20px",fontWeight:"900",color:"#fff" }}>₹{calcPrice(t.price)}</div>
                    <div style={{ fontSize:"10px",color:"#a78bfa",fontWeight:"600",marginBottom:"8px" }}>+{t.credits} credits</div>
                    <button onClick={() => pay(t.id, t.price)} disabled={!!paying} style={S.pillBtn(true)}>{paying===t.id?"processing…":t.cta}</button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Coupon */}
          <div style={S.couponWrap}>
            <div style={{ fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.4)",marginBottom:"8px",letterSpacing:"1px" }}>🎟 PROMO CODE</div>
            <div style={{ display:"flex",gap:"6px" }}>
              <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} onKeyDown={e => e.key==="Enter" && applyCoupon()} placeholder="enter promo code" style={S.couponInput}/>
              <button onClick={applyCoupon} style={S.couponBtn}>Apply</button>
            </div>
            {couponMsg && (
              <div style={{ marginTop:"8px",padding:"7px 10px",borderRadius:"8px",background:couponMsg==="activated"?"rgba(52,211,153,0.12)":"rgba(239,68,68,0.1)",border:`1px solid ${couponMsg==="activated"?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.2)"}` }}>
                <span style={{ fontSize:"12px",fontWeight:"800",color:couponMsg==="activated"?"#34d399":"#f87171" }}>
                  {couponMsg==="activated" ? `✅ code activated — ${discount?.value}% off applied to all plans` : `❌ ${couponMsg}`}
                </span>
              </div>
            )}
          </div>

          <p style={{ textAlign:"center",fontSize:"10px",color:"rgba(255,255,255,0.2)",margin:0 }}>🔒 Secured by Razorpay · UPI · Cards · NetBanking · Instant activation</p>
        </div>
      </div>
    </div>
  );
}



function CopyBtn({ text, size="sm" }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(String(text||"")); setCopied(true); setTimeout(()=>setCopied(false), 1800); };
  const sz = size==="sm" ? { padding:"4px 10px",fontSize:"11px" } : { padding:"7px 14px",fontSize:"12px" };
  return <button onClick={copy} style={{ ...sz,fontWeight:"800",cursor:"pointer",borderRadius:"8px",border:`1px solid ${copied?C.success+"55":C.hairline}`,background:copied?C.success+"18":C.glass,color:copied?C.success:C.muted,fontFamily:"inherit",transition:"all 0.18s" }}>{copied?"✓ Copied":"Copy"}</button>;
}

function EditBtn({ value, onSave, size="sm", multiline=false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value||"");
  useEffect(()=>{ if(!editing) setVal(value||""); }, [value]);
  const save = () => { if(onSave) onSave(val); setEditing(false); };
  const onKey = (e) => {
    if(!multiline && e.key==="Enter") { e.preventDefault(); save(); }
    if(e.key==="Escape") setEditing(false);
  };
  if(editing) return multiline ? (
    <div style={{ width:"100%",marginTop:"6px" }}>
      <textarea autoFocus value={val} onChange={e=>setVal(e.target.value)} onKeyDown={onKey}
        style={{ width:"100%",minHeight:"120px",background:"rgba(255,255,255,0.05)",border:`1.5px solid ${C.purple}66`,borderRadius:"10px",padding:"10px 12px",color:C.ink,fontSize:"13px",lineHeight:"1.7",fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box" }}/>
      <div style={{ display:"flex",gap:"6px",marginTop:"6px",justifyContent:"flex-end" }}>
        <button onClick={()=>setEditing(false)} style={{ padding:"5px 14px",borderRadius:"99px",border:`1px solid ${C.hairline}`,background:C.glass,color:C.muted,fontWeight:"700",cursor:"pointer",fontFamily:"inherit",fontSize:"12px" }}>Cancel</button>
        <button onClick={save} style={{ padding:"5px 14px",borderRadius:"99px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:"#fff",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",fontSize:"12px" }}>✓ Save</button>
      </div>
    </div>
  ) : (
    <div style={{ display:"flex",gap:"4px",alignItems:"center",flex:1 }}>
      <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onKeyDown={onKey} onBlur={save}
        style={{ flex:1,background:"rgba(255,255,255,0.05)",border:`1.5px solid ${C.purple}66`,borderRadius:"8px",padding:"5px 10px",color:C.ink,fontSize:"14px",fontWeight:"600",fontFamily:"inherit",outline:"none",minWidth:0 }}/>
      <button onClick={save} style={{ padding:"4px 10px",fontSize:"11px",fontWeight:"800",cursor:"pointer",borderRadius:"8px",border:`1px solid ${C.success}55`,background:C.success+"18",color:C.success,fontFamily:"inherit",flexShrink:0 }}>✓</button>
      <button onClick={()=>setEditing(false)} style={{ padding:"4px 8px",fontSize:"11px",fontWeight:"800",cursor:"pointer",borderRadius:"8px",border:`1px solid ${C.hairline}`,background:C.glass,color:C.muted,fontFamily:"inherit",flexShrink:0 }}>✕</button>
    </div>
  );
  return <button onClick={()=>setEditing(true)} title="Edit" style={{ padding:"3px 8px",fontSize:"11px",fontWeight:"700",cursor:"pointer",borderRadius:"7px",border:`1px solid ${C.hairline}`,background:C.glass,color:C.muted,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"3px",flexShrink:0 }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button>;
}

function SectionHead({ icon, title, copyText, editValue, onEditSave, editMultiline, children }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
      <span style={{ fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.4px",textTransform:"uppercase",color:C.muted }}>
        {icon&&<span style={{ marginRight:"6px" }}>{icon}</span>}{title}
      </span>
      <div style={{ display:"flex",gap:"6px",alignItems:"center" }}>{children}{editValue!==undefined&&onEditSave&&<EditBtn value={editValue} onSave={onEditSave} multiline={editMultiline||false}/>}{copyText&&<CopyBtn text={copyText}/>}</div>
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
function scoreTitleSimple(title) {
  const t = title.toLowerCase();
  let s = 50;
  if(t.length>=40&&t.length<=70) s+=12;
  if(/\d/.test(t)) s+=12;
  if(["secret","truth","nobody","mistake","why","how","best","revealed","exposed","real"].some(w=>t.includes(w))) s+=12;
  if(t.split(" ").length>=5&&t.split(" ").length<=14) s+=14;
  return Math.min(100,s);
}

function TitleInlineEdit({ title, isActive, onSelect, onSave, score, scoreCol }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title||"");
  const [liveScore, setLiveScore] = useState(score);
  useEffect(()=>{ setVal(title||""); setLiveScore(score); }, [title, score]);
  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    const ns = scoreTitleSimple(v);
    setLiveScore(ns);
    onSave(v); // auto save on every keystroke
  };
  const col = scoreColor(liveScore);
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:"8px",width:"100%" }}>
      {editing ? (
        <div style={{ display:"flex",gap:"6px",alignItems:"center",flex:1 }}>
          <input autoFocus value={val} onChange={handleChange}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Escape") setEditing(false); }}
            onBlur={()=>setEditing(false)}
            style={{ flex:1,background:"rgba(255,255,255,0.05)",border:`1.5px solid ${C.purple}88`,borderRadius:"8px",padding:"5px 10px",color:C.ink,fontSize:"14px",fontWeight:"600",fontFamily:"inherit",outline:"none",minWidth:0 }}/>
          <span style={{ fontSize:"11px",fontWeight:"800",padding:"2px 9px",borderRadius:"99px",background:col+"20",color:col,border:`1px solid ${col}33`,flexShrink:0 }}>{liveScore}/100</span>
        </div>
      ) : (
        <>
          <span onClick={onSelect} style={{ fontWeight:"600",lineHeight:1.45,flex:1,color:C.ink,fontSize:"14px",cursor:"pointer" }}>
            {isActive&&<span style={{ color:C.purple,marginRight:"6px" }}>✦</span>}{val}
          </span>
          <div style={{ display:"flex",gap:"4px",alignItems:"center",flexShrink:0 }}>
            <button onClick={()=>setEditing(true)} style={{ padding:"3px 8px",fontSize:"11px",fontWeight:"700",cursor:"pointer",borderRadius:"7px",border:`1px solid ${C.hairline}`,background:C.glass,color:C.muted,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"3px" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button>
            <span style={{ fontSize:"11px",fontWeight:"800",padding:"2px 9px",borderRadius:"99px",background:col+"20",color:col,border:`1px solid ${col}33` }}>{liveScore}/100</span>
          </div>
        </>
      )}
    </div>
  );
}

function TitlePicker({ titlesWithScore=[], bestTitle="", isPro, onUpgradeClick, onSelect, onTitlesChange }) {
  const [sel, setSel] = useState(0);
  const selTitle = titlesWithScore[sel]?.title || bestTitle;
  useEffect(() => { if (onSelect) onSelect(selTitle); }, [selTitle]);
  if (!titlesWithScore.length && !bestTitle) return null;
  return (
    <div style={{ marginBottom:"24px" }}>
      <SectionHead icon="🎯" title="Title Candidates" copyText={titlesWithScore.map(t=>t.title).join("\n")}/>
      {titlesWithScore.map((item,i) => {
        const score = Number(item.seo_score||item.score||scoreTitleSimple(item.title)||75); const col = scoreColor(score); const isA = i===sel;
        return (
          <div key={i} style={{ width:"100%",marginBottom:"8px",background:isA?`${C.purple}10`:C.pillBg,border:`1.5px solid ${isA?C.purple:C.hairline}`,borderRadius:"12px",padding:"12px 16px",transition:"all 0.15s" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px" }}>
              <TitleInlineEdit
                title={item.title}
                isActive={isA}
                onSelect={()=>setSel(i)}
                onSave={(v)=>{ const updated=[...titlesWithScore]; updated[i]={...updated[i],title:v,seo_score:scoreTitleSimple(v)}; if(onTitlesChange) onTitlesChange(updated); if(i===sel&&onSelect) onSelect(v); }}
                score={score}
                scoreCol={col}
              />
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
          </div>
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
  const meta = { youtube:{icon:"/icons/youtube.png",color:"#ff0000"},instagram:{icon:"/icons/instagram.png",color:"#e1306c"},tiktok:{icon:"/icons/tiktok.png",color:"#010101"},x:{icon:"/icons/x.png",color:"#ffffff"},facebook:{icon:"/icons/facebook.png",color:"#1877f2"},threads:{icon:"/icons/threads.png",color:"#ffffff"},pinterest:{icon:"/icons/pinterest.png",color:"#e60023"},telegram:{icon:"/icons/telegram.png",color:"#2aabee"},linkedin:{icon:"/icons/linkedin.png",color:"#0077b5"},reddit:{icon:"/icons/reddit.png",color:"#ff4500"},quora:{icon:"/icons/quora.png",color:"#b92b27"} };
  const pack = seoPacks[active]||{};
  const content = (
    <div style={{ display:"flex",flexDirection:"column",gap:"12px" }}>
      {(pack.description||pack.caption||pack.post) && active!=="youtube" && (
        <div>
          <SectionHead icon="📝" title={active==="youtube"?"Description":"Caption"} copyText={pack.description||pack.caption||pack.post}/>
          <div className="dark-scroll" style={{ background:C.glass,borderRadius:"12px",padding:"14px 16px",fontSize:"13px",lineHeight:1.7,whiteSpace:"pre-wrap",color:C.ink,border:`1px solid ${C.hairline}`,maxHeight:"200px",overflowY:"auto" }}>{pack.description||pack.caption||pack.post}</div>
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
      <div style={{ display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px" }}>
        {all.map(p=>{ const pm=meta[p]||{icon:"",color:C.purple}; const isA=active===p; return (
          <button key={p} onClick={()=>setActive(p)} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"5px 13px",borderRadius:"99px",border:`1.5px solid ${isA?pm.color:C.hairline}`,background:isA?pm.color+"18":C.pillBg,color:isA?pm.color:C.muted,fontWeight:"700",fontSize:"11.5px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.14s" }}>
            {pm.icon && <img src={pm.icon} alt="" style={{width:"14px",height:"14px",objectFit:"contain"}} onError={e=>e.target.style.display="none"}/>}
            {p.charAt(0).toUpperCase()+p.slice(1)}
          </button>
        ); })}
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
// PLATFORM SEND BAR
// ══════════════════════════════════════════════════════════════════════
const SEND_PLATFORMS = [
  { id:"youtube",   label:"YouTube",   color:"#ff0000", icon:"/icons/youtube.png", supports:["youtube"] },

  { id:"telegram",  label:"Telegram",  color:"#2aabee", icon:"/icons/telegram.png",
    supports:["telegram","all"] },
  { id:"pinterest", label:"Pinterest", color:"#e60023", icon:"/icons/pinterest.png",
    supports:["pinterest"] },
  { id:"discord",   label:"Discord",   color:"#5865f2", icon:"/icons/discord.png", svg:<svg width="14" height="14" viewBox="0 0 24 24" fill="#5865f2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
    supports:["discord","all"] },
  { id:"instagram", label:"Instagram", color:"#e1306c", icon:"/icons/instagram.png",
    supports:["instagram","threads"], comingSoon:true },
  { id:"threads",   label:"Threads",   color:"#ffffff", icon:"/icons/threads.png",
    supports:["threads","instagram"], comingSoon:true },
];

function PlatformSendBar({ result, platform, user, videoFile, selectedTitle }) {
  const userId = localStorage.getItem("sociomee_user_id") || user?.user_id || "";
  const [connections, setConnections] = useState({});
  const [sendStatus, setSendStatus] = useState({});

  useEffect(() => {
    if (!userId) return;
    const check = async () => {
      await new Promise(r => setTimeout(r, 500)); // small delay to let auth settle
      const conn = {};
      try {
        const tg = await fetch(`${BASE}/telegram/connect-status?user_id=${userId}`).then(r=>r.ok?r.json():null);
        conn.telegram = tg?.connected || false;
      } catch { conn.telegram = false; }
      try {
        const pt = await fetch(`${BASE}/pinterest/status?user_id=${userId}`).then(r=>r.ok?r.json():null);
        conn.pinterest = pt?.connected || false;
      } catch { conn.pinterest = false; }
      try {
        const yt = await fetch(`${BASE}/youtube/channels/${userId}`, {credentials:"include"}).then(r=>r.ok?r.json():null);
        const chs = yt?.channels || [];
        conn.youtube = Array.isArray(chs) && chs.length > 0;
      } catch { conn.youtube = false; }
      try {
        const dc = await fetch(`${BASE}/discord/guilds?user_id=${userId}`).then(r=>r.ok?r.json():null);
        conn.discord = Array.isArray(dc?.guilds) && dc.guilds.length > 0;
      } catch { conn.discord = false; }
      conn.instagram = false;
      conn.threads = false;
      setConnections(conn);
    };
    check();
  }, [userId, result]);

  const isActive = (sp) => {
    if (sp.comingSoon) return false;
    if (sp.id === "youtube") return connections.youtube && !!videoFile;
    if (!connections[sp.id]) return false;
    return sp.supports.includes(platform) || sp.supports.includes("all");
  };

  const handleSend = async (sp) => {
    if (!isActive(sp)) return;
    const text = result?.caption || result?.script_text || result?.post_body || result?.hook || "";
    const title = result?.best_title || result?.topic || "";
    if (sp.id === "youtube") {
      if (!videoFile) { alert("Please attach a video file first using the + button in the keyword field."); return; }
      setSendStatus(s=>({...s, youtube:"sending"}));
      try {
        const fd = new FormData();
        fd.append("user_id", userId);
        fd.append("keyword", selectedTitle || title || "");
        fd.append("video_type", "video");
        fd.append("schedule_type", "now");
        fd.append("privacy", "public");
        fd.append("language", "Hindi/English");
        fd.append("video", videoFile);
        const r = await fetch(`${BASE}/youtube/upload/auto`, {method:"POST", body:fd, credentials:"include"});
        if(!r.ok) { const err = await r.json().catch(()=>({})); throw new Error(err.detail||"Upload failed"); }
        setSendStatus(s=>({...s, youtube:"sent"}));
        setTimeout(()=>setSendStatus(s=>({...s, youtube:"idle"})), 4000);
      } catch(e) {
        alert("YouTube upload failed: " + e.message);
        setSendStatus(s=>({...s, youtube:"idle"}));
      }
      return;
    }
    setSendStatus(s => ({...s, [sp.id]: "sending"}));
    try {
      if (sp.id === "telegram") {
        const tgMsg = (title ? title + "\n\n" : "") + text.slice(0, 2000);
        const r = await fetch(`${BASE}/telegram/send-quick`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ user_id: userId, text: tgMsg })
        });
        if (!r.ok) throw new Error("failed");
      } else if (sp.id === "discord") {
        const cleanText = text.replace(/\[Script generation failed.*?\]/gs, "").trim();
        if (!cleanText || cleanText.length < 10 || cleanText.includes("generation failed") || cleanText.includes("quota exceeded") || cleanText.includes("check API keys")) throw new Error("No valid content to send");
        const r = await fetch(`${BASE}/discord/quick-send?user_id=${encodeURIComponent(userId)}&content=${encodeURIComponent(cleanText.slice(0,1900))}&title=${encodeURIComponent(title)}`, {method:"POST"});
        if (!r.ok) throw new Error("failed");
      } else if (sp.id === "pinterest") {
        const r = await fetch(`${BASE}/pinterest/create-pin`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ user_id: userId, title, description: text.slice(0,500) })
        });
        if (!r.ok) throw new Error("failed");
      }
      setSendStatus(s => ({...s, [sp.id]: "sent"}));
      setTimeout(() => setSendStatus(s => ({...s, [sp.id]: "idle"})), 3000);
    } catch {
      setSendStatus(s => ({...s, [sp.id]: "error"}));
      setTimeout(() => setSendStatus(s => ({...s, [sp.id]: "idle"})), 3000);
    }
  };

  return (
    <div style={{ marginTop:"20px", paddingTop:"16px", borderTop:`1px solid ${C.hairline}` }}>
      <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.25)", marginBottom:"12px" }}>
        Send to
      </div>

      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
        {SEND_PLATFORMS.map(sp => {
          const active = isActive(sp);
          const status = sendStatus[sp.id] || "idle";
          const connected = connections[sp.id];
          const supported = sp.supports.includes(platform) || sp.supports.includes("all");
          return (
            <button key={sp.id} onClick={() => handleSend(sp)}
              disabled={!active}
              title={sp.comingSoon ? "Coming soon" : !connected ? `Connect ${sp.label} first` : !supported ? `Not available for ${platform} content` : `Send to ${sp.label}`}
              style={{
                display:"flex", alignItems:"center", gap:"6px",
                padding:"8px 14px", borderRadius:"99px",
                border:`1.5px solid ${active ? sp.color + "60" : "rgba(255,255,255,0.08)"}`,
                background: status==="sent" ? "rgba(34,197,94,0.15)" : active ? `${sp.color}15` : "rgba(255,255,255,0.03)",
                color: status==="sent" ? "#22c55e" : active ? sp.color : "rgba(255,255,255,0.25)",
                fontSize:"12px", fontWeight:"700", cursor: active ? "pointer" : "not-allowed",
                fontFamily:"inherit", opacity: active ? 1 : 0.45,
                transition:"all 0.15s",
              }}>
              {sp.svg ? <span style={{opacity: active ? 1 : 0.4, display:"flex"}}>{sp.svg}</span> : <img src={sp.icon} alt={sp.label} style={{ width:"14px", height:"14px", objectFit:"contain", opacity: active ? 1 : 0.4 }} onError={e=>e.target.style.display="none"}/>}
              {status==="sending" ? "Sending..." : status==="sent" ? "Sent ✓" : sp.comingSoon ? sp.label + " (soon)" : sp.label}
            </button>
          );
        })}
      </div>
    </div>
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
function scoreDesc(text, topic) {
  if(!text) return 0;
  const t = text.toLowerCase();
  const topicWords = (topic||"").toLowerCase().split(/\s+/).filter(w=>w.length>2);
  let s = 30;
  if(text.length > 200) s += 15;
  if(text.length > 500) s += 10;
  const hashCount = (text.match(/#\w+/g)||[]).length;
  if(hashCount >= 3) s += 15;
  if(hashCount >= 6) s += 5;
  const kwMatches = topicWords.filter(w=>t.includes(w)).length;
  s += Math.min(20, kwMatches * 5);
  if(/about this video/i.test(text)) s += 5;
  if(/subscribe/i.test(text)||/like/i.test(text)) s += 5;
  if(/timestamp|00:00/i.test(text)) s += 5;
  return Math.min(100, s);
}

function InlineDescEdit({ value, onChange, topic }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value||"");
  const [liveScore, setLiveScore] = useState(()=>scoreDesc(value, topic));
  useEffect(()=>{ if(!editing){ setVal(value||""); setLiveScore(scoreDesc(value,topic)); } }, [value]);
  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    setLiveScore(scoreDesc(v, topic));
    onChange(v);
  };
  const col = scoreColor(liveScore);
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px" }}>
        <span style={{ fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.4px",textTransform:"uppercase",color:C.muted }}>
          <span style={{ marginRight:"6px" }}>📋</span>YOUTUBE DESCRIPTION
        </span>
        <div style={{ display:"flex",gap:"6px",alignItems:"center" }}>
          <span style={{ fontSize:"11px",fontWeight:"800",padding:"2px 9px",borderRadius:"99px",background:col+"20",color:col,border:`1px solid ${col}33` }}>{liveScore}/100</span>
          <button onClick={()=>setEditing(!editing)} style={{ padding:"4px 10px",fontSize:"11px",fontWeight:"700",cursor:"pointer",borderRadius:"7px",border:`1px solid ${editing?C.purple+"88":C.hairline}`,background:editing?C.purple+"18":C.glass,color:editing?C.purple:C.muted,fontFamily:"inherit",display:"flex",alignItems:"center",gap:"3px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {editing?"Done":"Edit"}
          </button>
          <CopyBtn text={val}/>
        </div>
      </div>
      {editing ? (
        <textarea value={val} onChange={handleChange} autoFocus
          style={{ width:"100%",minHeight:"220px",background:C.glass,border:`1.5px solid ${C.purple}66`,borderRadius:"12px",padding:"16px",fontSize:"13px",lineHeight:1.8,color:C.ink,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box",whiteSpace:"pre-wrap" }}/>
      ) : (
        <div className="dark-scroll" onClick={()=>setEditing(true)} title="Click to edit"
          style={{ background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:"12px",padding:"16px",fontSize:"13px",lineHeight:1.8,color:C.ink,whiteSpace:"pre-wrap",fontFamily:"inherit",maxHeight:"220px",overflowY:"auto",cursor:"text" }}>
          {val}
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result, platform, keyword, isPro, onUpgradeClick, user, onTitleSelect, videoFile, selectedTitle }) {
  const [editedScript, setEditedScript] = useState("");
  const [editedDesc, setEditedDesc] = useState("");
  if (!result) return null;
  const scores   = result.scores||{};
  const sections = result.sections||[];
  const seoPacks = result.seo_packs||{};
  const titlesWS = (result.titles_with_score&&result.titles_with_score.length>0)
    ? result.titles_with_score
    : (result.titles||[]).map(t=>({ title:t, seo_score:scoreTitleSimple(t), score:scoreTitleSimple(t), tips:[] }));
  const rawScript= result.script_text||"";
  let isCapped = false; let displayScript = editedScript || rawScript;
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

      <div style={{ display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"18px" }}>
        <div style={{ display:"inline-flex",alignItems:"center",gap:"6px",background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"99px",padding:"4px 12px",fontSize:"10.5px",fontWeight:"800",color:"rgba(124,58,237,0.9)",textTransform:"uppercase" }}>✦ AI Generated</div>
        {result.content_mode==="deep_research"&&<div style={{ display:"inline-flex",alignItems:"center",gap:"6px",background:`${C.purple}14`,border:`1px solid ${C.purple}30`,borderRadius:"99px",padding:"4px 12px",fontSize:"10.5px",fontWeight:"800",color:C.purple,textTransform:"uppercase" }}>🔬 Deep Research · 6-Engine Pipeline</div>}
      </div>

      {(scores.ai_score||scores.content_score||scores.final_score)>0&&(
        <>{scores.ai_score>0&&<ScoreBar label="AI Potential" value={scores.ai_score} emoji="🔥"/>}
        {scores.content_score>0&&<ScoreBar label="Content Strength" value={scores.content_score} emoji="🧠"/>}
        {scores.final_score>0&&<ScoreBar label="Final Score" value={scores.final_score} emoji="⭐"/>}<Divider/></>
      )}

      <TitlePicker titlesWithScore={titlesWS} bestTitle={result.best_title} isPro={isPro} onUpgradeClick={onUpgradeClick} onSelect={onTitleSelect}/>

      {(result.seo_description||result.youtube_description)&&(
        <div style={{ marginBottom:"20px" }}>
          <InlineDescEdit
            value={editedDesc||(result.seo_description||result.youtube_description||"")}
            onChange={(v)=>setEditedDesc(v)}
            topic={keyword}
          />
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
          <SectionHead icon="📜" title={`Recommended Script${isCapped?" (Preview — 500 words)":""}`} copyText={isPro?(editedScript||rawScript):displayScript} editValue={isPro?(editedScript||rawScript):undefined} onEditSave={isPro?(v)=>setEditedScript(v):undefined} editMultiline={true}/>
          <div className="dark-scroll" style={{ background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:"14px",padding:"20px 24px",maxHeight:isPro?"520px":"none",overflowY:isPro?"auto":"visible" }}>
            <ScriptRenderer text={isPro?(editedScript||displayScript):displayScript} capped={isCapped}/>
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
      
      {platform==="youtube" && <ThumbnailStudio keyword={keyword} title={result.best_title||result.hook||keyword} isPro={isPro} onUpgradeClick={onUpgradeClick}/>}
      {result.credits!==undefined&&<p style={{ textAlign:"center",fontSize:"12px",color:C.muted,fontWeight:"600",marginTop:"20px" }}>💳 {result.credits} credits remaining this month</p>}
      <PlatformSendBar result={result} platform={platform} user={user} videoFile={videoFile} selectedTitle={selectedTitle}/>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════
const TRANS = {
  en: { generate:"Generate", channels:"Channels", tools:"Tools", history:"History", thumbnail:"Thumbnail Studio", seo:"SEO Analyzer", calendar:"Content Calendar", guides:"Guides & Blog", signout:"Sign out", upgrade:"✦ Upgrade to Pro", translator:"Translator", videoclipper:"Video Clipper", subtitles:"Subtitles", hashtags:"Hashtags", language:"Language", channelSettings:"Channel Settings", oneTopicInfinite:"One Topic. Infinite Content.", keywordTopic:"Keyword / Topic", keywordPlaceholder:"e.g. skincare routine, crypto scam, fake influencers...", platformLabel:"Platform", personaLabel:"Persona", selectPersona:"Select Persona", selectLanguage:"Select Language", formatLabel:"Format", selectFormat:"Select Format", toneLabel:"Tone", formatLong:"Long Form", formatShort:"Short Form", formatThread:"Thread", formatReel:"Reel Script", toneBold:"Bold", toneFunny:"Funny", toneEmotional:"Emotional", toneInformative:"Informative", toneAggressive:"Aggressive", toneSales:"Sales", toneDramatic:"Dramatic", toneCasual:"Casual", toneMotivational:"Motivational", toneStorytelling:"Storytelling", toneEducational:"Educational", toneTrending:"Trending", toneCinematic:"Cinematic", hookGenerator:"Hook Generator", textToAudio:"Text to Audio", keywordResearch:"Keyword Research", trendingVideos:"Trending Videos", evergreenScore:"Evergreen Score", dailyVideoIdeas:"Daily Video Ideas", screenRecorder:"Screen Recorder", plans:"Plans", videoIdeaGenerator:"Video Idea Generator", hashtagGenerator:"Hashtag Generator", bestTimeToPost:"Best Time to Post", postGenerator:"Post Generator", threadGenerator:"Thread Generator", broadcastMessages:"Broadcast Messages", replyTemplates:"Reply Templates", channelPost:"Channel Post", socioMeeCalendar:"SocioMee Calendar", socioMeeReminders:"SocioMee Reminders", socioMeeNews:"SocioMee News", socioMeeNotes:"SocioMee Notes", socioMeeCloud:"SocioMee Cloud", socioMeeShare:"SocioMee Share", socioMeePixel:"SocioMee Pixel", socioMeePdf:"SocioMee PDF", langHinglish:"Hinglish", langHindi:"Hindi", langEnglish:"English", langMarathi:"Marathi", langTamil:"Tamil", langBengali:"Bengali", autoSelected:"Auto-selected", generateContent:"✦ Generate Content", generatingContent:"Generating content…", generatingYourContent:"Generating your content…", runningPipeline:"Running 6-engine pipeline…", runningPipelineFull:"Running 6-engine AI pipeline…", welcomeTitle:"Welcome to SocioMee", welcomeBody:"Please log in to access all tools.", logIn:"Log In" },
  hi: { generate:"जनरेट करें", channels:"चैनल", tools:"टूल्स", history:"इतिहास", thumbnail:"थंबनेल स्टूडियो", seo:"SEO एनालाइज़र", calendar:"कंटेंट कैलेंडर", guides:"गाइड्स और ब्लॉग", signout:"साइन आउट", upgrade:"✦ Pro में अपग्रेड करें", translator:"अनुवादक", videoclipper:"वीडियो क्लिपर", subtitles:"सबटाइटल्स", hashtags:"हैशटैग्स", language:"भाषा", channelSettings:"चैनल सेटिंग्स", oneTopicInfinite:"एक Topic. Infinite Content.", keywordTopic:"कीवर्ड / विषय", keywordPlaceholder:"जैसे: स्किनकेयर रूटीन, क्रिप्टो स्कैम, फेक इन्फ्लुएंसर्स...", platformLabel:"प्लेटफ़ॉर्म", personaLabel:"पर्सोना", selectPersona:"पर्सोना चुनें", selectLanguage:"भाषा चुनें", formatLabel:"फॉर्मेट", selectFormat:"फॉर्मेट चुनें", toneLabel:"टोन", formatLong:"लॉन्ग फॉर्म", formatShort:"शॉर्ट फॉर्म", formatThread:"थ्रेड", formatReel:"रील स्क्रिप्ट", toneBold:"बोल्ड", toneFunny:"फनी", toneEmotional:"इमोशनल", toneInformative:"इंफॉर्मेटिव", toneAggressive:"एग्रेसिव", toneSales:"सेल्स", toneDramatic:"ड्रामेटिक", toneCasual:"कैजुअल", toneMotivational:"मोटिवेशनल", toneStorytelling:"स्टोरीटेलिंग", toneEducational:"एजुकेशनल", toneTrending:"ट्रेंडिंग", toneCinematic:"सिनेमैटिक", hookGenerator:"हुक जनरेटर", textToAudio:"टेक्स्ट टू ऑडियो", keywordResearch:"कीवर्ड रिसर्च", trendingVideos:"ट्रेंडिंग वीडियो", evergreenScore:"एवरग्रीन स्कोर", dailyVideoIdeas:"डेली वीडियो आइडियाज़", screenRecorder:"स्क्रीन रेकॉर्डर", plans:"प्लान्स", videoIdeaGenerator:"वीडियो आइडिया जनरेटर", hashtagGenerator:"हैशटैग जनरेटर", bestTimeToPost:"पोस्ट का बेस्ट टाइम", postGenerator:"पोस्ट जनरेटर", threadGenerator:"थ्रेड जनरेटर", broadcastMessages:"ब्रॉडकास्ट मैसेज", replyTemplates:"रिप्लाई टेम्पलेट्स", channelPost:"चैनल पोस्ट", socioMeeCalendar:"SocioMee कैलेंडर", socioMeeReminders:"SocioMee रिमाइंडर्स", socioMeeNews:"SocioMee न्यूज़", socioMeeNotes:"SocioMee नोट्स", socioMeeCloud:"SocioMee क्लाउड", socioMeeShare:"SocioMee शेयर", socioMeePixel:"SocioMee पिक्सेल", socioMeePdf:"SocioMee पीडीएफ", langHinglish:"हिंग्लिश", langHindi:"हिंदी", langEnglish:"इंग्लिश", langMarathi:"मराठी", langTamil:"तमिल", langBengali:"बंगाली", autoSelected:"ऑटो-सेलेक्टेड", generateContent:"✦ कंटेंट जनरेट करें", generatingContent:"कंटेंट जनरेट हो रहा है…", generatingYourContent:"आपका कंटेंट जनरेट हो रहा है…", runningPipeline:"6-इंजन पाइपलाइन चल रही है…", runningPipelineFull:"6-इंजन AI पाइपलाइन चल रही है…", welcomeTitle:"SocioMee में आपका स्वागत है", welcomeBody:"सभी टूल्स एक्सेस करने के लिए कृपया लॉग इन करें।", logIn:"लॉग इन" },
  mr: { generate:"निर्माण करा", channels:"चॅनेल", tools:"साधने", history:"इतिहास", thumbnail:"थंबनेल स्टुडिओ", seo:"SEO विश्लेषक", calendar:"कंटेंट कॅलेंडर", guides:"मार्गदर्शक", signout:"साइन आउट", upgrade:"✦ Pro मध्ये अपग्रेड करा", translator:"अनुवादक", videoclipper:"व्हिडिओ क्लिपर", subtitles:"उपशीर्षके", hashtags:"हॅशटॅग्स", language:"भाषा", channelSettings:"चॅनेल सेटिंग्ज", oneTopicInfinite:"एक Topic. Infinite Content.", keywordTopic:"कीवर्ड / विषय", keywordPlaceholder:"उदा. स्किनकेअर रुटीन, क्रिप्टो स्कॅम, फेक इन्फ्लुएन्सर्स...", platformLabel:"प्लॅटफॉर्म", personaLabel:"पर्सोना", selectPersona:"पर्सोना निवडा", selectLanguage:"भाषा निवडा", formatLabel:"फॉरमॅट", selectFormat:"फॉरमॅट निवडा", toneLabel:"टोन", formatLong:"लाँग फॉर्म", formatShort:"शॉर्ट फॉर्म", formatThread:"थ्रेड", formatReel:"रील स्क्रिप्ट", toneBold:"बोल्ड", toneFunny:"फनी", toneEmotional:"इमोशनल", toneInformative:"माहितीपूर्ण", toneAggressive:"आक्रमक", toneSales:"सेल्स", toneDramatic:"ड्रामॅटिक", toneCasual:"कॅज्युअल", toneMotivational:"मोटिव्हेशनल", toneStorytelling:"स्टोरीटेलिंग", toneEducational:"शैक्षणिक", toneTrending:"ट्रेंडिंग", toneCinematic:"सिनेमॅटिक", hookGenerator:"हूक जनरेटर", textToAudio:"टेक्स्ट टू ऑडिओ", keywordResearch:"कीवर्ड रिसर्च", trendingVideos:"ट्रेंडिंग व्हिडिओ", evergreenScore:"एव्हरग्रीन स्कोअर", dailyVideoIdeas:"डेली व्हिडिओ आयडिया", screenRecorder:"स्क्रीन रेकॉर्डर", plans:"प्लॅन्स", videoIdeaGenerator:"व्हिडिओ आयडिया जनरेटर", hashtagGenerator:"हॅशटॅग जनरेटर", bestTimeToPost:"पोस्टसाठी सर्वोत्तम वेळ", postGenerator:"पोस्ट जनरेटर", threadGenerator:"थ्रेड जनरेटर", broadcastMessages:"ब्रॉडकास्ट मेसेज", replyTemplates:"रिप्लाय टेम्प्लेट्स", channelPost:"चॅनेल पोस्ट", socioMeeCalendar:"SocioMee कॅलेंडर", socioMeeReminders:"SocioMee रिमाइंडर्स", socioMeeNews:"SocioMee न्यूज", socioMeeNotes:"SocioMee नोट्स", socioMeeCloud:"SocioMee क्लाउड", socioMeeShare:"SocioMee शेअर", socioMeePixel:"SocioMee पिक्सेल", socioMeePdf:"SocioMee पीडीएफ", langHinglish:"हिंग्लिश", langHindi:"हिंदी", langEnglish:"इंग्लिश", langMarathi:"मराठी", langTamil:"तमिळ", langBengali:"बंगाली", autoSelected:"ऑटो-सिलेक्टेड", generateContent:"✦ कंटेंट जनरेट करा", generatingContent:"कंटेंट जनरेट होत आहे…", generatingYourContent:"तुमचा कंटेंट जनरेट होत आहे…", runningPipeline:"6-इंजिन पाइपलाइन सुरू आहे…", runningPipelineFull:"6-इंजिन AI पाइपलाइन सुरू आहे…", welcomeTitle:"SocioMee मध्ये आपले स्वागत आहे", welcomeBody:"सर्व टूल्स वापरण्यासाठी कृपया लॉग इन करा.", logIn:"लॉग इन" },
  ta: { generate:"உருவாக்கு", channels:"சேனல்கள்", tools:"கருவிகள்", history:"வரலாறு", thumbnail:"தம்ப்நெயில் ஸ்டுடியோ", seo:"SEO பகுப்பாய்வி", calendar:"உள்ளடக்க நாட்காட்டி", guides:"வழிகாட்டிகள்", signout:"வெளியேறு", upgrade:"✦ Pro க்கு மேம்படுத்து", translator:"மொழிபெயர்ப்பாளர்", videoclipper:"வீடியோ கிளிப்பர்", subtitles:"வசனங்கள்", hashtags:"ஹேஷ்டேக்கள்", language:"மொழி", channelSettings:"சேனல் அமைப்புகள்", oneTopicInfinite:"ஒரு தலைப்பு. Infinite Content.", keywordTopic:"முக்கிய சொல் / தலைப்பு", keywordPlaceholder:"எ.கா. ஸ்கின்கேர் ரூட்டீன், கிரிப்டோ மோசடி, போலி இன்ஃப்ளூயன்சர்கள்...", platformLabel:"தளம்", personaLabel:"பெர்சோனா", selectPersona:"பெர்சோனாவைத் தேர்ந்தெடுக்கவும்", selectLanguage:"மொழியைத் தேர்ந்தெடுக்கவும்", formatLabel:"வடிவம்", selectFormat:"வடிவத்தைத் தேர்ந்தெடுக்கவும்", toneLabel:"தொனி", formatLong:"நீண்ட வடிவம்", formatShort:"சிறு வடிவம்", formatThread:"த்ரெட்", formatReel:"ரீல் ஸ்கிரிப்ட்", toneBold:"போல்ட்", toneFunny:"வேடிக்கையான", toneEmotional:"உணர்ச்சிகரமான", toneInformative:"தகவலறிவு", toneAggressive:"ஆக்ரோஷமான", toneSales:"விற்பனை", toneDramatic:"நாடகத்தன்மை", toneCasual:"சகஜமான", toneMotivational:"ஊக்கமூட்டும்", toneStorytelling:"கதை சொல்லல்", toneEducational:"கல்வி சார்ந்த", toneTrending:"டிரெண்டிங்", toneCinematic:"சினிமாத்தன்மை", hookGenerator:"ஹூக் ஜெனரேட்டர்", textToAudio:"உரையிலிருந்து குரல்", keywordResearch:"முக்கிய சொல் ஆராய்ச்சி", trendingVideos:"டிரெண்டிங் வீடியோக்கள்", evergreenScore:"எவர்கிரீன் ஸ்கோர்", dailyVideoIdeas:"தினசரி வீடியோ யோசனைகள்", screenRecorder:"ஸ்க்ரீன் ரெக்கார்டர்", plans:"திட்டங்கள்", videoIdeaGenerator:"வீடியோ யோசனை ஜெனரேட்டர்", hashtagGenerator:"ஹேஷ்டேக் ஜெனரேட்டர்", bestTimeToPost:"பதிவிட சிறந்த நேரம்", postGenerator:"போஸ்ட் ஜெனரேட்டர்", threadGenerator:"த்ரெட் ஜெனரேட்டர்", broadcastMessages:"பிராட்காஸ்ட் செய்திகள்", replyTemplates:"பதில் டெம்ப்ளேட்கள்", channelPost:"சேனல் போஸ்ட்", socioMeeCalendar:"SocioMee காலண்டர்", socioMeeReminders:"SocioMee நினைவூட்டல்கள்", socioMeeNews:"SocioMee செய்திகள்", socioMeeNotes:"SocioMee குறிப்புகள்", socioMeeCloud:"SocioMee க்ளவுட்", socioMeeShare:"SocioMee பகிர்வு", socioMeePixel:"SocioMee பிக்சல்", socioMeePdf:"SocioMee பிடிஎஃப்", langHinglish:"ஹிங்லீஷ்", langHindi:"இந்தி", langEnglish:"ஆங்கிலம்", langMarathi:"மராத்தி", langTamil:"தமிழ்", langBengali:"பெங்காலி", autoSelected:"தானாகத் தேர்ந்தெடுக்கப்பட்டது", generateContent:"✦ உள்ளடக்கத்தை உருவாக்கு", generatingContent:"உள்ளடக்கம் உருவாக்கப்படுகிறது…", generatingYourContent:"உங்கள் உள்ளடக்கம் உருவாக்கப்படுகிறது…", runningPipeline:"6-இயந்திர பைப்லைன் இயங்குகிறது…", runningPipelineFull:"6-இயந்திர AI பைப்லைன் இயங்குகிறது…", welcomeTitle:"SocioMee க்கு வரவேற்கிறோம்", welcomeBody:"அனைத்து கருவிகளையும் அணுக உள்நுழையவும்.", logIn:"உள்நுழைக" },
  bn: { generate:"তৈরি করুন", channels:"চ্যানেল", tools:"সরঞ্জাম", history:"ইতিহাস", thumbnail:"থাম্বনেইল স্টুডিও", seo:"SEO বিশ্লেষক", calendar:"কন্টেন্ট ক্যালেন্ডার", guides:"গাইড", signout:"সাইন আউট", upgrade:"✦ Pro তে আপগ্রেড করুন", translator:"অনুবাদক", videoclipper:"ভিডিও ক্লিপার", subtitles:"সাবটাইটেল", hashtags:"হ্যাশট্যাগ", language:"ভাষা", channelSettings:"চ্যানেল সেটিংস", oneTopicInfinite:"এক বিষয়. Infinite Content.", keywordTopic:"কীওয়ার্ড / বিষয়", keywordPlaceholder:"যেমন: স্কিনকেয়ার রুটিন, ক্রিপ্টো স্ক্যাম, ফেক ইনফ্লুয়েন্সার...", platformLabel:"প্ল্যাটফর্ম", personaLabel:"পার্সোনা", selectPersona:"পার্সোনা নির্বাচন করুন", selectLanguage:"ভাষা নির্বাচন করুন", formatLabel:"ফরম্যাট", selectFormat:"ফরম্যাট নির্বাচন করুন", toneLabel:"টোন", formatLong:"লং ফর্ম", formatShort:"শর্ট ফর্ম", formatThread:"থ্রেড", formatReel:"রিল স্ক্রিপ্ট", toneBold:"বোল্ড", toneFunny:"ফানি", toneEmotional:"ইমোশনাল", toneInformative:"ইনফরমেটিভ", toneAggressive:"আগ্রাসী", toneSales:"সেলস", toneDramatic:"ড্রামাটিক", toneCasual:"ক্যাজুয়াল", toneMotivational:"মোটিভেশনাল", toneStorytelling:"স্টোরিটেলিং", toneEducational:"শিক্ষামূলক", toneTrending:"ট্রেন্ডিং", toneCinematic:"সিনেমাটিক", hookGenerator:"হুক জেনারেটর", textToAudio:"টেক্সট টু অডিও", keywordResearch:"কীওয়ার্ড রিসার্চ", trendingVideos:"ট্রেন্ডিং ভিডিও", evergreenScore:"এভারগ্রিন স্কোর", dailyVideoIdeas:"ডেইলি ভিডিও আইডিয়া", screenRecorder:"স্ক্রিন রেকর্ডার", plans:"প্ল্যান", videoIdeaGenerator:"ভিডিও আইডিয়া জেনারেটর", hashtagGenerator:"হ্যাশট্যাগ জেনারেটর", bestTimeToPost:"পোস্ট করার শ্রেষ্ঠ সময়", postGenerator:"পোস্ট জেনারেটর", threadGenerator:"থ্রেড জেনারেটর", broadcastMessages:"ব্রডকাস্ট মেসেজ", replyTemplates:"রিপ্লাই টেমপ্লেট", channelPost:"চ্যানেল পোস্ট", socioMeeCalendar:"SocioMee ক্যালেন্ডার", socioMeeReminders:"SocioMee রিমাইন্ডার", socioMeeNews:"SocioMee নিউজ", socioMeeNotes:"SocioMee নোটস", socioMeeCloud:"SocioMee ক্লাউড", socioMeeShare:"SocioMee শেয়ার", socioMeePixel:"SocioMee পিক্সেল", socioMeePdf:"SocioMee পিডিএফ", langHinglish:"হিংলিশ", langHindi:"হিন্দি", langEnglish:"ইংরেজি", langMarathi:"মারাঠি", langTamil:"তামিল", langBengali:"বাংলা", autoSelected:"অটো-নির্বাচিত", generateContent:"✦ কন্টেন্ট তৈরি করুন", generatingContent:"কন্টেন্ট তৈরি হচ্ছে…", generatingYourContent:"আপনার কন্টেন্ট তৈরি হচ্ছে…", runningPipeline:"৬-ইঞ্জিন পাইপলাইন চলছে…", runningPipelineFull:"৬-ইঞ্জিন AI পাইপলাইন চলছে…", welcomeTitle:"SocioMee-এ আপনাকে স্বাগতম", welcomeBody:"সমস্ত টুল অ্যাক্সেস করতে অনুগ্রহ করে লগ ইন করুন।", logIn:"লগ ইন" },
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
  const [ytChannels, setYtChannels] = useState([]);
  const [pinterestStatus, setPinterestStatus] = useState(null);
  const [threadsStatus, setThreadsStatus] = useState(null);
  const [liStatus, setLiStatus] = useState(null);
  const [bugModal, setBugModal] = useState(false);
  const [bugText, setBugText] = useState("");
  const [bugImage, setBugImage] = useState(null);
  const [bugSending, setBugSending] = useState(false);
  const [bugDone, setBugDone] = useState(false);
  const [tgStatus, setTgStatus] = useState(null);
  const [dcStatus, setDcStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.allSettled([
      fetch(BASE+"/youtube/channels/"+userId, { credentials:"include" }).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(BASE+"/telegram/connect-status?user_id="+userId).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(BASE+"/discord/guilds?user_id="+userId).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([yt,tg,dc]) => {
      const chs = yt.value?.channels || []; setYtChannels(chs.map(ch => ({title: ch.channel_title, thumbnail: ch.thumbnail_url, subscribers: ch.subscribers, channel_id: ch.channel_id})));
      fetch(BASE+"/pinterest/status?user_id="+userId).then(r=>r.json()).then(setPinterestStatus).catch(()=>setPinterestStatus(null));
      fetch(BASE+"/threads/status?user_id="+userId).then(r=>r.json()).then(setThreadsStatus).catch(()=>setThreadsStatus(null));
      fetch(BASE+"/linkedin/status?user_id="+userId).then(r=>r.json()).then(d=>setLiStatus(d.connected?d:null)).catch(()=>setLiStatus(null));
      if (tg.value) setTgStatus(tg.value);
      if (dc.value) setDcStatus(dc.value);
      setLoading(false);
    });
  }, [userId]);
  const disconnectYT = async (channelId) => { await fetch(BASE+"/youtube/disconnect-channel/"+userId+(channelId?"?channel_id="+channelId:""),{method:"DELETE",credentials:"include"}).catch(()=>{}); setYtChannels(prev=>channelId?prev.filter(c=>c.channel_id!==channelId):[]); };
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
    <>
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
          <Sec icon={<img src="/icons/youtube.png" style={{width:20,height:20,objectFit:"contain"}} alt="yt"/>} label="YouTube Channels" count={ytChannels.length}>
            {ytChannels.length ? ytChannels.map(ch => (<div key={ch.channel_id||ch.title} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,0,0,0.05)",border:"1px solid rgba(255,0,0,0.15)",marginBottom:"8px"}}>{ch.thumbnail?<img src={ch.thumbnail} style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/>:<YTIcon/>}<div style={{flex:1,minWidth:0}}><div style={{fontSize:"13px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ch.title||"Channel"}</div><div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{ch.subscribers?Number(ch.subscribers).toLocaleString()+" subs":""}</div></div><DisconnectBtn onClick={()=>disconnectYT(ch.channel_id)}/></div>)) : (<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 24px",gap:"16px",textAlign:"center"}}><div style={{width:"64px",height:"64px",borderRadius:"50%",background:"rgba(255,0,0,0.12)",border:"2px solid rgba(255,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}><YTIcon size={28}/></div><h3 style={{fontSize:"16px",fontWeight:"900",color:"#fff",margin:0}}>Connect YouTube</h3><p style={{fontSize:"12.5px",color:"rgba(255,255,255,0.45)",lineHeight:1.6,maxWidth:"280px",margin:0}}>Publish videos, track analytics, and manage your YouTube channel from SocioMee.</p><a href={`${BASE}/youtube/connect?user_id=${userId}`} style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 24px",borderRadius:"12px",border:"none",background:"linear-gradient(135deg,#ff0000,#cc0000)",color:"white",fontWeight:"800",fontSize:"14px",cursor:"pointer",fontFamily:"inherit",textDecoration:"none"}}><YTIcon size={16} color="#fff"/> Connect YouTube</a></div>)}
          </Sec>
          <Sec icon={<img src="/icons/telegram.png" style={{width:20,height:20,objectFit:"contain"}} alt="tg"/>} label="Telegram" count={tgStatus?.connected?1:0}>
            {tgStatus?.connected ? (<div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(42,171,238,0.05)",border:"1px solid rgba(42,171,238,0.15)",marginBottom:"8px"}}><div style={{width:"38px",height:"38px",borderRadius:"50%",background:"rgba(42,171,238,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><img src="/icons/telegram.png" style={{width:22,height:22,objectFit:"contain"}} alt="tg"/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:"13px",fontWeight:"700",color:"#fff"}}>{"@"+(tgStatus.telegram_username||tgStatus.full_name||"Connected")}</div>{tgStatus.channel&&<div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{tgStatus.channel}</div>}</div><DisconnectBtn onClick={disconnectTG}/></div>) : <div style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",padding:"8px 0"}}>No Telegram connected</div>}
          </Sec>
          <Sec icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>} label="Discord" count={dcStatus?.guilds?.length||0}>
            {(dcStatus?.guilds && dcStatus.guilds.length > 0) ? dcStatus.guilds.map(g => (
              <div key={g.guild_id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(88,101,242,0.05)",border:"1px solid rgba(88,101,242,0.15)",marginBottom:"8px"}}>
                <div style={{width:"38px",height:"38px",borderRadius:"50%",background:"rgba(88,101,242,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.guild_name||"Discord Server"}</div>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{g.channels?.length||0} channel{g.channels?.length===1?"":"s"}</div>
                </div>
                <DisconnectBtn onClick={()=>{fetch(BASE+"/discord/remove-guild?user_id="+userId+"&guild_id="+g.guild_id,{method:"POST"}).catch(()=>{}); setDcStatus(prev=>({guilds:(prev?.guilds||[]).filter(x=>x.guild_id!==g.guild_id)})); window.dispatchEvent(new Event("sociomee-discord-updated"));}}/>
              </div>
            )) : <div style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",padding:"8px 0"}}>No Discord connected</div>}
          </Sec>
          <div style={{height:"1px",background:"rgba(255,255,255,0.07)",marginBottom:"16px"}}/>
          <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",marginBottom:"12px"}}>Other Accounts</div>
          {pinterestStatus?.connected ? (
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(230,0,35,0.05)",border:"1px solid rgba(230,0,35,0.15)",marginBottom:"8px"}}>
              <img src="/icons/pinterest.png" style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt="Pinterest"/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pinterestStatus.username||pinterestStatus.account_name||"Connected"}</div>
              </div>
              <DisconnectBtn onClick={()=>{fetch(BASE+"/pinterest/disconnect?user_id="+userId,{method:"POST"}).catch(()=>{}); setPinterestStatus(null);}}/>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:"8px"}}>
              <img src="/icons/pinterest.png" style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt="Pinterest"/>
              <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.5)",flex:1}}>Pinterest</span>
              <a href={BASE+"/pinterest/connect?user_id="+userId} style={{fontSize:"10px",color:"#e60023",fontWeight:"700",background:"rgba(230,0,35,0.1)",padding:"3px 8px",borderRadius:"99px",textDecoration:"none",border:"1px solid rgba(230,0,35,0.3)"}}>Connect</a>
            </div>
          )}
          <div style={{height:"1px",background:"rgba(255,255,255,0.07)",marginBottom:"16px"}}/>
          <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.2)",marginBottom:"12px"}}>Other Accounts</div>
          {threadsStatus?.connected ? (
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",marginBottom:"8px"}}>
              <img src="/icons/threads.png" style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt="Threads"/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>@{threadsStatus.username||"sociomeeai.offical"}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{threadsStatus.display_name||""}</div>
              </div>
              <DisconnectBtn onClick={()=>{
                fetch(BASE+"/threads/disconnect?user_id="+userId,{method:"POST"}).catch(()=>{});
                setThreadsStatus(null);
              }}/>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:"8px"}}>
              <img src="/icons/threads.png" style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt="Threads"/>
              <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.5)",flex:1}}>Threads</span>
              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",fontWeight:"600",background:"rgba(255,255,255,0.05)",padding:"3px 8px",borderRadius:"99px"}}>Coming Soon</span>
            </div>
          )}
          <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:"8px"}}>
            <img src="/icons/instagram.png" style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt="Instagram"/>
            <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.5)",flex:1}}>Instagram</span>
            <span style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",fontWeight:"600",background:"rgba(255,255,255,0.05)",padding:"3px 8px",borderRadius:"99px"}}>Coming Soon</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:"8px"}}>
            <img src="/icons/facebook.png" style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt="Facebook"/>
            <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.5)",flex:1}}>Facebook</span>
            <span style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",fontWeight:"600",background:"rgba(255,255,255,0.05)",padding:"3px 8px",borderRadius:"99px"}}>Coming Soon</span>
          </div>
          {liStatus?.connected ? (
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(10,102,194,0.05)",border:"1px solid rgba(10,102,194,0.15)",marginBottom:"8px"}}>
              <img src="/icons/linkedin.png" style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt="LinkedIn"/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{liStatus.name||"Connected"}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{liStatus.email||""}</div>
              </div>
              <DisconnectBtn onClick={()=>{fetch(BASE+"/linkedin/disconnect",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:userId})}).catch(()=>{}); setLiStatus(null);}}/>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",marginBottom:"8px"}}>
              <img src="/icons/linkedin.png" style={{width:32,height:32,objectFit:"contain",flexShrink:0}} alt="LinkedIn"/>
              <span style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.5)",flex:1}}>LinkedIn</span>
              <a href={BASE+"/linkedin/connect?user_id="+userId} style={{fontSize:"10px",color:"#0a66c2",fontWeight:"700",background:"rgba(10,102,194,0.1)",padding:"3px 8px",borderRadius:"99px",textDecoration:"none",border:"1px solid rgba(10,102,194,0.3)"}}>Connect</a>
            </div>
          )}
        </>)}
      </div>
    </div>
    {bugModal && (
      <div onClick={(e)=>{if(e.target===e.currentTarget){setBugModal(false);setBugText("");setBugImage(null);setBugDone(false);}}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(12px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
        <div style={{background:"#0f0a1a",border:"1px solid rgba(124,58,237,0.3)",borderRadius:"20px",padding:"28px",width:"100%",maxWidth:"460px",position:"relative"}}>
          <button onClick={()=>{setBugModal(false);setBugText("");setBugImage(null);setBugDone(false);}} style={{position:"absolute",top:"16px",right:"16px",background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"20px",cursor:"pointer",lineHeight:1}}>✕</button>
          {bugDone ? (
            <div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{fontSize:"40px",marginBottom:"12px"}}>✅</div>
              <div style={{fontSize:"16px",fontWeight:"700",color:"#fff",marginBottom:"8px"}}>Bug reported!</div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,0.45)"}}>We will look into it. Thanks for helping improve SocioMee.</div>
              <button onClick={()=>{setBugModal(false);setBugText("");setBugImage(null);setBugDone(false);}} style={{marginTop:"20px",padding:"10px 28px",borderRadius:"99px",background:"linear-gradient(135deg,#7c3aed,#ff3d8f)",border:"none",color:"#fff",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Done</button>
            </div>
          ) : (
            <>
              <div style={{fontSize:"16px",fontWeight:"800",color:"#fff",marginBottom:"4px"}}>🐛 Report a Bug</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",marginBottom:"20px"}}>Tell us what went wrong. Include as many details as possible.</div>
              <textarea value={bugText} onChange={e=>setBugText(e.target.value)} placeholder="Please include as many details as possible..." rows={5} style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"14px",color:"#fff",fontSize:"13px",fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:1.6}}/>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"12px"}}>
                <label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600"}}>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>setBugImage(ev.target.result);reader.readAsDataURL(file);}}/>
                  📎 {bugImage ? "Screenshot attached ✓" : "Attach screenshot"}
                </label>
                <button disabled={bugSending||!bugText.trim()} onClick={async()=>{setBugSending(true);try{await fetch("/api/bug/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:bugText,user_email:user?.email||"unknown",user_id:user?.user_id||user?.id||"unknown",screenshot:bugImage||null})});setBugDone(true);}catch(e){setBugDone(true);}setBugSending(false);}} style={{padding:"10px 22px",borderRadius:"99px",background:bugText.trim()?"linear-gradient(135deg,#7c3aed,#ff3d8f)":"rgba(255,255,255,0.08)",border:"none",color:bugText.trim()?"#fff":"rgba(255,255,255,0.3)",fontWeight:"700",fontSize:"13px",cursor:bugText.trim()?"pointer":"default",fontFamily:"inherit"}}>{bugSending?"Sending...":"Submit"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
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
  if (allowed) return <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column"}}>{children}</div>;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",minHeight:"60vh",fontFamily:"Poppins,sans-serif",padding:"40px 24px",textAlign:"center"}}>
      <div style={{width:"64px",height:"64px",borderRadius:"16px",background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",marginBottom:"20px"}}>🔒</div>
      <h2 style={{fontSize:"20px",fontWeight:"800",color:"#fff",margin:"0 0 8px",fontFamily:"Poppins,sans-serif"}}>{toolName || "Pro Feature"}</h2>
      <p style={{fontSize:"14px",color:"rgba(255,255,255,0.45)",margin:"0 0 24px",lineHeight:1.7,maxWidth:"360px"}}>This tool is available on the Pro plan and above. Upgrade to unlock all SocioMee Store tools, YouTube uploads and full AI features.</p>
      <button onClick={onUpgrade}
        onClick={()=>window.location.href="/pricing"} style={{padding:"12px 28px",borderRadius:"99px",border:"none",background:"linear-gradient(135deg,#7c3aed,#9b5cf6)",color:"#fff",fontSize:"14px",fontWeight:"700",cursor:"pointer",fontFamily:"Poppins,sans-serif"}}>
        Upgrade to Pro — ₹499/month
      </button>
      <p style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",marginTop:"12px",fontFamily:"Poppins,sans-serif"}}>Cancel anytime. Instant access after payment.</p>
    </div>
  );
}

export default function App() {
  const { user, isLoggedIn, logout, refreshToken, loading: authLoading } = useAuth();

  const apiFetch = useCallback(async (path, body) => {
    const headers = { "Content-Type":"application/json" };
    const res = await fetch(`${BASE}${path}`, { method:"POST", headers, credentials:"include", body:JSON.stringify(body) });
    if (!res.ok) {
      const t = await res.text().catch(()=>`HTTP ${res.status}`);
      let d=t; try{ d=JSON.parse(t).detail||t; } catch{}
      throw new Error(typeof d==="object"?JSON.stringify(d):d);
    }
    return res.json();
  }, []);

  const [keyword,      setKeyword    ] = useState("");
  const [videoFile,    setVideoFile  ] = useState(null);
  const [deepResearch,  setDeepResearch] = useState(false);
  const [isListening,  setIsListening] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState("");
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
  const [bugModal, setBugModal] = useState(false);
  const [bugText, setBugText] = useState("");
  const [bugImage, setBugImage] = useState(null);
  const [bugSending, setBugSending] = useState(false);
  const [bugDone, setBugDone] = useState(false);
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
  const [downgradeConfirm, setDowngradeConfirm] = useState(null);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [downgradeError, setDowngradeError] = useState("");
  const [downgradeSuccess, setDowngradeSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notifSettings, setNotifSettings] = useState({newFeatures:true,weeklyTips:true,usageAlerts:true,proOffers:false});
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [openGroups, setOpenGroups] = useState({youtube:true, instagram:false, telegram:false, pinterest:false, threads:false, reddit:false, linkedin:false, facebook:false, tiktok:false, whatsapp:false, xtools:false, analytics:false});
  const [myApps, setMyApps] = useState([]);
  const [appsCatalog, setAppsCatalog] = useState([]);
  const [showAppStore, setShowAppStore] = useState(false);
  const appUserId = localStorage.getItem("sociomee_user_id") || user?.user_id || "";

  useEffect(() => {
    fetch(BASE + "/apps/catalog").then(r=>r.json()).then(d=>setAppsCatalog(d.apps||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!appUserId) return;
    const params = new URLSearchParams(window.location.search);
    const getApp = params.get("get_app");
    if (getApp && APP_TAB_MAP[getApp]) {
      // Skip the plain fetch here — the get_app effect below handles add + fetch together
      return;
    }
    fetch(BASE + "/apps/my/" + appUserId).then(r=>r.json()).then(d=>setMyApps(d.added||[])).catch(()=>{});
  }, [appUserId]);

  const handleAddApp = (appId) => {
    if (!appUserId) return;
    fetch(BASE + "/apps/add", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ user_id: appUserId, app_id: appId })
    }).then(r=>r.json()).then(d=>{ if(d.added) setMyApps(d.added); }).catch(()=>{});
  };

  const handleRemoveApp = (appId) => {
    if (!appUserId) return;
    fetch(BASE + "/apps/remove", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ user_id: appUserId, app_id: appId })
    }).then(r=>r.json()).then(d=>{ if(d.added) setMyApps(d.added); }).catch(()=>{});
  };

  const APP_ICONS = {
    notes:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    cloud:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
    share:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    pixel:    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C12 2 11.5 7.5 9 9C9 9 4 10.5 2 12C2 12 7 13.5 9 15C9 15 11.5 20.5 12 22C12 22 12.5 16.5 15 15C15 15 20 13.5 22 12C22 12 17 10.5 15 9C15 9 12.5 3.5 12 2Z"/></svg>,
    pdf:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    calendar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    reminders:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    news:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>,
    recorder: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  };
  const APP_TAB_MAP = { notes:"notes", vault:"cloud", share:"share", pixel:"pixel", pdf:"pdf", calendar:"calendar", reminders:"reminders", news:"news", screenrecorder:"screenrecorder" };

  // Handle ?get_app= deep link from the Store page
  useEffect(() => {
    if (!appUserId) return;
    const params = new URLSearchParams(window.location.search);
    const getApp = params.get("get_app");
    if (getApp && APP_TAB_MAP[getApp]) {
      fetch(BASE + "/apps/add", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ user_id: appUserId, app_id: getApp })
      }).then(r=>r.json()).then(d=>{
        if (d.added) setMyApps(d.added);
        setActiveTab(APP_TAB_MAP[getApp]);
        window.history.replaceState({}, "", "/app");
      }).catch(()=>{});
    }
  }, [appUserId]);
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
    const genHandler = (e) => { if(e.detail?.content) setKeyword(e.detail.content); setActiveTab("generate"); setSidebarOpen(false); };
    window.addEventListener("sociomee:generate", genHandler);
    return () => { window.removeEventListener("sociomee_navigate", handler); window.removeEventListener("sociomee:generate", genHandler); };
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
    fetch(`${BASE}/credits/${user.user_id}`, { credentials:"include" })
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
    if (Number(currentCredits) <= 0) { setError("No credits remaining. Upgrade to keep creating."); return; }
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
      if (data?.error && data?.credits <= 0) { setError(data.error); setLoading(false); return; }
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
    threads:"Threads | SocioMee", instagram:"Instagram | SocioMee", facebook:"Facebook | SocioMee",
    pinterest:"Pinterest | SocioMee", reddit:"Reddit | SocioMee",
    telegram:"Telegram | SocioMee", discord:"Discord | SocioMee",
    history:"History | SocioMee", thumbnail:"Thumbnail Studio | SocioMee",
    translator:"Translator | SocioMee", videoclipper:"Video Clipper | SocioMee",
    subtitles:"Subtitles | SocioMee", hashtags:"Hashtag Generator | SocioMee",
    texttaudio:"Text to Audio | SocioMee", hookgenerator:"Hook Generator | SocioMee",
    biowriter:"Bio Writer | SocioMee",
    notes:"Notes | SocioMee", pixel:"Pixel | SocioMee", pdf:"PDF | SocioMee",
    share:"Share | SocioMee", calendar:"Calendar | SocioMee", news:"News | SocioMee", reminders:"Reminders | SocioMee",
    cloud:"Cloud | SocioMee", screenrecorder:"Screen Recorder | SocioMee",
  };
  useEffect(() => { document.title = PAGE_TITLES[activeTab] || "SocioMee"; }, [activeTab]);
  // Sync activeTab with URL: /app/notes, /app/pixel, etc.
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/app\/?/, "");
    if (path && PAGE_TITLES[path]) setActiveTab(path);
  }, []);
  useEffect(() => {
    const slug = activeTab === "generate" ? "" : "/" + activeTab;
    const newPath = "/app" + slug;
    if (window.location.pathname !== newPath && PAGE_TITLES[activeTab]) {
      window.history.pushState(null, "", newPath);
    }
  }, [activeTab]);

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
    { id:"facebook",   label:"Facebook",  color:"#1877f2", icon:<img src="/icons/facebook.png"  style={{width:16,height:16,objectFit:"contain"}} alt="fb"/> },
    { id:"linkedin",   label:"LinkedIn",  color:"#0a66c2", icon:<img src="/icons/linkedin.png"  style={{width:16,height:16,objectFit:"contain"}} alt="li"/> },
    { id:"pinterest",  label:"Pinterest", color:"#e60023", icon:<img src="/icons/pinterest.png" style={{width:16,height:16,objectFit:"contain"}} alt="pin"/> },
    { id:"telegram", label:"Telegram",  color:"#2aabee", icon:<img src="/icons/telegram.png"  style={{width:16,height:16,objectFit:"contain"}} alt="tg"/> },
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
          <a href="/" target="_blank" rel="noopener noreferrer" style={{fontSize:"16px",fontWeight:"900",fontFamily:"'Orbitron',sans-serif",color:"#fff",letterSpacing:"2px",textDecoration:"none",cursor:"pointer"}}>SOCIOMEE</a>
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

          {/* Apps - single entry point like ChatGPT */}
          <button onClick={()=>setShowAppStore(true)} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"8px",border:"none",background:"transparent",color:"rgba(255,255,255,0.45)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.color="rgba(255,255,255,0.85)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.45)";}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Apps
          </button>
          {myApps.map(appId => {
            const appInfo = appsCatalog.find(a=>a.id===appId);
            if (!appInfo) return null;
            const tab = APP_TAB_MAP[appId] || appId;
            return (
              <button key={appId} onClick={()=>{ const rp=user?.plan||user?.plan_label||"free"; const isFree=!rp.toLowerCase().includes("pro")&&!rp.toLowerCase().includes("premium"); if(isFree){setShowPricing(true);return;} toggleTab(tab);setSidebarOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px 8px 30px",borderRadius:"8px",border:"none",borderLeft:activeTab===tab?"3px solid rgba(255,255,255,0.6)":"3px solid transparent",background:activeTab===tab?"rgba(255,255,255,0.08)":"transparent",color:activeTab===tab?"#fff":"rgba(255,255,255,0.4)",fontSize:"12.5px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}>
                {APP_ICONS[appInfo.icon]}{appInfo.label.replace("SocioMee ","")}
              </button>
            );
          })}

          {/* Channels label */}
          <div style={{fontSize:"9px",fontWeight:"700",color:"rgba(255,255,255,0.18)",letterSpacing:"1.5px",padding:"12px 12px 4px",textTransform:"uppercase"}}>Connect</div>

          {CHANNELS.map(ch=>(
            <button key={ch.id} onClick={()=>{toggleTab(ch.id);setSidebarOpen(false);}}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:"8px",border:"none",borderLeft:activeTab===ch.id?`3px solid ${ch.color}`:"3px solid transparent",background:activeTab===ch.id?`${ch.color}14`:"transparent",color:activeTab===ch.id?ch.color:"rgba(255,255,255,0.4)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}>
              <span style={{display:"flex",alignItems:"center",gap:"8px"}}>{ch.icon}{ch.label}</span>
            </button>
          ))}

          {/* Tools label */}
          <div style={{fontSize:"9px",fontWeight:"700",color:"rgba(255,255,255,0.18)",letterSpacing:"1.5px",padding:"12px 12px 4px",textTransform:"uppercase"}}>{t("tools")}</div>

          {/* YouTube Tools */}
          <button onClick={()=>toggleGroup("youtube")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.youtube?"rgba(255,0,0,0.06)":"transparent",color:openGroups.youtube?"#ff6b6b":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/youtube.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>YouTube {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.youtube?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.youtube && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,0,0,0.15)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"videoclipper",label:t("videoclipper"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>},
                {tab:"subtitles",label:t("subtitles"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>},
                {tab:"hookgenerator",label:t("hookGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"thumbnail",label:t("thumbnail"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:t("textToAudio"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>},
                {tab:"yt-keyword",label:t("keywordResearch"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>},
                {tab:"yt-trending",label:t("trendingVideos"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>},
                {tab:"seo",label:t("seo"),fn:()=>{setYoutubeInitialTab("seo");setActiveTab("youtube");setSidebarOpen(false);},icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>},
                {tab:"yt-evergreen",label:t("evergreenScore"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V12M12 12C12 8 8 6 6 6c1 3 3 5 6 6zM12 12C12 8 16 6 18 6c-1 3-3 5-6 6z"/></svg>},
                {tab:"yt-ideas",label:t("dailyVideoIdeas"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/instagram.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Instagram {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.instagram?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.instagram && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(225,48,108,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"hashtags",label:t("hashtagGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>},
                {tab:"biowriter",label:"Bio Writer",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"hookgenerator",label:t("hookGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:t("textToAudio"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="#2aabee"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.086l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.646.5z"/></svg>Telegram {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.telegram?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.telegram && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(37,199,220,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"tg-hook",label:t("hookGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"tg-poll",label:"Poll Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>},
                {tab:"tg-besttime",label:t("bestTimeToPost"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"tg-scheduler",label:"Broadcast Scheduler",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:t("textToAudio"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/pinterest.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Pinterest {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.pinterest?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.pinterest && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(230,0,35,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"pt-pindesc",label:"Pin Description",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"pt-board",label:"Board Names",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>},
                {tab:"pt-hashtag",label:t("hashtagGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>},
                {tab:"pt-besttime",label:t("bestTimeToPost"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:t("textToAudio"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/threads.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Threads {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.threads?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.threads && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,255,255,0.12)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"th-thread",label:t("threadGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
                {tab:"th-bio",label:"Bio Writer",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"th-hook",label:t("hookGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:t("textToAudio"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/reddit.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Reddit {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.reddit?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.reddit && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,69,0,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"rd-title",label:"Post Title Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"rd-subreddit",label:"Subreddit Finder",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>},
                {tab:"rd-besttime",label:t("bestTimeToPost"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:t("textToAudio"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/linkedin.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>LinkedIn {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.linkedin?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.linkedin && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(0,119,181,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"li-post",label:t("postGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"li-headline",label:"Headline Writer",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"li-about",label:"About Section",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>},
                {tab:"li-carousel",label:"Carousel Ideas",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M17 7V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2"/></svg>},
                {tab:"li-hashtag",label:t("hashtagGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>},
                {tab:"li-besttime",label:t("bestTimeToPost"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:t("textToAudio"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/facebook.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>Facebook {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.facebook?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.facebook && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(24,119,242,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"fb-post",label:"Post Caption",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"fb-group",label:"Group Post",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
                {tab:"fb-ad",label:"Ad Copy",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>},
                {tab:"fb-besttime",label:t("bestTimeToPost"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
                {tab:"texttaudio",label:t("textToAudio"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/tiktok.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>TikTok {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.tiktok?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.tiktok && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,0,80,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"tt-hook",label:t("hookGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"tt-caption",label:"Caption Generator",icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"tt-ideas",label:t("videoIdeaGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>},
                {tab:"tt-hashtag",label:t("hashtagGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>},
                {tab:"tt-besttime",label:t("bestTimeToPost"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/whatsapp.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>WhatsApp {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.whatsapp?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.whatsapp && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(37,211,102,0.2)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"wa-broadcast",label:t("broadcastMessages"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.93 3.25 2 2 0 0 1 3.89 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>},
                {tab:"wa-reply",label:t("replyTemplates"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
                {tab:"wa-channel",label:t("channelPost"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
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
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><img src="/icons/x.png" style={{width:14,height:14,objectFit:"contain"}} alt=""/>X {t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.xtools?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.xtools && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,255,255,0.12)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"x-post",label:t("postGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>},
                {tab:"x-thread",label:t("threadGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>},
                {tab:"x-hook",label:t("hookGenerator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg>},
                {tab:"x-besttime",label:t("bestTimeToPost"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"translator",label:t("translator"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>},
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
          {/* Analytics & Tools - simplified: History + Guides only */}
          <button onClick={()=>toggleGroup("analytics")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"8px",border:"none",background:openGroups.analytics?"rgba(255,255,255,0.06)":"transparent",color:openGroups.analytics?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.45)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",width:"100%",transition:"all 0.15s",marginTop:"2px"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>{t("tools")}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{transform:openGroups.analytics?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {openGroups.analytics && (
            <div style={{paddingLeft:"10px",borderLeft:"2px solid rgba(255,255,255,0.12)",marginLeft:"14px",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {[
                {tab:"history",label:t("history"),fn:()=>toggleTab("history"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
                {tab:"guides",label:t("guides"),fn:()=>window.open("/blog","_blank"),icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>},
              ].map(item=>(
                <button key={item.tab} onClick={item.fn}
                  style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",borderRadius:"6px",border:"none",borderLeft:activeTab===item.tab?"2px solid rgba(255,255,255,0.6)":"2px solid transparent",background:activeTab===item.tab?"rgba(255,255,255,0.08)":"transparent",color:activeTab===item.tab?"#fff":"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",width:"100%",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.75)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=activeTab===item.tab?"#fff":"rgba(255,255,255,0.4)";e.currentTarget.style.background=activeTab===item.tab?"rgba(255,255,255,0.08)":"transparent";}}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Bottom */}
        <div style={{flexShrink:0,borderTop:"1px solid rgba(255,255,255,0.05)",padding:"12px 8px"}}>
          {!isPro&&<a href="/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"10px",borderRadius:"99px",background:"linear-gradient(135deg,#7c3aed,#9b5cf6)",color:"#fff",fontSize:"13px",fontWeight:"700",textDecoration:"none",boxShadow:"0 0 20px rgba(124,58,237,0.35)",marginBottom:"8px"}}>✦ Upgrade to Pro</a>}
          <button onClick={logout} style={{width:"100%",padding:"9px",borderRadius:"99px",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.4)",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{t("signout")}</button>
        </div>

      </div>

      {/* PROFILE SLIDE-UP OVERLAY */}
      {profilePanelOpen && <div onClick={()=>setProfilePanelOpen(false)} style={{position:"fixed",inset:0,zIndex:9998}}/>}
      <div style={{position:"fixed",bottom:"60px",left:0,width:"220px",zIndex:9999,background:"rgba(10,8,20,0.98)",backdropFilter:"blur(24px)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:"16px 16px 0 0",padding:"16px 14px 20px",transform:profilePanelOpen?"translateY(0)":"translateY(120%)",visibility:profilePanelOpen?"visible":"hidden",pointerEvents:profilePanelOpen?"all":"none",transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)"}}>
        <div style={{width:"32px",height:"3px",borderRadius:"99px",background:"rgba(255,255,255,0.12)",margin:"0 auto 14px"}}/>
        <button onClick={()=>{setShowPlansPopup(true);setProfilePanelOpen(false);setDowngradeConfirm(null);setDowngradeSuccess("");setDowngradeError("");fetch(`${BASE}/credits/${user?.user_id}`).then(r=>r.ok?r.json():null).then(d=>{if(d)setCreditStatus(d);}).catch(()=>{});}} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",borderRadius:"10px",border:"none",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.7)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:"4px",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span style={{flex:1}}>{t("plans")}</span>
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
        <button onClick={()=>setBugModal(true)} style={{display:"flex",alignItems:"center",gap:"10px",width:"100%",padding:"10px 12px",borderRadius:"10px",border:"none",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.7)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:"4px",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{flex:1}}>Report a Bug</span>
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
              <div style={{fontSize:"16px",fontWeight:"800",color:"#ef4444",fontFamily:"Poppins,sans-serif"}}>Delete Account</div>
              <button onClick={()=>{setShowDeleteModal(false);setDeleteConfirm('');setDeleteError('');}} style={{width:"30px",height:"30px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:"10px",padding:"12px",marginBottom:"16px"}}>
              <div style={{fontSize:"12px",color:"rgba(239,68,68,0.9)",fontFamily:"Poppins,sans-serif",lineHeight:"1.6"}}>This will permanently delete your account, all your generated content, saved history, and credits. This action cannot be undone.</div>
            </div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontFamily:"Poppins,sans-serif",marginBottom:"8px"}}>Type <span style={{color:"#ef4444",fontWeight:"700"}}>DELETE</span> to confirm</div>
            <input value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="Type DELETE here" style={{width:"100%",padding:"10px 12px",borderRadius:"8px",border:"1px solid rgba(239,68,68,0.2)",background:"rgba(255,255,255,0.03)",color:"#fff",fontSize:"13px",fontFamily:"Poppins,sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"12px"}}/>
            <button disabled={deleteConfirm!=="DELETE"} onClick={()=>{if(deleteConfirm==="DELETE"){setDeleteError("");fetch(BASE+"/auth/delete-account",{method:"DELETE",credentials:"include"}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok){setDeleteError(d.detail||"Something went wrong. Please try again.");return;}localStorage.clear();window.location.href="/";}).catch(()=>setDeleteError("Network error. Please try again."));}}} style={{width:"100%",padding:"11px",borderRadius:"10px",border:"none",background:deleteConfirm==="DELETE"?"#ef4444":"rgba(239,68,68,0.2)",color:"#fff",fontSize:"13px",fontWeight:"700",cursor:deleteConfirm==="DELETE"?"pointer":"not-allowed",fontFamily:"Poppins,sans-serif",opacity:deleteConfirm==="DELETE"?1:0.5,transition:"all 0.2s"}}>Delete My Account Permanently</button>
            {deleteError && <div style={{marginTop:"10px",fontSize:"12px",color:"#ef4444",fontFamily:"Poppins,sans-serif",lineHeight:"1.5"}}>{deleteError}</div>}
          </div>
        </div>
      )}
      {/* APP STORE MODAL */}
      {showAppStore && (
        <div onClick={()=>setShowAppStore(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:"640px",maxHeight:"80vh",overflowY:"auto",background:"rgba(14,14,16,0.98)",backdropFilter:"blur(24px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"28px",boxShadow:"0 24px 80px rgba(0,0,0,0.9)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"22px"}}>
              <div><h2 style={{fontSize:"18px",fontWeight:"800",color:"#fff",margin:0}}>Explore Apps</h2><p style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",marginTop:"3px"}}>Add tools to your sidebar</p></div>
              <button onClick={()=>setShowAppStore(false)} style={{width:"30px",height:"30px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              {appsCatalog.map(app => {
                const added = myApps.includes(app.id);
                const isFreeUser = !isPro;
                return (
                  <div key={app.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px",display:"flex",flexDirection:"column",gap:"10px",opacity:isFreeUser?0.55:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <div style={{width:"34px",height:"34px",borderRadius:"10px",background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.8)",flexShrink:0}}>{APP_ICONS[app.icon]}</div>
                      <div style={{fontSize:"13.5px",fontWeight:"700",color:"#fff"}}>{app.label.replace("SocioMee ","")}</div>
                    </div>
                    <div style={{fontSize:"11.5px",color:"rgba(255,255,255,0.4)",lineHeight:1.5,flex:1}}>{app.desc}</div>
                    {isFreeUser ? (
                      <button onClick={()=>{setShowAppStore(false);setShowPlansPopup(true);setDowngradeConfirm(null);setDowngradeSuccess("");setDowngradeError("");}} style={{padding:"8px",borderRadius:"8px",border:"none",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.6)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>🔒 Upgrade to Pro</button>
                    ) : added ? (
                      <button onClick={()=>handleRemoveApp(app.id)} style={{padding:"8px",borderRadius:"8px",border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.08)",color:"#ef4444",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
                    ) : (
                      <button onClick={()=>handleAddApp(app.id)} style={{padding:"8px",borderRadius:"8px",border:"none",background:"rgba(255,255,255,0.9)",color:"#0a0a0a",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>+ Add</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* USAGE POPUP */}
      {showPlansPopup && (()=>{
        const isPro = plan==="pro_monthly"||plan==="pro_annual";
        const isPremium = plan==="premium_monthly"||plan==="premium_annual";
        const isAnnual = plan==="pro_annual"||plan==="premium_annual";
        const downgradePro = isAnnual ? "pro_annual" : "pro_monthly";
        const handleDowngrade = (targetPlan, label) => {
          setDowngradeConfirm({targetPlan, label});
        };
        const executeDowngrade = async () => {
          setDowngradeLoading(true);
          setDowngradeError("");
          try {
            const r = await fetch(BASE+"/auth/downgrade-plan", {method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({target_plan:downgradeConfirm.targetPlan})});
            const d = await r.json();
            if(!r.ok) throw new Error(d.detail||"Something went wrong.");
            setDowngradeSuccess(d.message||"Change scheduled.");
            setDowngradeConfirm(null);
            fetch(`${BASE}/credits/${user?.user_id}`).then(r=>r.ok?r.json():null).then(d=>{if(d)setCreditStatus(d);}).catch(()=>{});
          } catch(e) {
            setDowngradeError(e.message);
          } finally {
            setDowngradeLoading(false);
          }
        };
        return (
        <div onClick={()=>{setShowPlansPopup(false);setDowngradeConfirm(null);setDowngradeSuccess("");setDowngradeError("");}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:"400px",background:"rgba(10,8,20,0.98)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"20px",padding:"24px",boxShadow:"0 24px 80px rgba(0,0,0,0.9),0 0 60px rgba(124,58,237,0.12)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
              <div><h2 style={{fontSize:"16px",fontWeight:"800",color:"#fff",margin:0}}>Your Plan</h2><p style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",marginTop:"3px"}}>Manage your subscription</p></div>
              <button onClick={()=>{setShowPlansPopup(false);setDowngradeConfirm(null);setDowngradeSuccess("");setDowngradeError("");}} style={{width:"30px",height:"30px",borderRadius:"50%",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{background:"linear-gradient(135deg,rgba(124,58,237,0.15),rgba(255,61,143,0.08))",border:"1px solid rgba(124,58,237,0.3)",borderRadius:"16px",padding:"20px",marginBottom:"16px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.4)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px"}}>Current Plan</div>
              <div style={{fontSize:"24px",fontWeight:"900",color:"#fff",marginBottom:"4px"}}>✦ {creditStatus?.plan_label||"Free"}</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>{creditStatus?.credits_remaining||0} of {creditStatus?.monthly_limit||20} credits remaining</div>
              {creditStatus?.scheduled_downgrade_plan && (
                <div style={{marginTop:"10px",fontSize:"11px",color:"rgba(251,191,36,0.9)",fontWeight:"600",background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:"8px",padding:"6px 10px"}}>
                  ⏳ Downgrade to {creditStatus.scheduled_downgrade_plan.replace(/_/g," ").replace(/\w/g,c=>c.toUpperCase())} scheduled
                </div>
              )}
            </div>
            {downgradeSuccess && (
              <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:"12px",padding:"14px",marginBottom:"14px",fontSize:"13px",color:"#4ade80",fontWeight:"600",lineHeight:1.5}}>✓ {downgradeSuccess}</div>
            )}
            {!downgradeConfirm && !downgradeSuccess && (<>
              {plan==="free" && (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <button onClick={()=>{setShowPlansPopup(false);setTimeout(()=>openPricing("upgrade"),50);}} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px",borderRadius:"99px",background:"linear-gradient(135deg,#7c3aed,#ff3d8f)",color:"#fff",fontWeight:"800",fontSize:"14px",border:"none",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px rgba(124,58,237,0.4)"}}>✦ Upgrade to Pro — ₹499/mo</button>
                  <a href="/pricing" target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px",borderRadius:"99px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.6)",fontWeight:"700",fontSize:"14px",textDecoration:"none"}}>View All Plans</a>
                </div>
              )}
              {isPro && !creditStatus?.scheduled_downgrade_plan && (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <button onClick={()=>{setShowPlansPopup(false);setTimeout(()=>openPricing("premium"),50);}} style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px",borderRadius:"99px",background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.4)",color:"#a78bfa",fontWeight:"800",fontSize:"14px",cursor:"pointer",fontFamily:"inherit"}}>Upgrade to Premium ₹1,999/mo</button>
                  <button onClick={()=>handleDowngrade("free","Free")} style={{padding:"13px",borderRadius:"99px",background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.25)",color:"rgba(167,139,250,0.8)",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(124,58,237,0.08)"}>Cancel Subscription</button>
                </div>
              )}
              {isPremium && !creditStatus?.scheduled_downgrade_plan && (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <button onClick={()=>handleDowngrade(downgradePro,"Pro")} style={{padding:"13px",borderRadius:"99px",background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.25)",color:"#a78bfa",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(124,58,237,0.08)"}>Downgrade to Pro</button>
                  <button onClick={()=>handleDowngrade("free","Free")} style={{padding:"13px",borderRadius:"99px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",color:"rgba(239,68,68,0.75)",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,0.06)"}>Cancel Subscription</button>
                </div>
              )}
            </>)}
            {downgradeConfirm && !downgradeSuccess && (
              <div style={{background:"rgba(124,58,237,0.06)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"14px",padding:"18px"}}>
                <div style={{fontSize:"14px",fontWeight:"800",color:"#fff",marginBottom:"8px"}}>Confirm {downgradeConfirm.targetPlan==="free"?"Cancellation":"Downgrade"}</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.45)",lineHeight:1.6,marginBottom:"16px"}}>
                  {downgradeConfirm.targetPlan==="free"
                    ? "Your plan will be cancelled at the end of your current billing period. You'll keep your credits until then."
                    : `You'll be downgraded to Pro at the end of your current billing period. Your credits stay active until then.`}
                </div>
                {downgradeError && <div style={{fontSize:"12px",color:"#ef4444",marginBottom:"12px"}}>⚠ {downgradeError}</div>}
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>{setDowngradeConfirm(null);setDowngradeError("");}} style={{flex:1,padding:"11px",borderRadius:"10px",border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.5)",fontSize:"13px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>Keep Plan</button>
                  <button onClick={executeDowngrade} disabled={downgradeLoading} style={{flex:1,padding:"11px",borderRadius:"10px",border:"none",background:downgradeConfirm.targetPlan==="free"?"rgba(239,68,68,0.15)":"rgba(124,58,237,0.2)",color:downgradeConfirm.targetPlan==="free"?"#ef4444":"#a78bfa",fontSize:"13px",fontWeight:"700",cursor:downgradeLoading?"not-allowed":"pointer",fontFamily:"inherit",opacity:downgradeLoading?0.6:1}}>{downgradeLoading?"Processing...":downgradeConfirm.targetPlan==="free"?"Yes, Cancel":"Yes, Downgrade"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
        );
      })()}
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
        <div style={{ flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:"220px", right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee Notes" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeeNotes onSendToGenerator={()=>setActiveTab("generate")}/>
          </PlanGate>
        </div>
      )}
      {activeTab==="cloud" && isLoggedIn && (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:"220px", right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee Cloud" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeeCloud user={user}/>
          </PlanGate>
        </div>
      )}
      {activeTab==="calendar" && isLoggedIn && (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:"220px", right:0, bottom:0, zIndex:100 }}>
          <SocioMeeCalendar user={user}/>
        </div>
      )}
      {activeTab==="reminders" && isLoggedIn && (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:"220px", right:0, bottom:0, zIndex:100 }}>
          <SocioMeeReminders user={user}/>
        </div>
      )}
      {activeTab==="share" && isLoggedIn && (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:"220px", right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee Share" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeeShare/>
          </PlanGate>
        </div>
      )}
      {activeTab==="pixel" && isLoggedIn && (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:"220px", right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee Pixel" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeePixel user={user}/>
          </PlanGate>
        </div>
      )}
      {activeTab==="pdf" && isLoggedIn && (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", display:"flex", position:"fixed", top:0, left:"220px", right:0, bottom:0, zIndex:100 }}>
          <PlanGate plan={user?.plan||"free"} required="pro" toolName="SocioMee PDF" onUpgrade={()=>setShowPricing(true)}>
          <SocioMeePDF onSendToGenerator={(text)=>setActiveTab("generate")} user={user}/>
          </PlanGate>
        </div>
      )}
      <div id="main-content" style={{ marginLeft:"220px", flex:1, padding:"48px 32px 80px", minHeight:"100vh", overflowX:"hidden", display:(activeTab==="notes"||activeTab==="pdf"||activeTab==="pixel"||activeTab==="share"||activeTab==="cloud"||activeTab==="calendar"||activeTab==="reminders")?"none":"block" }}>
        <div style={{ maxWidth:"860px", margin:"0 auto" }}>

          <div style={{ marginBottom:"28px" }}>
            
            <a href="/" target="_blank" rel="noopener noreferrer" style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:"700", fontFamily:"'Orbitron',sans-serif", color:"#fff", letterSpacing:"3px", textTransform:"uppercase", marginBottom:"6px", textDecoration:"none", cursor:"pointer", display:"block" }}>SOCIOMEE</a>
            <p style={{ fontSize:"15px", color:"rgba(255,255,255,0.35)" }}>{t("oneTopicInfinite")}</p>
          </div>

          {!isLoggedIn && (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <h2 style={{ color:"#fff", fontFamily:"'Orbitron',sans-serif", fontSize:"22px", marginBottom:"12px" }}>{t("welcomeTitle")}</h2>
              <p style={{ color:"rgba(255,255,255,0.4)", marginBottom:"24px" }}>{t("welcomeBody")}</p>
              <a href="/login" style={{ padding:"12px 32px", borderRadius:"99px", background:"linear-gradient(135deg,#7c3aed,#ff3d8f)", color:"#fff", fontWeight:"800", textDecoration:"none", fontSize:"14px" }}>{t("logIn")}</a>
            </div>
          )}

          {activeTab==="generate" && isLoggedIn && (
            <>
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:"18px", padding:"24px", backdropFilter:"blur(16px)", marginBottom:"20px" }}>

                {/* Keyword Input */}
                <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"10px" }}>{t("keywordTopic")}</div>
                <div style={{ position:"relative", marginBottom:videoFile?"8px":"20px" }}>
                  <input value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                    placeholder={videoFile ? "Enter keyword or video title for better results..." : t("keywordPlaceholder")}
                    style={{ width:"100%", padding:"14px 92px 14px 22px", borderRadius:"99px", border:"1.5px solid rgba(124,58,237,0.25)", outline:"none", fontSize:"15px", color:"#fff", background:"rgba(255,255,255,0.05)", fontFamily:"inherit", boxSizing:"border-box", transition:"border 0.2s" }}
                    onFocus={e=>e.target.style.borderColor="#7c3aed"} onBlur={e=>e.target.style.borderColor="rgba(124,58,237,0.25)"}/>
                  <button type="button" title="Speak your keyword" onClick={()=>{
                    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                      alert("Voice input not supported in this browser. Try Chrome.");
                      return;
                    }
                    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                    const rec = new SR();
                    rec.lang = "en-IN";
                    rec.continuous = false;
                    rec.interimResults = false;
                    rec.maxAlternatives = 1;
                    rec.onstart = () => setIsListening(true);
                    rec.onend = () => setIsListening(false);
                    rec.onerror = (e) => { console.error("Speech error:", e.error); setIsListening(false); };
                    rec.onresult = (e) => {
                      const transcript = e.results[0][0].transcript.trim();
                      setKeyword(transcript);
                      setIsListening(false);
                    };
                    rec.start();
                  }} style={{ position:"absolute", right:"50px", top:"50%", transform:"translateY(-50%)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", width:"32px", height:"32px", borderRadius:"99px", background:isListening?"rgba(124,58,237,0.4)":"rgba(255,255,255,0.08)", border:"none", transition:"all 0.2s" }}>
                    {isListening
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#a78bfa" stroke="none"><circle cx="12" cy="12" r="6"><animate attributeName="r" values="6;10;6" dur="1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite"/></circle></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    }
                  </button>
                  <label title={videoFile?"Change video file":"Attach video file"} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", width:"32px", height:"32px", borderRadius:"99px", background:videoFile?"rgba(124,58,237,0.3)":"rgba(255,255,255,0.08)" }}>
                    {videoFile
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    }
                    <input type="file" accept="video/*" style={{ display:"none" }}
                      onChange={e=>{
                        const file=e.target.files[0];
                        if(!file) return;
                        if(file.size>500*1024*1024){alert("File too large. Max 500MB.");return;}
                        setVideoFile(file);
                      }}/>
                  </label>
                </div>
                {videoFile&&(
                  <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px",padding:"8px 16px",borderRadius:"99px",background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><polygon points="10,8 16,12 10,16"/></svg>
                    <span style={{ fontSize:"12px",color:"#a78bfa",fontWeight:"600",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{videoFile.name}</span>
                    <button onClick={()=>setVideoFile(null)} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:"18px",lineHeight:1,padding:"0 2px" }}>x</button>
                  </div>
                )}
                <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px" }}>
                  <button onClick={()=>setDeepResearch(r=>!r)} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"7px 14px",borderRadius:"99px",border:`1.5px solid ${deepResearch?"#a78bfa":"rgba(255,255,255,0.12)"}`,background:deepResearch?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={deepResearch?"#a78bfa":"rgba(255,255,255,0.4)"} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    <span style={{ fontSize:"12px",fontWeight:"700",color:deepResearch?"#a78bfa":"rgba(255,255,255,0.4)",letterSpacing:"0.3px" }}>Deep Research</span>
                    {deepResearch&&<span style={{ fontSize:"10px",padding:"2px 7px",borderRadius:"99px",background:"rgba(124,58,237,0.3)",color:"#c4b5fd",fontWeight:"800" }}>ON</span>}
                  </button>
                  {deepResearch&&<span style={{ fontSize:"11px",color:"rgba(255,255,255,0.35)" }}>Fetches live news, Wikipedia and trending data before generating</span>}
                </div>

                {/* Platform Grid */}
                <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"10px" }}>{t("platformLabel")}</div>
                <div className="platform-grid" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px", marginBottom:"20px" }}>
                  {PLATFORMS.map(p=>(
                    <button key={p.id} onClick={()=>setPlatform(p.id)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"4px", padding:"10px 4px", borderRadius:"16px", border:`1.5px solid ${platform===p.id?p.color:"rgba(255,255,255,0.08)"}`, background:platform===p.id?`${p.color}18`:"rgba(255,255,255,0.03)", color:platform===p.id?p.color:"rgba(255,255,255,0.5)", fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:platform===p.id?`0 0 12px ${p.color}30`:"none" }}>
                      <img src={p.img} alt={p.label} style={{ width:"20px", height:"20px", objectFit:"contain" }} onError={e=>e.target.style.display="none"}/><span className="platform-label">{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* DESKTOP: Persona Language Format in one row */}
                <div className="plf-desktop" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"20px" }}>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"8px" }}>{t("personaLabel")}</div>
                    <CustomSelect value={personality} onChange={setPersonality} label={t("selectPersona")} options={PERSONAS.map(p => ({ id:p.id, label:p.label }))}/>
                  </div>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"8px" }}>{t("language")}</div>
                    <CustomSelect value={language} onChange={setLanguage} label={t("selectLanguage")} options={[{id:"hinglish",label:t("langHinglish")},{id:"hindi",label:t("langHindi")},{id:"english",label:t("langEnglish")},{id:"marathi",label:t("langMarathi")},{id:"tamil",label:t("langTamil")},{id:"bengali",label:t("langBengali")}]}/>
                  </div>
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"8px" }}>{t("formatLabel")}</div>
                    <CustomSelect value={formatType} onChange={setFormatType} label={t("selectFormat")} options={[{id:"long",label:t("formatLong")},{id:"short",label:t("formatShort")},{id:"thread",label:t("formatThread")},{id:"reel",label:t("formatReel")}]}/>
                  </div>
                </div>

                {/* MOBILE: Persona + Language side by side, smaller font */}
                <div className="plf-mobile" style={{ display:"none", gap:"8px", marginBottom:"16px" }}>
                  <div style={{ flex:"3" }}>
                    <div style={{ fontSize:"9px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"6px" }}>{t("personaLabel")}</div>
                    <CustomSelect value={personality} onChange={setPersonality} label={t("personaLabel")} options={PERSONAS.map(p => ({ id:p.id, label:p.label }))}/>
                  </div>
                  <div style={{ flex:"2" }}>
                    <div style={{ fontSize:"9px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"6px" }}>{t("language")}</div>
                    <CustomSelect value={language} onChange={setLanguage} label="Language" options={[{id:"hinglish",label:t("langHinglish")},{id:"hindi",label:t("langHindi")},{id:"english",label:t("langEnglish")},{id:"marathi",label:t("langMarathi")},{id:"tamil",label:t("langTamil")},{id:"bengali",label:t("langBengali")}]}/>
                  </div>
                </div>

                {/* TONE - Pills desktop, Dropdown mobile */}
                <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"10px" }}>{t("toneLabel")}</div>
                <div className="tone-pills" style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"16px" }}>
                  {[
                    {id:"bold",label:t("toneBold"),emoji:"🔥"},{id:"funny",label:t("toneFunny"),emoji:"😂"},
                    {id:"emotional",label:t("toneEmotional"),emoji:"💖"},{id:"informative",label:t("toneInformative"),emoji:"📚"},
                    {id:"aggressive",label:t("toneAggressive"),emoji:"⚡"},{id:"sales",label:t("toneSales"),emoji:"💸"},
                    {id:"dramatic",label:t("toneDramatic"),emoji:"🎭"},{id:"casual",label:t("toneCasual"),emoji:"😎"},
                    {id:"motivational",label:t("toneMotivational"),emoji:"🚀"},{id:"storytelling",label:t("toneStorytelling"),emoji:"📖"},
                    {id:"educational",label:t("toneEducational"),emoji:"🎓"},{id:"trending",label:t("toneTrending"),emoji:"📈"},
                    {id:"cinematic",label:t("toneCinematic"),emoji:"🎬"},
                  ].map(tn=>(
                    <button key={tn.id} onClick={()=>setTone(tn.id)}
                      style={{ padding:"7px 14px", borderRadius:"99px", border:`1.5px solid ${tone===tn.id?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.1)"}`, background:tone===tn.id?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)", color:tone===tn.id?"#c4b5fd":"rgba(255,255,255,0.6)", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:tone===tn.id?"0 0 10px rgba(124,58,237,0.3)":"none" }}>
                      {tn.emoji} {tn.label}
                    </button>
                  ))}
                </div>
                <div className="tone-dropdown" style={{ display:"none", marginBottom:"16px", width:"100%" }}>
                  <CustomSelect centered={true} value={tone} onChange={setTone} grid={true} label={"😎 "+t("toneCasual")} options={[
                    {id:"bold",label:"🔥 "+t("toneBold")},{id:"funny",label:"😂 "+t("toneFunny")},
                    {id:"emotional",label:"💖 "+t("toneEmotional")},{id:"informative",label:"📚 "+t("toneInformative")},
                    {id:"aggressive",label:"⚡ "+t("toneAggressive")},{id:"sales",label:"💸 "+t("toneSales")},
                    {id:"dramatic",label:"🎭 "+t("toneDramatic")},{id:"casual",label:"😎 "+t("toneCasual")},
                    {id:"motivational",label:"🚀 "+t("toneMotivational")},{id:"storytelling",label:"📖 "+t("toneStorytelling")},
                    {id:"educational",label:"🎓 "+t("toneEducational")},{id:"cinematic",label:"🎬 "+t("toneCinematic")},
                  ]}/>
                </div>

                {/* FORMAT - mobile only dropdown (desktop is in PLF row) */}
                <div className="format-mobile-only" style={{ display:"none", marginBottom:"16px" }}>
                  <div style={{ fontSize:"9px", fontWeight:"800", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.3)", marginBottom:"6px" }}>{t("formatLabel")}</div>
                  <CustomSelect centered={true} value={formatType} onChange={setFormatType} grid={true} label={t("formatLong")} options={[{id:"long",label:t("formatLong")},{id:"short",label:t("formatShort")},{id:"thread",label:t("formatThread")},{id:"reel",label:t("formatReel")}]}/>
                </div>


                {/* Persona info line */}
                {selPersona && (
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"16px", fontWeight:"600" }}>
                    <span style={{ color:"#a78bfa", fontWeight:"700" }}>{selPersona.flag} {selPersona.label}</span>
                    {" · "}{language.charAt(0).toUpperCase()+language.slice(1)}{" · "+t("autoSelected")}
                  </div>
                )}

                {error && (
                  <div style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"12px 16px", marginBottom:"16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
                    <span style={{ color:"#f87171", fontSize:"13px", fontWeight:"600" }}>⚠ {error}</span>
                    {(error.toLowerCase().includes("credit") || error.toLowerCase().includes("limit")) && (
                      <a href="/pricing" style={{ padding:"9px 24px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.22)", background:"rgba(255,255,255,0.07)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", color:"#fff", fontSize:"13px", fontWeight:"500", textDecoration:"none", whiteSpace:"nowrap", fontFamily:"Poppins,sans-serif", letterSpacing:"0.04em", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.15),0 4px 16px rgba(0,0,0,0.3)", transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>✦ Pricing</a>
                    )}
                  </div>
                )}

                {/* Generate Button - Glass style */}
                <button onClick={handleSubmit} disabled={loading||!keyword.trim()}
                  className="gen-btn"
                  style={{ width:"100%", padding:"16px", borderRadius:"99px", border:"1.5px solid rgba(124,58,237,0.6)", background:loading||!keyword.trim()?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.15)", backdropFilter:"blur(16px)", color:"#fff", fontWeight:"800", fontSize:"15px", cursor:"pointer", fontFamily:"inherit", boxShadow:loading||!keyword.trim()?"none":"0 0 24px rgba(124,58,237,0.5),0 0 60px rgba(124,58,237,0.2)", transition:"all 0.3s", opacity:loading||!keyword.trim()?0.5:1, letterSpacing:"1px" }}>
                  {loading ? (
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                      <span style={{ width:"16px", height:"16px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite", display:"inline-block" }}/>
                      {platform==="youtube"?t("runningPipeline"):t("generatingContent")}
                    </span>
                  ) : t("generateContent")}
                </button>
              </div>

              {loading && (
                <div style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:"18px", padding:"32px", marginBottom:"20px", textAlign:"center" }}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"50%", border:"3px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.7s linear infinite", margin:"0 auto 16px" }}/>
                  <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"14px" }}>{platform==="youtube"?t("runningPipelineFull"):t("generatingYourContent")}</p>
                </div>
              )}

              <div ref={resultRef}>
                {result && <ResultPanel result={result} platform={platform} keyword={keyword} isPro={isPro} onUpgradeClick={()=>openPricing("upgrade")} user={user} onTitleSelect={setSelectedTitle} videoFile={videoFile} selectedTitle={selectedTitle}/>}
              </div>
            </>
          )}

          {activeTab==="youtube"    && isLoggedIn && <YouTubeDashboard user={user} initialTab={youtubeInitialTab}/>}
          {activeTab==="threads"    && isLoggedIn && <ThreadsDashboard user={user}/>}
          {activeTab==="instagram"  && isLoggedIn && <InstagramDashboard />}
          {activeTab==="facebook" && isLoggedIn && <FacebookDashboard user={user}/>}
          {activeTab==="linkedin" && isLoggedIn && <LinkedInDashboard user={user}/>}
          {activeTab==="pinterest"  && isLoggedIn && <PinterestDashboard user={user}/>}
          {activeTab==="reddit"     && isLoggedIn && <div style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:"18px",padding:"24px"}}><ComingSoonCard platform="Reddit" icon="/icons/reddit.png" color="#ff4500" message="Reddit integration coming soon. Post to subreddits and track upvotes."/></div>}
          {activeTab==="telegram" && isLoggedIn && <TelegramScheduler user={user}/>}
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

          <p style={{ textAlign:"center", marginTop:"32px" }}><a href="/terms" target="_blank" rel="noreferrer" style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", textDecoration:"none" }}>SocioMee is AI and can make mistakes. Please double-check responses.</a></p>
        </div>
      </div>

      {bugModal && (
        <div onClick={(e)=>{if(e.target===e.currentTarget){setBugModal(false);setBugText("");setBugImage(null);setBugDone(false);}}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(16px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <div style={{background:"rgba(10,8,20,0.85)",backdropFilter:"blur(24px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"28px",width:"100%",maxWidth:"460px",position:"relative",boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}}>
            <button onClick={()=>{setBugModal(false);setBugText("");setBugImage(null);setBugDone(false);}} style={{position:"absolute",top:"16px",right:"16px",background:"none",border:"none",color:"rgba(255,255,255,0.35)",fontSize:"18px",cursor:"pointer",lineHeight:1}}>✕</button>
            {bugDone ? (
              <div style={{textAlign:"center",padding:"24px 0"}}>
                <div style={{fontSize:"16px",fontWeight:"700",color:"#fff",marginBottom:"8px"}}>Bug reported</div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,0.45)"}}>We will look into it. Thanks for helping improve SocioMee.</div>
                <button onClick={()=>{setBugModal(false);setBugText("");setBugImage(null);setBugDone(false);}} style={{marginTop:"20px",padding:"10px 28px",borderRadius:"99px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Done</button>
              </div>
            ) : (
              <>
                <div style={{fontSize:"15px",fontWeight:"800",color:"#fff",marginBottom:"4px"}}>Report a Bug</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",marginBottom:"6px"}}>Tell us what went wrong. Include as many details as possible.</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.25)",marginBottom:"16px"}}>Your report will be sent to bug@sociomeeai.com</div>
                <textarea value={bugText} onChange={e=>setBugText(e.target.value)} placeholder="Please include as many details as possible..." rows={5} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"14px",color:"#fff",fontSize:"13px",fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:1.6}}/>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"12px"}}>
                  <label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",color:"rgba(255,255,255,0.35)",fontSize:"12px",fontWeight:"600"}}>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>setBugImage(ev.target.result);reader.readAsDataURL(file);}}/>
                    {bugImage ? "Screenshot attached" : "Attach screenshot"}
                  </label>
                  <button disabled={bugSending||!bugText.trim()} onClick={async()=>{setBugSending(true);try{await fetch("/api/bug/report",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:bugText,user_email:user?.email||"unknown",user_id:user?.user_id||user?.id||"unknown",screenshot:bugImage||null})});setBugDone(true);}catch(e){setBugDone(true);}setBugSending(false);}} style={{padding:"10px 22px",borderRadius:"99px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:bugText.trim()?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.25)",fontWeight:"700",fontSize:"13px",cursor:bugText.trim()?"pointer":"default",fontFamily:"inherit",backdropFilter:"blur(8px)"}}>{bugSending?"Sending...":"Submit"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
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
        .dark-scroll::-webkit-scrollbar { width: 6px; }
        .dark-scroll::-webkit-scrollbar-track { background: transparent; }
        .dark-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
        .dark-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
        .dark-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
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
