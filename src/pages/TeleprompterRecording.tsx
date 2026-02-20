import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Circle, Square, Pause, Settings } from "lucide-react";
import type { AspectRatio } from "@/lib/compatibility";
import { showSuccess, showError } from "@/utils/toast";
import { loadPreferences, saveTeleprompterPreferences } from "@/services/userPreferences";
import { useAnalytics } from "@/services/analytics";

interface LocationState {
  script: string;
  aspectRatio: AspectRatio;
  recordTextInVideo: boolean;
  theme?: string;
  audience?: string;
  selectedPlatforms?: string[];
}

const TeleprompterRecording: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const analytics = useAnalytics();

  // Validar se temos os dados necessários
  useEffect(() => {
    if (!state?.script) {
      showError("Nenhum script disponível. Redirecionando...");
      navigate("/module-1/script-ai");
    }
  }, [state, navigate]);

  // Carregar preferências salvas
  useEffect(() => {
    const prefs = loadPreferences();
    setScrollSpeed(prefs.teleprompter.scrollSpeed);
    setFontSize(prefs.teleprompter.fontSize);
    setTextOpacity(prefs.teleprompter.textOpacity);
    setTextPosition(prefs.teleprompter.textPosition);
    setTextColor(prefs.teleprompter.textColor);
  }, []);

  // Estados principais
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Configurações do teleprompter
  const [scrollSpeed, setScrollSpeed] = useState(5);
  const [fontSize, setFontSize] = useState(24);
  const [textOpacity, setTextOpacity] = useState(0.7);
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("center");
  const [textColor, setTextColor] = useState<"white" | "yellow">("white");
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [currentAdjustment, setCurrentAdjustment] = useState<"size" | "speed" | "position">("size");

  // Adjustment values
  const adjustments = {
    size: { min: 16, max: 48, value: fontSize, label: `${fontSize}px` },
    speed: { min: 1, max: 10, value: scrollSpeed, label: `${scrollSpeed}/10` },
    position: { min: 0, max: 2, value: textPosition === "top" ? 0 : textPosition === "center" ? 1 : 2, label: textPosition === "top" ? "Topo" : textPosition === "center" ? "Centro" : "Baixo" },
  };

  const handleAdjustmentChange = (value: number) => {
    if (currentAdjustment === "size") {
      setFontSize(value);
      saveTeleprompterPreferences({ fontSize: value });
    } else if (currentAdjustment === "speed") {
      setScrollSpeed(value);
      saveTeleprompterPreferences({ scrollSpeed: value });
    } else if (currentAdjustment === "position") {
      const pos = value === 0 ? "top" : value === 1 ? "center" : "bottom";
      setTextPosition(pos);
      saveTeleprompterPreferences({ textPosition: pos });
    }
  };

  const resetAdjustment = () => {
    if (currentAdjustment === "size") {
      setFontSize(24);
    } else if (currentAdjustment === "speed") {
      setScrollSpeed(5);
    } else if (currentAdjustment === "position") {
      setTextPosition("center");
    }
  };

  const cycleAdjustment = (direction: "prev" | "next") => {
    const options: Array<"size" | "speed" | "position"> = ["size", "speed", "position"];
    const currentIndex = options.indexOf(currentAdjustment);
    
    if (direction === "prev") {
      setCurrentAdjustment(options[(currentIndex - 1 + options.length) % options.length]);
    } else {
      setCurrentAdjustment(options[(currentIndex + 1) % options.length]);
    }
  };

  // Refs
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const scriptContainerRef = useRef<HTMLDivElement | null>(null);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);

  // Formatar tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Voltar para página anterior
  const handleBack = () => {
    if (isRecording) {
      if (!confirm("Gravação em andamento. Deseja realmente sair?")) {
        return;
      }
      stopRecording();
    }
    
    // Limpar recursos
    cleanup();
    navigate("/module-1/script-ai");
  };

  // Cleanup de recursos
  const cleanup = useCallback(() => {
    // Parar gravação
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Parar streams
    canvasStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Limpar timers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Limpar áudio
    analyserRef.current?.disconnect();
    audioContextRef.current?.close();
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Teleprompter scroll logic
  useEffect(() => {
    if (!isScrolling || !scriptContainerRef.current) {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      return;
    }

    const scroll = () => {
      if (!scriptContainerRef.current) return;

      const increment = scrollSpeed * 0.2;
      setScrollPosition((prev) => {
        const newPosition = prev + increment;
        const maxScroll = scriptContainerRef.current!.scrollHeight - scriptContainerRef.current!.clientHeight;

        if (newPosition >= maxScroll) {
          setIsScrolling(false);
          return maxScroll;
        }

        return newPosition;
      });

      scrollAnimationRef.current = requestAnimationFrame(scroll);
    };

    scrollAnimationRef.current = requestAnimationFrame(scroll);

    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, [isScrolling, scrollSpeed]);

  // Update scroll position
  useEffect(() => {
    if (scriptContainerRef.current) {
      scriptContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // Audio monitoring
  const updateAudioLevel = useCallback(() => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

    analyser.getByteTimeDomainData(dataArray);
    const normalized =
      Array.from(dataArray).reduce((acc, value) => acc + Math.abs(value - 128), 0) /
      dataArray.length;
    setAudioLevel(Math.min(normalized / 128, 1));

    rafRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  // Canvas drawing
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = cameraVideoRef.current;
    
    if (!canvas || !video || !cameraReady) return;
    if (!video.videoWidth || !video.videoHeight) {
      setTimeout(() => drawFrame(), 100);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const scale = Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight);
    const scaledWidth = videoWidth * scale;
    const scaledHeight = videoHeight * scale;

    const x = (canvasWidth - scaledWidth) / 2;
    const y = (canvasHeight - scaledHeight) / 2;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -scaledWidth - x, y, scaledWidth, scaledHeight);
    ctx.restore();

    animationFrameRef.current = requestAnimationFrame(drawFrame);
  }, [cameraReady]);

  // Start recording with countdown
  const startWithCountdown = useCallback(async () => {
    if (isRecording || isInitializing || countdown !== null) return;

    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCountdown(null);
    await startRecording();
    
    setTimeout(() => {
      setIsScrolling(true);
    }, 1000);
  }, [isRecording, isInitializing, countdown]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecording || isInitializing) return;

    setIsInitializing(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user",
        }
      });
      
      mediaStreamRef.current = stream;

      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }

      setCameraReady(true);

      const canvas = canvasRef.current;
      if (canvas) {
        const aspectRatio = state.aspectRatio || "9:16";
        if (aspectRatio === "9:16") {
          canvas.width = 720;
          canvas.height = 1280;
        } else if (aspectRatio === "1:1") {
          canvas.width = 720;
          canvas.height = 720;
        } else {
          canvas.width = 1280;
          canvas.height = 720;
        }

        drawFrame();

        const canvasStream = canvas.captureStream(24);
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          canvasStream.addTrack(audioTrack);
        }

        canvasStreamRef.current = canvasStream;

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = canvasStream;
          previewVideoRef.current.play().catch(() => {
            setTimeout(() => previewVideoRef.current?.play(), 200);
          });
        }
      }

      const canvasStream = canvasStreamRef.current;
      if (canvasStream) {
        const recorder = new MediaRecorder(canvasStream);
        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        recorder.onstop = finalizeRecording;
        recorder.start();
        
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        setIsRecording(true);
        setRecordingTime(0);

        timerIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        updateAudioLevel();
      }
      
      setIsInitializing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao acessar câmera/microfone";
      showError(errorMessage);
      setIsInitializing(false);
    }
  }, [isRecording, isInitializing, drawFrame, updateAudioLevel, state.aspectRatio]);

  // Finalize recording
  const finalizeRecording = useCallback(() => {
    setIsRecording(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current?.disconnect();
    audioContextRef.current?.close();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    chunksRef.current = [];
    
    // Track video recording
    analytics.trackVideoRecorded(recordingTime, state.aspectRatio, false);
    
    showSuccess("Vídeo gravado com sucesso!");

    // Navigate back with video
    navigate("/module-1/script-ai", {
      state: {
        recordedVideo: blob,
        aspectRatio: state.aspectRatio,
        selectedPlatforms: state.selectedPlatforms,
      },
    });

    canvasStreamRef.current?.getTracks().forEach((track) => track.stop());
    canvasStreamRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
    
    setCameraReady(false);
    setRecordingTime(0);
  }, [navigate, state.aspectRatio, state.selectedPlatforms, analytics, recordingTime]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [isRecording]);

  // Toggle pause
  const togglePause = useCallback(() => {
    if (!isRecording) return;
    
    if (isPaused) {
      mediaRecorderRef.current?.resume();
      setIsScrolling(true);
    } else {
      mediaRecorderRef.current?.pause();
      setIsScrolling(false);
    }
    setIsPaused(!isPaused);
  }, [isRecording, isPaused]);

  if (!state?.script) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Hidden elements for processing */}
      <video ref={cameraVideoRef} style={{ display: 'none' }} autoPlay muted playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header minimalista */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden md:inline">Voltar</span>
        </button>

        {isRecording && (
          <div className="text-white font-mono text-xl md:text-2xl font-bold">
            {formatTime(recordingTime)}
          </div>
        )}

        <div className="w-20" /> {/* Spacer para centralizar timer */}
      </div>

      {/* Preview da câmera (fullscreen) */}
      <div className="absolute inset-0">
        <video
          ref={previewVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Espelhado
        />

        {/* Teleprompter Overlay (quando gravando) */}
        {isRecording && state.script && (
          <div 
            className="absolute left-0 right-0 flex items-start justify-center pointer-events-none overflow-hidden"
            style={{ 
              height: "50%",
              top: textPosition === "top" ? "0" : textPosition === "center" ? "50%" : "auto",
              bottom: textPosition === "bottom" ? "0" : "auto",
              transform: textPosition === "center" ? "translateY(-50%)" : "none"
            }}
          >
            <div
              ref={scriptContainerRef}
              className="w-full h-full overflow-y-auto"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${textOpacity})`,
              }}
            >
              <div 
                className="p-8 text-center leading-relaxed"
                style={{ 
                  fontSize: `${fontSize}px`,
                  color: textColor === "yellow" ? "#FFC107" : "white",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.9)",
                }}
              >
                {state.script}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder quando câmera não está pronta */}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center text-white px-6">
              <div className="text-8xl mb-6">📹</div>
              <h2 className="text-2xl font-bold mb-3">Pronto para gravar?</h2>
              <p className="text-slate-300 mb-8">
                Seu script está pronto. Vamos começar!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controles na parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent z-50">
        {!isRecording ? (
          <>
            {/* Ajustes visuais (carousel) */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button 
                onClick={() => cycleAdjustment("prev")}
                className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                ←
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setCurrentAdjustment("size")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentAdjustment === "size" 
                      ? "bg-white text-black" 
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  Tamanho
                </button>
                <button 
                  onClick={() => setCurrentAdjustment("speed")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentAdjustment === "speed" 
                      ? "bg-white text-black" 
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  Velocidade
                </button>
                <button 
                  onClick={() => setCurrentAdjustment("position")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentAdjustment === "position" 
                      ? "bg-white text-black" 
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  Posição
                </button>
              </div>
              
              <button 
                onClick={() => cycleAdjustment("next")}
                className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                →
              </button>
            </div>

            {/* Slider de ajuste */}
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={resetAdjustment}
                className="text-white text-sm hover:text-white/80 transition-colors"
              >
                Reset
              </button>
              <input 
                type="range"
                min={adjustments[currentAdjustment].min}
                max={adjustments[currentAdjustment].max}
                value={adjustments[currentAdjustment].value}
                onChange={(e) => handleAdjustmentChange(Number(e.target.value))}
                className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white ${((adjustments[currentAdjustment].value - adjustments[currentAdjustment].min) / (adjustments[currentAdjustment].max - adjustments[currentAdjustment].min)) * 100}%, rgba(255,255,255,0.2) ${((adjustments[currentAdjustment].value - adjustments[currentAdjustment].min) / (adjustments[currentAdjustment].max - adjustments[currentAdjustment].min)) * 100}%)`
                }}
              />
              <span className="text-white text-sm min-w-[60px] text-right">
                {adjustments[currentAdjustment].label}
              </span>
            </div>

            {/* Botão GRAVAR - ENORME */}
            <div className="flex justify-center mb-6">
              {countdown !== null ? (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-6xl text-white font-bold">{countdown}</span>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={isInitializing}
                  className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  <Circle className="w-16 h-16 text-white fill-current" />
                </button>
              )}
            </div>

            {/* Controles extras */}
            <div className="flex items-center justify-center gap-6">
              <button 
                onClick={() => setShowAdjustments(!showAdjustments)}
                className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Durante gravação - controles simples */}
            <div className="flex justify-center gap-6 mb-4">
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition-colors shadow-xl"
              >
                <Square className="w-8 h-8 text-white fill-current" />
              </button>
              
              <button
                onClick={togglePause}
                className="w-20 h-20 rounded-full bg-yellow-500 flex items-center justify-center hover:bg-yellow-600 transition-colors shadow-xl"
              >
                <Pause className="w-8 h-8 text-white" />
              </button>
            </div>

            {/* Indicador de gravação */}
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">Gravando</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer de ajustes (mobile) - Placeholder */}
      {showAdjustments && (
        <div className="absolute inset-0 bg-black/80 z-40 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">⚙️ Ajustes do Teleprompter</h3>
              <button
                onClick={() => setShowAdjustments(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Tamanho da Fonte</label>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">{fontSize}px</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Velocidade</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-gray-500 mt-1">{scrollSpeed}/10</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Posição do Texto</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTextPosition("top")}
                    className={`py-2 rounded ${textPosition === "top" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                  >
                    Topo
                  </button>
                  <button
                    onClick={() => setTextPosition("center")}
                    className={`py-2 rounded ${textPosition === "center" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                  >
                    Centro
                  </button>
                  <button
                    onClick={() => setTextPosition("bottom")}
                    className={`py-2 rounded ${textPosition === "bottom" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
                  >
                    Baixo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeleprompterRecording;
