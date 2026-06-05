import { useState } from "react";

const C = {
  purple:"#a78bfa", teal:"#2aabee", glass:"rgba(255,255,255,0.04)",
  hairline:"rgba(255,255,255,0.08)", ink:"rgba(255,255,255,0.9)",
  muted:"rgba(255,255,255,0.4)", success:"#34d399", danger:"#f87171",
};


const BAD_WORDS = ['fuck','shit','bitch','bastard','asshole','nigger','faggot','chutiya','madarchod','bhenchod','randi','harami','gandu','motherfucker','child porn','cocaine','heroin','meth','jihad','massacre','genocide','bomb','suicide','how to kill','terrorist','explosive','drug deal','buy guns','illegal weapons','human trafficking','rape','molest','hack into','ransomware','darkweb','money laundering','assassination'];

function filterText(text) {
  let t = text;
  BAD_WORDS.forEach(w => {
    const re = new RegExp(w, 'gi');
    t = t.replace(re, '*'.repeat(w.length));
  });
  return t;
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
  return (
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"20px",...style}}>
      {children}
    </div>
  );
}

function GenButton({ onClick, loading, label="✦ Generate" }) {
  return (
    <button onClick={onClick} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.6)",background:loading?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.15)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":"0 0 24px rgba(124,58,237,0.4)",transition:"all 0.3s",opacity:loading?0.6:1}}>
      {loading ? "Generating..." : label}
    </button>
  );
}

// ── Hook Generator ────────────────────────────────────────────────────
const HOOK_TEMPLATES = {
  crypto: [
    "⚡ {topic} just happened. Here's what every crypto holder MUST know right now...",
    "🚨 BREAKING: {topic} — This changes everything for your portfolio",
    "They don't want you to know about {topic}. Read this before it's deleted 👇",
    "I lost ₹2 lakhs ignoring this about {topic}. Don't make my mistake.",
    "📈 {topic} is the biggest opportunity of 2024. Here's exactly how to play it 👇",
  ],
  news: [
    "🔴 JUST IN: {topic} — Full story inside",
    "Everyone is talking about {topic} but nobody is telling you the real truth 👇",
    "⚠️ {topic}: What the mainstream media is hiding from you",
    "Breaking: {topic} — And it affects YOU directly. Here's how 👇",
    "The truth about {topic} that changed everything we thought we knew 🧵",
  ],
  tech: [
    "🤯 {topic} just broke the internet. Here's why it matters to you",
    "This {topic} trick saves me 3 hours every day. Sharing it for free 👇",
    "Engineers at big tech companies are scared of {topic}. Here's why 🧵",
    "⚡ {topic} is changing everything. Early adopters will win big.",
    "Nobody talks about {topic} honestly. Let me be the first 👇",
  ],
  finance: [
    "💰 {topic} — The wealth secret the rich don't want you to know",
    "I studied {topic} for 100 hours. Here's everything in 2 minutes 👇",
    "⚠️ {topic} alert: Your money is at risk if you don't read this",
    "How {topic} made someone ₹10 lakh in 30 days (legally) 📈",
    "The {topic} strategy that changed my financial life forever 🧵",
  ],
  entertainment: [
    "😱 {topic} — Nobody saw this coming. Full scoop inside 👇",
    "The real story behind {topic} that they don't show on TV 🎬",
    "🔥 {topic} just went viral and here's the full breakdown",
    "Exclusive: {topic} — The inside story 👀",
    "Plot twist: {topic} is not what you think it is 🧵",
  ],
  sports: [
    "🏆 {topic} — The moment that changed Indian sports forever",
    "Inside story: {topic} revealed by someone who was there 👇",
    "⚡ {topic} — Stats, analysis and what happens next 🧵",
    "The truth about {topic} that commentators won't tell you 🏏",
    "🔥 {topic}: Complete breakdown for real fans only 👇",
  ],
  motivation: [
    "I was broke at 22. {topic} changed my life. Here's what I learned 👇",
    "⚡ {topic} — The mindset shift that 99% of people miss",
    "Most people fail at {topic} because of this one mistake 🧵",
    "The {topic} truth nobody wants to hear (but everyone needs) 👇",
    "5 years ago I discovered {topic}. Today I share everything for free 🎯",
  ],
  general: [
    "🔥 {topic} — You need to see this right now 👇",
    "Everyone is wrong about {topic}. Here's the truth 🧵",
    "⚡ {topic} changes everything. Read before it's gone.",
    "The {topic} secret that nobody talks about openly 👀",
    "I wish I knew this about {topic} 5 years ago. Sharing now 👇",
  ],
};

