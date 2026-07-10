// main.js — interacción del sitio LatinShare (vanilla JS, sin dependencias).

document.addEventListener('includes:loaded', () => {
  initMobileMenu();
});
document.addEventListener('DOMContentLoaded', () => {
  initCarousels();
  initAccordions();
  initLicenseTabs();
  initCaseStudy();
  initCourseCatalog();
  initContactPrefill();
});

/* ---- Selector de proveedor de licencias ---- */
function initLicenseTabs() {
  const tabs = document.querySelectorAll('[data-provider-tab]');
  const panels = document.querySelectorAll('[data-provider-panel]');
  if (!tabs.length) return;
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-provider-tab');
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      panels.forEach((p) => p.classList.toggle('hidden', p.getAttribute('data-provider-panel') !== key));
    });
  });
}

/* ---- Menú móvil ---- */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('hidden') === false;
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

/* ---- Carruseles horizontales (data-carousel) ----
   Los botones prev/next pueden vivir fuera del contenedor del carrusel (p. ej. en
   el header de la sección), por eso se buscan en la sección/ancestro común más
   cercano, no solo dentro de [data-carousel]. Los carruseles con su propio script
   se marcan con [data-carousel-manual] para que este handler los ignore. */
function initCarousels() {
  document.querySelectorAll('[data-carousel]:not([data-carousel-manual])').forEach((root) => {
    const track = root.querySelector('[data-carousel-track]');
    if (!track) return;
    const scope = root.closest('section') || root.parentElement || root;
    const prev = scope.querySelector('[data-carousel-prev]');
    const next = scope.querySelector('[data-carousel-next]');
    const step = () => Math.min(track.clientWidth * 0.85, 600);
    prev && prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next && next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  });
}

/* ---- Acordeón FAQ (data-accordion) ---- */
function initAccordions() {
  document.querySelectorAll('[data-accordion-trigger]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.nextElementSibling;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      if (panel) panel.classList.toggle('hidden', isOpen);
      const icon = btn.querySelector('[data-accordion-icon]');
      if (icon) icon.classList.toggle('rotate-180', !isOpen);
    });
  });
}

/* ---- Casos de éxito: autoplay + imagen cambia por caso ----
   Un solo caso abierto a la vez. Avanza solo cada 5s, se pausa al pasar el
   mouse por la sección o cuando la pestaña no está visible. La imagen se deriva
   del nombre del caso (assets/case-study-<nombre>.webp) con fallback a Sura. */
function initCaseStudy() {
  const root = document.getElementById('casos-accordion');
  const img = document.getElementById('case-study-img');
  if (!root || !img) return;
  const triggers = Array.from(root.querySelectorAll('[data-case-trigger]'));
  if (!triggers.length) return;

  const FALLBACK = 'assets/case-study-sura.webp';
  const imgFor = (btn) => {
    const logo = btn.querySelector('img');
    const name = ((logo && logo.getAttribute('alt')) || '').trim().toLowerCase();
    return name ? 'assets/case-study-' + name + '.webp' : FALLBACK;
  };

  let current = triggers.findIndex((b) => b.getAttribute('aria-expanded') === 'true');
  if (current < 0) current = 0;
  // Recuerda las imágenes por caso que aún no existen para no re-pedirlas (evita 404 en cada ciclo)
  const failed = new Set();

  function open(idx) {
    triggers.forEach((btn, i) => {
      const on = i === idx;
      btn.setAttribute('aria-expanded', String(on));
      const panel = btn.nextElementSibling;
      if (panel) panel.classList.toggle('hidden', !on);
      const icon = btn.querySelector('[data-case-icon]');
      if (icon) icon.classList.toggle('rotate-180', on);
    });
    const src = imgFor(triggers[idx]);
    const target = failed.has(src) ? FALLBACK : src;
    if (img.getAttribute('src') !== target) {
      img.style.opacity = '0';
      setTimeout(function () {
        img.onerror = function () { img.onerror = null; failed.add(src); if (img.src.indexOf(FALLBACK) < 0) img.src = FALLBACK; };
        img.src = target;
        img.style.opacity = '1';
      }, 150);
    }
    current = idx;
  }

  let timer = null;
  const DELAY = 5000;
  function tick() { open((current + 1) % triggers.length); }
  function start() { stop(); timer = setInterval(tick, DELAY); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  triggers.forEach((btn, i) => btn.addEventListener('click', () => { open(i); start(); }));

  const section = root.closest('section') || root;
  section.addEventListener('mouseenter', stop);
  section.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); } else { start(); } });

  open(current);
  start();
}

