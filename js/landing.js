/* Malama Digital — comportamiento de las landings de servicios */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* la maqueta del hero sigue al cursor */
  var hero = document.querySelector('.hero');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.visual .card'));
  if (hero && cards.length) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      cards.forEach(function (c, i) {
        var d = 14 + i * 10;
        c.style.setProperty('--px', (nx * d).toFixed(1) + 'px');
        c.style.setProperty('--py', (ny * d).toFixed(1) + 'px');
      });
    });
    hero.addEventListener('mouseleave', function () {
      cards.forEach(function (c) {
        c.style.setProperty('--px', '0px');
        c.style.setProperty('--py', '0px');
      });
    });
  }

  /* foco de luz que sigue al cursor dentro de cada tarjeta */
  document.querySelectorAll('.tile').forEach(function (t) {
    t.addEventListener('mousemove', function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();
