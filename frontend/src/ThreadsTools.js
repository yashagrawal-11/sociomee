import { useState, useRef } from "react";

const C = {
  glass:"rgba(255,255,255,0.04)", hairline:"rgba(255,255,255,0.08)",
  ink:"rgba(255,255,255,0.9)", muted:"rgba(255,255,255,0.4)",
  success:"#34d399", danger:"#f87171",
};
const AI = "https://sociomee.in/api/ai/generate";
const lastCallRef = { current: 0 };
const BAD_WORDS = ['fuck','shit','bitch','bastard','asshole','nigger','faggot','chutiya','madarchod','bhenchod','randi','harami','gandu','motherfucker','child porn','cocaine','heroin','meth','jihad','massacre','genocide','bomb','suicide','how to kill','terrorist','explosive','drug deal','buy guns','illegal weapons','human trafficking','rape','molest','hack into','ransomware','darkweb','money laundering','assassination'];
function filterBad(text) { let t=text; BAD_WORDS.forEach(w=>{const re=new RegExp('\\b'+w+'\\b','gi');t=t.replace(re,'*'.repeat(w.length));}); return t; }

const THREAD_FALLBACKS = {
  general:[{hook:"🌟 {topic} is one of those things most people totally misunderstand. Let me explain why it matters more than you think 👇",body:"Here's what nobody tells you about {topic}:\n\n→ The common approach fails 80% of the time\n→ The simple fix that changes everything\n→ Why this matters more than ever in 2024\n\nMost people skip the fundamentals. That's the real problem.",cta:"Found this useful? Save this thread and share with someone who needs to hear it. What's your take on {topic}? 👇"},{hook:"💡 Unpopular opinion: everyone's approach to {topic} is completely backwards. Here's the truth 🧵",body:"I studied {topic} for months. Here's what I found:\n\nThread 1: The mindset shift that changes everything\n→ Stop chasing shortcuts\n→ Focus on the boring fundamentals\n→ Consistency beats intensity every time\n\nThe results will surprise you.",cta:"Bookmark this for when you need a reminder about {topic}. Drop your biggest question below 💬"}],
  tech:[{hook:"⚡ {topic} just changed everything and most people still don't know about it. Here's your 2-minute briefing 🧵",body:"I've been testing {topic} for the past month. Here's my honest breakdown:\n\n→ What it actually does vs what people claim\n→ Who it's really for (and who should skip it)\n→ The one feature that makes it worth your time\n\nNo hype. Just facts.",cta:"Save this thread before the algorithm buries it. What's your experience with {topic}? Drop it below 👇"},{hook:"🤯 Everyone's talking about {topic} but using it completely wrong. Here's what the top 1% actually do 🧵",body:"Hot take: {topic} isn't the problem. How people use it is.\n\nMost people:\n→ Jump in without a strategy\n→ Copy what worked for others\n→ Give up after 2 weeks\n\nThe ones winning with {topic} do the opposite of all three.",cta:"Follow for more {topic} insights. Repost if this helped someone you know 🔁"}],
  finance:[{hook:"💰 The {topic} truth nobody wants to hear — but everyone needs to. Thread 🧵",body:"I used to ignore everything about {topic}. Big mistake.\n\nHere's the 3-part framework that changed my financial thinking:\n\nPart 1: Why your current approach isn't working\nPart 2: What actually moves the needle\nPart 3: The one daily habit that makes it automatic\n\nSimple. Not easy. But it works.",cta:"Bookmark this. Your future self will thank you. Questions about {topic}? Ask below 💬"}],
  motivation:[{hook:"🔥 {topic} changed my life. Here's the uncomfortable truth I wish someone told me earlier 👇",body:"Nobody talks about the hard part of {topic}.\n\nEveryone shows you the highlight reel.\nNobody shows you:\n→ The 6 months of zero results\n→ The self-doubt at 2am\n→ The moment you almost quit\n\nThe gap between where you are and where you want to be is just consistency + time.",cta:"Save this for when you need it most. Who else needs to see this? Tag them 👇"}],
  fitness:[{hook:"💪 {topic} truth that most fitness influencers won't tell you because it's bad for business 🧵",body:"I've trained for 5 years. Here's what I wish I knew on day 1 about {topic}:\n\n→ Consistency > intensity (always)\n→ Sleep and food matter more than your workout program\n→ The best exercise is the one you'll actually do\n→ Progress is not linear — embrace the messy middle\n\nThat's it. That's the secret.",cta:"Save this for your next gym session. What's your biggest {topic} struggle? Drop it below 💬"}],
  business:[{hook:"🚀 {topic} strategy that built real businesses — not guru theory. Breaking it down honestly 🧵",body:"Most {topic} advice online is recycled nonsense.\n\nHere's what I've actually seen work:\n\n→ Focus on one thing until it works before adding more\n→ Distribution beats product every single time\n→ Your first 100 customers teach you more than any course\n→ Revenue solves most problems. Get to revenue fast.\n\nSimple. Boring. Effective.",cta:"Bookmark this for your next {topic} decision. What's the best business lesson you've learned? 👇"}],
  crypto:[{hook:"⚡ {topic} reality check — cutting through the hype to what actually matters 🧵",body:"The {topic} space is full of noise. Here's the signal:\n\n→ Ignore the 10x promises\n→ Understand what you own before you buy it\n→ Size your position so you can sleep at night\n→ The best time to have a plan is before you need it\n\nNot financial advice. Common sense advice.",cta:"Save this for the next {topic} hype cycle. What's your most important {topic} lesson? 👇"}],
  india:[{hook:"🇮🇳 Hot take about {topic} in India that nobody in this space is saying out loud 🧵",body:"The Indian context for {topic} is completely different from the Western playbook.\n\nHere's what actually works here:\n\n→ Vernacular content beats English every time\n→ Tier 2 and 3 cities are the real opportunity\n→ Mobile-first is not optional, it's the only reality\n→ Trust and relationships close more deals than funnels\n\nPlay to your actual strengths.",cta:"Drop your city below 👇 Would love to know where you're building from. Repost if you agree 🔁"}],
};

