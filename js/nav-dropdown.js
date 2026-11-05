(function(){
  var dd = document.querySelector('.nav-dd');
  if (dd) {
    var trigger = dd.querySelector('.nav-dd-trigger');
    var setOpen = function(o){ dd.classList.toggle('open', o); trigger.setAttribute('aria-expanded', o); };
    // En pantallas táctiles (sin hover) el primer toque abre el desplegable
    trigger.addEventListener('click', function(e){
      if (window.matchMedia('(hover:none)').matches && !dd.classList.contains('open')) {
        e.preventDefault(); setOpen(true);
      }
    });
    document.addEventListener('click', function(e){ if (!dd.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') setOpen(false); });
  }
  var btn = document.querySelector('.mobile-menu-dd-toggle');
  var sub = document.getElementById('mobile-menu-sub');
  if (btn && sub) {
    btn.addEventListener('click', function(){
      var o = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', o);
      sub.classList.toggle('open', o);
    });
  }
})();
