/* ========================================================================
   PV COOKIE BANNER - Consentimento de Cookies (v2)
   
   Regras:
   - Aceitar: libera analytics + marketing (GTM, GA4, Meta Pixel)
   - Recusar: só necessários
   - Sem resposta: bloqueia marketing
   - Salva escolha no localStorage por 180 dias
   
   dataLayer Events:
   - cookie_banner_view
   - cookie_accept          (push simples: { event: 'cookie_accept' })
   - cookie_reject          (push simples: { event: 'cookie_reject' })
   - cookie_preferences_save
   - consent_update         (com detalhes de cada tipo)
   
   Depende de: pv-global.js (PVGlobal.pushEvent)
   ======================================================================== */

(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  var COOKIE_CONFIG = {
    storageKey: 'pv_cookie_consent',
    expirationDays: 180
  };

  // ============================================================
  // ESTADO
  // ============================================================

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
  }

  function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
    }
    return null;
  }

  /**
   * Lê o consentimento salvo
   * @returns {Object|null} { analytics: bool, marketing: bool, savedAt: timestamp }
   */
  function getSavedConsent() {
    var saved = getCookie(COOKIE_CONFIG.storageKey);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }

  /**
   * Salva consentimento
   */
  function saveConsent(analytics, marketing) {
    var data = {
      necessary: true,
      analytics: !!analytics,
      marketing: !!marketing,
      savedAt: Date.now()
    };
    setCookie(COOKIE_CONFIG.storageKey, JSON.stringify(data), COOKIE_CONFIG.expirationDays);
    return data;
  }

  /**
   * Verifica se o marketing está consentido
   */
  function isMarketingAllowed() {
    var consent = getSavedConsent();
    return consent && consent.marketing === true;
  }

  /**
   * Verifica se analytics está consentido
   */
  function isAnalyticsAllowed() {
    var consent = getSavedConsent();
    return consent && consent.analytics === true;
  }

  // ============================================================
  // HTML DO BANNER
  // ============================================================

  function injectBanner() {
    if (document.getElementById('pv-cookie-banner')) return;

    var policyUrl = (window.PV_POPUP_CONFIG && window.PV_POPUP_CONFIG.privacyUrl) || 'politica-de-privacidade.html';

    var html = ''
    + '<div class="pv-cookie-banner" id="pv-cookie-banner" role="dialog" aria-label="Consentimento de cookies">'
    + '  <div class="pv-cookie-inner">'
    + '    <div class="pv-cookie-text">'
    + '      <p>Usamos cookies para melhorar sua experiência, personalizar conteúdo e analisar nosso tráfego. '
    + '      Ao clicar em "Aceitar", você concorda com o uso de cookies analíticos e de marketing. Para escolher quais permitir, use "Preferências". '
    + '      <a href="' + policyUrl + '" id="pv-cookie-policy-link">Política de Privacidade</a></p>'
    + '    </div>'
    + '    <div class="pv-cookie-actions">'
    + '      <button class="pv-cookie-btn pv-cookie-btn-accept" id="pv-cookie-accept">Aceitar</button>'
    + '      <button class="pv-cookie-btn pv-cookie-btn-prefs" id="pv-cookie-prefs-btn">Preferências</button>'
    + '    </div>'
    + '  </div>'
    + '  <div class="pv-cookie-prefs" id="pv-cookie-prefs-panel">'
    + '    <div class="pv-cookie-category">'
    + '      <div class="pv-cookie-cat-info">'
    + '        <div class="pv-cookie-cat-name">Necessários</div>'
    + '        <div class="pv-cookie-cat-desc">Essenciais para o funcionamento do site. Sempre ativos.</div>'
    + '      </div>'
    + '      <label class="pv-cookie-toggle">'
    + '        <input type="checkbox" checked disabled>'
    + '        <span class="pv-cookie-toggle-track"></span>'
    + '      </label>'
    + '    </div>'
    + '    <div class="pv-cookie-category">'
    + '      <div class="pv-cookie-cat-info">'
    + '        <div class="pv-cookie-cat-name">Analytics</div>'
    + '        <div class="pv-cookie-cat-desc">Nos ajudam a entender como você usa o site (GA4).</div>'
    + '      </div>'
    + '      <label class="pv-cookie-toggle">'
    + '        <input type="checkbox" id="pv-pref-analytics">'
    + '        <span class="pv-cookie-toggle-track"></span>'
    + '      </label>'
    + '    </div>'
    + '    <div class="pv-cookie-category">'
    + '      <div class="pv-cookie-cat-info">'
    + '        <div class="pv-cookie-cat-name">Marketing</div>'
    + '        <div class="pv-cookie-cat-desc">Permitem anúncios personalizados (Meta Pixel, remarketing).</div>'
    + '      </div>'
    + '      <label class="pv-cookie-toggle">'
    + '        <input type="checkbox" id="pv-pref-marketing">'
    + '        <span class="pv-cookie-toggle-track"></span>'
    + '      </label>'
    + '    </div>'
    + '    <div class="pv-cookie-prefs-save">'
    + '      <button class="pv-cookie-btn pv-cookie-btn-accept" id="pv-cookie-save-prefs">Salvar preferências</button>'
    + '    </div>'
    + '  </div>'
    + '</div>';

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstElementChild);
  }

  // ============================================================
  // CONTROLE DO BANNER
  // ============================================================

  function showBanner() {
    var banner = document.getElementById('pv-cookie-banner');
    if (!banner) return;
    requestAnimationFrame(function () {
      banner.classList.add('visible');
    });

    // TRACK: cookie_banner_view
    if (window.PVGlobal) {
      window.PVGlobal.pushEvent('cookie_banner_view', {});
    }
  }

  function hideBanner() {
    var banner = document.getElementById('pv-cookie-banner');
    if (banner) banner.classList.remove('visible');
  }

  /**
   * Aceitar tudo (analytics + marketing)
   */
  function acceptAll() {
    var consent = saveConsent(true, true);
    hideBanner();

    // Push simples conforme spec: { event: 'cookie_accept' }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cookie_accept' });
    console.log('%c[PV dataLayer]', 'color: #3b82f6; font-weight: bold;', 'cookie_accept');
    if (window.PVTracking) window.PVTracking.trackCookieAccept();

    // Push detalhado para triggers avançados no GTM
    if (window.PVGlobal) {
      window.PVGlobal.pushEvent('consent_granted', {
        consent_necessary: true,
        consent_analytics: true,
        consent_marketing: true
      });
    }

    applyConsent(consent);
  }

  /**
   * Recusar (só necessários)
   */
  function rejectAll() {
    var consent = saveConsent(false, false);
    hideBanner();

    // Push simples conforme spec: { event: 'cookie_reject' }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cookie_reject' });
    console.log('%c[PV dataLayer]', 'color: #3b82f6; font-weight: bold;', 'cookie_reject');
    if (window.PVTracking) window.PVTracking.trackCookieReject();

    // Push detalhado para triggers avançados no GTM
    if (window.PVGlobal) {
      window.PVGlobal.pushEvent('consent_denied', {
        consent_necessary: true,
        consent_analytics: false,
        consent_marketing: false
      });
    }

    applyConsent(consent);
  }

  /**
   * Salvar preferências
   */
  function savePreferences() {
    var analyticsChecked = document.getElementById('pv-pref-analytics');
    var marketingChecked = document.getElementById('pv-pref-marketing');

    var analytics = analyticsChecked ? analyticsChecked.checked : false;
    var marketing = marketingChecked ? marketingChecked.checked : false;

    var consent = saveConsent(analytics, marketing);
    hideBanner();

    if (window.PVGlobal) {
      window.PVGlobal.pushEvent('cookie_preferences_save', {
        consent_necessary: true,
        consent_analytics: analytics,
        consent_marketing: marketing
      });
    }

    applyConsent(consent);
  }

  /**
   * Aplica o consentimento:
   * - Se marketing: dispara evento de consent_granted para GTM configurar tags
   * - O GTM usa esse evento para liberar GA4/Meta Pixel
   */
  function applyConsent(consent) {
    // Libera GA4 / Meta Pixel só após o consentimento
    if (window.PVTracking && window.PVTracking.initAllowed) window.PVTracking.initAllowed();

    // Empurra evento de consentimento para o GTM usar como trigger
    window.dataLayer.push({
      event: 'consent_update',
      consent_analytics: consent.analytics ? 'granted' : 'denied',
      consent_marketing: consent.marketing ? 'granted' : 'denied'
    });

    // Google Consent Mode v2 (se o container GTM suportar)
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied',
        ad_user_data: consent.marketing ? 'granted' : 'denied',
        ad_personalization: consent.marketing ? 'granted' : 'denied'
      });
    }
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  function setupListeners() {
    var acceptBtn = document.getElementById('pv-cookie-accept');
    var rejectBtn = document.getElementById('pv-cookie-reject');
    var prefsBtn = document.getElementById('pv-cookie-prefs-btn');
    var saveBtn = document.getElementById('pv-cookie-save-prefs');

    if (acceptBtn) acceptBtn.addEventListener('click', acceptAll);
    if (rejectBtn) rejectBtn.addEventListener('click', rejectAll);

    if (prefsBtn) {
      prefsBtn.addEventListener('click', function () {
        var panel = document.getElementById('pv-cookie-prefs-panel');
        if (panel) panel.classList.toggle('visible');
      });
    }

    if (saveBtn) saveBtn.addEventListener('click', savePreferences);
  }

  // ============================================================
  // INIT
  // ============================================================

  function init() {
    var existing = getSavedConsent();

    if (existing) {
      // Já respondeu — aplica consentimento silenciosamente
      applyConsent(existing);
      return;
    }

    // Não respondeu — mostra banner
    injectBanner();
    setupListeners();

    // Pequeno delay para animação
    setTimeout(showBanner, 1000);
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ============================================================
  // API PÚBLICA
  // ============================================================
  window.PVConsent = {
    isMarketingAllowed: isMarketingAllowed,
    isAnalyticsAllowed: isAnalyticsAllowed,
    getSavedConsent: getSavedConsent,
    resetConsent: function () {
      setCookie(COOKIE_CONFIG.storageKey, '', -1);
      location.reload();
    }
  };

})();
