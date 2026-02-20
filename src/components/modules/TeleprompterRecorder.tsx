import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AspectRatio } from "@/lib/compatibility";

type TeleprompterRecorderProps = {
  onRecordingComplete?: (blob: Blob) => void;
  aspectRatio?: AspectRatio;
  onCameraReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  script?: string;
  fontSize?: number;
  textOpacity?: number;
  textArea?: number;
  textPosition?: "top" | "center" | "bottom";
  textColor?: "white" | "yellow";
  isScrolling?: boolean;
  scrollPosition?: number;
  teleprompterEnabled?: boolean;
  onToggleTeleprompter?: () => void;
  onStartScroll?: () => void; // Nova prop para iniciar scroll
};

const TeleprompterRecorder: React.FC<TeleprompterRecorderProps> = ({
  onRecordingComplete,
  aspectRatio = "9:16",
  onCameraReady,
  onError,
  script = "",
  fontSize = 24,
  textOpacity = 0.7,
  textArea = 50,
  textPosition = "center",
  textColor = "white",
  isScrolling = false,
  scrollPosition = 0,
  teleprompterEnabled = true,
  onToggleTeleprompter,
  onStartScroll,
}) => {
  console.log('[DEBUG TeleprompterRecorder] Props recebidas:', { 
    script: script?.substring(0, 50) + '...', 
    scriptLength: script?.length,
    teleprompterEnabled,
    fontSize,
    textOpacity,
    aspectRatio
  });

  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [recordTextInVideo, setRecordTextInVideo] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Debug: Monitor cameraReady changes
  useEffect(() => {
    console.log('[DEBUG] cameraReady mudou para:', cameraReady);
  }, [cameraReady]);

  // Debug: Monitor isRecording changes
  useEffect(() => {
    console.log('[DEBUG] isRecording mudou para:', isRecording);
  }, [isRecording]);

  // Debug: Monitor isInitializing changes
  useEffect(() => {
    console.log('[DEBUG] isInitializing mudou para:', isInitializing);
  }, [isInitializing]);

  // Refs para vídeo, canvas e preview
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const canvasStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scriptContainerRef = useRef<HTMLDivElement | null>(null);
  const cameraReadyRef = useRef<boolean>(false);

  // Audio monitoring
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Update scroll position for script
  React.useEffect(() => {
    if (scriptContainerRef.current) {
      scriptContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  const cleanupAudioGraph = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    dataArrayRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  }, []);

  const finalizeRecording = useCallback(() => {
    setIsRecording(false);
    cleanupAudioGraph();

    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    chunksRef.current = [];
    
    console.log(`[Teleprompter] Vídeo finalizado - Proporção: ${aspectRatio}`);
    
    onRecordingComplete?.(blob);

    // Stop canvas stream
    canvasStreamRef.current?.getTracks().forEach((track) => track.stop());
    canvasStreamRef.current = null;

    // Stop camera stream
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    
    // Clear preview
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
    
    setCameraReady(false);
    setRecordingTime(0);
  }, [aspectRatio, cleanupAudioGraph, onRecordingComplete]);

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

  // Canvas drawing function
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = cameraVideoRef.current;
    
    const debugInfo = { 
      hasCanvas: !!canvas, 
      hasVideo: !!video, 
      cameraReady: cameraReadyRef.current,
      videoWidth: video?.videoWidth,
      videoHeight: video?.videoHeight,
      videoReadyState: video?.readyState
    };
    
    if (!canvas || !video || !cameraReadyRef.current) {
      console.warn('[Teleprompter drawFrame] Bloqueado:', debugInfo);
      return;
    }
    
    // Check if video has dimensions
    if (!video.videoWidth || !video.videoHeight) {
      console.warn('[Teleprompter drawFrame] Vídeo sem dimensões ainda:', debugInfo);
      // Retry after a short delay
      setTimeout(() => drawFrame(), 100);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Teleprompter drawFrame] Não foi possível obter contexto 2d do canvas');
      return;
    }
    
    // Log only once when drawing starts successfully
    if (!canvas.dataset.drawing) {
      console.log('[Teleprompter drawFrame] Iniciando desenho no canvas com sucesso!', debugInfo);
      canvas.dataset.drawing = 'true';
    }

    // Clear canvas with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions for fitting (contain ao invés de cover para evitar zoom)
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calculate scale to FIT (contain) the canvas - evita zoom excessivo
    const scale = Math.min(canvasWidth / videoWidth, canvasHeight / videoHeight);
    const scaledWidth = videoWidth * scale;
    const scaledHeight = videoHeight * scale;

    // Center the video
    const x = (canvasWidth - scaledWidth) / 2;
    const y = (canvasHeight - scaledHeight) / 2;

    // Draw video (mirrored for natural preview)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -scaledWidth - x, y, scaledWidth, scaledHeight);
    ctx.restore();

    // Draw text overlay if enabled
    if (recordTextInVideo && script && teleprompterEnabled) {
      const textAreaHeight = (canvasHeight * textArea) / 100;
      let textY = 0;

      if (textPosition === "top") {
        textY = 0;
      } else if (textPosition === "center") {
        textY = (canvasHeight - textAreaHeight) / 2;
      } else {
        textY = canvasHeight - textAreaHeight;
      }

      // Draw background
      ctx.fillStyle = `rgba(0, 0, 0, ${textOpacity})`;
      ctx.fillRect(0, textY, canvasWidth, textAreaHeight);

      // Draw text
      ctx.fillStyle = textColor === "yellow" ? "#FFC107" : "white";
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Word wrap
      const words = script.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      const maxWidth = canvasWidth - 80; // padding

      words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      });
      lines.push(currentLine);

      // Draw lines
      const lineHeight = fontSize * 1.5;
      const startY = textY + 40;
      lines.forEach((line, index) => {
        ctx.fillText(line, canvasWidth / 2, startY + (index * lineHeight));
      });
    }

    animationFrameRef.current = requestAnimationFrame(drawFrame);
  }, [recordTextInVideo, script, teleprompterEnabled, textArea, textPosition, textOpacity, textColor, fontSize]);

  // Função para iniciar com contagem regressiva
  const startWithCountdown = useCallback(async () => {
    if (isRecording || isInitializing || countdown !== null) return;

    // Contagem regressiva: 3, 2, 1
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCountdown(null);
    
    // Iniciar gravação
    await startRecording();
    
    // Iniciar scroll do teleprompter após 1 segundo
    setTimeout(() => {
      if (onStartScroll) {
        onStartScroll();
      }
    }, 1000);
  }, [isRecording, isInitializing, countdown, onStartScroll]);

  const startRecording = useCallback(async () => {
    console.log('[Teleprompter] startRecording chamado. isRecording:', isRecording, 'isInitializing:', isInitializing);
    
    if (isRecording || isInitializing) {
      console.log('[Teleprompter] Bloqueado: já está gravando ou inicializando');
      return;
    }

    console.log('[Teleprompter] Iniciando processo de gravação...');
    setIsInitializing(true);
    
    try {
      // Get camera stream (always request best quality, we'll process it)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user",
        }
      });
      
      mediaStreamRef.current = stream;

      // Setup hidden camera video
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        try {
          console.log('[Teleprompter] Iniciando camera video...');
          await cameraVideoRef.current.play();
          console.log('[Teleprompter] Camera video iniciado com sucesso!');
        } catch (err) {
          console.warn('[Teleprompter] Camera video play interrupted, retrying...', err);
          // Retry once after a small delay
          await new Promise(resolve => setTimeout(resolve, 100));
          await cameraVideoRef.current.play();
          console.log('[Teleprompter] Camera video iniciado após retry!');
        }
      }

      // IMPORTANTE: Definir cameraReady ANTES de iniciar drawFrame
      console.log('[Teleprompter] Definindo cameraReady = true ANTES de drawFrame');
      cameraReadyRef.current = true;
      setCameraReady(true);
      onCameraReady?.(stream);

      // Setup canvas with correct dimensions (usando 720p para melhor performance)
      const canvas = canvasRef.current;
      if (canvas) {
        if (aspectRatio === "9:16") {
          canvas.width = 720;  // Reduzido de 1080
          canvas.height = 1280; // Reduzido de 1920
        } else if (aspectRatio === "1:1") {
          canvas.width = 720;  // Reduzido de 1080
          canvas.height = 720; // Reduzido de 1080
        } else {
          canvas.width = 1280; // Reduzido de 1920
          canvas.height = 720; // Reduzido de 1080
        }

        console.log(`[Teleprompter] Canvas configurado: ${canvas.width}x${canvas.height} (${aspectRatio}) - 720p para melhor performance`);

        // Start drawing frames - AGORA cameraReady já é TRUE
        console.log('[Teleprompter] Iniciando drawFrame...');
        drawFrame();

        // Capture canvas stream (reduzido para 24 FPS para melhor performance)
        console.log('[Teleprompter] Capturando canvas stream...');
        const canvasStream = canvas.captureStream(24); // Reduzido de 30 FPS
        console.log('[Teleprompter] Canvas stream capturado:', canvasStream);
        
        // Add audio from camera stream
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log('[Teleprompter] Adicionando áudio ao canvas stream...');
          canvasStream.addTrack(audioTrack);
        } else {
          console.warn('[Teleprompter] Nenhuma faixa de áudio encontrada!');
        }

        canvasStreamRef.current = canvasStream;
        console.log('[Teleprompter] Canvas stream salvo em ref');

        // Setup preview with canvas stream - NON-BLOCKING
        if (previewVideoRef.current) {
          console.log('[Teleprompter] Configurando preview video...');
          // Clear any previous srcObject to avoid conflicts
          if (previewVideoRef.current.srcObject) {
            console.log('[Teleprompter] Limpando stream anterior do preview...');
            const oldStream = previewVideoRef.current.srcObject as MediaStream;
            oldStream.getTracks().forEach(track => track.stop());
          }
          
          previewVideoRef.current.srcObject = canvasStream;
          
          // Try to play but don't block if it fails
          console.log('[Teleprompter] Tentando iniciar preview video (non-blocking)...');
          previewVideoRef.current.play().then(() => {
            console.log('[Teleprompter] Preview video iniciado com sucesso!');
          }).catch((err) => {
            console.warn('[Teleprompter] Preview video play failed, will retry:', err);
            // Retry after a delay
            setTimeout(() => {
              if (previewVideoRef.current) {
                previewVideoRef.current.play().then(() => {
                  console.log('[Teleprompter] Preview video iniciado após retry!');
                }).catch((retryErr) => {
                  console.error('[Teleprompter] Preview video play failed after retry:', retryErr);
                });
              }
            }, 200);
          });
        } else {
          console.error('[Teleprompter] previewVideoRef.current é null!');
        }
      } else {
        console.error('[Teleprompter] Canvas ref é null!');
      }
      
      // cameraReady já foi definido ANTES de drawFrame
      // Removido: setCameraReady(true) e onCameraReady?.(stream)

      // Start recording canvas stream
      console.log('[Teleprompter] Iniciando gravação...');
      const canvasStream = canvasStreamRef.current;
      console.log('[Teleprompter] Canvas stream da ref:', canvasStream);
      
      if (canvasStream) {
        console.log('[Teleprompter] Criando MediaRecorder...');
        const recorder = new MediaRecorder(canvasStream);
        console.log('[Teleprompter] MediaRecorder criado:', recorder);
        
        recorder.ondataavailable = handleDataAvailable;
        recorder.onstop = finalizeRecording;
        
        console.log('[Teleprompter] Iniciando recorder.start()...');
        recorder.start();
        console.log('[Teleprompter] Recorder iniciado! State:', recorder.state);
        
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];
        setIsRecording(true);
        setRecordingTime(0);
        console.log('[Teleprompter] isRecording definido como true');

        // Start timer
        timerIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        console.log('[Teleprompter] Timer iniciado');

        // Setup audio level monitoring
        console.log('[Teleprompter] Configurando monitoramento de áudio...');
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        updateAudioLevel();
        console.log('[Teleprompter] Monitoramento de áudio configurado');
      } else {
        console.error('[Teleprompter] canvasStream é null! Não foi possível iniciar gravação.');
      }
      
      console.log('[Teleprompter] Definindo isInitializing = false');
      setIsInitializing(false);
      console.log('[Teleprompter] startRecording concluído com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao acessar câmera/microfone";
      console.error('[Teleprompter] Erro em startRecording:', error);
      onError?.(errorMessage);
      console.error("Error starting recording:", error);
      setIsInitializing(false);
    }
  }, [aspectRatio, drawFrame, finalizeRecording, handleDataAvailable, isRecording, isInitializing, onCameraReady, onError, updateAudioLevel]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, [isRecording]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      canvasStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      cleanupAudioGraph();
    };
  }, [cleanupAudioGraph]);

  return (
    <div className="bg-white rounded-lg shadow p-3 md:p-4 space-y-3 md:space-y-4">
      {/* Hidden elements for processing */}
      <video ref={cameraVideoRef} style={{ display: 'none' }} autoPlay muted playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-semibold">Gravação de Vídeo</h3>
          <p className="text-xs md:text-sm text-slate-500">
            Grave seu vídeo enquanto lê o script no teleprompter.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={startWithCountdown}
            disabled={isRecording || isInitializing || countdown !== null}
            className="flex-1 md:flex-none px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation font-semibold"
          >
            {countdown !== null ? (
              <span className="text-2xl">{countdown}</span>
            ) : (
              <>
                <span className={isRecording ? "hidden" : "inline-block w-3 h-3 rounded-full bg-white"}></span>
                {isInitializing ? "Iniciando..." : isRecording ? "Gravando..." : "🔴 Iniciar Gravação"}
              </>
            )}
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className="flex-1 md:flex-none px-4 py-2 rounded bg-gray-600 text-white disabled:opacity-50 hover:bg-gray-700 transition-colors min-h-[44px] touch-manipulation"
          >
            ⏹ Parar
          </button>
          <button
            onClick={onToggleTeleprompter}
            className={`flex-1 md:flex-none px-4 py-2 rounded min-h-[44px] touch-manipulation transition-colors ${
              teleprompterEnabled 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔤 Teleprompter: {teleprompterEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setRecordTextInVideo(!recordTextInVideo)}
            disabled={!teleprompterEnabled}
            className={`flex-1 md:flex-none px-4 py-2 rounded min-h-[44px] touch-manipulation transition-colors ${
              recordTextInVideo && teleprompterEnabled
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={!teleprompterEnabled ? "Ative o Teleprompter primeiro" : ""}
          >
            📹 Gravar texto: {recordTextInVideo ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: aspectRatio.replace(":", "/") }}>
        <video
          ref={previewVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Script Overlay - DENTRO do container do vídeo - CONDICIONAL */}
        {teleprompterEnabled && script && (
          <div 
            className={`absolute left-0 right-0 flex items-start justify-center pointer-events-none overflow-hidden z-50`}
            style={{ 
              height: `${textArea}%`,
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
                className="p-4 md:p-8 text-center leading-relaxed"
                style={{ 
                  fontSize: `${fontSize}px`,
                  color: textColor === "yellow" ? "#FFC107" : "white",
                  textShadow: textColor === "yellow" 
                    ? "2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)" 
                    : "2px 2px 4px rgba(0,0,0,0.8)",
                  wordWrap: "break-word",
                  overflowWrap: "break-word"
                }}
              >
                {script}
              </div>
            </div>
          </div>
        )}

        {/* Fallback quando teleprompter está OFF */}
        {!teleprompterEnabled && cameraReady && (
          <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-3 py-1 rounded-full text-xs">
            Teleprompter desativado
          </div>
        )}
        
        {/* Aspect Ratio Guides */}
        {cameraReady && !isRecording && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Grid overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/50" />
              ))}
            </div>
            
            {/* Corner guides */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400" />
            
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-0.5 bg-emerald-400 absolute -translate-x-1/2" />
              <div className="h-8 w-0.5 bg-emerald-400 absolute -translate-y-1/2" />
            </div>
          </div>
        )}
        
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-800">
            <div className="text-center">
              <div className="text-4xl mb-2">📹</div>
              <div className="text-sm">Clique em "Iniciar Gravação" para ativar a câmera</div>
            </div>
          </div>
        )}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse z-50">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span className="font-mono font-semibold">{formatTime(recordingTime)}</span>
          </div>
        )}
        
        {/* Aspect Ratio Badge */}
        {cameraReady && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold z-50">
            {aspectRatio} • {aspectRatio === "9:16" ? "1080x1920" : aspectRatio === "1:1" ? "1080x1080" : "1920x1080"}
          </div>
        )}

        {/* Record text indicator */}
        {recordTextInVideo && cameraReady && (
          <div className="absolute bottom-4 left-4 bg-emerald-600/80 text-white px-3 py-1 rounded-full text-xs font-semibold z-50">
            📹 Texto será gravado no vídeo
          </div>
        )}
      </div>

      {/* Audio Level Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs md:text-sm text-slate-500">
          <span>Nível de Áudio</span>
          <span>{isRecording ? "Monitorando..." : "Aguardando"}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded overflow-hidden touch-none">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
        <strong>Dica:</strong> Posicione-se bem enquadrado na câmera antes de iniciar. 
        O vídeo será gravado na proporção {aspectRatio} conforme configurado.
        {teleprompterEnabled && script && (
          <> Use o botão "Teleprompter: OFF" para desativar o texto durante a gravação.</>
        )}
        {recordTextInVideo && (
          <> O texto do teleprompter será gravado permanentemente no vídeo.</>
        )}
      </div>
    </div>
  );
};

export default TeleprompterRecorder;
