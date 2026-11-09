/* El idioma que eligió el visitante, guardado en localStorage: la próxima vez que entre por la raíz del sitio,
   va directo a ese idioma (ver pages/index.astro). */
export const LANG_KEY = 'ct.lang';

export function rememberLang(lang: string) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* Sin almacenamiento (p. ej. modo privado): no se recuerda. */
  }
}
