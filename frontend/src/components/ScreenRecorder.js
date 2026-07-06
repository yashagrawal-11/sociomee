import { useState, useRef, useEffect } from "react";

export default function ScreenRecorder() {
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
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

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
      padding: "8px 16px", borderRadius: "99px", fontSize: "12px", fontWeight: "700",
      border: active ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.08)",
      background: active ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
      color: active ? "#c4b5fd" : "rgba(255,255,255,0.45)",
      cursor: "pointer", transition: "all 0.15s",
    }),
    toggle: (active) => ({
      width: "40px", height: "22px", borderRadius: "99px", border: "none", cursor: "pointer",
      background: active ? "linear-gradient(135deg,#7c3aed,#9b5cf6)" : "rgba(255,255,255,0.08)",
      position: "relative", transition: "all 0.2s", flexShrink: 0,
    }),
    dot: (active) => ({
      position: "absolute", top: "3px", left: active ? "21px" : "3px",
      width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "all 0.2s",
    }),
    primaryBtn: { width: "100%", padding: "14px", borderRadius: "99px", border: "none", background: "linear-gradient(135deg,#7c3aed,#9b5cf6)", color: "#fff", fontWeight: "800", fontSize: "14px", cursor: "pointer", letterSpacing: "0.5px", boxShadow: "0 0 24px rgba(124,58,237,0.4)", transition: "all 0.2s" },
    secondaryBtn: { flex: 1, padding: "12px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: "13px", cursor: "pointer", transition: "all 0.2s" },
    dangerBtn: { flex: 1, padding: "12px", borderRadius: "99px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.8)", fontWeight: "700", fontSize: "13px", cursor: "pointer", transition: "all 0.2s" },
    successBtn: { flex: 1, padding: "12px", borderRadius: "99px", border: "none", background: "linear-gradient(135deg,#059669,#10b981)", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer" },
    timer: { fontFamily: "'Orbitron',monospace", fontSize: "32px", fontWeight: "900", color: "#fff", letterSpacing: "4px" },
    dot_rec: { width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite", display: "inline-block", marginRight: "8px" },
  };

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
