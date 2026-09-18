import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { UserGender, DigitalContract } from '../types.ts';
import { formatClp, formatRut, validateRut } from '../utils/formatters.ts';
import { ContractModal } from '../components/ContractModal.tsx';
import {
  User,
  Calendar,
  CreditCard,
  Bell,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  Edit3,
  Save,
  Building,
  ArrowRight,
  ExternalLink,
  Trash2,
  Clock,
  Sparkles,
  Award,
  Upload,
  Camera,
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
  onOpenOwnerUpgrade: () => void;
  onOpenAuth?: (mode: 'login' | 'register', notice?: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigate,
  onOpenOwnerUpgrade,
  onOpenAuth,
}) => {
  const {
    currentUser,
    updateUserProfile,
    reservations,
    contracts,
    notifications,
    markAllNotificationsRead,
    dismissNotification,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'details' | 'reservations' | 'notifications'>('details');
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);

  // Formulario de edición de datos personales
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [rut, setRut] = useState(currentUser?.rut || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+56 9 ');
  const [gender, setGender] = useState<UserGender>(currentUser?.gender || 'prefiero_no_decir');
  const [birthDate, setBirthDate] = useState(currentUser?.birthDate || '1995-05-15');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [commune, setCommune] = useState(currentUser?.commune || 'Las Condes');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Si no está registrado/autenticado
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Mi Cuenta Spotly
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Inicia sesión para gestionar tu cuenta
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Accede a tus datos personales, actualiza tu información de contacto, revisa el estado de tus reservas y consulta tus notificaciones oficiales.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth?.('login', 'Inicia sesión para acceder a tu perfil y datos.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => onOpenAuth?.('register', 'Crea una cuenta en Spotly Chile.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Registrarte Gratis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar reservas que pertenecen a este usuario (como arrendatario)
  const myReservations = useMemo(() => {
    return reservations.filter((r) => r.tenantId === currentUser.id);
  }, [reservations, currentUser.id]);

  // Manejo de actualización de perfil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaveSuccess(false);

    if (!fullName.trim()) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }

    if (!validateRut(rut)) {
      setFormError('El RUT ingresado no es válido según el algoritmo Módulo 11 de Chile.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Ingresa un correo electrónico válido.');
      return;
    }

    updateUserProfile({
      fullName: fullName.trim(),
      rut: rut.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gender,
      birthDate,
      avatarUrl: avatarUrl.trim() || currentUser.avatarUrl,
      commune: commune.trim(),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenContract = (contractId?: string) => {
    const found = contracts.find((c) => c.id === contractId);
    if (found) {
      setSelectedContract(found);
    } else {
      alert('Contrato digital no encontrado.');
    }
  };

  // Calcular edad actual
  const userAge = useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [birthDate]);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 pb-20">
      {/* TARJETA CABECERA DE PERFIL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={avatarUrl || currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={currentUser.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-rose-100 shadow-md"
              />
              <label className="absolute -bottom-2 -right-2 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full cursor-pointer shadow-lg transition">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentUser.fullName}
                </h1>
                {currentUser.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Identidad Verificada
                  </span>
                ) : currentUser.verificationStatus === 'pending' || (currentUser.verificationStatus as any) === 'pending_review' ? (
                  <button
                    onClick={() => onNavigate('onboarding')}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Revisión Pendiente por Admin (~2 días)
                  </button>
                ) : null}
              </div>

              <p className="text-xs text-slate-500 font-mono">
                RUT: <strong className="text-slate-800">{formatRut(currentUser.rut)}</strong> • {currentUser.email}
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                  Rol: {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'owner' ? 'Propietario' : 'Arrendatario'}
                </span>
                {currentUser.ownerTermsAccepted ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800">
                    ✓ Anfitrión Habilitado
                  </span>
                ) : (
                  <button
                    onClick={onOpenOwnerUpgrade}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-50 to-amber-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Habilitarme como Anfitrión
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <span className="text-[11px] text-slate-400">
              Miembro desde {new Date(currentUser.createdAt || Date.now()).toLocaleDateString('es-CL')}
            </span>
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5 text-slate-500" />
              Explorar Espacios
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'details'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          Mis Datos Personales
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reservations'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Mis Reservas ({myReservations.length})
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          Centro de Notificaciones ({notifications.length})
        </button>
      </div>

      {/* PESTAÑA 1: MIS DATOS PERSONALES (ACTUALIZABLES) */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-600" />
                Actualizar Información de Mi Cuenta
              </h2>
              <p className="text-xs text-slate-500">
                Mantén tus datos al día para la firma fehaciente de contratos digitales Ley N° 18.101.
              </p>
            </div>
            {userAge !== null && (
              <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                Edad calculada: <strong>{userAge} años</strong>
              </span>
            )}
          </div>

          {saveSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-medium flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-bold">¡Datos actualizados con éxito!</p>
                <p className="text-[11px] text-emerald-700">Tu información de contacto y perfil han quedado sincronizados en Spotly.</p>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  RUT Chileno (con guión)
                </label>
                <input
                  type="text"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono Móvil (+56 9 ...)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Género
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as UserGender)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="no_binario">No binario</option>
                  <option value="otro">Otro</option>
                  <option value="prefiero_no_decir">Prefiero no decir</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comuna de Residencia
                </label>
                <input
                  type="text"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="ej. Las Condes, Providencia, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL de Foto de Perfil / Avatar
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios de Mi Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PESTAÑA 2: MIS RESERVAS */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Historial de Arriendos y Reservas
              </h2>
              <p className="text-xs text-slate-500">
                Detalle de recintos reservados, uso declarado, pagos simulados y contratos Ley 18.101.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl">
              {myReservations.length} {myReservations.length === 1 ? 'Reserva' : 'Reservas'}
            </span>
          </div>

          {myReservations.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Aún no tienes reservas activas</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explora el catálogo de oficinas, recintos abiertos y cerrados para agendar tu primer espacio en Chile.
              </p>
              <button
                onClick={() => onNavigate('home')}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
              >
                <span>Explorar Espacios Disponibles</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={res.spaceImage}
                        alt={res.spaceTitle}
                        className="w-20 h-20 rounded-2xl object-cover ring-1 ring-slate-200 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md">
                            {res.spaceCategory}
                          </span>
                          {res.spaceEnvironment && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                              {res.spaceEnvironment === 'abierto' ? 'Al Aire Libre' : 'Techado / Cerrado'}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                              res.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {res.status === 'confirmed' ? '✓ Confirmada' : 'Pendiente'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{res.spaceTitle}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {res.spaceAddress}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right space-y-1 sm:pl-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-xs text-slate-400">Total Transacción</div>
                      <div className="text-base font-black text-slate-900">{formatClp(res.totalClp)}</div>
                      <div className="text-[11px] text-slate-500">
                        {res.startDate} al {res.endDate} ({res.totalDays} {res.totalDays === 1 ? 'día' : 'días'})
                      </div>
                    </div>
                  </div>

                  {/* USO DECLARADO OBLIGATORIO */}
                  {res.intendedUse && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-600" />
                        <span>Uso declarado para el espacio:</span>
                      </div>
                      <p className="text-slate-600 italic">"{res.intendedUse}"</p>
                    </div>
                  )}

                  {/* SIMULACIÓN DE PAGO TRANSPANK / TARJETA */}
                  {res.paymentSimulation && (
                    <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-700" />
                        <div>
                          <span className="font-bold text-slate-800 uppercase">
                            {res.paymentSimulation.cardBrand} •••• {res.paymentSimulation.last4}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Titular: {res.paymentSimulation.cardHolder} • {res.paymentSimulation.installments === 1 ? 'Sin cuotas' : `${res.paymentSimulation.installments} cuotas`}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right text-[11px] text-slate-500">
                        <span>Código Aut: <strong className="font-mono text-slate-700">{res.paymentSimulation.authorizationCode}</strong></span>
                        <span className="block text-emerald-700 font-bold">Transbank Webpay Plus OK</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Folio Reserva: <span className="font-mono text-slate-600">{res.id}</span>
                    </span>
                    <button
                      onClick={() => handleOpenContract(res.contractId)}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ver Contrato Digital Ley 18.101
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 3: CENTRO DE NOTIFICACIONES */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                Centro de Notificaciones Oficiales
              </h2>
              <p className="text-xs text-slate-500">
                Avisos de bienvenida, confirmaciones de reserva y comunicados legales del sistema.
              </p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold transition"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Tarjeta de Bienvenida Exclusiva */}
          <div className="p-5 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 rounded-2xl border border-rose-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                👋
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  ¡Te damos la bienvenida a Spotly Chile, {currentUser.fullName.split(' ')[0]}!
                </h3>
                <p className="text-xs text-slate-600">
                  Tu ecosistema seguro para reservar y gestionar espacios comerciales con marco legal chileno.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-700">
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60">
                <strong className="block text-slate-900">1. Contratos Ley 18.101</strong>
                Generados y firmados de forma digital automáticamente.
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60">
                <strong className="block text-slate-900">2. Pago Seguro Transbank</strong>
                Simulación completa de tarjetas bancarias y Webpay.
              </div>
              <div className="bg-white/80 p-3 rounded-xl border border-amber-200/60">
                <strong className="block text-slate-900">3. Verificación Oficial</strong>
                Validación biométrica facial y revisión de documentos por administración.
              </div>
            </div>
          </div>

          {/* Lista de Notificaciones de la Sesión */}
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tienes notificaciones pendientes.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                    !notif.read
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 block pt-1 font-mono">
                      {new Date(notif.timestamp).toLocaleString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <button
                    onClick={() => dismissNotification(notif.id)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition"
                    title="Descartar notificación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal para visualizar contratos */}
      <ContractModal
        contract={selectedContract}
        isOpen={Boolean(selectedContract)}
        onClose={() => setSelectedContract(null)}
      />
    </div>
  );
};
