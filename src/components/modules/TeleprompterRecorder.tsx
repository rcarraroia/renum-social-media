import React, { useCallback, useEffect, useRef, useState } from "react";

type TeleprompterRecorderProps = {
  onRecordingComplete?: (blob: Blob) => void;
};

const TeleprompterRecorder: React.FC<TeleprompterRecorderProps> = ({
  onRecordingComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const frameRef = useRef<number | null>(null);

  const cleanupAudioGraph = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
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

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];
    onRecordingComplete?.(blob);

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, [cleanupAudioGraph, onRecordingComplete]);

  const updateAudioLevel = useCallback(() => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

    analyser.getByteTimeDomainData(dataArray);
    const normalized =
      dataArray.reduce((acc, value) => acc + Math.abs(value - 128), 0) /
      dataArray.length;
    setAudioLevel(Math.min(normalized / 128, 1));

    frameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = handleDataAvailable;
    recorder.onstop = finalizeRecording;
    recorder.start();
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    setIsRecording(true);

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    updateAudioLevel();
  }, [finalizeRecording, handleDataAvailable, isRecording, updateAudioLevel]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      cleanupAudioGraph();
    };
  }, [cleanupAudioGraph]);

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Teleprompter Recorder</h3>
          <p className="text-sm text-slate-500">
            Grave seu áudio enquanto lê o script.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
          >
            Iniciar
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className="px-3 py-2 rounded bg-gray-100 disabled:opacity-50"
          >
            Parar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-slate-500">
          <span>Status</span>
          <span>{isRecording ? "Gravando..." : "Pronto"}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TeleprompterRecorder;