import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatClp, formatRut } from '../utils/formatters.ts';
import {
  ShieldCheck,
  UserCheck,
  AlertOctagon,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Building,
  Scale,
  Search,
  Lock,
  Banknote,
  Users,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onOpenAuth?: (mode: 'login' | 'register', notice?: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    allUsers,
    spaces,
    disputes,
    auditLogs,
    reservations,
    adminApproveKyc,
    adminRejectKyc,
    adminToggleSpaceStatus,
    adminResolveDispute,
    switchUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'verificacion' | 'spaces' | 'disputes' | 'audit' | 'metrics'>('verificacion');
  const [selectedVerifUser, setSelectedVerifUser] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState('');

  // CASO: Usuario no logueado o sin rol de administrador
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Superintendencia de Operaciones • Restringido
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Acceso Exclusivo para Administradores
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              El panel de gobierno supervisa verificaciones de identidad (Cédula de Identidad y Registro Civil), arbitraje de disputas legales y auditoría forense inmutable.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => switchUser('user-admin-01')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Probar como Ignacio Contreras (Admin Demo)
            </button>
            <button
              onClick={() => onOpenAuth?.('login', 'Ingresa con credenciales de Administrador.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Usuarios pendientes de revisión de Verificación
  const pendingVerifUsers = useMemo(() => {
    return allUsers.filter((u) => u.verificationStatus === 'pending' || (u.verificationStatus as any) === 'pending_review');
  }, [allUsers]);

  // Espacios pendientes de aprobación o moderación
  const spacesToModerate = useMemo(() => {
    return spaces;
  }, [spaces]);

  // Métricas macro de la plataforma
  const platformMetrics = useMemo(() => {
    let totalGmv = 0;
    let platformEarnings = 0;
    reservations.forEach((r) => {
      if (r.status === 'confirmed' || r.status === 'completed') {
        totalGmv += r.totalClp;
        platformEarnings += r.platformFeeClp;
      }
    });

    const tenantsCount = allUsers.filter((u) => u.role === 'tenant').length;
    const ownersCount = allUsers.filter((u) => u.role === 'owner' || u.ownerTermsAccepted).length;
    const verifiedUsersCount = allUsers.filter((u) => u.verificationStatus === 'verified').length;

    return { totalGmv, platformEarnings, tenantsCount, ownersCount, verifiedUsersCount };
  }, [reservations, allUsers]);

  const filteredLogs = useMemo(() => {
    if (!auditFilter) return auditLogs;
    return auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(auditFilter.toLowerCase()) ||
        l.userRole.toLowerCase().includes(auditFilter.toLowerCase()) ||
        l.ip.includes(auditFilter)
    );
  }, [auditLogs, auditFilter]);

  return (
    <div className="space-y-8 pb-16">
      {/* Encabezado del Centro de Gobierno */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Superintendencia de Operaciones y Procesos • Spotly Chile
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Centro de Gobierno y Administración
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Supervisión integral de procesos regulatorios: validación de identidades (Cédula y Registro Civil), moderación de recintos, arbitraje de disputas y auditoría forense inmutable.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Administrador Activo</div>
          <div className="text-sm font-bold text-white">{currentUser.fullName}</div>
          <div className="text-[11px] text-indigo-300">RUT: {formatRut(currentUser.rut)}</div>
        </div>
      </div>

      {/* Tarjetas de Procesos Críticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('verificacion')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 text-left transition shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Verificaciones Pendientes</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingVerifUsers.length}</div>
          <p className="text-[11px] text-slate-400">Identidades por cotejar</p>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-rose-400 text-left transition shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Disputas Activas</span>
            <Scale className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {disputes.filter((d) => d.status === 'pending').length}
          </div>
          <p className="text-[11px] text-slate-400">Casos en mediación</p>
        </button>

        <button
          onClick={() => setActiveTab('spaces')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 text-left transition shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Recintos en Catálogo</span>
            <Building className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{spaces.length}</div>
          <p className="text-[11px] text-slate-400">Oficinas y coworkings</p>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 text-left transition shadow-xs space-y-1"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Logs de Auditoría</span>
            <Activity className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{auditLogs.length}</div>
          <p className="text-[11px] text-slate-400">Trazas de seguridad registradas</p>
        </button>
      </div>

      {/* Selector de Pestañas de Gestión */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          id="admin-tab-verificacion"
          onClick={() => setActiveTab('verificacion')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'verificacion'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Verificación e Identidades ({pendingVerifUsers.length})
        </button>

        <button
          id="admin-tab-spaces"
          onClick={() => setActiveTab('spaces')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'spaces'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          Moderación de Espacios ({spaces.length})
        </button>

        <button
          id="admin-tab-disputes"
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'disputes'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          Mesa de Disputas ({disputes.length})
        </button>

        <button
          id="admin-tab-audit"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          Auditoría Forense & Logs
        </button>

        <button
          id="admin-tab-metrics"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'metrics'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Banknote className="w-4 h-4" />
          Métricas Globales CLP
        </button>
      </div>

      {/* PESTAÑA 1: Verificación e Identidades */}
      {activeTab === 'verificacion' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">
              Expedientes de Identidad por Revisar (Onboarding)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Verifica el cotejo de Cédula de Identidad chilena, coincidencia biométrica facial y el Certificado de Antecedentes para Fines Especiales del Registro Civil.
            </p>

            {pendingVerifUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs mt-4 bg-slate-50 rounded-2xl">
                ✓ No hay solicitudes de verificación pendientes en este momento. Todos los usuarios están al día.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {pendingVerifUsers.map((user) => (
                  <div key={user.id} className="py-4 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-100"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{user.fullName}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                              Pendiente Revisión
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                            <span>RUT: <strong>{formatRut(user.rut)}</strong></span>
                            <span>Correo: <strong>{user.email}</strong></span>
                            <span>Rol Solicitado: <strong>{user.role}</strong></span>
                          </div>
                          <div className="flex items-center gap-3 pt-1 text-[11px]">
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                              ✓ Biometría Facial: Capturada
                            </span>
                            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium border border-indigo-200">
                              ✓ Antecedentes: Adjuntos
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedVerifUser(selectedVerifUser === user.id ? null : user.id)}
                          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-indigo-600" />
                          <span>{selectedVerifUser === user.id ? 'Ocultar' : 'Ver Documentos'}</span>
                        </button>
                        <button
                          onClick={() => adminApproveKyc(user.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprobar Identidad
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Motivo del rechazo de verificación:') || 'Documento no legible';
                            adminRejectKyc(user.id, reason);
                          }}
                          className="px-3 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </button>
                      </div>
                    </div>

                    {/* VISOR EXPANDIBLE DE DOCUMENTOS PARA EL ADMINISTRADOR */}
                    {selectedVerifUser === user.id && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 my-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                            Expediente de {user.fullName} (RUT: {formatRut(user.rut)})
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Enviado: {user.kycData?.submittedAt ? new Date(user.kycData.submittedAt).toLocaleDateString('es-CL') : 'Reciente'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Cédula Frente */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-700 block">Cédula: Frente / Anverso</span>
                            {user.kycData?.idFrontUrl ? (
                              <img
                                src={user.kycData.idFrontUrl}
                                alt="Frente de Cédula"
                                className="w-full aspect-16/10 object-cover rounded-lg border border-slate-200"
                              />
                            ) : (
                              <div className="w-full aspect-16/10 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                                Sin imagen disponible
                              </div>
                            )}
                          </div>

                          {/* Cédula Dorso */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-700 block">Cédula: Dorso / Reverso</span>
                            {user.kycData?.idBackUrl ? (
                              <img
                                src={user.kycData.idBackUrl}
                                alt="Reverso de Cédula"
                                className="w-full aspect-16/10 object-cover rounded-lg border border-slate-200"
                              />
                            ) : (
                              <div className="w-full aspect-16/10 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                                Sin imagen disponible
                              </div>
                            )}
                          </div>

                          {/* Reconocimiento Facial */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-700 block">Reconocimiento Facial (Cámara)</span>
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt="Rostro Facial Capturado"
                                className="w-full aspect-16/10 object-cover rounded-lg border border-slate-200"
                              />
                            ) : (
                              <div className="w-full aspect-16/10 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                                Sin imagen disponible
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Certificado de Antecedentes */}
                        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-amber-700" />
                            <span className="font-bold text-amber-950">
                              Certificado de Antecedentes: {user.kycData?.criminalRecordDocCode || 'Documento adjunto en PDF/Imagen'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            ✓ Documento Recibido
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Listado de Todos los Usuarios y sus Estados */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Directorio de Usuarios Registrados</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">RUT</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Términos Propietario</th>
                    <th className="p-3">Estado Verificación</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {u.verificationStatus === 'verified' && u.avatarUrl && (
                            <img src={u.avatarUrl} alt={u.fullName} className="w-6 h-6 rounded-full object-cover shadow-sm border border-slate-200" />
                          )}
                          <span className="font-semibold text-slate-900">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono">{formatRut(u.rut)}</td>
                      <td className="p-3">
                        <span className="capitalize font-medium">{u.role}</span>
                      </td>
                      <td className="p-3">
                        {u.ownerTermsAccepted ? (
                          <span className="text-emerald-700 font-bold">✓ Aceptados</span>
                        ) : (
                          <span className="text-slate-400">No suscritos</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.verificationStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : u.verificationStatus === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.verificationStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {u.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => adminApproveKyc(u.id)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            Verificar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: Moderación de Espacios */}
      {activeTab === 'spaces' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Catálogo de Inmuebles en Moderación
              </h3>
              <p className="text-xs text-slate-500">
                Pausa o habilita propiedades en el catálogo público conforme al cumplimiento de las normas de seguridad.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {spacesToModerate.map((space) => (
              <div
                key={space.id}
                className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/40"
              >
                {/* Imagen del Espacio en Moderación */}
                {space.images && space.images.length > 0 && (
                  <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-200">
                    <img
                      src={space.images[0]}
                      alt={space.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    {space.images.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
                        +{space.images.length - 1} fotos
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        space.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : space.status === 'paused'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {space.status}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1 line-clamp-1">
                      {space.title}
                    </h4>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {formatClp(space.pricePerDay)}
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-0.5">
                  <div>Ubicación: {space.commune}, {space.region}</div>
                  <div>Propietario: {space.ownerName} (RUT: {formatRut(space.ownerRut)})</div>
                  <div>Capacidad: {space.capacity} pax • {space.surfaceM2} m²</div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Estado en catálogo:</span>
                  <div className="flex items-center gap-1.5">
                    {space.status !== 'active' && (
                      <button
                        onClick={() => adminToggleSpaceStatus(space.id, 'active')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Aprobar y Publicar
                      </button>
                    )}
                    {space.status === 'active' && (
                      <button
                        onClick={() => adminToggleSpaceStatus(space.id, 'paused')}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold"
                      >
                        Pausar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: Mesa de Disputas & Mediación */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Arbitraje Legal de Conflictos y Retención de Fondos
            </h3>
            <p className="text-xs text-slate-500">
              Mediación vinculante para liberación de garantías o reembolsos en base a las cláusulas del contrato firmado.
            </p>
          </div>

          {disputes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl">
              No hay reclamos ni disputas abiertas en la plataforma.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {disputes.map((d) => (
                <div key={d.id} className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">#{d.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === 'pending'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {d.status === 'pending' ? 'En Arbitraje' : d.status}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      Monto en Disputa: {formatClp(d.amountClp)}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-700">
                    <div><strong>Espacio:</strong> {d.spaceTitle}</div>
                    <div><strong>Arrendatario Demandante:</strong> {d.tenantName} ({formatRut(d.tenantRut)})</div>
                    <div><strong>Propietario Demandado:</strong> {d.ownerName} ({formatRut(d.ownerRut)})</div>
                    <div className="pt-1 text-rose-700"><strong>Motivo denunciado:</strong> {d.reason}</div>
                  </div>

                  {d.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() =>
                          adminResolveDispute(
                            d.id,
                            'resolved_refund',
                            'Reembolso total al arrendatario por incumplimiento de servicios esenciales según contrato digital.'
                          )
                        }
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                      >
                        Reembolsar al Arrendatario
                      </button>
                      <button
                        onClick={() =>
                          adminResolveDispute(
                            d.id,
                            'resolved_owner',
                            'Se constató entrega conforme del inmueble. Se liberan fondos al anfitrión.'
                          )
                        }
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                      >
                        Liberar Pago al Propietario
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: Auditoría Forense */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                Registro Inmutable de Seguridad y Cumplimiento Legal
              </h3>
              <p className="text-xs text-slate-500">
                Trazabilidad criptográfica de cada evento: firmas de contratos Ley 18.101, validaciones de identidad y cambios de rol.
              </p>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por evento o rol..."
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Acción Registrada</th>
                  <th className="p-3">Severidad</th>
                  <th className="p-3">Usuario / Rol</th>
                  <th className="p-3">IP Origen</th>
                  <th className="p-3 font-mono">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-sans">
                    <td className="p-3 text-slate-400 font-mono text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString('es-CL')}
                    </td>
                    <td className="p-3 font-bold text-slate-900 font-mono">{log.action}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'critical' || log.severity === 'security'
                            ? 'bg-rose-100 text-rose-800'
                            : log.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800">{log.userRole}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{log.ip}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 5: Métricas Globales */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Volumen Financiero (CLP)</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                <span className="text-xs text-slate-600">Volumen Bruto Transaccionado (GMV)</span>
                <span className="text-lg font-bold text-slate-900">{formatClp(platformMetrics.totalGmv)}</span>
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-950">Ingresos Spotly por Comisiones (5%)</span>
                <span className="text-xl font-extrabold text-indigo-700">{formatClp(platformMetrics.platformEarnings)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Desglose de Comunidad</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span>Arrendatarios Registrados</span>
                <span className="font-bold text-slate-900">{platformMetrics.tenantsCount}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span>Propietarios con Términos Aceptados</span>
                <span className="font-bold text-slate-900">{platformMetrics.ownersCount}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span>Identidades Verificadas con Registro Civil</span>
                <span className="font-bold text-emerald-600 font-semibold">{platformMetrics.verifiedUsersCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
