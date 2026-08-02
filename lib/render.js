const SITE_NAME = 'CineBox';
const DEFAULT_TITLE = 'Ver Vaiana (2026) Película Online en Español y Latino';
const DEFAULT_DESC = 'Disfruta de las mejores películas y series online en español latino y castellano en alta definición HD gratis.';
const SITE_URL = 'https://cinebox-espana.up.railway.app';

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function head({ title, description, url, image, robots, type }) {
  const finalTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const finalDesc = description || DEFAULT_DESC;

  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${finalTitle}</title>
    <meta name="description" content="${finalDesc}">
    <meta name="robots" content="${robots || 'index, follow'}">
    <link rel="canonical" href="${url || SITE_URL}">
    
    <!-- Google Site Verification -->
    <meta name="google-site-verification" content="M-_SCpf4h0A8JcaYgk3_kEfeagIFV6cKmqsg0iROtiI" />

    <!-- Open Graph -->
    <meta property="og:title" content="${finalTitle}">
    <meta property="og:description" content="${finalDesc}">
    <meta property="og:url" content="${url || SITE_URL}">
    ${image ? `<meta property="og:image" content="${image}">` : ''}
    <meta property="og:type" content="${type || 'website'}">

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

    <main class="container">${bodyHtml}</main>

    <footer style="text-align: center; padding: 30px 20px; color: var(--muted); border-top: 1px solid var(--line); margin-top: 40px;">
      <!-- Native Banner Adsterra -->
      <div style="margin-bottom: 20px;">
        <script async="async" data-cfasync="false" src="https://pl30557737.effectivecpmnetwork.com/6f7b03feb080b4884047d6210ed8268e/invoke.js"></script>
        <div id="container-6f7b03feb080b4884047d6210ed8268e"></div>
      </div>

      <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Todos los derechos reservados.</p>
      
      <!-- Histats Counter Hidden -->
      <div style="display: none;">
        <div id="histats_counter"></div>
        <script type="text/javascript">var _Hasync= _Hasync|| [];
        _Hasync.push(['Histats.start', '1,5014113,4,102,120,40,00011111']);
        _Hasync.push(['Histats.fasi', '1']);
        _Hasync.push(['Histats.track_hits', '']);
        (function() {
        var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
        hs.src = ('//s10.histats.com/js15_as.js');
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
        })();</script>
        <noscript><a href="/" target="_blank"><img src="//sstatic1.histats.com/0.gif?5014113&101" alt="" border="0"></a></noscript>
      </div>
    </footer>
  </body>
  </html>`;
}

function slugify(title = '') {
  return title.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-').slice(0, 60) || 'title';
}

function posterCard(item, mediaType) {
  const type = item.media_type || mediaType || 'movie';
  const title = item.title || item.name || '';
  const poster = item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://via.placeholder.com/342x513?text=No+Image';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const slug = slugify(title);

  return `
    <a class="poster-card" href="/${type}/${item.id}/${slug}">
      <div class="poster-frame">
        <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy">
        <div class="poster-badge">★ ${rating}</div>
      </div>
      <div class="poster-title">${escapeHtml(title)}</div>
      <div class="poster-sub">${year}</div>
    </a>
  `;
}

function genreRow(genres = []) {
  if (!genres || genres.length === 0) return '';
  return `<div class="genre-row">${genres.map(g => `<span class="genre-tag">${escapeHtml(g.name)}</span>`).join('')}</div>`;
}

function trailerBlock(videos) {
  if (!videos || !videos.results) return '<p>No hay tráiler disponible.</p>';
  const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  if (!trailer) return '<p>No hay tráiler disponible.</p>';
  return `
    <style>
      .video-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        aspect-ratio: 16/9;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        margin: 0 auto;
      }
      .video-container iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 0;
      }
    </style>
    <div class="video-container">
      <iframe src="https://www.youtube.com/embed/${trailer.key}" title="Tráiler" allowfullscreen></iframe>
    </div>
  `;
}

function castGrid(credits) {
  if (!credits || !credits.cast) return '';
  const cast = credits.cast.slice(0, 6);
  return `
    <div class="cast-grid">
      ${cast.map(person => `
        <a href="/person/${person.id}/${slugify(person.name)}" class="cast-card">
          <img src="${person.profile_path ? 'https://image.tmdb.org/t/p/w185' + person.profile_path : 'https://via.placeholder.com/185x278?text=No+Photo'}" alt="${escapeHtml(person.name)}" loading="lazy">
          <div class="cast-name">${escapeHtml(person.name)}</div>
          <div class="cast-char">${escapeHtml(person.character || '')}</div>
        </a>
      `).join('')}
    </div>
  `;
}

module.exports = {
  head,
  layout,
  posterCard,
  genreRow,
  trailerBlock,
  castGrid,
  escapeHtml,
  DEFAULT_TITLE,
  DEFAULT_DESC,
  SITE_NAME,
  SITE_URL
};
