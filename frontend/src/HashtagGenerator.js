/* eslint-disable */
import React, { useState, useRef } from "react";

const BASE = "https://sociomee.in/api";
const UI_LANG = () => localStorage.getItem("sociomee_lang") || "en";
const ht = (hi, mr, ta, bn, en) => {
  const l = UI_LANG();
  return l==="hi"?hi:l==="mr"?mr:l==="ta"?ta:l==="bn"?bn:en;
};

const BLOCKED_KEYWORDS = ["sex","porn","nude","naked","xxx","adult","erotic","rape","murder","kill","suicide","bomb","terror","drug","cocaine","heroin","weed","meth","hack","weapon","gore","trafficking","prostitute","onlyfans","fuck","shit","bitch","ass","bastard","सेक्स","पोर्न","नग्न","बलात्कार","हत्या","आत्महत्या","बम","ड्रग","वेश्या","যৌন","পর্ন","ধর্ষণ","হত্যা","আত্মহত্যা","செக்ஸ்","கொலை","தற்கொலை","సెక్స్","హత్య"];

const isBlocked = (kw) => BLOCKED_KEYWORDS.some(w => kw.toLowerCase().includes(w.toLowerCase()));

const PLATFORMS = [
  { id:"instagram", label:"Instagram", img:"/icons/instagram.png" },
  { id:"youtube",   label:"YouTube",   img:"/icons/youtube.png"   },
  { id:"twitter",   label:"X/Twitter", img:"/icons/x.png"         },
  { id:"linkedin",  label:"LinkedIn",  img:"/icons/linkedin.png" },
];

const BTN = {
  active: {
    padding:"9px 14px", borderRadius:"99px", cursor:"pointer",
    fontFamily:"inherit", fontWeight:"700", fontSize:"12px",
    border:"1.5px solid rgba(124,58,237,0.8)",
    background:"rgba(124,58,237,0.15)", backdropFilter:"blur(16px)",
    color:"#fff", boxShadow:"0 0 20px rgba(124,58,237,0.7),0 0 40px rgba(124,58,237,0.3)",
    transition:"all 0.3s", display:"flex", alignItems:"center",
    justifyContent:"center", width:"100%",
  },
  inactive: {
    padding:"9px 14px", borderRadius:"99px", cursor:"pointer",
    fontFamily:"inherit", fontWeight:"600", fontSize:"12px",
    border:"1.5px solid rgba(124,58,237,0.2)",
    background:"rgba(255,255,255,0.04)", backdropFilter:"blur(16px)",
    color:"rgba(255,255,255,0.5)", transition:"all 0.3s",
    display:"flex", alignItems:"center", justifyContent:"center", width:"100%",
  },
};

