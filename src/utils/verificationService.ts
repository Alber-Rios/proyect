import { validateRut } from './formatters.ts';

export interface CivilRegistryResult {
  valid: boolean;
  fullName?: string;
  rut?: string;
  documentStatus?: 'VIGENTE' | 'BLOQUEADO' | 'VENCIDO';
  errorMessage?: string;
}

export interface BiometricVerificationResult {
  success: boolean;
  similarityScore: number; // 0.0 to 1.0
  isLivenessConfirmed: boolean;
  isDuplicateDetected: boolean;
  duplicateCandidateId?: string;
  manualReviewRequired: boolean;
  confidenceTier: 'ALTA' | 'MEDIA' | 'BAJA' | 'RECHAZADA';
  details: string;
}

export interface CriminalRecordVerificationResult {
  valid: boolean;
  folio: string;
  issuedAt: string;
  recordClean: boolean; // Sin antecedentes inhabilitantes para arrendar/administrar espacios
  source: 'Servicio de Registro Civil e Identificación de Chile';
  digitalSignatureHash: string;
}

/**
 * Simulación de consulta a la base de datos del Registro Civil e Identificación de Chile
 */
export async function verifyChileanCivilRegistry(rut: string, documentSerial: string): Promise<CivilRegistryResult> {
  await new Promise((resolve) => setTimeout(resolve, 1400));

  if (!validateRut(rut)) {
    return {
      valid: false,
      errorMessage: 'El RUT ingresado no es válido según el algoritmo del Registro Civil (Módulo 11).',
    };
  }

  if (!documentSerial || documentSerial.trim().length < 6) {
    return {
      valid: false,
      errorMessage: 'El número de serie/documento de la cédula de identidad debe contener al menos 6 caracteres alfanuméricos.',
    };
  }

  return {
    valid: true,
    rut,
    documentStatus: 'VIGENTE',
    fullName: 'CIUDADANO CHILENO REGISTRADO',
  };
}

/**
 * Simulación de verificación biométrica facial con motor 1:N y detección de vivacidad (Liveness)
 */
export async function runBiometricFacialMatch(
  capturedPhotoBase64OrUrl: string,
  isRegulatoryExceptionRequested = false
): Promise<BiometricVerificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 1800));

  if (isRegulatoryExceptionRequested) {
    return {
      success: true,
      similarityScore: 0,
      isLivenessConfirmed: false,
      isDuplicateDetected: false,
      manualReviewRequired: true,
      confidenceTier: 'MEDIA',
      details: 'Derivado a revisión manual humana por excepción regulatoria o solicitud expresa de privacidad.',
    };
  }

  // Simulación: Genera un score de coincidencia biométrica alto (94% - 99%)
  const similarityScore = +(0.93 + Math.random() * 0.06).toFixed(3);
  const isLivenessConfirmed = true;
  const isDuplicateDetected = false;

  return {
    success: true,
    similarityScore,
    isLivenessConfirmed,
    isDuplicateDetected,
    manualReviewRequired: false,
    confidenceTier: 'ALTA',
    details: 'Biometría validada exitosamente. Coincidencia facial 1:1 positiva contra Cédula de Identidad y sin duplicados en base 1:N.',
  };
}

export async function simulateCivilRegistryCheck(rut: string, documentSerial: string) {
  const res = await verifyChileanCivilRegistry(rut, documentSerial);
  return {
    isValid: res.valid,
    fullName: res.fullName,
    errorMessage: res.errorMessage,
  };
}

export async function simulateBiometricMatch(photo1: string, photo2: string) {
  const res = await runBiometricFacialMatch(photo1);
  return {
    score: Math.round(res.similarityScore * 1000) / 10,
    livenessPassed: res.isLivenessConfirmed,
  };
}

export async function simulateAntiDuplicateCheck(hash: string) {
  return {
    isDuplicate: false,
    matchedCandidateId: undefined,
  };
}

/**
 * Simulación de verificación del Certificado de Antecedentes para Fines Especiales (Registro Civil de Chile)
 */
export async function verifyCriminalRecordDocument(documentCode: string): Promise<CriminalRecordVerificationResult> {
  await new Promise((resolve) => setTimeout(resolve, 1600));

  const cleanCode = documentCode.trim().toUpperCase();
  const hash = `SRCEL-ESP-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;

  return {
    valid: true,
    folio: cleanCode || 'FE-984210384',
    issuedAt: new Date().toLocaleDateString('es-CL'),
    recordClean: true,
    source: 'Servicio de Registro Civil e Identificación de Chile',
    digitalSignatureHash: hash,
  };
}

export async function simulateCriminalRecordCheck(rut: string) {
  const res = await verifyCriminalRecordDocument(rut);
  return {
    isClean: res.recordClean,
    certificateFolio: res.folio,
    status: 'SIN_ANTECEDENTES',
  };
}
