import { useState } from "react";

const C = {
  orange:"#ff4500", glass:"rgba(255,255,255,0.04)",
  hairline:"rgba(255,255,255,0.08)", ink:"rgba(255,255,255,0.9)",
  muted:"rgba(255,255,255,0.4)", success:"#34d399", danger:"#f87171",
};
const AI = "https://sociomee.in/api/ai/generate";
let lastCall = 0;
const BAD_WORDS = ['fuck','shit','bitch','bastard','asshole','dick','pussy','cunt','whore','slut','nigger','faggot','chutiya','madarchod','bhenchod','saala','randi','harami','gaand','lund','gandu','mc','bc','mf','bomb','suicide','kill yourself','terrorist','terrorism','jihad','massacre','genocide','rape','child porn','cocaine','heroin','meth','porn','sex','naked','nude'];
function filterBad(text) { let t=text; BAD_WORDS.forEach(w=>{const re=new RegExp('\b'+w+'\b','gi');t=t.replace(re,'*'.repeat(w.length));}); return t; }

const TITLE_FALLBACKS = {
  general:["Why does nobody talk about the real impact of {topic}?","Just realized something about {topic} that changed how I see everything","Unpopular opinion: {topic} is actually more important than we give it credit for","Can we have an honest conversation about {topic} for once?","The thing about {topic} that took me years to understand"],
  tech:["Why is {topic} still not mainstream when it clearly works?","I tested {topic} for 30 days — here's what nobody tells you","Unpopular tech opinion: {topic} is overrated and here's proof","The {topic} feature everyone sleeps on until it's too late","Am I the only one who thinks {topic} is being completely misused?"],
  finance:["Why does nobody teach {topic} in school when it's this important?","I finally understood {topic} at 28. Here's what I wish I knew at 18.","Unpopular money opinion: {topic} matters more than your salary","The {topic} truth that financial advisors don't tell their clients","Can we talk about how nobody actually explains {topic} simply?"],
  india:["Why is the Indian approach to {topic} so different from the West?","The {topic} opportunity in India that everyone is sleeping on","Unpopular opinion: {topic} in India is actually better than people think","Can we talk about {topic} in the Indian context for once?","What's your experience with {topic} in India? Asking seriously."],
  startup:["Why do 90% of startups get {topic} completely wrong?","Hot take: {topic} is the #1 reason most Indian startups fail","I interviewed 50 founders about {topic}. Here's what I found.","The {topic} advice that actually helped vs what everyone says","Can we have a real conversation about {topic} without the startup BS?"],
  gaming:["Why is {topic} so underrated in the gaming community?","Unpopular gaming opinion: {topic} is actually the best thing to happen to the industry","The {topic} debate we need to have but nobody wants to start","Am I the only one who thinks {topic} changed gaming forever?","Can we talk about {topic} without the usual toxicity?"],
  fitness:["Why does nobody talk about the mental side of {topic}?","I tried {topic} for 90 days. Here's the honest truth.","Unpopular fitness opinion: {topic} is overhyped by influencers","The {topic} mistake I see everyone making at the gym","Can we stop pretending {topic} is harder than it actually is?"],
  crypto:["Why is everyone so emotional about {topic} when the math is clear?","Hot take: {topic} is the most misunderstood thing in crypto right now","I lost money ignoring {topic}. Here's what I learned.","The {topic} signal that most retail investors completely miss","Can we have a rational conversation about {topic} without the shilling?"],
};

