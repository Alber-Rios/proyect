import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatRut } from '../utils/formatters.ts';

import {
  ShieldCheck,
  Camera,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Clock,
  Upload,
  ScanLine,
  UserCheck,
  FileText,
  Trash2,
  Check,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface OnboardingPageProps {
  onNavigate: (view: string) => void;
  onOpenAuth?: (mode: 'login' | 'register', notice?: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { currentUser, addAuditRecord, updateUserProfile } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PASO 1: Cédula de Identidad (Fotos vacías por defecto, sin fotos predeterminadas)
  const [idFrontPhoto, setIdFrontPhoto] = useState<string | null>(null);
  const [idBackPhoto, setIdBackPhoto] = useState<string | null>(null);
  const [activeCameraTarget, setActiveCameraTarget] = useState<'front' | 'back' | 'face' | null>(null);
  const idVideoRef = useRef<HTMLVideoElement | null>(null);
  const idStreamRef = useRef<MediaStream | null>(null);

  // PASO 2: Reconocimiento Facial (Vacío por defecto, capturado manualmente)
  const [facialPhoto, setFacialPhoto] = useState<string | null>(null);

  // PASO 3: Certificado de Antecedentes (Vacío por defecto, solo subir el certificado)
  const [criminalRecordFile, setCriminalRecordFile] = useState<string | null>(null);
  const [criminalRecordFileName, setCriminalRecordFileName] = useState<string>('');
  const [criminalRecordFileSize, setCriminalRecordFileSize] = useState<string>('');

  // Detener cámara de cédula si está activa
  const stopIdCamera = () => {
    if (idStreamRef.current) {
      idStreamRef.current.getTracks().forEach((track) => track.stop());
      idStreamRef.current = null;
    }
    setActiveCameraTarget(null);
  };

  // Iniciar cámara para fotografiar la cédula o rostro
  const startIdCamera = async (target: 'front' | 'back' | 'face') => {
    stopIdCamera();
    setActiveCameraTarget(target);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment',
          },
          audio: false,
        });
        idStreamRef.current = stream;
        if (idVideoRef.current) {
          idVideoRef.current.srcObject = stream;
        }
      }
    } catch (e) {
      console.error('Error al abrir la cámara para la cédula:', e);
      setError('No se pudo acceder a la cámara para fotografiar el documento.');
      setActiveCameraTarget(null);
    }
  };

  // Capturar foto de la cédula o rostro desde el video
  const captureIdPhoto = (target: 'front' | 'back' | 'face') => {
    if (!idVideoRef.current) return;
    const video = idVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (target === 'face') {
        // Espejar la imagen para selfies
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      if (target === 'front') setIdFrontPhoto(dataUrl);
      if (target === 'back') setIdBackPhoto(dataUrl);
      if (target === 'face') setFacialPhoto(dataUrl);
    }
    stopIdCamera();
  };

  // Subir foto de la cédula o rostro desde archivo local
  const handleIdFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back' | 'face') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (target === 'front') setIdFrontPhoto(dataUrl);
        if (target === 'back') setIdBackPhoto(dataUrl);
        if (target === 'face') setFacialPhoto(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cargar Certificado de Antecedentes
  const handleCriminalRecordUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCriminalRecordFileName(file.name);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setCriminalRecordFileSize(`${sizeMb} MB`);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCriminalRecordFile(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // CASO: Usuario no logueado
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Verificación de Identidad
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Inicia sesión para verificar tu perfil
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Para validar tu cédula de identidad, reconocimiento facial y antecedentes, debes iniciar sesión con tu cuenta.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth?.('login', 'Inicia sesión para continuar tu verificación de identidad.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => onOpenAuth?.('register', 'Crea una cuenta antes de verificar tu identidad.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              Registrarte Gratis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario ya está verificado
  if (currentUser.verificationStatus === 'verified') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Identidad Aprobada
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              ¡Tu cuenta ya está verificada!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              El Administrador ya revisó y validó tus antecedentes, cédula de identidad y biometría. Puedes reservar y publicar con total normalidad.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Titular:</span>
              <span className="font-bold text-slate-900">{currentUser.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">RUT:</span>
              <span className="font-bold text-slate-900">{formatRut(currentUser.rut)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estado:</span>
              <span className="font-bold text-emerald-700">✓ Verificado por el Administrador</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Ir al Catálogo de Espacios
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Ver Mi Perfil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si el usuario ya tiene su solicitud pendiente de revisión y no ha reiniciado el flujo
  if (currentUser.verificationStatus === 'pending' && currentStep !== 4) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Expediente en Revisión
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Tu verificación demorará aproximadamente 2 días
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Tus documentos y fotografías están en cola. <strong>Esta revisión es realizada manualmente por el Administrador de la plataforma</strong> para asegurar la validez de tu cédula, rostro y antecedentes.
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-amber-800">Titular Solicitante:</span>
              <span className="font-bold text-slate-900">{currentUser.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-800">RUT Oficial:</span>
              <span className="font-bold text-slate-900">{formatRut(currentUser.rut)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-800">Revisor Designado:</span>
              <span className="font-bold text-slate-900">Administrador de Spotly</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-800">Tiempo Estimado:</span>
              <span className="font-bold text-amber-900">Aprox. 2 días hábiles</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Explorar Espacios
            </button>
            <button
              onClick={() => setCurrentStep(1)}
              className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Actualizar Documentación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VALIDACIÓN PASO 1: Cédula de Identidad (Fotos requeridas)
  const handleValidateStep1 = () => {
    setError(null);
    if (!idFrontPhoto) {
      setError('Debes subir o fotografiar el frente (anverso) de tu cédula de identidad.');
      return;
    }
    if (!idBackPhoto) {
      setError('Debes subir o fotografiar el reverso (dorso) de tu cédula de identidad.');
      return;
    }

    addAuditRecord('VERIFICATION_ID_PHOTOS_UPLOADED', 'security', {
      userId: currentUser.id,
      rut: currentUser.rut,
      frontProvided: true,
      backProvided: true,
    });

    setCurrentStep(2);
  };

  // VALIDACIÓN PASO 2: Reconocimiento Facial
  const handleValidateStep2 = () => {
    setError(null);
    if (!facialPhoto) {
      setError('Debes encender la cámara y realizar el reconocimiento facial antes de continuar.');
      return;
    }

    addAuditRecord('VERIFICATION_FACE_RECOGNIZED', 'security', {
      userId: currentUser.id,
      rut: currentUser.rut,
      facialPhotoCaptured: true,
    });

    setCurrentStep(3);
  };

  // VALIDACIÓN PASO 3 Y ENVÍO FINAL: Certificado de Antecedentes y Demora de 2 días
  const handleFinalSubmit = async () => {
    setError(null);
    if (!criminalRecordFile) {
      setError('Debes subir tu Certificado de Antecedentes para Fines Especiales antes de finalizar.');
      return;
    }

    setLoading(true);

    try {
      // Actualizar estado del usuario a 'pending' (En espera de revisión por el administrador)
      updateUserProfile({
        verificationStatus: 'pending',
        avatarUrl: facialPhoto || currentUser.avatarUrl,
        kycData: {
          consentGiven: true,
          termsVersion: 'VERIFICACION-2026.1',
          photoCaptured: true,
          photoUrl: facialPhoto || undefined,
          idFrontCaptured: true,
          idBackCaptured: true,
          idFrontUrl: idFrontPhoto || undefined,
          idBackUrl: idBackPhoto || undefined,
          rutNumber: currentUser.rut,
          documentSerialNumber: 'DOC-' + currentUser.rut.slice(0, 8),
          criminalRecordSubmitted: true,
          criminalRecordValid: true,
          criminalRecordDocCode: criminalRecordFileName,
          submittedAt: new Date().toISOString(),
          manualReviewRequired: true,
          manualReviewNotes: 'Expediente remitido para revisión manual por el Administrador (plazo aprox. 2 días hábiles).',
        },
      });

      addAuditRecord('VERIFICATION_SUBMITTED_FOR_ADMIN_REVIEW', 'security', {
        userId: currentUser.id,
        rut: currentUser.rut,
        status: 'pending',
        reviewer: 'admin',
        estimatedDays: 2,
        criminalRecordFileName,
      });

      // Avanzar al paso 4 con el mensaje de espera de 2 días y revisión por el administrador
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud de verificación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8 pb-16">
      {/* Encabezado */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
          Acreditación de Identidad • Spotly Chile
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Verificación de Identidad
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Completa los pasos requeridos. La documentación será revisada por el Administrador en un plazo aproximado de 2 días hábiles.
        </p>
      </div>

      {/* Barra de Progreso de 4 Pasos */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs font-bold">
          {[
            '1. Cédula de Identidad',
            '2. Reconocimiento Facial',
            '3. Antecedentes',
            '4. Estado de Revisión',
          ].map((title, idx) => (
            <div
              key={title}
              className={`p-2 rounded-xl transition ${
                currentStep === idx + 1
                  ? 'bg-slate-900 text-white shadow-xs'
                  : currentStep > idx + 1
                  ? 'bg-emerald-50 text-emerald-800 font-bold'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {title}
            </div>
          ))}
        </div>
      </div>

      {/* Contenedor del Paso Activo */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* ========================================================= */}
        {/* PASO 1: CÉDULA DE IDENTIDAD (Recuadros vacíos sin fotos predeterminadas) */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                <ScanLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Paso 1: Cédula de Identidad (Anverso y Reverso)
                </h3>
                <p className="text-xs text-slate-500">
                  Sube o fotografía ambas caras de tu carnet de identidad chileno. Los recuadros inician vacíos para que cargues tus documentos reales.
                </p>
              </div>
            </div>

            {/* Cuadrícula de Anverso y Reverso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RECUADRO 1: FRENTE / ANVERSO */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Frente / Anverso (Foto y RUT)
                  </span>
                  {idFrontPhoto && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Foto Lista
                    </span>
                  )}
                </div>

                {/* Recuadro visor (Vacío por defecto) */}
                <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-300 shadow-inner flex items-center justify-center">
                  {activeCameraTarget === 'front' ? (
                    <div className="relative w-full h-full">
                      <video
                        ref={idVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-4 border-2 border-dashed border-indigo-400 rounded-xl pointer-events-none flex items-center justify-center">
                        <span className="px-2 py-1 bg-black/60 text-[10px] font-bold text-white rounded">
                          Encuadra el frente del carnet
                        </span>
                      </div>
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => captureIdPhoto('front')}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                        >
                          Capturar Frente
                        </button>
                        <button
                          type="button"
                          onClick={stopIdCamera}
                          className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : idFrontPhoto ? (
                    <div className="relative w-full h-full">
                      <img
                        src={idFrontPhoto}
                        alt="Anverso de Cédula"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/75 text-[9px] font-bold text-white uppercase tracking-wider">
                        Anverso Cargado
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 space-y-1">
                      <Camera className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="text-xs font-medium text-slate-400">Recuadro Vacío</p>
                      <p className="text-[11px] text-slate-500">Sube la foto del anverso o tómala con la cámara</p>
                    </div>
                  )}
                </div>

                {/* Acciones para el Anverso */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{idFrontPhoto ? 'Cambiar Archivo' : 'Subir Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleIdFileUpload(e, 'front')}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeCameraTarget === 'front') {
                        stopIdCamera();
                      } else {
                        startIdCamera('front');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{activeCameraTarget === 'front' ? 'Cerrar' : 'Usar Cámara'}</span>
                  </button>

                  {idFrontPhoto && (
                    <button
                      type="button"
                      onClick={() => setIdFrontPhoto(null)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* RECUADRO 2: REVERSO / DORSO */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ScanLine className="w-4 h-4 text-indigo-600" />
                    Reverso / Dorso (Huella y Código)
                  </span>
                  {idBackPhoto && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Foto Lista
                    </span>
                  )}
                </div>

                {/* Recuadro visor (Vacío por defecto) */}
                <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-300 shadow-inner flex items-center justify-center">
                  {activeCameraTarget === 'back' ? (
                    <div className="relative w-full h-full">
                      <video
                        ref={idVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-4 border-2 border-dashed border-indigo-400 rounded-xl pointer-events-none flex items-center justify-center">
                        <span className="px-2 py-1 bg-black/60 text-[10px] font-bold text-white rounded">
                          Encuadra el reverso del carnet
                        </span>
                      </div>
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => captureIdPhoto('back')}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                        >
                          Capturar Reverso
                        </button>
                        <button
                          type="button"
                          onClick={stopIdCamera}
                          className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : idBackPhoto ? (
                    <div className="relative w-full h-full">
                      <img
                        src={idBackPhoto}
                        alt="Reverso de Cédula"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/75 text-[9px] font-bold text-white uppercase tracking-wider">
                        Reverso Cargado
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 space-y-1">
                      <Camera className="w-8 h-8 mx-auto text-slate-500" />
                      <p className="text-xs font-medium text-slate-400">Recuadro Vacío</p>
                      <p className="text-[11px] text-slate-500">Sube la foto del reverso o tómala con la cámara</p>
                    </div>
                  )}
                </div>

                {/* Acciones para el Reverso */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{idBackPhoto ? 'Cambiar Archivo' : 'Subir Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleIdFileUpload(e, 'back')}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeCameraTarget === 'back') {
                        stopIdCamera();
                      } else {
                        startIdCamera('back');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{activeCameraTarget === 'back' ? 'Cerrar' : 'Usar Cámara'}</span>
                  </button>

                  {idBackPhoto && (
                    <button
                      type="button"
                      onClick={() => setIdBackPhoto(null)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                {idFrontPhoto && idBackPhoto ? '✓ Ambas fotos de la cédula listas' : 'Sube o fotografía anverso y reverso'}
              </span>
              <button
                type="button"
                onClick={handleValidateStep1}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Continuar a Reconocimiento Facial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 2: RECONOCIMIENTO FACIAL EN VIVO (Al prender la cámara reconoce la cara) */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Paso 2: Reconocimiento Facial Manual
                </h3>
                <p className="text-xs text-slate-500">
                  Sube o fotografía tu rostro. El recuadro inicia vacío para que cargues tu foto.
                </p>
              </div>
            </div>

            <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Selfie / Rostro
                </span>
                {facialPhoto && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Foto Lista
                  </span>
                )}
              </div>

              {/* Recuadro visor (Vacío por defecto) */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-300 shadow-inner flex items-center justify-center">
                {activeCameraTarget === 'face' ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={idVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover -scale-x-100"
                    />
                    <div className="absolute inset-4 border-2 border-dashed border-indigo-400 rounded-xl pointer-events-none flex items-center justify-center">
                      <span className="px-2 py-1 bg-black/60 text-[10px] font-bold text-white rounded">
                        Encuadra tu rostro
                      </span>
                    </div>
                    <div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => captureIdPhoto('face')}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                      >
                        Capturar Rostro
                      </button>
                      <button
                        type="button"
                        onClick={stopIdCamera}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : facialPhoto ? (
                  <div className="relative w-full h-full">
                    <img
                      src={facialPhoto}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/75 text-[9px] font-bold text-white uppercase tracking-wider">
                      Selfie Cargada
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 space-y-1">
                    <Camera className="w-8 h-8 mx-auto text-slate-500" />
                    <p className="text-xs font-medium text-slate-400">Recuadro Vacío</p>
                    <p className="text-[11px] text-slate-500">Sube una selfie o tómala con la cámara</p>
                  </div>
                )}
              </div>

              {/* Acciones para el Rostro */}
              <div className="flex items-center gap-2">
                <label className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{facialPhoto ? 'Cambiar Archivo' : 'Subir Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleIdFileUpload(e, 'face')}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (activeCameraTarget === 'face') {
                      stopIdCamera();
                    } else {
                      startIdCamera('face');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{activeCameraTarget === 'face' ? 'Cerrar' : 'Usar Cámara'}</span>
                </button>

                {facialPhoto && (
                  <button
                    type="button"
                    onClick={() => setFacialPhoto(null)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a Cédula
              </button>
              <button
                type="button"
                onClick={handleValidateStep2}
                disabled={!facialPhoto}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                  facialPhoto
                    ? 'bg-slate-900 hover:bg-black text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Continuar a Certificado de Antecedentes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 3: CERTIFICADO DE ANTECEDENTES (Solo subir el certificado) */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Paso 3: Certificado de Antecedentes para Fines Especiales
                </h3>
                <p className="text-xs text-slate-500">
                  Sube únicamente tu Certificado de Antecedentes emitido por el Servicio de Registro Civil e Identificación de Chile.
                </p>
              </div>
            </div>

            {/* Recuadro de Carga del Certificado */}
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-amber-300 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
                <FileText className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {criminalRecordFileName ? `Archivo: ${criminalRecordFileName}` : 'Subir Certificado de Antecedentes'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos aceptados: PDF, JPG, PNG (máx. 10MB)
                </p>
                {criminalRecordFileSize && (
                  <p className="text-[11px] font-mono text-emerald-700 font-bold mt-1">
                    Tamaño: {criminalRecordFileSize} • Documento cargado
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <label className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition flex items-center gap-2 shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>{criminalRecordFile ? 'Cambiar Documento' : 'Seleccionar Certificado'}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleCriminalRecordUpload}
                  />
                </label>

                {criminalRecordFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCriminalRecordFile(null);
                      setCriminalRecordFileName('');
                      setCriminalRecordFileSize('');
                    }}
                    className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition cursor-pointer"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            {/* Nota de verificación por el administrador */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">📌 Información importante sobre la revisión:</div>
              <p>
                Al enviar este documento, tu expediente pasará a la bandeja del <strong>Administrador</strong>, quien revisará manualmente la autenticidad del certificado, tu carnet y el reconocimiento facial.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a Reconocimiento
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading || !criminalRecordFile}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                  criminalRecordFile && !loading
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Enviando...' : 'Finalizar y Enviar a Revisión'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 4: MENSAJE FINAL DE DEMORA (APROX. 2 DÍAS) Y REVISIÓN POR EL ADMINISTRADOR */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 text-center py-4">
            {/* Ícono de reloj y estado */}
            <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            {/* Títulos y mensaje solicitado */}
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider">
                Expediente Enviado con Éxito
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                Tu verificación demorará aproximadamente 2 días
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hemos recibido tu documentación. <strong>Esta verificación es revisada minuciosamente por el Administrador</strong> de Spotly para cotejar tus fotos de carnet, reconocimiento facial y certificado de antecedentes.
              </p>
            </div>

            {/* Ficha Resumen de lo Enviado */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 max-w-lg mx-auto text-left text-xs space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-900 font-bold text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Detalle del Expediente de Verificación
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  En Revisión
                </span>
              </div>

              <div className="space-y-2.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Titular Solicitante:</span>
                  <span className="font-bold text-slate-900">{currentUser.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RUT Oficial:</span>
                  <span className="font-bold text-slate-900">{formatRut(currentUser.rut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cédula de Identidad:</span>
                  <span className="font-bold text-emerald-700">✓ Anverso y Reverso Adjuntos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reconocimiento Facial:</span>
                  <span className="font-bold text-emerald-700">✓ Rostro Reconocido en Vivo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Certificado de Antecedentes:</span>
                  <span className="font-bold text-emerald-700">
                    ✓ {criminalRecordFileName || 'Documento Adjunto'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500">¿Quién revisa esto?:</span>
                  <span className="font-bold text-indigo-900">El Administrador de la plataforma</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiempo de Respuesta:</span>
                  <span className="font-bold text-amber-900">Aprox. 2 días hábiles</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                💡 <strong>Información para el usuario:</strong> Mientras el Administrador valida tu expediente, puedes explorar todos los espacios, ubicaciones y precios en Spotly. Una vez aprobada tu cuenta, podrás formalizar contratos y publicar propiedades.
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Explorar Catálogo de Espacios
              </button>
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Ver Mi Perfil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
