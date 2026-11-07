/* El tiempo de ahora mismo en Congo Mirador (Open-Meteo), para el widget de la barra superior.
   Guarda la última lectura en localStorage (ct.now) y no vuelve a pedirla hasta pasados 15 minutos,
   así navegar entre páginas no repite la petición. */

/* Hora oficial de la zona del lago. */
export const ZONE = 'America/Caracas';

const API = 'https://api.open-meteo.com/v1/forecast?latitude=9.3859&longitude=-71.8005'
  + `&current=temperature_2m,is_day,weather_code&timezone=${encodeURIComponent(ZONE)}`;

const STORE = 'ct.now';
const FRESH_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 15000;

/* Códigos WMO de tormenta: 95 tormenta, 96 y 99 tormenta con granizo. */
const STORM_CODES = [95, 96, 99];

/* Qué icono va junto a la temperatura. */
export const Sky = { Day: 'day', Night: 'night', Storm: 'storm' } as const;
export type Sky = (typeof Sky)[keyof typeof Sky];

export interface Now { temp: number; sky: Sky }
interface Saved { at: number; now: Now }

/* La lectura guardada, si tiene menos de 15 minutos. */
function cached(): Now | null {
  try {
    const saved: Saved | null = JSON.parse(localStorage.getItem(STORE) ?? 'null');
    if (!saved || Date.now() - saved.at > FRESH_MS) {
      return null;
    }

    return saved.now;
  } catch {
    return null;
  }
}

function skyOf(code: number, isDay: number): Sky {
  if (STORM_CODES.includes(code)) {
    return Sky.Storm;
  }

  return isDay ? Sky.Day : Sky.Night;
}

/* La temperatura y el cielo de ahora. null si no hay conexión ni lectura reciente. */
export async function fetchNow(): Promise<Now | null> {
  const hit = cached();
  if (hit) {
    return hit;
  }

  try {
    const res = await fetch(API, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      return null;
    }

    const current = (await res.json())?.current;
    if (typeof current?.temperature_2m !== 'number') {
      return null;
    }

    const now: Now = { temp: current.temperature_2m, sky: skyOf(current.weather_code, current.is_day) };
    try { localStorage.setItem(STORE, JSON.stringify({ at: Date.now(), now })); } catch {}
    return now;
  } catch {
    return null;
  }
}
