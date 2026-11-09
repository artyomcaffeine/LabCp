/* El estilo del mapa: Liberty, el estilo por defecto de OpenFreeMap, que se descarga al abrir el mapa. Si no se
   puede descargar (sin conexión), un estilo mínimo con el contorno de lago.json (Natural Earth), en los colores
   de Liberty. */
import type { GeoJSONSourceSpecification, StyleSpecification } from 'maplibre-gl';
import region from '../assets/map/lago.json';

const LIBERTY = 'https://tiles.openfreemap.org/styles/liberty';
const TIMEOUT_MS = 10000;

/* De dónde sale el estilo. */
export const Basemap = { Online: 'online', Offline: 'offline' } as const;
export type Basemap = (typeof Basemap)[keyof typeof Basemap];

export async function loadBasemap(): Promise<{ style: StyleSpecification; source: Basemap }> {
  try {
    const res = await fetch(LIBERTY, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.ok) {
      return { style: await res.json(), source: Basemap.Online };
    }
  } catch {
    /* Sin conexión o sin respuesta: el estilo de respaldo. */
  }

  return { style: fallback(), source: Basemap.Offline };
}

function fallback(): StyleSpecification {
  const kind = (k: string) => ['==', ['get', 'kind'], k] as ['==', ['get', string], string];

  return {
    version: 8,
    sources: { region: { type: 'geojson', data: region as GeoJSONSourceSpecification['data'], attribution: 'Natural Earth' } },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#f8f4f0' } },
      { id: 'water', type: 'fill', source: 'region', filter: kind('water'), paint: { 'fill-color': 'rgb(158,189,255)' } },
      { id: 'river', type: 'line', source: 'region', filter: kind('river'), paint: { 'line-color': '#a0c8f0', 'line-width': 1.2 } },
      { id: 'border', type: 'line', source: 'region', filter: kind('border'), paint: { 'line-color': 'hsl(248,1%,41%)', 'line-width': 1, 'line-dasharray': [3, 2] } },
    ],
  };
}