const BIO_FALLBACKS = {
  creator:["🎬 Creating content about {topic} that actually helps\n{niche} | Follow for real insights 📱","✨ {niche} creator | Sharing honest takes on {topic} daily\n📩 Collab? DM me","📱 Making {topic} simple for {audience}\n{niche} | Building in public 🔗"],
  business:["💼 {topic} | Helping {audience} get results\n{niche} | DM to work together 📊","🚀 Building in the {topic} space\n{niche} | Sharing the journey openly ✦","📈 {topic} insights daily | {niche}\n💡 Follow if you're serious about growing"],
  personal:["🌟 Documenting my {topic} journey\n{niche} | Sharing wins AND losses 📌","💭 Thinking out loud about {topic}\n{niche} enthusiast | No fluff, just real talk","☕ Sharing what I learn about {topic} so you don't have to\n✨ {niche} | Building slowly"],
  minimal:["{topic} | {niche}\nThreads daily 🧵","✦ {niche} | {topic}\nFollow for real insights","{topic} obsessed\n{niche} creator 📌"],
  bold:["🔥 {topic} is my obsession and it shows\n{niche} | Controversial takes welcome 👊","⚡ Hot takes on {topic} every day\n{niche} | If it offends you, good 🧵","💀 Saying the {topic} things nobody else will\n{niche} | Real > Polished"],
};

