import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Scan, Sparkles, Upload, FileCheck2, Info, Loader2, Play } from 'lucide-react';
import { getSimulatedCedulaImage } from '../utils/mockAssets.ts';

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
  subtitle = 'Alinea tu cédula de identidad dentro del marco o ejecuta la simulación interactiva.',
  side,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDocDetected, setIsDocDetected] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [capturedDoc, setCapturedDoc] = useState<string | null>(null);
  const [detectionMessage, setDetectionMessage] = useState<string>('Iniciando visor de cámara o simulación...');
  const [docType, setDocType] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);
  const consecutiveDocFrames = useRef<number>(0);
  const bestFrame = useRef<{ dataUrl: string; score: number } | null>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

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
    setMediaStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
    setIsDocDetected(false);
    setScanProgress(0);
  }, []);

  const createSyntheticCameraStream = useCallback((sideType: 'front' | 'back'): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    
    const cardImg = new Image();
    cardImg.crossOrigin = 'anonymous';
    cardImg.src = getSimulatedCedulaImage(sideType);

    const stream = canvas.captureStream(30);
    const track = stream.getVideoTracks()[0];

    let frameCount = 0;
    let animId: number;

    const draw = () => {
      if (track && track.readyState === 'ended') {
        return;
      }
      frameCount++;
      if (!ctx) return;

      // Fondo neutro simulado de ambiente real
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1280, 720);

      // Superficie de mesa
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 500, 1280, 220);

      // Posicionamiento de la cédula que se mueve hacia el centro
      const targetW = 680;
      const targetH = 430;
      const targetX = (1280 - targetW) / 2;
      const targetY = (720 - targetH) / 2;

      // Progreso suave de centrado
      const progress = Math.min(1, frameCount / 25);
      const currX = targetX + (1 - progress) * 150;
      const currY = targetY + (1 - progress) * 100;

      if (cardImg.complete && cardImg.naturalWidth > 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.drawImage(cardImg, currX, currY, targetW, targetH);
        ctx.restore();
      } else {
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(currX, currY, targetW, targetH, 24);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('REPUBLICA DE CHILE - CEDULA DE IDENTIDAD', currX + 40, currY + 80);
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return stream;
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
          if (Math.abs(lum - prevLum) > 20) edgesDetected++;
        }
      }

      const avgBrightness = totalBrightness / (data.length / 4);
      const isGoodLighting = avgBrightness > 25 && avgBrightness < 240;
      const docInFrame = edgesDetected >= 10 && isGoodLighting;

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
        consecutiveDocFrames.current = 0;
      }

      const detected = consecutiveDocFrames.current >= 3;
      setIsDocDetected(detected);

      if (detected) {
        const progress = Math.min(100, Math.round((consecutiveDocFrames.current / 30) * 100));
        setScanProgress(progress);
        
        if (progress < 40) {
          setDetectionMessage('📸 Cédula posicionada. Enfocando...');
        } else if (progress < 85) {
          setDocType('Cédula de Identidad (CHL)');
          setDetectionMessage(`✨ Cédula bien encuadrada. Mantenla estable...`);
        } else {
          setDetectionMessage('✅ Capturando fotografía...');
          if (progress >= 100 && !isCapturing) {
            captureCurrentFrame(bestFrame.current?.dataUrl);
            return;
          }
        }
      } else {
        setScanProgress(0);
        bestFrame.current = null;
        if (!isGoodLighting && avgBrightness <= 25) {
          setDetectionMessage('⚠️ Iluminación muy baja. Acerca tu cédula a la luz.');
        } else if (!isGoodLighting && avgBrightness >= 240) {
          setDetectionMessage('⚠️ Mucho reflejo. Inclina suavemente la cédula.');
        } else {
          setDetectionMessage('Coloca tu Cédula bien posicionada dentro del marco blanco.');
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

    let stream: MediaStream | null = null;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
      }
    } catch (e) {
      console.warn('Real camera not available or permission denied:', e);
    }

    // Si no hay cámara física disponible o no hay permiso en el iframe, usar flujo sintético
    if (!stream) {
      stream = createSyntheticCameraStream(side);
    }

    streamRef.current = stream;
    setMediaStream(stream);
    setIsCameraActive(true);
    setIsStartingCamera(false);
  }, [stopCamera, createSyntheticCameraStream, side]);

  // Vincular el stream al elemento <video> cuando esté montado
  useEffect(() => {
    if (isCameraActive && mediaStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = mediaStream;
      
      const handlePlay = () => {
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        animFrameId.current = requestAnimationFrame(runDocDetectionLoop);
      };

      video.onloadedmetadata = () => {
        video.play().then(handlePlay).catch((err) => console.error('Play error:', err));
      };

      video.oncanplay = () => {
        video.play().then(handlePlay).catch((err) => console.error('Play error:', err));
      };

      if (video.readyState >= 1) {
        video.play().then(handlePlay).catch((err) => console.error('Play error:', err));
      }
    }
  }, [isCameraActive, mediaStream, runDocDetectionLoop]);

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
        {isSimulating ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-center space-y-4">
            <div className="relative w-32 h-20 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-[0_0_20px_#34d399]">
              <img src={getSimulatedCedulaImage(side)} alt="Cédula Simulada" className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_1.5s_infinite]" />
            </div>

            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-xs font-bold text-emerald-400">
                <span>Escaneo en Proceso (Simulación)</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            <p className="text-xs font-medium text-slate-300 animate-pulse">{detectionMessage}</p>
          </div>
        ) : isCameraActive ? (
          <div className="relative w-full h-full">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
              <div className={`relative w-[88%] h-[74%] border-4 rounded-3xl transition-all duration-300 flex flex-col justify-end items-center pb-3 ${
                isDocDetected 
                  ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.55)] bg-emerald-500/5' 
                  : 'border-white shadow-2xl'
              }`}>
                {isDocDetected && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[scan_1.5s_infinite]" />
                )}

                {/* Badge "Photo taken" idéntica a la imagen de referencia del usuario */}
                {(scanProgress >= 100 || capturedDoc) && (
                  <div className="px-4 py-1.5 bg-emerald-300 text-emerald-950 font-black text-xs rounded-full shadow-2xl flex items-center gap-1.5 border border-white/80 animate-bounce">
                    <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                    <span>Photo taken</span>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
              <div className={`px-3 py-1.5 backdrop-blur-md rounded-full text-xs font-bold text-white border flex items-center gap-2 shadow-lg transition-all duration-300 ${
                isDocDetected 
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500/50' 
                  : 'bg-slate-900/90 border-white/20 text-slate-200'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isDocDetected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                {isDocDetected ? '✅ Cédula Centralizada y Enfocada' : '⚠️ Centra tu Cédula en el Marco Blanco'}
              </div>
              {scanProgress > 0 && (
                <div className="px-3 py-1 bg-emerald-400 text-slate-950 text-xs font-black rounded-full shadow-md">
                  {scanProgress}%
                </div>
              )}
            </div>

            {/* BOTÓN DE CAPTURA Y BARRA DE PROGRESO AL ESTAR CENTRALIZADA */}
            <div className="absolute bottom-3 inset-x-4 flex flex-col items-center gap-2 z-10">
              {scanProgress > 0 && (
                <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-full h-2.5 overflow-hidden border border-white/20 p-0.5 shadow-lg">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}

              {/* Botón táctil para capturar cuando el usuario haya centralizado la cédula a su gusto */}
              <button
                type="button"
                onClick={() => captureCurrentFrame(bestFrame.current?.dataUrl)}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-2xl transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isDocDetected
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/50 scale-105 animate-pulse'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-white border border-white/30 backdrop-blur-md'
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-950" />
                <span>{isDocDetected ? '📸 Cédula Centralizada: Capturar Foto Ahora' : '📸 Capturar Fotografía'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 space-y-4">
            <Scan className="w-12 h-12 text-amber-500 animate-pulse" />
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Escaneo Automático: {side === 'front' ? 'Anverso (Frente)' : 'Reverso (Atrás)'}</p>
              <p className="text-xs text-slate-400 max-w-xs">Enciende tu cámara y ubica tu cédula dentro del marco para la captura automática.</p>
            </div>

            <div className="pt-2 flex items-center justify-center">
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
                    <Camera className="w-4 h-4" />
                    Iniciar Cámara para Escaneo
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

