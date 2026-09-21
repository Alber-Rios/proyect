import React from 'react';
import { Calendar as CalendarIcon, Clock, Check, Building2, Sparkles, X } from 'lucide-react';
import { formatClp, getTodayIso } from '../utils/formatters.ts';

interface SpaceAvailabilityViewerProps {
  modality: 'por_hora' | 'por_dia' | 'mensual';
  startDate: string;
  endDate: string;
  onSelectDateRange: (start: string, end: string) => void;
  selectedMonth: string; // e.g. '2026-10'
  onSelectMonth: (month: string) => void;
  selectedHourStart: number;
  selectedHourEnd: number;
  onSelectHours: (start: number, end: number) => void;
}

export const SpaceAvailabilityViewer: React.FC<SpaceAvailabilityViewerProps> = ({
  modality,
  startDate,
  endDate,
  onSelectDateRange,
  selectedMonth,
  onSelectMonth,
  selectedHourStart,
  selectedHourEnd,
  onSelectHours,
}) => {
  // Generar días para vista por día (14 días en strip interactivo a partir de hoy)
  const todayIso = getTodayIso();
  const baseDate = new Date();
  const daysList = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + i);
    const dayNum = d.getDate();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const weekday = d.toLocaleDateString('es-CL', { weekday: 'short' });
    const isOccupied = dayNum === 24 || dayNum === 27;
    const isPast = iso < todayIso;
    const isCheckIn = iso === startDate;
    const isCheckOut = iso === endDate;
    const isSelected = iso >= startDate && iso <= endDate;

    return {
      iso,
      dayNum,
      weekday,
      monthShort: 'sept',
      isOccupied,
      isPast,
      isCheckIn,
      isCheckOut,
      isSelected,
    };
  });

  // Meses para vista mensual (Residencia 2026 - 2027)
  const monthsList = [
    { id: '2026-09', label: 'Septiembre', year: '2026', range: '01/09 al 30/09', status: 'Reservado', isReserved: true },
    { id: '2026-10', label: 'Octubre', year: '2026', range: '01/10 al 31/03', status: 'Tu Selección', isSelected: selectedMonth === '2026-10' },
    { id: '2026-11', label: 'Noviembre', year: '2026', range: '01/11 al 30/11', status: 'Disponible', isSelected: selectedMonth === '2026-11' },
    { id: '2026-12', label: 'Diciembre', year: '2026', range: '01/12 al 31/12', status: 'Disponible', isSelected: selectedMonth === '2026-12' },
    { id: '2027-01', label: 'Enero', year: '2027', range: '01/01 al 31/01', status: 'Disponible', isSelected: selectedMonth === '2027-01' },
    { id: '2027-02', label: 'Febrero', year: '2027', range: '01/02 al 28/02', status: 'Disponible', isSelected: selectedMonth === '2027-02' },
  ];

  // Horas para vista por hora (09:00 a 21:00)
  const hoursList = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9; // 9, 10, 11, ... 20
    const nextHour = hour + 1;
    const isOccupied = hour === 16 || hour === 17;
    const isSelected = hour >= selectedHourStart && hour < selectedHourEnd;
    const isCheckIn = hour === selectedHourStart;
    const isCheckOut = hour === selectedHourEnd - 1;

    return {
      hour,
      nextHour,
      label: `${String(hour).padStart(2, '0')}-${String(nextHour).padStart(2, '0')}h`,
      isOccupied,
      isSelected,
      isCheckIn,
      isCheckOut,
    };
  });

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
      {/* 1. MODO POR DÍA */}
      {modality === 'por_dia' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-rose-600" />
              <span>Disponibilidad en Tiempo Real</span>
              <span className="text-xs font-semibold text-slate-500">• Septiembre de 2026</span>
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Disponible
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Ocupado
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]"></span> Tu Selección
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {daysList.map((day) => {
              const isSelected = day.isSelected;
              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => {
                    if (day.isOccupied || day.isPast) return;
                    if (day.iso === startDate) {
                      // Ya es start
                    } else if (day.iso < startDate) {
                      onSelectDateRange(day.iso, endDate);
                    } else {
                      onSelectDateRange(startDate, day.iso);
                    }
                  }}
                  disabled={day.isOccupied || day.isPast}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between select-none ${
                    day.isPast
                      ? 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-40 cursor-not-allowed'
                      : day.isOccupied
                      ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-md cursor-pointer'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {day.weekday}
                  </span>
                  <span className="text-base sm:text-lg font-extrabold my-0.5">
                    {day.dayNum}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    day.isOccupied
                      ? 'bg-rose-100 text-rose-700'
                      : isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {day.isOccupied
                      ? 'Ocupado'
                      : day.isCheckIn
                      ? 'Check-in'
                      : day.isCheckOut
                      ? 'Check-out'
                      : 'Libre'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MODO MENSUAL (RESIDENCIA) */}
      {modality === 'mensual' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Disponibilidad por Meses (Residencia 2026 – 2027)</span>
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Disponible
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Reservado
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]"></span> Tu Selección
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            {monthsList.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (!m.isReserved) onSelectMonth(m.id);
                }}
                disabled={m.isReserved}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-between cursor-pointer ${
                  m.isReserved
                    ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                    : m.isSelected
                    ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${m.isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {m.year}
                </span>
                <span className="text-sm font-extrabold my-1">
                  {m.label}
                </span>
                <span className={`text-[10px] font-medium mb-1.5 ${m.isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {m.range}
                </span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                  m.isReserved
                    ? 'bg-rose-100 text-rose-700'
                    : m.isSelected
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {m.isReserved ? 'Reservado' : m.isSelected ? 'Tu Selección' : 'Disponible'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. MODO POR HORA */}
      {modality === 'por_hora' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-600" />
                <span>Disponibilidad Horaria en Tiempo Real</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Horario de operación: 09:00 a 21:00 hrs. Selecciona los tramos de tu reserva (mínimo 2 horas consecutivas).
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Hora Libre
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Reservada
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e293b]"></span> Tu Bloque ({selectedHourStart}-{selectedHourEnd}h)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {hoursList.map((h) => {
              const isSelected = h.isSelected;
              return (
                <button
                  key={h.hour}
                  type="button"
                  onClick={() => {
                    if (h.isOccupied) return;
                    if (h.hour < selectedHourStart) {
                      onSelectHours(h.hour, selectedHourEnd);
                    } else if (h.hour >= selectedHourEnd) {
                      onSelectHours(selectedHourStart, h.nextHour);
                    } else {
                      // Clicked inside: set start here or adjust
                      onSelectHours(h.hour, Math.max(h.hour + 2, selectedHourEnd));
                    }
                  }}
                  disabled={h.isOccupied}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between cursor-pointer ${
                    h.isOccupied
                      ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold">
                    {h.label}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 ${
                    h.isOccupied
                      ? 'bg-rose-100 text-rose-700'
                      : isSelected
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {h.isOccupied
                      ? 'Ocupado'
                      : h.isCheckIn
                      ? 'Check-in'
                      : h.isCheckOut
                      ? 'Check-out'
                      : 'Libre'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
