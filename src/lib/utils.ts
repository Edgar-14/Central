import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número de teléfono mexicano
 * @param phone - Número de teléfono en formato string
 * @returns Número formateado como (55) 1234-5678
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remover todos los caracteres que no sean dígitos
  const cleaned = phone.replace(/\D/g, '');
  
  // Si no tiene suficientes dígitos, devolver tal como está
  if (cleaned.length < 10) return phone;
  
  // Formatear como (XX) XXXX-XXXX para números de 10 dígitos
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // Para números más largos (con código de país), formatear como +XX (XX) XXXX-XXXX
  if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  
  // Para otros casos, devolver el número limpio con formato básico
  return cleaned;
}