export function TelegramHookGenerator() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("general");
  const [hooks, setHooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const generate = () => {
    if (!topic.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const templates = HOOK_TEMPLATES[niche.toLowerCase()] || HOOK_TEMPLATES.general;
      const shuffled = [...templates].sort(() => Math.random() - 0.5);
      const generated = shuffled.slice(0, 5).map(t => filterText(t.replace("{topic}", topic)));
      setHooks(generated);
      setLoading(false);
    }, 800);
  };

  const niches = ["General","Crypto","News","Tech","Finance","Entertainment","Sports","Education","Motivation","Stock Market","Gaming","Bollywood","Business","Politics","Astrology"];

  return (
    <ToolCard title="Hook Generator" icon="🪝">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>TOPIC</div>
        <input value={topic} onChange={e=>setTopic(filterText(e.target.value))} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="e.g. Bitcoin crash, IPL 2024, AI jobs"
          style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"12px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"16px"}}>
          {niches.map(n=>(
            <button key={n} onClick={()=>setNiche(n.toLowerCase())} style={{padding:"5px 12px",borderRadius:"99px",border:`1.5px solid ${niche===n.toLowerCase()?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.1)"}`,background:niche===n.toLowerCase()?"rgba(124,58,237,0.15)":"transparent",color:niche===n.toLowerCase()?"#c4b5fd":"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>
              {n}
            </button>
          ))}
        </div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Hooks"/>
      </GlassCard>
      {hooks.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {hooks.map((h,i)=>(
            <GlassCard key={i} style={{display:"flex",alignItems:"flex-start",gap:"12px",cursor:"pointer"}} onClick={()=>{navigator.clipboard.writeText(h);setCopied(i);setTimeout(()=>setCopied(null),2000);}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"rgba(124,58,237,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"800",color:"#a78bfa",flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,fontSize:"14px",color:"rgba(255,255,255,0.85)",lineHeight:1.6}}>{h}</div>
              <div style={{fontSize:"11px",color:copied===i?C.success:C.muted,fontWeight:"600",flexShrink:0}}>{copied===i?"✓ Copied":"Copy"}</div>
            </GlassCard>
          ))}
        </div>
      )}
    </ToolCard>
  );
}

// ── Poll Generator ────────────────────────────────────────────────────
const POLL_TEMPLATES = {
  crypto: [
    {q:"Bitcoin will hit $1 lakh by end of 2024?",opts:["Yes, definitely 🚀","No, bear market 📉","Maybe by 2025 🤔","BTC is dead 💀"]},
    {q:"Which crypto will 10x first?",opts:["Bitcoin (BTC)","Ethereum (ETH)","Solana (SOL)","Altcoins 🎰"]},
    {q:"Are you buying this crypto dip?",opts:["Already bought! 💪","Waiting for lower","Too scared 😰","Already lost money"]},
  ],
  bollywood: [
    {q:"Who is the real King of Bollywood right now?",opts:["Shah Rukh Khan 👑","Salman Khan 💪","Ranveer Singh 🔥","The OTT era killed kings"]},
    {q:"Best Bollywood movie of 2024?",opts:["Animal 🐯","Stree 2 👻","Fighter ✈️","None impressed me"]},
    {q:"Nepotism in Bollywood - your take?",opts:["It's real and unfair 😤","Talent wins always","Mixed - both exist","Don't care about it"]},
  ],
  sports: [
    {q:"India will win the next World Cup?",opts:["100% Yes! 🏆","Possible but tough","No chance 😬","Don't follow cricket"]},
    {q:"Greatest Indian cricketer of all time?",opts:["Sachin Tendulkar 🐐","Virat Kohli 🔥","MS Dhoni 🧢","Someone else"]},
    {q:"IPL or International Cricket - which do you prefer?",opts:["IPL all day! 💰","International is real","Both equally","Not a cricket fan"]},
  ],
  general: [
    {q:"What's your biggest financial goal right now?",opts:["Buy a house 🏠","Start a business 💼","Travel the world ✈️","Financial freedom 💰"]},
    {q:"How do you consume news?",opts:["Telegram channels 📱","Instagram/YouTube","TV & newspapers","I avoid news"]},
    {q:"Biggest challenge of your generation?",opts:["Jobs & career 💼","Inflation & cost 💸","Mental health 🧠","Relationships ❤️"]},
  ],
  tech: [
    {q:"AI will replace your job in 10 years?",opts:["Yes, I'm worried 😰","No, humans will adapt","Already replacing some","My job is AI-proof 💪"]},
    {q:"iPhone vs Android - final answer?",opts:["iPhone forever 🍎","Android master race 🤖","Both have pros & cons","Phone doesn't matter"]},
    {q:"Best tech investment right now?",opts:["AI companies 🤖","Semiconductor stocks","Indian IT sector","Avoid tech stocks"]},
  ],
};

export function TelegramPollGenerator() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("general");
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const generate = () => {
    if (!topic.trim() && !niche) return;
    setLoading(true);
    setTimeout(() => {
      const pool = POLL_TEMPLATES[niche] || POLL_TEMPLATES.general;
      const extra = [
        {q:`What do you think about ${topic}?`,opts:["Very positive 🔥","Somewhat positive 👍","Neutral 😐","Negative 👎"]},
        {q:`${topic} — overhyped or underrated?`,opts:["Totally overhyped 🙄","Slightly overhyped","Fairly valued","Very underrated 💎"]},
        {q:`Will ${topic} impact your life in 2024?`,opts:["Yes, majorly 🎯","Somewhat yes","Not really","Not sure yet 🤔"]},
      ];
      const combined = [...pool, ...extra].sort(() => Math.random() - 0.5).slice(0, 3);
      setPolls(combined.map(p => ({question: p.q, options: p.opts})));
      setLoading(false);
    }, 800);
  };

  const copyPoll = (poll, i) => {
    const text = `📊 ${poll.question}\n\n${poll.options.map((o,j)=>`${["🅐","🅑","🅒","🅓"][j]} ${o}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(()=>setCopied(null),2000);
  };

  const niches = ["general","crypto","bollywood","sports","tech","finance","news","motivation"];

  return (
    <ToolCard title="Poll Generator" icon="📊">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>TOPIC (optional)</div>
        <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. cricket, crypto, jobs, AI"
          style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"12px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"16px"}}>
          {niches.map(n=>(
            <button key={n} onClick={()=>setNiche(n)} style={{padding:"5px 12px",borderRadius:"99px",border:`1.5px solid ${niche===n?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.1)"}`,background:niche===n?"rgba(124,58,237,0.15)":"transparent",color:niche===n?"#c4b5fd":"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>
              {n}
            </button>
          ))}
        </div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Polls"/>
      </GlassCard>
      {polls.length>0 && (
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          {polls.map((poll,i)=>(
            <GlassCard key={i}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
                <div style={{fontSize:"15px",fontWeight:"700",color:"#fff",lineHeight:1.4,flex:1}}>📊 {poll.question}</div>
                <button onClick={()=>copyPoll(poll,i)} style={{padding:"5px 12px",borderRadius:"99px",border:"1px solid rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.1)",color:copied===i?C.success:"#a78bfa",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",flexShrink:0,marginLeft:"12px"}}>
                  {copied===i?"✓ Copied":"Copy"}
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {poll.options?.map((opt,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                    <span style={{fontSize:"14px"}}>{["🅐","🅑","🅒","🅓"][j]}</span>
                    <span style={{fontSize:"13px",color:"rgba(255,255,255,0.75)"}}>{opt}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </ToolCard>
  );
}

// ── Best Time to Post ─────────────────────────────────────────────────
const BEST_TIMES = {
  india: {
    general: {
      times:[
        {time:"7:00 AM – 9:00 AM",reason:"Morning commute & chai time — high mobile usage",score:92,day:"Weekdays"},
        {time:"12:30 PM – 2:00 PM",reason:"Lunch break scrolling — people check phones during break",score:85,day:"Weekdays"},
        {time:"6:00 PM – 8:00 PM",reason:"Evening commute — peak Telegram activity in India",score:88,day:"Weekdays"},
        {time:"9:00 PM – 11:00 PM",reason:"Prime time — family done, personal phone time begins",score:97,day:"All days"},
        {time:"10:00 AM – 12:00 PM",reason:"Weekend leisure browsing — relaxed and engaged",score:90,day:"Weekends"},
      ],
      avoid:["2:00 AM – 6:00 AM","2:00 PM – 4:00 PM (office hours)"],
      best_days:["Tuesday","Wednesday","Thursday","Sunday"],
      worst_days:["Saturday morning","Monday morning"],
      tip:"Post in Hinglish for maximum reach. Indians respond 3x more to local language content mixed with English.",
      frequency:"2-3 posts per day for news/general. 1 post/day for analysis channels.",
    },
    crypto: {
      times:[
        {time:"8:00 AM – 9:00 AM",reason:"Pre-market check — crypto traders start their day early",score:95,day:"Weekdays"},
        {time:"3:30 PM – 5:00 PM",reason:"US market open time — huge volatility, high engagement",score:93,day:"Weekdays"},
        {time:"9:00 PM – 11:00 PM",reason:"Evening analysis time — when traders review positions",score:97,day:"All days"},
        {time:"12:00 AM – 1:00 AM",reason:"US market prime time — crypto never sleeps",score:88,day:"All days"},
      ],
      avoid:["4:00 AM – 7:00 AM","Sunday afternoon (low volume)"],
      best_days:["Monday","Tuesday","Wednesday","Thursday"],
      worst_days:["Sunday","Saturday afternoon"],
      tip:"Post during high volatility events (CPI data, Fed meetings). Breaking news gets 10x engagement on crypto channels.",
      frequency:"3-5 posts per day. Crypto audience expects frequent updates.",
    },
    bollywood: {
      times:[
        {time:"10:00 AM – 12:00 PM",reason:"Morning gossip time — entertainment news checks",score:88,day:"All days"},
        {time:"1:00 PM – 3:00 PM",reason:"Lunch time entertainment browsing",score:82,day:"Weekdays"},
        {time:"8:00 PM – 10:00 PM",reason:"Prime time TV hours — Bollywood fans most active",score:95,day:"All days"},
        {time:"11:00 AM – 1:00 PM",reason:"Weekend binge — perfect for longer posts",score:90,day:"Weekends"},
      ],
      avoid:["Early morning before 9 AM","Late night after midnight"],
      best_days:["Friday (movie releases)","Saturday","Sunday"],
      worst_days:["Monday morning","Tuesday"],
      tip:"Post during award shows, movie releases and controversy breaks. Timing is everything in entertainment channels.",
      frequency:"2-4 posts per day. Consistency over quantity.",
    },
  },
  global: {
    general: {
      times:[
        {time:"9:00 AM – 11:00 AM EST",reason:"US morning peak — largest global Telegram audience",score:90,day:"Weekdays"},
        {time:"6:00 PM – 9:00 PM GMT",reason:"European evening — second largest audience",score:85,day:"Weekdays"},
        {time:"8:00 PM – 10:00 PM EST",reason:"US prime time — maximum global overlap",score:95,day:"All days"},
      ],
      avoid:["12:00 AM – 6:00 AM EST","Weekend mornings"],
      best_days:["Tuesday","Wednesday","Thursday"],
      worst_days:["Saturday","Sunday morning"],
      tip:"Use English only for global channels. Keep posts under 500 characters for maximum forward rate.",
      frequency:"1-2 posts per day for global audiences. Quality over quantity.",
    },
  },
};

export function TelegramBestTime() {
  const [niche, setNiche] = useState("general");
  const [audience, setAudience] = useState("india");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = () => {
    setLoading(true);
    setTimeout(() => {
      const audienceData = BEST_TIMES[audience] || BEST_TIMES.india;
      const data = audienceData[niche] || audienceData.general;
      setResult(data);
      setLoading(false);
    }, 600);
  };

  const scoreColor = s => s>=90?"#34d399":s>=80?"#f59e0b":"#f87171";
  const niches = ["general","crypto","news","tech","finance","entertainment","sports","education","motivation","stock market","gaming","bollywood","business","politics","memes"];
  const audiences = [
    {id:"india",label:"India (IST)"},
    {id:"global",label:"Global Mix"},
    {id:"us",label:"USA (EST/PST)"},
    {id:"middle_east",label:"Middle East (GST)"},
    {id:"uk",label:"UK & Europe"},
    {id:"southeast_asia",label:"Southeast Asia"},
    {id:"pakistan",label:"Pakistan (PKT)"},
    {id:"australia",label:"Australia (AEST)"},
  ];

  return (
    <ToolCard title="Best Time to Post" icon="⏰">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:"16px",marginBottom:"16px"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {niches.map(n=>(
                <button key={n} onClick={()=>setNiche(n)} style={{padding:"5px 12px",borderRadius:"99px",border:`1.5px solid ${niche===n?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.1)"}`,background:niche===n?"rgba(124,58,237,0.15)":"transparent",color:niche===n?"#c4b5fd":"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>AUDIENCE REGION</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
              {audiences.map(a=>(
                <button key={a.id} onClick={()=>setAudience(a.id)} style={{padding:"5px 14px",borderRadius:"99px",border:`1.5px solid ${audience===a.id?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.1)"}`,background:audience===a.id?"rgba(124,58,237,0.15)":"transparent",color:audience===a.id?"#c4b5fd":"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <GenButton onClick={analyze} loading={loading} label="✦ Analyze Best Times"/>
      </GlassCard>

      {result && (
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <GlassCard>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>🕐 Best Times to Post</div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {result.times?.map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",borderRadius:"12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{fontSize:"20px",fontWeight:"900",color:scoreColor(t.score),minWidth:"36px",textAlign:"center"}}>{t.score}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:"700",color:"#fff",marginBottom:"2px"}}>{t.time} <span style={{fontSize:"10px",color:C.muted,fontWeight:"500"}}>· {t.day}</span></div>
                    <div style={{fontSize:"11px",color:C.muted}}>{t.reason}</div>
                  </div>
                  <div style={{width:"5px",height:"36px",borderRadius:"99px",background:scoreColor(t.score),opacity:0.7}}/>
                </div>
              ))}
            </div>
          </GlassCard>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            <GlassCard>
              <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>✅ Best Days</div>
              {result.best_days?.map((d,i)=>(
                <div key={i} style={{fontSize:"13px",color:"#34d399",fontWeight:"600",marginBottom:"4px"}}>• {d}</div>
              ))}
            </GlassCard>
            <GlassCard>
              <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>❌ Avoid These</div>
              {result.avoid?.map((d,i)=>(
                <div key={i} style={{fontSize:"11px",color:"#f87171",fontWeight:"600",marginBottom:"4px"}}>• {d}</div>
              ))}
            </GlassCard>
          </div>

          <GlassCard style={{borderLeft:"3px solid #7c3aed"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#a78bfa",marginBottom:"6px"}}>✦ PRO TIP</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,0.8)",lineHeight:1.6,marginBottom:"8px"}}>{result.tip}</div>
            <div style={{fontSize:"12px",color:C.muted}}>📅 Recommended frequency: <span style={{color:"#a78bfa",fontWeight:"700"}}>{result.frequency}</span></div>
          </GlassCard>
        </div>
      )}
    </ToolCard>
  );
}
