const SITE_NAME = 'CineBox';
const DEFAULT_TITLE = 'CineBox · Películas y Series Online';
const DEFAULT_DESC = 'Disfruta de las mejores películas y series online en HD.';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function img(path, size = 'w500') {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : 'https://placehold.co/342x513/17171b/8d8a92?text=No+Image';
}

function slugify(title = '') {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'title';
}

function head({ title, description, url, image, robots = 'index, follow', type = 'website' }) {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title || DEFAULT_TITLE)}</title>
    <meta name="description" content="${escapeHtml(description || DEFAULT_DESC)}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${url}">
    <link rel="stylesheet" href="/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  `;
}

function layout({ headHtml, bodyHtml, activeTab }) {
  return `<!DOCTYPE html>
  <html lang="es">
  <head>${headHtml}</head>
  <body>
    <header>
      <div class="header-inner">
        <a class="logo" href="/">Cine<span>Box</span></a>
        <nav class="tabs">
          <button class="tab-btn ${activeTab === 'movie' ? 'active' : ''}" onclick="location.href='/movie'">Películas</button>
          <button class="tab-btn ${activeTab === 'tv' ? 'active' : ''}" onclick="location.href='/tv'">Series</button>
        </nav>
        <div class="search-wrap">
          <input type="text" id="search-input" placeholder="Buscar películas o series..." autocomplete="off">
          <div class="search-results" id="search-results"></div>
        </div>
      </div>
    </header>
    <main>${bodyHtml}</main>
    <footer>
      <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}. Todos los derechos reservados.</p>
    </footer>
    <script src="/main.js" defer></script>
  </body>
  </html>`;
}

function posterCard(item, type) {
  const title = item.title || item.name || '';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '-';
  const s = slugify(title);
  return `
    <a class="poster-card" href="/${type}/${item.id}/${encodeURIComponent(s)}">
      <div class="poster-frame">
        <img src="${img(item.poster_path, 'w342')}" alt="${escapeHtml(title)}" loading="lazy">
        <div class="poster-badge">★ ${rating}</div>
      </div>
      <div class="poster-title">${escapeHtml(title)}</div>
      <div class="poster-sub">${year}</div>
    </a>
  `;
}

function genreRow(genres) {
  if (!genres || !genres.length) return '';
  return `<div class="genre-row">${genres.map(g => `<span class="genre-pill">${escapeHtml(g.name)}</span>`).join('')}</div>`;
}

function trailerBlock(videos) {
  const list = (videos && videos.results) || [];
  const trailer = list.find(v => v.site === 'YouTube' && v.type === 'Trailer') || list.find(v => v.site === 'YouTube');
  
  if (!trailer || !trailer.key) {
    return `<div class="no-trailer">No hay tráiler disponible.</div>`;
  }
  
  return `
    <div class="trailer-wrap">
      <iframe src="https://www.youtube-nocookie.com/embed/${trailer.key}?rel=0" title="Tráiler oficial" allowfullscreen loading="lazy"></iframe>
    </div>
  `;
}

function castGrid(credits) {
  const cast = (credits && credits.cast ? credits.cast : []).slice(0, 12);
  if (!cast.length) return `<div class="loading">Reparto no disponible.</div>`;
  return `
    <div class="cast-grid">
      ${cast.map(c => `
        <div>
          <img src="${img(c.profile_path, 'w185')}" alt="${escapeHtml(c.name)}" loading="lazy">
          <div class="cast-name">${escapeHtml(c.name)}</div>
          <div class="cast-role">${escapeHtml(c.character || '')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function nativeBannerAd() { return ''; }
function sideBannerAd() { return ''; }
function movieJsonLd(data, url) { return ''; }
function tvJsonLd(data, url) { return ''; }

module.exports = {
  head,
  layout,
  posterCard,
  genreRow,
  trailerBlock,
  castGrid,
  escapeHtml,
  movieJsonLd,
  tvJsonLd,
  sideBannerAd,
  nativeBannerAd,
  DEFAULT_TITLE,
  DEFAULT_DESC,
  SITE_NAME
};