export default function HashtagGenerator({ user }) {
  const [keyword,   setKeyword  ] = useState("");
  const [platform,  setPlatform ] = useState("instagram");
  const [hashtags,  setHashtags ] = useState([]);
  const [loading,   setLoading  ] = useState(false);
  const [error,     setError    ] = useState("");
  const [copied,    setCopied   ] = useState(false);
  const [copiedTag, setCopiedTag] = useState("");

  const generate = async () => {
    if (!keyword.trim()) { setError("Enter a keyword first."); return; }
    if (isBlocked(keyword)) { setError("⚠ This keyword violates our content policy."); return; }
    setLoading(true); setError(""); setHashtags([]);
    try {
      const res = await fetch(`${BASE}/hashtags/generate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ keyword: keyword.trim(), platform })
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail||"Failed"); }
      const data = await res.json();
      setHashtags(data.hashtags || []);
    } catch(e) { setError(e.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(hashtags.map(h=>h.startsWith("#")?h:`#${h}`).join(" "));
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  const copyOne = tag => {
    navigator.clipboard.writeText(tag.startsWith("#")?tag:`#${tag}`);
    setCopiedTag(tag); setTimeout(()=>setCopiedTag(""),1500);
  };

  const hairline = "rgba(167,139,250,0.15)";

  return (
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif"}}>

      {/* Header */}
      <div style={{marginBottom:"24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1.5px solid rgba(124,58,237,0.45)",borderRadius:"99px",padding:"6px 16px",marginBottom:"10px",boxShadow:"0 0 16px rgba(124,58,237,0.2)"}}>
          <span>🏷️</span>
          <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"2px",textTransform:"uppercase",color:"#a78bfa"}}>{ht("हैशटैग जनरेटर","हॅशटॅग जनरेटर","ஹேஷ்டேக் ஜெனரேட்டர்","হ্যাশট্যাগ জেনারেটর","Hashtag Generator")}</span>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:"700",color:"#fff",fontFamily:"'Orbitron',sans-serif",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>{ht("हैशटैग्स","हॅशटॅग्स","ஹேஷ்டேக்கள்","হ্যাশট্যাগ","HASHTAGS")}</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>{ht("अपना टॉपिक डालें | रियल ट्रेंडिंग हैशटैग पाएं","तुमचा विषय टाका | रियल ट्रेंडिंग हॅशटॅग मिळवा","உங்கள் தலைப்பை உள்ளிடுங்கள் | ரியல் டிரெண்டிங் ஹேஷ்டேக்கள் பெறுங்கள்","আপনার বিষয় লিখুন | রিয়েল ট্রেন্ডিং হ্যাশট্যাগ পান","Enter your topic | get real trending hashtags scraped live for your platform.")}</p>
      </div>

      {/* Platform */}
      <div style={{marginBottom:"18px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"10px"}}>{ht("प्लेटफ़ॉर्म","प्लॅटफॉर्म","தளம்","প্ল্যাটফর্ম","PLATFORM")}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}} className="platform-grid-ht">
          {PLATFORMS.map(p=>(
            <button key={p.id} onClick={()=>setPlatform(p.id)}
              style={{...(platform===p.id ? BTN.active : BTN.inactive), display:"flex", alignItems:"center", gap:"7px"}}>
              <img src={p.img} alt={p.label} style={{width:"16px",height:"16px",objectFit:"contain",filter:platform===p.id?"none":"grayscale(30%) opacity(0.7)"}}/>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{ht("कीवर्ड / टॉपिक","कीवर्ड / विषय","முக்கியச் சொல் / தலைப்பு","কীওয়ার্ড / বিষয়","KEYWORD / TOPIC")}</div>
        <div style={{display:"flex",gap:"8px",flexWrap:"nowrap"}}>
          <input value={keyword} onChange={e=>{setKeyword(e.target.value);setError("");}}
            onKeyDown={e=>e.key==="Enter"&&generate()}
            placeholder="e.g. reels, cricket, skincare..."
            style={{flex:1,minWidth:0,padding:"11px 16px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.25)",outline:"none",fontSize:"13px",fontWeight:"500",color:"#fff",background:"rgba(255,255,255,0.05)",backdropFilter:"blur(8px)",fontFamily:"inherit",transition:"border 0.2s,box-shadow 0.2s",boxSizing:"border-box"}}
            onFocus={e=>{e.target.style.border="1.5px solid #7c3aed";e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.12)";}}
            onBlur={e=>{e.target.style.border="1.5px solid rgba(124,58,237,0.25)";e.target.style.boxShadow="none";}}
          />
          <button onClick={generate} disabled={loading||!keyword.trim()}
            className="glow-btn"
            style={{padding:"11px 16px",borderRadius:"99px",border:`1.5px solid ${loading||!keyword.trim()?"rgba(124,58,237,0.2)":"rgba(124,58,237,0.6)"}`,background:loading||!keyword.trim()?"rgba(124,58,237,0.08)":"rgba(124,58,237,0.12)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"13px",cursor:loading||!keyword.trim()?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading||!keyword.trim()?"none":"0 0 16px rgba(124,58,237,0.4)",transition:"all 0.3s",whiteSpace:"nowrap",flexShrink:0}}>
            {loading?(
              <span style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{width:"14px",height:"14px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>
                Fetching…
              </span>
            ):ht("✦ जनरेट करें","✦ तयार करा","✦ உருவாக்கு","✦ তৈরি করুন","✦ Generate")}
          </button>
        </div>
      </div>

      {error&&<div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"12px",padding:"12px 16px",marginBottom:"14px",color:"#f87171",fontSize:"13px",fontWeight:"600"}}>⚠ {error}</div>}

      {/* Results */}
      {hashtags.length > 0 && (
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)"}}>
                {hashtags.length} HASHTAGS
              </span>
              <span style={{fontSize:"10px",background:"rgba(52,211,153,0.15)",color:"#34d399",padding:"3px 10px",borderRadius:"99px",fontWeight:"700",border:"1px solid rgba(52,211,153,0.3)"}}>● Live Trending</span>
            </div>
            <button onClick={copyAll}
              style={{padding:"8px 20px",borderRadius:"99px",border:`1.5px solid ${copied?"rgba(52,211,153,0.4)":"rgba(124,58,237,0.5)"}`,background:copied?"rgba(52,211,153,0.1)":"rgba(124,58,237,0.1)",backdropFilter:"blur(16px)",color:copied?"#34d399":"#fff",fontWeight:"700",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",boxShadow:copied?"none":"0 0 14px rgba(124,58,237,0.35)",transition:"all 0.3s"}}>
              {copied?ht("✓ कॉपी हो गया!","✓ कॉपी झाले!","✓ நகலெடுக்கப்பட்டது!","✓ কপি হয়েছে!","✓ Copied All!"):ht("📋 सब कॉपी करें","📋 सर्व कॉपी करा","📋 அனைத்தையும் நகலெடு","📋 সব কপি করুন","📋 Copy All")}
            </button>
          </div>

          {/* Pills */}
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"20px"}}>
            {hashtags.map((tag,i)=>{
              const h = tag.startsWith("#")?tag:`#${tag}`;
              const isCopied = copiedTag===tag;
              return (
                <button key={i} onClick={()=>copyOne(tag)} title="Click to copy"
                  style={{padding:"8px 16px",borderRadius:"99px",border:`1.5px solid ${isCopied?"rgba(52,211,153,0.5)":"rgba(124,58,237,0.35)"}`,background:isCopied?"rgba(52,211,153,0.12)":"rgba(124,58,237,0.08)",color:isCopied?"#34d399":"#c4b5fd",fontWeight:"600",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                  onMouseEnter={e=>{if(!isCopied){e.currentTarget.style.background="rgba(124,58,237,0.2)";e.currentTarget.style.boxShadow="0 0 12px rgba(124,58,237,0.3)";}}}
                  onMouseLeave={e=>{if(!isCopied){e.currentTarget.style.background="rgba(124,58,237,0.08)";e.currentTarget.style.boxShadow="none";}}}>
                  {isCopied?"✓ ":""}{h}
                </button>
              );
            })}
          </div>

          {/* Ready to paste */}
          <div style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"16px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.25)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>{ht("पेस्ट करने के लिए तैयार","पेस्ट करण्यासाठी तयार","பேஸ்ட் செய்ய தயார்","পেস্ট করার জন্য প্রস্তুত","READY TO PASTE")}</div>
            <p style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",lineHeight:"1.8",wordBreak:"break-word"}}>
              {hashtags.map(h=>h.startsWith("#")?h:`#${h}`).join(" ")}
            </p>
          </div>
        </div>
      )}

      <style>{`
  @keyframes spin{to{transform:rotate(360deg)}}
  .glow-btn:hover:not(:disabled){
    background:rgba(124,58,237,0.2) !important;
    border-color:rgba(124,58,237,1) !important;
    box-shadow:0 0 28px rgba(124,58,237,0.8),0 0 60px rgba(124,58,237,0.4) !important;
    transform:translateY(-2px) !important;
  }
`}</style>
    </div>
  );
}
