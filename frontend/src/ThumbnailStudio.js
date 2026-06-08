import { useState, useRef } from "react";
const C={purple:"#7c3aed",glass:"rgba(255,255,255,0.04)",muted:"rgba(255,255,255,0.4)",success:"#34d399",danger:"#f87171",yellow:"#f59e0b"};
const BASE="https://sociomee.in/api";
function GC({children,style={}}){return <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"20px",...style}}>{children}</div>;}
function ScoreBar({label,score}){const color=score>=75?"#34d399":score>=50?"#f59e0b":"#f87171";return(<div style={{marginBottom:"10px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}><span style={{fontSize:"11px",color:C.muted,fontWeight:"600"}}>{label}</span><span style={{fontSize:"12px",color,fontWeight:"800"}}>{score}</span></div><div style={{height:"6px",borderRadius:"99px",background:"rgba(255,255,255,0.06)"}}><div style={{height:"100%",borderRadius:"99px",background:color,width:`${score}%`,transition:"width 0.8s ease"}}/></div></div>);}
function UploadBox({label,preview,onChange,letter}){const ref=useRef();return(<div onClick={()=>ref.current.click()} style={{flex:1,minHeight:"160px",border:`2px dashed ${preview?"rgba(124,58,237,0.5)":"rgba(255,255,255,0.1)"}`,borderRadius:"16px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"8px",background:preview?"rgba(124,58,237,0.05)":"rgba(255,255,255,0.02)",transition:"all 0.2s",overflow:"hidden",position:"relative"}}>
  <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={onChange}/>
  {preview?<img src={preview} alt={label} style={{width:"100%",height:"160px",objectFit:"cover",borderRadius:"14px"}}/>:<><div style={{width:"48px",height:"48px",borderRadius:"99px",background:"rgba(124,58,237,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",fontWeight:"900",color:"#a78bfa"}}>{letter}</div><div style={{fontSize:"12px",color:C.muted,fontWeight:"600"}}>{label}</div><div style={{fontSize:"10px",color:"rgba(255,255,255,0.2)"}}>Click to upload</div></>}
</div>);}

export default function ThumbnailStudio(){
  const [tab,setTab]=useState("ab");
  const [imgA,setImgA]=useState(null);const [imgB,setImgB]=useState(null);
  const [prevA,setPrevA]=useState(null);const [prevB,setPrevB]=useState(null);
  const [niche,setNiche]=useState("general");
  const [result,setResult]=useState(null);const [loading,setLoading]=useState(false);
  const [singleImg,setSingleImg]=useState(null);const [singlePrev,setSinglePrev]=useState(null);
  const [singleResult,setSingleResult]=useState(null);const [keyword,setKeyword]=useState("");

  const niches=["General","Gaming","Tech","Education","Finance","Fitness","Food","Travel","Comedy","Motivation","Bollywood","Cricket","Beauty","Vlog","Music"];

  const handleFileA=e=>{const f=e.target.files[0];if(f){setImgA(f);setPrevA(URL.createObjectURL(f));setResult(null);}};
  const handleFileB=e=>{const f=e.target.files[0];if(f){setImgB(f);setPrevB(URL.createObjectURL(f));setResult(null);}};
  const handleSingle=e=>{const f=e.target.files[0];if(f){setSingleImg(f);setSinglePrev(URL.createObjectURL(f));setSingleResult(null);}};

  const runAB=async()=>{
    if(!imgA||!imgB)return;
    setLoading(true);setResult(null);
    const fd=new FormData();fd.append("file_a",imgA);fd.append("file_b",imgB);fd.append("niche",niche);
    try{
      const r=await fetch(`${BASE}/thumbnail/ab-test`,{method:"POST",body:fd});
      if(!r.ok){setResult({error:"server",message:`Server error: ${r.status}`});setLoading(false);return;}
      const d=await r.json();
      setResult(d);
    }catch(e){console.error(e);setResult({error:"server",message:"Request failed. Please try again."});}
    setLoading(false);
  };

  const runSingle=async()=>{
    if(!singleImg)return;
    setLoading(true);setSingleResult(null);
    const fd=new FormData();fd.append("file",singleImg);fd.append("keyword",keyword||niche);fd.append("niche",niche);
    try{const r=await fetch(`${BASE}/thumbnail/analyze`,{method:"POST",body:fd});const d=await r.json();setSingleResult(d);}
    catch(e){console.error(e);}
    setLoading(false);
  };

  const scoreColor=s=>s>=75?"#34d399":s>=50?"#f59e0b":"#f87171";

  return(<div style={{maxWidth:"800px",margin:"0 auto",padding:"20px 16px"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
      <span style={{fontSize:"20px"}}>🖼️</span>
      <h2 style={{fontSize:"18px",fontWeight:"900",color:"#fff",margin:0}}>Thumbnail Studio</h2>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}>
      {[{id:"ab",label:"A/B Test"},{id:"analyze",label:"Analyze Single"}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 20px",borderRadius:"99px",border:`1.5px solid ${tab===t.id?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.1)"}`,background:tab===t.id?"rgba(124,58,237,0.15)":"transparent",color:tab===t.id?"#a78bfa":"rgba(255,255,255,0.5)",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>{t.label}</button>)}
    </div>

    {/* Niche selector */}
    <GC style={{marginBottom:"16px"}}>
      <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>NICHE</div>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        {niches.map(n=>{const a=niche===n.toLowerCase();return <button key={n} onClick={()=>setNiche(n.toLowerCase())} style={{padding:"4px 12px",borderRadius:"99px",border:`1.5px solid ${a?"rgba(124,58,237,0.7)":"rgba(255,255,255,0.1)"}`,background:a?"rgba(124,58,237,0.15)":"transparent",color:a?"#a78bfa":"rgba(255,255,255,0.45)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>{n}</button>;})}
      </div>
    </GC>

    {/* A/B Test Tab */}
    {tab==="ab"&&<div>
      <GC style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>UPLOAD TWO THUMBNAILS</div>
        <div style={{display:"flex",gap:"12px",marginBottom:"16px"}}>
          <UploadBox label="Thumbnail A" preview={prevA} onChange={handleFileA} letter="A"/>
          <UploadBox label="Thumbnail B" preview={prevB} onChange={handleFileB} letter="B"/>
        </div>
        <button onClick={runAB} disabled={loading||!imgA||!imgB} style={{width:"100%",padding:"14px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.6)",background:loading||!imgA||!imgB?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.15)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:loading||!imgA||!imgB?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading||!imgA||!imgB?"none":"0 0 24px rgba(124,58,237,0.5)",transition:"all 0.3s",opacity:loading||!imgA||!imgB?0.5:1}}>
          {loading?"Analyzing with Gemini AI...":"✦ Run A/B Test"}
        </button>
      </GC>

      {!loading&&result?.error==="server"&&<div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"16px",padding:"24px",textAlign:"center"}}>
        <div style={{fontSize:"32px",marginBottom:"8px"}}>⚠️</div>
        <div style={{fontSize:"15px",fontWeight:"700",color:"#f87171",marginBottom:"6px"}}>Something went wrong</div>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)"}}>{result.message}</div>
      </div>}
      {!loading&&result?.error==="inappropriate"&&<div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"16px",padding:"24px",textAlign:"center"}}>
        <div style={{fontSize:"32px",marginBottom:"8px"}}>🚫</div>
        <div style={{fontSize:"15px",fontWeight:"700",color:"#f87171",marginBottom:"6px"}}>Inappropriate Content Detected</div>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)"}}>{result.message}</div>
      </div>}
      {!loading&&result&&!result.error&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {/* Winner Banner */}
        <GC style={{textAlign:"center",borderLeft:`4px solid ${result.winner==="A"?"#34d399":"#a78bfa"}`,background:"rgba(52,211,153,0.05)"}}>
          <div style={{fontSize:"28px",marginBottom:"6px"}}>{result.winner==="A"?"🏆":"🥇"}</div>
          <div style={{fontSize:"20px",fontWeight:"900",color:"#fff",marginBottom:"4px"}}>Thumbnail {result.winner} Wins!</div>
          <div style={{fontSize:"13px",color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>{result.winner_reason}</div>
        </GC>

        {/* Side by side scores */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          {["a","b"].map(k=>{const d=result[k]||{};const isWinner=result.winner===k.toUpperCase();return(<GC key={k} style={{borderLeft:`3px solid ${isWinner?"#34d399":"rgba(255,255,255,0.1)"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
              <div style={{fontSize:"16px",fontWeight:"900",color:"#fff"}}>Thumbnail {k.toUpperCase()}</div>
              <div style={{fontSize:"24px",fontWeight:"900",color:scoreColor(d.overall)}}>{d.overall}</div>
            </div>
            <ScoreBar label="CTR Potential" score={d.ctr_potential}/>
            <ScoreBar label="Color Contrast" score={d.color_contrast}/>
            <ScoreBar label="Text Readability" score={d.text_readability}/>
            <ScoreBar label="Emotion/Hook" score={d.emotion_hook}/>
            {d.strengths?.length>0&&<div style={{marginTop:"10px"}}><div style={{fontSize:"10px",color:"#34d399",fontWeight:"700",marginBottom:"4px"}}>✅ STRENGTHS</div>{d.strengths.map((s,i)=><div key={i} style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginBottom:"2px"}}>• {s}</div>)}</div>}
            {d.weaknesses?.length>0&&<div style={{marginTop:"8px"}}><div style={{fontSize:"10px",color:"#f87171",fontWeight:"700",marginBottom:"4px"}}>⚠️ WEAKNESSES</div>{d.weaknesses.map((w,i)=><div key={i} style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",marginBottom:"2px"}}>• {w}</div>)}</div>}
          </GC>);})}
        </div>

        {/* Improvements */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          {["a","b"].map(k=><GC key={k} style={{borderLeft:"3px solid rgba(124,58,237,0.4)"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"#a78bfa",textTransform:"uppercase",marginBottom:"6px"}}>💡 Improve Thumbnail {k.toUpperCase()}</div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",lineHeight:1.6}}>{result[`improvement_${k}`]}</div>
          </GC>)}
        </div>
      </div>}
    </div>}

    {/* Single Analyze Tab */}
    {tab==="analyze"&&<div>
      <GC style={{marginBottom:"16px"}}>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>UPLOAD THUMBNAIL</div>
        <div style={{marginBottom:"14px"}}>
          <UploadBox label="Your Thumbnail" preview={singlePrev} onChange={handleSingle} letter="T"/>
        </div>
        <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="Video keyword or title (optional)" style={{width:"100%",padding:"10px 16px",borderRadius:"99px",border:"1.5px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",color:"#fff",fontSize:"13px",fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:"14px"}}/>
        <button onClick={runSingle} disabled={loading||!singleImg} style={{width:"100%",padding:"14px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.6)",background:loading||!singleImg?"rgba(124,58,237,0.05)":"rgba(124,58,237,0.15)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:loading||!singleImg?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading||!singleImg?"none":"0 0 24px rgba(124,58,237,0.5)",transition:"all 0.3s",opacity:loading||!singleImg?0.5:1}}>
          {loading?"Analyzing...":"✦ Analyze Thumbnail"}
        </button>
      </GC>
      {!loading&&singleResult?.error==="inappropriate"&&<div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"16px",padding:"24px",textAlign:"center"}}>
        <div style={{fontSize:"32px",marginBottom:"8px"}}>🚫</div>
        <div style={{fontSize:"15px",fontWeight:"700",color:"#f87171",marginBottom:"6px"}}>Inappropriate Content Detected</div>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)"}}>{singleResult.message}</div>
      </div>}
      {!loading&&singleResult&&!singleResult.error&&<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
        <GC style={{textAlign:"center"}}>
          <div style={{fontSize:"48px",fontWeight:"900",color:scoreColor(singleResult.fit_score)}}>{singleResult.fit_score}</div>
          <div style={{fontSize:"14px",color:"rgba(255,255,255,0.6)",marginTop:"4px"}}>{singleResult.verdict}</div>
        </GC>
        <GC>
          <ScoreBar label="CTR Potential" score={singleResult.ctr_potential}/>
          <ScoreBar label="Color Contrast" score={singleResult.color_contrast}/>
          <ScoreBar label="Text Readability" score={singleResult.text_readability}/>
          <ScoreBar label="Emotion/Hook" score={singleResult.emotion_hook}/>
          <ScoreBar label="Face Element" score={singleResult.face_element}/>
        </GC>
        {singleResult.strengths?.length>0&&<GC><div style={{fontSize:"10px",color:"#34d399",fontWeight:"700",marginBottom:"8px"}}>✅ STRENGTHS</div>{singleResult.strengths.map((s,i)=><div key={i} style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",marginBottom:"4px"}}>• {s}</div>)}</GC>}
        {singleResult.suggestions?.length>0&&<GC style={{borderLeft:"3px solid #7c3aed"}}><div style={{fontSize:"10px",color:"#a78bfa",fontWeight:"700",marginBottom:"8px"}}>💡 IMPROVEMENTS</div>{singleResult.suggestions.map((s,i)=><div key={i} style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",marginBottom:"4px"}}>• {s}</div>)}</GC>}
      </div>}
    </div>}
  </div>);}
