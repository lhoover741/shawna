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

  document.addEventListener('click', function(event){
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;

    const href = (link.getAttribute('href') || '').toLowerCase();
    let eventName = 'nav_click';

    if (href.includes('booking')) eventName = 'book_now_click';
    if (href.includes('contact')) eventName = 'contact_click';

    sendEvent(eventName, {
      event_label: link.textContent.trim(),
      page_path: window.location.pathname
    });
  }, true);
})();
</script>
`;

export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('text/html')) return response;

  let html = await response.text();

  // Fix brand spelling globally
  html = html.replaceAll('Beautè', 'Beauté');

  // Inject GA
  if (!html.includes('gtag/js?id=')) {
    html = html.replace('</head>', `${gaHeadSnippet}</head>`);
  }

  // Inject tracking
  html = html.replace('</body>', `${engagementTrackingSnippet}</body>`);

  // Remove dev-style footer text
  html = html.replace('Designed for mobile, desktop, and easy GitHub deployment.', 'Professional styling by appointment.');

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=utf-8');

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
