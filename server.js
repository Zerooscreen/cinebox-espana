const express = require('express');
const fetch = require('node-fetch');
const { 
  head, layout, posterCard, genreRow, trailerBlock, castGrid, 
  escapeHtml, movieJsonLd, tvJsonLd, sideBannerAd, nativeBannerAd, 
  DEFAULT_TITLE, DEFAULT_DESC, SITE_NAME 
} = require('./lib/render');

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'YOUR_TMDB_API_KEY';
const SITE_URL = process.env.SITE_URL || 'https://cinebox-espana.up.railway.app';

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

async function tmdb(endpoint, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'es-ES');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

function slugify(title = '') {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'title';
}

// ---------- SITEMAP & ROBOTS.TXT ----------

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /\nDisallow: /watch/\nSitemap: https://cinebox-espana.up.railway.app/sitemap.xml');
});

app.get('/sitemap.xml', async (req, res) => {
  res.type('application/xml');
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Halaman Utama & Kategori
  const staticUrls = [
    { loc: 'https://cinebox-espana.up.railway.app/', priority: '1.0', changefreq: 'daily' },
    { loc: 'https://cinebox-espana.up.railway.app/movie', priority: '0.9', changefreq: 'daily' },
    { loc: 'https://cinebox-espana.up.railway.app/tv', priority: '0.9', changefreq: 'daily' }
  ];

  staticUrls.forEach(item => {
    xml += `  <url>\n`;
    xml += `    <loc>${item.loc}</loc>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  try {
    const [popularMovies, popularTv] = await Promise.all([
      tmdb('/trending/movie/day'),
      tmdb('/trending/tv/day')
    ]);

    if (popularMovies && popularMovies.results) {
      popularMovies.results.forEach(movie => {
        const slug = slugify(movie.title || 'movie');
        xml += `  <url>\n`;
        xml += `    <loc>https://cinebox-espana.up.railway.app/movie/${movie.id}/${slug}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });
    }

    if (popularTv && popularTv.results) {
      popularTv.results.forEach(tv => {
        const slug = slugify(tv.name || 'tv');
        xml += `  <url>\n`;
        xml += `    <loc>https://cinebox-espana.up.railway.app/tv/${tv.id}/${slug}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
  }

  xml += `</urlset>`;
  res.send(xml);
});

// ---------- HOME: / ----------
app.get('/', async (req, res) => {
  try {
    const [trending, movies, tv] = await Promise.all([
      tmdb('/trending/all/day'),
      tmdb('/movie/popular'),
      tmdb('/tv/popular'),
    ]);

    const heroItem = (trending.results || [])[0] || {};
    const heroSlug = slugify(heroItem.title || heroItem.name);

    const bodyHtml = `
      <div id="hero" style="background-image:url('https://image.tmdb.org/t/p/original${heroItem.backdrop_path}')">
        <div class="hero-fade"></div>
        <div class="hero-content">
          <div class="hero-eyebrow">DESTACADO HOY</div>
          <h1 class="hero-title">${escapeHtml(heroItem.title || heroItem.name)}</h1>
          <p class="hero-overview">${escapeHtml(heroItem.overview || '').slice(0, 160)}...</p>
          <a class="hero-btn" href="/${heroItem.media_type === 'tv' ? 'tv' : 'movie'}/${heroItem.id}/${encodeURIComponent(heroSlug)}">Ver detalles ▸</a>
        </div>
      </div>
      <section class="row">
        <div class="row-head"><h2>Películas Populares</h2></div>
        <div class="grid">
          ${(movies.results || []).slice(0, 12).map(item => posterCard(item, 'movie')).join('')}
        </div>
      </section>
      <section class="row">
        <div class="row-head"><h2>Series Populares</h2></div>
        <div class="grid">
          ${(tv.results || []).slice(0, 12).map(item => posterCard(item, 'tv')).join('')}
        </div>
      </section>
    `;

    const headHtml = head({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      url: SITE_URL,
      image: `https://image.tmdb.org/t/p/w780${heroItem.backdrop_path || ''}`,
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'home' }));
  } catch (e) {
    res.status(500).send('Error del servidor');
  }
});

