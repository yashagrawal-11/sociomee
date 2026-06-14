import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
    padding: "32px 24px",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "32px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "20px",
    padding: "4px 14px",
    fontSize: "11px",
    fontFamily: "'Orbitron', sans-serif",
    color: "#a78bfa",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "12px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0 0 6px",
    background: "linear-gradient(135deg, #fff 0%, #a78bfa 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "24px",
    alignItems: "start",
  },
  // Glass card
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    backdropFilter: "blur(12px)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#d1d5db",
    letterSpacing: "0.3px",
  },
  cardBody: {
    padding: "20px",
  },
  // Preview area
  previewWrap: {
    position: "relative",
    background: "#050505",
    borderRadius: "12px",
    overflow: "hidden",
    aspectRatio: "16/9",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  previewVideo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  previewPlaceholder: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color: "#374151",
  },
  placeholderIcon: {
    fontSize: "48px",
    opacity: 0.4,
  },
  placeholderText: {
    fontSize: "13px",
    color: "#4b5563",
  },
  // Recording overlay elements
  recBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(239,68,68,0.9)",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "700",
    fontFamily: "'Orbitron', sans-serif",
    letterSpacing: "1px",
    backdropFilter: "blur(8px)",
  },
  recDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#fff",
    animation: "pulse 1s infinite",
  },
  timerBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(0,0,0,0.7)",
    borderRadius: "6px",
    padding: "4px 10px",
    fontSize: "13px",
    fontFamily: "'Orbitron', sans-serif",
    letterSpacing: "2px",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  watermark: {
    position: "absolute",
    bottom: "10px",
    right: "12px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "10px",
    fontFamily: "'Orbitron', sans-serif",
    color: "rgba(167,139,250,0.7)",
    letterSpacing: "1px",
    pointerEvents: "none",
  },
  // Controls row
  controlsRow: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
    flexWrap: "wrap",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    borderRadius: "10px",
    padding: "10px 18px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    fontFamily: "'Poppins', sans-serif",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
  },
  btnDanger: {
    background: "rgba(239,68,68,0.12)",
    color: "#f87171",
    border: "1px solid rgba(239,68,68,0.3)",
  },
  btnPause: {
    background: "rgba(245,158,11,0.12)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.3)",
  },
  btnSuccess: {
    background: "rgba(16,185,129,0.12)",
    color: "#34d399",
    border: "1px solid rgba(16,185,129,0.3)",
  },
  btnGhost: {
    background: "rgba(255,255,255,0.05)",
    color: "#9ca3af",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  // Options panel
  optionGroup: {
    marginBottom: "18px",
  },
  optionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "1px",
    marginBottom: "8px",
    display: "block",
  },
  optionRow: {
    display: "flex",
    gap: "8px",
  },
  optionChip: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#6b7280",
    textAlign: "center",
    transition: "all 0.2s",
    fontFamily: "'Poppins', sans-serif",
  },
  optionChipActive: {
    background: "rgba(124,58,237,0.2)",
    border: "1px solid rgba(124,58,237,0.5)",
    color: "#a78bfa",
  },
  // Toggle
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  toggleLabel: {
    fontSize: "13px",
    color: "#d1d5db",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  toggleSub: {
    fontSize: "11px",
    color: "#4b5563",
    display: "block",
    marginTop: "2px",
  },
  toggleSwitch: {
    position: "relative",
    width: "38px",
    height: "20px",
    flexShrink: 0,
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
    position: "absolute",
  },
  toggleSlider: (on) => ({
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: on ? "#7c3aed" : "rgba(255,255,255,0.1)",
    borderRadius: "20px",
    transition: "0.25s",
  }),
  toggleKnob: (on) => ({
    position: "absolute",
    top: "3px",
    left: on ? "20px" : "3px",
    width: "14px",
    height: "14px",
    background: "#fff",
    borderRadius: "50%",
    transition: "0.25s",
  }),
  // Recordings list
  recItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "8px",
  },
  recThumb: {
    width: "56px",
    height: "36px",
    borderRadius: "6px",
    objectFit: "cover",
    background: "#111",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  recMeta: {
    flex: 1,
    minWidth: 0,
  },
  recName: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#e5e7eb",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  recSize: {
    fontSize: "11px",
    color: "#4b5563",
    marginTop: "2px",
  },
  recActions: {
    display: "flex",
    gap: "6px",
    flexShrink: 0,
  },
  iconBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#9ca3af",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    transition: "all 0.15s",
    fontFamily: "inherit",
  },
  // Status message
  statusBar: {
    marginTop: "14px",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  emptyState: {
    textAlign: "center",
    padding: "32px 16px",
    color: "#374151",
  },
  emptyIcon: {
    fontSize: "32px",
    marginBottom: "8px",
    opacity: 0.4,
  },
  emptyText: {
    fontSize: "12px",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

// Watermark canvas overlay — burns "SocioMee" text into a corner of the video stream
function createWatermarkedStream(videoStream, text = "sociomee.in") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const video = document.createElement("video");
  video.srcObject = videoStream;
  video.muted = true;
  video.play();

  video.onloadedmetadata = () => {
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
  };

  const draw = () => {
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Watermark pill
      const padX = 14,
        padY = 7;
      const fontSize = Math.max(14, canvas.width * 0.012);
      ctx.font = `600 ${fontSize}px Orbitron, Poppins, sans-serif`;
      const textW = ctx.measureText(text).width;
      const pillW = textW + padX * 2;
      const pillH = fontSize + padY * 2;
      const x = canvas.width - pillW - 16;
      const y = canvas.height - pillH - 16;
      // Background
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#0a0a0a";
      ctx.beginPath();
      ctx.roundRect(x, y, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.restore();
      // Border
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, pillW, pillH, pillH / 2);
      ctx.stroke();
      ctx.restore();
      // Text
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#a78bfa";
      ctx.font = `600 ${fontSize}px Orbitron, Poppins, sans-serif`;
      ctx.fillText(text, x + padX, y + padY + fontSize * 0.78);
      ctx.restore();
    }
    requestAnimationFrame(draw);
  };
  draw();

  const canvasStream = canvas.captureStream(30);
  return { canvasStream, canvas, video };
}