/* ---- Catálogo de capacitaciones: buscador + filtro por categoría + modal ---- */
function initCourseCatalog() {
  const tabs = Array.from(document.querySelectorAll('[data-cat-tab]'));
  const cards = Array.from(document.querySelectorAll('[data-course]'));
  if (!tabs.length || !cards.length) return;
  const search = document.querySelector('[data-course-search]');
  const empty = document.querySelector('[data-course-empty]');
  let activeCat = 'all';

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(new RegExp('[̀-ͯ]', 'g'), '');
  // Texto buscable por tarjeta (categoría + título + resumen + descripción completa)
  const haystack = new Map();
  cards.forEach((c) => {
    const t = c.querySelector('[data-course-title]');
    const p = c.querySelector('p');
    const f = c.querySelector('[data-course-full]');
    haystack.set(c, norm([c.getAttribute('data-cat-label') || '', t ? t.textContent : '', p ? p.textContent : '', f ? f.textContent : ''].join(' ')));
  });

  function apply() {
    const q = norm(search ? search.value.trim() : '');
    let shown = 0;
    cards.forEach((c) => {
      const catOk = activeCat === 'all' || c.getAttribute('data-cat') === activeCat;
      const qOk = !q || haystack.get(c).indexOf(q) >= 0;
      const vis = catOk && qOk;
      c.classList.toggle('hidden', !vis);
      if (vis) shown++;
    });
    if (empty) empty.classList.toggle('hidden', shown !== 0);
  }

  tabs.forEach((t) => t.addEventListener('click', () => {
    activeCat = t.getAttribute('data-cat-tab');
    tabs.forEach((x) => {
      const on = x === t;
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-selected', String(on));
    });
    apply();
  }));
  if (search) search.addEventListener('input', apply);

  /* Modal de detalle */
  const modal = document.getElementById('course-modal');
  if (modal) {
    const mTitle = modal.querySelector('[data-cm-title]');
    const mCat = modal.querySelector('[data-cm-cat]');
    const mDur = modal.querySelector('[data-cm-dur]');
    const mMax = modal.querySelector('[data-cm-max]');
    const mMod = modal.querySelector('[data-cm-modalidad]');
    const mDesc = modal.querySelector('[data-cm-desc]');
    const mTemario = modal.querySelector('[data-cm-temario]');
    const mTemarioWrap = modal.querySelector('[data-cm-temario-wrap]');
    const mPanel = modal.querySelector('[role="dialog"]');
    const mCta = modal.querySelector('[data-cm-cta]');
    const txt = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent : ''; };

    function openModal(card) {
      const title = txt(card, '[data-course-title]');
      if (mTitle) mTitle.textContent = title;
      if (mCat) mCat.textContent = card.getAttribute('data-cat-label') || '';
      if (mDur) mDur.textContent = card.getAttribute('data-dur') || '';
      if (mMax) mMax.textContent = card.getAttribute('data-max') || '';
      if (mMod) mMod.textContent = card.getAttribute('data-modalidad') || '';
      if (mDesc) mDesc.textContent = txt(card, '[data-course-full]');
      const tem = card.querySelector('[data-course-temario]');
      if (mTemario) mTemario.innerHTML = tem ? tem.innerHTML : '';
      if (mTemarioWrap) mTemarioWrap.classList.toggle('hidden', !tem || !tem.children.length);
      if (mCta) mCta.setAttribute('href', 'contact.html?curso=' + encodeURIComponent(title));
      if (mPanel) mPanel.scrollTop = 0;
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() { modal.classList.add('hidden'); document.body.style.overflow = ''; }

    cards.forEach((c) => {
      c.addEventListener('click', () => openModal(c));
      c.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(c); }
      });
    });
    modal.querySelectorAll('[data-cm-close]').forEach((b) => b.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal(); });
  }

  apply();
}

