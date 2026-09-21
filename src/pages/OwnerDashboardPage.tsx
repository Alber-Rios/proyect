import React, { useState, useMemo } from 'react';
import { Space, Reservation, SpaceCategory, SpaceEnvironment, DigitalContract, VisitRequest } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';
import { formatClp, formatRut, getSpaceRateInfo, getTodayIso } from '../utils/formatters.ts';
import { ContractModal } from '../components/ContractModal.tsx';
import { RentalModalitySelector } from '../components/RentalModalitySelector.tsx';
import { generateDigitalContract } from '../utils/contractGenerator.ts';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Wrench,
  MessageSquare,
  Phone,
  ExternalLink,
  Filter,
  Info,
  Calendar as CalendarIcon,
  X,
  Lock,
  Building2,
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

  const [activeTab, setActiveTab] = useState<'spaces' | 'bookings' | 'finances' | 'calendar' | 'visits'>('calendar');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [selectedContract, setSelectedContract] = useState<DigitalContract | null>(null);

  // Estados para selector de espacio y calendario interactivo
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('spc-002');
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(2026, 8, 1)); // Septiembre 2026
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [pendingFilter, setPendingFilter] = useState<'all' | 'selected'>('all');
  const [bookingListStatusFilter, setBookingListStatusFilter] = useState<'pending_valid' | 'all' | 'confirmed' | 'past'>('pending_valid');
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceDate, setMaintenanceDate] = useState('2026-09-24');
  const [maintenanceReason, setMaintenanceReason] = useState('Sanitización y Mantenimiento Iluminación DMX');
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<{ id: string; spaceId: string; date: string; reason: string }[]>([
    { id: 'm-1', spaceId: 'spc-002', date: '2026-09-24', reason: 'Sanitización y Mantenimiento Iluminación DMX' }
  ]);
  const [contactModalTenant, setContactModalTenant] = useState<{ name: string; phone: string; email: string; spaceTitle: string } | null>(null);
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: string; dayNumber: number } | null>(null);

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

  // Fecha de referencia actual del sistema
  const todayIso = useMemo(() => getTodayIso(), []);

  // Reservas recibidas para las propiedades de este propietario
  const myReceivedBookings = useMemo(() => {
    return reservations.filter((r) => r.ownerId === currentUser.id);
  }, [reservations, currentUser.id]);

  // Solicitudes pendientes válidas para aprobar (del día actual hacia adelante)
  const pendingValidBookings = useMemo(() => {
    return myReceivedBookings.filter(
      (b) => b.status === 'pending' && b.startDate >= todayIso
    );
  }, [myReceivedBookings, todayIso]);

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

  // Selección de espacio activo para el panel y calendario
  const selectedSpace = useMemo(() => {
    if (mySpaces.length === 0) return null;
    const found = mySpaces.find((s) => s.id === selectedSpaceId);
    return found || mySpaces[0];
  }, [mySpaces, selectedSpaceId]);

  // Visualizador de Contrato Digital Inteligente (encuentra o genera al instante con Ley 18.101 & 19.799)
  const handleViewReservationContract = (reservation: Reservation) => {
    const existing = contracts.find(
      (c) => c.id === reservation.digitalContractId || c.reservationId === reservation.id
    );
    if (existing) {
      setSelectedContract(existing);
      return;
    }

    // Generar contrato digital formal con RUTs, garantías y token hash si no fue creado previamente
    const generated = generateDigitalContract({
      reservationId: reservation.id,
      spaceTitle: reservation.spaceTitle,
      spaceAddress: reservation.spaceAddress,
      tenantName: reservation.tenantName,
      tenantRut: reservation.tenantRut,
      ownerName: reservation.ownerName,
      ownerRut: reservation.ownerRut || currentUser?.rut || '14.258.963-7',
      totalClp: reservation.totalClp,
      guaranteeDepositClp: reservation.securityDepositClp,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      ip: '200.89.68.114',
      priceUnit: reservation.priceUnit || 'day',
      rentalModality: reservation.rentalModality || 'por_dia',
      durationUnits: reservation.durationUnits || reservation.totalDays || 1,
      intendedUse: reservation.intendedUse,
    });
    setSelectedContract(generated);
  };

  const handleViewContract = (contractId?: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      setSelectedContract(contract);
    } else {
      alert('Contrato digital no encontrado para esta reserva.');
    }
  };

  // Cálculo de días del mes para el calendario dinámico
  const calendarGridDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    // En Chile (calendario estándar) la semana empieza en Lunes (0 = Lun, ..., 6 = Dom)
    const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: ({
      dayNumber: number;
      dateString: string;
      isCurrentMonth: boolean;
    } | null)[] = [];

    // Celdas vacías antes del 1er día
    for (let i = 0; i < startingDayIndex; i++) {
      days.push(null);
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      days.push({
        dayNumber: day,
        dateString: `${year}-${mStr}-${dStr}`,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [currentCalendarDate]);

  // Consulta de eventos en una fecha para el recinto seleccionado
  const getDayEventsForSelectedSpace = (dateString: string) => {
    if (!selectedSpace) return { booking: null, visit: null, maintenance: null };

    const booking = myReceivedBookings.find(
      (b) => b.spaceId === selectedSpace.id && b.startDate <= dateString && b.endDate >= dateString
    );
    const visit = visitRequests.find(
      (v) => v.spaceId === selectedSpace.id && v.visitDate === dateString && v.ownerId === currentUser?.id
    );
    const maintenance = maintenanceBlocks.find(
      (m) => m.spaceId === selectedSpace.id && m.date === dateString
    );

    return { booking, visit, maintenance };
  };

  // Leyenda de tarifa dinámica para el recinto seleccionado
  const spaceLegendRate = useMemo(() => {
    if (!selectedSpace) return 'Disponible';
    if (selectedSpace.rentalModality === 'por_hora' || selectedSpace.pricePerHour) {
      const kRate = Math.round((selectedSpace.pricePerHour || 45000) / 1000);
      return `Disponible ($${kRate}k/h)`;
    }
    if (selectedSpace.rentalModality === 'mensual' || selectedSpace.pricePerMonth) {
      const mRate = ((selectedSpace.pricePerMonth || 3800000) / 1000000).toFixed(1);
      return `Disponible ($${mRate}M/mes)`;
    }
    const kRate = Math.round((selectedSpace.pricePerDay || 280000) / 1000);
    return `Disponible ($${kRate}k/día)`;
  }, [selectedSpace]);

  const spaceModalityLabel = useMemo(() => {
    if (!selectedSpace) return 'Modalidad Estándar';
    if (selectedSpace.rentalModality === 'abierto') return 'Modalidad Híbrida: Por Hora & Día';
    if (selectedSpace.rentalModality === 'por_hora') return 'Modalidad: Por Hora';
    if (selectedSpace.rentalModality === 'mensual') return 'Modalidad: Mensual';
    return 'Modalidad: Por Día';
  }, [selectedSpace]);

  const handlePrevMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToCurrentMonth = () => {
    setCurrentCalendarDate(new Date(2026, 8, 1)); // Septiembre 2026 (mes del mockup)
  };

  const handleAddMaintenanceBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace) return;
    if (!maintenanceDate) {
      alert('Por favor selecciona una fecha');
      return;
    }
    const newBlock = {
      id: `m-${Date.now()}`,
      spaceId: selectedSpace.id,
      date: maintenanceDate,
      reason: maintenanceReason || 'Bloqueo por Mantención Programada',
    };
    setMaintenanceBlocks((prev) => [...prev, newBlock]);
    setIsMaintenanceModalOpen(false);
  };

  const handleRemoveMaintenanceBlock = (id: string) => {
    setMaintenanceBlocks((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Encabezado del Panel de Propietario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
              currentUser.verificationStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800'
            }`}>
              <Building className="w-3.5 h-3.5" />
              {currentUser.verificationStatus === 'verified' ? 'Anfitrión Verificado' : 'Verificación Pendiente'}
            </span>
            <span className="text-xs text-slate-500 font-medium">RUT: {formatRut(currentUser.rut)}</span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Pagos Habilitados Webpay / Stripe
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
            Panel de Control de Propietario
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
            Gestiona tus espacios en Chile, aprueba solicitudes de arriendo en tiempo real y supervisa la ocupación y liquidaciones en CLP conforme a Ley 18.101.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('finances')}
            className="px-4 py-2.5 rounded-2xl font-bold text-xs border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Configuración de cuentas bancarias y liquidaciones"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Configuración</span>
          </button>

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
                ? 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow'
                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Publicar Nuevo Espacio
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Rápidas (KPIs estilo imagen de referencia) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Espacios Publicados */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>ESPACIOS PUBLICADOS</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              100% operativos
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{mySpaces.length}</div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {mySpaces.map(s => s.commune).filter((v, i, a) => a.indexOf(v) === i).join(' · ') || 'Providencia · Bellas Artes'}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('spaces')}
              className="text-rose-600 hover:text-rose-700 font-bold text-[11px] flex items-center gap-1"
            >
              <span>Gestionar</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 2: Solicitudes Pendientes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>SOLICITUDES POR APROBAR</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Hoy en adelante
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pendingValidBookings.length}
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              Reservas vigentes listas para revisión
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-rose-600 hover:text-rose-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <span>Revisar Ahora</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 3: Ingreso Neto Mes */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>INGRESO NETO MES (CLP)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ↗ +14.2% vs. Agosto
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatClp(financialMetrics.netPayout || 798000)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Liquidación: 30 Sep en Banco de Chile
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => setActiveTab('finances')}
              className="text-rose-600 hover:text-rose-700 font-bold text-[11px] flex items-center gap-1"
            >
              <span>Ver Detalle</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Card 4: Tasa de Ocupación */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>TASA DE OCUPACIÓN</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              • 4 Activas
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">78%</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ley 18.101 Contratos Digitales
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Al día</span>
          </div>
        </div>
      </div>

      {/* Pestañas del Dashboard */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Calendario y Disponibilidad
        </button>

        <button
          onClick={() => setActiveTab('spaces')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Solicitudes y Reservas ({myReceivedBookings.length})
        </button>

        <button
          onClick={() => setActiveTab('finances')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'finances'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Métricas Financieras
        </button>

        <button
          onClick={() => setActiveTab('visits')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'visits'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Visitas Técnicas ({visitRequests.filter(v => v.ownerId === currentUser.id).length})
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
                          onClick={() => {
                            setSelectedSpaceId(space.id);
                            setActiveTab('calendar');
                          }}
                          className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                          title="Gestionar disponibilidad y solicitudes de este recinto en el calendario"
                        >
                          <Calendar className="w-3 h-3 text-indigo-600" />
                          <span>Ver en Calendario</span>
                        </button>
                        <button
                          onClick={() => handleStartEdit(space)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
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
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[11px] cursor-pointer"
                        >
                          {space.status === 'active' ? 'Pausar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este espacio?')) deleteSpace(space.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Solicitudes Recibidas de Arrendatarios
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aprobación: Hoy ({todayIso}) en adelante
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Revisa los antecedentes del cliente, las fechas solicitadas, el recinto exacto y el contrato digital generado.
              </p>
            </div>

            {/* Selector para filtrar reservas por recinto específico */}
            <div className="flex items-center gap-2">
              <label htmlFor="filter-bookings-space" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                Filtrar por Recinto:
              </label>
              <select
                id="filter-bookings-space"
                value={selectedSpaceId || ''}
                onChange={(e) => setSelectedSpaceId(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="">Todos mis recintos ({mySpaces.length})</option>
                {mySpaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.commune})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barra de filtros de estado: Por Aprobar (Vigentes), Todas, Confirmadas, Expiradas/Pasadas */}
          <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap mr-1">Estado:</span>
            <button
              type="button"
              onClick={() => setBookingListStatusFilter('pending_valid')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                bookingListStatusFilter === 'pending_valid'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              ⚡ Por Aprobar ({pendingValidBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setBookingListStatusFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                bookingListStatusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas ({myReceivedBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setBookingListStatusFilter('confirmed')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                bookingListStatusFilter === 'confirmed'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Confirmadas ({myReceivedBookings.filter((b) => b.status === 'confirmed').length})
            </button>
            <button
              type="button"
              onClick={() => setBookingListStatusFilter('past')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                bookingListStatusFilter === 'past'
                  ? 'bg-slate-700 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Pasadas / Expiradas ({myReceivedBookings.filter((b) => b.startDate < todayIso).length})
            </button>
          </div>

          {(() => {
            let displayedBookings = selectedSpaceId
              ? myReceivedBookings.filter((b) => b.spaceId === selectedSpaceId)
              : myReceivedBookings;

            if (bookingListStatusFilter === 'pending_valid') {
              displayedBookings = displayedBookings.filter(
                (b) => b.status === 'pending' && b.startDate >= todayIso
              );
            } else if (bookingListStatusFilter === 'confirmed') {
              displayedBookings = displayedBookings.filter((b) => b.status === 'confirmed');
            } else if (bookingListStatusFilter === 'past') {
              displayedBookings = displayedBookings.filter((b) => b.startDate < todayIso);
            }

            if (displayedBookings.length === 0) {
              return (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  No hay solicitudes de reserva para el filtro seleccionado.
                </div>
              );
            }

            return (
              <div className="divide-y divide-slate-100">
                {displayedBookings.map((res) => {
                  const isPast = res.startDate < todayIso;
                  const canApprove = res.status === 'pending' && !isPast;

                  return (
                    <div key={res.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-400">#{res.id.slice(-6)}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              res.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.status === 'pending'
                                ? isPast
                                  ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                  : 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {res.status === 'confirmed'
                              ? 'Aceptada / Confirmada'
                              : res.status === 'pending'
                              ? isPast
                                ? 'Expirada (Fecha anterior a hoy)'
                                : 'Esperando tu Respuesta (Vigente)'
                              : 'Rechazada'}
                          </span>

                          {/* Etiqueta explícita del recinto solicitado */}
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Recinto: {res.spaceTitle}</span>
                          </span>

                          {isPast && (
                            <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                              Fecha Pasada
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Cliente: <strong className="text-slate-900">{res.tenantName}</strong></span>
                          <span>RUT: <strong className="text-slate-900">{formatRut(res.tenantRut)}</strong></span>
                          <span>
                            Fechas: <strong>{res.startDate}</strong> al <strong>{res.endDate}</strong> ({res.durationUnits ? `${res.durationUnits} hrs` : `${res.totalDays} días`})
                          </span>
                          <span>Subtotal Propietario: <strong className="text-emerald-700 font-bold">{formatClp(res.subtotalClp)}</strong></span>
                          {res.intendedUse && (
                            <span className="w-full text-slate-500 italic mt-0.5">
                              Uso previsto: "{res.intendedUse}"
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {/* Botón para ver el contrato legal digital siempre accesible */}
                        <button
                          onClick={() => handleViewReservationContract(res)}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                          title="Ver y revisar el contrato legal digital (Ley 18.101 & 19.799)"
                        >
                          <FileText className="w-4 h-4 text-rose-600" />
                          <span>Ver Contrato Digital</span>
                        </button>

                        <button
                          onClick={() => setContactModalTenant({
                            name: res.tenantName,
                            phone: '+56 9 8765 4321',
                            email: res.tenantEmail,
                            spaceTitle: res.spaceTitle,
                          })}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Contactar al arrendatario"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span>Contactar</span>
                        </button>

                        {res.status === 'pending' && (
                          <>
                            {canApprove ? (
                              <button
                                onClick={() => {
                                  if (res.startDate < todayIso) {
                                    alert('Las reservas para aprobar deben ser del día actual hacia adelante.');
                                    return;
                                  }
                                  updateReservationStatus(res.id, 'confirmed');
                                }}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aceptar Arriendo</span>
                              </button>
                            ) : (
                              <span
                                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200 cursor-not-allowed"
                                title="No se puede aprobar una reserva con fecha de inicio anterior al día de hoy"
                              >
                                No Aprobable (Fecha Pasada)
                              </span>
                            )}
                            <button
                              onClick={() => updateReservationStatus(res.id, 'rejected')}
                              className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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

      {/* Pestaña: Calendario y Disponibilidad (Layout idéntico al diseño de referencia) */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Selector de Recinto, Navegación, Calendario Dinámico y Ficha (8 cols en desktop) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
              {/* Fila 1: Selector de Recinto y Modos de Vista */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label htmlFor="owner-space-selector" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Recinto en Gestión:
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {spaceModalityLabel}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      id="owner-space-selector"
                      value={selectedSpace?.id || ''}
                      onChange={(e) => setSelectedSpaceId(e.target.value)}
                      className="text-base sm:text-lg font-bold text-slate-900 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-2 pr-9 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500 transition w-full sm:w-auto"
                    >
                      {mySpaces.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} ({s.commune})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Switcher de Vista: Mes / Semana / Lista */}
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-center">
                  <button
                    onClick={() => setCalendarViewMode('month')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      calendarViewMode === 'month'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('week')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      calendarViewMode === 'week'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      calendarViewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Lista
                  </button>
                </div>
              </div>

              {/* Fila 2: Navegación de Mes + Bloqueo por Mantención */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                    title="Mes Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-base font-extrabold text-slate-900 capitalize px-1 min-w-[150px] text-center sm:text-left">
                    {currentCalendarDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                    title="Mes Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetToCurrentMonth}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition cursor-pointer"
                  >
                    Hoy
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span>+ Bloquear por Mantención</span>
                  </button>
                </div>
              </div>

              {/* Fila 3: Leyenda Dinámica */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[11px] font-semibold text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-slate-800">{spaceLegendRate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Ocupado / Confirmado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Solicitud Pendiente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span>Bloqueo Mantención</span>
                </div>
              </div>

              {/* Fila 4: Días de la semana */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-400 tracking-wider">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
                <div>Dom</div>
              </div>

              {/* Fila 5: Cuadrícula del Calendario */}
              <div className="grid grid-cols-7 gap-2">
                {calendarGridDays.map((dayObj, index) => {
                  if (!dayObj) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-24 rounded-2xl bg-slate-50/40 border border-transparent"
                      />
                    );
                  }

                  const { dayNumber, dateString } = dayObj;
                  const { booking, visit, maintenance } = getDayEventsForSelectedSpace(dateString);
                  const isMonthEnd = dateString === '2026-09-30';

                  let cellBg = 'bg-white hover:border-slate-300 text-slate-800 border-slate-200';
                  if (booking?.status === 'confirmed') {
                    cellBg = 'bg-rose-50/90 border-rose-300 text-rose-950 font-bold';
                  } else if (booking?.status === 'pending') {
                    cellBg = 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold';
                  } else if (visit) {
                    cellBg = 'bg-indigo-50/90 border-indigo-300 text-indigo-950 font-bold';
                  } else if (maintenance) {
                    cellBg = 'bg-slate-100 border-slate-300 text-slate-800';
                  }

                  return (
                    <div
                      key={dateString}
                      onClick={() => setSelectedDayInfo({ date: dateString, dayNumber })}
                      className={`min-h-[92px] sm:min-h-[100px] p-2 rounded-2xl border transition flex flex-col justify-between cursor-pointer hover:shadow-xs ${cellBg}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-extrabold">{dayNumber}</span>
                        {booking?.status === 'confirmed' && (
                          <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                        )}
                        {booking?.status === 'pending' && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        )}
                        {visit && !booking && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        )}
                        {maintenance && (
                          <Wrench className="w-3 h-3 text-slate-500" />
                        )}
                      </div>

                      <div className="mt-1 space-y-1">
                        {booking?.status === 'confirmed' && (
                          <div className="p-1 rounded-lg bg-rose-100 text-[10px] leading-tight text-rose-950 font-semibold border border-rose-200">
                            <div className="flex items-center gap-1 font-bold text-rose-900 truncate">
                              <Lock className="w-2.5 h-2.5 text-rose-700 shrink-0" />
                              <span className="truncate">
                                {booking.rentalModality === 'por_hora' || booking.hourStart !== undefined
                                  ? `${booking.hourStart ?? 10}:00-${booking.hourEnd ?? 14}:00`
                                  : booking.rentalModality === 'mensual'
                                  ? `Mes ${booking.rentalMonth?.slice(-2) || 'Completo'}`
                                  : 'Día Completo'}
                              </span>
                            </div>
                            <div className="font-extrabold text-[9px] text-rose-700 mt-0.5 truncate">
                              {booking.tenantName.split(' ')[0]} • {formatClp(booking.subtotalClp)}
                            </div>
                          </div>
                        )}

                        {booking?.status === 'pending' && (
                          <div className="p-1 rounded-lg bg-amber-100 text-[10px] leading-tight text-amber-950 font-semibold border border-amber-200">
                            <div className="flex items-center gap-1 font-bold text-amber-900 truncate">
                              <Clock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                              <span className="truncate">
                                {booking.rentalModality === 'por_hora' || booking.hourStart !== undefined
                                  ? `${booking.hourStart ?? 10}:00-${booking.hourEnd ?? 14}:00`
                                  : booking.rentalModality === 'mensual'
                                  ? `Mes ${booking.rentalMonth?.slice(-2) || 'Completo'}`
                                  : 'Día Completo'}
                              </span>
                            </div>
                            <div className="font-extrabold text-[9px] text-amber-800 mt-0.5 truncate">
                              ⚡ Solicitud: {booking.tenantName.split(' ')[0]}
                            </div>
                          </div>
                        )}

                        {visit && (
                          <div className="p-1 rounded-md bg-indigo-100 text-[10px] leading-tight text-indigo-900 truncate font-semibold">
                            Visita {visit.visitTimeSlot}
                          </div>
                        )}

                        {maintenance && (
                          <div className="p-1 rounded-md bg-slate-200 text-[10px] leading-tight text-slate-700 truncate font-semibold">
                            Mantención
                          </div>
                        )}

                        {isMonthEnd && !booking && !maintenance && (
                          <div className="p-1 rounded-md bg-emerald-100 text-[9px] leading-tight text-emerald-800 font-bold">
                            Liquidación Cierre Mes
                          </div>
                        )}

                        {!booking && !visit && !maintenance && (
                          <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
                            Disponible
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Banner informativo de tarifas y bloqueos */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-950">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Haz clic sobre cualquier fecha disponible para crear una tarifa especial, bloquear por eventos privados o programar sanitización obligatoria.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (selectedSpace) handleStartEdit(selectedSpace);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 font-bold text-xs text-indigo-900 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
                  >
                    Ver Tarifas Dinámicas
                  </button>
                  <button
                    onClick={() => setIsMaintenanceModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer"
                  >
                    Bloquear Fecha
                  </button>
                </div>
              </div>
            </div>

            {/* Ficha Resumen del Recinto Seleccionado (Bottom Card) */}
            {selectedSpace && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={selectedSpace.images[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80'}
                    alt={selectedSpace.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {selectedSpace.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Activo
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedSpace.address}, {selectedSpace.commune} • Capacidad: {selectedSpace.capacity} pers • {selectedSpace.surfaceM2} m²
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-700">
                      <span>Tarifa: <strong className="text-slate-900">{formatClp(selectedSpace.pricePerHour || selectedSpace.pricePerDay || 45000)}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Garantía: <strong className="text-slate-900">{formatClp(selectedSpace.securityDeposit || 100000)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleStartEdit(selectedSpace)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-600" />
                    <span>Editar Ficha</span>
                  </button>
                  <button
                    onClick={() => alert(`Vista pública de ${selectedSpace.title} disponible en el catálogo de Spotly.`)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ver Vista Pública</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Solicitudes por Aprobar con identificación clara de recinto, Visitas Técnicas y Liquidaciones (4 cols en desktop) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Solicitudes por Aprobar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">Solicitudes por Aprobar</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                      {pendingValidBookings.length} Vigentes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Solo solicitudes válidas del día actual hacia adelante ({todayIso} en adelante).
                  </p>
                </div>
              </div>

              {/* Filtro rápido: Todas vs Solo del recinto seleccionado */}
              {selectedSpace && (
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600">
                  <button
                    onClick={() => setPendingFilter('all')}
                    className={`flex-1 py-1 px-2 rounded-lg transition text-center cursor-pointer ${
                      pendingFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Todas ({pendingValidBookings.length})
                  </button>
                  <button
                    onClick={() => setPendingFilter('selected')}
                    className={`flex-1 py-1 px-2 rounded-lg transition text-center truncate cursor-pointer ${
                      pendingFilter === 'selected'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    Solo {selectedSpace.title.slice(0, 15)}...
                  </button>
                </div>
              )}

              {/* Lista de Solicitudes */}
              <div className="space-y-3">
                {(() => {
                  const pendingList = pendingValidBookings;
                  const filteredPending = pendingFilter === 'selected' && selectedSpace
                    ? pendingList.filter(b => b.spaceId === selectedSpace.id)
                    : pendingList;

                  if (filteredPending.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No hay solicitudes vigentes pendientes por aprobar.
                      </div>
                    );
                  }

                  return filteredPending.map((res) => (
                    <div
                      key={res.id}
                      className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-slate-300 transition space-y-3"
                    >
                      {/* DESTACADO CLAVE: Recinto al que postula */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold truncate">
                          <Building className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                          <span className="truncate">Postula a: {res.spaceTitle}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 whitespace-nowrap">
                          Expira en 4h
                        </span>
                      </div>

                      {/* Datos del Cliente */}
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {res.tenantName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{res.tenantName}</h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            RUT: {formatRut(res.tenantRut)} • {res.tenantEmail}
                          </p>
                        </div>
                      </div>

                      {/* Detalles del Arriendo Solicitado */}
                      <div className="p-3 rounded-xl bg-white text-[11px] space-y-1.5 text-slate-700 border border-slate-100 shadow-2xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {res.startDate} {res.durationUnits ? `• ${res.durationUnits} hrs` : `• ${res.totalDays} días`}
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">
                          <strong className="text-slate-800">Motivo:</strong> {res.intendedUse}
                        </p>
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between font-bold">
                          <span className="text-slate-500 font-medium">Monto neto anfitrión:</span>
                          <span className="text-emerald-700 font-extrabold text-xs">
                            {formatClp(res.subtotalClp - (res.platformFeeClp || 0))}
                          </span>
                        </div>
                      </div>

                      {/* Acciones: Ver Contrato, Consultar, Aprobar, Rechazar */}
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleViewReservationContract(res)}
                          className="flex-1 min-w-[110px] py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                          title="Ver contrato digital formal para este arriendo"
                        >
                          <FileText className="w-3.5 h-3.5 text-rose-600" />
                          <span>Ver Contrato</span>
                        </button>
                        <button
                          onClick={() => setContactModalTenant({
                            name: res.tenantName,
                            phone: '+56 9 8765 4321',
                            email: res.tenantEmail,
                            spaceTitle: res.spaceTitle,
                          })}
                          className="py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                          title="Contactar al arrendatario"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span>Consultar</span>
                        </button>
                        <button
                          onClick={() => {
                            if (res.startDate < todayIso) {
                              alert('Las reservas para aprobar deben ser del día actual hacia adelante.');
                              return;
                            }
                            updateReservationStatus(res.id, 'confirmed');
                          }}
                          className="flex-1 min-w-[100px] py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobar Ahora</span>
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Card 2: Visitas Técnicas (Scouting) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Visitas Técnicas (Scouting)</h3>
                    <p className="text-[10px] text-slate-500">Inspecciones previas al rodaje o evento</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {visitRequests.filter(v => v.ownerId === currentUser.id).length} Agendada
                </span>
              </div>

              <div className="space-y-2.5">
                {visitRequests
                  .filter((v) => v.ownerId === currentUser.id)
                  .map((visit) => (
                    <div
                      key={visit.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{visit.tenantName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Gratuita (30m)
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{visit.spaceTitle}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{visit.visitDate} • {visit.visitTimeSlot}</span>
                      </div>
                      {visit.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-xl border border-slate-100">
                          "{visit.notes}"
                        </p>
                      )}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => alert(`Contactar a ${visit.tenantName} vía WhatsApp al ${visit.tenantPhone || '+56 9 8765 4321'}`)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[10px] text-center transition cursor-pointer"
                        >
                          Contactar por WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Card 3: Últimas Liquidaciones */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Últimas Liquidaciones</h3>
                    <p className="text-[10px] text-slate-500">Transferencias a cuenta Banco de Chile</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('finances')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Ver Historial
                </button>
              </div>

              <div className="space-y-2.5 divide-y divide-slate-100">
                <div className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Transferencia Webpay Spotly</p>
                    <p className="text-[10px] text-slate-400">31 de Agosto 2026 • ID #84920</p>
                  </div>
                  <span className="font-extrabold text-emerald-700">CLP 698.800</span>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Transferencia Webpay Spotly</p>
                    <p className="text-[10px] text-slate-400">31 de Julio 2026 • ID #79114</p>
                  </div>
                  <span className="font-extrabold text-emerald-700">CLP 540.200</span>
                </div>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Transferencia Webpay Spotly</p>
                    <p className="text-[10px] text-slate-400">30 de Junio 2026 • ID #68301</p>
                  </div>
                  <span className="font-extrabold text-emerald-700">CLP 480.000</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Banco de Chile • Cta Cte ****4921 • Titular: Carlos Muñoz Echeverría</span>
              </div>
            </div>
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

      {/* Modal para Bloqueo por Mantención */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bloquear Fecha por Mantención</h3>
                  <p className="text-[11px] text-slate-500">Recinto: {selectedSpace?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaintenanceBlock} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fecha a Bloquear</label>
                <input
                  type="date"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivo del Bloqueo</label>
                <input
                  type="text"
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  placeholder="Ej: Sanitización, pintura o mantención técnica"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              {/* Lista de bloqueos actuales para este espacio */}
              {maintenanceBlocks.filter((m) => m.spaceId === selectedSpace?.id).length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="font-bold text-slate-600 block text-[11px]">Bloqueos activos en este recinto:</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {maintenanceBlocks
                      .filter((m) => m.spaceId === selectedSpace?.id)
                      .map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{block.date}</span>
                            <p className="text-slate-500 truncate max-w-[200px]">{block.reason}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMaintenanceBlock(block.id)}
                            className="text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded cursor-pointer"
                          >
                            Desbloquear
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold cursor-pointer transition shadow-xs"
                >
                  Confirmar Bloqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Contactar al Arrendatario */}
      {contactModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Contactar Arrendatario</h3>
                  <p className="text-[11px] text-slate-500">Recinto: {contactModalTenant.spaceTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setContactModalTenant(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{contactModalTenant.name}</div>
                <div className="text-slate-600">Email: {contactModalTenant.email}</div>
                <div className="text-slate-600">Teléfono móvil: {contactModalTenant.phone}</div>
              </div>

              <p className="text-slate-500 leading-relaxed">
                Puedes enviar un mensaje directo por WhatsApp o realizar una llamada telefónica para coordinar detalles del evento, equipamiento requerido o solicitar documentos adicionales.
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    alert(`Iniciando chat de WhatsApp con ${contactModalTenant.name} (${contactModalTenant.phone}) sobre ${contactModalTenant.spaceTitle}`);
                    setContactModalTenant(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Abrir WhatsApp</span>
                </button>
                <button
                  onClick={() => setContactModalTenant(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalle de un día específico en el calendario */}
      {selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedDayInfo.date}
                </h3>
                <p className="text-[11px] text-slate-500">{selectedSpace?.title}</p>
              </div>
              <button
                onClick={() => setSelectedDayInfo(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {(() => {
                const { booking, visit, maintenance } = getDayEventsForSelectedSpace(selectedDayInfo.date);

                if (booking) {
                  const isPastBooking = booking.startDate < todayIso;
                  return (
                    <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {booking.status === 'confirmed' ? '✓ Reserva Confirmada' : '⚡ Solicitud Pendiente'}
                        </span>
                        <span className="font-extrabold text-rose-700 text-sm">{formatClp(booking.subtotalClp)}</span>
                      </div>

                      {/* DETALLE EXACTO DE DÍA, HORA O MES SOLICITADO */}
                      <div className="p-3 bg-white rounded-xl border border-rose-100 space-y-2">
                        <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          {booking.rentalModality === 'por_hora' || booking.hourStart !== undefined ? (
                            <>
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Horario Solicitado: <strong>{booking.hourStart ?? 10}:00 a {booking.hourEnd ?? 14}:00 hrs</strong> ({booking.durationUnits || booking.totalDays || 4} hrs)</span>
                            </>
                          ) : booking.rentalModality === 'mensual' ? (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Mes Solicitado: <strong>{booking.rentalMonth || 'Septiembre 2026'}</strong></span>
                            </>
                          ) : (
                            <>
                              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Jornada Completa: <strong>{booking.startDate} al {booking.endDate}</strong> ({booking.totalDays} {booking.totalDays === 1 ? 'día' : 'días'})</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-start gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                          <Lock className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Bloqueo Activo: Esta franja/fecha está bloqueada en la plataforma para evitar dobles reservas con otros clientes.</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-700">
                        <p>Cliente: <strong>{booking.tenantName}</strong> (RUT: {booking.tenantRut || '18.345.678-9'})</p>
                        <p>Destino: <em>"{booking.intendedUse}"</em></p>
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedDayInfo(null);
                            handleViewReservationContract(booking);
                          }}
                          className="w-full py-2 rounded-xl bg-white border border-rose-200 text-rose-800 font-bold text-xs hover:bg-rose-100 transition cursor-pointer"
                        >
                          Ver Contrato Digital Ley 18.101
                        </button>

                        {booking.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => {
                                if (booking.startDate < todayIso) {
                                  alert('Las reservas para aprobar deben ser del día actual hacia adelante.');
                                  return;
                                }
                                updateReservationStatus(booking.id, 'confirmed');
                                setSelectedDayInfo(null);
                              }}
                              disabled={isPastBooking}
                              className={`py-2 px-2 rounded-xl font-bold text-xs transition cursor-pointer text-center ${
                                isPastBooking
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                            >
                              Aprobar Reserva
                            </button>
                            <button
                              onClick={() => {
                                updateReservationStatus(booking.id, 'rejected');
                                setSelectedDayInfo(null);
                              }}
                              className="py-2 px-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition cursor-pointer text-center"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (visit) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1.5">
                      <span className="font-bold text-indigo-900">Visita Técnica Agendada</span>
                      <p className="text-slate-700">Cliente: <strong>{visit.tenantName}</strong></p>
                      <p className="text-slate-600">Horario: {visit.visitTimeSlot}</p>
                    </div>
                  );
                }

                if (maintenance) {
                  return (
                    <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-900">Bloqueo por Mantención</span>
                      <p className="text-slate-600">{maintenance.reason}</p>
                      <button
                        onClick={() => {
                          handleRemoveMaintenanceBlock(maintenance.id);
                          setSelectedDayInfo(null);
                        }}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        Eliminar bloqueo
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                    <p className="font-bold text-emerald-900">Día 100% Disponible</p>
                    <p className="text-[11px] text-emerald-700">
                      Tarifa vigente: {formatClp(selectedSpace?.pricePerHour || selectedSpace?.pricePerDay || 45000)}
                    </p>
                    <button
                      onClick={() => {
                        setMaintenanceDate(selectedDayInfo.date);
                        setSelectedDayInfo(null);
                        setIsMaintenanceModalOpen(true);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition"
                    >
                      Bloquear este día
                    </button>
                  </div>
                );
              })()}
            </div>
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
