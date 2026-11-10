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

  /* ---------- carrusel infinito de trabajos (arrastrable) ----------
     Desktop: una sola banda hacia la izquierda. Mobile (<=720px): dos bandas con
     3 trabajos cada una; la primera va hacia la izquierda y la segunda hacia la derecha. */
  var rail1 = document.querySelector('[data-mq-rail]');
  var track1 = document.querySelector('[data-mq-track]');
  if (rail1 && track1) {
    /* velocidad en px por segundo; en mobile más rápida para que fluya */
    var SPEED_DESKTOP = 38, SPEED_MOBILE = 70;
    var items = Array.prototype.slice.call(track1.children);
    var n = items.length / 2;
    var originals = items.slice(0, n), clones = items.slice(n);

    var rail2 = rail1.cloneNode(false);
    rail2.removeAttribute('data-mq-rail');
    var track2 = track1.cloneNode(false);
    track2.removeAttribute('data-mq-track');
    rail2.appendChild(track2);
    rail1.parentNode.appendChild(rail2);

    var bands = [
      { rail: rail1, track: track1, dir: 1, pos: 0, hovering: false, dragging: false },
      { rail: rail2, track: track2, dir: -1, pos: 0, hovering: false, dragging: false }
    ];
    var mqMobile = window.matchMedia('(max-width: 720px)');

    var period = function (b) {
      var kids = b.track.children;
      var h = kids.length / 2;
      return kids.length > 1 ? kids[h].offsetLeft - kids[0].offsetLeft : 0;
    };
    var wrapPos = function (b) {
      var h = period(b);
      if (h <= 0) return;
      b.pos = ((b.pos % h) + h) % h;
    };
    var layout = function () {
      var mobile = mqMobile.matches;
      var cut = mobile ? Math.ceil(n / 2) : n;
      var groups = mobile
        ? [originals.slice(0, cut).concat(clones.slice(0, cut)), originals.slice(cut).concat(clones.slice(cut))]
        : [originals.concat(clones), []];
      groups.forEach(function (g, i) {
        g.forEach(function (el) { bands[i].track.appendChild(el); });
      });
      rail2.hidden = !mobile;
      rail2.style.display = mobile ? '' : 'none';
      bands.forEach(function (b) {
        b.pos = b.dir < 0 ? period(b) : 0;
        paint(b);
      });
    };

    /* se mueve con transform (admite subpíxeles) en vez de scrollLeft, que iOS redondea y da tirones */
    var paint = function (b) {
      b.track.style.transform = 'translate3d(' + (-b.pos) + 'px,0,0)';
    };

    var last = 0;
    var tick = function (now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      var speed = mqMobile.matches ? SPEED_MOBILE : SPEED_DESKTOP;
      bands.forEach(function (b) {
        if (b.dragging) return;
        if (!reduced && !b.hovering) b.pos += speed * dt * b.dir;
        wrapPos(b);
        paint(b);
      });
      window.requestAnimationFrame(tick);
    };

    var bindBand = function (b) {
      var rail = b.rail, moved = 0, startX = 0, startScroll = 0;
      rail.addEventListener('mouseenter', function () { b.hovering = true; });
      rail.addEventListener('mouseleave', function () { b.hovering = false; });
      rail.addEventListener('focusin', function () { b.hovering = true; });
      rail.addEventListener('focusout', function () { b.hovering = false; });

      rail.addEventListener('pointerdown', function (e) {
        if (e.button) return;
        b.dragging = true; moved = 0; startX = e.clientX; startScroll = b.pos;
      });
      rail.addEventListener('pointermove', function (e) {
        if (!b.dragging) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > moved) moved = Math.abs(dx);
        if (moved <= 6) return; /* un toque o clic simple no es arrastre: el enlace debe funcionar */
        if (!rail.classList.contains('is-dragging')) {
          rail.classList.add('is-dragging');
          if (rail.setPointerCapture) { try { rail.setPointerCapture(e.pointerId); } catch (err) {} }
        }
        b.pos = startScroll - dx; wrapPos(b); paint(b);
      });
      var endDrag = function (e) {
        if (!b.dragging) return;
        b.dragging = false;
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
    };

    bands.forEach(bindBand);
    layout();
    if (mqMobile.addEventListener) mqMobile.addEventListener('change', layout);
    else if (mqMobile.addListener) mqMobile.addListener(layout);
    window.addEventListener('load', layout);
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
  var EN = document.documentElement.lang === 'en';
  var form = document.getElementById('contact-form');
  var ok = document.getElementById('form-success');
  var fail = document.getElementById('form-error');
  if (form && ok) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.submitter && e.submitter.value === 'whatsapp') {
        var f = form.elements;
        var texto = EN
          ? 'Hi! I\'m ' + f.nombre.value.trim() + ' (' + f.email.value.trim() + ').\n' +
            'Project: ' + f.tipo.value + '\n\n' + f.mensaje.value.trim()
          : 'Hola! Soy ' + f.nombre.value.trim() + ' (' + f.email.value.trim() + ').\n' +
            'Tipo de proyecto: ' + f.tipo.value + '\n\n' + f.mensaje.value.trim();
        window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(texto),
          '_blank', 'noopener');
        return;
      }
      var btn = e.submitter || form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      if (fail) fail.hidden = true;
      btn.disabled = true;
      btn.textContent = EN ? 'Sending…' : 'Enviando…';

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