/* ---- Prellenado del formulario de contacto según ?curso= o ?medida= ---- */
function initContactPrefill() {
  let params;
  try { params = new URLSearchParams(location.search); } catch (e) { return; }
  const curso = params.get('curso');
  const medida = params.get('medida');
  if (!curso && !medida) return;
  const form = document.querySelector('.js-contact-form');
  if (!form) return;
  const ta = form.querySelector('textarea[name="mensaje"]');
  if (!ta) return;
  if (curso) {
    ta.value = 'Hola, me interesa la capacitación "' + curso + '". ¿Podrían enviarme más información sobre fechas, modalidad y valores?';
  } else {
    ta.value = 'Hola, me gustaría diseñar una capacitación a medida para mi equipo. Cuéntenme cómo podemos avanzar.';
  }
  const target = document.getElementById('form') || form;
  if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
}

/* ============================================================
   Captura de leads → Azure Function leadCapture (patrón SPO)
   Atribución gclid/utm persistida + honeypot + consent + reCAPTCHA
   ============================================================ */

/* Endpoint de la Azure Function: reutilizamos la existente de SPO (ya escribe a Dataverse).
   Los leads de LatinShare se distinguen por el campo `origen` que manda el front. */
var LEAD_ENDPOINT_LS = 'https://func-spo-leadcapture-4e087e.azurewebsites.net/api/leadCapture';
/* Endpoint del newsletter → misma Azure Function leadCapture (detecta tipo=newsletter y crea el suscriptor en Dataverse) */
var NEWSLETTER_ENDPOINT = 'https://func-spo-leadcapture-4e087e.azurewebsites.net/api/leadCapture';
/* reCAPTCHA Enterprise (proyecto spo-web-500503). OJO: el dominio latinshare.com
   (y localhost para pruebas) deben estar en la lista de dominios de esta key. */
var RECAPTCHA_SITE_KEY_LS = '6LdeWzMtAAAAAOHv-_Qfl2FvWx3pAf0EFmxTjpOA';

/* Google tag (gtag.js): conversiones de Google Ads + Enhanced Conversions for Leads.
   Se carga desde aquí para cubrir todas las páginas sin tocar cada HTML. */
var ADS_TAG_ID = 'AW-1013142021';
var ADS_LEAD_LABEL = 'AW-1013142021/1RteCLL1rcccEIWkjeMD';  // conversión "Lead" creada 2026-06-28
(function loadGtag() {
  if (window.gtag) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ADS_TAG_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', ADS_TAG_ID);
  // gtag('config', 'G-XXXXXXXXXX'); // GA4 LatinShare (propiedad 317903750): completar con su Measurement ID
})();

/* ---- Atribución de campaña (gclid/utm) persistida 90 días ---- */
var ATTR_KEY = 'ls_attr', ATTR_TTL = 90 * 24 * 60 * 60 * 1000;
function captureAttribution() {
  var p = new URLSearchParams(location.search);
  var keys = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  if (!keys.some(function (k) { return p.get(k); })) return;
  var attr = { ts: Date.now(), landing_url: location.href, referrer: document.referrer || '' };
  keys.forEach(function (k) { attr[k] = p.get(k) || ''; });
  try { localStorage.setItem(ATTR_KEY, JSON.stringify(attr)); } catch (e) {}
}
function getAttribution() {
  try {
    var a = JSON.parse(localStorage.getItem(ATTR_KEY) || 'null');
    if (a && (Date.now() - a.ts) < ATTR_TTL) return a;
  } catch (e) {}
  return {};
}
captureAttribution();

