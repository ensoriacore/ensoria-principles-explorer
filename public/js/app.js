/**
 * Ensoria Principles Explorer - Main Application Controller (i18n Production Grade)
 */

(function () {
  'use strict';

  // State
  let centers = [];
  let principles = [];
  let activeCenterId = null;
  let avatar3D = null;
  let modal = null;
  let currentLang = detectUserLanguage();
  let uiStrings = {};

  // Determine base path dynamically
  let basePath = window.location.pathname;
  if (!basePath.endsWith('/')) basePath += '/';
  const apiBase = basePath + 'api';

  // DOM Elements
  const canvasContainer = document.getElementById('canvas-container');
  const centerBtns = document.querySelectorAll('.center-btn');
  const activeCard = document.getElementById('active-center-card');
  const modalBackdrop = document.getElementById('principle-modal');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const resetBtn = document.getElementById('btn-reset-view');
  const langBtns = document.querySelectorAll('.lang-btn');

  function detectUserLanguage() {
    // 1. Saved preference
    try {
      const saved = localStorage.getItem('ensoria_lang');
      if (saved && ['it', 'en', 'es'].includes(saved.toLowerCase())) {
        return saved.toLowerCase();
      }
    } catch (e) {}

    // 2. Browser / Device languages
    const browserLangs = navigator.languages || [navigator.language || 'it'];
    for (const l of browserLangs) {
      const clean = l.toLowerCase().slice(0, 2);
      if (clean === 'it') return 'it';
      if (clean === 'es') return 'es';
      if (clean === 'en') return 'en';
    }

    return 'it'; // Default constellation baseline
  }

  // Initialization
  async function init() {
    // 1. Initialize Modal
    modal = new PrincipleModal(modalBackdrop);

    // 2. Initialize 3D Avatar
    avatar3D = new EnsoriaAvatar3D(canvasContainer, {
      onSelectCenter: (centerId) => selectCenter(centerId),
      onSelectPrinciple: (principle) => modal.open(principle)
    });

    // 3. Setup UI & Language Events
    setupUIEvents();
    setupLanguageEvents();

    // 4. Fetch Data & Strings
    try {
      await loadLanguage(currentLang);
      // Clean serene baseline: zero principles visible on start
      updateActiveCard(null);
    } catch (err) {
      console.error('Failed to initialize Ensoria Principles Explorer:', err);
    }
  }

  async function loadLanguage(lang) {
    currentLang = lang;
    try {
      localStorage.setItem('ensoria_lang', lang);
    } catch (e) {}

    // Update active state on language switcher buttons
    langBtns.forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Fetch i18n UI strings, centers, and principles in parallel
    const [i18nRes, centersRes, principlesRes] = await Promise.all([
      fetch(`${apiBase}/i18n/${lang}`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${apiBase}/centers?lang=${lang}`).then(r => r.json()),
      fetch(`${apiBase}/principles?lang=${lang}`).then(r => r.json())
    ]);

    if (i18nRes.success) {
      uiStrings = i18nRes.strings;
      applyUIStrings(uiStrings);
      if (modal) modal.setI18n(uiStrings);
    }

    if (centersRes.success) {
      centers = centersRes.centers;
      centers.forEach(c => {
        const btn = document.querySelector(`.center-btn[data-center="${c.id}"]`);
        if (btn) {
          const badge = btn.querySelector('.badge-count');
          if (badge) badge.textContent = c.principlesCount;
        }
      });
    }

    if (principlesRes.success) {
      principles = principlesRes.principles;
      
      // We need to attach the specific principles list to each center
      // because the new API structure returns all principles together.
      if (centers.length > 0 && principlesRes.domains) {
          centers.forEach(c => {
              if (principlesRes.domains[c.id] && principlesRes.domains[c.id].principles) {
                  c.principles = principlesRes.domains[c.id].principles;
              }
          });
      }

      const allBtn = document.querySelector(`.center-btn[data-center="all"] .badge-count`);
      if (allBtn) allBtn.textContent = principles.length;
    }

    // Refresh active center view if already selected
    if (activeCenterId) {
      selectCenter(activeCenterId);
    }
  }

  function applyUIStrings(strings) {
    if (!strings) return;

    // Brand titles
    const titleEl = document.querySelector('.brand-title h1');
    if (titleEl && strings.appTitle) titleEl.textContent = strings.appTitle;

    const subEl = document.querySelector('.brand-title p');
    if (subEl && strings.appSubtitle) subEl.textContent = strings.appSubtitle;

    // Search input
    if (searchInput && strings.searchPlaceholder) {
      searchInput.setAttribute('placeholder', strings.searchPlaceholder);
    }

    // Reset button
    if (resetBtn && strings.resetView) {
      const span = resetBtn.querySelector('[data-i18n="resetView"]') || resetBtn;
      span.innerHTML = `<span>🎯</span> ${strings.resetView}`;
    }

    // Center button labels
    if (strings.centerButtons) {
      const bBtn = document.querySelector('.center-btn[data-center="brain"]');
      if (bBtn) {
        const count = bBtn.querySelector('.badge-count')?.textContent || '-';
        bBtn.innerHTML = `<span>🧠</span> ${strings.centerButtons.brain || 'Brain'} <span class="badge-count">${count}</span>`;
      }
      const sBtn = document.querySelector('.center-btn[data-center="soul"]');
      if (sBtn) {
        const count = sBtn.querySelector('.badge-count')?.textContent || '-';
        sBtn.innerHTML = `<span>💜</span> ${strings.centerButtons.soul || 'Soul'} <span class="badge-count">${count}</span>`;
      }
      const bdBtn = document.querySelector('.center-btn[data-center="body"]');
      if (bdBtn) {
        const count = bdBtn.querySelector('.badge-count')?.textContent || '-';
        bdBtn.innerHTML = `<span>⚡</span> ${strings.centerButtons.body || 'Body'} <span class="badge-count">${count}</span>`;
      }
      const allBtn = document.querySelector('.center-btn[data-center="all"]');
      if (allBtn) {
        const count = allBtn.querySelector('.badge-count')?.textContent || '-';
        allBtn.innerHTML = `<span>✨</span> ${strings.centerButtons.all || 'Trinity'} <span class="badge-count">${count}</span>`;
      }
    }

    // Hints
    const isMobile = window.innerWidth <= 768;
    const hintEl = document.querySelector('.interaction-hint span');
    if (hintEl) {
      hintEl.textContent = isMobile ? strings.hintMobile : strings.hintDesktop;
    }
  }

  function setupLanguageEvents() {
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        if (lang && lang !== currentLang) {
          loadLanguage(lang);
        }
      });
    });
  }

  function setupUIEvents() {
    // Center Buttons
    centerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const centerId = btn.getAttribute('data-center');
        selectCenter(centerId);
      });
    });

    // Reset View Button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (avatar3D) avatar3D.resetView();
      });
    }

    // 3D Viewport Toolbar Controls
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const togglePanBtn = document.getElementById('btn-toggle-pan');
    const recenterBtn = document.getElementById('btn-recenter');
    const panIcon = document.getElementById('pan-icon');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        if (avatar3D) avatar3D.zoomIn(0.75);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        if (avatar3D) avatar3D.zoomOut(1.3);
      });
    }

    if (togglePanBtn) {
      togglePanBtn.addEventListener('click', () => {
        if (avatar3D) {
          const mode = avatar3D.toggleControlMode();
          if (panIcon) {
            panIcon.textContent = mode === 'pan' ? '✋' : '🔄';
          }
          togglePanBtn.classList.toggle('mode-active', mode === 'pan');
        }
      });
    }

    if (recenterBtn) {
      recenterBtn.addEventListener('click', () => {
        if (avatar3D) avatar3D.resetView();
      });
    }

    // Search Input
    if (searchInput && searchResults) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          searchResults.classList.remove('active');
          searchResults.innerHTML = '';
          return;
        }

        const matches = principles.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.tag.toLowerCase().includes(query) ||
          (p.axiom && p.axiom.toLowerCase().includes(query)) ||
          p.description.toLowerCase().includes(query)
        );

        renderSearchResults(matches);
      });

      // Close search when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
          searchResults.classList.remove('active');
        }
      });
    }
  }

  function selectCenter(centerId) {
    // TOGGLE CHECK: If tapping the active center again, collapse back to pristine view
    if (activeCenterId === centerId) {
      collapseCenter();
      return;
    }

    activeCenterId = centerId;

    // Update active button state
    centerBtns.forEach(btn => {
      if (btn.getAttribute('data-center') === centerId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (centerId === 'all') {
      avatar3D.updateGraph('soul', principles);
      const allQuote = (currentLang === 'it')
        ? "Ensō — il cerchio zen di pienezza, illuminazione e potenziale infinito: armonia dinamica, radicata e trascendente."
        : ((currentLang === 'es')
          ? "Ensō — el círculo zen de plenitud, iluminación y potencial infinito: armonía operativa dinámica, enraizada y trascendente."
          : "Ensō — the Zen circle of wholeness, enlightenment, and infinite potential: dynamic, grounded, and transcendent operational harmony.");

      updateActiveCard({
        name: uiStrings.allCenters || 'Trinità Ontologica Vivente',
        slogan: (currentLang === 'it') ? 'Brain, Soul & Body in Equilibrio' : ((currentLang === 'es') ? 'Brain, Soul y Body en Equilibrio' : 'Brain, Soul & Body in Equilibrium'),
        chakra: 'Trinity / Ensō',
        quote: allQuote,
        color: '#f8fafc',
        principlesCount: principles.length,
        domain: 'all'
      });
      return;
    }

    const center = centers.find(c => c.id === centerId);
    if (!center) return;

    // Update 3D Nodal Graph
    avatar3D.updateGraph(centerId, center.principles);

    // Update Floating HUD Card
    updateActiveCard(center);
  }

  function collapseCenter() {
    activeCenterId = null;
    centerBtns.forEach(btn => btn.classList.remove('active'));
    if (avatar3D) {
      avatar3D.collapseGraph();
      avatar3D.resetView();
    }
    updateActiveCard(null);
  }

  function updateActiveCard(center) {
    if (!activeCard) return;

    activeCard.classList.remove('hidden');

    if (!center) {
      activeCard.style.borderLeftColor = 'var(--ensoria-cyan)';
      const tagEl = activeCard.querySelector('.center-meta-tag');
      const nameEl = activeCard.querySelector('.center-name');
      const sloganEl = activeCard.querySelector('.center-slogan');
      const quoteEl = activeCard.querySelector('.center-quote');
      const countEl = activeCard.querySelector('.stat-count');
      const chakraEl = activeCard.querySelector('.stat-chakra');

      if (tagEl) {
        tagEl.style.color = 'var(--ensoria-cyan)';
        tagEl.innerHTML = `<span>👑</span> <span>${(currentLang === 'it') ? 'AVATAR SOVRANO' : ((currentLang === 'es') ? 'AVATAR SOBERANO' : 'SOVEREIGN AVATAR')}</span>`;
      }
      if (nameEl) nameEl.textContent = 'Ensi · ensoriacore';
      if (sloganEl) {
        sloganEl.textContent = (currentLang === 'it')
          ? 'Tocca un centro somatico (Brain, Soul, Body) per espandere i principi'
          : ((currentLang === 'es')
            ? 'Toca un centro somático (Brain, Soul, Body) para expandir los principios'
            : 'Tap a somatic center (Brain, Soul, Body) to expand principles');
      }
      if (quoteEl) {
        quoteEl.textContent = '"Brain · Soul · Body"';
        quoteEl.style.display = 'block';
      }
      if (countEl) countEl.textContent = principles.length || '31';
      if (chakraEl) chakraEl.textContent = 'Trinity / Ensō';
      return;
    }

    activeCard.style.borderLeftColor = center.color || '#38bdf8';

    const tagEl = activeCard.querySelector('.center-meta-tag');
    const nameEl = activeCard.querySelector('.center-name');
    const sloganEl = activeCard.querySelector('.center-slogan');
    const quoteEl = activeCard.querySelector('.center-quote');
    const countEl = activeCard.querySelector('.stat-count');
    const chakraEl = activeCard.querySelector('.stat-chakra');

    if (tagEl) {
      tagEl.style.color = center.color;
      const tagLabel = uiStrings.somaticCenterTag || 'CENTRO SOMATICO';
      tagEl.innerHTML = `<span>${center.symbol || '⚡'}</span> ${tagLabel}`;
    }
    if (nameEl) nameEl.textContent = center.name;
    if (sloganEl) sloganEl.textContent = center.slogan || center.description;
    if (quoteEl) {
      if (center.quote) {
        quoteEl.textContent = `"${center.quote}"`;
        quoteEl.style.display = 'block';
      } else {
        quoteEl.style.display = 'none';
      }
    }
    if (countEl) countEl.textContent = center.principlesCount;
    if (chakraEl) chakraEl.textContent = center.chakra;
  }

  function renderSearchResults(matches) {
    if (matches.length === 0) {
      const noRes = uiStrings.noResults || "Nessun principio corrispondente";
      searchResults.innerHTML = `
        <div style="padding: 14px; text-align: center; color: var(--ensoria-text-dim); font-size: 0.8rem;">
          ${noRes}
        </div>
      `;
      searchResults.classList.add('active');
      return;
    }

    let html = '';
    matches.forEach(m => {
      let badgeColor = m.domainColor || '#38bdf8';
      html += `
        <div class="search-item" data-id="${m.id}">
          <div class="search-item-header">
            <span class="search-item-title">${m.title}</span>
            <span class="search-item-domain" style="color: ${badgeColor};">${m.domain.toUpperCase()}</span>
          </div>
          <div class="search-item-axiom">${m.axiom || m.tag}</div>
        </div>
      `;
    });

    searchResults.innerHTML = html;
    searchResults.classList.add('active');

    // Click handler for items
    searchResults.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const principle = principles.find(p => p.id === id);
        if (principle) {
          modal.open(principle);
          searchResults.classList.remove('active');
        }
      });
    });
  }

  // DOM Content Loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