// ---------- DETALLE: /movie/:id/:slug? ----------
app.get('/movie/:id/:slug?', async (req, res) => {
  const { id } = req.params;
  try {
    const [data, credits, videos, similarData] = await Promise.all([
      tmdb(`/movie/${id}`),
      tmdb(`/movie/${id}/credits`),
      tmdb(`/movie/${id}/videos`),
      tmdb(`/movie/${id}/similar`),
    ]);
    const correctSlug = slugify(data.title);
    if (req.params.slug !== correctSlug) {
      return res.redirect(301, `/movie/${id}/${encodeURIComponent(correctSlug)}`);
    }

    const watchUrl = `/watch/movie/${id}`;

    const bodyHtml = `
      <a class="back-btn" href="/movie">← Volver</a>
      <div class="detail-hero">
        <div class="hero-bg" style="background-image:url('https://image.tmdb.org/t/p/original${data.backdrop_path}')"></div>
        <div class="hero-fade"></div>
        <div class="detail-poster"><img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="Cartel"></div>
        <div class="detail-info">
          <div class="detail-eyebrow">Película</div>
          <h1 class="detail-title">${escapeHtml(data.title)}</h1>
          <div class="detail-orig">${escapeHtml(data.original_title)} · ${(data.release_date || '').slice(0, 4)}</div>
          ${data.tagline ? `<div class="tagline">"${escapeHtml(data.tagline)}"</div>` : ''}
          <div class="detail-meta">
            <span class="m-item star">★ ${data.vote_average ? data.vote_average.toFixed(1) : '-'} / 10</span>
            <span class="m-item">${data.runtime ? data.runtime + ' min' : ''}</span>
            <span class="m-item">${(data.release_date || '').slice(0, 4)}</span>
          </div>
          ${genreRow(data.genres)}
          <div class="action-buttons">
            <a href="${watchUrl}" class="btn-watch" target="_blank" rel="nofollow">Ver ahora ▸</a>
          </div>
        </div>
      </div>
      <div class="section-block"><h3>Sinopsis</h3><div class="bio-text">${escapeHtml(data.overview) || 'Sinopsis no disponible.'}</div></div>
      <div class="section-block"><h3>Tráiler</h3>${trailerBlock(videos)}</div>
      <div class="section-block"><h3>Reparto</h3>${castGrid(credits)}</div>
      <div class="section-block">
        <h3>Películas similares</h3>
        <div class="similar-grid">
          ${(similarData.results || []).slice(0, 6).map(item => posterCard(item, 'movie')).join('')}
        </div>
      </div>
    `;

    const headHtml = head({
      title: `${data.title} · Película Online`,
      description: data.overview || DEFAULT_DESC,
      url: `${SITE_URL}/movie/${id}/${encodeURIComponent(correctSlug)}`,
      image: `https://image.tmdb.org/t/p/w780${data.backdrop_path}`,
      type: 'video.movie',
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'movie' }));
  } catch (e) {
    res.status(404).send('Película no encontrada');
  }
});

