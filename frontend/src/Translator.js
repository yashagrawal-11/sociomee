/* eslint-disable */
import React, { useState, useRef, useEffect, useCallback } from "react";

const LANGUAGES = [
  { code:"en", label:"English",  name:"English"  },
  { code:"hi", label:"हिंदी",    name:"Hindi"    },
  { code:"mr", label:"मराठी",    name:"Marathi"  },
  { code:"ta", label:"தமிழ்",    name:"Tamil"    },
  { code:"bn", label:"বাংলা",    name:"Bengali"  },
  { code:"gu", label:"ગુજરાતી",  name:"Gujarati" },
  { code:"te", label:"తెలుగు",   name:"Telugu"   },
];
const BASE = "https://sociomee.in/api";

const BLOCKED = [
  // English
  "sex","porn","nude","naked","xxx","adult","erotic","rape","murder","kill","suicide","self-harm","selfharm","bomb","terror","terrorist","jihad","drug","cocaine","heroin","weed","meth","crack","hack","malware","virus","exploit","weapon","gore","trafficking","prostitute","escort","onlyfans","strip",
  // Hindi
  "सेक्स","पोर्न","नग्न","बलात्कार","हत्या","मार डालो","आत्महत्या","बम","आतंकवाद","आतंकवादी","जिहाद","ड्रग","कोकीन","हेरोइन","वेश्या","तस्करी","अश्लील",
  // Marathi
  "लैंगिक","बलात्कार","खून","आत्महत्या","बॉम्ब","दहशतवाद","दहशतवादी","ड्रग्स","वेश्या","तस्करी","अश्लील",
  // Tamil
  "செக்ஸ்","பாலியல்","கொலை","தற்கொலை","குண்டு","பயங்கரவாதம்","போதைப்பொருள","விபச்சாரம்","கடத்தல்",
  // Bengali
  "যৌন","পর্ন","ধর্ষণ","হত্যা","আত্মহত্যা","বোমা","সন্ত্রাস","মাদক","পতিতা","পাচার",
  // Gujarati
  "સેક્સ","બળાત્કાર","હત્યા","આત્મહત્યા","બોમ્બ","આતંકવાદ","ડ્રગ","વેશ્યા","હેરોઇન",
  // Telugu
  "సెక్స్","అత్యాచారం","హత్య","ఆత్మహత్య","బాంబు","ఉగ్రవాదం","మాదకద్రవ్యాలు","వ్యభిచారం",
];

const filterText = (text) => {
  const lower = text.toLowerCase();
  const found = BLOCKED.find(w => lower.includes(w));
  if (found) return { blocked: true, word: found };
  return { blocked: false };
};

