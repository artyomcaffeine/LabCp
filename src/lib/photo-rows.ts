/* Fotos al lado del texto, como en kyoto.travel. Plugin de hast para Sätteri, el procesador de Markdown
   de Astro: recibe el árbol HTML de cada página Markdown y pone cada foto en una fila junto al texto de
   su sección. Las filas alternan de lado.

     ### Título                ┌───────────────────┬───────────────────┐
     Texto…            ──▶     │ ### Título        │                   │
     ![foto](…)                │ Texto…            │      [foto]       │
     *crédito*                 └───────────────────┴───────────────────┘
                               la fila siguiente:  [foto] │ texto

   La sección de una foto es lo que la precede hasta el último h3 (incluido) o h2 (excluido: el título
   de la sección sigue a todo el ancho). Una foto sin texto delante se queda como está.
   Los estilos están en site.css (.photo-row). Los archivos Markdown no cambian. */
import type { Element, Root, RootContent } from 'hast';
import type { HastPluginDefinition } from 'satteri';

/* Lado de la foto en la fila. El valor es la clase CSS. */
enum Side {
  Right = 'photo-right',
  Left = 'photo-left',
}

const ROW_CLASS = 'photo-row';
const TEXT_CLASS = 'photo-row-text';

/* Hasta aquí sube una sección: el título se queda dentro (h3) o fuera (h2, hr, otra fila). */
const OPENS_SECTION = ['h3'];
const ENDS_SECTION = ['h2', 'hr'];

const isElement = (node: RootContent): node is Element => node.type === 'element';
const isBlank = (node: RootContent) => node.type === 'text' && node.value.trim() === '';

/* Un párrafo con una imagen: la foto y su crédito (ver site.css). */
const isPhoto = (node: RootContent): node is Element =>
  isElement(node) && node.tagName === 'p' && node.children.some((c) => c.type === 'element' && c.tagName === 'img');

const isRow = (node: Element) => String(node.properties.className ?? '').includes(ROW_CLASS);

/* Corre al final, con el árbol entero: cambia los hijos de la raíz. Va antes que el plugin de imágenes
   de Astro, así que las fotos movidas se siguen optimizando. */
export const photoRows: HastPluginDefinition = {
  name: 'photo-rows',
  after(root, ctx) {
    ctx.replaceNode(root, { ...root, children: groupPhotos(root.children as RootContent[]) } as Root);
  },
};

/* Los hijos de la raíz, con cada foto metida en su fila. */
function groupPhotos(children: RootContent[]) {
  const out: RootContent[] = [];
  let rows = 0;

  for (const node of children) {
    if (!isPhoto(node)) {
      out.push(node);
      continue;
    }

    const text = takeSection(out);
    if (!text.some(isElement)) {
      out.push(...text, node);
      continue;
    }

    /* Alterna: la primera fila lleva la foto a la derecha, la segunda a la izquierda… */
    const side = rows % 2 === 0 ? Side.Right : Side.Left;
    rows++;
    out.push(row(text, node, side));
  }

  return out;
}

/* Saca del final de `out` los nodos de la sección de la foto. */
function takeSection(out: RootContent[]) {
  let start = out.length;

  while (start > 0) {
    const prev = out[start - 1];
    if (isElement(prev) && (ENDS_SECTION.includes(prev.tagName) || isRow(prev))) {
      break;
    }

    start--;
    if (isElement(prev) && OPENS_SECTION.includes(prev.tagName)) {
      break;
    }
  }

  /* Los saltos de línea entre bloques no cuentan como texto. */
  const section = out.splice(start);
  while (section.length > 0 && isBlank(section[0])) {
    out.push(section.shift()!);
  }
  return section;
}

/* <div class="photo-row photo-right"><div class="photo-row-text">…</div><p>foto</p></div> */
function row(text: RootContent[], photo: Element, side: Side): Element {
  const column: Element = { type: 'element', tagName: 'div', properties: { className: [TEXT_CLASS] }, children: text as Element[] };
  return { type: 'element', tagName: 'div', properties: { className: [ROW_CLASS, side] }, children: [column, photo] };
}
