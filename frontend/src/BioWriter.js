/* eslint-disable */
import React, { useState, useRef } from "react";

const bt = (hi, mr, ta, bn, en) => {
  const l = localStorage.getItem("sociomee_lang") || "en";
  return l==="hi"?hi:l==="mr"?mr:l==="ta"?ta:l==="bn"?bn:en;
};

const NICHES = [
  "Tech YouTuber","Food Blogger","Travel Creator","Fashion Creator",
  "Finance Creator","Gaming Creator","Fitness Creator","Comedy Creator",
  "Education Creator","Lifestyle Creator","Music Creator","Motivational Speaker",
  "Business Coach","Photographer","Dancer","Actor/Actress","Singer",
  "Artist/Painter","Poet/Writer","Chef/Cook","Doctor/Healthcare",
  "Lawyer","Engineer","Entrepreneur","Student Creator","Beauty Creator",
  "Skincare Creator","Parenting Creator","Sports Creator","Spiritual Creator","Other"
];

const PLATFORMS = ["YouTube","Instagram","LinkedIn","Twitter/X","Threads","Podcast","Pinterest","Discord"];

const CATEGORIES = [
  "Entrepreneur","Public Figure","Artist","Musician","Dancer",
  "Actor","Model","Coach","Blogger","Content Creator",
  "Digital Creator","Influencer","Author","Photographer","Chef",
  "Athlete","Doctor","Educator","Activist","Other"
];

const LANGUAGES = [
  {id:"english",  label:"English"},
  {id:"hinglish", label:"Hinglish"},
  {id:"hindi",    label:"हिंदी"},
  {id:"marathi",  label:"मराठी"},
  {id:"tamil",    label:"தமிழ்"},
  {id:"bengali",  label:"বাংলা"},
];

const BLOCKED_KEYWORDS = [
  "porn","sex","nude","naked","xxx","rape","kill","murder","suicide","bomb","drug","weed","cocaine","hack","terror","racist","fuck","shit","bitch","ass","bastard","nigger",
  "chut","lund","gaand","bhosda","madarchod","behenchod","randi","harami","chudai","sexy","nangi","nanga",
  "zavla","ghanta","zadpa","maila","oombu","sunni","punda","otha","choda","magi","baal","shala",
];
const isBlocked = (text) => BLOCKED_KEYWORDS.some(w => text.toLowerCase().includes(w));

const AESTHETIC_COMBOS = [
  "🌊💙🫧","🌸🤍🌿","🖤🌙✨","🔥💫⚡","🌅🍂🎯",
  "💜🌌🔮","🌺🦋🌈","❄️🤍💎","🌻☀️🍯","🎸🎵🎶","none",
];

