import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  Space,
  Reservation,
  AuditLog,
  Dispute,
  NotificationItem,
  UserRole,
  UserGender,
  PaymentSimulationData,
  SavedCard,
  ReservationStatus,
  DigitalContract,
  VisitRequest,
} from '../types.ts';
import {
  INITIAL_USERS,
  INITIAL_SPACES,
  INITIAL_RESERVATIONS,
  INITIAL_DISPUTES,
  INITIAL_VISIT_REQUESTS,
} from '../data/mockData.ts';
import { saveAuditLog, getAuditLogs, getClientAuditMetadata } from '../utils/auditLogger.ts';
import { generateDigitalContract } from '../utils/contractGenerator.ts';
import { getTodayIso } from '../utils/formatters.ts';

interface AppContextType {
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  spaces: Space[];
  reservations: Reservation[];
  contracts: DigitalContract[];
  auditLogs: AuditLog[];
  disputes: Dispute[];
  notifications: NotificationItem[];
  savedCards: SavedCard[];
  visitRequests: VisitRequest[];
  requestVisit: (data: Omit<VisitRequest, 'id' | 'createdAt' | 'status'>) => VisitRequest;
  quickVerifyUser: () => void;
  addSavedCard: (cardData: {
    cardBrand: 'visa' | 'mastercard' | 'redcompra';
    cardHolder: string;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
    bankName: string;
    isDefault?: boolean;
  }) => void;
  deleteSavedCard: (cardId: string) => void;
  setDefaultCard: (cardId: string) => void;
  // Role & Session actions
  switchUser: (userId: string | null) => void;
  login: (emailOrRut: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (userData: {
    fullName: string;
    rut: string;
    email: string;
    phone: string;
    role: 'tenant' | 'owner';
    agreedTerms: boolean;
    gender?: UserGender;
    birthDate?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  updateUserRole: (newRole: UserRole) => void;
  upgradeTenantToOwner: (agreedTerms: boolean, kycVerified?: boolean) => Promise<{ success: boolean; message: string }>;
  // Tenant actions
  createBooking: (bookingData: {
    space: Space;
    startDate: string;
    endDate: string;
    totalDays: number;
    subtotalClp: number;
    platformFeeClp: number;
    securityDepositClp: number;
    totalClp: number;
    intendedUse: string;
    rentalModality?: 'por_hora' | 'por_dia' | 'mensual';
    hourStart?: number;
    hourEnd?: number;
    timeSlotString?: string;
    rentalMonth?: string;
    durationUnits?: number;
    priceUnit?: 'hour' | 'day' | 'month';
    signatureImage?: string;
    signatureType?: 'digital_canvas' | 'token_fea';
    paymentSimulation?: PaymentSimulationData;
  }) => Promise<{ reservation: Reservation; contract: DigitalContract }>;
  // Owner actions
  createSpace: (spaceData: Omit<Space, 'id' | 'ownerId' | 'ownerName' | 'ownerRut' | 'ownerVerified' | 'rating' | 'reviewsCount' | 'createdAt'>) => void;
  updateSpace: (id: string, spaceData: Partial<Space>) => void;
  deleteSpace: (id: string) => void;
  updateReservationStatus: (reservationId: string, status: ReservationStatus) => void;
  // Admin actions
  adminApproveKyc: (userId: string) => void;
  adminRejectKyc: (userId: string, reason: string) => void;
  adminToggleSpaceStatus: (spaceId: string, status: 'active' | 'paused' | 'pending_approval') => void;
  adminResolveDispute: (disputeId: string, resolution: 'resolved_refund' | 'resolved_owner', notes: string) => void;
  createDispute: (reservationId: string, reason: string) => void;
  // Audit & Notifications
  addAuditRecord: (action: string, severity: 'info' | 'warning' | 'security' | 'critical', details: Record<string, unknown>) => void;
  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
  // View states helpers
  isOwnerCapable: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_CURRENT_USER = 'spotly_current_user_v1';
const STORAGE_KEY_USERS = 'spotly_users_v1';
const STORAGE_KEY_SPACES = 'spotly_spaces_v1';
const STORAGE_KEY_RESERVATIONS = 'spotly_reservations_v1';
const STORAGE_KEY_CONTRACTS = 'spotly_contracts_v1';
const STORAGE_KEY_DISPUTES = 'spotly_disputes_v1';
const STORAGE_KEY_SAVED_CARDS = 'spotly_saved_cards_v1';
const STORAGE_KEY_VISIT_REQUESTS = 'spotly_visit_requests_v1';

const INITIAL_SAVED_CARDS: SavedCard[] = [
  {
    id: 'card-chile-1',
    userId: 'user-tenant-1',
    cardBrand: 'visa',
    cardHolder: 'MATIAS SILVA CONTRERAS',
    last4: '9010',
    expiryMonth: '11',
    expiryYear: '28',
    bankName: 'Banco de Chile',
    isDefault: true,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'card-santander-2',
    userId: 'user-tenant-1',
    cardBrand: 'mastercard',
    cardHolder: 'MATIAS SILVA CONTRERAS',
    last4: '4421',
    expiryMonth: '08',
    expiryYear: '29',
    bankName: 'Banco Santander',
    isDefault: false,
    createdAt: '2026-02-14T14:30:00Z',
  },
  {
    id: 'card-bancoestado-3',
    userId: 'user-tenant-1',
    cardBrand: 'redcompra',
    cardHolder: 'MATIAS SILVA CONTRERAS',
    last4: '1892',
    expiryMonth: '05',
    expiryYear: '27',
    bankName: 'BancoEstado (CuentaRUT)',
    isDefault: false,
    createdAt: '2026-03-01T09:15:00Z',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialización de usuarios
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      return stored ? JSON.parse(stored) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Usuario actual (null = visitante no registrado)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (stored && stored !== 'null') return JSON.parse(stored);
      // Por defecto: null (visitante no registrado) para que se aprecie el flujo público
      return null;
    } catch {
      return null;
    }
  });

  // Espacios
  const [spaces, setSpaces] = useState<Space[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SPACES);
      return stored ? JSON.parse(stored) : INITIAL_SPACES;
    } catch {
      return INITIAL_SPACES;
    }
  });

  // Reservas
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RESERVATIONS);
      return stored ? JSON.parse(stored) : INITIAL_RESERVATIONS;
    } catch {
      return INITIAL_RESERVATIONS;
    }
  });

  // Contratos digitales
  const [contracts, setContracts] = useState<DigitalContract[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONTRACTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Disputas
  const [disputes, setDisputes] = useState<Dispute[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DISPUTES);
      return stored ? JSON.parse(stored) : INITIAL_DISPUTES;
    } catch {
      return INITIAL_DISPUTES;
    }
  });

  // Tarjetas bancarias guardadas (Billetera Spotly)
  const [savedCards, setSavedCards] = useState<SavedCard[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED_CARDS);
      return stored ? JSON.parse(stored) : INITIAL_SAVED_CARDS;
    } catch {
      return INITIAL_SAVED_CARDS;
    }
  });

  // Solicitudes de visita
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_VISIT_REQUESTS);
      return stored ? JSON.parse(stored) : INITIAL_VISIT_REQUESTS;
    } catch {
      return INITIAL_VISIT_REQUESTS;
    }
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getAuditLogs());

  // Notificaciones en la sesión
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-welcome-1',
      userId: currentUser ? currentUser.id : 'guest',
      title: '🌟 ¡Bienvenido a Spotly Chile!',
      message: 'Te damos una cálida bienvenida a la plataforma líder de arriendo de recintos comerciales, abiertos y cerrados en Chile. Explora espacios verificados con contratos digitales automáticos.',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 'notif-welcome-2',
      userId: currentUser ? currentUser.id : 'guest',
      title: '🛡️ Seguridad Legal y Transbank Webpay',
      message: 'Todas las transacciones y reservas en Spotly cuentan con custodia de garantía segura y contratos respaldados por la Ley 18.101 de Chile.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ]);

  // Sincronización a localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(allUsers));
    } catch (e) {
      console.error(e);
    }
  }, [allUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPACES, JSON.stringify(spaces));
    } catch (e) {
      console.error(e);
    }
  }, [spaces]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(reservations));
    } catch (e) {
      console.error(e);
    }
  }, [reservations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONTRACTS, JSON.stringify(contracts));
    } catch (e) {
      console.error(e);
    }
  }, [contracts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISPUTES, JSON.stringify(disputes));
    } catch (e) {
      console.error(e);
    }
  }, [disputes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_CARDS, JSON.stringify(savedCards));
    } catch (e) {
      console.error(e);
    }
  }, [savedCards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VISIT_REQUESTS, JSON.stringify(visitRequests));
    } catch (e) {
      console.error(e);
    }
  }, [visitRequests]);

  // Auditoría helper
  const addAuditRecord = (
    action: string,
    severity: 'info' | 'warning' | 'security' | 'critical',
    details: Record<string, unknown>
  ) => {
    const meta = getClientAuditMetadata();
    const log = saveAuditLog({
      action,
      severity,
      userId: currentUser ? currentUser.id : 'guest-anonymous',
      userEmail: currentUser ? currentUser.email : 'visitante@spotly.cl',
      userRole: currentUser ? currentUser.role : ('tenant' as UserRole),
      ip: meta.ip,
      userAgent: meta.userAgent,
      details,
    });
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Inicio de sesión por Email o RUT
  const login = async (emailOrRut: string, _password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanInput = emailOrRut.trim().toLowerCase();
    const found = allUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.rut.toLowerCase().replace(/[^0-9k]/g, '') === cleanInput.replace(/[^0-9k]/g, '')
    );

    if (!found) {
      return {
        success: false,
        message: 'No existe una cuenta registrada con este correo o RUT en Spotly Chile.',
      };
    }

    setCurrentUser(found);
    addAuditRecord('USER_LOGGED_IN', 'security', {
      userId: found.id,
      userEmail: found.email,
      userRole: found.role,
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: found.id,
        title: `Sesión iniciada como ${found.role === 'admin' ? 'Administrador' : found.role === 'owner' ? 'Propietario' : 'Arrendatario'}`,
        message: `Hola de nuevo, ${found.fullName}. Has ingresado a tu cuenta.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `¡Bienvenido nuevamente, ${found.fullName.split(' ')[0]}!`,
    };
  };

  // Cierre de sesión (vuelve a modo Visitante no registrado)
  const logout = () => {
    if (currentUser) {
      addAuditRecord('USER_LOGGED_OUT', 'info', {
        userId: currentUser.id,
        userEmail: currentUser.email,
      });
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } catch (e) {
      console.error(e);
    }
  };

  // Registro de nuevo usuario (Arrendatario o Propietario)
  const register = async (userData: {
    fullName: string;
    rut: string;
    email: string;
    phone: string;
    role: 'tenant' | 'owner';
    agreedTerms: boolean;
    gender?: UserGender;
    birthDate?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanRut = userData.rut.replace(/[^0-9k]/gi, '').toLowerCase();

    const existing = allUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.rut.replace(/[^0-9k]/gi, '').toLowerCase() === cleanRut
    );

    if (existing) {
      return {
        success: false,
        message: 'Ya existe una cuenta registrada con este correo electrónico o RUT.',
      };
    }

    const newUser: UserProfile = {
      id: `usr-custom-${Date.now()}`,
      fullName: userData.fullName,
      email: cleanEmail,
      rut: userData.rut,
      phone: userData.phone,
      gender: userData.gender,
      birthDate: userData.birthDate,
      avatarUrl: userData.gender === 'femenino' 
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      role: userData.role,
      ownerTermsAccepted: userData.role === 'owner' ? userData.agreedTerms : false,
      ownerApplicationDate: userData.role === 'owner' ? new Date().toISOString() : undefined,
      verificationStatus: 'unverified',
      commune: 'Santiago',
      city: 'Santiago',
      createdAt: new Date().toISOString(),
    };

    setAllUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);

    addAuditRecord('USER_REGISTERED', 'security', {
      userId: newUser.id,
      userEmail: newUser.email,
      userRole: newUser.role,
      ownerTermsAccepted: newUser.ownerTermsAccepted,
      gender: newUser.gender,
      birthDate: newUser.birthDate,
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: newUser.id,
        title: '🌟 ¡Bienvenido a Spotly Chile!',
        message: `¡Hola ${newUser.fullName}! Tu cuenta ha sido activada con éxito. Ya puedes explorar y reservar espacios o verificar tu identidad con tu carnet de identidad.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: '¡Cuenta registrada con éxito!',
    };
  };

  // Actualizar perfil de usuario (Mi Cuenta)
  const updateUserProfile = (data: Partial<UserProfile>) => {
    if (!currentUser) return;

    const updatedUser: UserProfile = {
      ...currentUser,
      ...data,
    };

    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    addAuditRecord('USER_PROFILE_UPDATED', 'info', {
      userId: updatedUser.id,
      updatedFields: Object.keys(data),
    });

    setNotifications((prev) => [
      {
        id: `notif-update-${Date.now()}`,
        userId: updatedUser.id,
        title: '✅ Datos actualizados',
        message: 'Tus datos personales de perfil han sido actualizados y sincronizados con éxito.',
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  };

  // Cambio de usuario para pruebas y cambio de rol
  const switchUser = (userId: string | null) => {
    if (!userId || userId === 'guest') {
      logout();
      return;
    }

    const target = allUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      addAuditRecord('SESSION_USER_SWITCHED', 'info', {
        newUserId: target.id,
        newRole: target.role,
        ownerTermsAccepted: target.ownerTermsAccepted,
      });
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          userId: target.id,
          title: `Sesión iniciada como ${target.role === 'admin' ? 'Administrador' : target.role === 'owner' ? 'Propietario' : 'Arrendatario'}`,
          message: `Conectado como ${target.fullName} (${target.rut})`,
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    }
  };

  const updateUserRole = (newRole: UserRole) => {
    if (!currentUser) return;
    if (newRole === 'owner' && !currentUser.ownerTermsAccepted) {
      alert('Debes aceptar los Términos y Condiciones de Propietario para activar el perfil de anfitrión.');
      return;
    }

    const updatedUser: UserProfile = { ...currentUser, role: newRole };
    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    addAuditRecord('ROLE_CHANGED', 'security', {
      previousRole: currentUser.role,
      newRole,
    });
  };

  // REQUISITO CLAVE: Permitir a los arrendatarios volverse propietarios aceptando términos
  const upgradeTenantToOwner = async (
    agreedTerms: boolean,
    kycVerified = true
  ): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'Debes iniciar sesión para realizar esta acción.' };
    }
    if (!agreedTerms) {
      return { success: false, message: 'Es obligatorio aceptar el contrato de adhesión de Propietarios y anfitriones Spotly.' };
    }

    const auditMeta = getClientAuditMetadata('OWNER-TERMS-v2026.1');

    const updatedUser: UserProfile = {
      ...currentUser,
      role: 'owner',
      ownerTermsAccepted: true,
      ownerApplicationDate: new Date().toISOString(),
      verificationStatus: kycVerified ? 'verified' : currentUser.verificationStatus,
    };

    setCurrentUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    addAuditRecord('UPGRADED_TO_OWNER', 'security', {
      termsAccepted: true,
      termsVersion: 'OWNER-TERMS-v2026.1',
      auditHash: auditMeta.hash,
      verificationStatus: updatedUser.verificationStatus,
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: updatedUser.id,
        title: '¡Felicitaciones! Ahora eres Propietario en Spotly',
        message: 'Términos y condiciones de anfitrión aceptados legalmente. Ya puedes publicar y gestionar tus espacios en Chile.',
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: '¡Tu cuenta ha sido activada con éxito como Propietario! Ya puedes ingresar al Panel de Propietarios.',
    };
  };

  // Creación de reserva por un arrendatario
  const createBooking = async (bookingData: {
    space: Space;
    startDate: string;
    endDate: string;
    totalDays: number;
    subtotalClp: number;
    platformFeeClp: number;
    securityDepositClp: number;
    totalClp: number;
    intendedUse: string;
    rentalModality?: 'por_hora' | 'por_dia' | 'mensual';
    hourStart?: number;
    hourEnd?: number;
    timeSlotString?: string;
    rentalMonth?: string;
    durationUnits?: number;
    priceUnit?: 'hour' | 'day' | 'month';
    signatureImage?: string;
    signatureType?: 'digital_canvas' | 'token_fea';
    paymentSimulation?: PaymentSimulationData;
  }): Promise<{ reservation: Reservation; contract: DigitalContract }> => {
    if (!currentUser) {
      throw new Error('Debes iniciar sesión para reservar un espacio.');
    }

    const todayStr = getTodayIso();
    if (bookingData.startDate < todayStr) {
      throw new Error('La fecha de la reserva debe ser desde el día actual hacia adelante.');
    }
    if (bookingData.endDate < bookingData.startDate) {
      throw new Error('La fecha de término no puede ser anterior a la fecha de inicio.');
    }

    const modality = bookingData.rentalModality || bookingData.space.rentalModality || 'por_dia';

    // VALIDACIÓN DE DISPONIBILIDAD ESTRICTA (ANTI-DOBLE RESERVA)
    const activeBookings = reservations.filter(
      (r) => r.spaceId === bookingData.space.id && r.status !== 'rejected' && r.status !== 'cancelled'
    );

    for (const existing of activeBookings) {
      // Verificar si las fechas se solapan
      const datesOverlap = bookingData.startDate <= existing.endDate && bookingData.endDate >= existing.startDate;
      if (datesOverlap) {
        // Caso 1: Ambas solicitudes son por hora en el mismo día
        if (modality === 'por_hora' && existing.rentalModality === 'por_hora' && bookingData.startDate === existing.startDate) {
          const newHStart = bookingData.hourStart ?? 9;
          const newHEnd = bookingData.hourEnd ?? (newHStart + bookingData.totalDays);
          const existHStart = existing.hourStart ?? 9;
          const existHEnd = existing.hourEnd ?? (existHStart + (existing.durationUnits || existing.totalDays));

          // Hay solapamiento si se cruzan los intervalos de horas
          if (newHStart < existHEnd && newHEnd > existHStart) {
            throw new Error(
              `Conflicto de disponibilidad: El horario de ${newHStart}:00 a ${newHEnd}:00 del ${bookingData.startDate} ya se encuentra reservado en este recinto.`
            );
          }
        } else {
          // Caso 2: Al menos una reserva es de día completo o mensual -> bloqueo total de esas fechas
          const isExistingHourly = existing.rentalModality === 'por_hora';
          const isNewHourly = modality === 'por_hora';
          if (isNewHourly && isExistingHourly && bookingData.startDate !== existing.startDate) {
            // Son en días distintos dentro de un rango
            continue;
          }
          throw new Error(
            `Conflicto de disponibilidad: El recinto "${bookingData.space.title}" ya tiene una reserva activa para las fechas seleccionadas (${existing.startDate} al ${existing.endDate}). Selecciona otras fechas u horario disponible.`
          );
        }
      }
    }

    const meta = getClientAuditMetadata();
    const reservationId = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Generar contrato digital formal chileno
    const contract = generateDigitalContract({
      reservationId,
      spaceTitle: bookingData.space.title,
      spaceAddress: `${bookingData.space.address}, ${bookingData.space.commune}, ${bookingData.space.region}`,
      tenantName: currentUser.fullName,
      tenantRut: currentUser.rut,
      ownerName: bookingData.space.ownerName,
      ownerRut: bookingData.space.ownerRut,
      totalClp: bookingData.totalClp,
      guaranteeDepositClp: bookingData.securityDepositClp,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      ip: meta.ip,
      rentalModality: modality,
      priceUnit: bookingData.priceUnit || (modality === 'por_hora' ? 'hour' : modality === 'mensual' ? 'month' : 'day'),
      durationUnits: bookingData.durationUnits || bookingData.totalDays,
      intendedUse: bookingData.intendedUse,
      signatureImage: bookingData.signatureImage,
      signatureType: bookingData.signatureType,
    });

    const newReservation: Reservation = {
      id: reservationId,
      spaceId: bookingData.space.id,
      spaceTitle: bookingData.space.title,
      spaceAddress: `${bookingData.space.address}, ${bookingData.space.commune}`,
      spaceImage: bookingData.space.images[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
      spaceCategory: bookingData.space.category,
      spaceEnvironment: bookingData.space.spaceEnvironment,
      tenantId: currentUser.id,
      tenantName: currentUser.fullName,
      tenantEmail: currentUser.email,
      tenantRut: currentUser.rut,
      ownerId: bookingData.space.ownerId,
      ownerName: bookingData.space.ownerName,
      ownerRut: bookingData.space.ownerRut,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      totalDays: bookingData.totalDays,
      dailyRateClp: bookingData.space.pricePerDay,
      rentalModality: modality,
      durationUnits: bookingData.durationUnits || bookingData.totalDays,
      priceUnit: bookingData.priceUnit || (modality === 'por_hora' ? 'hour' : modality === 'mensual' ? 'month' : 'day'),
      hourStart: bookingData.hourStart,
      hourEnd: bookingData.hourEnd,
      timeSlotString: bookingData.timeSlotString,
      rentalMonth: bookingData.rentalMonth,
      subtotalClp: bookingData.subtotalClp,
      platformFeeClp: bookingData.platformFeeClp,
      securityDepositClp: bookingData.securityDepositClp,
      totalClp: bookingData.totalClp,
      intendedUse: bookingData.intendedUse,
      paymentSimulation: bookingData.paymentSimulation,
      status: 'pending',
      digitalContractId: contract.id,
      createdAt: new Date().toISOString(),
    };

    setReservations((prev) => [newReservation, ...prev]);
    setContracts((prev) => [contract, ...prev]);

    addAuditRecord('RESERVATION_CREATED_WITH_CONTRACT', 'info', {
      reservationId,
      contractId: contract.id,
      contractHash: contract.contractHash,
      spaceId: bookingData.space.id,
      totalClp: bookingData.totalClp,
      tenantRut: currentUser.rut,
      intendedUse: bookingData.intendedUse,
      paymentMethod: bookingData.paymentSimulation?.cardBrand,
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: currentUser.id,
        title: '🎉 ¡Reserva confirmada con éxito!',
        message: `¡Excelente noticia! Tu solicitud para "${bookingData.space.title}" por CLP ${bookingData.totalClp.toLocaleString('es-CL')} ha sido registrada. Pago procesado mediante simulación Webpay Plus (Aut: ${bookingData.paymentSimulation?.authorizationCode || '748291'}). El contrato digital está firmado y notificado.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return { reservation: newReservation, contract };
  };

  // Creación de espacio por un propietario
  const createSpace = (
    spaceData: Omit<Space, 'id' | 'ownerId' | 'ownerName' | 'ownerRut' | 'ownerVerified' | 'rating' | 'reviewsCount' | 'createdAt'>
  ) => {
    if (!currentUser) {
      alert('Debes iniciar sesión para publicar un espacio.');
      return;
    }

    if (!currentUser.ownerTermsAccepted && currentUser.role !== 'admin') {
      alert('Debes aceptar los términos de propietario antes de publicar un espacio.');
      return;
    }

    const newSpace: Space = {
      ...spaceData,
      id: `spc-${Date.now()}`,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      ownerRut: currentUser.rut,
      ownerVerified: currentUser.verificationStatus === 'verified',
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
    };

    setSpaces((prev) => [newSpace, ...prev]);
    addAuditRecord('SPACE_PUBLISHED', 'info', {
      spaceId: newSpace.id,
      title: newSpace.title,
      pricePerDay: newSpace.pricePerDay,
      commune: newSpace.commune,
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: currentUser.id,
        title: 'Espacio Publicado Exitosamente',
        message: `Tu espacio "${newSpace.title}" ha sido enviado y está en estado ${newSpace.status === 'active' ? 'activo' : 'en revisión por moderación'}.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  };

  const requestVisit = (data: Omit<VisitRequest, 'id' | 'createdAt' | 'status'>): VisitRequest => {
    const newVisit: VisitRequest = {
      ...data,
      id: `vis-${Date.now()}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setVisitRequests((prev) => [newVisit, ...prev]);

    addAuditRecord('VISIT_REQUESTED', 'info', {
      visitId: newVisit.id,
      spaceId: newVisit.spaceId,
      visitDate: newVisit.visitDate,
      visitTimeSlot: newVisit.visitTimeSlot,
      modality: newVisit.modality,
    });

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: currentUser ? currentUser.id : 'guest',
        title: '📍 Solicitud de Visita Agendada',
        message: `Se ha coordinado tu visita para "${data.spaceTitle}" para el ${data.visitDate} (${data.visitTimeSlot}). El anfitrión ${data.ownerName} ha sido notificado.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);

    return newVisit;
  };

  const quickVerifyUser = () => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      verificationStatus: 'verified',
      kycData: {
        ...(currentUser.kycData || {
          consentGiven: true,
          termsVersion: 'VERIFICACION-2026.1',
          photoCaptured: true,
          idFrontCaptured: true,
          idBackCaptured: true,
          rutNumber: currentUser.rut,
          documentSerialNumber: '123456789',
          criminalRecordSubmitted: true,
        }),
        biometricScore: 99.4,
        isLivenessConfirmed: true,
      },
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    addAuditRecord('QUICK_VERIFICATION_ACTIVATED', 'security', {
      userId: updated.id,
      status: 'verified',
      score: 99.4,
    });
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: updated.id,
        title: '✅ Identidad Verificada para Arriendos',
        message: 'Tu perfil ha sido verificado con éxito. Ya puedes formalizar reservas y contratos legales bajo la Ley 18.101.',
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  };

  const updateSpace = (id: string, updates: Partial<Space>) => {
    setSpaces((prev) =>
      prev.map((spc) => (spc.id === id ? { ...spc, ...updates } : spc))
    );
    addAuditRecord('SPACE_UPDATED', 'info', { spaceId: id, updates });
  };

  const deleteSpace = (id: string) => {
    setSpaces((prev) => prev.filter((spc) => spc.id !== id));
    addAuditRecord('SPACE_DELETED', 'warning', { spaceId: id });
  };

  // Actualización de estado de reserva (ej. Propietario acepta o rechaza solicitud de reserva)
  const updateReservationStatus = (reservationId: string, status: ReservationStatus) => {
    const targetReservation = reservations.find(r => r.id === reservationId);

    if (status === 'confirmed' && targetReservation) {
      const todayStr = getTodayIso();
      const resDate = targetReservation.endDate || targetReservation.startDate;
      if (resDate < todayStr) {
        throw new Error('No es posible aprobar una reserva cuya fecha ya transcurrió.');
      }
    }

    setReservations((prev) =>
      prev.map((res) => (res.id === reservationId ? { ...res, status } : res))
    );

    addAuditRecord('RESERVATION_STATUS_CHANGED', 'info', {
      reservationId,
      newStatus: status,
      actionBy: currentUser ? currentUser.id : 'system',
      actionByRole: currentUser ? currentUser.role : 'admin',
    });

    if (currentUser) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          userId: currentUser.id,
          title: `Reserva ${status === 'confirmed' ? 'Aceptada' : status === 'rejected' ? 'Rechazada' : status}`,
          message: `La reserva #${reservationId.slice(-6)} ha sido actualizada a ${status}.`,
          type: status === 'confirmed' ? 'success' : 'warning',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    }

    if (status === 'rejected' && targetReservation) {
      // Notificar al arrendatario sobre el rechazo y la devolución del dinero
      setNotifications((prev) => [
        {
          id: `notif-refund-${Date.now()}`,
          userId: targetReservation.tenantId,
          title: 'Reserva Rechazada y Reembolso Iniciado',
          message: `El propietario ha rechazado la reserva #${reservationId.slice(-6)}. Se ha iniciado el reembolso total de tu pago a tu método original.`,
          type: 'warning',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
      
      // También notificar al arrendador explícitamente como se solicitó
      setNotifications((prev) => [
        {
          id: `notif-owner-refund-${Date.now()}`,
          userId: targetReservation.ownerId,
          title: 'Contrato Rechazado',
          message: `Has rechazado el contrato de la reserva #${reservationId.slice(-6)}. Se devolverá el dinero íntegramente al arrendatario.`,
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    }
  };

  // Acciones exclusivas del Administrador
  const adminApproveKyc = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, verificationStatus: 'verified' } : u))
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, verificationStatus: 'verified' } : null));
    }
    addAuditRecord('ADMIN_KYC_APPROVED', 'security', {
      targetUserId: userId,
      adminId: currentUser ? currentUser.id : 'admin',
    });
  };

  const adminRejectKyc = (userId: string, reason: string) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, verificationStatus: 'rejected' } : u))
    );
    addAuditRecord('ADMIN_KYC_REJECTED', 'security', {
      targetUserId: userId,
      adminId: currentUser ? currentUser.id : 'admin',
      reason,
    });
  };

  const adminToggleSpaceStatus = (spaceId: string, status: 'active' | 'paused' | 'pending_approval') => {
    setSpaces((prev) =>
      prev.map((s) => (s.id === spaceId ? { ...s, status, isVerified: status === 'active' } : s))
    );
    addAuditRecord('ADMIN_SPACE_STATUS_MODERATED', 'security', {
      spaceId,
      newStatus: status,
      adminId: currentUser ? currentUser.id : 'admin',
    });
  };

  const adminResolveDispute = (disputeId: string, resolution: 'resolved_refund' | 'resolved_owner', notes: string) => {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              status: resolution,
              resolutionNotes: notes,
              resolvedAt: new Date().toISOString(),
            }
          : d
      )
    );
    addAuditRecord('ADMIN_DISPUTE_RESOLVED', 'security', {
      disputeId,
      resolution,
      notes,
    });
  };

  const createDispute = (reservationId: string, reason: string) => {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;

    const newDispute: Dispute = {
      id: `disp-${Date.now()}`,
      reservationId,
      spaceTitle: res.spaceTitle,
      tenantName: res.tenantName,
      tenantRut: res.tenantRut,
      ownerName: res.ownerName,
      ownerRut: res.ownerRut || '14.258.963-7',
      amountClp: res.totalClp,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setDisputes((prev) => [newDispute, ...prev]);
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, disputeStatus: 'opened', disputeReason: reason } : r))
    );

    addAuditRecord('DISPUTE_OPENED', 'warning', {
      reservationId,
      tenantRut: res.tenantRut,
      reason,
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Gestión de Tarjetas y Billetera Bancaria
  const addSavedCard = (cardData: {
    cardBrand: 'visa' | 'mastercard' | 'redcompra';
    cardHolder: string;
    last4: string;
    expiryMonth: string;
    expiryYear: string;
    bankName: string;
    isDefault?: boolean;
  }) => {
    if (!currentUser) return;
    const newCard: SavedCard = {
      id: `card-${Date.now()}`,
      userId: currentUser.id,
      cardBrand: cardData.cardBrand,
      cardHolder: cardData.cardHolder.trim().toUpperCase(),
      last4: cardData.last4,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      bankName: cardData.bankName,
      isDefault: cardData.isDefault ?? false,
      createdAt: new Date().toISOString(),
    };

    setSavedCards((prev) => {
      let updated = prev;
      if (newCard.isDefault) {
        updated = updated.map((c) =>
          c.userId === currentUser.id ? { ...c, isDefault: false } : c
        );
      }
      return [newCard, ...updated];
    });

    addAuditRecord('CARD_REGISTERED', 'info', {
      cardBrand: newCard.cardBrand,
      last4: newCard.last4,
      bank: newCard.bankName,
    });
  };

  const deleteSavedCard = (cardId: string) => {
    if (!currentUser) return;
    setSavedCards((prev) => prev.filter((c) => c.id !== cardId));
    addAuditRecord('CARD_DELETED', 'info', { cardId });
  };

  const setDefaultCard = (cardId: string) => {
    if (!currentUser) return;
    setSavedCards((prev) =>
      prev.map((c) => {
        if (c.userId !== currentUser.id) return c;
        return { ...c, isDefault: c.id === cardId };
      })
    );
    addAuditRecord('CARD_SET_DEFAULT', 'info', { cardId });
  };

  // Auxiliar para saber si el usuario actual tiene permisos de propietario
  const isOwnerCapable = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role === 'owner' || (currentUser.role === 'admin' && currentUser.ownerTermsAccepted);
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        spaces,
        reservations,
        contracts,
        auditLogs,
        disputes,
        notifications,
        savedCards,
        visitRequests,
        requestVisit,
        quickVerifyUser,
        addSavedCard,
        deleteSavedCard,
        setDefaultCard,
        switchUser,
        login,
        logout,
        register,
        updateUserProfile,
        updateUserRole,
        upgradeTenantToOwner,
        createBooking,
        createSpace,
        updateSpace,
        deleteSpace,
        updateReservationStatus,
        adminApproveKyc,
        adminRejectKyc,
        adminToggleSpaceStatus,
        adminResolveDispute,
        createDispute,
        addAuditRecord,
        dismissNotification,
        markAllNotificationsRead,
        isOwnerCapable,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};
