import { useState, useRef, useEffect } from "react";

export default function ScreenRecorder({ user, creditStatus }) {
  const rawPlan = creditStatus?.plan || user?.plan || user?.plan_label || "free";
  const plan = rawPlan.toLowerCase().includes("premium") ? "premium" : rawPlan.toLowerCase().includes("pro") ? "pro" : "free";
  const isPro = plan === "pro" || plan === "premium";
  const isPremium = plan === "premium";
  const MAX_PRO_SECONDS = 300;
  const [status, setStatus] = useState("idle"); // idle | recording | paused | preview
  const [captureTarget, setCaptureTarget] = useState("screen"); // screen | window | tab
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [quality, setQuality] = useState("1080p");
  const [fps, setFps] = useState("30");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const micStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const previewRef = useRef(null);
  const liveRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(() => setDuration(d => {
        const next = d + 1;
        if (!isPremium && next >= MAX_PRO_SECONDS) {
          stopRecording();
          alert(`Pro plan recordings are capped at ${MAX_PRO_SECONDS/60} minutes. Upgrade to Pro+ for unlimited recording length.`);
        }
        return next;
      }), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, isPremium]);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      setDuration(0);
      setVideoUrl(null);

      const displayConstraints = {
        video: {
          width: quality === "4K" ? 3840 : quality === "1080p" ? 1920 : 1280,
          height: quality === "4K" ? 2160 : quality === "1080p" ? 1080 : 720,
          frameRate: parseInt(fps),
          cursor: "always",
        },
        audio: true,
      };

      const displayStream = await navigator.mediaDevices.getDisplayMedia(displayConstraints);
      streamRef.current = displayStream;

      const tracks = [...displayStream.getTracks()];

      if (micEnabled) {
        try {
          micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current.getAudioTracks().forEach(t => tracks.push(t));
        } catch (e) { console.warn("mic not available"); }
      }

      if (cameraEnabled) {
        try {
          cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
          cameraStreamRef.current.getVideoTracks().forEach(t => tracks.push(t));
        } catch (e) { console.warn("camera not available"); }
      }

      const combined = new MediaStream(tracks);

      if (liveRef.current) {
        liveRef.current.srcObject = displayStream;
        liveRef.current.play();
      }

      const mr = new MediaRecorder(combined, { mimeType: "video/webm;codecs=vp9" });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setStatus("preview");
        if (liveRef.current) liveRef.current.srcObject = null;
        if (isPremium) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const existing = JSON.parse(localStorage.getItem("cloud_files") || "[]");
              const entry = { id: Date.now()+Math.random(), name: `Screen Recording ${new Date().toLocaleString()}.webm`, size: blob.size, type: "video/webm", category: "video", addedAt: Date.now(), starred: false, data: reader.result };
              const updated = [...existing, entry];
              localStorage.setItem("cloud_files", JSON.stringify(updated));
            } catch (e) {
              console.warn("Could not auto-save recording to Cloud:", e);
            }
          };
          reader.readAsDataURL(blob);
        }
      };

      displayStream.getVideoTracks()[0].onended = () => stopRecording();

      mr.start(1000);
      setStatus("recording");
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
    } else if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
  };

  const downloadRecording = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `sociomee-recording-${Date.now()}.webm`;
    a.click();
  };

  const reset = () => {
    setStatus("idle");
    setVideoUrl(null);
    setVideoBlob(null);
    setDuration(0);
  };

  const S = {
    wrap: { padding: "0 0 40px" },
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "24px", marginBottom: "16px" },
    label: { fontSize: "10px", fontWeight: "700", letterSpacing: "2px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: "12px" },
    segGroup: { display: "flex", gap: "6px", flexWrap: "wrap" },
    seg: (active) => ({
      padding: "9px 18px", borderRadius: "99px", fontSize: "11.5px", fontWeight: "600",
      border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.12)",
      background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
      color: active ? "#fff" : "rgba(255,255,255,0.75)",
      cursor: "pointer", transition: "all 0.2s",
    }),
    toggle: (active) => ({
      width: "40px", height: "22px", borderRadius: "99px", border: "none", cursor: "pointer",
      background: active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
      position: "relative", transition: "all 0.2s", flexShrink: 0,
    }),
    dot: (active) => ({
      position: "absolute", top: "3px", left: active ? "21px" : "3px",
      width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "all 0.2s",
    }),
    primaryBtn: { width: "100%", padding: "14px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer", letterSpacing: "0.3px", transition: "all 0.2s" },
    secondaryBtn: { flex: 1, padding: "12px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)", fontWeight: "600", fontSize: "12.5px", cursor: "pointer", transition: "all 0.2s" },
    dangerBtn: { flex: 1, padding: "12px", borderRadius: "99px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.75)", fontWeight: "600", fontSize: "12.5px", cursor: "pointer", transition: "all 0.2s" },
    successBtn: { flex: 1, padding: "12px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: "700", fontSize: "12.5px", cursor: "pointer" },
    timer: { fontFamily: "'Orbitron',monospace", fontSize: "32px", fontWeight: "900", color: "#fff", letterSpacing: "4px" },
    dot_rec: { width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite", display: "inline-block", marginRight: "8px" },
  };

  if (!isPro) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"32px 24px", fontFamily:"'DM Sans','Syne',sans-serif" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"24px", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"24px", padding:"52px 44px", maxWidth:"420px", width:"100%", backdropFilter:"blur(24px)" }}>
        <div style={{ width:"68px", height:"68px", borderRadius:"20px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7"><rect x="2" y="4" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <div>
          <h3 style={{ fontSize:"22px", fontWeight:"700", color:"#fff", margin:"0 0 10px", fontFamily:"'Poppins',sans-serif" }}>Screen Recorder</h3>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:1.8, margin:0 }}>Record your screen, window, or tab with mic and camera overlay. Available on Pro and Pro+ plans.</p>
        </div>
        <a href="/pricing" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"13px 0", borderRadius:"12px", background:"#fff", color:"#0a0a0a", fontWeight:"700", fontSize:"14px", textDecoration:"none", width:"100%" }}>Upgrade to Pro</a>
      </div>
    </div>
  );

  return (
    <div style={S.wrap}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>

      {/* Preview */}
      <div style={S.card}>
        <p style={S.label}>Preview</p>
        {status === "preview" && videoUrl ? (
          <video ref={previewRef} src={videoUrl} controls style={{ width: "100%", borderRadius: "12px", background: "#000" }} />
        ) : (
          <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "12px", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
            {status === "recording" || status === "paused" ? (
              <>
                <video ref={liveRef} muted style={{ width: "100%", height: "100%", borderRadius: "12px", objectFit: "contain" }} />
              </>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "13px" }}>Preview appears here once you start recording</p>
            )}
          </div>
        )}
      </div>

      {/* Timer when recording */}
      {(status === "recording" || status === "paused") && (
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={S.dot_rec} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", letterSpacing: "2px" }}>{status === "paused" ? "PAUSED" : "RECORDING"}</span>
          </div>
          <div style={S.timer}>{formatTime(duration)}</div>
        </div>
      )}

      {/* Settings — only show when idle */}
      {status === "idle" && (
        <>
          <div style={S.card}>
            <p style={S.label}>Capture Target</p>
            <div style={S.segGroup}>
              {["screen","window","tab"].map(t => (
                <button key={t} style={S.seg(captureTarget===t)} onClick={() => setCaptureTarget(t)}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <p style={S.label}>Quality & Frame Rate</p>
            <div style={{ ...S.segGroup, marginBottom: "10px" }}>
              {["720p","1080p","4K"].map(q => (
                <button key={q} style={S.seg(quality===q)} onClick={() => setQuality(q)}>{q}</button>
              ))}
            </div>
            <div style={S.segGroup}>
              {["24","30","60"].map(f => (
                <button key={f} style={S.seg(fps===f)} onClick={() => setFps(f)}>{f} fps</button>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <p style={S.label}>Audio & Camera</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Microphone", sub: "Record your voice", val: micEnabled, set: setMicEnabled },
                { label: "Camera overlay", sub: "Picture-in-picture webcam", val: cameraEnabled, set: setCameraEnabled },
              ].map(({ label, sub, val, set }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff" }}>{label}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{sub}</div>
                  </div>
                  <button style={S.toggle(val)} onClick={() => set(v => !v)}>
                    <div style={S.dot(val)} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
        {status === "idle" && (
          <button style={S.primaryBtn} onClick={startRecording}>Start Recording</button>
        )}
        {(status === "recording" || status === "paused") && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={S.secondaryBtn} onClick={pauseRecording}>{status === "paused" ? "Resume" : "Pause"}</button>
            <button style={S.dangerBtn} onClick={stopRecording}>Stop</button>
          </div>
        )}
        {status === "preview" && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={S.successBtn} onClick={downloadRecording}>Download</button>
            <button style={S.secondaryBtn} onClick={reset}>Record Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
