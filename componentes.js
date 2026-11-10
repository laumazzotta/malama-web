#!/usr/bin/env node
/*
 * Componentes compartidos (navbar, menú mobile, footer, formulario de contacto y
 * etiquetas de idioma del <head>).
 *
 * El sitio está en dos idiomas: las páginas en español en site/ y sus versiones en
 * inglés, con el mismo nombre de archivo, en site/en/. La fuente de cada componente
 * está en componentes/<nombre>.html (español) y componentes/en/<nombre>.html (inglés).
 * En las páginas, el componente vive entre dos marcadores:
 *
 *   <!-- componente: navbar -->
 *   ...esto lo escribe el script, no editarlo a mano...
 *   <!-- /componente: navbar -->
 *
 * Uso (desde la carpeta site/):
 *   node componentes.js           actualiza todas las páginas una vez
 *   node componentes.js --watch   y además lo repite cada vez que se guarda un componente
 *
 * Sintaxis dentro de los componentes:
 *   {{#landing}}...{{/landing}}   solo en las landings (todas las páginas menos index.html)
 *   {{^landing}}...{{/landing}}   solo en la home
 *   {{inicio}}                    "" en la home, "index.html" en las landings (para links a #secciones)
 *   {{raiz}}                      "" en español, "../" en inglés (para assets/, css/, js/)
 *   {{alterno}}                   link a la misma página en el otro idioma (switch ES / EN)
 *   {{url_es}} {{url_en}}         URLs absolutas de la página en cada idioma (hreflang)
 *   {{#dominio}}...{{/dominio}}   solo si DOMINIO está definido
 *
 * Los marcadores aceptan parámetros: <!-- componente: formulario tipo="Branding" -->
 * marca esa opción del select "Tipo de proyecto" como preseleccionada.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIR = path.join(ROOT, 'componentes');
const PAGINAS = ['index.html', 'diseno-web.html', 'ecommerce.html', 'email-marketing.html', 'branding.html', 'hoteleria.html'];
const HOME = 'index.html';
// Dominio publicado, sin barra final (p. ej. 'https://malamadigital.com'). Si queda vacío no se escriben los hreflang.
const DOMINIO = 'https://malama.com.ar';
const IDIOMAS = [
  { lang: 'es', carpeta: '', componentes: DIR, raiz: '', otra: 'en/' },
  { lang: 'en', carpeta: 'en/', componentes: path.join(DIR, 'en'), raiz: '../', otra: '../' },
];

const MARCADOR = /^([ \t]*)<!-- componente: ([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->[\s\S]*?<!-- \/componente: \2 -->/gm;

function leerParams(texto) {
  const params = {};
  for (const [, k, v] of texto.matchAll(/([\w-]+)="([^"]*)"/g)) params[k] = v;
  return params;
}

function render(plantilla, vars) {
  let html = plantilla
    .replace(/\{\{([#^])([\w-]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g, (_, tipo, k, cuerpo) =>
      (tipo === '#') === Boolean(vars[k]) ? cuerpo : '')
    .replace(/\{\{([\w-]+)\}\}/g, (_, k) => vars[k] ?? '');
  if (vars.tipo) {
    const opcion = `<option>${vars.tipo}</option>`;
    if (!html.includes(opcion)) throw new Error(`no existe la opción "${vars.tipo}" en el formulario`);
    html = html.replace(opcion, `<option selected>${vars.tipo}</option>`);
  }
  return html;
}

function indentar(html, sangria) {
  // Las líneas que quedan solo con espacios (p. ej. un {{#landing}} vacío en la home) se eliminan.
  return html.replace(/\s+$/, '').split('\n').filter(l => !/^[ \t]+$/.test(l)).map(l => (l ? sangria + l : l)).join('\n');
}

function construir() {
  const cache = {};
  const plantilla = archivo => {
    if (!(archivo in cache)) cache[archivo] = fs.readFileSync(archivo, 'utf8');
    return cache[archivo];
  };
  for (const idioma of IDIOMAS) {
    for (const pagina of PAGINAS) {
      const relativo = idioma.carpeta + pagina;
      const archivo = path.join(ROOT, relativo);
      if (!fs.existsSync(archivo)) continue;
      const antes = fs.readFileSync(archivo, 'utf8');
      const landing = pagina !== HOME;
      const ruta = pagina === HOME ? '' : pagina;
      const despues = antes.replace(MARCADOR, (_, sangria, nombre, params) => {
        const vars = {
          landing,
          inicio: landing ? 'index.html' : '',
          raiz: idioma.raiz,
          alterno: idioma.otra + pagina,
          dominio: DOMINIO,
          url_es: `${DOMINIO}/${ruta}`,
          url_en: `${DOMINIO}/en/${ruta}`,
          ...leerParams(params),
        };
        const cuerpo = indentar(render(plantilla(path.join(idioma.componentes, `${nombre}.html`)), vars), sangria);
        return `${sangria}<!-- componente: ${nombre}${params} -->\n${cuerpo}\n${sangria}<!-- /componente: ${nombre} -->`;
      });
      if (despues !== antes) {
        fs.writeFileSync(archivo, despues);
        console.log(`  actualizado ${relativo}`);
      }
    }
  }
}

function construirSeguro() {
  try {
    construir();
  } catch (err) {
    console.error(`  error: ${err.message}`);
    if (!process.argv.includes('--watch')) process.exitCode = 1;
  }
}

construirSeguro();

if (process.argv.includes('--watch')) {
  let espera;
  fs.watch(DIR, { recursive: true }, () => {
    clearTimeout(espera);
    espera = setTimeout(construirSeguro, 100);
  });
  console.log('Mirando componentes/ — los cambios se copian a todas las páginas al guardar (Ctrl+C para salir).');
}