const HOOK_FALLBACKS = {
  general:["📌 {topic} is not what you think it is. Thread incoming 🧵","Hot take: everyone's approach to {topic} is completely backwards","✦ I spent 100 hours studying {topic}. Here's everything in 3 threads","The {topic} conversation nobody in this space is having right now","🌟 {topic} changed my perspective more than anything else this year"],
  tech:["🤯 {topic} just changed everything and most people still don't know","Hot take: {topic} is the most underrated thing in tech right now","I tested {topic} for 30 days. The results were not what I expected","⚡ The {topic} feature everyone sleeps on until they finally try it","Nobody is talking about how {topic} is quietly reshaping the industry"],
  finance:["💰 The {topic} thing I wish someone told me at 20","Unpopular money opinion: {topic} matters more than your salary","📈 {topic} strategy that actually works (and isn't on YouTube)","The honest truth about {topic} that financial influencers skip","I went from broke to understanding {topic}. Here's what changed 🧵"],
  fitness:["💪 {topic} truth that fitness influencers won't say — bad for business","Hot take: you're overcomplicating {topic} and it's killing your results","🏋️ I trained wrong for 2 years because of {topic} myths. Here's the fix","The {topic} advice that actually changed my physique (not what you think)","⚡ Stop doing {topic} the way everyone does it. Here's why 🧵"],
  motivation:["🔥 {topic} truth that hits different at 2am","Nobody talks about the dark side of {topic}. I will.","The {topic} mindset shift that changed my entire life trajectory","💡 I stopped doing {topic} the 'right' way and everything improved","Real talk about {topic}: what the motivational speakers never say"],
  business:["📊 Unpopular {topic} opinion that most gurus are too scared to say","🚀 {topic} strategy that actually built real businesses — not theory","The {topic} mistake that kills 90% of startups in year one","Hot take: everything you've been told about {topic} is wrong","💼 I studied 100 successful {topic} examples. Here's the pattern 🧵"],
  crypto:["⚡ {topic} reality check — cutting through the noise to what matters","The {topic} cycle is predictable. Here's exactly what comes next 🧵","Hot take: most {topic} advice will make you lose money","🔴 I lost money ignoring this about {topic}. Don't make my mistake","What the {topic} whales do that retail never figures out 👇"],
  india:["🇮🇳 Hot take about {topic} in India nobody is saying out loud","The Indian {topic} opportunity that most people are completely missing","Why {topic} hits different in India vs the Western playbook 🧵","Desi take on {topic}: here's what actually works in the Indian market","🔥 {topic} insights for Indian creators that the gurus won't tell you"],
};

async function askGemini(prompt) {
  const now = Date.now();
  if (now - lastCallRef.current < 3000) await new Promise(r => setTimeout(r, 3000-(now-lastCallRef.current)));
  lastCallRef.current = Date.now();
  try {
    const r = await fetch(AI, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ messages:[{ role:"user", content:prompt }] }) });
    if (!r.ok) return "";
    const d = await r.json();
    return d.content?.[0]?.text || "";
  } catch { return ""; }
}

function parseJSON(text) {
  try { const clean=text.replace(/```json|```/g,"").trim(); const match=clean.match(/(\[[\s\S]*\]|\{[\s\S]*\})/); return JSON.parse(match?match[1]:clean); } catch { return null; }
}

function ToolCard({ title, icon, children }) {
  return (
    <div style={{maxWidth:"700px",margin:"0 auto",padding:"20px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
        <span style={{fontSize:"20px"}}>{icon}</span>
        <h2 style={{fontSize:"18px",fontWeight:"900",color:"#fff",margin:0}}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function GlassCard({ children, style={} }) {
  return <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"20px",...style}}>{children}</div>;
}

function GenButton({ onClick, loading, label="✦ Generate" }) {
  return (
    <button onClick={onClick} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.6)",background:loading?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.15)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":"0 0 24px rgba(124,58,237,0.4)",transition:"all 0.3s",opacity:loading?0.6:1}}>
      {loading?"Generating…":label}
    </button>
  );
}

