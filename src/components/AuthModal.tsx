import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { validateRut, formatRut } from '../utils/formatters.ts';
import {
  X,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  Phone,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  contextNotice?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  contextNotice,
  onClose,
  onSuccess,
}) => {
  const { login, register, switchUser, allUsers } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formulario Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Formulario Registro
  const [regFullName, setRegFullName] = useState('');
  const [regRut, setRegRut] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+56 9 ');
  const [regGender, setRegGender] = useState<'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir'>('prefiero_no_decir');
  const [regBirthDate, setRegBirthDate] = useState('2000-01-01');
  const [regRole, setRegRole] = useState<'tenant' | 'owner'>('tenant');
  const [regTermsAccepted, setRegTermsAccepted] = useState(false);

  // Sincronizar modo inicial si cambia
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginIdentifier.trim()) {
      setError('Por favor ingresa tu Correo Electrónico o RUT.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      if (res.success) {
        setSuccessMsg(res.message || '¡Sesión iniciada correctamente!');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 800);
      } else {
        setError(res.message || 'Credenciales inválidas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regFullName.trim() || regFullName.length < 3) {
      setError('Ingresa tu nombre y apellido completo.');
      return;
    }

    if (!validateRut(regRut)) {
      setError('El RUT ingresado no es válido según el algoritmo oficial Módulo 11 de Chile.');
      return;
    }

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!regBirthDate) {
      setError('Por favor ingresa tu fecha de nacimiento.');
      return;
    }

    if (!regTermsAccepted) {
      setError('Debes aceptar los Términos de Servicio y la Política de Privacidad (Ley 19.628).');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        fullName: regFullName.trim(),
        rut: regRut.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        gender: regGender,
        birthDate: regBirthDate,
        role: regRole,
        agreedTerms: regTermsAccepted,
      });

      if (res.success) {
        setSuccessMsg('¡Cuenta creada exitosamente! Bienvenido a Spotly Chile.');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        setError(res.message || 'No se pudo crear la cuenta');
      }
    } catch (err: any) {
      setError(err.message || 'Error en registro');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userId: string) => {
    switchUser(userId);
    setSuccessMsg('¡Sesión iniciada exitosamente!');
    setTimeout(() => {
      onClose();
      if (onSuccess) onSuccess();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Barra superior con botón cerrar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
              <Building className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-base">
              Spotly
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de contexto opcional */}
        {contextNotice && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <Sparkles className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{contextNotice}</span>
          </div>
        )}

        {/* Selector de Pestañas: Iniciar Sesión / Registrarte */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Registrarte
            </button>
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mensaje de Éxito */}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: INICIAR SESIÓN */}
        {mode === 'login' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico o RUT
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="ej. matias.silva@gmail.com o 18.421.905-3"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Verificando...' : 'Iniciar Sesión'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Accesos rápidos Demo de 1 Clic */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                O ingresa con 1 clic (Cuentas Demo):
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('usr-tenant-1')}
                  className="p-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-center transition"
                >
                  <div className="text-[11px] font-bold text-slate-900">Matías</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Arrendatario</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('usr-owner-1')}
                  className="p-2 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-center transition"
                >
                  <div className="text-[11px] font-bold text-slate-900">Carlos</div>
                  <div className="text-[10px] text-amber-700 font-semibold">Propietario</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('usr-admin-1')}
                  className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-center transition"
                >
                  <div className="text-[11px] font-bold text-slate-900">Ignacio</div>
                  <div className="text-[10px] text-indigo-700 font-semibold">Admin</div>
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">¿No tienes cuenta aún? </span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Regístrate gratis
              </button>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: REGISTRARTE */}
        {mode === 'register' && (
          <div className="p-6 space-y-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="ej. Francisca Morales Silva"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RUT Chileno
                  </label>
                  <input
                    type="text"
                    value={regRut}
                    onChange={(e) => setRegRut(e.target.value)}
                    placeholder="ej. 19.876.543-2"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ej. francisca@empresa.cl"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Género y Fecha de Nacimiento (Mayor de 18 años) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Género
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero_no_decir">Prefiero no decir</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Fecha de Nacimiento
                    </label>
                  </div>
                  <input
                    type="date"
                    value={regBirthDate}
                    onChange={(e) => setRegBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Selección de Tipo de Perfil */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ¿Cómo planeas usar Spotly principalmente?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col items-start gap-1 ${
                      regRole === 'tenant'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="regRole"
                      value="tenant"
                      checked={regRole === 'tenant'}
                      onChange={() => setRegRole('tenant')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      Arrendatario
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      Para explorar y reservar espacios de trabajo
                    </span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col items-start gap-1 ${
                      regRole === 'owner'
                        ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="regRole"
                      value="owner"
                      checked={regRole === 'owner'}
                      onChange={() => setRegRole('owner')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Building className="w-3.5 h-3.5 text-amber-600" />
                      Propietario
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      Para publicar recintos y recibir pagos en CLP
                    </span>
                  </label>
                </div>
              </div>

              {/* Aceptación de Términos */}
              <label className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={regTermsAccepted}
                  onChange={(e) => setRegTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span className="text-[11px] text-slate-600 leading-tight">
                  Acepto los Términos y Condiciones y autorizo el tratamiento de mis datos personales según la Ley 19.628 de Chile.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                {loading ? 'Creando tu cuenta...' : 'Crear Cuenta en Spotly'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">¿Ya tienes cuenta? </span>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Inicia sesión aquí
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
