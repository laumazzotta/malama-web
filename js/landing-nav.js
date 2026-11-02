/* Malama Digital — navbar de las landings: sombra al scrollear y menú mobile. */
(function () {
  'use strict';

  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 10); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var menu = document.getElementById('mobile-menu');
  var toggle = document.querySelector('.nav-toggle');
  if (!menu || !toggle) return;

  function setMenu(open) {
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    (open ? menu.querySelector('.mobile-menu-close') : toggle).focus();
  }
  toggle.addEventListener('click', function () { setMenu(true); });
  menu.querySelector('.mobile-menu-close').addEventListener('click', function () { setMenu(false); });
  menu.querySelectorAll('[data-menu-close]').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
  });
  window.matchMedia('(min-width: 721px)').addEventListener('change', function (e) {
    if (e.matches && menu.classList.contains('open')) setMenu(false);
  });
})();