/* ---- reCAPTCHA Enterprise v3 (ready-to-enable, patrón SPO) ---- */
var _recaptchaReady = false;
function loadRecaptcha() {
  if (!RECAPTCHA_SITE_KEY_LS || _recaptchaReady) return;
  _recaptchaReady = true;
  var s = document.createElement('script');
  s.src = 'https://www.google.com/recaptcha/enterprise.js?render=' + encodeURIComponent(RECAPTCHA_SITE_KEY_LS);
  s.async = true;
  document.head.appendChild(s);
}
function getRecaptchaToken(action) {
  return new Promise(function (resolve) {
    var gre = window.grecaptcha && window.grecaptcha.enterprise;
    if (!RECAPTCHA_SITE_KEY_LS || !gre || !gre.execute) return resolve('');
    try {
      gre.ready(function () {
        gre.execute(RECAPTCHA_SITE_KEY_LS, { action: action || 'submit' })
          .then(function (tok) { resolve(tok || ''); })
          .catch(function () { resolve(''); });
      });
    } catch (e) { resolve(''); }
  });
}

/* ---- Form de contacto → leadCapture ---- */
document.addEventListener('DOMContentLoaded', function () {
  loadRecaptcha();

  document.querySelectorAll('.js-contact-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.js-form-status');
      var btn = form.querySelector('button[type="submit"]');

      // Honeypot: si el bot llenó el campo oculto, fingir éxito y abortar
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) { if (status) status.textContent = '¡Gracias!'; return; }

      // Consentimiento Ley 19.628 obligatorio
      var consent = form.querySelector('[data-consent]');
      if (consent && !consent.checked) {
        if (status) { status.textContent = 'Debes autorizar el tratamiento de datos para continuar.'; status.style.color = '#F26522'; }
        return;
      }

      // Payload: campos del form (sin honeypot) + atribución
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'website') data[k] = (typeof v === 'string') ? v.trim() : v; });
      var attr = getAttribution();
      Object.keys(attr).forEach(function (k) { if (k !== 'ts') data[k] = attr[k]; });
      data.origen = 'latinshare-web | ' + location.href;

      if (btn) btn.disabled = true;
      if (status) { status.textContent = 'Enviando…'; status.style.color = '#225640'; }

      getRecaptchaToken('lead').then(function (tok) {
        if (tok) data.recaptchaToken = tok;
        return fetch(LEAD_ENDPOINT_LS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }).then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        form.reset();
        if (status) { status.textContent = '¡Gracias! Te responderemos a la brevedad.'; status.style.color = '#225640'; }
        // Señal de conversión para GTM (→ GA4 + Google Ads "Lead" + Enhanced Conversions)
        // Conversión Google Ads "Lead" + Enhanced Conversions for Leads (match por email)
        if (typeof gtag === 'function') {
          if (data.email) gtag('set', 'user_data', { email: data.email });
          gtag('event', 'conversion', { send_to: ADS_LEAD_LABEL });
        }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: 'generate_lead', form_id: 'contacto', pais: data.pais || '', email: data.email || '' });
      }).catch(function () {
        if (status) { status.textContent = 'No se pudo enviar. Escríbenos a contacto@latinshare.com.'; status.style.color = '#F26522'; }
        if (btn) btn.disabled = false;
      });
    });
  });

  // Newsletter → Dataverse (suscriptor: nombre, email, empresa opcional) vía NEWSLETTER_ENDPOINT
  document.querySelectorAll('.js-newsletter').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.js-form-status');
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) { if (status) status.textContent = '¡Gracias!'; return; }  // bot
      if (NEWSLETTER_ENDPOINT.indexOf('REEMPLAZAR') >= 0) {
        if (status) status.textContent = 'Configura el endpoint del newsletter antes de publicar.';
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== 'website') data[k] = (typeof v === 'string') ? v.trim() : v; });
      data.origen = 'latinshare-newsletter | ' + location.href;
      data.tipo = 'newsletter';
      var attr = getAttribution();
      Object.keys(attr).forEach(function (k) { if (k !== 'ts') data[k] = attr[k]; });
      fetch(NEWSLETTER_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (res) { if (!res.ok) throw new Error('http ' + res.status); form.reset(); if (status) status.textContent = '¡Suscrito! Gracias.'; })
        .catch(function () { if (status) status.textContent = 'No se pudo suscribir. Intenta de nuevo.'; });
    });
  });
});
