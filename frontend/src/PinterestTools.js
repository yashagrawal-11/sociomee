import { useState } from "react";

const C = {
  red:"#e60023", glass:"rgba(255,255,255,0.04)",
  hairline:"rgba(255,255,255,0.08)", ink:"rgba(255,255,255,0.9)",
  muted:"rgba(255,255,255,0.4)", success:"#34d399", danger:"#f87171",
};

const AI = "https://sociomee.in/api/ai/generate";

const FALLBACK_DESCS = {
  general: ["📌 {topic} — save this pin before you forget! Everything you need in one place. Perfect for planning! ✨ #{tag} #PinterestInspiration #SaveForLater #PinItForLater #Ideas","✨ The {topic} guide you've been looking for! Packed with tips and ideas. Don't let this scroll by! 💡 #{tag} #Inspiration #PinterestFinds #SaveThis #PinWorthy","🌟 {topic} ideas that will inspire you! Curated just for you. Pin this to your board! 📌 #{tag} #Inspo #Ideas #PinItNow #SavedForLater #PinterestBoard"],
  fashion: ["✨ {topic} — the look you've been waiting for! Save for your next outfit. This trend is everywhere! 📌 #{tag} #Fashion #StyleInspo #OOTD #FashionPinterest #OutfitGoals","👗 Obsessed with this {topic} look! Whether dressing up or keeping it casual, this style is everything. 💕 #{tag} #StyleGoals #FashionInspo #TrendAlert #LookBook","🔥 {topic} is THE trend right now. Steal this look and turn heads. Save now, style later! ✨ #{tag} #FashionTrend #PinterestFashion #StyleDiary #ChicStyle"],
  food: ["😍 {topic} — this recipe will blow your mind! Super easy, delicious, ready in 30 minutes. Save this! 🍽️ #{tag} #Recipe #FoodPorn #EasyRecipes #HomeCooking #RecipePin","🤤 The {topic} recipe you've been looking for is HERE. Simple ingredients, big flavors. Pin it, make it! 👨‍🍳 #{tag} #FoodPhotography #RecipeIdeas #DinnerIdeas #Foodie","✨ Elevate your cooking with this {topic} recipe! Perfect for weeknights or special occasions! 🍴 #{tag} #CookingTips #RecipeCollection #MealPrep #TastyRecipes"],
  home: ["🏠 Transform your space with this {topic} idea! Simple, affordable, stunning. Save for your next project! 🛋️ #{tag} #HomeDecor #InteriorDesign #DIYHome #RoomGoals","✨ {topic} — the home inspiration you needed! These ideas look straight out of a magazine. 🏡 #{tag} #HomeInspo #InteriorInspo #DecorIdeas #AestheticHome","💡 Budget-friendly {topic} ideas that look expensive! Transform any room without breaking the bank! 🎨 #{tag} #HomeDesign #BudgetDecor #DIYDecor #LivingRoomInspo"],
  beauty: ["💄 {topic} tutorial that will change your makeup game! Easy to follow, stunning results. Save it! ✨ #{tag} #Beauty #MakeupTutorial #BeautyTips #GlowUp #MakeupInspo","🌟 Achieve the perfect {topic} look with these pro tips! No artist skills needed. Glow up starts here! 💅 #{tag} #BeautyHacks #SkincareRoutine #GlowGoals #NaturalBeauty","✨ {topic} secrets revealed! The beauty routine that gets you compliments every single day. Save it! 💋 #{tag} #BeautyRoutine #GlowSkin #SkincareTips #MakeupLook"],
  travel: ["🌍 {topic} — add this to your bucket list RIGHT NOW! Breathtaking views, incredible experiences! ✈️ #{tag} #Travel #Wanderlust #TravelGoals #BucketList #TravelInspo","📍 Hidden gem alert! {topic} is the destination you haven't explored yet. Save for your next trip! 🗺️ #{tag} #TravelInspiration #ExploreMore #HiddenGems #AdventureAwaits","✈️ Everything about {topic} — best time to visit, top attractions, insider travel tips! 🌴 #{tag} #TravelTips #VacationGoals #TravelGuide #Wanderlust #TravelLife"],
  fitness: ["💪 {topic} workout that actually works! No gym needed, just 20 minutes a day. Save and start! 🏋️ #{tag} #Fitness #WorkoutRoutine #HealthyLifestyle #FitLife #FitnessGoals","🔥 {topic} — the exercise routine taking over Pinterest! Burn calories, build strength. Pin it! 💪 #{tag} #FitnessMotivation #WorkoutTips #GetFit #BodyGoals #WorkoutInspo","✨ {topic} tips that fitness pros swear by! Level up your routine and see results faster! 🏃 #{tag} #FitLife #HealthTips #FitnessJourney #StrongNotSkinny"],
  diy: ["🛠️ {topic} DIY that looks professional but costs almost nothing! Step-by-step guide inside! ✨ #{tag} #DIY #Crafts #HandmadeWithLove #DIYProjects #WeekendProject","💡 {topic} project that will impress everyone! Easy for beginners, satisfying for experts! 🎨 #{tag} #DIYProjects #CraftIdeas #HandmadeCrafts #MakeIt #CreativeIdeas","✨ Transform everyday items with this {topic} hack! Zero experience needed, amazing results! 🖌️ #{tag} #DIYCraft #CraftPin #UpcycleIdeas #BuildAndCreate"],
  wellness: ["🌿 {topic} — the wellness routine your body has been asking for. Save for self-care Sunday! ✨ #{tag} #Wellness #SelfCare #HealthyLiving #MindBodySoul #WellnessJourney","💆 Transform your wellbeing with these {topic} tips. Start small, feel the difference. Pin it! 🧘 #{tag} #SelfCareRoutine #HealthTips #MindfulLiving #DailyWellness","✨ {topic} practices that take 5 minutes but change everything. Wellness journey starts here! 🌸 #{tag} #WellnessTips #HealthyHabits #SelfLove #GlowFromWithin"],
};

