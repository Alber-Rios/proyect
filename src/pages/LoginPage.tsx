import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  AlertCircle,
  CheckCircle2,
  User,
  KeyRound,
  Shield,
  Zap,
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: string) => void;
}

interface DemoRole {
  role: 'tenant' | 'owner' | 'admin';
  roleTitle: string;
  name: string;
  email: string;
  rut: string;
  description: string;
  badge: string;
  targetView: string;
  icon: 'user' | 'building' | 'shield';
  colorClass: {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    btn: string;
  };
}

const DEMO_ROLES: DemoRole[] = [
  {
    role: 'tenant',
    roleTitle: 'Arrendatario',
    name: 'Matías Silva',
    email: 'matias.silva@gmail.com',
    rut: '18.421.905-3',
    description: 'Busca y reserva',
    badge: 'Inquilino Verificado',
    targetView: 'home',
    icon: 'user',
    colorClass: {
      bg: 'bg-emerald-50/40 hover:bg-emerald-50/80',
      border: 'border-emerald-200 hover:border-emerald-400',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      iconBg: 'bg-emerald-600 text-white',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
    },
  },
  {
    role: 'owner',
    roleTitle: 'Propietario',
    name: 'Carlos Muñoz',
    email: 'carlos.munoz@espacioschile.cl',
    rut: '14.258.963-7',
    description: 'Publica y administra',
    badge: 'Anfitrión Verificado',
    targetView: 'owner',
    icon: 'building',
    colorClass: {
      bg: 'bg-amber-50/40 hover:bg-amber-50/80',
      border: 'border-amber-200 hover:border-amber-400',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      iconBg: 'bg-amber-600 text-white',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
    },
  },
  {
    role: 'admin',
    roleTitle: 'Administrador',
    name: 'Ignacio Contreras',
    email: 'ignacio.contreras@spotly.cl',
    rut: '12.890.345-1',
    description: 'Control Verificación y moderación',
    badge: 'Super Admin',
    targetView: 'admin',
    icon: 'shield',
    colorClass: {
      bg: 'bg-indigo-50/40 hover:bg-indigo-50/80',
      border: 'border-indigo-200 hover:border-indigo-400',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
      iconBg: 'bg-indigo-600 text-white',
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20',
    },
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Por favor ingresa tu Correo Electrónico o RUT.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (res.success) {
        setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
        setTimeout(() => {
          onNavigate('home');
        }, 600);
      } else {
        setError(res.message || 'Credenciales no válidas. Revisa tu RUT o correo.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demo: DemoRole) => {
    setError(null);
    setIdentifier(demo.email);
    setPassword('123456');
    setLoading(true);
    setSuccess(`Ingresando como ${demo.roleTitle} (${demo.name})...`);

    try {
      const res = await login(demo.email, '123456');
      if (res.success) {
        setTimeout(() => {
          onNavigate(demo.targetView);
        }, 600);
      } else {
        setError(res.message || 'Error al iniciar sesión con cuenta demo.');
        setSuccess(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error en inicio de sesión demo.');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demo: DemoRole) => {
    setIdentifier(demo.email);
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden min-h-[620px]">
        {/* Columna Izquierda: Información de Marca y Garantías */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block leading-tight">
                  Spotly
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider uppercase block">
                  Espacios Chile
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Bienvenido de vuelta a tu plataforma de arriendos
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accede a tu panel para gestionar solicitudes, revisar tus contratos de arriendo y explorar los mejores recintos comerciales en Chile.
              </p>
            </div>

            <div className="space-y-3 pt-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Contratos digitales bajo Ley N° 18.101</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Validación de identidad biométrica</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Liquidaciones automáticas en CLP</span>
              </div>
            </div>

            {/* Resumen de los 3 Roles disponibles */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Arquitectura Multi-Rol:
              </div>
              <div className="space-y-2 text-[11px] text-slate-300">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-semibold text-emerald-400">1. Arrendatario:</span>
                  <span className="text-slate-400 text-[10px]">Busca y reserva</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-semibold text-amber-400">2. Propietario:</span>
                  <span className="text-slate-400 text-[10px]">Publica y administra</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="font-semibold text-indigo-400">3. Administrador:</span>
                  <span className="text-slate-400 text-[10px]">Control Verificación y moderación</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-6 relative z-10 border-t border-slate-800/80">
            © 2026 Spotly SpA • Santiago de Chile
          </div>

          {/* Efecto de luz */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
        </div>

        {/* Columna Derecha: Formulario + Demo por Roles */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="max-w-xl w-full mx-auto space-y-5">
            {/* Header del Formulario */}
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h3>
              <p className="text-xs text-slate-500">
                Ingresa con tu correo o RUT, o usa un acceso rápido de demostración con diferentes roles.
              </p>
            </div>

            {/* SECCIÓN DEMO ACCESO RÁPIDO CON DIFERENTES ROLES */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      Cuentas Demo con Diferentes Roles
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Haz clic para ingresar directamente con cualquier rol del sistema
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  Demo 1-Clic
                </span>
              </div>

              {/* Tarjetas de Roles Demo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {DEMO_ROLES.map((demo) => (
                  <div
                    key={demo.role}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${demo.colorClass.bg} ${demo.colorClass.border}`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${demo.colorClass.badgeBg} ${demo.colorClass.badgeText}`}>
                          {demo.roleTitle}
                        </span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${demo.colorClass.iconBg}`}>
                          {demo.icon === 'user' && <User className="w-3 h-3" />}
                          {demo.icon === 'building' && <Building2 className="w-3 h-3" />}
                          {demo.icon === 'shield' && <Shield className="w-3 h-3" />}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {demo.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {demo.email}
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-600 leading-tight line-clamp-2">
                        {demo.description}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin(demo)}
                        disabled={loading}
                        className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs ${demo.colorClass.btn}`}
                        title={`Iniciar sesión como ${demo.roleTitle}`}
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Entrar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillCredentials(demo)}
                        className="w-full py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer text-center hover:underline"
                      >
                        Cargar en formulario
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensajes de Alerta */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Formulario Estándar */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico o RUT
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="ej. matias.silva@gmail.com o 18.421.905-3"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                  />
                  <span>Recordar mi sesión</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Iniciando Sesión...' : 'Ingresar a mi Cuenta'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
              ¿Aún no tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Crear cuenta gratis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