// ─── Toggle component ────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <label style={styles.toggleSwitch}>
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        style={styles.toggleInput}
      />
      <span style={styles.toggleSlider(on)}>
        <span style={styles.toggleKnob(on)} />
      </span>
    </label>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ScreenRecorder() {
  // State
  const [status, setStatus] = useState("idle"); // idle | recording | paused | stopped
  const [elapsed, setElapsed] = useState(0);
  const [includeMic, setIncludeMic] = useState(false);
  const [addWatermark, setAddWatermark] = useState(true);
  const [captureMode, setCaptureMode] = useState("screen"); // screen | window | tab
  const [recordings, setRecordings] = useState([]);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'info'|'error'|'success', text }
  const [showPreviewFor, setShowPreviewFor] = useState(null); // blob url
  const [showSaveOptions, setShowSaveOptions] = useState(null); // {url, name, size, duration, blob}

  // Refs
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const liveVideoRef = useRef(null);
  const timerRef = useRef(null);
  const watermarkRefs = useRef(null);

  // Page title
  useEffect(() => {
    document.title = "Screen Recorder | SocioMee";
    return () => {
      document.title = "SocioMee";
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
    // eslint-disable-next-line
  }, []);

  const stopEverything = useCallback(() => {
    clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (watermarkRefs.current) {
      watermarkRefs.current.video.srcObject = null;
      watermarkRefs.current = null;
    }
  }, []);

  const showMsg = (type, text, duration = 4000) => {
    setStatusMsg({ type, text });
    if (duration) setTimeout(() => setStatusMsg(null), duration);
  };

  const startRecording = async () => {
    try {
      // Display media constraints
      const displayConstraints = {
        video: {
          cursor: "always",
          displaySurface:
            captureMode === "tab"
              ? "browser"
              : captureMode === "window"
              ? "window"
              : "monitor",
        },
        audio: true, // system audio (if browser supports)
      };

      let displayStream;
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia(
          displayConstraints
        );
      } catch (err) {
        showMsg("error", "Screen share cancelled or permission denied.");
        return;
      }

      // Mic audio
      let micStream = null;
      if (includeMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
        } catch {
          showMsg("info", "Mic permission denied — recording without mic.");
        }
      }

      // Merge audio tracks
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();

      // System audio from display stream
      displayStream.getAudioTracks().forEach((track) => {
        const src = audioCtx.createMediaStreamSource(
          new MediaStream([track])
        );
        src.connect(dest);
      });

      // Mic audio
      if (micStream) {
        micStream.getAudioTracks().forEach((track) => {
          const src = audioCtx.createMediaStreamSource(
            new MediaStream([track])
          );
          src.connect(dest);
        });
      }

      let finalVideoStream = displayStream;

      // Watermark via canvas
      if (addWatermark) {
        const { canvasStream, canvas, video } = createWatermarkedStream(
          displayStream
        );
        watermarkRefs.current = { canvas, video };
        finalVideoStream = canvasStream;
      }

      // Combine video + merged audio
      const combinedTracks = [
        ...finalVideoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ];
      const finalStream = new MediaStream(combinedTracks);
      streamRef.current = displayStream; // keep original for cleanup

      // Live preview
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = new MediaStream(
          finalVideoStream.getVideoTracks()
        );
        liveVideoRef.current.play().catch(() => {});
      }

      // MediaRecorder
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const recorder = new MediaRecorder(finalStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const ts = new Date();
        const name = `SocioMee_${ts.toISOString().slice(0, 19).replace(/[T:]/g, "-")}.webm`;
        const rec = { id: Date.now(), name, url, size: blob.size, duration: elapsed, blob };
        setRecordings((prev) => [rec, ...prev]);
        setShowSaveOptions(rec);
        clearInterval(timerRef.current);
        setElapsed(0);
        setStatus("idle");
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = null;
        }
      };

      // Handle user stopping share from browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
      };

      recorder.start(1000); // collect data every 1s
      setStatus("recording");
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((p) => p + 1);
      }, 1000);

      showMsg("info", "Recording started. Click Stop when done.", 3000);
    } catch (err) {
      console.error(err);
      showMsg("error", `Error: ${err.message}`);
    }
  };

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setStatus("paused");
    } else if (mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setElapsed((p) => p + 1);
      }, 1000);
      setStatus("recording");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    stopEverything();
    setStatus("stopped");
  };

  const downloadRecording = (rec) => {
    const a = document.createElement("a");
    a.href = rec.url;
    a.download = rec.name;
    a.click();
  };

  const deleteRecording = (id) => {
    setRecordings((prev) => {
      const rec = prev.find((r) => r.id === id);
      if (rec) URL.revokeObjectURL(rec.url);
      return prev.filter((r) => r.id !== id);
    });
    if (showPreviewFor === id) setShowPreviewFor(null);
  };

  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isActive = isRecording || isPaused;

  const msgColors = {
    info: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", color: "#93c5fd" },
    error: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", color: "#f87171" },
    success: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", color: "#34d399" },
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes recRing {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        .sm-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .sm-btn:active { transform: translateY(0); }
        .sm-icon-btn:hover { background: rgba(124,58,237,0.15) !important; color: #a78bfa !important; border-color: rgba(124,58,237,0.4) !important; }
        .sm-chip:hover { background: rgba(124,58,237,0.1) !important; color: #c4b5fd !important; }
        .rec-ring { animation: recRing 1.5s infinite; }
      `}</style>

      <div style={styles.page}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badge}>
            <span>⬤</span> Media Tools
          </div>
          <h1 style={styles.title}>Screen Recorder</h1>
          <p style={styles.subtitle}>
            Capture your screen, browser tab, or window — no installs, no
            extensions.
          </p>
        </div>

        <div style={styles.grid}>
          {/* ── Left column: preview + controls ── */}
          <div>
            {/* Preview card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span>🎬</span>
                <span>Live Preview</span>
                {isActive && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "11px",
                      color: "#f87171",
                      fontFamily: "'Orbitron', sans-serif",
                      letterSpacing: "1px",
                    }}
                  >
                    {isPaused ? "⏸ PAUSED" : "● LIVE"}
                  </span>
                )}
              </div>
              <div style={styles.cardBody}>
                {/* Video preview + overlay */}
                <div
                  style={{
                    ...styles.previewWrap,
                    ...(isActive
                      ? {
                          border: "1px solid rgba(239,68,68,0.4)",
                          boxShadow: "0 0 0 0 rgba(239,68,68,0.5)",
                        }
                      : {}),
                  }}
                  className={isRecording ? "rec-ring" : ""}
                >
                  <video
                    ref={liveVideoRef}
                    style={{
                      ...styles.previewVideo,
                      display: isActive ? "block" : "none",
                    }}
                    muted
                    playsInline
                  />

                  {/* Placeholder when idle */}
                  {!isActive && (
                    <div style={styles.previewPlaceholder}>
                      <div style={styles.placeholderIcon}>🖥️</div>
                      <div style={styles.placeholderText}>
                        Preview appears here once you start recording
                      </div>
                    </div>
                  )}

                  {/* REC badge */}
                  {isRecording && (
                    <div style={styles.recBadge}>
                      <div style={styles.recDot} />
                      REC
                    </div>
                  )}

                  {/* Timer */}
                  {isActive && (
                    <div style={styles.timerBadge}>{formatTime(elapsed)}</div>
                  )}

                  {/* Floating pause/stop controls */}
                  {isActive && (
                    <div style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      display: "flex",
                      gap: "10px",
                      zIndex: 10,
                    }}>
                      <button
                        className="sm-btn"
                        onClick={pauseRecording}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "8px 16px", borderRadius: "99px", border: "none",
                          background: isPaused ? "rgba(251,191,36,0.9)" : "rgba(0,0,0,0.7)",
                          color: "#fff", fontSize: "12px", fontWeight: "700",
                          cursor: "pointer", fontFamily: "inherit",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}>
                        {isPaused ? "▶ Resume" : "⏸ Pause"}
                      </button>
                      <button
                        className="sm-btn"
                        onClick={stopRecording}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "8px 16px", borderRadius: "99px", border: "none",
                          background: "rgba(239,68,68,0.9)",
                          color: "#fff", fontSize: "12px", fontWeight: "700",
                          cursor: "pointer", fontFamily: "inherit",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}>
                        ⏹ Stop
                      </button>
                    </div>
                  )}

                  {/* Watermark indicator (visual only in preview) */}}
                  {isActive && addWatermark && (
                    <div style={styles.watermark}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#7c3aed",
                          display: "inline-block",
                        }}
                      />
                      sociomee.in
                    </div>
                  )}
                </div>

                {/* Control buttons */}
                <div style={styles.controlsRow}>
                  {!isActive && (
                    <button
                      className="sm-btn"
                      style={{ ...styles.btn, ...styles.btnPrimary, flex: 1 }}
                      onClick={startRecording}
                    >
                      ⬤ Start Recording
                    </button>
                  )}

                  {isActive && (
                    <>
                      <button
                        className="sm-btn"
                        style={{ ...styles.btn, ...styles.btnPause }}
                        onClick={pauseRecording}
                      >
                        {isPaused ? "▶ Resume" : "⏸ Pause"}
                      </button>
                      <button
                        className="sm-btn"
                        style={{
                          ...styles.btn,
                          ...styles.btnDanger,
                          flex: 1,
                        }}
                        onClick={stopRecording}
                      >
                        ⏹ Stop & Save
                      </button>
                    </>
                  )}
                </div>

                {/* Status message */}
                {statusMsg && (
                  <div
                    style={{
                      ...styles.statusBar,
                      background: msgColors[statusMsg.type].bg,
                      border: `1px solid ${msgColors[statusMsg.type].border}`,
                      color: msgColors[statusMsg.type].color,
                    }}
                  >
                    <span>
                      {statusMsg.type === "error"
                        ? "⚠"
                        : statusMsg.type === "success"
                        ? "✓"
                        : "ℹ"}
                    </span>
                    {statusMsg.text}
                  </div>
                )}
              </div>
            </div>

            {/* Recordings list */}
            {recordings.length > 0 && (
              <div style={{ ...styles.card, marginTop: "16px" }}>
                <div style={styles.cardHeader}>
                  <span>📁</span>
                  <span>Saved Recordings</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "rgba(124,58,237,0.2)",
                      color: "#a78bfa",
                      borderRadius: "12px",
                      padding: "1px 8px",
                      fontSize: "11px",
                    }}
                  >
                    {recordings.length}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  {recordings.map((rec) => (
                    <div key={rec.id}>
                      <div style={styles.recItem}>
                        {/* Thumbnail from video */}
                        <video
                          src={rec.url}
                          style={styles.recThumb}
                          muted
                          preload="metadata"
                        />
                        <div style={styles.recMeta}>
                          <div style={styles.recName}>{rec.name}</div>
                          <div style={styles.recSize}>
                            {formatBytes(rec.size)} •{" "}
                            {formatTime(rec.duration)} • WebM
                          </div>
                        </div>
                        <div style={styles.recActions}>
                          <button
                            className="sm-icon-btn"
                            style={styles.iconBtn}
                            title="Preview"
                            onClick={() =>
                              setShowPreviewFor(
                                showPreviewFor === rec.id ? null : rec.id
                              )
                            }
                          >
                            {showPreviewFor === rec.id ? "✕" : "▶"}
                          </button>
                          <button
                            className="sm-icon-btn"
                            style={styles.iconBtn}
                            title="Download"
                            onClick={() => downloadRecording(rec)}
                          >
                            ↓
                          </button>
                          <button
                            className="sm-icon-btn"
                            style={{
                              ...styles.iconBtn,
                              color: "#f87171",
                            }}
                            title="Delete"
                            onClick={() => deleteRecording(rec.id)}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                      {/* Inline playback */}
                      {showPreviewFor === rec.id && (
                        <div
                          style={{
                            marginTop: "-2px",
                            marginBottom: "8px",
                            borderRadius: "0 0 10px 10px",
                            overflow: "hidden",
                            background: "#050505",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderTop: "none",
                          }}
                        >
                          <video
                            src={rec.url}
                            controls
                            style={{ width: "100%", display: "block" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: settings ── */}
          <div>
            {/* Capture Mode */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span>⚙️</span>
                <span>Recording Settings</span>
              </div>
              <div style={styles.cardBody}>
                {/* Capture target */}
                <div style={styles.optionGroup}>
                  <span style={styles.optionLabel}>Capture target</span>
                  <div style={styles.optionRow}>
                    {[
                      { key: "screen", label: "🖥 Full Screen" },
                      { key: "window", label: "🪟 Window" },
                      { key: "tab", label: "⬭ Tab" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        disabled={isActive}
                        className="sm-chip"
                        style={{
                          ...styles.optionChip,
                          ...(captureMode === m.key
                            ? styles.optionChipActive
                            : {}),
                          ...(isActive ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                        }}
                        onClick={() => !isActive && setCaptureMode(m.key)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#4b5563",
                      marginTop: "6px",
                    }}
                  >
                    {captureMode === "screen" &&
                      "Captures entire display including all windows."}
                    {captureMode === "window" &&
                      "Choose a specific app window to capture."}
                    {captureMode === "tab" &&
                      "Captures just the selected browser tab."}
                  </div>
                </div>

                {/* Toggles */}
                <div style={styles.toggleRow}>
                  <label style={styles.toggleLabel}>
                    <span>🎙</span>
                    <span>
                      Microphone audio
                      <span style={styles.toggleSub}>
                        Record your voice alongside screen
                      </span>
                    </span>
                  </label>
                  <Toggle
                    on={includeMic}
                    onChange={(v) => !isActive && setIncludeMic(v)}
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
