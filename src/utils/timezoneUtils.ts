import { toZonedTime, format } from 'date-fns-tz';

// Map country codes to IANA timezone identifiers
// This handles DST automatically through the timezone database
const COUNTRY_TIMEZONE_MAP: { [key: string]: string } = {
  'PL': 'Europe/Warsaw',          // Poland
  'US': 'America/New_York',       // USA (Eastern)
  'GB': 'Europe/London',          // United Kingdom
  'DE': 'Europe/Berlin',          // Germany
  'FR': 'Europe/Paris',           // France
  'ES': 'Europe/Madrid',          // Spain
  'IT': 'Europe/Rome',            // Italy
  'NL': 'Europe/Amsterdam',       // Netherlands
  'SE': 'Europe/Stockholm',       // Sweden
  'NO': 'Europe/Oslo',            // Norway
  'DK': 'Europe/Copenhagen',      // Denmark
  'FI': 'Europe/Helsinki',        // Finland
  'JP': 'Asia/Tokyo',             // Japan
  'AU': 'Australia/Sydney',       // Australia (Eastern)
  'BR': 'America/Sao_Paulo',      // Brazil
  'CA': 'America/Toronto',        // Canada (Eastern)
  'CH': 'Europe/Zurich',          // Switzerland
  'AT': 'Europe/Vienna',          // Austria
  'BE': 'Europe/Brussels',        // Belgium
  'CZ': 'Europe/Prague',          // Czech Republic
  'PT': 'Europe/Lisbon',          // Portugal
  'GR': 'Europe/Athens',          // Greece
  'IE': 'Europe/Dublin',          // Ireland
  'NZ': 'Pacific/Auckland',       // New Zealand
  'IN': 'Asia/Kolkata',           // India
  'CN': 'Asia/Shanghai',          // China
  'KR': 'Asia/Seoul',             // South Korea
  'MX': 'America/Mexico_City',    // Mexico
  'AR': 'America/Argentina/Buenos_Aires', // Argentina
  'ZA': 'Africa/Johannesburg',    // South Africa
  'RU': 'Europe/Moscow',          // Russia (Moscow)
  'TR': 'Europe/Istanbul',        // Turkey
  'SG': 'Asia/Singapore',         // Singapore
  'HK': 'Asia/Hong_Kong',         // Hong Kong
  'TH': 'Asia/Bangkok',           // Thailand
  'MY': 'Asia/Kuala_Lumpur',      // Malaysia
  'ID': 'Asia/Jakarta',           // Indonesia
  'PH': 'Asia/Manila',            // Philippines
  'VN': 'Asia/Ho_Chi_Minh',       // Vietnam
};

/**
 * Get IANA timezone identifier for a country code
 * @param countryCode Two-letter ISO country code (e.g., 'PL', 'US')
 * @returns IANA timezone identifier (e.g., 'Europe/Warsaw')
 */
export const getTimezoneForCountry = (countryCode: string): string => {
  return COUNTRY_TIMEZONE_MAP[countryCode] || 'UTC';
};

/**
 * Convert UTC timestamp to local time based on country code
 * Automatically handles DST transitions
 * @param utcTimestamp ISO 8601 UTC timestamp string
 * @param countryCode Two-letter ISO country code
 * @returns Object with local Date and formatted string
 */
export const convertUtcToLocalTime = (
  utcTimestamp: string,
  countryCode: string
): { date: Date; formatted: string } => {
  const utcDate = new Date(utcTimestamp);
  const timezone = getTimezoneForCountry(countryCode);

  // Convert UTC to the local timezone (handles DST automatically)
  const localDate = toZonedTime(utcDate, timezone);

  // Format the date as "YYYY-MM-DD HH:mm" in the local timezone
  const formatted = format(localDate, 'yyyy-MM-dd HH:mm', { timeZone: timezone });

  return { date: localDate, formatted };
};
