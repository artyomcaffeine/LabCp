/* Las páginas de la guía: un archivo por página e idioma, en src/content/pages/<lang>/.
   El nombre del archivo es la URL de la página (es/relampago.md → /es/relampago/).
   `key` es igual en todos los idiomas y vincula las traducciones de una página. */
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: ({ image }) => z.object({
    key: z.enum(['lightning', 'visit', 'tours', 'places', 'history', 'today', 'privacy']),
    title: z.string(),
    description: z.string(),
    /* Posición en el menú y en la página de inicio. */
    order: z.number(),
    /* false: la página no sale en el menú ni en la portada, solo se enlaza a mano (la de privacidad, desde el pie). */
    menu: z.boolean().default(true),
    /* Foto opcional que se muestra bajo el banner de la página. */
    photo: image().optional(),
    photoAlt: z.string().optional(),
    /* true mientras una traducción espera la revisión de un hablante nativo. */
    draft_translation: z.boolean().optional(),
  }),
});

/* Operadores de tours de la zona: una lista para los 4 idiomas, en src/content/tours.yaml.
   Se muestra al final de la página con key 'tours' (components/TourList.astro). */
const tours = defineCollection({
  loader: file('./src/content/tours.yaml'),
  schema: z.object({
    name: z.string(),
    url: z.url(),
    /* Ciudad o pueblo desde donde sale la excursión. */
    base: z.string(),
    /* Idiomas del guía, como códigos ISO: [es, en]. */
    langs: z.array(z.string()),
    /* Última vez que alguien comprobó el enlace y los datos. */
    reviewed: z.coerce.date(),
    /* Nota corta opcional por idioma; si falta en un idioma, no se muestra. */
    note: z.object({ es: z.string(), en: z.string(), de: z.string(), fr: z.string() }).partial().optional(),
  }),
});

export const collections = { pages, tours };
