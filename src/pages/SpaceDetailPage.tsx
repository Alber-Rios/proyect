import React, { useState, useMemo } from 'react';
import { Space, DigitalContract } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { formatClp, formatRut } from '../utils/formatters.ts';
import { BookingModal } from '../components/BookingModal.tsx';
import { ContractModal } from '../components/ContractModal.tsx';
import {
  MapPin,
  Users,
  Maximize2,
  Clock,
  ShieldCheck,
  Building2,
  Sun,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  FileText,
  CreditCard,
  Building,
  Layers,
  ArrowLeft,
  X,
} from 'lucide-react';

interface SpaceDetailPageProps {
  space: Space | null;
  onNavigate: (view: string) => void;
  onOpenAuth?: (mode: 'login' | 'register', notice?: string) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  office: 'Oficina Privada',
  cowork: 'Coworking',
  event: 'Eventos & Workshops',
  studio: 'Estudio Creativo',
  warehouse: 'Bodega Urbana',
  retail: 'Local Comercial',
};

// Horas de operación por defecto (09:00-18:00)
const DEFAULT_HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9,10,...,18

export const SpaceDetailPage: React.FC<SpaceDetailPageProps> = ({
  space,
  onNavigate,
  onOpenAuth,
}) => {
  const { currentUser, visitRequests, reservations } = useApp();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingModalMode, setBookingModalMode] = useState<'booking' | 'visit'>('booking');
  const [createdContract, setCreatedContract] = useState<DigitalContract | null>(null);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Comprobar si ya existe una visita solicitada para este espacio
  const existingVisit = useMemo(() => {
    return visitRequests.find((v) => v.spaceId === space?.id);
  }, [visitRequests, space?.id]);

  // Reservas confirmadas para ESTE espacio
  const spaceReservations = useMemo(() => {
    if (!space) return [];
    return reservations.filter(
      (r) => r.spaceId === space.id && (r.status === 'confirmed' || r.status === 'completed')
    );
  }, [reservations, space]);

  // Fechas por defecto: mañana y pasado mañana
  const now = new Date();
  const formatIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const tomorrowStr = formatIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const dayAfterStr = formatIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));

  const [startDate, setStartDate] = useState(tomorrowStr);
  const [endDate, setEndDate] = useState(dayAfterStr);

  // Helper: comprobar si una fecha ISO cae dentro del rango de una reserva
  const isDayOccupied = (dateIso: string): boolean => {
    const d = new Date(dateIso + 'T12:00:00');
    return spaceReservations.some((r) => {
      const start = new Date(r.startDate + 'T00:00:00');
      const end = new Date(r.endDate + 'T23:59:59');
      return d >= start && d <= end;
    });
  };

  // Helper: obtener las horas ocupadas de un día concreto
  const getOccupiedHours = (dateIso: string): number[] => {
    if (!isDayOccupied(dateIso)) return [];
    // Si el día está ocupado por una reserva de día completo, todas las horas están ocupadas
    const occupied = spaceReservations.some((r) => {
      const start = new Date(r.startDate + 'T00:00:00');
      const end = new Date(r.endDate + 'T23:59:59');
      const d = new Date(dateIso + 'T12:00:00');
      return d >= start && d <= end && (r.rentalModality !== 'por_hora');
    });
    if (occupied) return [...DEFAULT_HOURS];
    return [];
  };

  // Calendario de 30 días con disponibilidad real
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const iso = formatIso(d);
      const isOccupied = isDayOccupied(iso);
      const occupiedHours = getOccupiedHours(iso);
      days.push({
        iso,
        dayNum: d.getDate(),
        monthShort: d.toLocaleDateString('es-CL', { month: 'short' }),
        weekdayShort: d.toLocaleDateString('es-CL', { weekday: 'short' }),
        isOccupied,
        occupiedHours,
        freeHours: DEFAULT_HOURS.filter((h) => !occupiedHours.includes(h)),
      });
    }
    return days;
  }, [spaceReservations]);

  const calculations = useMemo(() => {
    if (!space) return { days: 1, subtotal: 0, platformFee: 0, deposit: 0, total: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    let days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) days = 1;
    const subtotal = days * space.pricePerDay;
    const platformFee = Math.round(subtotal * 0.05);
    const deposit = space.securityDeposit || Math.round(space.pricePerDay * 0.5);
    const total = subtotal + platformFee + deposit;
    return { days, subtotal, platformFee, deposit, total };
  }, [space, startDate, endDate]);

  if (!space) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <Building className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">Espacio no encontrado</h2>
        <p className="text-xs text-slate-500">
          El espacio que buscas no existe o ha sido pausado por su propietario.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
        </button>
      </div>
    );
  }

  const imagesList = space.images && space.images.length > 0
    ? space.images
    : ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'];

  const handleStartBooking = () => {
    setBookingModalMode('booking');
    setIsBookingModalOpen(true);
  };

  const handleStartVisit = () => {
    setBookingModalMode('visit');
    setIsBookingModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Botón Volver y Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Volver al Catálogo
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {CATEGORY_NAMES[space.category] || space.category}
          </span>
          {space.spaceEnvironment === 'abierto' ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> Al Aire Libre
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Techado Interior
            </span>
          )}
        </div>
      </div>

      {/* Título Principal y Ubicación */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {space.title}
        </h1>
        <p className="text-slate-600 text-sm flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
          <strong className="text-slate-800">{space.address}</strong>, {space.commune}, {space.region}
        </p>
      </div>

      {/* Galería de Fotografías */}
      <div className="space-y-3">
        <div className="relative aspect-16/9 sm:aspect-21/9 rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 shadow-lg">
          <img
            src={imagesList[activeImageIndex]}
            alt={space.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold shadow-md border border-white/10">
            Fotografía {activeImageIndex + 1} de {imagesList.length}
          </div>
        </div>

        {imagesList.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {imagesList.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-28 h-18 rounded-2xl overflow-hidden shrink-0 border-2 transition shadow-xs ${
                  activeImageIndex === idx
                    ? 'border-rose-600 ring-2 ring-rose-300 scale-102'
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Estructura Principal: Contenido a la izquierda, Sidebar de Reserva a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda (Detalles completos) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Ficha Rápida: Aforo, Superficie, Modalidad y Anfitrión */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400">Tarifa por Día</span>
              <div className="text-xl font-extrabold text-rose-600">
                {formatClp(space.pricePerDay)}
                <span className="text-xs font-normal text-slate-500"> /día</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400">Capacidad Máxima</span>
              <div className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                {space.capacity} personas
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400">Superficie Total</span>
              <div className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-slate-400" />
                {space.surfaceM2} m²
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-400">Horario de Operación</span>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                {space.openingHours || '08:30 - 20:30'}
              </div>
            </div>
          </div>

          {/* Descripción del Inmueble */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-600" />
              Descripción del Inmueble
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {space.description}
            </p>
          </div>

          {/* Amenidades e Instalaciones */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Lo que ofrece este espacio (Amenidades e Instalaciones)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {space.amenities.map((amenity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Normas y Regulaciones del Recinto */}
          {space.rules && space.rules.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Reglas y Condiciones del Recinto (Ley 18.101)
              </h2>
              <ul className="space-y-2.5 bg-rose-50/50 p-4 rounded-2xl border border-rose-100 text-xs text-slate-700">
                {space.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Calendario de Disponibilidad */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-rose-600" />
                <span>Disponibilidad en Tiempo Real</span>
                <span className="ml-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 text-xs font-black rounded-lg border border-rose-200 capitalize">
                  {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-medium text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Disponible
                </span>
                <span className="flex items-center gap-1 font-medium text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Ocupado
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {calendarDays.map((day) => (
                <button
                  type="button"
                  key={day.iso}
                  onClick={() => setSelectedCalendarDay(selectedCalendarDay === day.iso ? null : day.iso)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between cursor-pointer hover:scale-[1.03] ${
                    day.isOccupied
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  } ${selectedCalendarDay === day.iso ? 'ring-2 ring-indigo-400 shadow-md' : ''}`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500">{day.weekdayShort}</span>
                  <span className="text-base font-extrabold my-0.5">{day.dayNum}</span>
                  <span className="text-[10px] text-slate-500">{day.monthShort}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md mt-1 ${
                    day.isOccupied ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {day.isOccupied
                      ? day.freeHours.length > 0
                        ? `${day.freeHours.length}h libres`
                        : 'Ocupado'
                      : 'Libre'}
                  </span>
                </button>
              ))}
            </div>

            {/* Panel de horas detallado al seleccionar un día */}
            {selectedCalendarDay && (() => {
              const dayInfo = calendarDays.find((d) => d.iso === selectedCalendarDay);
              if (!dayInfo) return null;
              return (
                <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-bold text-slate-900">
                        Horario del {dayInfo.dayNum} de {dayInfo.monthShort}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dayInfo.isOccupied ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {dayInfo.freeHours.length} de {DEFAULT_HOURS.length} horas disponibles
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCalendarDay(null)}
                      className="p-1 rounded-lg hover:bg-slate-200 transition text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {DEFAULT_HOURS.map((hour) => {
                      const isOccupied = dayInfo.occupiedHours.includes(hour);
                      return (
                        <div
                          key={hour}
                          className={`p-2 rounded-xl text-center text-xs font-bold transition ${
                            isOccupied
                              ? 'bg-rose-100 border border-rose-200 text-rose-700 line-through opacity-70'
                              : 'bg-emerald-100 border border-emerald-200 text-emerald-800'
                          }`}
                        >
                          {String(hour).padStart(2, '0')}:00
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Hora disponible</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Hora ocupada/reservada</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Ficha del Propietario */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-rose-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {space.ownerName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{space.ownerName}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Anfitrión Verificado
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  RUT: {formatRut(space.ownerRut)} • Respaldado bajo normativa legal chilena
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (Sidebar de Reserva y Precios) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-5">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Tarifa Diaria</span>
              <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                {formatClp(space.pricePerDay)}
                <span className="text-sm font-normal text-slate-500"> /día</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleStartBooking}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Reservar Espacio (Contrato y Pago)</span>
              </button>

              {existingVisit ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Visita Agendada</span>
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {existingVisit.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Fecha: <strong>{existingVisit.visitDate}</strong> ({existingVisit.visitTimeSlot}) • Modalidad:{' '}
                    <strong>{existingVisit.modality === 'presencial' ? 'Presencial' : 'Virtual'}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartVisit}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    Ver / Modificar Solicitud de Visita
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartVisit}
                  className="w-full py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Solicitar Visita Previa (100% Gratuita)</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-700">🔒 Transacciones Protegidas</div>
              <div>Pagos procesados mediante Webpay Plus. Contrato digital suscrito según Ley 18.101.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Reserva formal y pago */}
      <BookingModal
        space={space}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialMode={bookingModalMode}
        onSuccess={(contract) => {
          setCreatedContract(contract);
          setIsContractModalOpen(true);
        }}
        onOpenAuth={onOpenAuth}
      />

      {/* Modal de Contrato Digital */}
      <ContractModal
        contract={createdContract}
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
      />
    </div>
  );
};
