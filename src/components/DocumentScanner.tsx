import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Scan, Sparkles, Upload, FileCheck2, Info, Loader2 } from 'lucide-react';

interface DocumentScannerProps {
  onDocumentCaptured: (imageDataUrl: string, documentType: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  side: 'front' | 'back';
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  onDocumentCaptured,
  onCancel,
  title = 'Escaneo Inteligente de Documento',
  subtitle = 'Alinea tu cédula de identidad dentro del marco para identificarla automáticamente.',
  side,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDocDetected, setIsDocDetected] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [capturedDoc, setCapturedDoc] = useState<string | null>(null);
  const [detectionMessage, setDetectionMessage] = useState<string>('Iniciando visor de cámara...');
  const [docType, setDocType] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);
  const consecutiveDocFrames = useRef<number>(0);
  const bestFrame = useRef<{ dataUrl: string; score: number } | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
    setIsDocDetected(false);
    setScanProgress(0);
  }, []);

  const captureCurrentFrame = useCallback((manualDataUrl?: string) => {
    if (!videoRef.current && !manualDataUrl) return;
    
    setIsCapturing(true);
    let finalDataUrl = manualDataUrl;

    if (!finalDataUrl && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finalDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      }
    }

    if (finalDataUrl) {
      setCapturedDoc(finalDataUrl);
      stopCamera();
      setIsCapturing(false);
      onDocumentCaptured(finalDataUrl, docType || 'Cédula de Identidad (Chile)');
    }
  }, [stopCamera, onDocumentCaptured, docType]);

  const runDocDetectionLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      animFrameId.current = requestAnimationFrame(runDocDetectionLoop);
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0) {
      animFrameId.current = requestAnimationFrame(runDocDetectionLoop);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animFrameId.current = requestAnimationFrame(runDocDetectionLoop);
      return;
    }

    const procWidth = 160;
    const procHeight = 120;
    canvas.width = procWidth;
    canvas.height = procHeight;
    ctx.drawImage(video, 0, 0, procWidth, procHeight);

    const centerX = procWidth / 2;
    const centerY = procHeight / 2;
    const boxW = procWidth * 0.7;
    const boxH = procHeight * 0.5;

    const startX = Math.floor(centerX - boxW / 2);
    const startY = Math.floor(centerY - boxH / 2);

    try {
      const imgData = ctx.getImageData(startX, startY, boxW, boxH);
      const data = imgData.data;

      let totalBrightness = 0;
      let edgesDetected = 0;

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = (r + g + b) / 3;
        totalBrightness += lum;

        if (i > 4) {
          const prevLum = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
          if (Math.abs(lum - prevLum) > 25) edgesDetected++;
        }
      }

      const avgBrightness = totalBrightness / (data.length / 4);
      const isGoodLighting = avgBrightness > 40 && avgBrightness < 220;
      const docInFrame = edgesDetected > 40 && isGoodLighting;

      if (docInFrame) {
        consecutiveDocFrames.current = Math.min(30, consecutiveDocFrames.current + 1);
        
        if (!bestFrame.current || edgesDetected > bestFrame.current.score) {
          const mainCanvas = document.createElement('canvas');
          mainCanvas.width = video.videoWidth || 1280;
          mainCanvas.height = video.videoHeight || 720;
          const mainCtx = mainCanvas.getContext('2d');
          if (mainCtx) {
            mainCtx.drawImage(video, 0, 0);
            bestFrame.current = {
              dataUrl: mainCanvas.toDataURL('image/jpeg', 0.95),
              score: edgesDetected
            };
          }
        }
      } else {
        consecutiveDocFrames.current = Math.max(0, consecutiveDocFrames.current - 1);
      }

      const detected = consecutiveDocFrames.current >= 5;
      setIsDocDetected(detected);

      if (detected) {
        const progress = Math.min(100, Math.round((consecutiveDocFrames.current / 20) * 100));
        setScanProgress(progress);
        
        if (progress < 40) {
          setDetectionMessage('Documento detectado. Verificando legibilidad...');
        } else if (progress < 80) {
          setDocType('Cédula de Identidad (CHL)');
          setDetectionMessage(`Cédula de Identidad detectada (${side === 'front' ? 'Anverso' : 'Reverso'}). Mantén la posición...`);
        } else {
          setDetectionMessage('¡Calidad óptima lograda! Capturando automáticamente...');
          if (progress >= 100 && !isCapturing && bestFrame.current) {
            captureCurrentFrame(bestFrame.current.dataUrl);
            return;
          }
        }
      } else {
        setScanProgress(0);
        bestFrame.current = null;
        if (!isGoodLighting && avgBrightness < 40) {
          setDetectionMessage('⚠️ Iluminación baja. Busca más luz.');
        } else if (!isGoodLighting && avgBrightness > 220) {
          setDetectionMessage('⚠️ Demasiado brillo. Inclina suavemente el documento.');
        } else {
          setDetectionMessage('Alinea tu cédula de identidad dentro del cuadro.');
        }
      }
    } catch (e) {
      // ignore
    }

    animFrameId.current = requestAnimationFrame(runDocDetectionLoop);
  }, [captureCurrentFrame, isCapturing, side]);

  const startCamera = useCallback(async () => {
    stopCamera();
    
    setCameraError(null);
    setCapturedDoc(null);
    consecutiveDocFrames.current = 0;
    bestFrame.current = null;
    setIsStartingCamera(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no permite acceso a la cámara.');
      }

      setIsCameraActive(true);

      let stream: MediaStream | null = null;

      // Intento 1: Cámara trasera ideal
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            facingMode: { ideal: 'environment' } 
          },
          audio: false,
        });
      } catch {
        // Intento 2: Cámara frontal o básica
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch {
          // Intento 3: Cualquier dispositivo de video disponible
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) {
        throw new Error('No se pudo obtener el video de la cámara.');
      }

      streamRef.current = stream;
    } catch (err: any) {
      console.error('Camera error:', err);
      let msg = 'No se pudo activar la cámara. Verifica los permisos de tu navegador.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permiso denegado. Permite el uso de cámara en tu navegador.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  }, [stopCamera]);

  // Vinsular el stream al elemento <video> cuando esté montado
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      
      const handlePlay = () => {
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        animFrameId.current = requestAnimationFrame(runDocDetectionLoop);
      };

      video.onloadedmetadata = () => {
        video.play().then(handlePlay).catch((err) => console.error('Play error:', err));
      };

      if (video.readyState >= 1) {
        video.play().then(handlePlay).catch((err) => console.error('Play error:', err));
      }
    }
  }, [isCameraActive, runDocDetectionLoop]);

  // Iniciar automáticamente al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 200);
    
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setCapturedDoc(dataUrl);
        stopCamera();
        onDocumentCaptured(dataUrl, 'Cédula de Identidad (Chile)');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            Volver
          </button>
        )}
      </div>

      {cameraError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <label className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-rose-700 shrink-0 flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" />
            Subir Foto
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      <div className="relative aspect-16/10 max-w-lg mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-xl flex items-center justify-center">
        {isCameraActive ? (
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-[85%] h-[70%] border-2 rounded-2xl transition-all duration-300 ${
                isDocDetected ? 'border-emerald-400 shadow-[0_0_20px_#34d399]' : 'border-white/30'
              }`}>
                {isDocDetected && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2s_infinite]" />
                )}
              </div>
            </div>

            <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/10 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isDocDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isDocDetected ? 'Documento Detectado' : 'Alinea el documento en el marco'}
              </div>
              {scanProgress > 0 && (
                <div className="px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full shadow-sm">
                  {scanProgress}%
                </div>
              )}
            </div>

            {/* BARRA DE PROGRESO DE CAPTURA AUTOMÁTICA */}
            <div className="absolute bottom-4 inset-x-6 flex flex-col items-center gap-2 pointer-events-none">
              {scanProgress > 0 && (
                <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-full h-2.5 overflow-hidden border border-white/20 p-0.5">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}
              <div className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium rounded-full border border-white/10">
                Captura 100% Automática al Centrar Cédula
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 space-y-4">
            <Scan className="w-12 h-12 text-amber-500 animate-pulse" />
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Escaneo Automático: {side === 'front' ? 'Anverso (Frente)' : 'Reverso (Atrás)'}</p>
              <p className="text-xs text-slate-400 max-w-xs">Alinea tu cédula frente a la cámara. El sistema la reconocerá y capturará la mejor toma automáticamente.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={startCamera}
                disabled={isStartingCamera}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-2xl transition shadow-lg shadow-amber-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isStartingCamera ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando Cámara...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Abrir Cámara Automática
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
        {isDocDetected ? <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" /> : <Info className="w-4 h-4 text-slate-400 shrink-0" />}
        <span className="text-xs font-medium text-slate-700">{detectionMessage}</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}} />
    </div>
  );
};

