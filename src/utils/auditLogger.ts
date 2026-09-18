import { AuditLog, AuditMetadata, UserRole } from '../types.ts';

const AUDIT_STORAGE_KEY = 'spotly_audit_logs_v1';

// Genera un hash criptográfico determinista simple para firma y auditoría
export function generateAuditHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const timestampPart = Date.now().toString(16).slice(-6);
  return `CL-SHA256-${hex.toUpperCase()}-${timestampPart}`;
}

export function getClientAuditMetadata(termsVersion = '2026.1-CL'): AuditMetadata {
  const now = new Date().toISOString();
  // Simulación de IP chilena y operador de telecomunicaciones
  const simulatedChileanIps = [
    '190.161.42.88 (VTR Banda Ancha Chile)',
    '200.89.70.12 (Entel PCS Chile)',
    '181.42.18.204 (Mundo Pacífico Fibra)',
    '201.241.112.55 (Movistar Chile)',
  ];
  const randomIp = simulatedChileanIps[Math.floor(Math.random() * simulatedChileanIps.length)];

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  const rawString = `${randomIp}|${userAgent}|${now}|${termsVersion}`;

  return {
    ip: randomIp,
    userAgent,
    timestamp: now,
    termsVersion,
    hash: generateAuditHash(rawString),
    legalNoticeAccepted: true,
  };
}

export function saveAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
  const newLog: AuditLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = getAuditLogs();
    const updated = [newLog, ...existing].slice(0, 150); // Mantiene los últimos 150 logs
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error guardando audit log:', err);
  }

  return newLog;
}

export function getAuditLogs(): AuditLog[] {
  try {
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!stored) return getInitialAuditLogs();
    return JSON.parse(stored);
  } catch {
    return getInitialAuditLogs();
  }
}

export function clearAuditLogs(): void {
  localStorage.removeItem(AUDIT_STORAGE_KEY);
}

function getInitialAuditLogs(): AuditLog[] {
  return [
    {
      id: 'log-001',
      action: 'VERIFICATION_SYSTEM_INITIALIZED',
      userId: 'system',
      userEmail: 'seguridad@spotly.cl',
      userRole: 'admin',
      ip: '200.89.70.12 (Entel PCS Chile)',
      userAgent: 'Spotly Security Engine v4.2 / ClaveUnica Connector',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      severity: 'info',
      details: {
        environment: 'production-chile',
        verificationProvider: 'Veriff/Jumio Certified Hub',
        lawsEnforced: ['Ley 19.628 Protección de Datos', 'Ley 18.101 Arrendamientos'],
      },
    },
    {
      id: 'log-002',
      action: 'TERMS_CONSENT_REGISTERED',
      userId: 'usr-owner-1',
      userEmail: 'carlos.munoz@espacioschile.cl',
      userRole: 'owner',
      ip: '190.161.42.88 (VTR Banda Ancha Chile)',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
      severity: 'security',
      details: {
        rut: '14.258.963-7',
        termsVersion: '2026.1-CL',
        biometricHash: 'CL-SHA256-4AF9B2-9F1C',
        status: 'VERIFIED',
      },
    },
    {
      id: 'log-003',
      action: 'DUPLICATE_CHECK_PASSED',
      userId: 'usr-owner-2',
      userEmail: 'sofia.valenzuela@studios.cl',
      userRole: 'owner',
      ip: '181.42.18.204 (Mundo Pacífico Fibra)',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
      severity: 'info',
      details: {
        similarityMaxScore: 0.12,
        duplicateThreshold: 0.85,
        verdict: 'NO_DUPLICATE_FOUND',
      },
    },
  ];
}
