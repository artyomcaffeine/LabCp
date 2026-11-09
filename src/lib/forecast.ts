/* El pronóstico de las próximas noches en Congo Mirador, para la página "Tiempo y localización".

     Open-Meteo ──fetchOutlook()──▶ localStorage (ct.forecast) ──savedOutlook()──┐
          │                                                                     ▼
          └──────────────── nights(): una Night por noche ───────────▶ Outlook { at, nights }

   Sin conexión, savedOutlook() devuelve el último descargado, con su fecha. */
import { CONGO_MIRADOR, ZONE } from './lake';
import { isStorm } from './wmo';

const DAYS = 8;
const API = `https://api.open-meteo.com/v1/forecast?latitude=${CONGO_MIRADOR.lat}&longitude=${CONGO_MIRADOR.lon}`
  + `&hourly=weather_code,cape,precipitation_probability,wind_speed_10m&daily=sunset`
  + `&timezone=${encodeURIComponent(ZONE)}&forecast_days=${DAYS}`;

const STORE = 'ct.forecast';
const TIMEOUT_MS = 15000;

/* Una noche va de las 18:00 a las 05:59 del día siguiente, en hora del lago (la de la respuesta). */
const NIGHT_START = '18:00';
const NIGHT_HOURS = 12;
const NIGHTS = 7;

/* Tormenta: es una estimación, no un pronóstico de rayos.
   - probable: el modelo prevé tormenta, o mucha energía para tormentas (CAPE ≥ 1500 J/kg) y lluvia ≥ 50 %.
   - posible: energía moderada (CAPE ≥ 500 J/kg) y lluvia ≥ 30 %.
   - poco probable: el resto. */
const CAPE_HIGH = 1500;
const RAIN_HIGH = 50;
const CAPE_MID = 500;
const RAIN_MID = 30;

/* Probabilidad de tormenta. El valor es también el sufijo de la clase CSS (storm-high) y de la clave de texto (today.high). */
export const Storm = { High: 'high', Mid: 'mid', Low: 'low' } as const;
export type Storm = (typeof Storm)[keyof typeof Storm];

/* Una noche: fecha (2026-11-09), tormenta, lluvia (%) y viento (km/h) máximos, y la puesta de sol (18:21). */
export interface Night { date: string; storm: Storm; rain: number; wind: number; sunset: string }

/* Las noches de hoy en adelante y cuándo se descargó el pronóstico (ms). */
export interface Outlook { at: number; nights: Night[] }

type Forecast = {
  hourly: { time: string[]; weather_code: number[]; cape: number[]; precipitation_probability: number[]; wind_speed_10m: number[] };
  daily: { time: string[]; sunset: string[] };
};
interface Saved { at: number; data: Forecast }

/* La fecha de hoy en el lago, en el formato de la respuesta: 2026-11-09. */
function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(new Date());
}

export function isToday(date: string) {
  return date === today();
}

function stormOf(cape: number, rain: number): Storm {
  if (cape >= CAPE_HIGH && rain >= RAIN_HIGH) {
    return Storm.High;
  }

  if (cape >= CAPE_MID && rain >= RAIN_MID) {
    return Storm.Mid;
  }

  return Storm.Low;
}

/* Las noches del pronóstico, desde hoy. Se salta las que ya pasaron o no tienen sus 12 horas completas. */
function nights(f: Forecast): Night[] {
  const h = f.hourly;
  const from = today();
  const out: Night[] = [];

  for (const [d, date] of f.daily.time.entries()) {
    const start = h.time.indexOf(`${date}T${NIGHT_START}`);
    if (date < from || start < 0 || start + NIGHT_HOURS > h.time.length) {
      continue;
    }

    const hours = [...Array(NIGHT_HOURS).keys()].map((i) => start + i);
    const max = (values: number[]) => Math.max(...hours.map((i) => values[i] ?? 0));
    const rain = Math.round(max(h.precipitation_probability));
    const thunder = hours.some((i) => isStorm(h.weather_code[i]));
    const storm = thunder ? Storm.High : stormOf(max(h.cape), rain);
    const sunset = /T(\d\d:\d\d)$/.exec(f.daily.sunset[d] ?? '')?.[1] ?? '–';

    out.push({ date, storm, rain, wind: Math.round(max(h.wind_speed_10m)), sunset });
  }

  return out.slice(0, NIGHTS);
}

function valid(data: unknown): data is Forecast {
  const f = data as Forecast | null;
  return Array.isArray(f?.hourly?.time) && Array.isArray(f?.daily?.time);
}

/* El último pronóstico guardado, o null si no hay. */
export function savedOutlook(): Outlook | null {
  try {
    const saved: Saved | null = JSON.parse(localStorage.getItem(STORE) ?? 'null');
    if (!valid(saved?.data)) {
      return null;
    }

    return { at: saved.at, nights: nights(saved.data) };
  } catch {
    return null;
  }
}

/* Descarga el pronóstico y lo guarda. Lanza un error si no hay conexión o la respuesta no sirve. */
export async function fetchOutlook(): Promise<Outlook> {
  const res = await fetch(API, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`Open-Meteo ${res.status}`);
  }

  const data = await res.json();
  if (!valid(data)) {
    throw new Error('Open-Meteo: respuesta inesperada');
  }

  const saved: Saved = { at: Date.now(), data };
  try {
    localStorage.setItem(STORE, JSON.stringify(saved));
  } catch {
    /* Sin almacenamiento: se muestra igual, pero no se guarda. */
  }

  return { at: saved.at, nights: nights(data) };
}
