/* ========================================================================
   PV TRACKING - Eventos do Popup, GA4 e Meta Pixel (v5)
   
   Eventos implementados:
   1. popup_view      → Popup foi exibido
   2. popup_close     → Popup foi fechado
   3. popup_submit    → Formulário enviado
   4. lead_saved      → Webhook confirmou o lead
   5. popup_error     → Erro no envio (validation, network, webhook_timeout)
   6. cookie_accept   → Cookie aceito (delegado ao cookie-banner.js)
   7. cookie_reject   → Cookie recusado (delegado ao cookie-banner.js)
   
   Integrações diretas:
   - GA4 (gtag.js) → carregado dinamicamente via ga4Id do config
   - Meta Pixel (fbevents.js) → carregado dinamicamente via metaPixelId do config
   
   Usa PVGlobal.getTrackingData() para dados base (UTMs, partner_id, etc.)
   
   Depende de: pv-global.js (PVGlobal), cookie-banner.js (PVConsent)
   ======================================================================== */

(function () {
  'use strict';

  // ============================================================
  // CONFIG & CONSENT HELPERS
  // ============================================================

  function getConfig() {
    return window.PV_POPUP_CONFIG || {};
  }

  function isAnalyticsAllowed() {
    return window.PVConsent && typeof window.PVConsent.isAnalyticsAllowed === 'function'
      ? window.PVConsent.isAnalyticsAllowed()
      : false;
  }

  function isMarketingAllowed() {
    return window.PVConsent && typeof window.PVConsent.isMarketingAllowed === 'function'
      ? window.PVConsent.isMarketingAllowed()
      : false;
  }

  // ============================================================
  // GA4 — Inicialização e envio
  // ============================================================

  function initGA4() {
    var ga4Id = getConfig().ga4Id;
    if (!ga4Id) return;
    if (window.__pvGA4Initialized) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };

    var existing = document.querySelector('script[src*="googletagmanager.com/gtag/js?id=' + ga4Id + '"]');
    if (!existing) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4Id);
      document.head.appendChild(s);
    }

    window.gtag('js', new Date());
    window.gtag('config', ga4Id, { product: getConfig().product || 'protege_voce' });

    window.__pvGA4Initialized = true;
    console.log('[PV Tracking] GA4 inicializado:', ga4Id);
  }

  function trackGA4(eventName, params) {
    if (!isAnalyticsAllowed()) return;
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, Object.assign({ product: getConfig().product || 'protege_voce' }, params || {}));
  }

  // ============================================================
  // META PIXEL — Inicialização e envio
  // ============================================================

  function initMetaPixel() {
    var pixelId = getConfig().metaPixelId;
    if (!pixelId) return;
    if (window.__pvMetaInitialized) return;

    !function(f,b,e,v,n,t,s){
      if(f.fbq) return;
      n=f.fbq=function(){n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)};
      if(!f._fbq) f._fbq=n;
      n.push=n;
      n.loaded=true;
      n.version='2.0';
      n.queue=[];
      t=b.createElement(e);
      t.async=true;
      t.src=v;
      s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', pixelId);
    fbq('track', 'PageView');

    window.__pvMetaInitialized = true;
    console.log('[PV Tracking] Meta Pixel inicializado:', pixelId);
  }

  function trackMeta(eventName, params) {
    if (!isMarketingAllowed()) return;
    if (typeof window.fbq !== 'function') return;
    window.fbq('track', eventName, Object.assign({ product: getConfig().product || 'protege_voce' }, params || {}));
  }

  // ============================================================
  // HELPERS EXISTENTES
  // ============================================================

  /**
   * Detecta mobile
   */
  function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
  }

  /**
   * Retorna dados de tracking base do PVGlobal ou fallback
   */
  function getBaseData() {
    if (window.PVGlobal && typeof window.PVGlobal.getTrackingData === 'function') {
      return window.PVGlobal.getTrackingData();
    }
    // Fallback se PVGlobal não carregou
    return {
      partner_id: 'direct',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer || '',
      session_id: '',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Pega nome e form do popup a partir do config exposto
   */
  function getPopupMeta() {
    var config = window.PV_POPUP_CONFIG || {};
    return {
      popup_name: config.popupName || 'pv_exit_popup',
      form_name: config.formName || 'pv_lead_capture'
    };
  }

  /**
   * Push direto no dataLayer com schema exato
   */
  function pushDL(eventName, extra) {
    window.dataLayer = window.dataLayer || [];
    var payload = Object.assign({}, { event: eventName, product: getConfig().product || 'protege_voce' }, extra);
    window.dataLayer.push(payload);
    console.log('%c[PV dataLayer]', 'color: #3b82f6; font-weight: bold;', eventName, payload);
  }

  // ============================================================
  // 1. POPUP VIEW — Quando o popup aparecer
  // ============================================================

  function trackPopupView() {
    var base = getBaseData();
    var meta = getPopupMeta();

    pushDL('popup_view', {
      popup_name: meta.popup_name,
      partner_id: base.partner_id,
      utm_source: base.utm_source,
      utm_medium: base.utm_medium,
      utm_campaign: base.utm_campaign,
      page_path: base.page_path,
      page_url: base.page_url,
      trigger_type: isMobile() ? 'exit_intent_mobile' : 'exit_intent_desktop'
    });

    // GA4
    var params = {
      popup_name: meta.popup_name,
      form_name: meta.form_name,
      partner_id: base.partner_id,
      utm_source: base.utm_source,
      utm_medium: base.utm_medium,
      utm_campaign: base.utm_campaign,
      utm_content: base.utm_content,
      utm_term: base.utm_term,
      page_path: base.page_path,
      page_url: base.page_url,
      session_id: base.session_id
    };
    trackGA4('popup_view', params);

    // Meta Pixel
    trackMeta('ViewContent', {
      content_name: meta.popup_name,
      partner_id: base.partner_id,
      page_path: base.page_path
    });
  }

  // ============================================================
  // 2. POPUP CLOSE — Quando o popup fechar
  // ============================================================

  /**
   * @param {string} closeType - 'button' | 'overlay' | 'timeout' | 'esc' | 'auto_close'
   */
  function trackPopupClose(closeType) {
    var base = getBaseData();
    var meta = getPopupMeta();

    pushDL('popup_close', {
      popup_name: meta.popup_name,
      close_type: closeType || 'button',
      partner_id: base.partner_id,
      page_path: base.page_path,
      page_url: base.page_url
    });

    // GA4
    trackGA4('popup_close', {
      popup_name: meta.popup_name,
      form_name: meta.form_name,
      close_type: closeType || 'button',
      partner_id: base.partner_id,
      page_path: base.page_path,
      page_url: base.page_url,
      session_id: base.session_id
    });
  }

  // ============================================================
  // 3. POPUP SUBMIT — Quando o formulário for enviado
  // ============================================================

  /**
   * @param {Object} formData - { nome, email, whatsapp, ... }
   */
  function trackPopupSubmit(formData) {
    var base = getBaseData();
    var meta = getPopupMeta();
    formData = formData || {};

    pushDL('popup_submit', {
      popup_name: meta.popup_name,
      form_name: meta.form_name,
      partner_id: base.partner_id,
      utm_source: base.utm_source,
      utm_medium: base.utm_medium,
      utm_campaign: base.utm_campaign,
      page_path: base.page_path,
      page_url: base.page_url,
      // Dados do lead (útil para enhanced conversions)
      lead_name: formData.nome || '',
      lead_email: formData.email || '',
      lead_phone: formData.whatsapp || ''
    });

    // GA4
    trackGA4('popup_submit', {
      popup_name: meta.popup_name,
      form_name: meta.form_name,
      partner_id: base.partner_id,
      utm_source: base.utm_source,
      utm_medium: base.utm_medium,
      utm_campaign: base.utm_campaign,
      utm_content: base.utm_content,
      utm_term: base.utm_term,
      page_path: base.page_path,
      page_url: base.page_url,
      session_id: base.session_id
    });

    // Meta Pixel
    trackMeta('Lead', {
      content_name: meta.popup_name,
      form_name: meta.form_name,
      partner_id: base.partner_id,
      utm_source: base.utm_source,
      utm_medium: base.utm_medium,
      utm_campaign: base.utm_campaign
    });
  }

  // ============================================================
  // 4. LEAD SAVED — Quando o webhook confirmar o lead salvo
  // ============================================================

  /**
   * @param {Object} formData
   */
  function trackLeadSaved(formData) {
    var base = getBaseData();
    var meta = getPopupMeta();
    formData = formData || {};

    pushDL('lead_saved', {
      popup_name: meta.popup_name,
      form_name: meta.form_name,
      partner_id: base.partner_id,
      page_path: base.page_path,
      page_url: base.page_url,
      destination: 'webhook',
      lead_name: formData.nome || '',
      lead_email: formData.email || '',
      lead_phone: formData.whatsapp || ''
    });

    // GA4
    trackGA4('lead_saved', {
      popup_name: meta.popup_name,
      form_name: meta.form_name,
      partner_id: base.partner_id,
      page_path: base.page_path,
      page_url: base.page_url,
      destination: 'webhook',
      session_id: base.session_id
    });

    // Meta Pixel
    trackMeta('CompleteRegistration', {
      content_name: meta.popup_name,
      partner_id: base.partner_id
    });
  }

  // ============================================================
  // 5. POPUP ERROR — Se der erro no envio
  // ============================================================

  /**
   * @param {string} errorType - 'validation' | 'webhook_timeout' | 'network' | 'submit_failed'
   * @param {string} errorMessage
   */
  function trackPopupError(errorType, errorMessage) {
    var base = getBaseData();
    var meta = getPopupMeta();

    pushDL('popup_error', {
      popup_name: meta.popup_name,
      error_type: errorType || 'unknown',
      error_message: errorMessage || '',
      partner_id: base.partner_id,
      page_path: base.page_path
    });

    // GA4
    trackGA4('popup_error', {
      popup_name: meta.popup_name,
      form_name: meta.form_name,
      error_type: errorType || 'unknown',
      error_message: errorMessage || '',
      partner_id: base.partner_id,
      page_path: base.page_path,
      page_url: base.page_url,
      session_id: base.session_id
    });
  }

  // ============================================================
  // 6. COOKIE CONSENT — cookie_accept / cookie_reject
  //    (chamado diretamente pelo cookie-banner.js via PVTracking)
  // ============================================================

  function trackCookieAccept() {
    pushDL('cookie_accept', {});
  }

  function trackCookieReject() {
    pushDL('cookie_reject', {});
  }

  // ============================================================
  // INICIALIZAÇÃO GA4 + META PIXEL
  // ============================================================
  // Só carrega os scripts de terceiros com consentimento (LGPD)
  function initAllowed() {
    if (isAnalyticsAllowed()) initGA4();
    if (isMarketingAllowed()) initMetaPixel();
  }
  initAllowed();

  // ============================================================
  // EXPORTA API PÚBLICA
  // ============================================================
  // ============================================================
  // EVENTOS GENÉRICOS (landing, checkout, obrigado, erro)
  // ============================================================
  var PLAN_PRICES = { plano1: 3.9, plano2: 5.9, plano3: 9.9 };

  function track(gaName, params, metaName, metaParams) {
    var base = getBaseData();
    var common = {
      partner_id: base.partner_id,
      utm_source: base.utm_source,
      utm_medium: base.utm_medium,
      utm_campaign: base.utm_campaign,
      page_path: base.page_path,
      session_id: base.session_id
    };
    var ga = Object.assign({}, common, params || {});
    pushDL(gaName, ga);
    trackGA4(gaName, ga);
    if (metaName) trackMeta(metaName, Object.assign({ partner_id: base.partner_id }, metaParams || {}));
  }

  // Cliques em CTA de plano e em WhatsApp (delegado, funciona em qualquer página)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('plano=') !== -1) {
      var plan = '';
      try { plan = new URL(href, window.location.href).searchParams.get('plano') || ''; } catch (err) {}
      var value = PLAN_PRICES[plan] || 0;
      track('select_plan', { plan_id: plan, value: value, currency: 'BRL' },
        'AddToCart', { content_ids: [plan], content_type: 'product', value: value, currency: 'BRL' });
    } else if (href.indexOf('wa.me') !== -1) {
      track('whatsapp_click', { link_url: href }, 'Contact', {});
    }
  }, true);

  window.PVTracking = {
    trackPopupView: trackPopupView,
    trackPopupClose: trackPopupClose,
    trackPopupSubmit: trackPopupSubmit,
    trackPopupError: trackPopupError,
    trackLeadSaved: trackLeadSaved,
    track: track,
    trackCookieAccept: trackCookieAccept,
    trackCookieReject: trackCookieReject,
    isMobile: isMobile,
    // Expõe para reinicialização após consent
    initGA4: initGA4,
    initMetaPixel: initMetaPixel,
    initAllowed: initAllowed
  };

  console.log('[PV Tracking] v5 carregado (GA4 + Meta Pixel).');

})();