function NichePills({ niches, active, onSelect }) {
  return (
    <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
      {niches.map(n=>{const isActive=active===n.toLowerCase();return <button key={n} onClick={()=>onSelect(n.toLowerCase())} style={{padding:"5px 12px",borderRadius:"99px",border:`1.5px solid ${isActive?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.1)"}`,background:isActive?"rgba(255,255,255,0.1)":"transparent",color:isActive?"#fff":"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>{n}</button>;})}
    </div>
  );
}

function Skeleton({ lines=3 }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {Array(lines).fill(0).map((_,i)=>(
        <GlassCard key={i}><div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          <div style={{height:"12px",borderRadius:"6px",background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite",width:"40%"}}/>
          <div style={{height:"14px",borderRadius:"6px",background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>
          <div style={{height:"14px",borderRadius:"6px",background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite",width:"70%"}}/>
        </div></GlassCard>
      ))}
      <style>{`@keyframes shimmer{to{background-position:-200% 0}}`}</style>
    </div>
  );
}

export function ThreadsGenerator() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("general");
  const [tone, setTone] = useState("thought-provoking");
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [format, setFormat] = useState("medium");
  const niches = ["General","Tech","Finance","Motivation","Business","Health","Relationships","Fitness","Productivity","Crypto","Career","Mindset","India","Startup","Gaming","Bollywood","Food","Travel","Parenting","Self-improvement","Marketing","Leadership","Sales","AI","Creator Economy"];
  const tones = ["Thought-provoking","Controversial","Storytelling","Educational","Motivational","Raw & honest"];

  const getFallback = (topic, niche) => {
    const pool = THREAD_FALLBACKS[niche] || THREAD_FALLBACKS.general;
    const t = pool[Math.floor(Math.random()*pool.length)];
    const fill = s => filterBad(s.replace(/{topic}/g, topic));
    return { hook:fill(t.hook), body:fill(t.body), cta:fill(t.cta) };
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setThread(null);
    const limits = {short:{h:"100-180",b:"150-280",c:"80-150"},medium:{h:"150-280",b:"300-450",c:"100-200"},long:{h:"200-280",b:"500-700",c:"150-250"}}; const lim = limits[format]||limits.medium; const text = await askGemini(`Write a 3-part Threads thread on: "${filterBad(topic)}" niche: ${niche} tone: ${tone} format: ${format}. Thread 1 Hook: ${lim.h} chars, emoji opener, ends with 👇 or 🧵. Thread 2 Body: ${lim.b} chars, main value, use line breaks, ${format==="long"?"go deep with examples and story":"be concise and punchy"}. Thread 3 CTA: ${lim.c} chars. Like a real Indian creator. Return ONLY valid JSON: {"hook":"...","body":"...","cta":"..."}`);
    const parsed = parseJSON(text);
    setThread((parsed && parsed.hook) ? parsed : getFallback(topic, niche));
    setLoading(false);
  };

  const copyPart = (text, idx) => { navigator.clipboard.writeText(text); setCopied(idx); setTimeout(()=>setCopied(null),2000); };
  const copyAll = () => { if(!thread) return; navigator.clipboard.writeText(`${thread.hook}\n\n---\n\n${thread.body}\n\n---\n\n${thread.cta}`); setCopied("all"); setTimeout(()=>setCopied(null),2000); };
  const parts = thread ? [{label:"Thread 1 — Hook",text:thread.hook,emoji:"🎣",accent:"#a78bfa"},{label:"Thread 2 — Body",text:thread.body,emoji:"📖",accent:"rgba(255,255,255,0.35)"},{label:"Thread 3 — CTA",text:thread.cta,emoji:"📢",accent:"#34d399"}] : [];

  return (
    <ToolCard title="Thread Generator" icon="🧵">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>TOPIC</div>
        <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="e.g. consistency, building wealth, AI tools, morning routine" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
        <div style={{marginBottom:"14px"}}><NichePills niches={niches} active={niche} onSelect={setNiche}/></div>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>TONE</div>
        <div style={{marginBottom:"14px"}}><NichePills niches={tones} active={tone} onSelect={setTone}/></div>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>FORMAT</div>
        <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
          {["Short","Medium","Long"].map(f=>(
            <button key={f} onClick={()=>setFormat(f.toLowerCase())} style={{flex:1,padding:"8px",borderRadius:"10px",border:`1.5px solid ${format===f.toLowerCase()?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.1)"}`,background:format===f.toLowerCase()?"rgba(255,255,255,0.1)":"transparent",color:format===f.toLowerCase()?"#fff":"rgba(255,255,255,0.5)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
              {f} {f==="Short"?"(280 chars)":f==="Medium"?"(500 chars)":"(800 chars)"}
            </button>
          ))}
        </div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Thread"/>
      </GlassCard>
      {loading && <Skeleton lines={3}/>}
      {!loading && thread && (
        <>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"10px"}}>
            <button onClick={copyAll} style={{padding:"7px 18px",borderRadius:"99px",border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.06)",color:copied==="all"?C.success:"rgba(255,255,255,0.7)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>{copied==="all"?"✓ Copied All":"Copy All 3 Threads"}</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {parts.map((part,i)=>(
              <GlassCard key={i} style={{borderLeft:`3px solid ${part.accent}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                  <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>{part.emoji} {part.label}</div>
                  <button onClick={()=>copyPart(part.text,i)} style={{padding:"5px 12px",borderRadius:"99px",border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.05)",color:copied===i?C.success:"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>{copied===i?"✓ Copied":"Copy"}</button>
                </div>
                <div style={{fontSize:"14px",color:"rgba(255,255,255,0.85)",lineHeight:1.7,whiteSpace:"pre-line"}}>{part.text}</div>
                <div style={{marginTop:"10px",fontSize:"11px",color:C.muted}}>{part.text.length} chars</div>
              </GlassCard>
            ))}
          </div>
          <GlassCard style={{marginTop:"12px",borderLeft:"3px solid rgba(255,255,255,0.2)"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.4)",marginBottom:"6px"}}>🧵 PRO TIP</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>Post all 3 as replies within 2 minutes. No links in thread 1 — kills reach. Best time: 8–10 PM IST. Reply to every comment in the first hour to boost distribution.</div>
          </GlassCard>
        </>
      )}
    </ToolCard>
  );
}

export function ThreadsBio() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [style, setStyle] = useState("creator");
  const [bios, setBios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const styles = ["Creator","Business","Personal","Minimal","Bold"];

  const getFallback = (topic, niche, audience, style) => {
    const pool = BIO_FALLBACKS[style] || BIO_FALLBACKS.creator;
    return pool.map(t => filterBad(t.replace(/{topic}/g,topic||"content").replace(/{niche}/g,niche||"creator").replace(/{audience}/g,audience||"everyone")));
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setBios([]);
    const text = await askGemini(`Write 3 Threads bio options for a ${style} about: "${filterBad(topic)}"${niche?` niche: ${niche}`:""}${audience?` audience: ${audience}`:""}.  Max 150 chars each. 1-2 lines. 1-3 emojis. Real Indian creator voice. Return ONLY a valid JSON array of 3 strings.`);
    const parsed = parseJSON(text);
    setBios((parsed && Array.isArray(parsed) && parsed.length) ? parsed : getFallback(topic, niche, audience, style));
    setLoading(false);
  };

  return (
    <ToolCard title="Bio Writer" icon="✍️">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"}}>
          <div><div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>MAIN TOPIC *</div><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. AI tools, fitness, money" style={{width:"100%",padding:"10px 14px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"13px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>
          <div><div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE / LABEL</div><input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="e.g. Tech creator, Finance" style={{width:"100%",padding:"10px 14px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"13px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>TARGET AUDIENCE</div><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="e.g. Indian startup founders, fitness beginners" style={{width:"100%",padding:"10px 14px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"13px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/></div>
        </div>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>BIO STYLE</div>
        <div style={{marginBottom:"16px"}}><NichePills niches={styles} active={style} onSelect={setStyle}/></div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Bios"/>
      </GlassCard>
      {loading && <Skeleton lines={3}/>}
      {!loading && bios.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {bios.map((bio,i)=>(
            <GlassCard key={i} style={{cursor:"pointer"}} onClick={()=>{navigator.clipboard.writeText(bio);setCopied(i);setTimeout(()=>setCopied(null),2000);}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase"}}>Option {i+1}</div>
                <div style={{fontSize:"11px",color:copied===i?C.success:C.muted,fontWeight:"600"}}>{copied===i?"✓ Copied":"Copy"}</div>
              </div>
              <div style={{fontSize:"14px",color:"rgba(255,255,255,0.85)",lineHeight:1.7,whiteSpace:"pre-line"}}>{bio}</div>
              <div style={{marginTop:"8px",fontSize:"11px",color:bio.length>150?C.danger:C.muted}}>{bio.length}/150 chars {bio.length>150?"⚠️ Too long":"✓ Good"}</div>
            </GlassCard>
          ))}
        </div>
      )}
    </ToolCard>
  );
}

export function ThreadsHook() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("general");
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const [format, setFormat] = useState("medium");
  const niches = ["General","Tech","Finance","Motivation","Business","Health","Relationships","Fitness","Productivity","Crypto","Career","Mindset","India","Startup","Gaming","Bollywood","Food","Travel","Parenting","Self-improvement","Marketing","Leadership","Sales","AI","Creator Economy"];

  const getFallback = (topic, niche) => {
    const pool = HOOK_FALLBACKS[niche] || HOOK_FALLBACKS.general;
    return [...pool].sort(()=>Math.random()-0.5).slice(0,5).map(h => filterBad(h.replace(/{topic}/g, topic)));
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setHooks([]);
    const text = await askGemini(`Write 5 Threads hooks for: "${filterBad(topic)}" niche: ${niche}. Max 200 chars each. Mix: question, hot take, story opener, stat, unpopular opinion. Real creator voice. Some end with 🧵 or 👇. Return ONLY a valid JSON array of 5 strings.`);
    const parsed = parseJSON(text);
    setHooks((parsed && Array.isArray(parsed) && parsed.length) ? parsed : getFallback(topic, niche));
    setLoading(false);
  };

  return (
    <ToolCard title="Hook Generator" icon="🪝">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>TOPIC</div>
        <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="e.g. discipline, investing, morning routines, ChatGPT" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
        <div style={{marginBottom:"16px"}}><NichePills niches={niches} active={niche} onSelect={setNiche}/></div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Hooks"/>
      </GlassCard>
      {loading && <Skeleton lines={5}/>}
      {!loading && hooks.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {hooks.map((h,i)=>(
            <GlassCard key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px",cursor:"pointer"}} onClick={()=>{navigator.clipboard.writeText(h);setCopied(i);setTimeout(()=>setCopied(null),2000);}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"800",color:"rgba(255,255,255,0.6)",flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,fontSize:"14px",color:"rgba(255,255,255,0.85)",lineHeight:1.6}}>{h}</div>
              <div style={{fontSize:"11px",color:copied===i?C.success:C.muted,fontWeight:"600",flexShrink:0}}>{copied===i?"✓ Copied":"Copy"}</div>
            </GlassCard>
          ))}
          <GlassCard style={{borderLeft:"3px solid rgba(255,255,255,0.2)"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.4)",marginBottom:"6px"}}>🧵 TIP</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>No links in hooks — kills reach. Post 8–10 PM IST. Hot takes and questions get 3x more replies. Reply to every comment in the first hour.</div>
          </GlassCard>
        </div>
      )}
    </ToolCard>
  );
}
