import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  ShieldAlert,
  UserCheck,
  Building,
  KeyRound,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';

interface RoleBannerProps {
  onOpenOwnerUpgrade: () => void;
  onNavigate: (view: string) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const RoleBanner: React.FC<RoleBannerProps> = ({ onOpenOwnerUpgrade, onNavigate, onOpenAuth }) => {
  const { currentUser, allUsers, switchUser } = useApp();

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs py-2 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!currentUser ? (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-400/40 text-[10px]">
              MODO VISITANTE (NO REGISTRADO)
            </span>
          ) : currentUser.role === 'admin' ? (
            <span className="px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-400/40 text-[10px]">
              MODO ADMINISTRADOR
            </span>
          ) : currentUser.role === 'owner' ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold border border-amber-400/40 text-[10px]">
              MODO PROPIETARIO
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-400/40 text-[10px]">
              MODO ARRENDATARIO
            </span>
          )}

          <span className="text-slate-300">
            {!currentUser && (
              <>Estás explorando el catálogo público de espacios en Chile. Inicia sesión o regístrate para reservar o publicar.</>
            )}
            {currentUser?.role === 'admin' && (
              <>Supervisión de procesos, auditoría, arbitraje de disputas y validación de identidades KYC.</>
            )}
            {currentUser?.role === 'owner' && (
              <>Gestión de recintos propios, aprobación de solicitudes de arriendo y métricas financieras en CLP.</>
            )}
            {currentUser?.role === 'tenant' && (
              <>
                Vista restringida a búsqueda y arriendo.{' '}
                {!currentUser.ownerTermsAccepted && (
                  <span className="text-amber-300 font-semibold">
                    (No puedes ver &quot;Mis Espacios&quot; hasta aceptar los términos de anfitrión).
                  </span>
                )}
              </>
            )}
          </span>
        </div>

        {/* Simulador rápido de perfiles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-[11px]">Probar como:</span>
          
          {/* Opción Visitante */}
          <button
            onClick={() => {
              switchUser(null);
              onNavigate('home');
            }}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
              currentUser === null
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Visitante
          </button>

          {allUsers.slice(0, 3).map((u) => (
            <button
              key={u.id}
              onClick={() => {
                switchUser(u.id);
                if (u.role === 'admin') onNavigate('admin');
                else if (u.role === 'owner') onNavigate('owner');
                else onNavigate('home');
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                currentUser && u.id === currentUser.id
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {u.fullName.split(' ')[0]} ({u.role === 'admin' ? 'Admin' : u.role === 'owner' ? 'Owner' : 'Tenant'})
            </button>
          ))}

          {currentUser?.role === 'tenant' && !currentUser.ownerTermsAccepted && (
            <button
              onClick={onOpenOwnerUpgrade}
              className="ml-1 text-amber-300 hover:text-amber-200 underline font-bold text-[11px] flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Convertirme en Propietario
            </button>
          )}

          {!currentUser && onOpenAuth && (
            <div className="flex items-center gap-1.5 ml-1">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-white hover:text-rose-300 underline font-bold text-[11px]"
              >
                Ingresar
              </button>
              <span className="text-slate-500">•</span>
              <button
                onClick={() => onOpenAuth('register')}
                className="text-rose-400 hover:text-rose-300 underline font-bold text-[11px]"
              >
                Crear Cuenta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
