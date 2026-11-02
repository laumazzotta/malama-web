/* Malama Digital — comportamiento de la home (versión oscura y clara) */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav con sombra, barra de progreso y parallax del escenario ---------- */
  var nav = document.querySelector('.nav');
  var bar = document.querySelector('.progress-bar');
  var stage = document.querySelector('.stage');
  var hero = document.querySelector('.hero');

  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 10);
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(y / max, 1) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }
    if (stage && !reduced) stage.style.setProperty('--sy', (y * -0.06) + 'px');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- menú móvil ---------- */
  var menu = document.getElementById('mobile-menu');
  var toggle = document.querySelector('.nav-toggle');
  function setMenu(open) {
    if (!menu || !toggle) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    (open ? menu.querySelector('.mobile-menu-close') : toggle).focus();
  }
  if (menu && toggle) {
    toggle.addEventListener('click', function () { setMenu(true); });
    menu.querySelector('.mobile-menu-close').addEventListener('click', function () { setMenu(false); });
    menu.querySelectorAll('[data-menu-close]').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
    });
    window.matchMedia('(min-width:721px)').addEventListener('change', function (e) {
      if (e.matches && menu.classList.contains('open')) setMenu(false);
    });
  }

  /* ---------- aparición de secciones al hacer scroll ---------- */
  var targets = document.querySelectorAll('.reveal, .stagger');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- carrusel infinito de trabajos (arrastrable) ---------- */
  var rail = document.querySelector('[data-mq-rail]');
  var track = document.querySelector('[data-mq-track]');
  if (rail && track) {
    var SPEED = 0.62;
    var hovering = false, dragging = false, moved = 0, startX = 0, startScroll = 0, pos = 0;

    var half = function () { return track.scrollWidth / 2; };
    var wrapPos = function () {
      var h = half();
      if (h <= 0) return;
      if (pos >= h) pos -= h;
      else if (pos < 0) pos += h;
    };
    var tick = function () {
      if (!dragging) {
        if (!reduced && !hovering) pos += SPEED;
        wrapPos();
        rail.scrollLeft = pos;
      }
      window.requestAnimationFrame(tick);
    };

    rail.addEventListener('mouseenter', function () { hovering = true; });
    rail.addEventListener('mouseleave', function () { hovering = false; });
    rail.addEventListener('focusin', function () { hovering = true; });
    rail.addEventListener('focusout', function () { hovering = false; });

    rail.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      dragging = true; moved = 0; startX = e.clientX; startScroll = pos;
    });
    rail.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > moved) moved = Math.abs(dx);
      if (moved <= 6) return; /* un toque o clic simple no es arrastre: el enlace debe funcionar */
      if (!rail.classList.contains('is-dragging')) {
        rail.classList.add('is-dragging');
        if (rail.setPointerCapture) { try { rail.setPointerCapture(e.pointerId); } catch (err) {} }
      }
      pos = startScroll - dx; wrapPos(); rail.scrollLeft = pos;
    });
    var endDrag = function (e) {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove('is-dragging');
      if (e && e.pointerId !== undefined && rail.releasePointerCapture) {
        try { rail.releasePointerCapture(e.pointerId); } catch (err) {}
      }
      if (moved > 6) {
        /* si se arrastró, no dispares el clic del enlace de abajo */
        var block = function (ev) { ev.preventDefault(); ev.stopPropagation(); };
        rail.addEventListener('click', block, true);
        window.setTimeout(function () { rail.removeEventListener('click', block, true); }, 60);
      }
    };
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    rail.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.requestAnimationFrame(tick);
  }

  /* ---------- el hero sigue al cursor ---------- */
  if (!reduced && hero) {
    var raf = null;
    hero.addEventListener('mousemove', function (e) {
      if (raf) return;
      raf = window.requestAnimationFrame(function () {
        raf = null;
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ---------- formulario de contacto ----------
     "Enviar por mail": se envía a Netlify Forms (formulario "contacto"). Netlify detecta
     el formulario al desplegar (atributo data-netlify) y guarda los mensajes en
     Forms > contacto. Solo funciona en el sitio publicado en Netlify: abierto en local
     el envío falla y se muestra el aviso de error.
     "Enviar por WhatsApp": abre el chat con el mensaje ya armado. */
  var WA_NUMBER = '5491124005587';
  var form = document.getElementById('contact-form');
  var ok = document.getElementById('form-success');
  var fail = document.getElementById('form-error');
  if (form && ok) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.submitter && e.submitter.value === 'whatsapp') {
        var f = form.elements;
        var texto = 'Hola! Soy ' + f.nombre.value.trim() + ' (' + f.email.value.trim() + ').\n' +
          'Tipo de proyecto: ' + f.tipo.value + '\n\n' + f.mensaje.value.trim();
        window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(texto),
          '_blank', 'noopener');
        return;
      }
      var btn = e.submitter || form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      if (fail) fail.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.hidden = true;
        ok.hidden = false;
      }).catch(function () {
        if (fail) fail.hidden = false;
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  }
})();
