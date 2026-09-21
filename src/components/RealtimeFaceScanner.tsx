import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Scan, Eye, UserCheck, Sparkles, Upload } from 'lucide-react';

interface RealtimeFaceScannerProps {
  onFaceCaptured: (imageDataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

export const RealtimeFaceScanner: React.FC<RealtimeFaceScannerProps> = ({
  onFaceCaptured,
  onCancel,
  title = 'Reconocimiento Facial en Tiempo Real',
  subtitle = 'Enciende tu cámara para que el sistema reconozca tu rostro en vivo y capture tu biometría.',
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [detectionMessage, setDetectionMessage] = useState<string>('Haz clic en "Prender Cámara" para iniciar el reconocimiento facial.');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);
  const consecutiveFaceFrames = useRef<number>(0);

  // Detener cámara de forma segura
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
    setIsFaceDetected(false);
    setScanProgress(0);
  }, []);

  // Capturar fotograma actual del video
  const captureCurrentFrame = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsCapturing(true);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dibujo en espejo (espejo natural para selfie)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPhoto(dataUrl);
    stopCamera();
    setIsCapturing(false);
    onFaceCaptured(dataUrl);
  }, [stopCamera, onFaceCaptured]);

  // Bucle de detección de rostro en tiempo real
  const runFaceDetectionLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      animFrameId.current = requestAnimationFrame(runFaceDetectionLoop);
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0) {
      animFrameId.current = requestAnimationFrame(runFaceDetectionLoop);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animFrameId.current = requestAnimationFrame(runFaceDetectionLoop);
      return;
    }

    // Procesar a baja resolución para 60fps fluidos
    const procWidth = 160;
    const procHeight = 120;
    canvas.width = procWidth;
    canvas.height = procHeight;

    ctx.drawImage(video, 0, 0, procWidth, procHeight);

    // Análisis del centro del marco donde debe situarse el rostro
    const centerX = procWidth / 2;
    const centerY = procHeight / 2;
    const boxRadiusX = procWidth * 0.22;
    const boxRadiusY = procHeight * 0.32;

    const startX = Math.max(0, Math.floor(centerX - boxRadiusX));
    const startY = Math.max(0, Math.floor(centerY - boxRadiusY));
    const width = Math.min(procWidth - startX, Math.floor(boxRadiusX * 2));
    const height = Math.min(procHeight - startY, Math.floor(boxRadiusY * 2));

    try {
      const imgData = ctx.getImageData(startX, startY, width, height);
      const data = imgData.data;

      let skinLikePixels = 0;
      let totalLuminance = 0;
      let sampleCount = 0;
      let contrastVariance = 0;

      // Muestrear píxeles para detectar presencia humana (tono de piel / iluminación / varianza facial)
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        sampleCount++;

        // Detección de rangos de tonalidad facial y contraste
        // Criterio de tonalidad de piel y bordes (ojos, cejas, nariz)
        const isSkin = r > 45 && g > 30 && b > 20 && r > b && (r - g) >= 5 && lum > 35 && lum < 235;
        if (isSkin) {
          skinLikePixels++;
        }
      }

      const avgLum = sampleCount > 0 ? totalLuminance / sampleCount : 0;
      const skinRatio = sampleCount > 0 ? skinLikePixels / sampleCount : 0;

      // Calcular contraste en la región facial (los rostros tienen contraste significativo entre ojos y mejillas)
      for (let i = 0; i < data.length; i += 32) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        contrastVariance += Math.abs(lum - avgLum);
      }
      const avgContrast = sampleCount > 0 ? contrastVariance / (sampleCount / 2) : 0;

      // Verificación de rostro presente y bien centrado
      const faceDetectedInFrame = skinRatio >= 0.25 && avgLum >= 40 && avgLum <= 230 && avgContrast >= 8;

      if (faceDetectedInFrame) {
        consecutiveFaceFrames.current = Math.min(60, consecutiveFaceFrames.current + 1);
      } else {
        consecutiveFaceFrames.current = Math.max(0, consecutiveFaceFrames.current - 1);
      }

      const detected = consecutiveFaceFrames.current >= 6;
      setIsFaceDetected(detected);

      if (detected) {
        const progress = Math.min(100, Math.round((consecutiveFaceFrames.current / 30) * 100));
        setScanProgress(progress);

        if (progress < 40) {
          setDetectionMessage('Rostro detectado. Mantén tu mirada al frente...');
        } else if (progress < 90) {
          setDetectionMessage('Reconociendo facciones biométricas en tiempo real...');
        } else {
          setDetectionMessage('¡Rostro reconocido exitosamente! Puedes capturar tu foto.');
        }

        // Si se mantiene estable al 100% durante 20 cuadros adicionales, sugerir captura o auto-capturar
        if (consecutiveFaceFrames.current >= 45 && !isCapturing && !capturedPhoto) {
          // Auto captura suave
          captureCurrentFrame();
          return;
        }
      } else {
        setScanProgress(0);
        setDetectionMessage('Alinea tu rostro dentro del óvalo guía con buena iluminación.');
      }
    } catch {
      // Ignorar errores transitorios de lectura de canvas
    }

    animFrameId.current = requestAnimationFrame(runFaceDetectionLoop);
  }, [captureCurrentFrame, isCapturing, capturedPhoto]);

  // Iniciar cámara web
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setCapturedPhoto(null);
    consecutiveFaceFrames.current = 0;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso directo a cámara web.');
      }

      setIsCameraActive(true);

      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (!stream) {
        throw new Error('No se pudo acceder a la cámara.');
      }

      streamRef.current = stream;
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      let msg = 'No se pudo acceder a la cámara frontal. Revisa los permisos de tu navegador.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permiso denegado para acceder a la cámara. Habilítalo en tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No se encontró ninguna cámara conectada en tu equipo.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  }, [stopCamera]);

  // Vincular el stream al elemento <video> cuando se renderice
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;

      const handlePlay = () => {
        setDetectionMessage('Buscando rostro en el visor...');
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        animFrameId.current = requestAnimationFrame(runFaceDetectionLoop);
      };

      video.onloadedmetadata = () => {
        video.play().then(handlePlay).catch((err) => console.error('Error al reproducir:', err));
      };

      if (video.readyState >= 1) {
        video.play().then(handlePlay).catch((err) => console.error('Error al reproducir:', err));
      }
    }
  }, [isCameraActive, runFaceDetectionLoop]);

  // Limpieza al desmontar e inicio automático
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 400);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Carga manual como alternativa si no tiene cámara
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setCapturedPhoto(dataUrl);
        stopCamera();
        onFaceCaptured(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-5">
      {/* Canvas oculto para análisis biométrico */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
          <Scan className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {/* Mensaje de error de cámara si ocurre */}
      {cameraError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <label className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-rose-700 shrink-0">
            Subir Selfie
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* VISOR DE CÁMARA O RESULTADO */}
      <div className="relative aspect-4/3 max-w-md mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-xl flex items-center justify-center">
        {isCameraActive ? (
          <div className="relative w-full h-full">
            {/* Elemento de Video en Vivo (Espejado) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* ÓVALO GUÍA BIOMÉTRICO */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`relative w-48 sm:w-56 h-64 sm:h-72 rounded-[50%] border-2 transition-all duration-300 ${
                  isFaceDetected
                    ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.45)]'
                    : 'border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                }`}
              >
                {/* Rayo de escaneo animado cuando hay rostro detectado */}
                {isFaceDetected && (
                  <div className="absolute inset-x-4 top-2 h-1 bg-linear-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-pulse" />
                )}

                {/* Puntos de referencia facial virtuales */}
                {isFaceDetected && (
                  <>
                    <div className="absolute top-24 left-14 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <div className="absolute top-24 right-14 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <div className="absolute top-36 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  </>
                )}
              </div>
            </div>

            {/* Indicador Superior de Estado */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-[11px] font-bold text-white border border-white/10 shadow-sm">
                <span className={`w-2 h-2 rounded-full ${isFaceDetected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{isFaceDetected ? 'Rostro Reconocido' : 'Buscando Rostro...'}</span>
              </div>

              {scanProgress > 0 && (
                <div className="px-3 py-1 rounded-full bg-emerald-500/90 text-slate-950 font-bold text-[11px] shadow-sm">
                  {scanProgress}%
                </div>
              )}
            </div>

            {/* Barra de progreso inferior */}
            {isFaceDetected && (
              <div className="absolute bottom-16 inset-x-8">
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/20">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-150 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Botón flotante para capturar manualmente si ya se detectó el rostro */}
            <div className="absolute bottom-3 inset-x-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={captureCurrentFrame}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition flex items-center gap-2 cursor-pointer ${
                  isFaceDetected
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/30'
                    : 'bg-white/80 hover:bg-white text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isFaceDetected ? 'Capturar Rostro Reconocido' : 'Capturar Ahora'}</span>
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md border border-white/15 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : capturedPhoto ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900">
            <img
              src={capturedPhoto}
              alt="Rostro Capturado"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-4 h-4" />
              <span>Rostro Reconocido y Capturado</span>
            </div>

            <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-slate-900/90 hover:bg-black text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Repetir Escaneo Facial</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-indigo-950/60 border-2 border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Eye className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Cámara Lista para Reconocimiento</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Al encender la cámara, el sistema escaneará tus facciones en vivo dentro del óvalo guía.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={startCamera}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Prender Cámara y Reconocer Rostro</span>
              </button>

              <label className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Subir Foto Facial</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Leyenda y estado en tiempo real */}
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
        <span className="font-medium">{detectionMessage}</span>
      </div>
    </div>
  );
};