// 6 batches per type — each batch has 4 types
const BATCHES = [
  // Batch 1
  {
    professional: (n,ni,pl,ach,cat,role,brand) =>
      `${n} | ${cat||ni}${role?` · ${role}`:""}\n${ni} creating content on ${pl}.${ach?`\n${ach}.`:""}\nDedicated to educating and inspiring audiences across India.`,
    casual: (n,ni,pl,ach,cat,role,brand) =>
      `Hey! I'm ${n} 👋\n${ni}${cat?` & ${cat}`:""} on ${pl}.${role?`\n${role}${brand?` @${brand}`:""}.`:""}\n${ach?`${ach} 🎯\n`:""}\nCreating content that actually helps. Let's vibe! 🚀`,
    punchy: (n,ni,pl,ach,cat,role,brand) =>
      `${ni} 🎯${cat?` | ${cat}`:""} | ${pl}${role?`\n${role}${brand?` @${brand}`:""}`:""}\n${ach?`${ach}\n`:""}\nBuilding my story one post at a time ⚡`,
    aesthetic: (n,ni,pl,ach,cat,role,brand,emoji) =>
      `${emoji}\n${n} · ${cat||ni}\n${ach||"creating & thriving"}`,
  },
  // Batch 2
  {
    professional: (n,ni,pl,ach,cat,role,brand) =>
      `${n}\n${cat||ni}${role?` · ${role}${brand?` @${brand}`:""}`:""}.\nCreating on ${pl}.${ach?` ${ach}.`:""}\nPassionate about content that makes a difference.`,
    casual: (n,ni,pl,ach,cat,role,brand) =>
      `Hi, I'm ${n}! ✨\nJust a ${ni} making the internet better.${role?`\n${role}${brand?` @${brand}`:""} 💼`:""}\n${ach?`${ach} and still going! 💪\n`:""}\nFind me on ${pl} 🔥`,
    punchy: (n,ni,pl,ach,cat,role,brand) =>
      `${ni} 🔥 | ${cat||"Creator"} | ${pl}${role?`\n${role}${brand?` @${brand}`:""}`:""}\n${ach?`${ach} | `:""}\nLet's grow together 🚀`,
    aesthetic: (n,ni,pl,ach,cat,role,brand,emoji) =>
      `${n}\n${emoji}\n${cat||ni}${ach?` · ${ach}`:""}`,
  },
  // Batch 3
  {
    professional: (n,ni,pl,ach,cat,role,brand) =>
      `${n} | ${ni}${cat?` & ${cat}`:""}\n${role?`${role}${brand?` · @${brand}`:""}\n`:""}${pl} creator.${ach?` ${ach}.`:""}\nBuilding authentic connections through storytelling.`,
    casual: (n,ni,pl,ach,cat,role,brand) =>
      `I'm ${n} 😊\n${ni}${cat?` | ${cat}`:""} | ${pl}\n${role?`${role}${brand?` @${brand}`:""} ✨\n`:""}\n${ach?`${ach} 🌟\n`:""}\nCreating from the heart. Come say hi! 💬`,
    punchy: (n,ni,pl,ach,cat,role,brand) =>
      `${ni} ✨${cat?` | ${cat}`:""}\n${pl}${role?` | ${role}${brand?` @${brand}`:""}`:""}\n${ach?`${ach}\n`:""}\nContent that hits different 🎬`,
    aesthetic: (n,ni,pl,ach,cat,role,brand,emoji) =>
      `${emoji}\n${cat||ni}${role?` · ${role}`:""}\n${n}${ach?` · ${ach}`:""}`,
  },
  // Batch 4
  {
    professional: (n,ni,pl,ach,cat,role,brand) =>
      `${n}\n${ni} · ${cat||"Creator"}${role?` · ${role}${brand?` @${brand}`:""}`:""}.\nCreating on ${pl} for audiences worldwide.${ach?`\n${ach}.`:""}`,
    casual: (n,ni,pl,ach,cat,role,brand) =>
      `${n} here! 🎯\nA ${ni}${cat?` & ${cat}`:""} on ${pl}.${role?`\n${role}${brand?` @${brand}`:""} 🚀`:""}\n${ach?`${ach} 💫\n`:""}\nContent that actually helps you grow 🔥`,
    punchy: (n,ni,pl,ach,cat,role,brand) =>
      `${cat||ni} | ${ni} | ${pl}${role?`\n${role}${brand?` @${brand}`:""}`:""}\n${ach?`${ach}\n`:""}\n${n} ⚡`,
    aesthetic: (n,ni,pl,ach,cat,role,brand,emoji) =>
      `${n} ${emoji}\n${cat||ni}${ach?` · ${ach}`:""}\n${role?`${role}${brand?` @${brand}`:""}`:"creating & thriving"}`,
  },
  // Batch 5
  {
    professional: (n,ni,pl,ach,cat,role,brand) =>
      `${n} | ${cat||ni}\n${role?`${role}${brand?` · @${brand}`:""} ·\n`:""}${ni} · ${pl}.${ach?` ${ach}.`:""}\nInspiring Indian audiences through quality content.`,
    casual: (n,ni,pl,ach,cat,role,brand) =>
      `Hey it's ${n}! 💫\n${ni} vibes on ${pl}.${role?`\n${role}${brand?` @${brand}`:""} 💼`:""}\n${ach?`${ach} 🔥\n`:""}\nLet's create something great together 🤝`,
    punchy: (n,ni,pl,ach,cat,role,brand) =>
      `${n} | ${ni} 🔥\n${pl}${cat?` | ${cat}`:""}\n${role?`${role}${brand?` @${brand}`:""}`:""}\n${ach?`${ach}`:""} ⚡`,
    aesthetic: (n,ni,pl,ach,cat,role,brand,emoji) =>
      `${emoji} ${n} ${emoji}\n${cat||ni}\n${ach||role||"in my era ✨"}`,
  },
  // Batch 6
  {
    professional: (n,ni,pl,ach,cat,role,brand) =>
      `${n}\n${cat||ni}${role?` & ${role}${brand?` @${brand}`:""}`:""}.\nCreating on ${pl}.${ach?` ${ach}.`:""}\nContent that educates, inspires and connects.`,
    casual: (n,ni,pl,ach,cat,role,brand) =>
      `What's up! I'm ${n} ✌️\n${ni}${cat?` · ${cat}`:""} on ${pl}.${role?`\n${role}${brand?` @${brand}`:""} 🎯`:""}\n${ach?`${ach} 💪\n`:""}\nReal content for real people 🙌`,
    punchy: (n,ni,pl,ach,cat,role,brand) =>
      `${ni} · ${cat||"Creator"} · ${pl}${role?`\n${role}${brand?` @${brand}`:""}`:""}\n${ach?`${ach}\n`:""}\nNo filter. Just ${n} ⚡`,
    aesthetic: (n,ni,pl,ach,cat,role,brand,emoji) =>
      `${emoji}\n${n} · ${cat||ni}\n${ach?ach:role?`${role}${brand?` @${brand}`:""}`:"living my best life"}`,
  },
];