const SUBREDDIT_FALLBACKS = {
  discussion:[{name:"r/india",members:"1.2M members",reason:"Perfect for Indian-context discussions. Very active, opinionated community.",tip:"Be specific about the Indian angle. Generic posts get downvoted.",difficulty:"Moderate"},{name:"r/AskIndia",members:"450K members",reason:"Question-format posts do extremely well here. Great for genuine curiosity.",tip:"Frame as a genuine question. Community rewards authenticity over promotion.",difficulty:"Beginner friendly"},{name:"r/learnprogramming",members:"3.8M members",reason:"Supportive community for all skill levels. Questions always welcome.",tip:"Show what you've already tried. Include error messages and code snippets.",difficulty:"Beginner friendly"},{name:"r/personalfinance",members:"18M members",reason:"Massive engaged audience for finance content. High karma potential.",tip:"Read the wiki first. Follow strict posting rules. Be specific.",difficulty:"Moderate"},{name:"r/entrepreneur",members:"1.5M members",reason:"Startup and business stories perform well. Loves real founder experiences.",tip:"Share actual lessons learned. No vague inspiration. Numbers win here.",difficulty:"Moderate"},{name:"r/IndiaInvestments",members:"280K members",reason:"Serious finance discussions for Indian context. High-quality audience.",tip:"No self-promotion. Data and analysis rewarded. Cite sources.",difficulty:"Strict"}],
  feedback:[{name:"r/roastmystartup",members:"85K members",reason:"Brutally honest feedback from experienced founders and builders.",tip:"Be thick-skinned. Present your actual product, not a pitch. Ask specific questions.",difficulty:"Beginner friendly"},{name:"r/SideProject",members:"165K members",reason:"Supportive community for side projects. Launch posts do well.",tip:"Tell the story of how you built it. Include a demo link. Engage every comment.",difficulty:"Beginner friendly"},{name:"r/webdev",members:"1.2M members",reason:"Great for web projects. Loves showcase posts with technical details.",tip:"Include the tech stack. Share what you learned. Be ready for technical questions.",difficulty:"Moderate"},{name:"r/startups",members:"1.1M members",reason:"Entrepreneurs who give real feedback. Great for early-stage validation.",tip:"No pure promotion. Frame as a journey or lesson. Ask for specific input.",difficulty:"Moderate"},{name:"r/IndiaTech",members:"180K members",reason:"Indian tech community. Great for India-specific product feedback.",tip:"Mention if it's built for Indian market. Community loves local solutions.",difficulty:"Beginner friendly"},{name:"r/alphaandbetausers",members:"12K members",reason:"Purpose-built for getting beta users and feedback.",tip:"Be clear about what stage you're at and what feedback you need most.",difficulty:"Beginner friendly"}],
};

const TIME_FALLBACKS = {
  general:{times:[{time:"9:00 AM – 12:00 PM EST",reason:"US morning peak — largest Reddit demographic active and fresh",score:95,day:"Mon–Thu"},{time:"7:00 PM – 10:00 PM EST",reason:"Evening browsing — users decompress after work",score:88,day:"All days"},{time:"10:00 AM – 1:00 PM IST",reason:"Indian Reddit users most active during late morning",score:82,day:"Weekdays"}],best_days:["Monday","Tuesday","Wednesday","Thursday"],avoid:["Saturday night","Sunday morning","Friday afternoon"],tip:"Post when a subreddit's moderators are online — typically morning EST. New posts need early upvotes to hit trending. Ask a question in the title for 40% more comments.",frequency:"1-2 posts per week per subreddit. Quality always beats quantity on Reddit."},
  india:{times:[{time:"10:00 AM – 1:00 PM IST",reason:"Indian morning browsing peak — most active Indian Redditors",score:94,day:"Weekdays"},{time:"8:00 PM – 11:00 PM IST",reason:"Evening peak — post-work Reddit session",score:91,day:"All days"},{time:"12:00 PM – 2:00 PM IST",reason:"Lunch break browsing — r/india spikes midday",score:85,day:"Weekdays"}],best_days:["Tuesday","Wednesday","Thursday"],avoid:["Monday morning","Weekend mornings"],tip:"For r/india, post in IST morning or evening. Political content performs best Tue–Thu. Use relatable Indian references in titles.",frequency:"2-3 posts per week across different subreddits."},
};

