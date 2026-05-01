const GA_ID = 'G-0NSB385M42';

const gaHeadSnippet = `
<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_ID}', {
    page_title: document.title,
    page_path: window.location.pathname
  });
</script>
`;

const engagementTrackingSnippet = `
<script>
(function(){
  function sendEvent(eventName, params){
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, Object.assign({ event_category: 'engagement' }, params || {}));
  }

  function normalizeText(value){
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function eventForLink(link){
    const href = (link.getAttribute('href') || '').toLowerCase();
    const text = normalizeText(link.textContent).toLowerCase();
    const classes = link.className || '';

    if (href.includes('booking') || text.includes('book') || text.includes('appointment') || classes.includes('cta-link')) {
      return 'book_now_click';
    }
    if (href.includes('contact') || text.includes('contact') || text.includes('question')) {
      return 'contact_click';
    }
    if (href.startsWith('sms:')) {
      return href.includes('booking') ? 'booking_sms_click' : 'text_click';
    }
    if (href.startsWith('tel:')) {
      return 'call_click';
    }
    if (href.includes('gallery') || text.includes('gallery') || text.includes('work')) {
      return 'gallery_click';
    }
    if (href.includes('services') || text.includes('pricing') || text.includes('services')) {
      return 'services_click';
    }
    return 'nav_click';
  }

  document.addEventListener('click', function(event){
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;

    const eventName = link.dataset.track || eventForLink(link);
    sendEvent(eventName, {
      event_label: link.dataset.label || normalizeText(link.textContent) || link.getAttribute('aria-label') || link.getAttribute('href'),
      link_url: link.getAttribute('href') || '',
      page_path: window.location.pathname
    });
  }, true);

  document.addEventListener('submit', function(event){
    const form = event.target;
    if (!form || !form.matches || !form.matches('form')) return;

    const formLabel = form.dataset.label || form.getAttribute('aria-label') || form.id || 'Form submit';
    const action = (form.getAttribute('action') || '').toLowerCase();
    const page = window.location.pathname.toLowerCase();
    const eventName = form.dataset.track || (page.includes('booking') || action.includes('booking') ? 'booking_form_submit' : 'contact_form_submit');

    sendEvent(eventName, {
      event_label: formLabel,
      form_action: form.getAttribute('action') || '',
      page_path: window.location.pathname
    });
  }, true);
})();
</script>
`;

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  let html = await response.text();

  if (!html.includes(`gtag/js?id=${GA_ID}`)) {
    html = html.replace('</head>', `${gaHeadSnippet}</head>`);
  }

  if (!html.includes('booking_form_submit') && !html.includes('book_now_click')) {
    html = html.replace('</body>', `${engagementTrackingSnippet}</body>`);
  } else if (!html.includes('booking_form_submit')) {
    html = html.replace('</body>', `${engagementTrackingSnippet}</body>`);
  }

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