export default function BioWriter({ user }) {
  const [name,        setName       ] = useState("");
  const [niche,       setNiche      ] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [platforms,   setPlatforms  ] = useState([]);
  const [achievement, setAchievement] = useState("");
  const [category,    setCategory   ] = useState("");
  const [role,        setRole       ] = useState("");
  const [brand,       setBrand      ] = useState("");
  const [language,    setLanguage   ] = useState("english");
  const [aesthetic,   setAesthetic  ] = useState(AESTHETIC_COMBOS[0]);
  const [bios,        setBios       ] = useState(null);
  const [loading,     setLoading    ] = useState(false);
  const [copied,      setCopied     ] = useState("");
  const [error,       setError      ] = useState("");
  const batchRef = useRef(0);

  const P = "#7c3aed";

  const togglePlatform = (p) => setPlatforms(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev,p]);

  const generate = (regen=false) => {
    const finalNiche = niche==="Other" ? customNiche : niche;
    if (!name.trim()) { setError("Enter your name"); return; }
    if (!finalNiche.trim()) { setError("Select your niche"); return; }
    if (isBlocked(name) || isBlocked(finalNiche) || isBlocked(achievement)) { setError(bt("अनुचित शब्द हैं","अयोग्य शब्द आहेत","தகாத வார்த்தைகள்","অনুপযুক্ত শব্দ","Inappropriate words detected — please revise")); return; }
    setLoading(true); setError("");

    if (regen) batchRef.current = (batchRef.current + 1) % BATCHES.length;
    else batchRef.current = 0;

    const n = name.trim();
    const ni = finalNiche.trim();
    const pl = platforms.length>0 ? platforms.join(" & ") : "Social Media";
    const ach = achievement.trim();
    const cat = category;
    const r = role.trim();
    const b = brand.trim();
    const em = aesthetic;
    const batch = BATCHES[batchRef.current];

    setTimeout(() => {
      let professional = batch.professional(n,ni,pl,ach,cat,r,b);
      let casual = batch.casual(n,ni,pl,ach,cat,r,b);
      let punchy = batch.punchy(n,ni,pl,ach,cat,r,b);
      let aestheticBio = batch.aesthetic(n,ni,pl,ach,cat,r,b,em);

      if (language==="hinglish") {
        professional = `${n} | ${cat||ni}${r?` · ${r}${b?` @${b}`:""}`:""}.\n${ni} jo ${pl} par content banate hain.${ach?` ${ach}.`:""}\nHigh-quality content ke zariye Indian audience ko inspire karna — yahi mera passion hai.`;
        casual = `Hey! Main ${n} hoon 👋\n${ni}${cat?` & ${cat}`:""} on ${pl}.${r?`\n${r}${b?` @${b}`:""} 💼`:""}\n${ach?`${ach} 🎯\n`:""}\nAisa content banata hoon jo actually kaam aata hai 🚀`;
        punchy = `${ni} 🎯 | ${cat||"Creator"} | ${pl}${r?`\n${r}${b?` @${b}`:""}`:""}\n${ach?`${ach}\n`:""}\nEk post ek kadam ⚡`;
      } else if (language==="hindi") {
        professional = `${n} | ${cat||ni}${r?` · ${r}${b?` @${b}`:""}`:""}.\n${ni} जो ${pl} पर content बनाते हैं।${ach?` ${ach}।`:""}\nHigh-quality content के ज़रिए inspire करना — यही मेरा passion है।`;
        casual = `नमस्ते! मैं ${n} हूँ 👋\n${ni}${cat?` & ${cat}`:""} on ${pl}।${r?`\n${r}${b?` @${b}`:""} 💼`:""}\n${ach?`${ach} 🎯\n`:""}\nऐसा content बनाता हूँ जो actually काम आए 🚀`;
        punchy = `${ni} 🎯 | ${cat||"Creator"} | ${pl}${r?`\n${r}${b?` @${b}`:""}`:""}\n${ach?`${ach}\n`:""}\nहर post एक कदम ⚡`;
      } else if (language==="marathi") {
        professional = `${n} | ${cat||ni}${r?` · ${r}${b?` @${b}`:""}`:""}.\n${ni} जे ${pl} वर content तयार करतात.${ach?` ${ach}.`:""}\nHigh-quality content द्वारे inspire करणे — हेच माझे passion आहे.`;
        casual = `नमस्कार! मी ${n} आहे 👋\n${ni}${cat?` & ${cat}`:""} on ${pl}.${r?`\n${r}${b?` @${b}`:""} 💼`:""}\n${ach?`${ach} 🎯\n`:""}\nखरोखर उपयोगी content बनवतो 🚀`;
        punchy = `${ni} 🎯 | ${cat||"Creator"} | ${pl}${r?`\n${r}${b?` @${b}`:""}`:""}\n${ach?`${ach}\n`:""}\nप्रत्येक post एक पाऊल ⚡`;
      } else if (language==="tamil") {
        professional = `${n} | ${cat||ni}${r?` · ${r}${b?` @${b}`:""}`:""}.\n${ni} ${pl} இல் content உருவாக்குகிறார்.${ach?` ${ach}.`:""}\nதரமான content மூலம் inspire செய்வது என் passion.`;
        casual = `வணக்கம்! நான் ${n} 👋\n${ni}${cat?` & ${cat}`:""} on ${pl}.${r?`\n${r}${b?` @${b}`:""} 💼`:""}\n${ach?`${ach} 🎯\n`:""}\nஉண்மையில் உதவும் content 🚀`;
        punchy = `${ni} 🎯 | ${cat||"Creator"} | ${pl}${r?`\n${r}${b?` @${b}`:""}`:""}\n${ach?`${ach}\n`:""}\nஒவ்வொரு post ஒரு அடி ⚡`;
      } else if (language==="bengali") {
        professional = `${n} | ${cat||ni}${r?` · ${r}${b?` @${b}`:""}`:""}.\n${ni} যিনি ${pl} এ content তৈরি করেন।${ach?` ${ach}।`:""}\nমানসম্পন্ন content এর মাধ্যমে অনুপ্রাণিত করা — এটাই আমার passion।`;
        casual = `হ্যালো! আমি ${n} 👋\n${ni}${cat?` & ${cat}`:""} on ${pl}।${r?`\n${r}${b?` @${b}`:""} 💼`:""}\n${ach?`${ach} 🎯\n`:""}\nসত্যিই কাজে আসে এমন content 🚀`;
        punchy = `${ni} 🎯 | ${cat||"Creator"} | ${pl}${r?`\n${r}${b?` @${b}`:""}`:""}\n${ach?`${ach}\n`:""}\nপ্রতিটি post একটি পদক্ষেপ ⚡`;
      }

      setBios({ professional, casual, punchy, aesthetic:aestheticBio });
      setLoading(false);
    }, 600);
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(()=>setCopied(""),2000);
  };

  const pillStyle = (active) => ({
    padding:"7px 14px", borderRadius:"99px", cursor:"pointer",
    fontFamily:"inherit", fontWeight:"700", fontSize:"12px", transition:"all 0.2s",
    border:`1.5px solid rgba(124,58,237,${active?"0.7":"0.2"})`,
    background:active?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",
    color:"#fff", boxShadow:active?"0 0 14px rgba(124,58,237,0.4)":"none",
  });

  const BIO_TYPES = [
    {key:"professional", label:`💼 ${bt("प्रोफेशनल","व्यावसायिक","தொழில்முறை","পেশাদার","Professional")}`},
    {key:"casual",       label:`😊 ${bt("कैज़ुअल","सहज","சாதாரண","ক্যাজুয়াল","Casual")}`},
    {key:"punchy",       label:`⚡ ${bt("पंची","पंची","பஞ்சி","পাঞ্চি","Punchy")}`},
    {key:"aesthetic",    label:`🌸 ${bt("एस्थेटिक","एस्थेटिक","அழகியல்","অ্যাস্থেটিক","Aesthetic")}`},
  ];

  return (
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif"}}>
      {/* Header */}
      <div style={{marginBottom:"24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1.5px solid rgba(124,58,237,0.45)",borderRadius:"99px",padding:"6px 16px",marginBottom:"10px"}}>
          <span>✍️</span>
          <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"2px",textTransform:"uppercase",color:"#a78bfa"}}>Bio Writer</span>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:"700",color:"#fff",fontFamily:"'Orbitron',sans-serif",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>BIO WRITER</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>{bt("details डालें | 4 तरह के बायो पाएं","माहिती टाका | 4 बायो","விவரங்கள் | 4 வகை பயோ","তথ্য দিন | ৪ বায়ো","Enter details | Get 4 bios instantly — 6 unique variations")}</p>
      </div>

      {/* Name */}
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{bt("आपका नाम","तुमचे नाव","உங்கள் பெயர்","আপনার নাম","YOUR NAME")}</div>
        <input value={name} onChange={e=>{setName(e.target.value);setError("");}}
          placeholder="e.g. Yash Agrawal"
          style={{width:"100%",padding:"12px 18px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.25)",outline:"none",fontSize:"14px",color:"#fff",background:"rgba(255,255,255,0.05)",backdropFilter:"blur(8px)",fontFamily:"inherit",boxSizing:"border-box",transition:"border 0.2s"}}
          onFocus={e=>{e.target.style.border=`1.5px solid ${P}`;e.target.style.boxShadow=`0 0 0 3px rgba(124,58,237,0.12)`;}}
          onBlur={e=>{e.target.style.border="1.5px solid rgba(124,58,237,0.25)";e.target.style.boxShadow="none";}}
        />
      </div>

      {/* Instagram Category */}
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>
          {bt("Instagram कैटेगरी","Instagram श्रेणी","Instagram வகை","Instagram বিভাগ","INSTAGRAM CATEGORY")}
          <span style={{color:"rgba(255,255,255,0.2)",fontWeight:"400",fontSize:"9px",textTransform:"none",marginLeft:"6px"}}>optional</span>
        </div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCategory(cat=>cat===c?"":c)} style={pillStyle(category===c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Founder/Cofounder field - shows when Entrepreneur selected */}
      {category==="Entrepreneur" && (
        <div style={{marginBottom:"16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          <div>
            <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>
              ROLE <span style={{color:"rgba(255,255,255,0.2)",fontWeight:"400",fontSize:"9px",textTransform:"none"}}>optional</span>
            </div>
            <div style={{display:"flex",gap:"6px"}}>
              {["Founder","Co-Founder","CEO","CTO","CMO"].map(r=>(
                <button key={r} onClick={()=>setRole(ro=>ro===r?"":r)} style={{...pillStyle(role===r),fontSize:"11px",padding:"6px 10px"}}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>
              BRAND/COMPANY <span style={{color:"rgba(255,255,255,0.2)",fontWeight:"400",fontSize:"9px",textTransform:"none"}}>optional</span>
            </div>
            <input value={brand} onChange={e=>setBrand(e.target.value)}
              placeholder="e.g. SocioMee, boat.nirvana"
              style={{width:"100%",padding:"10px 16px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.25)",outline:"none",fontSize:"13px",color:"#fff",background:"rgba(255,255,255,0.05)",fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>
        </div>
      )}

      {/* Niche */}
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{bt("आपका निश","तुमचा निश","உங்கள் நிஷ்","আপনার নিশ","YOUR NICHE")}</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"}}>
          {NICHES.map(n=>(
            <button key={n} onClick={()=>setNiche(n)} style={pillStyle(niche===n)}>{n}</button>
          ))}
        </div>
        {niche==="Other" && (
          <input value={customNiche} onChange={e=>setCustomNiche(e.target.value)}
            placeholder="Enter your niche..."
            style={{width:"100%",padding:"10px 16px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.25)",outline:"none",fontSize:"13px",color:"#fff",background:"rgba(255,255,255,0.05)",fontFamily:"inherit",boxSizing:"border-box",marginTop:"6px"}}
          />
        )}
      </div>

      {/* Platforms */}
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{bt("प्लेटफ़ॉर्म","प्लॅटफॉर्म","தளங்கள்","প্ল্যাটফর্ম","PLATFORMS")}</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {PLATFORMS.map(p=>(
            <button key={p} onClick={()=>togglePlatform(p)} style={pillStyle(platforms.includes(p))}>{p}</button>
          ))}
        </div>
      </div>

      {/* Achievement */}
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>
          {bt("उपलब्धि","उपलब्धि","சாதனை","অর্জন","ACHIEVEMENT")}
          <span style={{color:"rgba(255,255,255,0.2)",fontWeight:"400",fontSize:"9px",textTransform:"none",marginLeft:"6px"}}>optional</span>
        </div>
        <input value={achievement} onChange={e=>setAchievement(e.target.value)}
          placeholder="e.g. 100K subscribers, Shark Tank S1, Award winner..."
          style={{width:"100%",padding:"12px 18px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.25)",outline:"none",fontSize:"14px",color:"#fff",background:"rgba(255,255,255,0.05)",backdropFilter:"blur(8px)",fontFamily:"inherit",boxSizing:"border-box",transition:"border 0.2s"}}
          onFocus={e=>{e.target.style.border=`1.5px solid ${P}`;e.target.style.boxShadow=`0 0 0 3px rgba(124,58,237,0.12)`;}}
          onBlur={e=>{e.target.style.border="1.5px solid rgba(124,58,237,0.25)";e.target.style.boxShadow="none";}}
        />
      </div>

      {/* Language */}
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>{bt("भाषा","भाषा","மொழி","ভাষা","LANGUAGE")}</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {LANGUAGES.map(l=>(
            <button key={l.id} onClick={()=>setLanguage(l.id)} style={pillStyle(language===l.id)}>{l.label}</button>
          ))}
        </div>
      </div>

      {/* Aesthetic combo */}
      <div style={{marginBottom:"20px"}}>
        <div style={{fontSize:"10px",fontWeight:"800",letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:"8px"}}>🌸 AESTHETIC COMBO</div>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
          {AESTHETIC_COMBOS.map(e=>(
            <button key={e} onClick={()=>setAesthetic(e)}
              style={{padding:"8px 12px",borderRadius:"12px",cursor:"pointer",fontFamily:"inherit",fontSize:e==="none"?"11px":"16px",fontWeight:e==="none"?"700":"400",transition:"all 0.2s",border:`1.5px solid ${aesthetic===e?"rgba(124,58,237,0.7)":"rgba(124,58,237,0.2)"}`,background:aesthetic===e?"rgba(124,58,237,0.15)":"rgba(255,255,255,0.04)",color:"#fff",boxShadow:aesthetic===e?"0 0 14px rgba(124,58,237,0.4)":"none"}}>
              {e==="none"?"None":e}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"12px",padding:"12px 16px",marginBottom:"14px",color:"#f87171",fontSize:"13px",fontWeight:"600"}}>⚠ {error}</div>}

      {/* Generate button */}
      <button onClick={()=>generate(false)} disabled={loading||!name.trim()}
        className="bio-gen-btn"
        style={{width:"100%",padding:"14px",borderRadius:"99px",border:`1.5px solid rgba(124,58,237,${loading||!name.trim()?"0.2":"0.6"})`,background:loading||!name.trim()?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.12)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:loading||!name.trim()?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading||!name.trim()?"none":"0 0 16px rgba(124,58,237,0.3)",transition:"all 0.3s",marginBottom:"20px",opacity:loading||!name.trim()?0.5:1}}>
        {loading?(
          <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
            <span style={{width:"14px",height:"14px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>
            {bt("बना रहे हैं…","तयार करत आहे…","உருவாக்குகிறது…","তৈরি করছে…","Generating…")}
          </span>
        ):`✦ ${bt("बायो बनाएं","बायो तयार करा","பயோ உருவாக்கு","বায়ো তৈরি করুন","Generate Bios")}`}
      </button>

      {/* Results */}
      {bios && (
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          {BIO_TYPES.map(b=>(
            <div key={b.key} style={{background:"rgba(124,58,237,0.06)",border:`1.5px solid ${copied===b.key?"rgba(52,211,153,0.4)":"rgba(124,58,237,0.2)"}`,borderRadius:"14px",padding:"16px 18px",transition:"all 0.2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                <span style={{fontSize:"12px",fontWeight:"800",color:"#a78bfa"}}>{b.label}</span>
                <button onClick={()=>copy(bios[b.key],b.key)}
                  style={{padding:"5px 14px",borderRadius:"99px",border:`1.5px solid ${copied===b.key?"rgba(52,211,153,0.5)":"rgba(124,58,237,0.3)"}`,background:copied===b.key?"rgba(52,211,153,0.1)":"rgba(124,58,237,0.08)",color:copied===b.key?"#34d399":"#a78bfa",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
                  {copied===b.key?"✓ Copied!":"Copy"}
                </button>
              </div>
              <p style={{fontSize:"14px",lineHeight:"1.9",color:"rgba(255,255,255,0.85)",margin:0,whiteSpace:"pre-line"}}>{bios[b.key]}</p>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:"8px",justifyContent:"center"}}>
            <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)"}}>Variation {batchRef.current+1}/6</span>
            <button onClick={()=>generate(true)}
              style={{padding:"11px 24px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.08)",color:"#a78bfa",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
              ↻ {bt("अगला वर्शन","पुढील आवृत्ती","அடுத்த பதிப்பு","পরবর্তী সংস্করণ","Next Variation")}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .bio-gen-btn:hover:not(:disabled){
          background:rgba(124,58,237,0.2) !important;
          border-color:rgba(124,58,237,1) !important;
          box-shadow:0 0 28px rgba(124,58,237,0.8),0 0 60px rgba(124,58,237,0.4) !important;
          transform:translateY(-2px) !important;
        }
      `}</style>
    </div>
  );
}
