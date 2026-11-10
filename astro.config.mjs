import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { photoRows } from './src/lib/photo-rows.ts';

/* PUBLIC_DEPLOY_TARGET=pages compila la vista previa de GitHub Pages, desplegada en
   https://<owner>.github.io/<repo>/. GitHub Actions define GITHUB_REPOSITORY ("owner/repo"),
   así que no hay que editar nada aquí. Sin la variable, el sitio se compila para la raíz (/),
   que es lo que necesitan el hosting final y la app.
   Solo el usuario va en minúsculas (el dominio github.io siempre lo está): la ruta del repo
   distingue mayúsculas, así que se deja tal cual (/LabCatatumboProject/). */
const pages = process.env.PUBLIC_DEPLOY_TARGET === 'pages';
const [owner = 'owner', repo = 'catatumbo-web'] = (process.env.GITHUB_REPOSITORY ?? '').split('/').filter(Boolean);

export default defineConfig({
  output: 'static',
  site: pages ? `https://${owner.toLowerCase()}.github.io` : undefined,
  base: pages ? `/${repo}` : '/',
  trailingSlash: 'always',
  /* Fotos de las páginas Markdown al lado del texto, alternando de lado (src/lib/photo-rows.ts). */
  markdown: { processor: satteri({ hastPlugins: [photoRows] }) },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en', 'de', 'fr', 'it'],
    routing: { prefixDefaultLocale: true },
  },
});
