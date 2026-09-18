import React, { useState, useMemo } from 'react';
import { Space, Reservation, SpaceCategory, SpaceEnvironment, DigitalContract, VisitRequest } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { formatClp, formatRut, getSpaceRateInfo } from '../utils/formatters.ts';
import { ContractModal } from '../components/ContractModal.tsx';
import { RentalModalitySelector } from '../components/RentalModalitySelector.tsx';
import {
  Building,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Banknote,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Sparkles,
  MapPin,
  Users,
  ShieldCheck,
  Eye,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sun,
  Umbrella,
  Check,
  Layers,
  Camera,
  Pencil,
} from 'lucide-react';

interface OwnerDashboardPageProps {
  onOpenOwnerUpgrade: () => void;
  onOpenAuth?: (mode: 'login' | 'register', notice?: string) => void;
}

const CHILEAN_COMMUNES = [
  'Las Condes',
  'Providencia',
  'Santiago Centro',
  'Ñuñoa',
  'Vitacura',
  'Lo Barnechea',
  'Macul',
];

const POPULAR_AMENITIES = [
  'Wifi Fibra Óptica 1Gbps',
  'Aire Acondicionado / Climatización',
  'Calefacción Central',
  'Seguridad y Cámaras 24/7',
  'Proyector 4K & Telón',
  'Pizarra Acrílica',
  'Estacionamiento Clientes',
  'Recepción y Conserjería',
  'Cocina / Cafetería Equipada',
  'Acceso Universal / Rampas',
  'Ascensor de Alta Velocidad',
  'Grupo Electrógeno',
];

const POPULAR_RULES = [
  'Prohibido fumar en recintos cerrados (Ley 20.660)',
  'Música moderada / Sin ruidos molestos post 22:00',
  'Entregar el espacio aseado y ordenado',
  'Mascotas permitidas (Pet Friendly)',
  'Catering y banquetería externa permitida',
  'Capacidad máxima estrictamente respetada',
];

// Presets removidos por solicitud del usuario

