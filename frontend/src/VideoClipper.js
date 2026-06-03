/* eslint-disable */
import React, { useState, useRef, useEffect, useCallback } from "react";

const vt = (hi, mr, ta, bn, en) => {
  const l = localStorage.getItem("sociomee_lang") || "en";
  return l==="hi"?hi:l==="mr"?mr:l==="ta"?ta:l==="bn"?bn:en;
};

export default function VideoClipper({ user }) {
  const [videoFile,   setVideoFile  ] = useState(null);
  const [videoURL,    setVideoURL   ] = useState("");
  const [duration,    setDuration   ] = useState(0);
  const [startTime,   setStartTime  ] = useState(0);
  const [endTime,     setEndTime    ] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing,     setPlaying    ] = useState(false);
  const [trimming,    setTrimming   ] = useState(false);
  const [progress,    setProgress   ] = useState(0);
  const [done,        setDone       ] = useState(false);
  const [error,       setError      ] = useState("");
  const [drag,        setDrag       ] = useState(false);
  const [speed,       setSpeed      ] = useState(1);
  const [volume,      setVolume     ] = useState(1);
  const [aspectRatio, setAspectRatio] = useState("original");
  const [makeGif,     setMakeGif    ] = useState(false);
  const [clips,       setClips      ] = useState([]);

  const videoRef    = useRef(null);
  const timelineRef = useRef(null);
  const fileRef     = useRef(null);

  const fmt = s => {
    const m = Math.floor(s/60), sec = Math.floor(s%60);
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const handleFile = f => {
    if (!f||!f.type.startsWith("video/")) return;
    if (f.size > 500*1024*1024) { setError("Max 500MB"); return; }
    const url = URL.createObjectURL(f);
    setVideoFile(f); setVideoURL(url); setError("");
    setStartTime(0); setEndTime(0); setDone(false); setProgress(0); setClips([]);
  };

  const onLoaded = () => {
    const d = videoRef.current?.duration || 0;
    setDuration(d); setEndTime(d);
  };

  const onTimeUpdate = () => {
    const t = videoRef.current?.currentTime || 0;
    setCurrentTime(t);
    if (t >= endTime) { videoRef.current.pause(); setPlaying(false); }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else {
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime)
        videoRef.current.currentTime = startTime;
      videoRef.current.play(); setPlaying(true);
    }
  };

  // Speed control
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  // Volume control
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (!videoURL) return;
      if (e.target.tagName === "INPUT") return;
      switch(e.key) {
        case " ": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": if(videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5); break;
        case "ArrowRight": if(videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5); break;
        case "i": case "I": setStartTime(currentTime); break;
        case "o": case "O": setEndTime(currentTime); break;
        case "m": case "M": addClipMark(); break;
        default: break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [videoURL, playing, currentTime, duration]);

  const getTimelineX = e => {
    const rect = timelineRef.current.getBoundingClientRect();
    const x = (e.clientX||e.touches?.[0]?.clientX||0) - rect.left;
    return Math.max(0, Math.min(1, x/rect.width));
  };

  const handleTimelineClick = e => {
    if (!duration) return;
    const t = getTimelineX(e) * duration;
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const handleStartDrag = useCallback(e => {
    e.preventDefault(); e.stopPropagation();
    const move = ev => {
      if (!timelineRef.current) return;
      const t = Math.min(getTimelineX(ev)*duration, endTime-0.5);
      setStartTime(Math.max(0,t));
      if (videoRef.current) videoRef.current.currentTime = Math.max(0,t);
    };
    const up = () => { window.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); };
    window.addEventListener("mousemove",move); window.addEventListener("mouseup",up);
  }, [duration, endTime]);

  const handleEndDrag = useCallback(e => {
    e.preventDefault(); e.stopPropagation();
    const move = ev => {
      if (!timelineRef.current) return;
      const t = Math.max(getTimelineX(ev)*duration, startTime+0.5);
      setEndTime(Math.min(duration,t));
    };
    const up = () => { window.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up); };
    window.addEventListener("mousemove",move); window.addEventListener("mouseup",up);
  }, [duration, startTime]);

  // Add clip bookmark
  const addClipMark = () => {
    if (clips.length >= 5) return;
    const newClip = { start: startTime, end: endTime, id: Date.now() };
    setClips(prev => [...prev, newClip]);
  };

  const removeClip = id => setClips(prev => prev.filter(c => c.id !== id));

  const trimVideo = async (clipStart, clipEnd, index=0) => {
    if (!videoFile) return;
    setTrimming(true); setProgress(0); setDone(false); setError("");
    const clipDuration = clipEnd - clipStart;

    // Duration warning
    if (clipDuration > 60) {
      const ok = window.confirm(`This clip is ${Math.round(clipDuration)}s long. Instagram/Shorts limit is 60s. Continue anyway?`);
      if (!ok) { setTrimming(false); return; }
    }

    try {
      const video = document.createElement("video");
      video.src = videoURL;
      video.muted = false;
      video.volume = volume;
      await new Promise(r => { video.onloadedmetadata = r; });
      video.currentTime = clipStart;
      video.playbackRate = speed;

      const stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();
      const chunks = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const suffix = index > 0 ? `_clip${index}` : "";
        a.download = `sociomee_clip${suffix}_${fmt(clipStart).replace(":","m")}s_${fmt(clipEnd).replace(":","m")}s.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setTrimming(false); setProgress(100); setDone(true);
      };

      recorder.start(100);
      video.play();

      const interval = setInterval(() => {
        const elapsed = video.currentTime - clipStart;
        setProgress(Math.min(98, (elapsed/clipDuration)*100));
      }, 200);

      setTimeout(() => {
        recorder.stop(); video.pause(); clearInterval(interval);
      }, (clipDuration/speed)*1000 + 200);

    } catch(e) { setError("Trim failed: "+e.message); setTrimming(false); }
  };

  const trimAllClips = async () => {
    const allClips = clips.length > 0 ? clips : [{start:startTime, end:endTime, id:0}];
    for (let i=0; i<allClips.length; i++) {
      await trimVideo(allClips[i].start, allClips[i].end, allClips.length>1?i+1:0);
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  const P = "#7c3aed", R = "#ff3d8f";
  const hairline = "rgba(167,139,250,0.15)";
  const clipLen = endTime - startTime;

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const RATIOS = [
    {id:"original", label:"Original"},
    {id:"9:16",     label:"9:16 Reels"},
    {id:"1:1",      label:"1:1 Square"},
    {id:"16:9",     label:"16:9 YouTube"},
  ];

  return (
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif"}}>
      {/* Header */}
      <div style={{marginBottom:"24px"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1.5px solid rgba(124,58,237,0.45)",borderRadius:"99px",padding:"6px 16px",marginBottom:"10px",boxShadow:"0 0 16px rgba(124,58,237,0.2)"}}>
          <span>✂️</span>
          <span style={{fontSize:"10px",fontWeight:"800",letterSpacing:"2px",textTransform:"uppercase",color:"#a78bfa"}}>{vt("वीडियो क्लिपर","व्हिडिओ क्लिपर","வீடியோ கிளிப்பர்","ভিডিও ক্লিপার","Video Clipper")}</span>
        </div>
        <h2 style={{fontSize:"22px",fontWeight:"700",color:"#fff",fontFamily:"'Orbitron',sans-serif",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>{vt("वीडियो क्लिपर","व्हिडिओ क्लिपर","வீடியோ கிளிப்பர்","ভিডিও ক্লিপার","VIDEO CLIPPER")}</h2>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>{vt("वीडियो चुनें, हैंडल खींचें, क्लिप डाउनलोड करें","व्हिडिओ निवडा, ट्रिम करा, डाउनलोड करा","வீடியோ தேர்ந்தெடுங்கள், ட்ரிம் செய்யுங்கள்","ভিডিও বেছে নিন, ট্রিম করুন","Select video, drag handles to trim, download clip.")}</p>
        {videoURL && <p style={{fontSize:"11px",color:"rgba(255,255,255,0.2)",marginTop:"4px"}}>⌨ Space=Play/Pause · ←→=5s · I=Set Start · O=Set End · M=Mark Clip</p>}
      </div>

      {!videoURL ? (
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>fileRef.current?.click()}
          style={{border:`2px dashed ${drag?"#7c3aed":"rgba(124,58,237,0.35)"}`,borderRadius:"18px",padding:"60px 20px",textAlign:"center",cursor:"pointer",background:drag?"rgba(124,58,237,0.08)":"rgba(255,255,255,0.02)",transition:"all 0.2s"}}>
          <input ref={fileRef} type="file" accept="video/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
          <div style={{fontSize:"48px",marginBottom:"16px"}}>🎬</div>
          <p style={{color:"#a78bfa",fontWeight:"700",fontSize:"16px",marginBottom:"8px"}}>{vt("वीडियो यहाँ क्लिक या ड्रैग करें","व्हिडिओ येथे क्लिक किंवा ड्रॅग करा","வீடியோவை இங்கே கிளிக் செய்யுங்கள்","ভিডিও এখানে ক্লিক করুন","Click or drag a video here")}</p>
          <p style={{color:"rgba(255,255,255,0.25)",fontSize:"13px"}}>MP4, MOV, WebM · Max 500MB</p>
        </div>
      ) : (
        <>
          {/* Video preview */}
          <div style={{borderRadius:"14px",overflow:"hidden",background:"#000",marginBottom:"16px",position:"relative",aspectRatio:aspectRatio==="9:16"?"9/16":aspectRatio==="1:1"?"1/1":"16/9",maxHeight:"380px"}}>
            <video ref={videoRef} src={videoURL}
              style={{width:"100%",height:"100%",display:"block",objectFit:aspectRatio==="original"?"contain":"cover"}}
              onLoadedMetadata={onLoaded} onTimeUpdate={onTimeUpdate} onClick={togglePlay}/>
            {!playing && (
              <div onClick={togglePlay} style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"rgba(0,0,0,0.25)"}}>
                <div style={{width:"60px",height:"60px",borderRadius:"50%",background:"rgba(124,58,237,0.85)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
            )}
          </div>

          {/* Controls row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
            {/* Speed control */}
            <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"12px"}}>
              <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.3)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>⚡ {vt("स्पीड","स्पीड","வேகம்","গতি","Speed")}</div>
              <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                {SPEEDS.map(s=>(
                  <button key={s} onClick={()=>setSpeed(s)}
                    style={{padding:"4px 8px",borderRadius:"6px",border:`1px solid ${speed===s?"rgba(124,58,237,0.6)":"rgba(255,255,255,0.1)"}`,background:speed===s?"rgba(124,58,237,0.2)":"transparent",color:speed===s?"#a78bfa":"rgba(255,255,255,0.4)",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume control */}
            <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"12px"}}>
              <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.3)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>🔊 {vt("वॉल्यूम","व्हॉल्युम","ஒலி","ভলিউম","Volume")} {Math.round(volume*100)}%</div>
              <input type="range" min="0" max="1" step="0.05" value={volume}
                onChange={e=>setVolume(parseFloat(e.target.value))}
                style={{width:"100%",accentColor:P}}/>
            </div>
          </div>

          {/* Aspect ratio */}
          <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"12px",marginBottom:"16px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.3)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"8px"}}>📐 {vt("आस्पेक्ट रेशियो","आस्पेक्ट रेशियो","விகிதம்","অনুপাত","Aspect Ratio")}</div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {RATIOS.map(r=>(
                <button key={r.id} onClick={()=>setAspectRatio(r.id)}
                  style={{padding:"6px 12px",borderRadius:"8px",border:`1px solid ${aspectRatio===r.id?"rgba(124,58,237,0.6)":"rgba(255,255,255,0.1)"}`,background:aspectRatio===r.id?"rgba(124,58,237,0.15)":"transparent",color:aspectRatio===r.id?"#a78bfa":"rgba(255,255,255,0.4)",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{background:"rgba(255,255,255,0.04)",border:`1.5px solid ${hairline}`,borderRadius:"14px",padding:"20px",marginBottom:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.3)",letterSpacing:"1px",textTransform:"uppercase"}}>Timeline</span>
              <span style={{fontSize:"12px",fontWeight:"700",color:"#a78bfa"}}>{fmt(startTime)} → {fmt(endTime)} · {clipLen.toFixed(1)}s {clipLen>60?"⚠️>60s":""}</span>
            </div>
            <div ref={timelineRef} onClick={handleTimelineClick}
              style={{position:"relative",height:"52px",borderRadius:"10px",background:"rgba(255,255,255,0.06)",cursor:"pointer",userSelect:"none",overflow:"visible",marginBottom:"8px"}}>
              <div style={{position:"absolute",top:0,bottom:0,left:`${(startTime/duration)*100}%`,width:`${((endTime-startTime)/duration)*100}%`,background:"rgba(124,58,237,0.3)",border:`2px solid ${P}`}}/>
              {Array.from({length:40}).map((_,i)=>(
                <div key={i} style={{position:"absolute",bottom:"8px",left:`${(i/40)*100}%`,width:"2px",height:`${12+Math.sin(i*0.8)*10}px`,background:"rgba(167,139,250,0.3)",borderRadius:"1px",transform:"translateX(-50%)"}}/>
              ))}
              {/* Clip marks */}
              {clips.map(c=>(
                <div key={c.id} style={{position:"absolute",top:0,bottom:0,left:`${(c.start/duration)*100}%`,width:`${((c.end-c.start)/duration)*100}%`,background:"rgba(255,61,143,0.2)",border:"1px solid rgba(255,61,143,0.5)",pointerEvents:"none"}}/>
              ))}
              <div style={{position:"absolute",top:0,bottom:0,left:`${(currentTime/duration)*100}%`,width:"2px",background:"#fff",transform:"translateX(-50%)",zIndex:3}}/>
              <div onMouseDown={handleStartDrag} style={{position:"absolute",top:"-6px",bottom:"-6px",left:`${(startTime/duration)*100}%`,transform:"translateX(-50%)",width:"18px",cursor:"ew-resize",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:"6px",height:"100%",background:P,borderRadius:"3px",boxShadow:`0 0 10px ${P}`}}/>
              </div>
              <div onMouseDown={handleEndDrag} style={{position:"absolute",top:"-6px",bottom:"-6px",left:`${(endTime/duration)*100}%`,transform:"translateX(-50%)",width:"18px",cursor:"ew-resize",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:"6px",height:"100%",background:R,borderRadius:"3px",boxShadow:`0 0 10px ${R}`}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"10px",color:"rgba(255,255,255,0.2)",fontWeight:"600",marginBottom:"12px"}}>
              <span>0:00</span><span style={{color:"rgba(255,255,255,0.4)"}}>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              {[{label:"Start",value:startTime,set:setStartTime,max:endTime-0.5,color:P},{label:"End",value:endTime,set:setEndTime,min:startTime+0.5,color:R}].map(c=>(
                <div key={c.label}>
                  <div style={{fontSize:"9px",fontWeight:"700",letterSpacing:"1px",textTransform:"uppercase",color:"rgba(255,255,255,0.25)",marginBottom:"5px"}}>{c.label} — {fmt(c.value)}</div>
                  <input type="range" min={c.min||0} max={c.max||duration} step="0.1" value={c.value}
                    onChange={e=>{c.set(parseFloat(e.target.value));if(videoRef.current)videoRef.current.currentTime=parseFloat(e.target.value);}}
                    style={{width:"100%",accentColor:c.color}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Multiple clips */}
          <div style={{marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
              <span style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.3)",letterSpacing:"1px",textTransform:"uppercase"}}>📌 {vt("मल्टीपल क्लिप्स","मल्टिपल क्लिप","பல கிளிப்கள்","একাধিক ক্লিপ","Multiple Clips")} ({clips.length}/5)</span>
              <button onClick={addClipMark} disabled={clips.length>=5}
                style={{padding:"6px 12px",borderRadius:"8px",border:"1px solid rgba(124,58,237,0.4)",background:"rgba(124,58,237,0.1)",color:"#a78bfa",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",opacity:clips.length>=5?0.4:1}}>
                + {vt("क्लिप मार्क करें","क्लिप मार्क करा","கிளிப் குறி","ক্লিপ মার্ক","Mark Current Clip")}
              </button>
            </div>
            {clips.length > 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {clips.map((c,i)=>(
                  <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:"10px",background:"rgba(255,61,143,0.06)",border:"1px solid rgba(255,61,143,0.2)"}}>
                    <span style={{fontSize:"12px",fontWeight:"600",color:"rgba(255,255,255,0.7)"}}>Clip {i+1}: {fmt(c.start)} → {fmt(c.end)} ({(c.end-c.start).toFixed(1)}s)</span>
                    <div style={{display:"flex",gap:"6px"}}>
                      <button onClick={()=>{setStartTime(c.start);setEndTime(c.end);}} style={{fontSize:"10px",color:"#a78bfa",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Load</button>
                      <button onClick={()=>removeClip(c.id)} style={{fontSize:"10px",color:"#f87171",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{display:"flex",gap:"10px",marginBottom:"16px",flexWrap:"wrap"}}>
            <button onClick={togglePlay}
              style={{display:"flex",alignItems:"center",gap:"8px",padding:"11px 20px",borderRadius:"99px",border:`1.5px solid ${hairline}`,background:"rgba(255,255,255,0.06)",color:"#fff",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>
              {playing?<><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>{vt("पॉज","पॉज","இடைநிறுத்து","পজ","Pause")}</>:<><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>{vt("क्लिप प्रीव्यू","क्लिप प्रीव्यू","கிளிப் முன்னோட்டம்","ক্লিপ প্রিভিউ","Preview Clip")}</>}
            </button>
            <button onClick={()=>{setVideoURL("");setVideoFile(null);setDone(false);setClips([]);}}
              style={{padding:"11px 20px",borderRadius:"99px",border:"1.5px solid rgba(255,61,143,0.3)",background:"rgba(255,61,143,0.08)",color:"#ff6eb5",fontWeight:"700",fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>
              ✕ {vt("बदलें","बदला","மாற்று","পরিবর্তন","Change Video")}
            </button>
          </div>

          {trimming && (
            <div style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${hairline}`,borderRadius:"12px",padding:"16px",marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                <span style={{fontSize:"12px",fontWeight:"700",color:"rgba(255,255,255,0.6)"}}>⚙ {vt("प्रोसेसिंग…","प्रक्रिया…","செயலாக்கம்…","প্রক্রিয়াকরণ…","Processing clip…")}</span>
                <span style={{fontSize:"12px",color:"#a78bfa",fontWeight:"700"}}>{Math.round(progress)}%</span>
              </div>
              <div style={{height:"6px",borderRadius:"99px",background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progress}%`,borderRadius:"99px",background:`linear-gradient(90deg,${P},${R})`,transition:"width 0.3s",boxShadow:`0 0 16px rgba(124,58,237,0.8)`}}/>
              </div>
            </div>
          )}

          {error && <div style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px",color:"#f87171",fontSize:"13px",fontWeight:"600"}}>⚠ {error}</div>}

          {done && (
            <div style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:"12px",padding:"14px 18px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"20px"}}>✅</span>
              <div>
                <p style={{fontSize:"13px",fontWeight:"700",color:"#34d399"}}>{vt("क्लिप डाउनलोड हो गई!","क्लिप डाउनलोड झाली!","கிளிப் பதிவிறக்கப்பட்டது!","ক্লিপ ডাউনলোড হয়েছে!","Clip downloaded!")}</p>
                <p style={{fontSize:"11px",color:"rgba(52,211,153,0.6)"}}>{vt("डाउनलोड फोल्डर चेक करें","डाउनलोड फोल्डर तपासा","Downloads கோப்புறையை சரிபார்க்கவும்","Downloads ফোল্ডার দেখুন","Check your Downloads folder.")}</p>
              </div>
            </div>
          )}

          {/* Main trim button */}
          <button onClick={trimAllClips} disabled={trimming||clipLen<0.5}
            className="trim-btn"
            style={{width:"100%",padding:"15px",borderRadius:"99px",border:`1.5px solid rgba(124,58,237,${trimming||clipLen<0.5?"0.2":"0.5"})`,background:trimming||clipLen<0.5?"rgba(124,58,237,0.08)":"rgba(124,58,237,0.12)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:"800",fontSize:"15px",cursor:trimming||clipLen<0.5?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:trimming?"none":"0 0 16px rgba(124,58,237,0.3)",transition:"all 0.3s"}}>
            {trimming?`⚙ ${vt("प्रोसेसिंग…","प्रक्रिया…","செயலாக்கம்…","প্রক্রিয়াকরণ…","Processing…")} ${Math.round(progress)}%`:
              clips.length>0?`✂️ ${vt("सभी क्लिप्स डाउनलोड करें","सर्व क्लिप्स डाउनलोड करा","அனைத்து கிளிப்களையும் பதிவிறக்கு","সব ক্লিপ ডাউনলোড করুন","Download All Clips")} (${clips.length})`:
              `✂️ ${vt("ट्रिम करें","ट्रिम करा","ட்ரிம் செய்","ট্রিম করুন","Trim & Download")} (${clipLen.toFixed(1)}s)`}
          </button>

          <p style={{textAlign:"center",fontSize:"11px",color:"rgba(255,255,255,0.2)",marginTop:"12px"}}>
            {vt("ब्राउज़र में प्रोसेस होता है · कोई अपलोड नहीं","ब्राउझरमध्ये प्रक्रिया · अपलोड नाही","உலாவியில் செயலாக்கம் · பதிவேற்றம் இல்லை","ব্রাউজারে প্রক্রিয়া · কোনো আপলোড নেই","Processed in browser · No upload · No server")}
          </p>
        </>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .trim-btn:hover:not(:disabled){
          background:rgba(124,58,237,0.2) !important;
          border-color:rgba(124,58,237,1) !important;
          box-shadow:0 0 28px rgba(124,58,237,0.8),0 0 60px rgba(124,58,237,0.4) !important;
          transform:translateY(-2px) !important;
        }
      `}</style>
    </div>
  );
}