const FALLBACK_BOARDS = {
  general:["Inspiration Board ✨","Saves That Inspire","Ideas I Love","My Vibe Collection","Pinned Perfection","My Aesthetic Board","Love This! Saves","Curated Finds"],
  fashion:["Style Diaries ✨","My Aesthetic Wardrobe","Outfit Goals 💕","Fashion Forward","The Chic Edit","Style Files","What I'd Wear","Look Book Loves"],
  food:["Yummy in My Tummy 🍽️","Recipe Obsession","Food Porn Saves","Eat This Now","Kitchen Inspo","Drool Worthy Dishes","Recipes to Try","Nom Nom Board"],
  home:["Home Sweet Goals 🏠","Interior Obsession","Room Inspo Files","Dream Home Saves","Decor I Love","Home Makeover Ideas","Aesthetic Spaces","Cozy Corner Vibes"],
  travel:["Wanderlust Diaries ✈️","Places to Go","Travel Goals Board","Dream Destinations","Adventure Awaits","Hidden Gems I Found","Travel Bucket List","World Explorer"],
  fitness:["Fit Life Goals 💪","Workout Inspo Board","Strong & Beautiful","Healthy Habits","Gym Motivation","Body Goals Saves","Move Your Body","Fitness Journey"],
  beauty:["Glow Up Board 💄","Beauty Obsession","Makeup Saves","Skincare Routines","Beauty Hacks I Love","Glow Goals","Self Care Saves","Beauty Finds"],
  diy:["DIY I Must Try 🛠️","Craft Obsession","Make It Happen","Weekend Projects","DIY Saves","Handmade With Love","Creative Corner","Build & Create"],
  wellness:["Wellness Rituals 🌿","Self Care Saves","Mind Body Soul","Daily Wellness Board","Healthy Habits","Mindful Living","Glow From Within","Soul Food Saves"],
  kids:["Mom Life Saves 👶","Kids Activity Board","Parenting Wins","Little Ones Inspo","Family Fun Ideas","Kid Friendly Crafts","Toddler Life","Raising Them Right"],
  business:["Boss Mode 💼","Business Inspo Board","Entrepreneur Saves","Hustle & Grow","Build Your Brand","Side Hustle Ideas","Boss Babe Board","Growth Mindset Saves"],
  art:["Art That Speaks 🎨","Creative Inspo Board","Artist at Heart","My Art Saves","Color Stories","Abstract Feelings","Art I Love","Draw This Next"],
};