// ---------- DETALLE: /tv/:id/:slug? ----------
app.get('/tv/:id/:slug?', async (req, res) => {
  const { id } = req.params;
  try {
    const [data, credits, videos, similarData] = await Promise.all([
      tmdb(`/tv/${id}`),
      tmdb(`/tv/${id}/credits`),
      tmdb(`/tv/${id}/videos`),
      tmdb(`/tv/${id}/similar`),
    ]);
    const correctSlug = slugify(data.name);
    if (req.params.slug !== correctSlug) {
      return res.redirect(301, `/tv/${id}/${encodeURIComponent(correctSlug)}`);
    }

    const watchUrl = `/watch/tv/${id}`;

    const seasons = (data.seasons || []).filter(s => s.season_number >= 0);
    const seasonsHtml = seasons.map(s => `
      <div class="season-item" data-season="${s.season_number}" data-tv="${id}">
        <div class="season-head">
          <img src="https://image.tmdb.org/t/p/w92${s.poster_path}" alt="">
          <div>
            <div class="s-title">${escapeHtml(s.name)}</div>
            <div class="s-meta">${s.episode_count} episodios · ${(s.air_date || '').slice(0, 4)}</div>
          </div>
          <div class="chev">▶</div>
        </div>
        <div class="episode-panel"></div>
      </div>
    `).join('');

    const bodyHtml = `
      <a class="back-btn" href="/tv">← Volver</a>
      <div class="detail-hero">
        <div class="hero-bg" style="background-image:url('https://image.tmdb.org/t/p/original${data.backdrop_path}')"></div>
        <div class="hero-fade"></div>
        <div class="detail-poster"><img src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt=""></div>
        <div class="detail-info">
          <div class="detail-eyebrow">Serie</div>
          <h1 class="detail-title">${escapeHtml(data.name)}</h1>
          <div class="detail-orig">${escapeHtml(data.original_name)} · ${(data.first_air_date || '').slice(0, 4)}</div>
          <div class="detail-meta">
            <span class="m-item star">★ ${data.vote_average ? data.vote_average.toFixed(1) : '-'} / 10</span>
            <span class="m-item">${data.number_of_seasons || '-'} temporadas</span>
          </div>
          ${genreRow(data.genres)}
          <div class="action-buttons">
            <a href="${watchUrl}" class="btn-watch" target="_blank" rel="nofollow">Ver ahora ▸</a>
          </div>
        </div>
      </div>
      <div class="section-block"><h3>Sinopsis</h3><div class="bio-text">${escapeHtml(data.overview) || 'Sinopsis no disponible.'}</div></div>
      <div class="section-block"><h3>Tráiler</h3>${trailerBlock(videos)}</div>
      <div class="section-block"><h3>Reparto</h3>${castGrid(credits)}</div>
      <div class="section-block">
        <h3>Temporadas y episodios</h3>
        <div class="season-list" id="season-list">${seasonsHtml}</div>
      </div>
      <div class="section-block">
        <h3>Series similares</h3>
        <div class="similar-grid">
          ${(similarData.results || []).slice(0, 6).map(item => posterCard(item, 'tv')).join('')}
        </div>
      </div>
    `;

    const headHtml = head({
      title: `${data.name} · Serie Online`,
      description: data.overview || DEFAULT_DESC,
      url: `${SITE_URL}/tv/${id}/${encodeURIComponent(correctSlug)}`,
      image: `https://image.tmdb.org/t/p/w780${data.backdrop_path}`,
      type: 'video.tv_show',
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: 'tv' }));
  } catch (e) {
    res.status(404).send('Serie no encontrada');
  }
});

// ---------- RUTE: COUNTDOWN / WATCH REDIRECT ----------
app.get('/watch/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  
  try {
    const endpoint = type === 'tv' ? `/tv/${id}` : `/movie/${id}`;
    const data = await tmdb(endpoint);
    const title = data.title || data.name || 'video';
    const itemSlug = slugify(title);

    const targetUrl = `https://zeromovies4k.net/es/watch/${type}/${id}/${itemSlug}`;

    const bodyHtml = `
      <div style="max-width: 600px; margin: 80px auto; text-align: center; padding: 40px; background: var(--card); border: 1px solid var(--line); border-radius: 12px;">
        <h1 style="font-family: 'Black Han Sans'; font-size: 28px; margin-bottom: 16px;">Preparando tu reproductor...</h1>
        <p style="color: var(--muted); margin-bottom: 24px;">Serás redirigido al reproductor en <span id="countdown" style="color: var(--red); font-weight: bold; font-size: 20px;">5</span> segundos.</p>
        <div style="margin-bottom: 30px;">
          <div style="width: 50px; height: 50px; border: 4px solid var(--line); border-top-color: var(--red); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>
        <a href="${targetUrl}" class="btn-watch" style="display: inline-block;">Ir ahora manualmente ▸</a>
      </div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
      <script>
        let seconds = 5;
        const countEl = document.getElementById('countdown');
        const timer = setInterval(() => {
          seconds--;
          countEl.textContent = seconds;
          if (seconds <= 0) {
            clearInterval(timer);
            window.location.href = "${targetUrl}";
          }
        }, 1000);
      </script>
    `;

    const headHtml = head({
      title: 'Redirigiendo al reproductor · CineBox',
      description: DEFAULT_DESC,
      url: `${SITE_URL}/watch/${type}/${id}`,
      robots: 'noindex, nofollow',
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: '' }));
  } catch (e) {
    const targetUrl = `https://zeromovies4k.net/es/watch/${type}/${id}`;
    res.redirect(targetUrl);
  }
});

