import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import YouTubeDashboard from "./YouTubeDashboard";
import ThreadsDashboard from "./ThreadsDashboard";
import InstagramDashboard from "./InstagramDashboard";
import PinterestDashboard from "./PinterestDashboard";
import LinkedInDashboard from "./LinkedInDashboard";
import RedditDashboard from "./RedditDashboard";

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
  teal:"#22d3ee",    ink:"#ede8ff",
  slate:"#c4b5fd",   muted:"#9d86c8",
  hairline:"rgba(167,139,250,0.15)",
  glass:"rgba(22,14,42,0.82)",
  inputBg:"rgba(15,8,30,0.9)",
  selectBg:"rgba(15,8,30,0.95)",
  pillBg:"rgba(255,255,255,0.06)",
  pageBg:"radial-gradient(ellipse at 20% 0%,#150d2a 0%,#0d0820 35%,#1a0515 70%,#080310 100%)",
  blobA:"radial-gradient(circle,#2d1a5055,transparent 68%)",
  blobB:"radial-gradient(circle,#2a081855,transparent 68%)",
  cardBorder:"rgba(167,139,250,0.15)",
  white:"#ede8ff",   success:"#34d399",
  warn:"#fbbf24",    danger:"#f87171",
};

let C = { ...LIGHT_THEME };

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
  {id:"linkedin",  label:"LinkedIn",  img:"/icons/linkedin.png",  color:"#0077b5"},
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
      <button onClick={analyze} disabled={loading||!file} style={{ width:"100%",marginTop:"10px",padding:"12px",borderRadius:"12px",border:"none",background:loading||!file?"rgba(124,58,237,0.3)":`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontWeight:"800",fontSize:"14px",cursor:loading||!file?"not-allowed":"pointer",fontFamily:"inherit" }}>{loading?"Analyzing…":"✦ Analyze Thumbnail"}</button>
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
  const userId = user?.user_id || "";
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
            <button onClick={handleDisconnect} style={{ fontSize:"11px",color:C.danger,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"underline",marginLeft:"auto" }}>Disconnect</button>
          </div>
          {sendMsg && <span style={{ fontSize:"12.5px",fontWeight:"600",color:sendStatus==="sent"?C.success:C.danger }}>{sendMsg}</span>}
          <div style={{ background:`${C.teal}10`, border:`1px solid ${C.teal}30`, borderRadius:"12px", padding:"12px 14px" }}>
            {!showChInput && !tgInfo?.channel_verified ? (
              <button onClick={()=>setShowChInput(true)} style={{ fontSize:"12px",fontWeight:"700",color:"#2aabee",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit" }}>📢 + Also send to my Telegram Channel</button>
            ) : tgInfo?.channel_verified ? (
              <div style={{ display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap" }}>
                <span style={{ fontSize:"12px",fontWeight:"700",color:C.success }}>📢 Channel: {tgInfo.channel} ✅</span>
                <button onClick={handleRemoveChannel} style={{ fontSize:"11px",color:C.danger,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"underline" }}>Remove</button>
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:"8px" }}>
                <p style={{ fontSize:"12px",color:C.slate,fontWeight:"600" }}>📢 Enter your channel username:</p>
                <div style={{ display:"flex",gap:"8px",flexWrap:"wrap" }}>
                  <input value={channel} onChange={e=>setChannel(e.target.value)} placeholder="@yourchannel" style={{ flex:1,minWidth:"140px",padding:"8px 12px",borderRadius:"99px",border:`1.5px solid ${C.hairline}`,background:C.glass,color:C.ink,fontSize:"13px",fontFamily:"inherit",outline:"none" }}/>
                  <button onClick={handleSaveChannel} disabled={chStatus==="saving"||!channel.trim()} style={{ padding:"8px 16px",borderRadius:"99px",border:"none",background:"#2aabee",color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"inherit" }}>{chStatus==="saving"?"Saving…":"Save"}</button>
                </div>
                {chMsg && <div style={{ fontSize:"12px",color:chStatus==="verified"?C.success:chStatus==="error"?C.danger:C.slate }}>{chMsg}</div>}
                {chStatus==="saved" && (
                  <div style={{ display:"flex",flexDirection:"column",gap:"6px" }}>
                    <p style={{ fontSize:"11.5px",color:C.muted }}>1. Add <strong>@sociomee_bot</strong> as admin<br/>2. Click Verify</p>
                    <button onClick={handleVerifyChannel} disabled={chStatus==="verifying"} style={{ alignSelf:"flex-start",padding:"8px 18px",borderRadius:"99px",border:"none",background:C.success,color:"#fff",fontWeight:"800",fontSize:"12px",cursor:"pointer",fontFamily:"inherit" }}>{chStatus==="verifying"?"Verifying…":"✓ Verify Channel"}</button>
                  </div>
                )}
              </div>
            )}
          </div>
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

      {(result.seo_description||result.youtube_description) && (
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
          <div style={{ display:"flex",flexWrap:"wrap" }}>{result.search_queries.map((q,i)=><Pill key={i} color={C.teal}>{q}</Pill>)}</div>
        </div>
      )}

      {result.seo_hashtags?.length>0&&(
        <div style={{ marginBottom:"20px" }}>
          <SectionHead icon="🔖" title="SEO Hashtags" copyText={result.seo_hashtags.join(" ")}/>
          <div style={{ display:"flex",flexWrap:"wrap" }}>{result.seo_hashtags.map((h,i)=><Pill key={i} color={C.success}>{h}</Pill>)}</div>
        </div>
      )}

      {result.research_errors?.length>0&&(
        <div style={{ background:`${C.warn}12`,border:`1px solid ${C.warn}33`,borderRadius:"12px",padding:"12px 16px",marginBottom:"16px" }}>
          <p style={{ fontSize:"10.5px",fontWeight:"800",textTransform:"uppercase",color:C.warn,marginBottom:"6px" }}>⚠ Pipeline Notes</p>
          {result.research_errors.map((e,i)=><p key={i} style={{ fontSize:"12px",color:C.slate,marginBottom:"3px" }}>→ {e}</p>)}
        </div>
      )}

      <ThumbnailStudio keyword={keyword} title={result.best_title||result.hook||keyword} isPro={isPro} onUpgradeClick={onUpgradeClick}/>
      {result.credits!==undefined&&<p style={{ textAlign:"center",fontSize:"12px",color:C.muted,fontWeight:"600",marginTop:"20px" }}>💳 {result.credits} credits remaining this month</p>}
      <TelegramSend result={result} platform={platform} user={user} />
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════
export default function App() {
  const { user, token, isLoggedIn, logout, refreshToken } = useAuth();

  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const apiFetch = useCallback(async (path, body) => {
    const headers = { "Content-Type":"application/json" };
    if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;
    const res = await fetch(`${BASE}${path}`, { method:"POST",headers,body:JSON.stringify(body) });
    if (!res.ok) {
      const t = await res.text().catch(()=>`HTTP ${res.status}`);
      let d=t; try{ d=JSON.parse(t).detail||t; } catch{}
      throw new Error(typeof d==="object"?JSON.stringify(d):d);
    }
    return res.json();
  }, []);

  // ── Dark mode ──────────────────────────────────────────────────────
  const [dark, setDark] = useState(() => localStorage.getItem("sm_theme") === "dark");
  C = dark ? { ...DARK_THEME } : { ...LIGHT_THEME };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    document.body.style.background = C.pageBg;
  }, [dark]);

  const toggleTheme = () => setDark(d => {
    const next = !d;
    localStorage.setItem("sm_theme", next ? "dark" : "light");
    return next;
  });

  const [keyword,      setKeyword    ] = useState("");
  const [platform,     setPlatform   ] = useState("youtube");
  const [tone,         setTone       ] = useState("");
  const [personality,  setPersonality] = useState("dhruvrathee");
  const [language,     setLanguage   ] = useState("hinglish");
  const [formatType,   setFormatType ] = useState("long");
  const [result,       setResult     ] = useState(null);
  const [loading,      setLoading    ] = useState(false);
  const [error,        setError      ] = useState("");
  const [creditStatus, setCreditStatus] = useState(null);
  const [showPricing,  setShowPricing] = useState(false);
  const [pricingMode,  setPricingMode] = useState("upgrade");
  const [btnHov,       setBtnHov     ] = useState(false);
  const [activeTab,    setActiveTab  ] = useState("generate");
  const resultRef = useRef(null);

  const plan  = creditStatus?.plan || user?.plan || "free";
  const isPro = plan !== "free";

  useEffect(() => {
    if (!user?.user_id) return;
    fetch(`${BASE}/credits/${user.user_id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setCreditStatus({
          plan:              d.plan              || "free",
          plan_label:        d.plan_label        || "Free",
          credits_remaining: d.credits_remaining !== undefined ? d.credits_remaining : d.credits !== undefined ? d.credits : d.credits_left !== undefined ? d.credits_left : 20,
          credits:           d.credits_remaining ?? d.credits ?? d.credits_left ?? 20,
          monthly_limit:     d.monthly_limit !== undefined ? (d.monthly_limit===30?20:d.monthly_limit) : d.daily_limit !== undefined ? (d.daily_limit===30?20:d.daily_limit) : 20,
          next_reset:        d.next_reset || d.resets_at || "",
        });
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const p = PERSONAS.find(p => p.id === personality);
    if (p) setLanguage(p.lang);
  }, [personality]);

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
    const currentCredits = creditStatus?.credits_remaining ?? creditStatus?.credits_left ?? creditStatus?.credits ?? 20;
    if (Number(currentCredits) <= 0) { openPricing("nocredits"); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      let data;
      if (platform === "youtube") {
        try { data = await apiFetch("/generate-full-content", { topic:keyword.trim(),persona:personality,language,country:"in",platform }); }
        catch { data = await apiFetch("/generate-platform-content", { topic:keyword.trim(),platform,tone,personality,format_type:formatType,language }); }
      } else {
        data = await apiFetch("/generate-platform-content", { topic:keyword.trim(),platform,tone,personality,format_type:formatType,language });
      }
      if (data?.credit_status) setCreditStatus(data.credit_status);
      else if (data?.credits !== undefined) setCreditStatus(prev => prev ? {...prev,credits_remaining:data.credits,credits:data.credits} : null);
      if (user?.user_id) {
        fetch(`${BASE}/credits/${user.user_id}`).then(r=>r.ok?r.json():null).then(d=>{
          if(!d) return;
          setCreditStatus({ plan:d.plan||"free", plan_label:d.plan_label||"Free", credits_remaining:d.credits_remaining??d.credits??d.credits_left??20, credits:d.credits_remaining??d.credits??d.credits_left??20, monthly_limit:(d.monthly_limit??d.daily_limit??20)===30?20:(d.monthly_limit??d.daily_limit??20), next_reset:d.next_reset||d.resets_at||"" });
        }).catch(()=>{});
      }
      if (data?.error && data?.credits <= 0) { openPricing("nocredits"); setLoading(false); return; }
      if (data?.error) { setError(data.error); setLoading(false); return; }
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth",block:"start" }), 120);
    } catch(e) {
      setError(e.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [keyword, platform, tone, personality, language, formatType, apiFetch, creditStatus, user]);

  const selPersona = PERSONAS.find(p => p.id === personality);
  const toggleTab = (tab) => setActiveTab(t => t === tab ? "generate" : tab);

  return (
    <div style={{ minHeight:"100vh",background:C.pageBg,display:"flex",justifyContent:"center",alignItems:"flex-start",fontFamily:"'DM Sans','Syne',sans-serif",padding:"52px 16px 120px",position:"relative",overflow:"hidden",transition:"background 0.3s ease,color 0.3s ease",color:C.ink }}>

      <div style={{ position:"fixed",top:"-160px",right:"-120px",width:"520px",height:"520px",borderRadius:"50%",background:C.blobA,pointerEvents:"none",zIndex:0,animation:"floatA 11s ease-in-out infinite",transition:"background 0.3s" }}/>
      <div style={{ position:"fixed",bottom:"-80px",left:"-80px",width:"420px",height:"420px",borderRadius:"50%",background:C.blobB,pointerEvents:"none",zIndex:0,animation:"floatB 13s ease-in-out infinite",transition:"background 0.3s" }}/>

      <div style={{ width:"100%",maxWidth:"580px",position:"relative",zIndex:1 }}>

        {/* Brand */}
        <div style={{ marginBottom:"28px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px" }}>
            <div style={{ display:"inline-flex",alignItems:"center",gap:"8px",background:`linear-gradient(135deg,${C.rose},${C.purple})`,color:"#fff",fontSize:"10px",fontWeight:"900",letterSpacing:"2.5px",textTransform:"uppercase",padding:"5px 14px",borderRadius:"99px" }}>✦ AI Content Studio</div>
            <button onClick={toggleTheme} title={dark?"Switch to Light":"Switch to Dark"} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"5px 10px 5px 6px",borderRadius:"99px",border:`1.5px solid ${dark?"rgba(167,139,250,0.3)":C.hairline}`,background:dark?"rgba(30,20,55,0.85)":"rgba(255,255,255,0.85)",cursor:"pointer",fontFamily:"inherit",backdropFilter:"blur(10px)",transition:"all 0.25s ease",boxShadow:dark?"0 0 14px rgba(167,139,250,0.25)":"0 2px 8px rgba(0,0,0,0.08)" }}>
              <div style={{ position:"relative",width:"40px",height:"22px",borderRadius:"99px",background:dark?"linear-gradient(135deg,#7c3aed,#a78bfa)":"rgba(200,190,220,0.5)",transition:"background 0.3s ease",flexShrink:0 }}>
                <div style={{ position:"absolute",top:"3px",left:dark?"20px":"3px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.25)",transition:"left 0.25s ease",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",lineHeight:1 }}>
                  {dark ? "🌙" : "☀️"}
                </div>
              </div>
              <span style={{ fontSize:"11px",fontWeight:"800",color:dark?C.slate:"#8b6b9a",letterSpacing:"0.3px",userSelect:"none" }}>{dark?"Dark":"Light"}</span>
            </button>
          </div>
          <h1 style={{ fontSize:"clamp(34px,8vw,52px)",fontWeight:"900",color:C.ink,lineHeight:1.0,letterSpacing:"-2px",marginBottom:"8px",fontFamily:"'Syne',sans-serif",transition:"color 0.3s" }}>SocioMee<span style={{ color:C.rose }}>.</span></h1>
          <p style={{ fontSize:"14px",color:C.muted,lineHeight:1.6,transition:"color 0.3s" }}>Transform any topic into a complete content pack — scripts, SEO, and metadata for every platform.</p>
        </div>

        {/* User header */}
        {isLoggedIn && user && (
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:C.glass,backdropFilter:"blur(12px)",border:`1px solid ${C.hairline}`,borderRadius:"14px",padding:"10px 16px",marginBottom:"14px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"10px" }}>
              {user.picture
                ? <img src={user.picture} alt="" referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width:"32px",height:"32px",borderRadius:"50%",border:`2px solid ${C.purple}33`,objectFit:"cover" }} onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}/>
                : null
              }
              <div style={{ width:"32px",height:"32px",borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.rose})`,display:user.picture?"none":"flex",alignItems:"center",justifyContent:"center",color:C.white,fontSize:"14px",fontWeight:"800",flexShrink:0 }}>{(user.name||user.email||"U").charAt(0).toUpperCase()}</div>
              <div>
                <p style={{ fontSize:"13px",fontWeight:"700",color:C.ink,lineHeight:1.2 }}>{user.name||user.email}</p>
                <p style={{ fontSize:"10.5px",color:C.muted }}>{user.email}</p>
              </div>
            </div>
            <div style={{ display:"flex",gap:"4px",alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"55vw" }}>

              {/* YouTube tab */}
              <button onClick={() => toggleTab("youtube")} style={{ padding:"5px 10px",borderRadius:"99px",border:`1.5px solid ${activeTab==="youtube"?"#ff0000":C.hairline}`,background:activeTab==="youtube"?"#ff000012":"rgba(255,255,255,0.7)",color:activeTab==="youtube"?"#ff0000":C.muted,fontSize:"11px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"4px",transition:"all 0.15s" }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill={activeTab==="youtube"?"#ff0000":C.muted}>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YT
              </button>

              {/* Threads tab */}
              <button onClick={() => toggleTab("threads")} style={{ padding:"5px 10px",borderRadius:"99px",border:`1.5px solid ${activeTab==="threads"?"#000":C.hairline}`,background:activeTab==="threads"?"rgba(0,0,0,0.08)":"rgba(255,255,255,0.7)",color:activeTab==="threads"?C.ink:C.muted,fontSize:"11px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"4px",transition:"all 0.15s" }}>
                <svg viewBox="0 0 192 192" width="12" height="12" fill={activeTab==="threads"?C.ink:C.muted}>
                  <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.452-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.206 17.11 97.015 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.101 0h-.186C68.841.195 47.238 9.636 32.899 28.047 20.17 44.346 13.643 67.352 13.404 96v.004c.239 28.648 6.766 51.664 19.495 68.047C47.238 182.364 68.841 191.805 96.915 192h.186c24.692-.187 42.038-6.61 56.328-20.868 18.806-18.777 18.274-42.922 12.078-57.564-4.451-10.376-13.031-18.752-23.97-23.58z"/>
                </svg>
                Threads
              </button>

              {/* Instagram tab */}
              <button onClick={() => toggleTab("instagram")} style={{ padding:"5px 10px",borderRadius:"99px",border:`1.5px solid ${activeTab==="instagram"?"#e1306c":C.hairline}`,background:activeTab==="instagram"?"rgba(225,48,108,0.1)":"rgba(255,255,255,0.7)",color:activeTab==="instagram"?"#e1306c":C.muted,fontSize:"11px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"4px",transition:"all 0.15s" }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={activeTab==="instagram"?"#e1306c":C.muted} strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="5"/>
                  <circle cx="17.5" cy="6.5" r="1" fill={activeTab==="instagram"?"#e1306c":C.muted} stroke="none"/>
                </svg>
                IG
              </button>

              {/* Pinterest tab */}
              <button onClick={() => toggleTab("pinterest")} style={{ padding:"5px 10px",borderRadius:"99px",border:`1.5px solid ${activeTab==="pinterest"?"#e60023":C.hairline}`,background:activeTab==="pinterest"?"rgba(230,0,35,0.1)":"rgba(255,255,255,0.7)",color:activeTab==="pinterest"?"#e60023":C.muted,fontSize:"11px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"4px",transition:"all 0.15s" }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill={activeTab==="pinterest"?"#e60023":C.muted}>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
                Pin
              </button>

              {/* LinkedIn tab */}
              <button onClick={() => toggleTab("linkedin")} style={{ padding:"5px 10px",borderRadius:"99px",border:`1.5px solid ${activeTab==="linkedin"?"#0077b5":C.hairline}`,background:activeTab==="linkedin"?"rgba(0,119,181,0.1)":"rgba(255,255,255,0.7)",color:activeTab==="linkedin"?"#0077b5":C.muted,fontSize:"11px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"4px",transition:"all 0.15s" }}>
                <img src="/icons/linkedin.png" alt="LI" style={{width:12,height:12,objectFit:"contain"}} />
                LI
              </button>

              {!isPro && <button onClick={()=>openPricing("upgrade")} style={{ padding:"5px 10px",borderRadius:"99px",border:"none",background:`linear-gradient(135deg,${C.purple},${C.rose})`,color:C.white,fontSize:"11px",fontWeight:"800",cursor:"pointer",fontFamily:"inherit" }}>✦ Pro</button>}
              <button onClick={logout} style={{ padding:"5px 10px",borderRadius:"99px",border:`1px solid ${C.hairline}`,background:"rgba(255,255,255,0.7)",color:C.muted,fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit" }}>Out</button>
            </div>
          </div>
        )}

        {/* Credit badge */}
        <CreditBadge creditStatus={creditStatus} onUpgradeClick={()=>openPricing("upgrade")}/>

        {/* ── YouTube Tab ── */}
        {activeTab === "youtube" && isLoggedIn && (
          <Card style={{ marginBottom:"20px" }}>
            <YouTubeDashboard user={user} topic={keyword} />
          </Card>
        )}

        {/* ── Threads Tab ── */}
        {activeTab === "threads" && isLoggedIn && (
          <Card style={{ marginBottom:"20px" }}>
            <ThreadsDashboard user={user} topic={keyword} />
          </Card>
        )}

        {/* ── Instagram Tab ── */}
        {activeTab === "instagram" && isLoggedIn && (
          <Card style={{ marginBottom:"20px" }}>
            <InstagramDashboard user={user} topic={keyword} />
          </Card>
        )}

        {/* ── Pinterest Tab ── */}
        {activeTab === "pinterest" && isLoggedIn && (
          <Card style={{ marginBottom:"20px" }}>
            <PinterestDashboard user={user} topic={keyword} />
          </Card>
        )}

        {/* ── Reddit Tab ── */}
        {activeTab === "reddit" && isLoggedIn && (
          <Card style={{ marginBottom:"20px" }}>
            <RedditDashboard user={user} topic={keyword} />
          </Card>
        )}

        {/* ── LinkedIn Tab ── */}
        {activeTab === "linkedin" && isLoggedIn && (
          <Card style={{ marginBottom:"20px" }}>
            <LinkedInDashboard user={user} topic={keyword} />
          </Card>
        )}

        {/* ── Content Generator Tab ── */}
        {activeTab === "generate" && (
          <>
            <Card>
              <div style={{ marginBottom:"18px" }}>
                <label style={{ fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:"7px",display:"block" }}>Keyword / Topic</label>
                <input
                  placeholder="e.g. skincare routine, crypto scam, fake influencers…"
                  value={keyword} onChange={e=>setKeyword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                  style={{ width:"100%",padding:"13px 16px",borderRadius:"12px",border:`1.5px solid ${C.hairline}`,outline:"none",fontSize:"14px",fontWeight:"500",color:C.ink,background:C.inputBg,backdropFilter:"blur(8px)",boxSizing:"border-box",fontFamily:"inherit",transition:"border 0.2s,box-shadow 0.2s" }}
                  onFocus={e=>{ e.target.style.border=`1.5px solid ${C.purple}`; e.target.style.boxShadow=`0 0 0 3px ${C.purple}18`; }}
                  onBlur={e =>{ e.target.style.border=`1.5px solid ${C.hairline}`; e.target.style.boxShadow="none"; }}
                />
              </div>

              <div style={{ marginBottom:"18px" }}>
                <label style={{ fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:"9px",display:"block" }}>Platform</label>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px" }}>
                  {PLATFORMS.map(p => (
                    <button key={p.id} onClick={()=>setPlatform(p.id)} style={{ padding:"9px 4px",borderRadius:"10px",border:`1.5px solid ${platform===p.id?p.color:p.color+"55"}`,background:platform===p.id?p.color+"16":p.color+"08",boxShadow:platform===p.id?`0 0 12px ${p.color}66`:`0 0 6px ${p.color}33`,color:platform===p.id?p.color:C.muted,fontWeight:"700",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:"4px" }}>
                      <img src={p.img} alt={p.label} style={{ width:"22px",height:"22px",objectFit:"contain",filter:platform===p.id?"none":"grayscale(40%) opacity(0.7)",transition:"all 0.15s" }} onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="block"; }}/>
                      <span style={{ display:"none",fontSize:"14px" }}>{p.label.charAt(0)}</span>
                      <span style={{ fontSize:"10px" }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"18px" }}>
                {[
                  { label:"Persona", value:personality, onChange:setPersonality, options:PERSONAS.map(p=>({ value:p.id,label:`${p.flag} ${p.label}` })) },
                  { label:"Format",  value:formatType,  onChange:setFormatType,  options:[{ value:"long",label:"Long Form" },{ value:"short",label:"Short Form" }] },
                ].map(({ label,value,onChange,options }) => (
                  <div key={label}>
                    <label style={{ fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:"7px",display:"block" }}>{label}</label>
                    <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:"100%",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${C.hairline}`,outline:"none",fontSize:"13px",fontWeight:"600",color:C.ink,background:C.selectBg,cursor:"pointer",boxSizing:"border-box",appearance:"none",fontFamily:"inherit",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237c3aed'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",backgroundSize:"18px" }}>
                      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {selPersona && (
                <div style={{ display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px",fontSize:"11.5px",color:C.muted,background:"rgba(124,58,237,0.06)",borderRadius:"8px",padding:"7px 12px" }}>
                  <span>{selPersona.flag}</span>
                  <span><strong style={{ color:C.slate }}>{selPersona.label}</strong> · {language==="hinglish"?"Hinglish":"English"} · Auto-selected</span>
                </div>
              )}

              <div style={{ marginBottom:"20px" }}>
                <label style={{ fontSize:"10.5px",fontWeight:"800",letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:"9px",display:"block" }}>Tone</label>
                <div style={{ display:"flex",gap:"8px",flexWrap:"wrap" }}>
                  {TONES.map(({ id,emoji,color }) => (
                    <button key={id} onClick={()=>setTone(id)} style={{ padding:"8px 15px",borderRadius:"99px",border:`1.5px solid ${tone===id?color:C.hairline}`,background:tone===id?color+"18":C.pillBg,color:tone===id?color:C.muted,fontWeight:"700",fontSize:"12.5px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}>
                      {emoji} {id.charAt(0).toUpperCase()+id.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div style={{ background:C.danger+"20",border:`1px solid ${C.danger}44`,borderRadius:"12px",padding:"12px 16px",color:C.danger,fontSize:"13px",fontWeight:"600",marginBottom:"14px" }}>⚠ {error}</div>}

              <button onClick={handleSubmit} disabled={loading} onMouseEnter={()=>setBtnHov(true)} onMouseLeave={()=>setBtnHov(false)}
                style={{ width:"100%",padding:"15px",borderRadius:"14px",border:"none",background:`linear-gradient(135deg,${C.rose},${C.purple})`,color:C.white,fontWeight:"800",fontSize:"15px",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:btnHov&&!loading?`0 18px 40px ${C.rose}55`:`0 10px 28px ${C.rose}44`,transform:btnHov&&!loading?"translateY(-2px)":"none",opacity:loading?0.75:1,transition:"all 0.15s" }}>
                {loading?"Generating…":"✦ Generate Content"}
              </button>

              {platform==="youtube" && (
                <div style={{ marginTop:"12px",display:"flex",alignItems:"center",gap:"8px",background:`${C.purple}10`,border:`1px solid ${C.purple}25`,borderRadius:"10px",padding:"9px 14px" }}>
                  <span style={{ fontSize:"13px" }}>🔬</span>
                  <div>
                    <span style={{ fontSize:"11.5px",fontWeight:"700",color:C.purple }}>Full AI Pipeline · 6 Engines</span>
                    <p style={{ fontSize:"10.5px",color:C.muted,marginTop:"1px" }}>GNews → DeepSeek → Gemma{!isPro?" · 500-word preview on Free":" · Full 3000-word script"}</p>
                  </div>
                </div>
              )}
            </Card>

            {loading && <Card style={{ marginTop:"20px" }}><Spinner label={platform==="youtube"?"Running 6-engine pipeline…":"Generating content…"}/></Card>}

            <div ref={resultRef}>
              <ResultPanel result={result} platform={platform} keyword={keyword} isPro={isPro} onUpgradeClick={()=>openPricing("upgrade")} user={user}/>
            </div>
          </>
        )}

        <p style={{ textAlign:"center",color:C.muted,fontSize:"11.5px",marginTop:"32px" }}>SocioMee · AI Content Studio · Built with 💜</p>
      </div>

      {showPricing && (
        <PricingPopup
          mode={pricingMode}
          userId={user?.user_id||localStorage.getItem("sociomee_user_id")||"default_user"}
          email={user?.email  ||localStorage.getItem("sociomee_email")  ||""}
          onClose={()=>setShowPricing(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;transition:background-color 0.25s ease,border-color 0.25s ease,color 0.2s ease}
        select option{background:${dark?"#1a0f35":"#ffffff"};color:${dark?"#ede8ff":"#0d0015"}}
        input::placeholder{color:${dark?"rgba(157,134,200,0.6)":"rgba(139,107,154,0.6)"}}
        @keyframes floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
        @keyframes floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(16px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${dark?"rgba(167,139,250,0.35)":"rgba(124,58,237,0.3)"};border-radius:99px}
      `}</style>
    </div>
  );
}