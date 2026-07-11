/* eslint-disable */
import React, { useState } from "react";

const BASE = "https://sociomeeai.com/api";

const BLOCKED_KEYWORDS = [
  // English
  "porn","sex","nude","naked","xxx","rape","kill","murder","suicide","bomb","drug","weed","cocaine","hack","terror","isis","racist","nigger","fuck","shit","bitch","ass","bastard",
  // Hindi
  "chut","lund","gaand","bhosda","madarchod","behenchod","randi","harami","sala","kamina","chudai","sexy","nangi","nanga",
  // Marathi
  "zavla","ghanta","zadpa","maila",
  // Tamil
  "oombu","sunni","punda","otha",
  // Bengali
  "choda","magi","baal","shala",
];

const isBlocked = (text) => {
  const lower = text.toLowerCase();
  return BLOCKED_KEYWORDS.some(w => lower.includes(w));
};
const UI_LANG = () => localStorage.getItem("sociomee_lang") || "en";
const ht = (hi, mr, ta, bn, en) => {
  const l = UI_LANG();
  return l==="hi"?hi:l==="mr"?mr:l==="ta"?ta:l==="bn"?bn:en;
};

const TONES = [
  { id:"curiosity", label:ht("जिज्ञासा","जिज्ञासा","ஆர்வம்","কৌতূহল","Curiosity") },
  { id:"shock",     label:ht("शॉक","शॉक","அதிர்ச்சி","শক","Shock") },
  { id:"pov",       label:"POV" },
  { id:"number",    label:ht("नंबर","नंबर","எண்கள்","সংখ্যা","Numbers") },
  { id:"story",     label:ht("कहानी","कथा","கதை","গল্প","Story") },
  { id:"question",  label:ht("सवाल","प्रश्न","கேள்வி","প্রশ্ন","Question") },
  { id:"hinglish",  label:"Hinglish" },
];

const PLATFORMS = [
  { id:"youtube",   label:"YouTube"   },
  { id:"instagram", label:"Instagram" },
  { id:"linkedin",  label:"LinkedIn"  },
];

const LANGS = [
  { id:"hinglish", label:"Hinglish" },
  { id:"english",  label:"English"  },
];

