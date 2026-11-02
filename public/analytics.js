// Basic consent mode: no Google script or requests before explicit opt-in.
export function createAnalytics({ window: win, document: doc, id }) {
  const valid = /^G-[A-Z0-9]+$/.test(id || '');
  const production = win.location.hostname === 'rishabhpatil.github.io';
  const privacySignal = win.navigator.globalPrivacyControl === true || win.navigator.doNotTrack === '1';
  const available = valid && production && !privacySignal;
  const storageKey = 'learn.analytics-consent.v1';
  const allowedEvents = new Set(['method_select', 'explorer_interaction', 'article_read', 'code_copy', 'citation_download', 'reference_click', 'source_click']);
  let choice = null;
  let started = false;
  try {
    const saved = JSON.parse(win.localStorage.getItem(storageKey));
    if (saved && Date.now() - saved.at < 180 * 86400000) choice = saved.value;
  } catch { /* Storage can be unavailable; session-only choices still work. */ }
  function gtag() { win.dataLayer.push(arguments); }
  function start() {
    if (!available || choice !== 'accepted' || started) return;
    started = true;
    win[`ga-disable-${id}`] = false;
    win.dataLayer = win.dataLayer || [];
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('js', new Date());
    let referrer = '';
    try { referrer = new URL(doc.referrer).origin; } catch { /* No referrer. */ }
    gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: 'none',
      cookie_path: '/learn',
      cookie_prefix: 'learn',
      cookie_expires: 60 * 60 * 24 * 180,
      page_location: win.location.origin + win.location.pathname,
      page_referrer: referrer,
      page_title: /^\/learn\/?(?:index\.html)?$/.test(win.location.pathname) ? 'Learn — Learning & Research' : win.location.pathname.endsWith('/atlas.html') ? 'The Position Atlas' : 'Position, Explained'
    });
    const script = doc.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    doc.head.append(script);
    gtag('event', 'page_view');
  }
  function setChoice(value) {
    if (!['accepted', 'declined'].includes(value)) return;
    choice = value;
    try { win.localStorage.setItem(storageKey, JSON.stringify({ value, at: Date.now() })); } catch { /* In-memory fallback. */ }
    if (value === 'accepted') start();
    else {
      win[`ga-disable-${id}`] = true;
      if (started) gtag('consent', 'update', { analytics_storage: 'denied' });
      for (const part of doc.cookie.split(';')) {
        const name = part.trim().split('=')[0];
        if (name.startsWith('learn_ga')) doc.cookie = `${name}=; Max-Age=0; Path=/learn; SameSite=Lax`;
      }
      // Stop the loaded SDK's timers as well as our event dispatch.
      if (started) win.location.reload();
    }
  }
  function track(event, method) {
    if (!available || choice !== 'accepted' || !started || !allowedEvents.has(event)) return;
    const props = ['sinusoidal', 'rope', 'alibi', 'none', 'learned', 'shaw', 't5', 'pi', 'yarn', 'axial', 'mixed', 'mrope', 'interleaved', 'mrope-i', 'mhrope', 'circle', 'vrope', 'videorope', 'v2pe', 'time-mrope'].includes(method) ? { method } : {};
    gtag('event', event, props);
  }
  start();
  return { available, needsChoice: available && !['accepted', 'declined'].includes(choice), setChoice, track };
}
