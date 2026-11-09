/* Geometría sobre la Tierra, tomada como una esfera: distancia, rumbo y el círculo de precisión de una posición. */

const EARTH_KM = 6371;

/* Metros por grado: de latitud, y de longitud en el ecuador (se multiplica por cos(latitud)). */
const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320;

/* Lados del polígono que dibuja un círculo. */
const CIRCLE_STEPS = 64;

export interface Point { lon: number; lat: number }

const rad = (deg: number) => (deg * Math.PI) / 180;

/* Distancia de a a b, en km (fórmula del haversine). */
export function distanceKm(a: Point, b: Point): number {
  const [la, lb, dLon] = [rad(a.lat), rad(b.lat), rad(b.lon - a.lon)];
  const h = Math.sin((lb - la) / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/* Rumbo inicial de a hacia b, como uno de los nombres de dirs, repartidos por la rosa desde el norte.
   Ej.: con dirs = N NE E SE S SO O NO, de Puerto Concha a Congo Mirador → N. */
export function heading(a: Point, b: Point, dirs: string[]): string {
  const [la, lb, dLon] = [rad(a.lat), rad(b.lat), rad(b.lon - a.lon)];
  const y = Math.sin(dLon) * Math.cos(lb);
  const x = Math.cos(la) * Math.sin(lb) - Math.sin(la) * Math.cos(lb) * Math.cos(dLon);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  return dirs[Math.round(bearing / (360 / dirs.length)) % dirs.length];
}

/* Un círculo de radio r metros alrededor de un punto, como polígono GeoJSON. */
export function circle(center: Point, radiusM: number) {
  const ring = [...Array(CIRCLE_STEPS + 1).keys()].map((i) => {
    const angle = (i / CIRCLE_STEPS) * 2 * Math.PI;
    const lon = center.lon + (radiusM / (M_PER_DEG_LON * Math.cos(rad(center.lat)))) * Math.cos(angle);
    const lat = center.lat + (radiusM / M_PER_DEG_LAT) * Math.sin(angle);

    return [lon, lat];
  });

  return { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [ring] } };
}
