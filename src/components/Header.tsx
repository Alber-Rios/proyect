import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Bell,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Search,
  KeyRound,
  FileText,
  Briefcase,
  AlertTriangle,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Calendar,
} from 'lucide-react';
import { formatRut } from '../utils/formatters.ts';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenOwnerUpgrade: () => void;
  onOpenAuth: (mode: 'login' | 'register', notice?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenOwnerUpgrade,
  onOpenAuth,
}) => {
  const {
    currentUser,
    allUsers,
    switchUser,
    logout,
    notifications,
    markAllNotificationsRead,
    dismissNotification,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center gap-8">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group transition"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                  Spotly
                </span>
                <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase block">
                  Espacios Chile
                </span>
              </div>
            </button>

            {/* Navegación estrictamente adaptada al ROL o estado no registrado */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-catalogo-btn"
                onClick={() => onNavigate('home')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  currentView === 'home'
                    ? 'bg-rose-50 text-rose-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Search className="w-4 h-4" />
                Explorar Espacios
              </button>

              {/* Vista para ARRENDATARIO: Solo ve sus arriendos */}
              {currentUser?.role === 'tenant' && (
                <button
                  id="nav-mis-arriendos-btn"
                  onClick={() => onNavigate('my-bookings')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    currentView === 'my-bookings'
                      ? 'bg-rose-50 text-rose-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Mis Arriendos
                </button>
              )}

              {/* Vista para PROPIETARIO */}
              {currentUser?.role === 'owner' && (
                <button
                  id="nav-owner-dashboard-btn"
                  onClick={() => onNavigate('owner')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    currentView === 'owner'
                      ? 'bg-rose-50 text-rose-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Panel Propietario
                </button>
              )}

              {/* Vista para ADMINISTRADOR */}
              {currentUser?.role === 'admin' && (
                <button
                  id="nav-admin-dashboard-btn"
                  onClick={() => onNavigate('admin')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    currentView === 'admin'
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Gobierno & Procesos Admin
                </button>
              )}

              {/* Verificación (solo si el usuario ya está verificado o es admin) */}
              {currentUser && currentUser.verificationStatus === 'verified' && (
                <button
                  id="nav-kyc-btn"
                  onClick={() => onNavigate('onboarding')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    currentView === 'onboarding'
                      ? 'bg-amber-50 text-amber-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Verificación OK
                </button>
              )}

              {/* Acceso a Mi Cuenta / Perfil (si está logueado) */}
              {currentUser && (
                <button
                  id="nav-mi-cuenta-btn"
                  onClick={() => onNavigate('profile')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    currentView === 'profile'
                      ? 'bg-rose-50 text-rose-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Mi Cuenta
                </button>
              )}
            </nav>
          </div>

          {/* Acciones Derecha: Según esté registrado o no */}
          <div className="flex items-center gap-3">
            {/* CASO 1: USUARIO NO REGISTRADO (Visitante) */}
            {!currentUser ? (
              <div className="flex items-center gap-2">

                <button
                  id="header-login-btn"
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span>Iniciar Sesión</span>
                </button>

                <button
                  id="header-register-btn"
                  onClick={() => onNavigate('register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition transform active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrarte</span>
                </button>
              </div>
            ) : (
              /* CASO 2: USUARIO AUTENTICADO */
              <>
                {/* CTA CLAVE PARA ARRENDATARIOS: "Quiero ser Propietario" (solo si NO es propietario ni ha aceptado términos) */}
                {currentUser.role === 'tenant' && !currentUser.ownerTermsAccepted && (
                  <button
                    id="header-upgrade-owner-btn"
                    onClick={onOpenOwnerUpgrade}
                    className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm hover:shadow transition transform active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    Quiero ser Propietario
                  </button>
                )}

                {/* Si es propietario o ya aceptó términos, mostrar botón directo al Panel Propietario */}
                {(currentUser.role === 'owner' || currentUser.ownerTermsAccepted) && (
                  <button
                    id="header-switch-to-owner-btn"
                    onClick={() => onNavigate('owner')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    Panel Propietario
                  </button>
                )}

                {/* Campana de Notificaciones */}
                <div className="relative">
                  <button
                    id="notifications-bell-btn"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                    aria-label="Notificaciones"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white"></span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fadeIn">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-900">
                          Notificaciones ({unreadNotifications.length})
                        </span>
                        {unreadNotifications.length > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                          >
                            Marcar leídas
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 py-6 text-center">No hay notificaciones</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3.5 hover:bg-slate-50 transition flex items-start justify-between gap-3 ${
                                !n.read ? 'bg-rose-50/40' : ''
                              }`}
                            >
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-slate-400 block">
                                  {new Date(n.timestamp).toLocaleTimeString('es-CL', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <button
                                onClick={() => dismissNotification(n.id)}
                                className="text-slate-400 hover:text-slate-600 text-xs p-1"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selector de Perfil & Roles conmutador */}
                <div className="relative">
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition shadow-xs"
                  >
                    <div className="text-left hidden lg:block">
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {currentUser.fullName.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        {currentUser.role === 'admin' ? (
                          <span className="text-indigo-600 font-bold">Admin Gobierno</span>
                        ) : currentUser.role === 'owner' ? (
                          <span className="text-amber-700 font-bold">Propietario</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">Arrendatario</span>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <img
                        src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={currentUser.fullName}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                      />
                      {currentUser.verificationStatus === 'verified' && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5" title="Verificado con Cédula y Biometría">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Menú de cambio rápido de perfil / Simulador de Roles */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fadeIn">
                      <div className="px-4 pb-3 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                        <p className="text-xs text-slate-500">{currentUser.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            RUT: {formatRut(currentUser.rut)}
                          </span>
                          {currentUser.ownerTermsAccepted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Anfitrión Habilitado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500">
                              Solo Arrendatario
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acceso rápido según rol */}
                      <div className="py-2 px-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                          Simular Rol del Sistema (Demo Multi-Rol)
                        </div>
                        {allUsers.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setShowUserMenu(false);
                              if (u.role === 'admin') onNavigate('admin');
                              else if (u.role === 'owner') onNavigate('owner');
                              else onNavigate('home');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                              u.id === currentUser.id
                                ? 'bg-rose-50 text-rose-800 font-semibold'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatarUrl}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-medium text-slate-900">{u.fullName}</div>
                                <div className="text-[10px] text-slate-500">
                                  {u.role === 'admin'
                                    ? '🛡️ Administrador de Procesos'
                                    : u.role === 'owner'
                                    ? '🏢 Propietario (Gestión y cobros)'
                                    : '👤 Arrendatario (Solo arrienda)'}
                                </div>
                              </div>
                            </div>
                            {u.id === currentUser.id && (
                              <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                                Activo
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 px-3 border-t border-slate-100 flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('profile');
                          }}
                          className="w-full text-center py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                        >
                          <User className="w-3.5 h-3.5" />
                          Mi Cuenta (Datos y Reservas)
                        </button>

                        {currentUser.role === 'tenant' && !currentUser.ownerTermsAccepted && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenOwnerUpgrade();
                            }}
                            className="w-full text-center py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            Habilitar Rol Propietario
                          </button>
                        )}
                        {(currentUser.role === 'owner' || currentUser.ownerTermsAccepted) && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onNavigate('tenant-reservations');
                            }}
                            className="w-full text-center py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            Mis Reservas (como Arrendatario)
                          </button>
                        )}

                        {currentUser.verificationStatus === 'verified' && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onNavigate('onboarding');
                            }}
                            className="w-full text-center py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                            Verificación de Identidad
                          </button>
                        )}

                        {/* Botón Cerrar Sesión / Modo Visitante */}
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            onNavigate('home');
                          }}
                          className="w-full text-center py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition mt-1"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          Cerrar Sesión (Modo Visitante)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