function LangDropdown({ value, onChange, exclude }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const opts = LANGUAGES.filter(l => l.code !== exclude);
  const selected = LANGUAGES.find(l => l.code === value) || LANGUAGES[0];
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div ref={ref} style={{position:"relative",zIndex:open?9999:1,flex:1}}>
      <button onClick={() => setOpen(o => !o)}
        style={{width:"100%",padding:"12px 18px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.25)",outline:"none",fontSize:"14px",fontWeight:"700",color:"#fff",background:"rgba(255,255,255,0.06)",cursor:"pointer",boxSizing:"border-box",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(10px)",transition:"border 0.2s"}}
        onMouseEnter={e=>{e.currentTarget.style.border="1.5px solid rgba(124,58,237,0.5)";}}
        onMouseLeave={e=>{e.currentTarget.style.border="1.5px solid rgba(124,58,237,0.25)";}}>
        <span>{selected.label} <span style={{fontSize:"12px",opacity:0.6,marginLeft:"4px"}}>{selected.name}</span></span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="rgba(124,58,237,0.8)" style={{transform:open?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}><path d="M7 10l5 5 5-5z"/></svg>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"rgba(15,10,30,0.97)",border:"1.5px solid rgba(124,58,237,0.3)",borderRadius:"16px",overflow:"hidden",backdropFilter:"blur(20px)",boxShadow:"0 8px 32px rgba(0,0,0,0.6)",zIndex:9999}}>
          {opts.map((o,i) => (
            <button key={o.code} onClick={()=>{onChange(o.code);setOpen(false);}}
              style={{width:"100%",padding:"11px 18px",border:"none",background:o.code===value?"rgba(124,58,237,0.2)":"transparent",color:o.code===value?"#a78bfa":"rgba(255,255,255,0.75)",fontSize:"13px",fontWeight:o.code===value?"700":"500",cursor:"pointer",fontFamily:"inherit",textAlign:"left",borderBottom:i<opts.length-1?"1px solid rgba(255,255,255,0.05)":"none",transition:"background 0.15s"}}
              onMouseEnter={e=>{if(o.code!==value)e.currentTarget.style.background="rgba(124,58,237,0.1)";}}
              onMouseLeave={e=>{if(o.code!==value)e.currentTarget.style.background="transparent";}}>
              <span style={{fontWeight:"700"}}>{o.label}</span>
              <span style={{fontSize:"11px",opacity:0.5,marginLeft:"8px"}}>{o.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Translator({ user }) {
  const [inputText,  setInputText ] = useState("");
  const [outputText, setOutputText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");
  const [loading,    setLoading   ] = useState(false);
  const [error,      setError     ] = useState("");
  const [copied,     setCopied    ] = useState(false);
  const [listening,  setListening ] = useState(false);
  const debounceRef    = useRef(null);
  const outputRef      = useRef(null);
  const recognitionRef = useRef(null);

  const wordCount = t => t.trim() ? t.trim().split(/\s+/).length : 0;
  const P = "#7c3aed", R = "#ff3d8f";
  const hairline = "rgba(167,139,250,0.15)";

  const doTranslate = useCallback(async (text, src, tgt) => {
    if (!text.trim() || text.trim().length < 1) { setOutputText(""); return; }
    if (src === tgt) { setOutputText(text); return; }
    const check = filterText(text);
    if (check.blocked) {
      setError("⚠ This content violates our content policy and cannot be translated.");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE}/translate`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text: text.trim(), target_lang: tgt, source_lang: src })
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail||`Error ${res.status}`); }
      const data = await res.json();
      setOutputText(data.translated || "");
    } catch(e) { setError(e.message || "Translation failed. Try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!inputText.trim()) { setOutputText(""); setError(""); return; }
    debounceRef.current = setTimeout(() => doTranslate(inputText, sourceLang, targetLang), 700);
    return () => clearTimeout(debounceRef.current);
  }, [inputText, sourceLang, targetLang, doTranslate]);

  const swap = () => {
    const ps = sourceLang, pt = targetLang, po = outputText;
    setSourceLang(pt); setTargetLang(ps);
    setInputText(po); setOutputText(inputText);
  };

  const copy = () => { navigator.clipboard.writeText(outputText); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const clear = () => { setInputText(""); setOutputText(""); setError(""); };

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input only works in Chrome. Please use Chrome browser."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    recognitionRef.current = r;
    const lmap = { en:"en-IN",hi:"hi-IN",mr:"mr-IN",ta:"ta-IN",bn:"bn-IN",gu:"gu-IN",te:"te-IN" };
    r.lang = lmap[sourceLang] || "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.onstart = () => setListening(true);
    r.onend   = () => setListening(false);
    r.onerror = () => setListening(false);
    let interimTranscript = "";
    r.onresult = e => {
      let final = "";
      interimTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interimTranscript += e.results[i][0].transcript;
      }
      if (final) {
        const check = filterText(final);
        if (check.blocked) {
          r.stop();
          setListening(false);
          setError("⚠ Inappropriate content detected in voice input.");
          return;
        }
        setInputText(prev => {
          const trimmed = prev.trimEnd();
          return trimmed ? trimmed + " " + final.trim() : final.trim();
        });
        interimTranscript = "";
      }
    };
    r.start();
  };

  const taStyle = {
    width:"100%", height:"400px", padding:"18px 20px",
    border:"none", outline:"none", resize:"none",
    background:"transparent",
    color:"#ede8ff", fontSize:"15px", lineHeight:"1.8",
    fontFamily:"'DM Sans','Syne',sans-serif",
    boxSizing:"border-box", overflowY:"auto",
  };

  return (
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif"}}>

      {/* Header */}
      <div style={{marginBottom:"24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1.5px solid rgba(124,58,237,0.45)",borderRadius:"99px",padding:"6px 16px",marginBottom:"10px",boxShadow:"0 0 16px rgba(124,58,237,0.2),inset 0 1px 0 rgba(255,255,255,0.08)"}}>
          <span style={{fontSize:"13px"}}>🌐</span>
          <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"2px",textTransform:"uppercase",color:"#a78bfa"}}>
  {(()=>{const l=localStorage.getItem("sociomee_lang")||"en";return l==="hi"?"स्क्रिप्ट अनुवादक":l==="mr"?"स्क्रिप्ट अनुवादक":l==="ta"?"ஸ்கிரிப்ட் மொழிபெயர்ப்பாளர்":l==="bn"?"স্ক্রিপ্ট অনুবাদক":"Script Translator";})()}
</span>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:"700",color:"#fff",fontFamily:"'Orbitron',sans-serif",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>
  {(()=>{const l=localStorage.getItem("sociomee_lang")||"en";return l==="hi"?"अनुवादक":l==="mr"?"अनुवादक":l==="ta"?"மொழிபெயர்ப்பாளர்":l==="bn"?"অনুবাদক":"TRANSLATOR";})()}
</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>
  {(()=>{const l=localStorage.getItem("sociomee_lang")||"en";return l==="hi"?"अपना स्क्रिप्ट पेस्ट करें।":l==="mr"?"तुमची स्क्रिप्ट पेस्ट करा।":l==="ta"?"உங்கள் ஸ்கிரிப்டை ஒட்டுங்கள்.":l==="bn"?"আপনার স্ক্রিপ্ট পেস্ট করুন।":"Paste your script.";})()}
</p>
      </div>

      {/* Language bar */}
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
        <LangDropdown value={sourceLang} onChange={setSourceLang} exclude={targetLang} />
        <button onClick={swap}
          style={{width:"44px",height:"44px",borderRadius:"50%",border:"1.5px solid rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",color:"#a78bfa"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,58,237,0.2)";e.currentTarget.style.borderColor="rgba(124,58,237,0.6)";}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(124,58,237,0.08)";e.currentTarget.style.borderColor="rgba(124,58,237,0.3)";}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
        </button>
        <LangDropdown value={targetLang} onChange={setTargetLang} exclude={sourceLang} />
      </div>

      {/* Panels */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0",border:`1.5px solid ${hairline}`,borderRadius:"18px",overflow:"hidden",background:"rgba(255,255,255,0.03)"}} className="translator-grid">

        {/* Left */}
        <div style={{borderRight:`1px solid ${hairline}`,display:"flex",flexDirection:"column"}}>
          <textarea value={inputText}
            onChange={e=>{setInputText(e.target.value);setError("");}}
            placeholder={listening?"🎤 Listening… speak now":"Enter text"}
            style={taStyle} autoFocus
          />
          <div style={{padding:"10px 18px",borderTop:`1px solid ${hairline}`,display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:"48px"}}>
            <span style={{fontSize:"11px",color:"rgba(255,255,255,0.2)",fontWeight:"500"}}>
              {inputText.length > 0 ? `${wordCount(inputText).toLocaleString()} words · ${inputText.length.toLocaleString()} chars` : "No character limit"}
            </span>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              {/* MIC BUTTON */}
              <button onClick={startVoice}
                title={listening?"Stop":"Speak to translate"}
                style={{width:"36px",height:"36px",borderRadius:"50%",border:`1.5px solid ${listening?"#ff3d8f":"rgba(124,58,237,0.5)"}`,background:listening?"rgba(255,61,143,0.15)":"rgba(124,58,237,0.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative",transition:"all 0.2s",boxShadow:listening?"0 0 14px rgba(255,61,143,0.5)":"0 0 8px rgba(124,58,237,0.25)"}}>
                {listening && <span style={{position:"absolute",inset:"-5px",borderRadius:"50%",border:"2px solid rgba(255,61,143,0.5)",animation:"ripple 1.2s ease-out infinite"}}/>}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={listening?"#ff3d8f":"#a78bfa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              {inputText && (
                <button onClick={clear} style={{fontSize:"12px",fontWeight:"700",color:"rgba(255,61,143,0.7)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"4px 8px",borderRadius:"6px"}}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{display:"flex",flexDirection:"column",background:outputText?"rgba(124,58,237,0.04)":"transparent"}}>
          <div ref={outputRef} style={{...taStyle,overflowY:"auto",cursor:"default",whiteSpace:"pre-wrap",wordBreak:"break-word",color:outputText?"#ede8ff":"rgba(255,255,255,0.2)"}}>
            {loading ? (
              <span style={{color:"rgba(255,255,255,0.25)",fontSize:"15px",display:"flex",alignItems:"center",gap:"10px"}}>
                <span style={{display:"inline-block",width:"16px",height:"16px",borderRadius:"50%",border:`2px solid rgba(124,58,237,0.3)`,borderTopColor:P,animation:"spin 0.7s linear infinite",flexShrink:0}}/>
                Translating…
              </span>
            ) : outputText ? outputText : "Translation"}
          </div>
          <div style={{padding:"10px 18px",borderTop:`1px solid ${hairline}`,display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:"48px"}}>
            <span style={{fontSize:"11px",color:"rgba(255,255,255,0.2)",fontWeight:"500"}}>
              {outputText && !loading ? `${wordCount(outputText).toLocaleString()} words` : ""}
            </span>
            {outputText && !loading && (
              <button onClick={copy} style={{fontSize:"12px",fontWeight:"700",color:copied?"#34d399":"#a78bfa",background:copied?"rgba(52,211,153,0.1)":"rgba(124,58,237,0.1)",border:`1px solid ${copied?"rgba(52,211,153,0.3)":"rgba(124,58,237,0.25)"}`,cursor:"pointer",fontFamily:"inherit",padding:"5px 14px",borderRadius:"8px",transition:"all 0.2s"}}>
                {copied?"✓ Copied!":"📋 Copy"}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"12px",padding:"12px 16px",marginTop:"12px",color:"#f87171",fontSize:"13px",fontWeight:"600"}}>⚠ {error}</div>}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes ripple{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.8);opacity:0}}
        @media(max-width:768px){
          .translator-grid{grid-template-columns:1fr !important}
          .translator-grid>div:first-child{border-right:none !important;border-bottom:1px solid rgba(167,139,250,0.15) !important}
        }
      `}</style>
    </div>
  );
}
