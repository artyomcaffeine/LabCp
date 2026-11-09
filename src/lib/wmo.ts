/* Códigos meteorológicos WMO, los que devuelve Open-Meteo en weather_code. */

/* Tormenta: 95 tormenta, 96 y 99 tormenta con granizo. */
const STORM_CODES = [95, 96, 99];

export function isStorm(code: number) {
  return STORM_CODES.includes(code);
}