export default function HookGenerator({ user }) {
  const [topic,    setTopic   ] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [tone,     setTone    ] = useState("curiosity");
  const [language, setLanguage] = useState("hinglish");
  const [hooks,    setHooks   ] = useState([]);
  const [loading,  setLoading ] = useState(false);
  const [error,    setError   ] = useState("");
  const [copied,   setCopied  ] = useState("");

  const generate = async () => {
    if (!topic.trim()) { setError(ht("टॉपिक डालें","विषय टाका","தலைப்பை உள்ளிடுங்கள்","বিষয় লিখুন","Enter a topic first")); return; }
    if (isBlocked(topic)) { setError(ht("यह टॉपिक अनुमति नहीं है","हा विषय परवानगी नाही","இந்த தலைப்பு அனுமதிக்கப்படவில்லை","এই বিষয়টি অনুমোদিত নয়","This topic is not allowed")); return; }
    setLoading(true); setError(""); setHooks([]);
    try {
      const res = await fetch(`${BASE}/hooks/generate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ topic:topic.trim(), platform, tone, language })
      });
      if (!res.ok) throw new Error("Failed to generate hooks");
      const data = await res.json();
      setHooks(data.hooks || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const copyHook = (hook) => {
    navigator.clipboard.writeText(hook);
    setCopied(hook);
    setTimeout(() => setCopied(""), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(hooks.join("\n\n"));
    setCopied("all");
    setTimeout(() => setCopied(""), 2000);
  };

  const P = "#7c3aed", R = "#ff3d8f";
  const hairline = "rgba(167,139,250,0.15)";

  const pillStyle = (active) => ({
    padding:"8px 16px", borderRadius:"99px", cursor:"pointer",
    fontFamily:"inherit", fontWeight:"700", fontSize:"12px",
    transition:"all 0.2s",
    border:`1.5px solid rgba(124,58,237,${active?"0.7":"0.2"})`,
    background:active?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",
    backdropFilter:"blur(10px)", color:"#fff",
    boxShadow:active?"0 0 16px rgba(124,58,237,0.4)":"none",
  });

  return (
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif"}}>

      {/* Header */}
      <div style={{marginBottom:"24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1.5px solid rgba(124,58,237,0.45)",borderRadius:"99px",padding:"6px 16px",marginBottom:"10px",boxShadow:"0 0 16px rgba(124,58,237,0.2)"}}>
          <span>🪝</span>
          <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"2px",textTransform:"uppercase",color:"#a78bfa"}}>{ht("हुक जनरेटर","हुक जनरेटर","ஹூக் ஜெனரேட்டர்","হুক জেনারেটর","Hook Generator")}</span>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:"700",color:"#fff",fontFamily:"'Orbitron',sans-serif",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>{ht("हुक जनरेटर","हुक जनरेटर","ஹூக் ஜெனரேட்டர்","হুক জেনারেটর","HOOK GENERATOR")}</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>{ht("टॉपिक डालें | 10 वायरल हुक्स पाएं","विषय टाका | 10 व्हायरल हुक्स मिळवा","தலைப்பை உள்ளிடுங்கள் | 10 வைரல் ஹூக்கள்","বিষয় লিখুন | 10 ভাইরাল হুক পান","Enter topic | Get 10 viral hooks instantly")}</p>
      </div>

      {/* Topic input */}
      <div style={{marginBottom:"18px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{ht("टॉपिक / कीवर्ड","विषय / कीवर्ड","தலைப்பு / முக்கியச்சொல்","বিষয় / কীওয়ার্ড","TOPIC / KEYWORD")}</div>
        <div style={{display:"flex",gap:"8px"}}>
          <input value={topic} onChange={e=>{setTopic(e.target.value);setError("");}}
            onKeyDown={e=>e.key==="Enter"&&generate()}
            placeholder={ht("जैसे: स्किनकेयर, क्रिप्टो, GTA 6...","उदा: स्किनकेअर, क्रिप्टो...","எ.கா: ஸ்கின்கேர், கிரிப்டோ...","যেমন: স্কিনকেয়ার, ক্রিপ্টো...","e.g. skincare, crypto, GTA 6, cricket...")}
            style={{flex:1,padding:"12px 18px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.25)",outline:"none",fontSize:"14px",color:"#fff",background:"rgba(255,255,255,0.05)",backdropFilter:"blur(8px)",fontFamily:"inherit",transition:"border 0.2s",boxSizing:"border-box"}}
            onFocus={e=>{e.target.style.border=`1.5px solid ${P}`;e.target.style.boxShadow=`0 0 0 3px rgba(124,58,237,0.12)`;}}
            onBlur={e=>{e.target.style.border="1.5px solid rgba(124,58,237,0.25)";e.target.style.boxShadow="none";}}
          />
          <button onClick={generate} disabled={loading||!topic.trim()}
            className="hook-gen-btn"
            style={{padding:"12px 22px",borderRadius:"99px",border:`1.5px solid rgba(124,58,237,${loading||!topic.trim()?"0.2":"0.6"})`,background:loading||!topic.trim()?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.12)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"13px",cursor:loading||!topic.trim()?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading||!topic.trim()?"none":"0 0 16px rgba(124,58,237,0.4)",transition:"all 0.3s",whiteSpace:"nowrap",opacity:loading||!topic.trim()?0.5:1}}>
            {loading?(
              <span style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <span style={{width:"12px",height:"12px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>
                {ht("बना रहे हैं…","तयार करत आहे…","உருவாக்குகிறது…","তৈরি করছে…","Generating…")}
              </span>
            ):ht("✦ बनाएं","✦ तयार करा","✦ உருவாக்கு","✦ তৈরি করুন","✦ Generate")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"14px",marginBottom:"18px"}}>
        {/* Tone */}
        <div>
          <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{ht("स्टाइल","स्टाइल","பாணி","স্টাইল","STYLE")}</div>
          <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
            {TONES.map(t=>(
              <button key={t.id} onClick={()=>setTone(t.id)}
                style={{...pillStyle(tone===t.id),textAlign:"left",borderRadius:"10px",fontSize:"11px",padding:"7px 12px"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Platform + Language */}
        <div style={{gridColumn:"span 2"}}>
          <div style={{marginBottom:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{ht("प्लेटफ़ॉर्म","प्लॅटफॉर्म","தளம்","প্ল্যাটফর্ম","PLATFORM")}</div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {PLATFORMS.map(p=>(
                <button key={p.id} onClick={()=>setPlatform(p.id)} style={pillStyle(platform===p.id)}>{p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{ht("भाषा","भाषा","மொழி","ভাষা","LANGUAGE")}</div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {LANGS.map(l=>(
                <button key={l.id} onClick={()=>setLanguage(l.id)} style={pillStyle(language===l.id)}>{l.label}</button>
              ))}
            </div>
          </div>

          {/* Results */}
          {hooks.length > 0 && (
            <div style={{marginTop:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)"}}>
                  {hooks.length} {ht("हुक्स तैयार","हुक्स तयार","ஹூக்கள் தயார்","হুক প্রস্তুত","HOOKS READY")}
                </span>
                <button onClick={copyAll}
                  style={{padding:"6px 14px",borderRadius:"99px",border:`1.5px solid rgba(124,58,237,${copied==="all"?"0.7":"0.3"})`,background:copied==="all"?"rgba(52,211,153,0.1)":"rgba(124,58,237,0.1)",color:copied==="all"?"#34d399":"#a78bfa",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                  {copied==="all"?"✓ Copied!":"📋 Copy All"}
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {hooks.map((hook,i)=>(
                  <div key={i} onClick={()=>copyHook(hook)}
                    style={{padding:"12px 16px",borderRadius:"12px",border:`1.5px solid ${copied===hook?"rgba(52,211,153,0.4)":"rgba(124,58,237,0.2)"}`,background:copied===hook?"rgba(52,211,153,0.06)":"rgba(124,58,237,0.05)",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"10px",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(124,58,237,0.5)";e.currentTarget.style.background="rgba(124,58,237,0.1)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=copied===hook?"rgba(52,211,153,0.4)":"rgba(124,58,237,0.2)";e.currentTarget.style.background=copied===hook?"rgba(52,211,153,0.06)":"rgba(124,58,237,0.05)";}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:"10px",flex:1}}>
                      <span style={{fontSize:"11px",fontWeight:"800",color:"#a78bfa",minWidth:"20px",marginTop:"1px"}}>#{i+1}</span>
                      <p style={{fontSize:"13px",lineHeight:"1.6",color:"rgba(255,255,255,0.85)",margin:0}}>{hook}</p>
                    </div>
                    <span style={{fontSize:"11px",color:copied===hook?"#34d399":"rgba(255,255,255,0.25)",flexShrink:0,marginTop:"2px",fontWeight:"700"}}>
                      {copied===hook?"✓":"Copy"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"12px",padding:"12px 16px",color:"#f87171",fontSize:"13px",fontWeight:"600"}}>⚠ {error}</div>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .hook-gen-btn:hover:not(:disabled){
          background:rgba(124,58,237,0.2) !important;
          border-color:rgba(124,58,237,1) !important;
          box-shadow:0 0 28px rgba(124,58,237,0.8),0 0 60px rgba(124,58,237,0.4) !important;
          transform:translateY(-2px) !important;
        }
      `}</style>
    </div>
  );
}
