/* El tiempo de ahora mismo en Congo Mirador (Open-Meteo), para el widget de la barra superior.
   Guarda la última lectura en localStorage (ct.now) y no vuelve a pedirla hasta pasados 15 minutos,
   así navegar entre páginas no repite la petición. */
import { CONGO_MIRADOR, ZONE } from './lake';
import { isStorm } from './wmo';

const API = `https://api.open-meteo.com/v1/forecast?latitude=${CONGO_MIRADOR.lat}&longitude=${CONGO_MIRADOR.lon}`
  + `&current=temperature_2m,is_day,weather_code&timezone=${encodeURIComponent(ZONE)}`;

const STORE = 'ct.now';
const FRESH_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 15000;

/* Qué icono va junto a la temperatura. El valor es el data-sky del icono en NowWidget. */
const SKY = { Day: 'day', Night: 'night', Storm: 'storm' } as const;
export type Sky = (typeof SKY)[keyof typeof SKY];

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
  if (isStorm(code)) {
    return SKY.Storm;
  }

  return isDay ? SKY.Day : SKY.Night;
}

/* Petición en curso: si se pide otra vez antes de que responda, se reutiliza en vez de repetirla. */
let pending: Promise<Now | null> | null = null;

/* La temperatura y el cielo de ahora. null si no hay conexión ni lectura reciente. */
export async function fetchNow(): Promise<Now | null> {
  const hit = cached();
  if (hit) {
    return hit;
  }

  pending ??= download().finally(() => { pending = null; });
  return pending;
}

async function download(): Promise<Now | null> {
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
    try {
      localStorage.setItem(STORE, JSON.stringify({ at: Date.now(), now }));
    } catch {
      /* Sin almacenamiento: se muestra igual, pero no se guarda. */
    }

    return now;
  } catch {
    return null;
  }
}