// ---------- RUTE: DETALLE AKTOR / PERSON ----------
app.get('/person/:id/:slug?', async (req, res) => {
  const { id } = req.params;
  try {
    const [person, combinedCredits] = await Promise.all([
      tmdb(`/person/${id}`),
      tmdb(`/person/${id}/combined_credits`),
    ]);

    const correctSlug = slugify(person.name);
    if (req.params.slug !== correctSlug) {
      return res.redirect(301, `/person/${id}/${encodeURIComponent(correctSlug)}`);
    }

    const castMovies = (combinedCredits.cast || []).sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    const bodyHtml = `
      <a class="back-btn" href="javascript:history.back()">← Volver</a>
      <div class="detail-hero" style="align-items: flex-start;">
        <div class="detail-poster"><img src="https://image.tmdb.org/t/p/h632${person.profile_path}" alt=""></div>
        <div class="detail-info">
          <div class="detail-eyebrow">Biografía</div>
          <h1 class="detail-title">${escapeHtml(person.name)}</h1>
          <div class="detail-meta">
            ${person.birthday ? `<span class="m-item">Nacimiento: ${person.birthday}</span>` : ''}
            ${person.place_of_birth ? `<span class="m-item">Lugar: ${escapeHtml(person.place_of_birth)}</span>` : ''}
          </div>
          <div class="bio-text" style="margin-top: 15px;">${escapeHtml(person.biography) || 'Biografía no disponible.'}</div>
        </div>
      </div>
      <div class="section-block" style="margin-top: 40px;">
        <h3>Películas y Series de ${escapeHtml(person.name)}</h3>
        <div class="grid">
          ${castMovies.map(item => posterCard(item, item.media_type === 'tv' ? 'tv' : 'movie')).join('')}
        </div>
      </div>
    `;

    const headHtml = head({
      title: `${person.name} · Películas y Biografía`,
      description: person.biography ? person.biography.slice(0, 150) + '...' : DEFAULT_DESC,
      url: `${SITE_URL}/person/${id}/${encodeURIComponent(correctSlug)}`,
      image: `https://image.tmdb.org/t/p/w780${person.profile_path}`,
    });

    res.send(layout({ headHtml, bodyHtml, activeTab: '' }));
  } catch (e) {
    res.status(404).send('Actor no encontrado');
  }
});

// Halaman Katalog Utama Películas & Series
app.get('/movie', async (req, res) => {
  const data = await tmdb('/movie/popular');
  const bodyHtml = `
    <h1 style="font-family:'Black Han Sans'; font-size:28px; margin:24px 0;">Películas Populares</h1>
    <div class="grid">${(data.results || []).map(item => posterCard(item, 'movie')).join('')}</div>
  `;
  res.send(layout({ headHtml: head({ title: 'Películas · CineBox', description: DEFAULT_DESC, url: `${SITE_URL}/movie` }), bodyHtml, activeTab: 'movie' }));
});

app.get('/tv', async (req, res) => {
  const data = await tmdb('/tv/popular');
  const bodyHtml = `
    <h1 style="font-family:'Black Han Sans'; font-size:28px; margin:24px 0;">Series Populares</h1>
    <div class="grid">${(data.results || []).map(item => posterCard(item, 'tv')).join('')}</div>
  `;
  res.send(layout({ headHtml: head({ title: 'Series · CineBox', description: DEFAULT_DESC, url: `${SITE_URL}/tv` }), bodyHtml, activeTab: 'tv' }));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
