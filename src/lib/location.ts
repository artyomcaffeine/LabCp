/* La posición del visitante, con la máxima precisión del teléfono. En la app la da @capacitor/geolocation
   (con los permisos nativos); en la web, el mismo plugin usa la del navegador. No se guarda ni se envía. */
import { Geolocation } from '@capacitor/geolocation';

export interface Fix { lon: number; lat: number; accuracy: number }

/* Por qué no hay posición. */
export const LocateError = { Denied: 'denied', Unavailable: 'unavailable' } as const;
export type LocateError = (typeof LocateError)[keyof typeof LocateError];

/* Permiso denegado: PERMISSION_DENIED (1) en el navegador; denegado o restringido en la app. */
const BROWSER_DENIED = 1;
const APP_DENIED = 'OS-PLUG-GLOC-0003';
const APP_RESTRICTED = 'OS-PLUG-GLOC-0008';
const DENIED_CODES: (number | string)[] = [BROWSER_DENIED, APP_DENIED, APP_RESTRICTED];

const OPTIONS = { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 };

function errorOf(err: unknown): LocateError {
  const code = (err as { code?: number | string } | null)?.code;
  if (code !== undefined && DENIED_CODES.includes(code)) {
    return LocateError.Denied;
  }

  return LocateError.Unavailable;
}

/* Sigue la posición y llama a onFix con cada lectura. Si falla antes de la primera, deja de seguirla y llama a
   onFail; después, un fallo suelto (p. ej. sin señal un momento) se ignora. Devuelve la función que la detiene. */
export async function watchFix(onFix: (fix: Fix) => void, onFail: (error: LocateError) => void): Promise<() => void> {
  let id: string | null = null;
  let fixed = false;
  let failed = false;

  const stop = () => {
    if (!id) {
      return;
    }

    Geolocation.clearWatch({ id });
    id = null;
  };

  try {
    id = await Geolocation.watchPosition(OPTIONS, (position, err) => {
      if (position && !err) {
        fixed = true;
        onFix({ lon: position.coords.longitude, lat: position.coords.latitude, accuracy: position.coords.accuracy });
        return;
      }

      if (fixed) {
        return;
      }

      failed = true;
      stop();
      onFail(errorOf(err));
    });
  } catch (err) {
    onFail(errorOf(err));
  }

  /* Si falló antes de que watchPosition devolviera su id, la vigilancia sigue abierta: se cierra aquí. */
  if (failed) {
    stop();
  }

  return stop;
}
