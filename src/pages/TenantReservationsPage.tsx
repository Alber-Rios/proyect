import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatClp, formatRut } from '../utils/formatters.ts';
import { ContractModal } from '../components/ContractModal.tsx';
import { DigitalContract } from '../types.ts';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Scale,
  MapPin,
  Video,
  Users,
} from 'lucide-react';

interface TenantReservationsPageProps {
  onNavigate: (view: string) => void;
  onOpenOwnerUpgrade: () => void;
  onOpenAuth?: (mode: 'login' | 'register', notice?: string) => void;
}

export const TenantReservationsPage: React.FC<TenantReservationsPageProps> = ({
  onNavigate,
  onOpenOwnerUpgrade,
  onOpenAuth,
}) => {
  const { currentUser, reservations, contracts, visitRequests, createDispute } = useApp();

  const [activeTab, setActiveTab] = useState<'reservations' | 'visits'>('reservations');
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);
  const [disputeReservationId, setDisputeReservationId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Si no está registrado o autenticado
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Acceso a Mis Arriendos
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Inicia sesión para ver tus reservas
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Tus solicitudes de arriendo, contratos digitales suscritos bajo la Ley 18.101 y comprobantes de garantía están asociados a tu cuenta de Arrendatario.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth?.('login', 'Inicia sesión para acceder a tu historial de arriendos.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => onOpenAuth?.('register', 'Crea tu cuenta de Arrendatario para reservar espacios en Chile.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Registrarte Gratis
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar exclusivamente las reservas de este Arrendatario
  const myBookings = useMemo(() => {
    return reservations.filter((r) => r.tenantId === currentUser.id);
  }, [reservations, currentUser.id]);

  // Filtrar solicitudes de visita de este usuario
  const myVisits = useMemo(() => {
    return visitRequests.filter(
      (v) => v.tenantId === currentUser.id || v.tenantEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [visitRequests, currentUser]);

  const handleOpenContract = (contractId?: string) => {
    const found = contracts.find((c) => c.id === contractId);
    if (found) {
      setSelectedContract(found);
    } else {
      alert('Contrato digital no encontrado.');
    }
  };

  const handleSendDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReservationId || !disputeReason.trim()) return;

    createDispute(disputeReservationId, disputeReason);
    alert('Tu reclamo fue ingresado exitosamente. El equipo de administración arbitrará el caso.');
    setDisputeReservationId(null);
    setDisputeReason('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
              Panel del Arrendatario
            </span>
            <span className="text-xs text-slate-400">RUT: {formatRut(currentUser.rut)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Mis Arriendos y Contratos Digitales
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Revisa el estado de tus solicitudes, descarga los contratos suscritos bajo la Ley 18.101 y gestiona tus estancias en Chile.
          </p>
        </div>

        <button
          onClick={() => onNavigate('home')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <Building className="w-4 h-4" />
          Explorar Más Espacios
        </button>
      </div>

      {/* Si el arrendatario aún no es propietario, mostramos el banner de conversión */}
      {!currentUser.ownerTermsAccepted && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center text-amber-800 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">¿Eres dueño o administrador de una propiedad?</h4>
              <p className="text-xs text-amber-800">
                Acepta los términos de anfitrión para comenzar a publicar tus propios espacios en Spotly.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenOwnerUpgrade}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition whitespace-nowrap"
          >
            Quiero ser Propietario
          </button>
        </div>
      )}

      {/* Pestañas para alternar entre Arriendos y Visitas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'reservations'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Mis Arriendos & Contratos ({myBookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'visits'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mis Visitas Agendadas ({myVisits.length})</span>
        </button>
      </div>

      {activeTab === 'reservations' ? (
        <>
          {/* Lista de Reservas del Arrendatario */}
      {myBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No tienes arriendos activos ni solicitudes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explora nuestro catálogo de oficinas y recintos para reservar tu próximo espacio con contrato digital.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-2 px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition inline-flex items-center gap-2"
          >
            Ver Espacios Disponibles
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={booking.spaceImage}
                  alt={booking.spaceTitle}
                  className="w-full sm:w-36 h-28 object-cover rounded-2xl bg-slate-100 flex-shrink-0"
                />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-400">#{booking.id.slice(-6)}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        booking.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : booking.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {booking.status === 'confirmed'
                        ? 'Confirmada por el Anfitrión'
                        : booking.status === 'pending'
                        ? 'Pendiente de Confirmación'
                        : 'Rechazada'}
                    </span>
                    {booking.disputeStatus === 'opened' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                        Disputa Abierta
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{booking.spaceTitle}</h3>
                  <div className="text-xs text-slate-500">{booking.spaceAddress}</div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {booking.startDate} al {booking.endDate} ({booking.totalDays} {booking.totalDays === 1 ? 'día' : 'días'})
                    </span>
                    <span>Anfitrión: <strong>{booking.ownerName}</strong></span>
                    <span>Total Pagado: <strong className="text-slate-900">{formatClp(booking.totalClp)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Botones de acción del Arrendatario */}
              <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
                {booking.digitalContractId && (
                  <button
                    onClick={() => handleOpenContract(booking.digitalContractId)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Ver Contrato Digital
                  </button>
                )}

                {booking.status === 'confirmed' && booking.disputeStatus !== 'opened' && (
                  <button
                    onClick={() => setDisputeReservationId(booking.id)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Reportar Problema
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  ) : (
    <div className="space-y-4">
      {myVisits.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No tienes visitas agendadas</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ¿Te interesa un espacio pero quieres conocerlo antes? Puedes agendar una visita 100% gratuita presencial o virtual desde la ficha de cualquier espacio.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="mt-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition inline-flex items-center gap-2 cursor-pointer"
          >
            Explorar Catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myVisits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={visit.spaceImage}
                  alt={visit.spaceTitle}
                  className="w-full sm:w-36 h-28 object-cover rounded-2xl bg-slate-100 flex-shrink-0"
                />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {visit.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Visita Confirmada
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 capitalize flex items-center gap-1">
                      {visit.modality === 'presencial' ? (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          Presencial
                        </>
                      ) : (
                        <>
                          <Video className="w-3.5 h-3.5 text-indigo-600" />
                          Virtual
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {visit.spaceTitle}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {visit.visitDate} ({visit.visitTimeSlot})
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {visit.attendeesCount} asistente{visit.attendeesCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      <strong>Ubicación:</strong> {visit.spaceAddress}
                    </div>
                    <div className="text-slate-500">
                      <strong>Anfitrión:</strong> {visit.ownerName}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-center">
                <button
                  onClick={() => onNavigate('home')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Ver Catálogo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

      {/* Modal de Disputa */}
      {disputeReservationId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Abrir Disputa con el Anfitrión</h3>
            <p className="text-xs text-slate-500">
              Explica el motivo del problema (ej. espacio no disponible, corte de servicios esenciales, discrepancia con las fotos). El equipo de administración revisará el contrato y determinará el reembolso.
            </p>

            <form onSubmit={handleSendDispute} className="space-y-3">
              <textarea
                rows={4}
                required
                placeholder="Describe los hechos con detalle..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeReservationId(null)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  Ingresar Reclamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para visualizar el contrato digital */}
      <ContractModal
        contract={selectedContract}
        isOpen={Boolean(selectedContract)}
        onClose={() => setSelectedContract(null)}
      />
    </div>
  );
};
