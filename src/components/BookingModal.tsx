import React, { useState, useMemo, useEffect } from 'react';
import { Space, DigitalContract, PaymentSimulationData, VisitRequest } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { formatClp, formatRut } from '../utils/formatters.ts';
import { SignatureCanvas } from './SignatureCanvas.tsx';
import { WebpayPaymentBox } from './WebpayPaymentBox.tsx';
import {
  Calendar as CalendarIcon,
  ShieldCheck,
  CreditCard,
  FileCheck2,
  AlertCircle,
  MapPin,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  Building2,
  Video,
  X,
  FileText,
  Info,
  Lock,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  UserCheck,
  RotateCcw,
  Check,
  CalendarCheck,
} from 'lucide-react';

interface BookingModalProps {
  space: Space | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contract: DigitalContract) => void;
  onOpenAuth?: (mode: 'login' | 'register', notice?: string) => void;
  initialMode?: 'booking' | 'visit';
}

const CATEGORY_NAMES: Record<string, string> = {
  office: 'Oficina Privada',
  cowork: 'Coworking',
  event: 'Eventos & Workshops',
  studio: 'Estudio Creativo',
  warehouse: 'Bodega Urbana',
};

const POPULAR_USES = [
  'Reunión de equipo y coworking',
  'Producción audiovisual o fotografía',
  'Taller, curso o capacitación',
  'Evento corporativo privado',
  'Grabación de podcast o contenido',
  'Almacenamiento temporal de mercadería',
];

const TIME_SLOTS = [
  { id: '10:00 - 12:00', label: '10:00 - 12:00', period: 'Mañana' },
  { id: '12:00 - 15:00', label: '12:00 - 15:00', period: 'Mediodía' },
  { id: '15:00 - 18:00', label: '15:00 - 18:00', period: 'Tarde' },
  { id: '18:00 - 20:00', label: '18:00 - 20:00', period: 'Vespertino' },
];

