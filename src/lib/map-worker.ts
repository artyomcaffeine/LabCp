/* El worker de MapLibre, como punto de entrada propio: Vite lo compila aparte y lo publica con extensión .js
   (con su .mjs original, el servidor de la app en iOS no sabría que es JavaScript y el worker no arrancaría).
   Se usa su export para que el build no lo descarte: MapLibre declara sus dist/*.mjs sin efectos secundarios. */
// @ts-expect-error: el archivo del worker no trae tipos.
import MapLibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs';

(self as unknown as { MapLibreWorker: unknown }).MapLibreWorker = MapLibreWorker;