export const OwnerDashboardPage: React.FC<OwnerDashboardPageProps> = ({ onOpenOwnerUpgrade, onOpenAuth }) => {
  const {
    currentUser,
    spaces,
    reservations,
    contracts,
    createSpace,
    updateSpace,
    deleteSpace,
    updateReservationStatus,
    visitRequests,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'spaces' | 'bookings' | 'finances' | 'calendar' | 'visits'>('spaces');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);

  // Formulario para nuevo espacio
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<SpaceCategory>('office');
  const [newEnvironment, setNewEnvironment] = useState<SpaceEnvironment>('cerrado');
  const [newRentalModality, setNewRentalModality] = useState<'por_hora' | 'por_dia' | 'mensual' | 'abierto'>('abierto');
  
  // Estados de modalidades y tarifas tipo interruptor
  const [enableHourly, setEnableHourly] = useState(true);
  const [hourlyPrice, setHourlyPrice] = useState<number | ''>(45000);
  const [hourlyMinHours, setHourlyMinHours] = useState(2);
  const [hourlyInstantBooking, setHourlyInstantBooking] = useState(true);

  const [enableDaily, setEnableDaily] = useState(true);
  const [dailyPrice, setDailyPrice] = useState<number | ''>(280000);
  const [dailyOpeningHours, setDailyOpeningHours] = useState('09:00 - 19:00');

  const [enableMonthly, setEnableMonthly] = useState(true);
  const [monthlyPrice, setMonthlyPrice] = useState<number | ''>(3800000);

  const computedRentalModality = useMemo<'abierto' | 'por_hora' | 'por_dia' | 'mensual'>(() => {
    const activeCount = (enableHourly ? 1 : 0) + (enableDaily ? 1 : 0) + (enableMonthly ? 1 : 0);
    if (activeCount > 1) return 'abierto';
    if (enableHourly) return 'por_hora';
    if (enableMonthly) return 'mensual';
    return 'por_dia';
  }, [enableHourly, enableDaily, enableMonthly]);

  const [newCommune, setNewCommune] = useState('Las Condes');
  const [newAddress, setNewAddress] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>(0);
  const [newCapacity, setNewCapacity] = useState<number | ''>(0);
  const [newSurfaceM2, setNewSurfaceM2] = useState<number | ''>(0);
  const [newSecurityDeposit, setNewSecurityDeposit] = useState<number | ''>(0);
  const [newMinBookingDays, setNewMinBookingDays] = useState<number | ''>(1);
  const [newOpeningHours, setNewOpeningHours] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);

  // CASO 1: Usuario No Registrado / No Autenticado
  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-rose-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-md">
            <Building className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Panel de Anfitriones y Propietarios
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Publica y administra tus inmuebles en Chile
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Rentabiliza tus oficinas, salas de conferencia, plantas libres o recintos comerciales en pesos chilenos (CLP) con contratos digitales regulados por la Ley N° 18.101.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth?.('login', 'Inicia sesión como Propietario para administrar tus recintos.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => onOpenAuth?.('register', 'Regístrate con rol de Propietario para comenzar a publicar.')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Registrarme como Propietario
            </button>
          </div>
        </div>
      </div>
    );
  }

  // REGLA CRÍTICA DE ACCESO: Si es arrendatario sin términos aceptados, no puede ver el panel de propietario
  if (currentUser.role === 'tenant' && !currentUser.ownerTermsAccepted) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Acceso Restringido • Perfil de Arrendatario
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              No tienes habilitado el perfil de Propietario
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              En Spotly, los usuarios con rol de Arrendatario solo tienen acceso a buscar y agendar espacios. Para publicar recintos, gestionar disponibilidad y recibir ingresos en CLP, debes suscribir el Acuerdo de Adhesión para Anfitriones conforme a la Ley 18.101.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenOwnerUpgrade}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Aceptar Términos y Convertirme en Propietario
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Espacios que pertenecen a este propietario
  const mySpaces = useMemo(() => {
    return spaces.filter((s) => s.ownerId === currentUser.id);
  }, [spaces, currentUser.id]);

  // Reservas recibidas para las propiedades de este propietario
  const myReceivedBookings = useMemo(() => {
    return reservations.filter((r) => r.ownerId === currentUser.id);
  }, [reservations, currentUser.id]);

  // Métricas financieras del propietario
  const financialMetrics = useMemo(() => {
    let grossIncome = 0;
    let platformFeesPaid = 0;
    let depositsHeld = 0;
    let confirmedCount = 0;

    myReceivedBookings.forEach((b) => {
      if (b.status === 'confirmed' || b.status === 'completed') {
        grossIncome += b.subtotalClp;
        platformFeesPaid += b.platformFeeClp;
        depositsHeld += b.securityDepositClp;
        confirmedCount++;
      }
    });

    const netPayout = grossIncome - platformFeesPaid;
    return { grossIncome, platformFeesPaid, depositsHeld, netPayout, confirmedCount };
  }, [myReceivedBookings]);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setNewImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Funciones de carga rápida y URL personalizadas eliminadas por solicitud del usuario

  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleToggleRule = (rule: string) => {
    setSelectedRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]
    );
  };

  const handleStartEdit = (space: Space) => {
    setEditingSpace(space);
    setNewTitle(space.title);
    setNewDescription(space.description);
    setNewCategory(space.category);
    setNewEnvironment(space.spaceEnvironment || 'cerrado');
    const mod = space.rentalModality || (space.priceUnit === 'hour' ? 'por_hora' : space.priceUnit === 'month' ? 'mensual' : 'por_dia');
    setNewRentalModality(mod);
    setNewCommune(space.commune);
    setNewAddress(space.address);

    if (mod === 'abierto') {
      setEnableHourly(Boolean(space.pricePerHour));
      setEnableDaily(Boolean(space.pricePerDay));
      setEnableMonthly(Boolean(space.pricePerMonth));
      if (!space.pricePerHour && !space.pricePerDay && !space.pricePerMonth) {
        setEnableHourly(true);
        setEnableDaily(true);
        setEnableMonthly(true);
      }
    } else if (mod === 'por_hora') {
      setEnableHourly(true);
      setEnableDaily(false);
      setEnableMonthly(false);
    } else if (mod === 'mensual') {
      setEnableHourly(false);
      setEnableDaily(false);
      setEnableMonthly(true);
    } else {
      setEnableHourly(false);
      setEnableDaily(true);
      setEnableMonthly(false);
    }

    setHourlyPrice(space.pricePerHour || (space.pricePerDay ? Math.round(space.pricePerDay / 8) : 45000));
    setHourlyMinHours(space.minBookingHours || 2);
    setHourlyInstantBooking(space.instantBooking ?? true);

    setDailyPrice(space.pricePerDay || 280000);
    setDailyOpeningHours(space.openingHours || '09:00 - 19:00');

    setMonthlyPrice(space.pricePerMonth || (space.pricePerDay ? space.pricePerDay * 22 : 3800000));
    setNewSecurityDeposit(space.securityDeposit ?? 0);

    const effectivePrice = mod === 'por_hora' 
      ? (space.pricePerHour || Math.round(space.pricePerDay / 8))
      : mod === 'mensual'
      ? (space.pricePerMonth || space.pricePerDay)
      : space.pricePerDay;
    setNewPrice(effectivePrice);
    setNewCapacity(space.capacity);
    setNewSurfaceM2(space.surfaceM2);
    setNewMinBookingDays(space.minBookingDays || 1);
    setNewOpeningHours(space.openingHours || '');
    setSelectedAmenities(space.amenities || []);
    setSelectedRules(space.rules || []);
    setNewImages(space.images || []);
    setIsPublishModalOpen(true);
  };

  const resetForm = () => {
    setEditingSpace(null);
    setNewTitle('');
    setNewDescription('');
    setNewAddress('');
    setEnableHourly(true);
    setEnableDaily(true);
    setEnableMonthly(true);
    setHourlyPrice(45000);
    setHourlyMinHours(2);
    setHourlyInstantBooking(true);
    setDailyPrice(280000);
    setDailyOpeningHours('09:00 - 19:00');
    setMonthlyPrice(3800000);
    setNewSecurityDeposit(0);
    setNewPrice(0);
    setNewCapacity(0);
    setNewSurfaceM2(0);
    setNewMinBookingDays(1);
    setNewOpeningHours('');
    setSelectedAmenities([]);
    setSelectedRules([]);
    setNewImages([]);
  };

  const handlePublishSpace = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser.verificationStatus !== 'verified') {
      alert('Tu cuenta debe estar verificada y aprobada por el administrador para publicar o modificar espacios.');
      return;
    }

    if (!newTitle.trim() || !newAddress.trim()) {
      alert('Por favor completa el título y la dirección del espacio.');
      return;
    }

    if (newImages.length === 0) {
      alert('Por favor añade al menos una fotografía del espacio.');
      return;
    }

    const hourPrice = enableHourly ? (Number(hourlyPrice) || 35000) : undefined;
    const dayPrice = enableDaily 
      ? (Number(dailyPrice) || 280000) 
      : enableHourly 
      ? Math.round(Number(hourlyPrice) * 8) 
      : Math.round(Number(monthlyPrice) / 30) || 280000;
    const monthPrice = enableMonthly ? (Number(monthlyPrice) || 3800000) : undefined;
    const unit = computedRentalModality === 'por_hora' ? 'hour' : computedRentalModality === 'mensual' ? 'month' : 'day';

    if (editingSpace) {
      updateSpace(editingSpace.id, {
        title: newTitle,
        description: newDescription,
        category: newCategory,
        spaceEnvironment: newEnvironment,
        rentalModality: computedRentalModality,
        priceUnit: unit,
        commune: newCommune,
        address: newAddress,
        pricePerDay: dayPrice,
        pricePerHour: hourPrice,
        pricePerMonth: monthPrice,
        capacity: Number(newCapacity),
        surfaceM2: Number(newSurfaceM2),
        amenities: selectedAmenities,
        rules: selectedRules,
        openingHours: dailyOpeningHours || newOpeningHours || '09:00 - 19:00',
        securityDeposit: Number(newSecurityDeposit),
        images: newImages,
        minBookingDays: Number(newMinBookingDays),
        minBookingHours: hourlyMinHours,
        instantBooking: hourlyInstantBooking,
      });

      alert('¡Espacio modificado y actualizado exitosamente!');
    } else {
      createSpace({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        spaceEnvironment: newEnvironment,
        rentalModality: computedRentalModality,
        priceUnit: unit,
        commune: newCommune,
        region: 'Región Metropolitana',
        address: newAddress,
        pricePerDay: dayPrice,
        pricePerHour: hourPrice,
        pricePerMonth: monthPrice,
        capacity: Number(newCapacity),
        surfaceM2: Number(newSurfaceM2),
        amenities: selectedAmenities,
        rules: selectedRules,
        openingHours: dailyOpeningHours || newOpeningHours || '09:00 - 19:00',
        securityDeposit: Number(newSecurityDeposit),
        images: newImages,
        isVerified: true,
        status: 'pending_approval',
        minBookingDays: Number(newMinBookingDays),
        minBookingHours: hourlyMinHours,
        instantBooking: hourlyInstantBooking,
      });

      alert('¡Publicación enviada exitosamente! Tu espacio ha ingresado a moderación y será visible en el catálogo una vez aprobado por el administrador.');
    }

    resetForm();
    setIsPublishModalOpen(false);
  };

  const handleViewContract = (contractId?: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      setSelectedContract(contract);
    } else {
      alert('Contrato digital no encontrado para esta reserva.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Encabezado del Panel de Propietario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
              currentUser.verificationStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              <Building className="w-3.5 h-3.5" />
              {currentUser.verificationStatus === 'verified' ? 'Anfitrión Verificado' : 'Verificación Pendiente'}
            </span>
            <span className="text-xs text-slate-400">RUT: {formatRut(currentUser.rut)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Panel de Control de Propietario
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestiona tus espacios en Chile, aprueba solicitudes de arriendo y revisa la recaudación en CLP.
          </p>
        </div>

        <button
          id="owner-publish-space-btn"
          onClick={() => {
            if (currentUser.verificationStatus !== 'verified') {
              alert('Debes completar la verificación de identidad y contar con la aprobación del Administrador antes de publicar espacios.');
              return;
            }
            setIsPublishModalOpen(true);
          }}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            currentUser.verificationStatus === 'verified'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white hover:shadow'
              : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Publicar Nuevo Espacio
        </button>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Espacios Publicados</span>
            <Building className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{mySpaces.length}</div>
          <p className="text-[11px] text-slate-400">Recintos activos en catálogo</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Solicitudes Pendientes</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {myReceivedBookings.filter((b) => b.status === 'pending').length}
          </div>
          <p className="text-[11px] text-slate-400">Esperando tu aprobación</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Ingreso Neto Acumulado</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatClp(financialMetrics.netPayout)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Liquidaciones en CLP</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Reservas Confirmadas</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{financialMetrics.confirmedCount}</div>
          <p className="text-[11px] text-slate-400">Contratos firmados y activos</p>
        </div>
      </div>

      {/* Pestañas del Dashboard */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('spaces')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'spaces'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          Mis Espacios ({mySpaces.length})
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Solicitudes y Reservas Recibidas ({myReceivedBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('finances')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'finances'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Métricas Financieras
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendario
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'visits'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Visitas Solicitadas ({visitRequests.filter((v) => v.ownerId === currentUser.id).length})
        </button>
      </div>

      {/* Contenido según Pestaña */}
      {activeTab === 'spaces' && (
        <div className="space-y-4">
          {mySpaces.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Building className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Aún no has publicado ningún espacio</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Comienza publicando tu primera oficina, estudio o sala para empezar a recibir solicitudes de clientes en Chile.
              </p>
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="mt-2 px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Publicar Mi Primer Espacio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySpaces.map((space) => (
                <div
                  key={space.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                    <img
                      src={space.images[0]}
                      alt={space.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          space.status === 'active'
                            ? 'bg-emerald-500 text-white'
                            : space.status === 'pending_approval'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-500 text-white'
                        }`}
                      >
                        {space.status === 'active'
                          ? 'Activo'
                          : space.status === 'pending_approval'
                          ? 'En Moderación'
                          : 'Pausado'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{space.commune}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                        {space.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {space.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        {(() => {
                          const rate = getSpaceRateInfo(space);
                          return (
                            <div>
                              <span className="font-extrabold text-slate-900">
                                {formatClp(rate.amount)}
                              </span>
                              <span className="text-slate-400 font-medium"> {rate.unitLabel}</span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(space)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center gap-1 transition"
                          title="Modificar precio, descripción y datos del espacio"
                        >
                          <Pencil className="w-3 h-3 text-slate-600" />
                          <span>Modificar</span>
                        </button>
                        <button
                          onClick={() =>
                            updateSpace(space.id, {
                              status: space.status === 'active' ? 'paused' : 'active',
                            })
                          }
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[11px]"
                        >
                          {space.status === 'active' ? 'Pausar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este espacio?')) deleteSpace(space.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Eliminar Espacio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña: Solicitudes y Reservas Recibidas */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Solicitudes Recibidas de Arrendatarios
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Revisa los antecedentes del cliente, las fechas solicitadas y el contrato digital generado.
            </p>
          </div>

          {myReceivedBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No has recibido solicitudes de reserva aún.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myReceivedBookings.map((res) => (
                <div key={res.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">#{res.id.slice(-6)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          res.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : res.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {res.status === 'confirmed'
                          ? 'Aceptada / Confirmada'
                          : res.status === 'pending'
                          ? 'Esperando tu Respuesta'
                          : 'Rechazada'}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900">{res.spaceTitle}</div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Cliente: <strong className="text-slate-800">{res.tenantName}</strong></span>
                      <span>RUT: <strong className="text-slate-800">{formatRut(res.tenantRut)}</strong></span>
                      <span>Fechas: <strong>{res.startDate}</strong> al <strong>{res.endDate}</strong> ({res.totalDays} {res.totalDays === 1 ? 'día' : 'días'})</span>
                      <span>Subtotal Propietario: <strong className="text-emerald-700">{formatClp(res.subtotalClp)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Botón para ver el contrato legal digital firmado */}
                    {res.digitalContractId && (
                      <button
                        onClick={() => handleViewContract(res.digitalContractId)}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Ver Contrato Firmado
                      </button>
                    )}

                    {res.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReservationStatus(res.id, 'confirmed')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aceptar Arriendo
                        </button>
                        <button
                          onClick={() => updateReservationStatus(res.id, 'rejected')}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña: Métricas Financieras */}
      {activeTab === 'finances' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">
              Desglose de Ingresos y Liquidaciones (CLP)
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-600">Total Facturación Bruta Arriendos</span>
                <span className="text-sm font-bold text-slate-900">{formatClp(financialMetrics.grossIncome)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-600">Comisión Spotly retenida (5%)</span>
                <span className="text-sm font-bold text-rose-600">-{formatClp(financialMetrics.platformFeesPaid)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-slate-600">Garantías de Arrendatarios en Custodia</span>
                <span className="text-sm font-bold text-indigo-600">{formatClp(financialMetrics.depositsHeld)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Monto Neto a Transferir a Cuenta Bancaria</span>
                  <span className="text-[11px] text-emerald-700">Liquidación automática vía transferencia interbancaria chilena</span>
                </div>
                <span className="text-xl font-extrabold text-emerald-700">{formatClp(financialMetrics.netPayout)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Régimen Tributario & Cumplimiento</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              De acuerdo con la Circular N° 37 del SII y la Ley 18.101, los arriendos de inmuebles amoblados o con instalaciones que permitan el ejercicio de una actividad comercial están afectos al Impuesto al Valor Agregado (IVA - 19%).
            </p>
            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-700">
              <div className="font-bold text-slate-900">Emisión de Boleta/Factura:</div>
              <div>RUT Emisor: {formatRut(currentUser.rut)}</div>
              <div>Mandato de Cobro: Spotly SpA (77.892.310-4)</div>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña: Calendario */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Disponibilidad de Recintos</h3>
              <p className="text-xs text-slate-500">Bloquea fechas por mantención o visualiza reservas programadas.</p>
            </div>
            <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl capitalize">
              {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 pt-2">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => {
              const day = i + 1;
              const hasBooking = day >= 20 && day <= 22;
              return (
                <div
                  key={day}
                  className={`p-3 rounded-xl border text-center transition ${
                    hasBooking
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-xs block">{day}</span>
                  {hasBooking ? (
                    <span className="text-[9px] block text-rose-600 mt-1 truncate">Ocupado</span>
                  ) : (
                    <span className="text-[9px] block text-slate-400 mt-1">Disponible</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pestaña: Visitas Solicitadas */}
      {activeTab === 'visits' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Solicitudes de Visita Recibidas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personas interesadas que desean conocer tus espacios presencialmente o de forma virtual antes de arrendar.
            </p>
          </div>

          {(() => {
            const myVisits = visitRequests.filter((v) => v.ownerId === currentUser.id);
            if (myVisits.length === 0) {
              return (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <MapPin className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  No has recibido solicitudes de visita aún. Cuando un cliente solicite visitar uno de tus espacios, aparecerá aquí.
                </div>
              );
            }
            return (
              <div className="divide-y divide-slate-100">
                {myVisits.map((visit) => (
                  <div key={visit.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-start gap-4">
                      {visit.spaceImage && (
                        <img
                          src={visit.spaceImage}
                          alt={visit.spaceTitle}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                        />
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">#{visit.id.slice(-6)}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              visit.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : visit.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : visit.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {visit.status === 'confirmed'
                              ? 'Confirmada'
                              : visit.status === 'pending'
                              ? 'Pendiente'
                              : visit.status === 'cancelled'
                              ? 'Cancelada'
                              : 'Completada'}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-900">{visit.spaceTitle}</div>
                        <div className="text-xs text-slate-500">{visit.spaceAddress}</div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Visitante: <strong className="text-slate-800">{visit.tenantName}</strong></span>
                          <span>Email: <strong className="text-slate-800">{visit.tenantEmail}</strong></span>
                          <span>Teléfono: <strong className="text-slate-800">{visit.tenantPhone}</strong></span>
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Fecha: <strong>{visit.visitDate}</strong></span>
                          <span>Horario: <strong>{visit.visitTimeSlot}</strong></span>
                          <span>Modalidad: <strong>{visit.modality === 'presencial' ? '🏢 Presencial' : '💻 Virtual'}</strong></span>
                          <span>Asistentes: <strong>{visit.attendeesCount}</strong></span>
                        </div>

                        {visit.notes && (
                          <div className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-200">
                            <span className="font-bold text-slate-700">Nota del visitante:</span> {visit.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal para Publicar o Modificar Espacio */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-fadeIn my-6">
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={() => {
                  resetForm();
                  setIsPublishModalOpen(false);
                }}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
              >
                ✕
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {editingSpace ? 'Modificación de Inmueble' : 'Alta de Inmuebles en Chile'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Ley N° 18.101</span>
              </div>
              <h2 className="text-xl font-bold">
                {editingSpace ? `Modificar Espacio: ${editingSpace.title}` : 'Publicar Nuevo Espacio en Spotly'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {editingSpace
                  ? 'Actualiza los precios por hora, día o mes, descripción y fotografías de tu espacio.'
                  : 'Configura los datos del recinto, sube fotografías reales, define el entorno y los términos de arriendo.'}
              </p>
            </div>

            <form onSubmit={handlePublishSpace} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* TÍTULO Y AMBIENTE */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Espacio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Planta Libre Corporativa con Terraza en El Golf"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-medium"
                  required
                />
              </div>

              {/* TIPO DE ENTORNO: ABIERTO VS CERRADO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Entorno del Espacio <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewEnvironment('cerrado')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                      newEnvironment === 'cerrado'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-rose-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Building className={`w-5 h-5 flex-shrink-0 mt-0.5 ${newEnvironment === 'cerrado' ? 'text-rose-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>Techado / Cerrado</span>
                        {newEnvironment === 'cerrado' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                      <p className={`text-[11px] mt-0.5 leading-relaxed ${newEnvironment === 'cerrado' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Oficinas privadas, salas de directorio, auditorios, coworking y locales comerciales techados.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEnvironment('abierto')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                      newEnvironment === 'abierto'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Sun className={`w-5 h-5 flex-shrink-0 mt-0.5 ${newEnvironment === 'abierto' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>Al Aire Libre / Abierto</span>
                        {newEnvironment === 'abierto' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <p className={`text-[11px] mt-0.5 leading-relaxed ${newEnvironment === 'abierto' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Terrazas corporativas, azoteas panorámicas (rooftops), patios exteriores y jardines para eventos.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* CATEGORÍA Y COMUNA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SpaceCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-medium"
                  >
                    <option value="office">Oficina Privada</option>
                    <option value="cowork">Coworking</option>
                    <option value="event">Eventos & Workshops</option>
                    <option value="studio">Estudio Creativo</option>
                    <option value="warehouse">Bodega Urbana</option>
                    <option value="retail">Comercial / Retail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Comuna</label>
                  <select
                    value={newCommune}
                    onChange={(e) => setNewCommune(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-medium"
                  >
                    {CHILEAN_COMMUNES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección Exacta</label>
                <input
                  type="text"
                  placeholder="ej. Av. Apoquindo 4500, Oficina 802, Las Condes"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-medium"
                  required
                />
              </div>

              {/* SELECTOR VISUAL DE MODALIDAD (POR HORA, POR DÍA, POR MES, ABIERTO A TODO) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Modalidad de Arriendo y Tarifas
                </label>
                <RentalModalitySelector
                  enableHourly={enableHourly}
                  onEnableHourlyChange={setEnableHourly}
                  hourlyPrice={hourlyPrice}
                  onHourlyPriceChange={setHourlyPrice}
                  hourlyMinHours={hourlyMinHours}
                  onHourlyMinHoursChange={setHourlyMinHours}
                  hourlyInstantBooking={hourlyInstantBooking}
                  onHourlyInstantBookingChange={setHourlyInstantBooking}

                  enableDaily={enableDaily}
                  onEnableDailyChange={setEnableDaily}
                  dailyPrice={dailyPrice}
                  onDailyPriceChange={setDailyPrice}
                  dailyOpeningHours={dailyOpeningHours}
                  onDailyOpeningHoursChange={setDailyOpeningHours}

                  enableMonthly={enableMonthly}
                  onEnableMonthlyChange={setEnableMonthly}
                  monthlyPrice={monthlyPrice}
                  onMonthlyPriceChange={setMonthlyPrice}
                  securityDeposit={newSecurityDeposit}
                  onSecurityDepositChange={setNewSecurityDeposit}

                  computedModality={computedRentalModality}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capacidad Máxima (personas)</label>
                  <input
                    type="number"
                    min="1"
                    value={newCapacity}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0) setNewCapacity(val);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Superficie Total (m²)</label>
                  <input
                    type="number"
                    min="1"
                    value={newSurfaceM2}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 0) setNewSurfaceM2(val);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horario de Operación</label>
                  <input
                    type="text"
                    value={newOpeningHours}
                    onChange={(e) => setNewOpeningHours(e.target.value)}
                    placeholder="Lun-Vie 08:30-20:30"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción Detallada</label>
                <textarea
                  rows={3}
                  placeholder="Describe la conectividad, vistas panorámicas, luz natural, climatización, seguridad..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              {/* SECCIÓN DE CARGA Y GESTIÓN DE IMÁGENES */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-rose-600" />
                      Fotografías del Espacio ({newImages.length})
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Sube fotos reales del espacio desde tu dispositivo.
                    </p>
                  </div>
                </div>

                {/* Subir archivo desde disco */}
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-slate-300 hover:border-rose-500 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 hover:text-rose-600 transition">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Cargar imágenes desde mi equipo</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddFiles}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Previsualización de imágenes añadidas */}
                {newImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {newImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Principal
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AMENIDADES SELECCIONABLES CON UN CLICK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Amenidades e Instalaciones (Haz clic para activar)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_AMENITIES.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => handleToggleAmenity(amenity)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5 text-slate-400" />}
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* REGLAS DEL INMUEBLE SELECCIONABLES */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reglas y Condiciones del Recinto
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_RULES.map((rule) => {
                    const isSelected = selectedRules.includes(rule);
                    return (
                      <button
                        type="button"
                        key={rule}
                        onClick={() => handleToggleRule(rule)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <PlusCircle className="w-3.5 h-3.5 text-slate-400" />}
                        {rule}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsPublishModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  {editingSpace ? (
                    <>
                      <Check className="w-4 h-4" />
                      Guardar Cambios del Espacio
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Publicar Espacio en el Catálogo
                    </>
                  )}
                </button>
              </div>
            </form>
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