async function askGemini(prompt) {
  const now = Date.now();
  if (now - lastCall < 3000) await new Promise(r => setTimeout(r, 3000-(now-lastCall)));
  lastCall = Date.now();
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
      {niches.map(n=>{const key=n.toLowerCase();const isActive=active===key;return <button key={n} onClick={()=>onSelect(key)} style={{padding:"5px 12px",borderRadius:"99px",border:`1.5px solid ${isActive?"rgba(255,69,0,0.7)":"rgba(255,255,255,0.1)"}`,background:isActive?"rgba(255,69,0,0.15)":"transparent",color:isActive?"#fb923c":"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>{n}</button>;})}
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

export function RedditTitle() {
  const [topic, setTopic] = useState("");
  const [subreddit, setSubreddit] = useState("");
  const [niche, setNiche] = useState("general");
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const niches = ["General","Tech","Finance","Gaming","Science","Politics","AskReddit","TIFU","Life Advice","Relationships","Fitness","Startup","India","Crypto","Bollywood","Food","Travel","Parenting","Career","Mental Health","DIY","Photography","Music","Books","Sports","Movies","Anime","Cars","Pets","Nature"];

  const getFallback = (topic, niche) => {
    const pool = TITLE_FALLBACKS[niche] || TITLE_FALLBACKS.general;
    return [...pool].sort(()=>Math.random()-0.5).slice(0,5).map(t => filterBad(t.replace(/{topic}/g, topic)));
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setTitles([]);
    const text = await askGemini(`Write 5 Reddit post titles for: "${filterBad(topic)}"${subreddit?` for r/${subreddit.replace(/^r\//,"")}`:""}  niche: ${niche}. 60-200 chars. Mix: question, story, controversial, stat, community ask. Generate real discussion. No clickbait. No hashtags. Return ONLY a valid JSON array of 5 strings.`);
    const parsed = parseJSON(text);
    setTitles((parsed && Array.isArray(parsed) && parsed.length) ? parsed : getFallback(topic, niche));
    setLoading(false);
  };

  return (
    <ToolCard title="Post Title Generator" icon="📝">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>TOPIC / IDEA</div>
        <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="e.g. working from home, Indian startup culture, crypto losses" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"12px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>TARGET SUBREDDIT (optional)</div>
        <input value={subreddit} onChange={e=>setSubreddit(e.target.value)} placeholder="e.g. r/india, r/personalfinance, r/learnprogramming" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
        <div style={{marginBottom:"16px"}}><NichePills niches={niches} active={niche} onSelect={setNiche}/></div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Post Titles"/>
      </GlassCard>
      {loading && <Skeleton lines={5}/>}
      {!loading && titles.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {titles.map((title,i)=>(
            <GlassCard key={i} style={{cursor:"pointer",borderLeft:`3px solid ${i===0?"#ff4500":"rgba(255,255,255,0.08)"}`}} onClick={()=>{navigator.clipboard.writeText(title);setCopied(i);setTimeout(()=>setCopied(null),2000);}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(255,69,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"800",color:"#fb923c",flexShrink:0}}>{i+1}</div>
                <div style={{flex:1,fontSize:"14px",color:"rgba(255,255,255,0.85)",lineHeight:1.6,fontWeight:"500"}}>{title}</div>
                <div style={{fontSize:"11px",color:copied===i?C.success:C.muted,fontWeight:"600",flexShrink:0}}>{copied===i?"✓":"Copy"}</div>
              </div>
              <div style={{marginTop:"8px",marginLeft:"36px",fontSize:"10px",color:C.muted}}>{title.length} chars</div>
            </GlassCard>
          ))}
          <GlassCard style={{borderLeft:"3px solid #ff4500"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#fb923c",marginBottom:"6px"}}>🔴 REDDIT TIP</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>Questions get 40% more comments. Avoid starting with "I" — lower upvotes. Best time: 9 AM–12 PM EST weekdays. Always check subreddit rules first.</div>
          </GlassCard>
        </div>
      )}
    </ToolCard>
  );
}

export function RedditSubfinder() {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("discussion");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const goals = ["Discussion","Get feedback","Share content","Ask advice","Find community","Marketing"];

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setResults([]);
    const text = await askGemini(`Suggest 6 real subreddits for: "${filterBad(topic)}" goal: "${goal}". Return ONLY a valid JSON array of 6 objects: [{"name":"r/sub","members":"2.3M members","reason":"why it fits","tip":"one posting tip","difficulty":"Beginner friendly"}]. Difficulty: Beginner friendly, Moderate, or Strict. Real subreddits only.`);
    const parsed = parseJSON(text);
    setResults((parsed && Array.isArray(parsed) && parsed.length) ? parsed : (SUBREDDIT_FALLBACKS[goal] || SUBREDDIT_FALLBACKS.discussion));
    setLoading(false);
  };

  const diffColor = d => d?.toLowerCase().includes("beginner")?"#34d399":d?.toLowerCase().includes("strict")?"#f87171":"#f59e0b";

  return (
    <ToolCard title="Subreddit Finder" icon="🔍">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>YOUR TOPIC / CONTENT</div>
        <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="e.g. I built an AI startup in India, my crypto journey, fitness transformation" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>YOUR GOAL</div>
        <div style={{marginBottom:"16px"}}><NichePills niches={goals} active={goal} onSelect={setGoal}/></div>
        <GenButton onClick={generate} loading={loading} label="✦ Find Best Subreddits"/>
      </GlassCard>
      {loading && <Skeleton lines={6}/>}
      {!loading && results.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {results.map((sub,i)=>(
            <GlassCard key={i}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px",marginBottom:"10px"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap",marginBottom:"4px"}}>
                    <span style={{fontSize:"16px",fontWeight:"800",color:"#fb923c"}}>{sub.name}</span>
                    <span style={{fontSize:"10px",color:C.muted}}>{sub.members}</span>
                    <span style={{fontSize:"10px",fontWeight:"700",color:diffColor(sub.difficulty),background:`${diffColor(sub.difficulty)}18`,padding:"2px 8px",borderRadius:"99px",border:`1px solid ${diffColor(sub.difficulty)}33`}}>{sub.difficulty}</span>
                  </div>
                  <div style={{fontSize:"13px",color:"rgba(255,255,255,0.75)",lineHeight:1.5,marginBottom:"8px"}}>{sub.reason}</div>
                  <div style={{display:"flex",alignItems:"flex-start",gap:"6px",padding:"8px 10px",borderRadius:"8px",background:"rgba(255,69,0,0.08)",border:"1px solid rgba(255,69,0,0.2)"}}>
                    <span style={{fontSize:"11px",color:"#fb923c",fontWeight:"700",flexShrink:0}}>💡</span>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,0.65)"}}>{sub.tip}</span>
                  </div>
                </div>
                <button onClick={()=>{navigator.clipboard.writeText(sub.name);setCopied(i);setTimeout(()=>setCopied(null),2000);}} style={{padding:"6px 14px",borderRadius:"99px",border:"1px solid rgba(255,69,0,0.3)",background:"rgba(255,69,0,0.1)",color:copied===i?C.success:"#fb923c",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>{copied===i?"✓":"Copy"}</button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </ToolCard>
  );
}

export function RedditBestTime() {
  const [niche, setNiche] = useState("general");
  const [subreddit, setSubreddit] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const niches = ["general","tech","finance","gaming","science","politics","india","crypto","fitness","relationships","startup","askreddit","bollywood","food","travel","parenting","career","mental health","diy","music","books","sports","movies","anime","cars","pets","nature"];

  const analyze = async () => {
    setLoading(true); setResult(null);
    const text = await askGemini(`Best times to post on Reddit for niche: "${niche}"${subreddit?` for r/${subreddit.replace(/^r\//,"")}`:""}.  Return ONLY valid JSON no markdown: {"times":[{"time":"9:00 AM – 12:00 PM EST","reason":"reason","score":95,"day":"Mon–Fri"}],"best_days":["Monday"],"avoid":["Saturday night"],"tip":"specific Reddit tip","frequency":"X posts per week"} 3-4 time slots.`);
    const parsed = parseJSON(text);
    setResult((parsed && parsed.times) ? parsed : (TIME_FALLBACKS[niche] || TIME_FALLBACKS.general));
    setLoading(false);
  };

  const scoreColor = s => s>=90?"#34d399":s>=80?"#f59e0b":"#f87171";

  return (
    <ToolCard title="Best Time to Post" icon="⏰">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>SUBREDDIT (optional)</div>
        <input value={subreddit} onChange={e=>setSubreddit(e.target.value)} placeholder="e.g. r/india, r/personalfinance, r/entrepreneur" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
        <div style={{marginBottom:"16px"}}><NichePills niches={niches} active={niche} onSelect={setNiche}/></div>
        <GenButton onClick={analyze} loading={loading} label="✦ Analyze Best Times"/>
      </GlassCard>
      {loading && <Skeleton lines={4}/>}
      {!loading && result && (
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <GlassCard>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>🕐 Best Times (EST)</div>
            {result.times?.map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",marginBottom:"8px"}}>
                <div style={{fontSize:"20px",fontWeight:"900",color:scoreColor(t.score),minWidth:"36px",textAlign:"center"}}>{t.score}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",marginBottom:"2px"}}>{t.time} <span style={{fontSize:"10px",color:C.muted}}>· {t.day}</span></div>
                  <div style={{fontSize:"11px",color:C.muted}}>{t.reason}</div>
                </div>
                <div style={{width:"5px",height:"36px",borderRadius:"99px",background:scoreColor(t.score),opacity:0.7}}/>
              </div>
            ))}
          </GlassCard>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <GlassCard>
              <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>✅ Best Days</div>
              {result.best_days?.map((d,i)=><div key={i} style={{fontSize:"13px",color:"#34d399",fontWeight:"600",marginBottom:"4px"}}>• {d}</div>)}
            </GlassCard>
            <GlassCard>
              <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>❌ Avoid</div>
              {result.avoid?.map((d,i)=><div key={i} style={{fontSize:"11px",color:"#f87171",fontWeight:"600",marginBottom:"4px"}}>• {d}</div>)}
            </GlassCard>
          </div>
          <GlassCard style={{borderLeft:"3px solid #ff4500"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#fb923c",marginBottom:"6px"}}>🔴 REDDIT PRO TIP</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,0.8)",lineHeight:1.6,marginBottom:"8px"}}>{result.tip}</div>
            <div style={{fontSize:"12px",color:C.muted}}>📅 <span style={{color:"#fb923c",fontWeight:"700"}}>{result.frequency}</span></div>
          </GlassCard>
        </div>
      )}
    </ToolCard>
  );
}
