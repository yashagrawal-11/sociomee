/* eslint-disable */
import React, { useState, useRef, useEffect } from "react";

const tt = (hi, mr, ta, bn, en) => {
  const l = localStorage.getItem("sociomee_lang") || "en";
  return l==="hi"?hi:l==="mr"?mr:l==="ta"?ta:l==="bn"?bn:en;
};

const VOICES_MAP = {
  "hi-IN": ["hi-IN", "hi_IN", "hi"],
  "en-IN": ["en-IN", "en_IN"],
  "mr-IN": ["mr-IN", "mr"],
  "ta-IN": ["ta-IN", "ta"],
  "bn-IN": ["bn-IN", "bn"],
  "en-US": ["en-US"],
};

export default function TextToAudio({ user }) {
  const [text,        setText       ] = useState("");
  const [lang,        setLang       ] = useState("hi-IN");
  const [rate,        setRate       ] = useState(1);
  const [pitch,       setPitch      ] = useState(1);
  const [volume,      setVolume     ] = useState(1);
  const [gender,      setGender     ] = useState("female");
  const [voices,      setVoices     ] = useState([]);
  const [selVoice,    setSelVoice   ] = useState("");
  const [playing,     setPlaying    ] = useState(false);
  const [paused,      setPaused     ] = useState(false);
  const [recording,   setRecording  ] = useState(false);
  const [done,        setDone       ] = useState(false);
  const [error,       setError      ] = useState("");
  const [charCount,   setCharCount  ] = useState(0);
  const [wordIndex,   setWordIndex  ] = useState(-1);
  const [waveform,    setWaveform   ] = useState(Array(20).fill(4));
  const synthRef    = useRef(window.speechSynthesis);
  const uttRef      = useRef(null);
  const waveInterval= useRef(null);
  const words       = text.trim().split(/\s+/).filter(Boolean);

  const LANGS = [
    { code:"hi-IN", label:"हिंदी",    name:"Hindi"    },
    { code:"en-IN", label:"English",  name:"English"  },
    { code:"mr-IN", label:"मराठी",    name:"Marathi"  },
    { code:"ta-IN", label:"தமிழ்",    name:"Tamil"    },
    { code:"bn-IN", label:"বাংলা",    name:"Bengali"  },
    { code:"en-US", label:"Eng US",   name:"Eng US"   },
  ];

  const P = "#7c3aed", R = "#ff3d8f";
  const hairline = "rgba(167,139,250,0.15)";
  const wordCount = t => t.trim() ? t.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const loadVoices = () => {
      const v = synthRef.current.getVoices();
      setVoices(v);
      pickVoice(v, lang, gender);
    };
    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => { pickVoice(voices, lang, gender); }, [lang, gender, voices]);

  const pickVoice = (v, l, g) => {
    const codes = VOICES_MAP[l] || [l];
    const matches = v.filter(vo => codes.some(c => vo.lang.startsWith(c)));
    if (!matches.length) return;
    const femaleKeywords = ["female","woman","zira","heera","priya","veena","lekha","neerja","kalpana","google"];
    const maleKeywords   = ["male","man","ravi","david","mark","hemant"];
    const keywords = g === "female" ? femaleKeywords : maleKeywords;
    const genderMatch = matches.find(vo => keywords.some(k => vo.name.toLowerCase().includes(k)));
    // For female, prefer Google voices as they sound better
    const googleVoice = g === "female" ? matches.find(vo => vo.name.toLowerCase().includes("google")) : null;
    setSelVoice((googleVoice || genderMatch || matches[0]).name);
  };

  // Waveform animation
  const startWave = () => {
    waveInterval.current = setInterval(() => {
      setWaveform(Array(20).fill(0).map(() => Math.random() * 28 + 4));
    }, 100);
  };
  const stopWave = () => {
    clearInterval(waveInterval.current);
    setWaveform(Array(20).fill(4));
  };

  const buildUtt = () => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang; utt.rate = rate; utt.pitch = pitch; utt.volume = volume;
    const voice = voices.find(v => v.name === selVoice);
    if (voice) utt.voice = voice;
    utt.onboundary = e => {
      if (e.name === "word") {
        const spokenSoFar = text.slice(0, e.charIndex);
        const idx = spokenSoFar.trim().split(/\s+/).filter(Boolean).length;
        setWordIndex(idx);
      }
    };
    utt.onstart = () => { setPlaying(true); setPaused(false); startWave(); };
    utt.onend   = () => { setPlaying(false); setPaused(false); setWordIndex(-1); stopWave(); };
    utt.onerror = () => { setPlaying(false); setPaused(false); setWordIndex(-1); stopWave(); };
    return utt;
  };

  const speak = () => {
    if (!text.trim()) { setError(tt("पहले टेक्स्ट डालें","आधी मजकूर टाका","முதல் உரையை உள்ளிடுங்கள்","প্রথমে টেক্সট দিন","Enter text first")); return; }
    if (charCount > 5000) { setError(tt("टेक्स्ट बहुत लंबा है (5000 अक्षर से कम रखें)","मजकूर खूप लांब आहे","உரை மிக நீளமானது","টেক্সট অনেক বড়","Text too long — keep under 5000 chars")); return; }
    synthRef.current.cancel();
    const utt = buildUtt();
    uttRef.current = utt;
    synthRef.current.speak(utt);
  };

  const pause = () => {
    if (synthRef.current.speaking && !synthRef.current.paused) {
      synthRef.current.pause();
      setPaused(true); setPlaying(false); stopWave();
    }
  };

  const resume = () => {
    synthRef.current.cancel();
    setTimeout(() => {
      const utt = buildUtt();
      uttRef.current = utt;
      synthRef.current.speak(utt);
      setPaused(false);
    }, 100);
  };

  const stop = () => {
    synthRef.current.cancel();
    setPlaying(false); setPaused(false); setWordIndex(-1); stopWave();
  };

  const downloadAudio = async () => {
    if (!text.trim()) { setError(tt("पहले टेक्स्ट डालें","आधी मजकूर टाका","முதல் உரையை உள்ளிடுங்கள்","প্রথমে টেক্সট দিন","Enter text first")); return; }
    if (charCount > 5000) { setError(tt("5000 अक्षर से कम रखें","5000 अक्षरांपेक्षा कमी ठेवा","5000 எழுத்துகளுக்கு கீழ்","5000 অক্ষরের কম রাখুন","Keep under 5000 chars")); return; }
    setRecording(true); setError(""); setDone(false);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();
      const chunks = [];
      const recorder = new MediaRecorder(dest.stream);
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type:"audio/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sociomee_audio_${lang}_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false); setDone(true); audioCtx.close();
      };
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;
      osc.connect(gainNode); gainNode.connect(dest); osc.start();
      recorder.start();
      const utt = buildUtt();
      utt.onstart = () => { setPlaying(true); startWave(); };
      utt.onend = () => {
        setPlaying(false); setWordIndex(-1); stopWave();
        setTimeout(() => { recorder.stop(); osc.stop(); }, 500);
      };
      utt.onerror = e => {
        setPlaying(false); setRecording(false); stopWave();
        setError("Speech failed: " + e.error);
        recorder.stop(); osc.stop();
      };
      synthRef.current.cancel();
      synthRef.current.speak(utt);
    } catch(e) {
      setError("Download failed: " + e.message);
      setRecording(false);
    }
  };

  const btnStyle = (active, disabled) => ({
    flex:1, padding:"11px 16px", borderRadius:"99px",
    border:`1.5px solid rgba(124,58,237,${disabled?"0.2":active?"0.8":"0.5"})`,
    background:disabled?"rgba(124,58,237,0.05)":active?"rgba(124,58,237,0.2)":"rgba(124,58,237,0.1)",
    backdropFilter:"blur(16px)", color:"#fff", fontWeight:"700", fontSize:"12px",
    cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit",
    boxShadow:disabled?"none":active?"0 0 24px rgba(124,58,237,0.6)":"0 0 16px rgba(124,58,237,0.3)",
    transition:"all 0.3s", display:"flex", alignItems:"center", justifyContent:"center",
  });

  return (
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif"}}>

      {/* Header */}
      <div style={{marginBottom:"24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1.5px solid rgba(124,58,237,0.45)",borderRadius:"99px",padding:"6px 16px",marginBottom:"10px",boxShadow:"0 0 16px rgba(124,58,237,0.2)"}}>
          <span>🔊</span>
          <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"2px",textTransform:"uppercase",color:"#a78bfa"}}>{tt("टेक्स्ट से ऑडियो","मजकूर ते ऑडिओ","உரை முதல் ஆடியோ","টেক্সট থেকে অডিও","Text to Audio")}</span>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:"700",color:"#fff",fontFamily:"'Orbitron',sans-serif",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>{tt("टेक्स्ट टू ऑडियो","मजकूर ते ऑडिओ","உரை → ஆடியோ","টেক্সট → অডিও","TEXT TO AUDIO")}</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>{tt("स्क्रिप्ट पेस्ट करें | सुनें या ऑडियो डाउनलोड करें","स्क्रिप्ट पेस्ट करा | ऐका किंवा डाउनलोड करा","ஸ்கிரிப்டை ஒட்டுங்கள் | கேளுங்கள் அல்லது பதிவிறக்கவும்","স্ক্রিপ্ট পেস্ট করুন | শুনুন বা ডাউনলোড করুন","Paste script | Listen or download audio")}</p>
      </div>

      {/* Language + Gender */}
      <div style={{marginBottom:"18px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"10px"}}>{tt("भाषा और आवाज़","भाषा आणि आवाज","மொழி மற்றும் குரல்","ভাষা ও কণ্ঠস্বর","LANGUAGE & VOICE")}</div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"10px"}}>
          {LANGS.map(l=>(
            <button key={l.code} onClick={()=>setLang(l.code)}
              style={{padding:"8px 16px",borderRadius:"99px",cursor:"pointer",fontFamily:"inherit",fontWeight:"700",fontSize:"12px",transition:"all 0.2s",border:`1.5px solid rgba(124,58,237,${lang===l.code?"0.7":"0.2"})`,background:lang===l.code?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",color:"#fff",boxShadow:lang===l.code?"0 0 16px rgba(124,58,237,0.4)":"none"}}>
              {l.label}
            </button>
          ))}
        </div>
        {/* Gender toggle */}
        <div style={{display:"flex",gap:"8px"}}>
          {[{id:"female",label:tt("महिला","महिला","பெண்","মহিলা","Female")},{id:"male",label:tt("पुरुष","पुरुष","ஆண்","পুরুষ","Male")}].map(g=>(
            <button key={g.id} onClick={()=>setGender(g.id)}
              style={{padding:"7px 18px",borderRadius:"99px",cursor:"pointer",fontFamily:"inherit",fontWeight:"700",fontSize:"12px",transition:"all 0.2s",border:`1.5px solid rgba(124,58,237,${gender===g.id?"0.7":"0.2"})`,background:gender===g.id?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",color:"#fff",boxShadow:gender===g.id?"0 0 14px rgba(124,58,237,0.4)":"none"}}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"18px"}}>
        {[
          {label:tt("स्पीड","स्पीड","வேகம்","গতি","Speed"),  val:rate,   set:setRate,   min:0.5, max:2,   step:0.1,  fmt:v=>`${v}x`},
          {label:tt("पिच","पिच","பிட்ச்","পিচ","Pitch"),     val:pitch,  set:setPitch,  min:0.5, max:2,   step:0.1,  fmt:v=>`${v}`},
          {label:tt("वॉल्यूम","व्हॉल्युम","ஒலி","ভলিউম","Volume"), val:volume, set:setVolume, min:0,   max:1,   step:0.05, fmt:v=>`${Math.round(v*100)}%`},
        ].map(c=>(
          <div key={c.label} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"12px"}}>
            <div style={{fontSize:"9px",fontWeight:"700",color:"rgba(255,255,255,0.3)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"4px"}}>{c.label}</div>
            <div style={{fontSize:"14px",fontWeight:"800",color:"#a78bfa",marginBottom:"6px"}}>{c.fmt(c.val)}</div>
            <input type="range" min={c.min} max={c.max} step={c.step} value={c.val}
              onChange={e=>c.set(parseFloat(e.target.value))}
              style={{width:"100%",accentColor:P}}/>
          </div>
        ))}
      </div>

      {/* Text input */}
      <div style={{marginBottom:"16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
          <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)"}}>{tt("स्क्रिप्ट / टेक्स्ट","स्क्रिप्ट / मजकूर","ஸ்கிரிப்ட் / உரை","স্ক্রিপ্ট / টেক্সট","SCRIPT / TEXT")}</div>
          <span style={{fontSize:"10px",color:charCount>5000?"#f87171":"rgba(255,255,255,0.2)",fontWeight:charCount>5000?"700":"400"}}>
            {charCount.toLocaleString()}/5000 {tt("अक्षर","अक्षरे","எழுத்து","অক্ষর","chars")}
            {charCount>5000&&" ⚠ Too long"}
          </span>
        </div>

        {/* Word highlight display */}
        {playing || paused ? (
          <div style={{minHeight:"200px",padding:"16px 18px",borderRadius:"14px",border:`1.5px solid rgba(124,58,237,0.4)`,background:"rgba(124,58,237,0.06)",fontSize:"14px",lineHeight:"2",color:"rgba(255,255,255,0.7)",overflowY:"auto",maxHeight:"300px"}}>
            {words.map((w,i)=>(
              <span key={i} style={{
                padding:"1px 3px", borderRadius:"4px", marginRight:"4px",
                background:i===wordIndex?"rgba(124,58,237,0.4)":"transparent",
                color:i===wordIndex?"#fff":i<wordIndex?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.7)",
                fontWeight:i===wordIndex?"800":"400",
                transition:"all 0.1s",
                fontSize:i===wordIndex?"15px":"14px",
              }}>{w}</span>
            ))}
          </div>
        ) : (
          <textarea value={text}
            onChange={e=>{setText(e.target.value);setCharCount(e.target.value.length);setError("");setDone(false);}}
            placeholder={tt("यहाँ अपना स्क्रिप्ट पेस्ट करें...","येथे तुमची स्क्रिप्ट पेस्ट करा...","உங்கள் ஸ்கிரிப்டை இங்கே ஒட்டுங்கள்...","এখানে আপনার স্ক্রিপ্ট পেস্ট করুন...","Paste your script here...")}
            style={{width:"100%",minHeight:"200px",padding:"16px 18px",borderRadius:"14px",border:`1.5px solid ${hairline}`,background:"rgba(255,255,255,0.04)",backdropFilter:"blur(8px)",color:"#ede8ff",fontSize:"14px",lineHeight:"1.8",fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box",transition:"border 0.2s"}}
            onFocus={e=>{e.target.style.border=`1.5px solid ${P}`;e.target.style.boxShadow=`0 0 0 3px rgba(124,58,237,0.12)`;}}
            onBlur={e=>{e.target.style.border=`1.5px solid ${hairline}`;e.target.style.boxShadow="none";}}
          />
        )}
      </div>

      {/* Waveform visualizer */}
      {(playing || paused) && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"3px",height:"44px",marginBottom:"16px",background:"rgba(124,58,237,0.06)",borderRadius:"12px",padding:"0 16px",border:`1px solid ${hairline}`}}>
          {waveform.map((h,i)=>(
            <div key={i} style={{width:"3px",height:`${paused?4:h}px`,borderRadius:"99px",background:"#7c3aed",transition:"height 0.1s ease",opacity:paused?0.3:1}}/>
          ))}
          <span style={{fontSize:"11px",color:"#a78bfa",fontWeight:"700",marginLeft:"10px"}}>
            {paused?tt("रुका हुआ","थांबले","இடைநிறுத்தப்பட்டது","বিরতি","Paused"):tt("बोल रहा है…","बोलत आहे…","பேசுகிறது…","বলছে…","Speaking…")}
          </span>
        </div>
      )}

      {error && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"12px",padding:"12px 16px",marginBottom:"14px",color:"#f87171",fontSize:"13px",fontWeight:"600"}}>⚠ {error}</div>}

      {done && (
        <div style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:"12px",padding:"12px 16px",marginBottom:"14px",display:"flex",alignItems:"center",gap:"10px"}}>
          <span>✅</span>
          <p style={{fontSize:"13px",fontWeight:"700",color:"#34d399"}}>{tt("ऑडियो डाउनलोड हो गया!","ऑडिओ डाउनलोड झाला!","ஆடியோ பதிவிறக்கப்பட்டது!","অডিও ডাউনলোড হয়েছে!","Audio downloaded! Check Downloads folder.")}</p>
        </div>
      )}

      {/* Buttons */}
      <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"10px"}}>
        {!playing && !paused && (
          <button onClick={speak} disabled={!text.trim()||charCount>5000}
            style={btnStyle(false, !text.trim()||charCount>5000)}
            className="tts-btn">
            ▶ {tt("सुनें","ऐका","கேளுங்கள்","শুনুন","Play")}
          </button>
        )}
        {playing && (
          <button onClick={pause} style={btnStyle(true, false)} className="tts-btn">
            {tt("रोकें","थांबा","இடைநிறுத்து","বিரতি","Pause")}
          </button>
        )}
        {paused && (
          <button onClick={resume} style={btnStyle(false, false)} className="tts-btn">
            ▶ {tt("जारी रखें","पुन्हा सुरू करा","தொடரவும்","আবার শুরু করুন","Resume")}
          </button>
        )}
        {(playing || paused) && (
          <button onClick={stop} style={{...btnStyle(false,false),flex:"0 0 auto",padding:"14px 20px",border:"1.5px solid rgba(255,61,143,0.4)",background:"rgba(255,61,143,0.08)",boxShadow:"none"}} className="tts-btn">
            {tt("बंद करें","थांबवा","நிறுத்து","থামুন","Stop")}
          </button>
        )}
        <button onClick={downloadAudio} disabled={!text.trim()||recording||charCount>5000}
          style={btnStyle(recording, !text.trim()||recording||charCount>5000)}
          className="tts-btn">
          {recording?(
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
              <span style={{width:"14px",height:"14px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>
              {tt("रिकॉर्डिंग…","रेकॉर्डिंग…","பதிவு…","রেকর্ডিং…","Recording…")}
            </span>
          ):`${tt("ऑडियो डाउनलोड","ऑडिओ डाउनलोड","ஆடியோ பதிவிறக்கு","অডিও ডাউনলোড","Download Audio")}`}
        </button>
      </div>

      <p style={{textAlign:"center",fontSize:"11px",color:"rgba(255,255,255,0.2)",marginTop:"8px"}}>
        {tt("ब्राउज़र की आवाज़ · Chrome में बेस्ट","ब्राउझर आवाज · Chrome मध्ये सर्वोत्तम","உலாவி குரல் · Chrome இல் சிறப்பு","ব্রাউজার ভয়েস · Chrome এ সেরা","Browser voice · Works best in Chrome")}
      </p>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .tts-btn:hover:not(:disabled){
          background:rgba(124,58,237,0.25) !important;
          border-color:rgba(124,58,237,1) !important;
          box-shadow:0 0 28px rgba(124,58,237,0.8),0 0 60px rgba(124,58,237,0.4) !important;
          transform:translateY(-2px) !important;
        }
      `}</style>
    </div>
  );
}