const FALLBACK_TAGS = {
  general:["#PinterestInspiration","#SaveThisPin","#PinterestFinds","#PinItForLater","#PinterestBoard","#Inspiration","#PinterestSaves","#PinToTry","#MoodBoard","#AestheticPin","#VibesBoard","#InspoSaves","#DailyInspiration","#PinterestLove","#SavedForLater","#PinIt","#PinterestIdeas","#PinWorthy","#BoardGoals","#PinnedIt"],
  fashion:["#PinterestFashion","#StyleInspo","#OOTD","#FashionBoard","#OutfitIdeas","#StyleGoals","#FashionPinterest","#TrendAlert","#LookBook","#FashionSaves","#WardrobeGoals","#StyleFile","#FashionFind","#PinterestStyle","#ChicStyle","#OutfitOfTheDay","#FashionForward","#StyleDiary","#TrendingFashion","#FashionLover"],
  food:["#FoodPinterest","#RecipePin","#FoodSaves","#PinterestRecipes","#EasyRecipes","#FoodPhotography","#RecipeIdeas","#CookingInspo","#FoodBlogger","#Foodie","#HomeCooking","#PinToTry","#FoodBoard","#NomNom","#TastyRecipes","#CookingTips","#MealPrep","#HealthyEating","#RecipeCollection","#DinnerIdeas"],
  home:["#HomeDecorPin","#InteriorInspo","#PinterestHome","#RoomGoals","#HomeBoard","#DecorSaves","#InteriorDesign","#HomeAesthetic","#CozyHome","#DIYHome","#HomeInspiration","#DecorationIdeas","#HomeGoals","#AestheticHome","#PinterestDecor","#LivingRoomInspo","#BedroomGoals","#HomeDesign","#DecorIdeas","#RoomMakeover"],
  beauty:["#BeautyPinterest","#MakeupSaves","#GlowUp","#SkincarePin","#BeautyBoard","#MakeupInspo","#BeautyTips","#GlowGoals","#SkincareRoutine","#MakeupTutorial","#BeautyHacks","#NaturalBeauty","#SkincareSaves","#BeautyFinds","#GlowSkin","#MakeupLook","#SkincareCommunity","#BeautyRoutine","#GlowUpJourney","#SkincareGoals"],
  travel:["#TravelPinterest","#WanderlustBoard","#TravelSaves","#BucketListTravel","#TravelGoals","#ExploreMore","#TravelInspo","#HiddenGems","#AdventureBoard","#TravelPin","#VacationGoals","#TravelPhotography","#PlacesToGo","#WorldExplorer","#TravelBlogger","#TravelIdeas","#Wanderlust","#TravelLife","#AdventureAwaits","#TravelInspiration"],
  fitness:["#FitnessPinterest","#WorkoutSaves","#FitnessGoals","#HealthyLiving","#FitLife","#WorkoutInspo","#FitnessBoard","#HealthTips","#ActiveLifestyle","#FitnessMotivation","#BodyGoals","#FitnessTips","#WorkoutRoutine","#HealthyHabits","#GymPin","#FitnessJourney","#GetFit","#WorkoutLife","#StrongNotSkinny","#FitAndHealthy"],
  wellness:["#WellnessPinterest","#SelfCareBoard","#MindBodySoul","#WellnessJourney","#HealthyMindset","#SelfCareSunday","#MindfulLiving","#WellnessTips","#HolisticHealth","#DailyWellness","#SelfLove","#WellnessRoutine","#MindfulnessPin","#HealthyLifestyle","#SoulCare","#WellnessGoals","#NaturalWellness","#InnerPeace","#HealthyHabits","#GlowFromWithin"],
};

