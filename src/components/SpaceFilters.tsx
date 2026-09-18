import React from 'react';
import { SpaceCategory } from '../types.ts';
import { formatClp } from '../utils/formatters.ts';
import {
  Search,
  Filter,
  Building,
  Laptop,
  PartyPopper,
  Camera,
  Warehouse,
  RotateCcw,
  Sun,
  Building2,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';

export type RateFilter = 'all' | 'hour' | 'day' | 'month';

interface SpaceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedEnvironment: 'all' | 'abierto' | 'cerrado';
  onEnvironmentChange: (env: 'all' | 'abierto' | 'cerrado') => void;
  selectedRateModality: RateFilter;
  onRateModalityChange: (rate: RateFilter) => void;
  selectedCommune: string;
  onCommuneChange: (commune: string) => void;
  maxPriceClp: number;
  onMaxPriceChange: (price: number) => void;
  minSurfaceM2: number;
  onMinSurfaceChange: (m2: number) => void;
  onReset: () => void;
}

const CATEGORIES: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'Todos los Espacios', icon: Building },
  { id: 'office', label: 'Oficinas', icon: Building },
  { id: 'cowork', label: 'Coworking', icon: Laptop },
  { id: 'event', label: 'Eventos & Workshops', icon: PartyPopper },
  { id: 'studio', label: 'Estudios Creativos', icon: Camera },
  { id: 'warehouse', label: 'Bodegas Urbanas', icon: Warehouse },
];

const COMMUNES = [
  'Todas las comunas',
  'Las Condes',
  'Providencia',
  'Santiago Centro',
  'Ñuñoa',
  'Vitacura',
  'Lo Barnechea',
  'Macul',
];

export const SpaceFilters: React.FC<SpaceFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedEnvironment,
  onEnvironmentChange,
  selectedRateModality,
  onRateModalityChange,
  selectedCommune,
  onCommuneChange,
  minSurfaceM2,
  onMinSurfaceChange,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
      {/* Barra de Búsqueda y Selector de Comuna */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Input de texto */}
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-space-input"
            type="text"
            placeholder="Buscar por nombre, dirección o amenidad (ej. Fibra, Terraza)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition"
          />
        </div>

        {/* Selector de Comuna */}
        <div className="sm:col-span-5">
          <select
            id="select-commune-filter"
            value={selectedCommune}
            onChange={(e) => onCommuneChange(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition"
          >
            {COMMUNES.map((commune) => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FILTROS DE MODALIDAD DE ARRIENDO: POR HORA / POR DÍA / POR MES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-rose-500" />
          Modalidad de Tarifa:
        </span>
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todas las Tarifas' },
            { id: 'hour', label: 'Por Hora' },
            { id: 'day', label: 'Por Día' },
            { id: 'month', label: 'Por Mes' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                const newMod = item.id as RateFilter;
                onRateModalityChange(newMod);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial text-center ${
                selectedRateModality === item.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controles de Rango: Superficie Mínima (m²) */}
      <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
        {/* Superficie Mínima (m2) */}
        <div className="flex flex-col justify-center px-2">
          <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span className="font-medium text-slate-700">Superficie Mínima (m²):</span>
            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {minSurfaceM2} m²
            </span>
          </div>
          <input
            id="surface-range-slider"
            type="range"
            min="10"
            max="500"
            step="10"
            value={minSurfaceM2}
            onChange={(e) => onMinSurfaceChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>
      </div>

      {/* Selector de Categoría por Entorno: ABIERTO vs CERRADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Entorno:
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              id="filter-env-all"
              type="button"
              onClick={() => onEnvironmentChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedEnvironment === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Todos</span>
            </button>
            <button
              id="filter-env-abierto"
              type="button"
              onClick={() => onEnvironmentChange('abierto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedEnvironment === 'abierto'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>☀️ Abierto (Aire Libre)</span>
            </button>
            <button
              id="filter-env-cerrado"
              type="button"
              onClick={() => onEnvironmentChange('cerrado')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedEnvironment === 'cerrado'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>🏢 Cerrado (Techado)</span>
            </button>
          </div>
        </div>

        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-700 font-medium flex items-center gap-1 transition px-2 py-1 self-end sm:self-auto"
        >
          <RotateCcw className="w-3 h-3" />
          Restablecer Filtros
        </button>
      </div>

      {/* Chips de Categorías de Inmuebles */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full pt-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
