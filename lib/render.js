const SITE_NAME = 'CineBox';
const DEFAULT_DESC = 'Películas y Series Online en Español';
const SITE_URL = 'https://cinebox-espana.up.railway.app';

function head({ title, description, url, robots }) {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || SITE_NAME}</title>
    <meta name="description" content="${description || DEFAULT_DESC}">
    <meta name="robots" content="${robots || 'index, follow'}">
    <link rel="canonical" href="${url || SITE_URL}">
    
    <!-- Google Site Verification -->
    <meta name="google-site-verification" content="M-_SCpf4h0A8JcaYgk3_kEfeagIFV6cKmqsg0iROtiI" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="/style.css">

    <!-- Adsterra Pop-Under & Social Bar -->
    <script src="https://pl30557735.effectivecpmnetwork.com/51/65/ed/5165ed7649b06fc95e9d3bbc1839dcd9.js"></script>
    <script src="https://pl30557736.effectivecpmnetwork.com/af/c1/6d/afc16d8a70f1f493abf2098939fca8f7.js"></script>
  `;
}

function layout({ headHtml, bodyHtml, activeTab }) {
  return `<!DOCTYPE html>
  <html lang="es">
  <head>
    ${headHtml}
  </head>
  <body>
    <header>
      <div class="header-inner">
        <a class="logo" href="/">Cine<span>Box</span></a>
        <nav class="tabs">
          <button class="tab-btn ${activeTab === 'movie' ? 'active' : ''}" onclick="location.href='/movie'">Películas</button>
          <button class="tab-btn ${activeTab === 'tv' ? 'active' : ''}" onclick="location.href='/tv'">Series</button>
        </nav>
      </div>
    </header>

    <main>${bodyHtml}</main>

    <footer style="text-align: center; padding: 30px 20px; color: var(--muted); border-top: 1px solid var(--line); margin-top: 40px;">
      <!-- Native Banner Adsterra -->
      <div style="margin-bottom: 20px;">
        <script async="async" data-cfasync="false" src="https://pl30557737.effectivecpmnetwork.com/6f7b03feb080b4884047d6210ed8268e/invoke.js"></script>
        <div id="container-6f7b03feb080b4884047d6210ed8268e"></div>
      </div>

      <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Todos los derechos reservados.</p>
      
      <!-- Histats Counter -->
      <div id="histats_counter" style="margin-top: 15px; display: inline-block;"></div>
      <script type="text/javascript">var _Hasync= _Hasync|| [];
      _Hasync.push(['Histats.start', '1,5014113,4,1,120,40,00011111']);
      _Hasync.push(['Histats.fasi', '1']);
      _Hasync.push(['Histats.track_hits', '']);
      (function() {
      var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
      hs.src = ('//s10.histats.com/js15_as.js');
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
      })();</script>
      <noscript><a href="/" target="_blank"><img src="//sstatic1.histats.com/0.gif?5014113&101" alt="" border="0"></a></noscript>
    </footer>
  </body>
  </html>`;
}

module.exports = { head, layout, SITE_NAME, DEFAULT_DESC, SITE_URL };
