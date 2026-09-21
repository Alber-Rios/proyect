/**
 * Utilidades para formateo de moneda CLP y validación de RUT chileno (Módulo 11)
 */

export function formatClp(amount: number): string {
  if (isNaN(amount)) return 'CLP 0';
  const rounded = Math.round(amount);
  return `CLP ${rounded.toLocaleString('es-CL')}`;
}

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(rawRut: string): string {
  const cleaned = cleanRut(rawRut);
  if (!cleaned) return '';
  if (cleaned.length <= 1) return cleaned;

  const dv = cleaned.slice(-1);
  let body = cleaned.slice(0, -1);

  // Agrega puntos cada 3 dígitos
  let formattedBody = '';
  while (body.length > 3) {
    formattedBody = '.' + body.slice(-3) + formattedBody;
    body = body.slice(0, -3);
  }
  formattedBody = body + formattedBody;

  return `${formattedBody}-${dv}`;
}

export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 8 || cleaned.length > 9) {
    return false;
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();

  // Verificación de solo números en el cuerpo
  if (!/^\d+$/.test(body)) {
    return false;
  }

  // Algoritmo Módulo 11
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedDv = '';

  if (remainder === 11) {
    expectedDv = '0';
  } else if (remainder === 10) {
    expectedDv = 'K';
  } else {
    expectedDv = remainder.toString();
  }

  return dv === expectedDv;
}

export function formatDateCl(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function getSpaceRateInfo(space: {
  priceUnit?: 'hour' | 'day' | 'month';
  rentalModality?: 'por_hora' | 'por_dia' | 'mensual' | 'abierto';
  pricePerHour?: number;
  pricePerDay: number;
  pricePerMonth?: number;
}): {
  amount: number;
  unit: 'hora' | 'día' | 'mes' | 'flexible';
  unitLabel: string;
  formatted: string;
  isFlexible?: boolean;
} {
  if (space.rentalModality === 'abierto') {
    if (space.pricePerHour) {
      return {
        amount: space.pricePerHour,
        unit: 'flexible',
        unitLabel: '/ hr • Flexible',
        formatted: `${formatClp(space.pricePerHour)} / hr`,
        isFlexible: true,
      };
    }
    return {
      amount: space.pricePerDay,
      unit: 'flexible',
      unitLabel: '/ día • Flexible',
      formatted: `${formatClp(space.pricePerDay)} / día`,
      isFlexible: true,
    };
  }

  const modality = space.priceUnit || (space.rentalModality === 'por_hora' ? 'hour' : space.rentalModality === 'mensual' ? 'month' : 'day');

  if (modality === 'hour' && space.pricePerHour) {
    return {
      amount: space.pricePerHour,
      unit: 'hora',
      unitLabel: '/ hr',
      formatted: `${formatClp(space.pricePerHour)} / hr`,
    };
  }

  if (modality === 'month' && (space.pricePerMonth || space.pricePerDay)) {
    const amount = space.pricePerMonth || space.pricePerDay;
    return {
      amount,
      unit: 'mes',
      unitLabel: '/ mes',
      formatted: `${formatClp(amount)} / mes`,
    };
  }

  return {
    amount: space.pricePerDay,
    unit: 'día',
    unitLabel: '/ día',
    formatted: `${formatClp(space.pricePerDay)} / día`,
  };
}

/**
 * Retorna la fecha actual en formato ISO YYYY-MM-DD según zona horaria local
 */
export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna una fecha ISO desplazada N días a partir de hoy
 */
export function getOffsetDateIso(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
