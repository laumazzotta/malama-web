/* Formulario de contacto de las landings: mismo comportamiento que js/home.js.
   "Enviar por mail" -> Netlify Forms (formulario "contacto"). "Enviar por WhatsApp" -> chat con el mensaje armado. */
(function () {
  var WA_NUMBER = '5491124005587';
  var form = document.getElementById('contact-form');
  var ok = document.getElementById('form-success');
  var fail = document.getElementById('form-error');
  if (!form || !ok) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.submitter && e.submitter.value === 'whatsapp') {
      var f = form.elements;
      var texto = 'Hola! Soy ' + f.nombre.value.trim() + ' (' + f.email.value.trim() + ').\n' +
        'Tipo de proyecto: ' + f.tipo.value + '\n\n' + f.mensaje.value.trim();
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
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
})();