const FALLBACK_TIMES = {
  india:{times:[{time:"8:00 PM – 11:00 PM IST",reason:"Prime Pinterest browsing — users scroll on mobile before bed",score:97,day:"All days"},{time:"2:00 PM – 5:00 PM IST",reason:"Afternoon leisure — women 25-45 most active on Pinterest",score:88,day:"Weekdays"},{time:"10:00 AM – 12:00 PM IST",reason:"Morning inspiration — users plan and save ideas",score:82,day:"Weekends"},{time:"7:00 AM – 9:00 AM IST",reason:"Early morning routine browsing for daily inspiration",score:75,day:"Weekdays"}],best_days:["Saturday","Sunday","Thursday","Friday"],avoid:["12:00 AM – 6:00 AM","1:00 PM – 2:00 PM (post-lunch dip)"],tip:"Pinterest is a long-tail platform — content pinned today gets discovered for months. Use keyword-heavy descriptions. Indian audiences love festive content (Oct–Dec is peak).",frequency:"3-5 pins per day. Consistency beats quantity."},
  global:{times:[{time:"8:00 PM – 11:00 PM EST",reason:"US prime time — largest Pinterest demographic active",score:96,day:"All days"},{time:"9:00 AM – 12:00 PM EST",reason:"Weekend morning planning — highest save rates globally",score:91,day:"Weekends"},{time:"2:00 PM – 4:00 PM EST",reason:"Afternoon browsing — Millennial and Gen Z most active",score:89,day:"Weekdays"}],best_days:["Saturday","Sunday","Friday"],avoid:["12:00 AM – 6:00 AM EST","Monday morning"],tip:"80% of Pinterest users are women aged 18-49. Use vertical images (2:3 ratio). Keywords in pin title matter more than hashtags on Pinterest.",frequency:"5-25 pins per day for maximum reach."},
};

async function askGemini(prompt) {
  try {
    const r = await fetch(AI, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ messages:[{ role:"user", content:prompt }] }) });
    if (!r.ok) return "";
    const d = await r.json();
    return d.content?.[0]?.text || "";
  } catch { return ""; }
}

function parseJSON(text) {
  try {
    const clean = text.replace(/```json|```/g,"").trim();
    const match = clean.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    return JSON.parse(match ? match[1] : clean);
  } catch { return null; }
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

function NichePills({ niches, active, onSelect, color="rgba(230,0,35,0.7)", activeBg="rgba(230,0,35,0.15)", activeText="#ff6b8a" }) {
  return (
    <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
      {niches.map(n=>{
        const isActive=active===n.toLowerCase();
        return <button key={n} onClick={()=>onSelect(n.toLowerCase())} style={{padding:"5px 12px",borderRadius:"99px",border:`1.5px solid ${isActive?color:"rgba(255,255,255,0.1)"}`,background:isActive?activeBg:"transparent",color:isActive?activeText:"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>{n}</button>;
      })}
    </div>
  );
}

export function PinterestPinDesc() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("general");
  const [descs, setDescs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const niches = ["General","Fashion","Food","Home","Beauty","Travel","Fitness","DIY","Wellness","Kids","Pets","Business","Art","Sports","Tech","Finance","Motivation","Gaming","Bollywood","Cooking"];

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setDescs([]);
    const text = await askGemini(`Write 3 Pinterest pin descriptions for topic: "${topic}" niche: ${niche}. Each 150-220 chars, 2-3 emojis, 5-8 Pinterest hashtags, CTA like "Save this!" or "Pin it!". Aspirational Pinterest-native tone. Return ONLY a valid JSON array of 3 strings. No markdown. Example: ["desc1","desc2","desc3"]`);
    const parsed = parseJSON(text);
    if (parsed && Array.isArray(parsed) && parsed.length) {
      setDescs(parsed);
    } else {
      const pool = FALLBACK_DESCS[niche] || FALLBACK_DESCS.general;
      const tag = topic.replace(/\s+/g,"");
      setDescs(pool.map(t=>t.replace(/{topic}/g,topic).replace(/{tag}/g,tag)));
    }
    setLoading(false);
  };

  return (
    <ToolCard title="Pin Description Generator" icon="📌">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>PIN TOPIC</div>
        <input value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="e.g. minimalist home decor, keto recipes, summer outfits" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
        <div style={{marginBottom:"16px"}}><NichePills niches={niches} active={niche} onSelect={setNiche}/></div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Pin Descriptions"/>
      </GlassCard>
      {descs.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {descs.map((d,i)=>(
            <GlassCard key={i} style={{cursor:"pointer"}} onClick={()=>{navigator.clipboard.writeText(d);setCopied(i);setTimeout(()=>setCopied(null),2000);}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"rgba(230,0,35,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"800",color:"#ff6b8a"}}>{i+1}</div>
                <div style={{fontSize:"11px",color:copied===i?C.success:C.muted,fontWeight:"600"}}>{copied===i?"✓ Copied":"Copy"}</div>
              </div>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,0.85)",lineHeight:1.7}}>{d}</div>
              <div style={{marginTop:"8px",fontSize:"10px",color:C.muted}}>{d.length} chars</div>
            </GlassCard>
          ))}
        </div>
      )}
    </ToolCard>
  );
}

export function PinterestBoardNames() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("general");
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);
  const niches = ["General","Fashion","Food","Home","Travel","Fitness","Beauty","DIY","Kids","Business","Wellness","Art","Tech","Finance","Sports","Gaming","Bollywood","Cooking","Photography","Pets"];

  const generate = async () => {
    setLoading(true); setNames([]);
    const text = await askGemini(`Generate 8 creative Pinterest board names for niche: "${niche}"${topic?` focused on: "${topic}"`:""}. Catchy, aesthetic, Pinterest-native. Mix styles: some with emojis, some elegant, some playful. 2-6 words, max 40 chars each. No generic names. Return ONLY a valid JSON array of 8 strings. No markdown.`);
    const parsed = parseJSON(text);
    if (parsed && Array.isArray(parsed) && parsed.length) {
      setNames(parsed);
    } else {
      const pool = FALLBACK_BOARDS[niche] || FALLBACK_BOARDS.general;
      const extras = topic?[`${topic} Inspiration ✨`,`All Things ${topic}`,`My ${topic} Board 📌`]:[];
      setNames([...extras,...pool].slice(0,8));
    }
    setLoading(false);
  };

  return (
    <ToolCard title="Board Name Generator" icon="🗂️">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>BOARD TOPIC (optional)</div>
        <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. minimalist living, keto diet, monsoon fashion" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
        <div style={{marginBottom:"16px"}}><NichePills niches={niches} active={niche} onSelect={setNiche}/></div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Board Names"/>
      </GlassCard>
      {names.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
          {names.map((n,i)=>(
            <GlassCard key={i} style={{cursor:"pointer",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px"}} onClick={()=>{navigator.clipboard.writeText(n);setCopied(i);setTimeout(()=>setCopied(null),2000);}}>
              <span style={{fontSize:"13px",color:"rgba(255,255,255,0.85)",fontWeight:"600",flex:1}}>{n}</span>
              <span style={{fontSize:"10px",color:copied===i?C.success:C.muted,fontWeight:"600",flexShrink:0}}>{copied===i?"✓":"Copy"}</span>
            </GlassCard>
          ))}
        </div>
      )}
    </ToolCard>
  );
}

