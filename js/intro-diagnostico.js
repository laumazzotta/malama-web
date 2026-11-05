/* Intro · diagnóstico — Malama Digital
   Mueve la portada y los cuatro problemas con el scroll:
   - dibuja el aro y apaga el degradé del título
   - revela subtítulo y bajada por etapas
   - suelta los cuatro orbes y los lleva a la marca de su problema
   - revela la solución dentro de cada paso

   Uso: importalo y llamá a initIntroDiagnostico() una vez, o dejá que
   se inicialice solo al cargar el DOM (ver el final del archivo).        */

export function initIntroDiagnostico() {
  const reducido = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducido) return () => {};

  const portada = document.querySelector('[data-dx-portada]');
  const pasos = Array.prototype.slice.call(document.querySelectorAll('[data-dx-paso]'));
  const aro = document.querySelector('.dx-aro circle');
  const aroSvg = document.querySelector('.dx-aro');
  const orbes = Array.prototype.slice.call(document.querySelectorAll('.dx-orbe'));
  const angulos = [14, 104, 198, 292];
  const LARGO_ARO = 1684; // 2 · π · 268, el radio del círculo del SVG

  if (!portada && !pasos.length) return () => {};

  let pedido = null;

  const medir = () => {
    pedido = null;

    if (portada) {
      const esc = portada.querySelector('.dx-escena');
      const rp = portada.getBoundingClientRect();
      const camino = portada.offsetHeight - (esc ? esc.offsetHeight : 0);

      if (camino > 0) {
        // 0 cuando la portada recién se fija, 1 cuando termina
        const q = Math.max(0, Math.min(1, (-rp.top) / camino));
        portada.style.setProperty('--dx-p', q.toFixed(3));
        portada.classList.toggle('f1', q > 0.10);
        portada.classList.toggle('f2', q > 0.34);
        portada.classList.toggle('f3', q > 0.72);

        if (aro) {
          aro.style.strokeDashoffset = (LARGO_ARO * (1 - Math.min(1, q * 1.3))).toFixed(1);
        }

        if (orbes.length && esc) {
          const caja = esc.getBoundingClientRect();
          const cx = caja.left + caja.width / 2;
          const cy = caja.top + caja.height / 2;
          const radio = (aroSvg ? aroSvg.getBoundingClientRect().width : 0) * 0.4467;

          // columna donde viven las marcas de los problemas
          const prim = pasos[0] && pasos[0].querySelector('.dx-ticks i');
          let colX = cx;
          if (prim) {
            const rp2 = prim.getBoundingClientRect();
            colX = rp2.left + rp2.width / 2;
          }
          const alto = window.innerHeight;

          orbes.forEach((orbe, i) => {
            const ang = (angulos[i] + q * 132) * Math.PI / 180;
            const ox = cx + radio * Math.sin(ang);
            const oy = cy - radio * Math.cos(ang);

            // salida escalonada: se van de a uno y la bajada se ve completa
            const inicio = 0.36 + i * 0.06;
            const salida = Math.max(0, Math.min(1, (q - inicio) / (1 - inicio)));
            const suave = salida < 0.5
              ? 2 * salida * salida
              : 1 - Math.pow(-2 * salida + 2, 2) / 2;

            let x, y, escala;
            if (salida >= 1) {
              // ya salió de cuadro: queda pegado a la marca de su problema
              const paso = pasos[i];
              const marca = paso && paso.querySelectorAll('.dx-ticks i')[i];
              if (marca) {
                const r = marca.getBoundingClientRect();
                x = r.left + r.width / 2;
                y = r.top + r.height / 2;
              } else {
                x = colX;
                y = alto + 40;
              }
              escala = 0.69;
            } else {
              x = ox + (colX - ox) * suave;
              y = oy + (alto + 40 + i * 26 - oy) * suave;
              escala = 1 - 0.31 * suave;
            }

            orbe.style.transform = 'translate(' + (x - 6.5).toFixed(1) + 'px,'
              + (y - 6.5).toFixed(1) + 'px) scale(' + escala.toFixed(3) + ')';
            orbe.classList.toggle('visible', q > 0.10 && y > -30 && y < alto + 30);
          });
        }
      }
    }

    // cada problema revela su solución cuando pasaste un tercio de su tramo
    pasos.forEach((paso) => {
      const fijo = paso.querySelector('.dx-fijo');
      const r = paso.getBoundingClientRect();
      const recorrido = paso.offsetHeight - (fijo ? fijo.offsetHeight : 0);
      if (recorrido <= 0) return;
      const avance = Math.max(0, Math.min(1, (-r.top) / recorrido));
      const mostrar = avance > 0.32;
      if (mostrar !== paso.classList.contains('revelado')) {
        paso.classList.toggle('revelado', mostrar);
      }
    });
  };

  const alScrollear = () => {
    if (pedido === null) pedido = window.requestAnimationFrame(medir);
  };

  window.addEventListener('scroll', alScrollear, { passive: true });
  window.addEventListener('resize', alScrollear);
  medir();

  // por si querés desmontarla (SPA, cambios de ruta)
  return () => {
    if (pedido !== null) window.cancelAnimationFrame(pedido);
    window.removeEventListener('scroll', alScrollear);
    window.removeEventListener('resize', alScrollear);
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initIntroDiagnostico());
} else {
  initIntroDiagnostico();
}