export const BookingModal: React.FC<BookingModalProps> = ({
  space,
  isOpen,
  onClose,
  onSuccess,
  onOpenAuth,
  initialMode = 'booking',
}) => {
  const { currentUser, createBooking, requestVisit, quickVerifyUser, savedCards } = useApp();

  // Modo activo: 'booking' (Reserva formal) o 'visit' (Solicitud de visita)
  const [activeMode, setActiveMode] = useState<'booking' | 'visit'>(initialMode);

  // Pasos de Reserva: 1 = Fechas y Uso, 2 = Contrato Digital, 3 = Pago Webpay
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  // Fechas de reserva
  const now = new Date();
  const formatIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const tomorrowStr = formatIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const dayAfterTomorrowStr = formatIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));

  const [startDate, setStartDate] = useState(tomorrowStr);
  const [endDate, setEndDate] = useState(dayAfterTomorrowStr);
  const [bookingTimeSlots, setBookingTimeSlots] = useState<string[]>([]);
  const [intendedUse, setIntendedUse] = useState('');
  const [acceptContract, setAcceptContract] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado de Solicitud de Visita
  const [visitDate, setVisitDate] = useState(tomorrowStr);
  const [visitTimeSlot, setVisitTimeSlot] = useState(TIME_SLOTS[0].id);
  const [visitModality, setVisitModality] = useState<'presencial' | 'virtual'>('presencial');
  const [visitAttendees, setVisitAttendees] = useState(2);
  const [visitorName, setVisitorName] = useState(currentUser?.fullName || '');
  const [visitorEmail, setVisitorEmail] = useState(currentUser?.email || '');
  const [visitorPhone, setVisitorPhone] = useState(currentUser?.phone || '+56 9 8765 4321');
  const [visitNotes, setVisitNotes] = useState('');
  const [createdVisit, setCreatedVisit] = useState<VisitRequest | null>(null);

  // Sincronizar usuario o modo inicial al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
      setBookingStep(1);
      setError(null);
      setCreatedVisit(null);
      if (currentUser) {
        setVisitorName(currentUser.fullName);
        setVisitorEmail(currentUser.email);
        setVisitorPhone(currentUser.phone || '+56 9 8765 4321');
      }
    }
  }, [isOpen, initialMode, currentUser]);

  const [selectedModality, setSelectedModality] = useState<'por_hora' | 'por_dia' | 'mensual'>(
    space?.rentalModality === 'por_hora' ? 'por_hora' : space?.rentalModality === 'mensual' ? 'mensual' : 'por_dia'
  );

  useEffect(() => {
    if (space) {
      if (space.rentalModality === 'por_hora') setSelectedModality('por_hora');
      else if (space.rentalModality === 'mensual') setSelectedModality('mensual');
      else setSelectedModality('por_dia');
    }
  }, [space]);

  // Cálculo de unidades y montos en CLP según modalidad
  const calculations = useMemo(() => {
    if (!space) return { units: 1, label: 'día', subtotal: 0, platformFee: 0, deposit: 0, total: 0 };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    let daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (daysDiff <= 0) daysDiff = 1;

    const activeModality = space.rentalModality === 'abierto' ? selectedModality : (space.rentalModality || 'por_dia');

    let units = daysDiff;
    let label = daysDiff === 1 ? 'día' : 'días';
    let basePrice = space.pricePerDay;

    if (activeModality === 'por_hora') {
      units = bookingTimeSlots.length > 0 ? bookingTimeSlots.length * 2 : 2; // Cada bloque es de 2 horas
      label = 'horas';
      basePrice = space.pricePerHour || Math.round(space.pricePerDay / 6);
    } else if (activeModality === 'mensual') {
      units = Math.ceil(daysDiff / 30) || 1;
      label = units === 1 ? 'mes' : 'meses';
      basePrice = space.pricePerMonth || (space.pricePerDay * 25);
    } else {
      // por_dia (default)
      units = daysDiff;
      label = units === 1 ? 'día' : 'días';
      basePrice = space.pricePerDay;
    }

    const subtotal = units * basePrice;
    const platformFee = Math.round(subtotal * 0.05); // 5% fee de servicio Spotly
    const deposit = space.securityDeposit || Math.round(basePrice * 0.5); // Garantía retornable
    const total = subtotal + platformFee + deposit;

    return { units, label, subtotal, platformFee, deposit, total, basePrice };
  }, [space, startDate, endDate, selectedModality]);

  // Enviar Reserva
  const handlePaymentSuccess = async (paymentData: PaymentSimulationData) => {
    if (!currentUser) {
      setError('Debes iniciar sesión con tu cuenta para formalizar la reserva.');
      return;
    }

    if (currentUser.verificationStatus !== 'verified') {
      setError('Tu cuenta debe estar verificada. Haz clic en el botón de abajo para verificar tu identidad con 1-click.');
      return;
    }

    if (!acceptContract || !signatureDataUrl) {
      setError('Debes aceptar y firmar electrónicamente el Contrato Digital de Arrendamiento (Ley 18.101).');
      setBookingStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createBooking({
        space: space!,
        startDate,
        endDate,
        totalDays: calculations.units,
        subtotalClp: calculations.subtotal,
        platformFeeClp: calculations.platformFee,
        securityDepositClp: calculations.deposit,
        totalClp: calculations.total,
        intendedUse: intendedUse.trim(),
        signatureImage: signatureDataUrl,
        signatureType: 'drawn',
        paymentSimulation: paymentData,
      });

      onClose();
      onSuccess(res.contract);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la reserva.');
    } finally {
      setLoading(false);
    }
  };

  // Enviar Solicitud de Visita
  const handleSubmitVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!space) return;

    if (!visitorName.trim()) {
      setError('Por favor ingresa tu nombre completo para la visita.');
      return;
    }
    if (!visitorPhone.trim()) {
      setError('Por favor ingresa un teléfono o WhatsApp de contacto.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const visit = requestVisit({
        spaceId: space.id,
        spaceTitle: space.title,
        spaceAddress: `${space.address}, ${space.commune}`,
        spaceImage: space.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        tenantId: currentUser ? currentUser.id : 'guest-visitor',
        tenantName: visitorName.trim(),
        tenantEmail: visitorEmail.trim() || 'contacto@spotly.cl',
        tenantPhone: visitorPhone.trim(),
        ownerId: space.ownerId,
        ownerName: space.ownerName,
        ownerRut: space.ownerRut,
        visitDate,
        visitTimeSlot,
        modality: visitModality,
        attendeesCount: visitAttendees,
        notes: visitNotes.trim() || undefined,
      });

      setCreatedVisit(visit);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar visita.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !space) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div
        id="booking-visit-modal"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Cabecera Principal del Modal */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  {CATEGORY_NAMES[space.category] || space.category}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {space.commune}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-md sm:max-w-lg">
                {space.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas Superiores: [ 📅 Reservar Espacio ] vs [ 📍 Solicitar Visita Gratuita ] */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveMode('booking');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeMode === 'booking'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Reservar Espacio (Contrato y Pago)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('visit');
              setError(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              activeMode === 'visit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Solicitar Visita (Gratuita)</span>
          </button>
        </div>

        {/* Mensaje de Error General */}
        {error && (
          <div className="m-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* CONTENIDO SCROLLABLE */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* ============================================================ */}
          {/* MODO 1: FLUJO DE RESERVA DIRECTA (INTUITIVO Y EN 3 PASOS)    */}
          {/* ============================================================ */}
          {activeMode === 'booking' && (
            <div className="space-y-5">
              {/* PASO 1: SELECCIÓN DE FECHAS Y ACTIVIDAD PROPUESTA */}
              {bookingStep === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  {/* Selector de Modalidad si el espacio está 'Abierto a todas las modalidades' */}
                  {space.rentalModality === 'abierto' && (
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-2">
                      <div className="text-xs font-bold text-amber-900 flex items-center justify-between">
                        <span>⚡ Espacio Abierto a Todas las Modalidades</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          Elige tu preferencia
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedModality('por_hora')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                            selectedModality === 'por_hora'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          ⏱️ Por Hora
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedModality('por_dia')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                            selectedModality === 'por_dia'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          📅 Por Día
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedModality('mensual')}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                            selectedModality === 'mensual'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          🏢 Por Mes
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selectores de Fechas y Disponibilidad */}
                  {selectedModality === 'por_hora' ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Día de Reserva</span>
                        </label>
                        <input
                          type="date"
                          min={tomorrowStr}
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setEndDate(e.target.value);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Horarios Disponibles para el {startDate.split('-').reverse().join('-')}</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                setBookingTimeSlots(prev => 
                                  prev.includes(slot.id) 
                                    ? prev.filter(id => id !== slot.id)
                                    : [...prev, slot.id]
                                );
                              }}
                              className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                                bookingTimeSlots.includes(slot.id)
                                  ? 'bg-rose-600 border-rose-600 text-white font-bold shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className="text-[10px] opacity-80 uppercase tracking-wider">{slot.period}</div>
                              <div className="text-xs font-bold mt-0.5">{slot.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Fecha de Inicio</span>
                        </label>
                        <input
                          type="date"
                          min={tomorrowStr}
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (e.target.value > endDate) {
                              setEndDate(e.target.value);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Fecha de Término</span>
                        </label>
                        <input
                          type="date"
                          min={startDate}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Propósito de Uso / Actividad */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>¿Qué actividad o uso le darás al espacio?</span>
                      <span className="text-[11px] text-slate-400">Requerido por Ley 18.101</span>
                    </label>

                    {/* Chips de sugerencias rápidas */}
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_USES.map((use) => (
                        <button
                          key={use}
                          type="button"
                          onClick={() => setIntendedUse(use)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            intendedUse === use
                              ? 'bg-rose-600 border-rose-600 text-white font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {use}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      value={intendedUse}
                      onChange={(e) => setIntendedUse(e.target.value)}
                      placeholder="Ej. Taller presencial de diseño para 10 personas, uso de computadores portátiles y proyector."
                      className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Resumen de Valores Transparente */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{formatClp(calculations.basePrice)} × {calculations.units} {calculations.label}</span>
                      <span className="font-semibold text-slate-900">{formatClp(calculations.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <span>Garantía de Arriendo (Retornable)</span>
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                      <span className="font-semibold text-slate-900">{formatClp(calculations.deposit)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Servicio de Plataforma Spotly (5%)</span>
                      <span className="font-semibold text-slate-900">{formatClp(calculations.platformFee)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                      <span>Total en CLP a Transferir/Pagar</span>
                      <span className="text-rose-600">{formatClp(calculations.total)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedModality === 'por_hora' && bookingTimeSlots.length === 0) {
                          setError('Por favor selecciona al menos un horario disponible.');
                          return;
                        }
                        if (!intendedUse.trim()) {
                          setError('Por favor selecciona o describe el propósito de uso del espacio.');
                          return;
                        }
                        setError(null);
                        setBookingStep(2);
                      }}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Continuar al Contrato Digital</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: CONTRATO DIGITAL LEY 18.101 */}
              {bookingStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-sm font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <FileCheck2 className="w-4 h-4 text-rose-600" />
                          Contrato de Arrendamiento
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold mt-1 block">
                          Generado automáticamente por Spotly
                        </span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                        Ley N° 18.101
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 space-y-3 leading-relaxed font-serif">
                      <p className="text-justify">
                        En Santiago de Chile, a {new Date().toLocaleDateString('es-CL')}, se celebra el presente contrato de arrendamiento entre las siguientes partes:
                      </p>
                      
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 font-sans">
                        <p>
                          <strong>Arrendador (Propietario):</strong> {space.ownerName} (RUT: {space.ownerRut || '15.482.901-K'})
                        </p>
                        <p>
                          <strong>Arrendatario:</strong> {currentUser?.fullName || 'Usuario no autenticado'} (RUT: {currentUser?.rut || 'Pendiente'})
                        </p>
                        <p>
                          <strong>Inmueble:</strong> {space.title}, ubicado en {space.address}, {space.commune}.
                        </p>
                      </div>

                      <p className="text-justify">
                        <strong>Primero:</strong> El Arrendador da en arriendo el Inmueble detallado precedentemente al Arrendatario, quien lo acepta para el uso exclusivo de: <strong>{intendedUse || 'Uso comercial / Coworking'}</strong>.
                      </p>
                      
                      <p className="text-justify">
                        <strong>Segundo:</strong> La vigencia de este contrato será desde el <strong>{startDate}</strong> hasta el <strong>{endDate}</strong>, comprendiendo un total de <strong>{calculations.units} {calculations.label}</strong>.
                      </p>
                      
                      <p className="text-justify">
                        <strong>Tercero:</strong> El valor acordado para este período es de <strong>{formatClp(calculations.subtotal)}</strong>, más una garantía retornable de <strong>{formatClp(calculations.deposit)}</strong>, totalizando a pagar <strong>{formatClp(calculations.total)}</strong> (incluyendo tarifas de servicio).
                      </p>
                    </div>
                  </div>

                  {/* Checkbox de aceptación legal */}
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="checkbox"
                      checked={acceptContract}
                      onChange={(e) => setAcceptContract(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-rose-600 rounded-md border-slate-300 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed font-bold">
                      Leí el contrato y acepto los términos y condiciones
                    </span>
                  </label>

                  {/* Firma Digital Integrada */}
                  <div className="pt-2">
                    <SignatureCanvas onSignatureChange={setSignatureDataUrl} />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Volver</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!acceptContract) {
                          setError('Debes marcar la casilla para suscribir y firmar el contrato digital.');
                          return;
                        }
                        if (!signatureDataUrl) {
                          setError('Por favor dibuja tu firma en el recuadro para avanzar.');
                          return;
                        }
                        setError(null);
                        setBookingStep(3);
                      }}
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Continuar al Pago Seguro</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: PAGO SEGURO WEBPAY / TARJETAS */}
              {bookingStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Banner de Estado de Verificación del Usuario */}
                  {!currentUser ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                      <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Inicia sesión para confirmar tu reserva</span>
                      </div>
                      <p className="text-xs text-amber-700">
                        Necesitas una cuenta activa para asociar el contrato legal y los comprobantes de pago.
                      </p>
                      {onOpenAuth && (
                        <button
                          type="button"
                          onClick={() => onOpenAuth('login', 'Inicia sesión para formalizar tu reserva')}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          Iniciar Sesión Ahora
                        </button>
                      )}
                    </div>
                  ) : currentUser.verificationStatus !== 'verified' ? (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                      <div className="text-xs font-bold text-indigo-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>Validación de Identidad Requerida</span>
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                          KYC Chile
                        </span>
                      </div>
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Para arriendos regidos por la Ley 18.101 tu identidad debe estar validada. Puedes activar la verificación rápida para continuar la prueba inmediatamente:
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Identidad verificada exitosamente ({currentUser.fullName} - RUT {formatRut(currentUser.rut)})</span>
                    </div>
                  )}

                  {/* Componente Modular de Pago Webpay */}
                  <WebpayPaymentBox
                    totalAmountClp={calculations.total}
                    initialCardHolder={currentUser?.fullName.toUpperCase()}
                    initialRut={currentUser?.rut}
                    onPaymentSuccess={handlePaymentSuccess}
                    onCancel={() => setBookingStep(2)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* MODO 2: FLUJO DE SOLICITAR VISITA (INTUITIVO Y COMPLETO)     */}
          {/* ============================================================ */}
          {activeMode === 'visit' && (
            <div className="space-y-5 animate-in fade-in">
              {/* SI YA SE GENERÓ LA VISITA CON ÉXITO */}
              {createdVisit ? (
                <div className="p-6 bg-emerald-950/80 rounded-3xl border border-emerald-600 text-white space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                    <CalendarCheck className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
                      ✓ Solicitud Registrada y Confirmada
                    </span>
                    <h3 className="text-lg font-black text-white">¡Visita Agendada con Éxito!</h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                      El anfitrión <strong>{createdVisit.ownerName}</strong> ha sido notificado para recibirte en el recinto.
                    </p>
                  </div>

                  {/* Voucher Card */}
                  <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 text-left text-xs space-y-2.5 max-w-md mx-auto">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Código de Visita:</span>
                      <span className="font-mono font-bold text-emerald-400">{createdVisit.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Fecha Pactada:</span>
                      <span className="font-bold text-white">{createdVisit.visitDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Franja Horaria:</span>
                      <span className="font-bold text-cyan-400">{createdVisit.visitTimeSlot}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Modalidad:</span>
                      <span className="font-bold capitalize text-white">
                        {createdVisit.modality === 'presencial' ? '🏢 Presencial en el Recinto' : '💻 Virtual (Videollamada)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Dirección:</span>
                      <span className="font-bold text-white text-right truncate max-w-[200px]">
                        {createdVisit.spaceAddress}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCreatedVisit(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Agendar Otra Fecha
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-md"
                    >
                      Entendido, Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* FORMULARIO DE AGENDAMIENTO DE VISITA */
                <form onSubmit={handleSubmitVisit} className="space-y-4">
                  {/* Banner de Valor Gratuito */}
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950">
                        Visita 100% Gratuita y Sin Compromiso
                      </h4>
                      <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
                        Conoce el espacio, verifica su acústica, iluminación o capacidad antes de arrendar. Puedes coordinar una visita presencial o una videollamada guiada en vivo.
                      </p>
                    </div>
                  </div>

                  {/* 1. Modalidad: Presencial vs Virtual */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800">1. Selecciona la Modalidad de Visita:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setVisitModality('presencial')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-3 ${
                          visitModality === 'presencial'
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          visitModality === 'presencial' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Visita Presencial</div>
                          <div className="text-[11px] text-slate-500">En {space.commune}</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVisitModality('virtual')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-3 ${
                          visitModality === 'virtual'
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          visitModality === 'virtual' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Visita Virtual</div>
                          <div className="text-[11px] text-slate-500">Videollamada en vivo</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Fecha y Horario */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Fecha deseada de visita</span>
                      </label>
                      <input
                        type="date"
                        min={tomorrowStr}
                        value={visitDate}
                        onChange={(e) => setVisitDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cantidad de asistentes</span>
                      </label>
                      <select
                        value={visitAttendees}
                        onChange={(e) => setVisitAttendees(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value={1}>1 persona (solo tú)</option>
                        <option value={2}>2 personas</option>
                        <option value={3}>3 personas</option>
                        <option value={4}>4 personas</option>
                        <option value={5}>5 o más personas</option>
                      </select>
                    </div>
                  </div>

                  {/* Franja Horaria */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800">Franja Horaria de Preferencia:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setVisitTimeSlot(slot.id)}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            visitTimeSlot === slot.id
                              ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-[10px] opacity-80 uppercase tracking-wider">{slot.period}</div>
                          <div className="text-xs font-bold mt-0.5">{slot.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Datos de Contacto */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-slate-800">Datos para la Coordinación:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono / WhatsApp (+56 9...)"
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Correo electrónico para recordatorio"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <textarea
                      rows={2}
                      placeholder="Pregunta o solicitud especial para el anfitrión (opcional)"
                      value={visitNotes}
                      onChange={(e) => setVisitNotes(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      {loading ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          <span>Agendando Visita...</span>
                        </>
                      ) : (
                        <>
                          <CalendarCheck className="w-4 h-4" />
                          <span>Confirmar Solicitud de Visita Gratuita</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
