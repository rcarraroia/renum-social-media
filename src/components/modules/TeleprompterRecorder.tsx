import React from "react";
import { format } from "date-fns";

type Props = {
  script: string;
  estimatedDuration?: number; // seconds
  onComplete: (blobUrl: string, blob: Blob) => void;
  onBack: () => void;
  maxDuration?: number; // seconds - optional cap (e.g., based on plan)
};

const defaultMax = 600; // 10 minutes fallback

function secondsToMMSS(s: number) {
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${mm}:${ss}`;
}

const TeleprompterRecorder: React.FC<Props> = ({ script, estimatedDuration = 60, onComplete, onBack, maxDuration = defaultMax }) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const previewRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const recorderRef = React.useRef<any>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const [facingMode, setFacingMode] = React.useState<"user" | "environment">("user");
  const [isRecording, setIsRecording] = React.useState(false);
  const [isCountdown, setIsCountdown] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number>(3);
  const [recordSec, setRecordSec] = React.useState<number>(0);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [isPreview, setIsPreview] = React.useState(false);
  const [isPausedTeleprompter, setIsPausedTeleprompter] = React.useState(false);
  const [audioLevel, setAudioLevel] = React.useState(0);
  const teleRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const maxAllowed = Math.min(maxDuration ?? defaultMax, 6000); // sanity cap

  // audio analyser
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const dataArrayRef = React.useRef<Uint8Array | null>(null);

  // cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopStream();
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // close audio context
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startStream = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Seu navegador não suporta captura de mídia. Use Chrome ou Safari.");
      return;
    }
    try {
      const constraints: any = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      // setup audio analyser
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(s);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
          // calculate RMS
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const v = (dataArrayRef.current[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArrayRef.current.length);
          setAudioLevel(Math.min(1, rms * 2));
          rafRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (e) {
        // audio analyser optional
      }
    } catch (err) {
      // if permission denied, bubble up
      // eslint-disable-next-line no-console
      console.error("getUserMedia failed", err);
      alert("Não foi possível acessar a câmera/microfone. Verifique as permissões.");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
    }
  };

  React.useEffect(() => {
    // auto start stream when component mounts
    startStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleFacing = async () => {
    setFacingMode((f) => (f === "user" ? "environment" : "user"));
    // restart stream to apply
    stopStream();
    setTimeout(() => startStream(), 200);
  };

  const startCountdownAndRecord = () => {
    if (!script || script.trim().length === 0) {
      alert("Script vazio — não é possível começar a gravação.");
      return;
    }
    setIsCountdown(true);
    setCountdown(3);
    let n = 3;
    const interval = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        clearInterval(interval);
        setIsCountdown(false);
        beginRecording();
      }
    }, 1000);
  };

  const beginRecording = async () => {
    if (!streamRef.current) {
      await startStream();
      if (!streamRef.current) {
        alert("Não há stream disponível");
        return;
      }
    }

    // reset previous
    chunksRef.current = [];
    setIsRecording(true);
    setRecordSec(0);
    setIsPreview(false);
    setBlobUrl(null);

    try {
      const options: any = { mimeType: "video/webm;codecs=vp9,opus" };
      const mediaRecorder = new (window as any).MediaRecorder(streamRef.current, options);
      recorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setIsPreview(true);
        setIsRecording(false);
        // stop stream to save resources
        stopStream();
      };
      mediaRecorder.start(250);
    } catch (e) {
      // fallback simpler start
      try {
        const mediaRecorder = new (window as any).MediaRecorder(streamRef.current);
        recorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setIsPreview(true);
          setIsRecording(false);
          stopStream();
        };
        mediaRecorder.start(250);
      } catch (err) {
        console.error("MediaRecorder error", err);
        alert("Não foi possível iniciar a gravação neste navegador.");
        setIsRecording(false);
        return;
      }
    }

    // start timers
    const start = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setRecordSec(elapsed);
      // warning at 10s
      if (maxDuration - elapsed === 10) {
        // show visual warning (handled by render)
      }
      if (elapsed >= maxDuration) {
        // stop recording
        stopRecording();
        return;
      }
      if (isRecording) {
        setTimeout(tick, 250);
      }
    };
    tick();
  };

  const stopRecording = () => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch (e) {
      // ignore
    }
    setIsRecording(false);
  };

  const handleUseVideo = async () => {
    if (!blobUrl) return;
    // fetch blob
    const resp = await fetch(blobUrl);
    const blob = await resp.blob();
    onComplete(blobUrl, blob);
  };

  const handleReRecord = () => {
    if (!confirm("Tem certeza? O vídeo atual será descartado.")) return;
    // revoke blob
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    // restart stream
    setIsPreview(false);
    setRecordSec(0);
    startStream();
  };

  // teleprompter scroll management
  React.useEffect(() => {
    if (!teleRef.current) return;
    // compute speed in px/sec so that full scroll matches estimatedDuration
    const el = teleRef.current;
    const totalScroll = el.scrollHeight - el.clientHeight;
    if (totalScroll <= 0) return;

    const duration = Math.max(estimatedDuration, 5);
    const pxPerSec = totalScroll / duration;
    let last = performance.now();

    const step = (now: number) => {
      if (isPausedTeleprompter || isCountdown) {
        last = now;
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const dt = (now - last) / 1000;
      last = now;
      el.scrollTop = Math.min(el.scrollTop + pxPerSec * dt, totalScroll);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teleRef, estimatedDuration, isPausedTeleprompter, isCountdown, script]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 text-white flex flex-col md:flex-row">
      <div className="flex-1 relative flex flex-col">
        {/* top-left recording indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 px-3 py-1 rounded">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <div className="text-xs font-medium">{secondsToMMSS(recordSec)}</div>
          </div>
        )}

        {/* top-right camera controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          <button onClick={toggleFacing} className="bg-black/40 px-3 py-1 rounded">🔄 Câmera</button>
          <button onClick={() => {
            if (!document.fullscreenElement) {
              const el = document.documentElement;
              if (el.requestFullscreen) el.requestFullscreen();
            } else {
              if (document.exitFullscreen) document.exitFullscreen();
            }
          }} className="bg-black/40 px-3 py-1 rounded">⛶ Tela Cheia</button>
          <button onClick={() => {
            if (isRecording) {
              if (confirm("Parar a gravação?")) {
                stopRecording();
              }
            } else {
              if (confirm("Sair sem salvar?")) {
                stopStream();
                onBack();
              }
            }
          }} className="bg-black/40 px-3 py-1 rounded">✖</button>
        </div>

        {/* camera preview */}
        <div className="flex-1 flex items-center justify-center">
          {!isPreview ? (
            <video ref={videoRef} className="w-full h-full object-cover bg-black" playsInline />
          ) : (
            <video ref={previewRef} src={blobUrl ?? undefined} controls className="w-full h-full object-contain bg-black" />
          )}
        </div>

        {/* bottom controls */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 px-4">
          <button onClick={() => setIsPausedTeleprompter((s) => !s)} className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
            {isPausedTeleprompter ? "▶" : "II"}
          </button>

          {!isRecording ? (
            <button onClick={startCountdownAndRecord} className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-2xl shadow-lg">●</button>
          ) : (
            <button onClick={stopRecording} className="w-20 h-20 rounded-full bg-red-700 flex items-center justify-center text-xl shadow-lg">■</button>
          )}

          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
            <div style={{ width: 16, height: Math.max(4, Math.round(audioLevel * 12)), background: audioLevel > 0.5 ? "#ef4444" : "#10b981" }} />
          </div>
        </div>
      </div>

      {/* teleprompter area */}
      <div className="md:w-1/3 w-full bg-black/80 text-white p-4 relative">
        {/* center reference line */}
        <div className="absolute inset-x-0 top-1/2 border-t border-white/20 pointer-events-none" />
        <div ref={teleRef} className="h-[30vh] md:h-full overflow-hidden relative">
          <div className="px-2 leading-relaxed whitespace-pre-wrap text-lg md:text-xl" style={{ transform: isPausedTeleprompter ? "scale(1)" : "none" }}>
            {script}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-400">Velocidade: Médio • Fonte: Médio</div>
          <div className="text-xs text-slate-400">Duração estimada: {secondsToMMSS(estimatedDuration)}</div>
        </div>

        {/* countdown overlay */}
        {isCountdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
            <div className="text-6xl font-bold">{countdown}</div>
          </div>
        )}

        {/* time warning */}
        {isRecording && (maxDuration - recordSec) <= 10 && (maxDuration - recordSec) > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded">{maxDuration - recordSec}s restantes</div>
        )}
      </div>

      {/* post-record preview actions */}
      {isPreview && blobUrl && (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-4 pointer-events-none">
          <div className="bg-white text-black w-full md:max-w-3xl rounded-t-lg md:rounded-lg p-4 pointer-events-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Preview do Vídeo</div>
              <div className="text-sm text-slate-600">{secondsToMMSS(recordSec)}</div>
            </div>

            <video src={blobUrl} controls className="w-full rounded" />

            <div className="mt-3 flex gap-2 justify-end">
              <button onClick={handleReRecord} className="px-3 py-2 rounded bg-gray-100">Regravar</button>
              <button onClick={() => {
                // use this video
                handleUseVideo();
              }} className="px-4 py-2 rounded bg-indigo-600 text-white">Usar este Vídeo ✓</button>
              <button onClick={() => {
                if (confirm("Sair e descartar vídeo?")) {
                  // discard and exit
                  if (blobUrl) URL.revokeObjectURL(blobUrl);
                  onBack();
                }
              }} className="px-3 py-2 rounded bg-white border">Sair</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeleprompterRecorder;