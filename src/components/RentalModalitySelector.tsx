import React from 'react';
import { Clock, Sun, Building2, Check, Sparkles } from 'lucide-react';
import { formatClp } from '../utils/formatters.ts';

export interface RentalModalitySelectorProps {
  enableHourly: boolean;
  onEnableHourlyChange: (val: boolean) => void;
  hourlyPrice: number | '';
  onHourlyPriceChange: (val: number | '') => void;
  hourlyMinHours: number;
  onHourlyMinHoursChange: (val: number) => void;
  hourlyInstantBooking?: boolean;
  onHourlyInstantBookingChange?: (val: boolean) => void;

  enableDaily: boolean;
  onEnableDailyChange: (val: boolean) => void;
  dailyPrice: number | '';
  onDailyPriceChange: (val: number | '') => void;
  dailyOpeningHours: string;
  onDailyOpeningHoursChange: (val: string) => void;

  enableMonthly: boolean;
  onEnableMonthlyChange: (val: boolean) => void;
  monthlyPrice: number | '';
  onMonthlyPriceChange: (val: number | '') => void;
  securityDeposit: number | '';
  onSecurityDepositChange: (val: number | '') => void;

  // Callback when computed modality changes ('abierto' | 'por_hora' | 'por_dia' | 'mensual')
  computedModality: 'abierto' | 'por_hora' | 'por_dia' | 'mensual';
}

export const RentalModalitySelector: React.FC<RentalModalitySelectorProps> = ({
  enableHourly,
  onEnableHourlyChange,
  hourlyPrice,
  onHourlyPriceChange,
  hourlyMinHours,
  onHourlyMinHoursChange,
  hourlyInstantBooking,
  onHourlyInstantBookingChange,

  enableDaily,
  onEnableDailyChange,
  dailyPrice,
  onDailyPriceChange,
  dailyOpeningHours,
  onDailyOpeningHoursChange,

  enableMonthly,
  onEnableMonthlyChange,
  monthlyPrice,
  onMonthlyPriceChange,
  securityDeposit,
  onSecurityDepositChange,

  computedModality,
}) => {
  // Asegurar que al menos una modalidad esté activa
  const handleToggleHourly = () => {
    if (enableHourly && !enableDaily && !enableMonthly) {
      // Es la única activa, no desactivar
      return;
    }
    onEnableHourlyChange(!enableHourly);
  };

  const handleToggleDaily = () => {
    if (enableDaily && !enableHourly && !enableMonthly) {
      return;
    }
    onEnableDailyChange(!enableDaily);
  };

  const handleToggleMonthly = () => {
    if (enableMonthly && !enableHourly && !enableDaily) {
      return;
    }
    onEnableMonthlyChange(!enableMonthly);
  };

  const handleSetAllOpen = () => {
    onEnableHourlyChange(true);
    onEnableDailyChange(true);
    onEnableMonthlyChange(true);
  };

  const isAllOpen = enableHourly && enableDaily && enableMonthly;

  return (
    <div className="space-y-4">
      {/* Barra de estado y selector rápido "Abierto a todo" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Modalidad de Disponibilidad:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isAllOpen || computedModality === 'abierto'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : computedModality === 'por_hora'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : computedModality === 'por_dia'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}
            >
              {isAllOpen || computedModality === 'abierto'
                ? '✨ Abierto a Todo (Hora, Día y Mes)'
                : computedModality === 'por_hora'
                ? '⏱️ Solo Por Hora'
                : computedModality === 'por_dia'
                ? '📅 Solo Por Día'
                : '🏢 Solo Por Mes'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Activa o desactiva con los interruptores si arriendas por hora, día o mes. Puedes habilitar una, varias o todas simultáneamente.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSetAllOpen}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            isAllOpen
              ? 'bg-[#1e293b] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 shadow-2xs'
          }`}
          title="Habilitar arriendo por hora, día y mes en simultáneo"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isAllOpen ? '✓ Abierto a todo' : 'Habilitar todo'}</span>
        </button>
      </div>

      {/* TARJETA 1: POR HORA */}
      <div
        className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-xs space-y-3.5 ${
          enableHourly
            ? 'border-slate-300 ring-1 ring-slate-200/50'
            : 'border-slate-200 opacity-60 bg-slate-50/50'
        }`}
      >
        {/* Cabecera de la tarjeta */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <Clock className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Por Hora</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                  Flexible
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reuniones, talleres, grabaciones ...
              </p>
            </div>
          </div>

          {/* Switch de activación */}
          <button
            type="button"
            role="switch"
            aria-checked={enableHourly}
            onClick={handleToggleHourly}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              enableHourly ? 'bg-[#1e293b]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                enableHourly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Inputs condicionales al estar activo */}
        {enableHourly ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Precio base */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Precio base
                </label>
                <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 focus-within:ring-2 focus-within:ring-[#1e293b] focus-within:bg-white transition">
                  <span className="text-xs font-bold text-slate-900">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    placeholder="45000"
                    value={hourlyPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') onHourlyPriceChange('');
                      else {
                        const num = Number(val);
                        if (num >= 0) onHourlyPriceChange(num);
                      }
                    }}
                    className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-400 font-medium shrink-0">/ hr</span>
                </div>
              </div>

              {/* Mínimo de reserva con stepper */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mínimo de reserva
                </label>
                <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onHourlyMinHoursChange(Math.max(1, hourlyMinHours - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
                  >
                    —
                  </button>
                  <span className="text-xs font-bold text-slate-800">
                    {hourlyMinHours} {hourlyMinHours === 1 ? 'hr' : 'hrs'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onHourlyMinHoursChange(Math.min(24, hourlyMinHours + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            Modalidad por hora desactivada para este espacio.
          </div>
        )}
      </div>

      {/* TARJETA 2: POR DÍA */}
      <div
        className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-xs space-y-3.5 ${
          enableDaily
            ? 'border-slate-300 ring-1 ring-slate-200/50'
            : 'border-slate-200 opacity-60 bg-slate-50/50'
        }`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <Sun className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Por Día</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-600 border border-orange-100">
                  Popular
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Jornada completa (8–10h) o evento del día
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enableDaily}
            onClick={handleToggleDaily}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              enableDaily ? 'bg-[#1e293b]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                enableDaily ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Inputs */}
        {enableDaily ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Precio por día */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Precio por día
              </label>
              <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 focus-within:ring-2 focus-within:ring-[#1e293b] focus-within:bg-white transition">
                <span className="text-xs font-bold text-slate-900">$</span>
                <input
                  type="number"
                  min="1"
                  step="5000"
                  placeholder="280000"
                  value={dailyPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') onDailyPriceChange('');
                    else {
                      const num = Number(val);
                      if (num >= 0) onDailyPriceChange(num);
                    }
                  }}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden"
                />
                <span className="text-xs text-slate-400 font-medium shrink-0">/ día</span>
              </div>
            </div>

            {/* Ventana horaria */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ventana horaria
              </label>
              <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-center">
                <input
                  type="text"
                  placeholder="09:00 - 19:00"
                  value={dailyOpeningHours}
                  onChange={(e) => onDailyOpeningHoursChange(e.target.value)}
                  className="w-full text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            Modalidad por día desactivada para este espacio.
          </div>
        )}
      </div>

      {/* TARJETA 3: POR MES */}
      <div
        className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-xs space-y-3.5 ${
          enableMonthly
            ? 'border-slate-300 ring-1 ring-slate-200/50'
            : 'border-slate-200 opacity-60 bg-slate-50/50'
        }`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
              <Building2 className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">Por Mes</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  Larga estancia
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Puesto fijo, oficina privada o arriendo extendido
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enableMonthly}
            onClick={handleToggleMonthly}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              enableMonthly ? 'bg-[#1e293b]' : 'bg-slate-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                enableMonthly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Inputs */}
        {enableMonthly ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Tarifa mensual */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tarifa mensual
              </label>
              <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 focus-within:ring-2 focus-within:ring-[#1e293b] focus-within:bg-white transition">
                <span className="text-xs font-bold text-slate-900">$</span>
                <input
                  type="number"
                  min="1"
                  step="50000"
                  placeholder="3800000"
                  value={monthlyPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') onMonthlyPriceChange('');
                    else {
                      const num = Number(val);
                      if (num >= 0) onMonthlyPriceChange(num);
                    }
                  }}
                  className="w-full bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden"
                />
                <span className="text-xs text-slate-400 font-medium shrink-0">/ m</span>
              </div>
            </div>

            {/* Fianza / Depósito */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600">
                  Fianza / Depósito
                </label>
                {monthlyPrice && (
                  <button
                    type="button"
                    onClick={() => onSecurityDepositChange(Number(monthlyPrice))}
                    className="text-[10px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
                  >
                    Fijar 1 Mes
                  </button>
                )}
              </div>
              <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2 focus-within:ring-2 focus-within:ring-[#1e293b] focus-within:bg-white transition">
                <span className="text-xs font-bold text-slate-900">$</span>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  placeholder={monthlyPrice ? String(monthlyPrice) : '0'}
                  value={securityDeposit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') onSecurityDepositChange('');
                    else {
                      const num = Number(val);
                      if (num >= 0) onSecurityDepositChange(num);
                    }
                  }}
                  className="w-full text-center text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                  {monthlyPrice && Number(securityDeposit) === Number(monthlyPrice)
                    ? '(1 Mes)'
                    : Number(securityDeposit) === 0
                    ? '(Sin fianza)'
                    : ''}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 italic">
            Modalidad mensual desactivada para este espacio.
          </div>
        )}
      </div>
    </div>
  );
};