export function PinterestHashtags() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("general");
  const [count, setCount] = useState(15);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const niches = ["General","Fashion","Food","Home","Travel","Fitness","Beauty","DIY","Kids","Business","Wellness","Art","Tech","Finance","Sports","Gaming","Bollywood","Cooking","Photography","Pets"];

  const generate = async () => {
    setLoading(true); setTags([]);
    const text = await askGemini(`Generate exactly ${count} Pinterest hashtags for topic: "${topic||niche}" niche: ${niche}. Mix broad and specific. All start with #, CamelCase, no spaces. High-traffic Pinterest tags. No duplicates. Return ONLY a valid JSON array of ${count} hashtag strings. No markdown.`);
    const parsed = parseJSON(text);
    if (parsed && Array.isArray(parsed) && parsed.length) {
      setTags(parsed.slice(0,count));
    } else {
      const pool = FALLBACK_TAGS[niche] || FALLBACK_TAGS.general;
      const topicTags = topic?[`#${topic.replace(/\s+/g,"")}`,`#${topic.replace(/\s+/g,"")}Pinterest`,`#${topic.replace(/\s+/g,"")}Inspo`]:[];
      setTags([...topicTags,...pool].slice(0,count));
    }
    setLoading(false);
  };

  const copyAll = () => { navigator.clipboard.writeText(tags.join(" ")); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <ToolCard title="Hashtag Generator" icon="🏷️">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>PIN TOPIC</div>
        <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. minimalist bedroom, healthy breakfast, travel India" style={{width:"100%",padding:"12px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
            <NichePills niches={niches} active={niche} onSelect={setNiche}/>
          </div>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>COUNT: {count}</div>
            <input type="range" min="5" max="30" value={count} onChange={e=>setCount(Number(e.target.value))} style={{width:"100%",accentColor:"#e60023"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:C.muted,marginTop:"4px"}}><span>5</span><span>30</span></div>
          </div>
        </div>
        <GenButton onClick={generate} loading={loading} label="✦ Generate Hashtags"/>
      </GlassCard>
      {tags.length>0&&(
        <GlassCard>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>{tags.length} HASHTAGS</div>
            <button onClick={copyAll} style={{padding:"6px 16px",borderRadius:"99px",border:"1px solid rgba(230,0,35,0.3)",background:"rgba(230,0,35,0.1)",color:copied?C.success:"#ff6b8a",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>{copied?"✓ Copied All":"Copy All"}</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {tags.map((tag,i)=><span key={i} onClick={()=>navigator.clipboard.writeText(tag)} style={{padding:"5px 12px",borderRadius:"99px",background:"rgba(230,0,35,0.1)",border:"1px solid rgba(230,0,35,0.25)",color:"#ff6b8a",fontSize:"12px",fontWeight:"600",cursor:"pointer"}}>{tag}</span>)}
          </div>
        </GlassCard>
      )}
    </ToolCard>
  );
}

export function PinterestBestTime() {
  const [niche, setNiche] = useState("general");
  const [audience, setAudience] = useState("india");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const niches = ["general","fashion","food","home","travel","fitness","beauty","diy","kids","business","wellness","art","tech","sports","gaming","cooking"];
  const audiences = [{id:"india",label:"India (IST)"},{id:"global",label:"Global (US/EU)"},{id:"usa",label:"USA (EST)"},{id:"uk",label:"UK & Europe"},{id:"australia",label:"Australia"},{id:"middle_east",label:"Middle East"}];

  const analyze = async () => {
    setLoading(true); setResult(null);
    const text = await askGemini(`Best times to post on Pinterest for niche: "${niche}" audience: "${audience}". Return ONLY valid JSON no markdown: {"times":[{"time":"8:00 PM – 11:00 PM IST","reason":"reason","score":97,"day":"All days"}],"best_days":["Saturday"],"avoid":["Monday morning"],"tip":"actionable tip","frequency":"X-Y pins per day"} Include 3-4 time slots. Score out of 100.`);
    const parsed = parseJSON(text);
    setResult((parsed && parsed.times) ? parsed : (FALLBACK_TIMES[audience] || FALLBACK_TIMES.india));
    setLoading(false);
  };

  const scoreColor = s => s>=90?"#34d399":s>=80?"#f59e0b":"#f87171";

  return (
    <ToolCard title="Best Time to Post" icon="⏰">
      <GlassCard style={{marginBottom:"16px"}}>
        <div style={{marginBottom:"16px"}}>
          <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
          <NichePills niches={niches} active={niche} onSelect={setNiche}/>
        </div>
        <div style={{marginBottom:"16px"}}>
          <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>AUDIENCE</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {audiences.map(a=><button key={a.id} onClick={()=>setAudience(a.id)} style={{padding:"5px 14px",borderRadius:"99px",border:`1.5px solid ${audience===a.id?"rgba(230,0,35,0.7)":"rgba(255,255,255,0.1)"}`,background:audience===a.id?"rgba(230,0,35,0.15)":"transparent",color:audience===a.id?"#ff6b8a":"rgba(255,255,255,0.5)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>{a.label}</button>)}
          </div>
        </div>
        <GenButton onClick={analyze} loading={loading} label="✦ Analyze Best Times"/>
      </GlassCard>
      {result&&(
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <GlassCard>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>🕐 Best Times</div>
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
          <GlassCard style={{borderLeft:"3px solid #e60023"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#ff6b8a",marginBottom:"6px"}}>📌 PRO TIP</div>
            <div style={{fontSize:"13px",color:"rgba(255,255,255,0.8)",lineHeight:1.6,marginBottom:"8px"}}>{result.tip}</div>
            <div style={{fontSize:"12px",color:C.muted}}>📅 Frequency: <span style={{color:"#ff6b8a",fontWeight:"700"}}>{result.frequency}</span></div>
          </GlassCard>
        </div>
      )}
    </ToolCard>
  );
}
