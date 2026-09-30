// Content Script - Inyección reactiva y control del Modo Oscuro
// Ejecutado en document_start para eliminar el parpadeo blanco (Zero FOUC)

(function () {
  'use strict';

  const ATTR_NAME = 'data-oscure-utp';
  const ATTR_SHOW_BANNER = 'data-oscure-show-banner';

  let shouldHideBanner = true;

  // Utilidades para cálculo dinámico del color de acento
  function hexToRgb(hex) {
    let c = (hex || '#6366f1').replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function adjustBrightness(hex, percent) {
    const { r, g, b } = hexToRgb(hex);
    const adjust = (val) => Math.min(255, Math.max(0, Math.round(val + (val * (percent / 100)))));
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
  }

  function generateAccentPalette(baseHex) {
    const base = baseHex || '#6366f1';
    const rgb = hexToRgb(base);
    return {
      base: base,
      hover: adjustBrightness(base, -18),
      light: adjustBrightness(base, 25),
      glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
      subtle: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
    };
  }

  // Inyección de hoja de estilos dinámica para eliminar el espacio del banner al instante
  function getOrCreateBannerKillerStyle() {
    let styleEl = document.getElementById('oscure-banner-killer-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'oscure-banner-killer-style';
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(styleEl);
      }
    }
    return styleEl;
  }

  function updateBannerKillerStyle(hide) {
    const styleEl = getOrCreateBannerKillerStyle();
    if (!styleEl) return;

    if (hide) {
      styleEl.textContent = `
        /* Colapso total e instantáneo del carrusel de anuncios UTP */
        .slick-slider,
        .slick-list,
        .slick-track,
        .slick-slide,
        .slick-dots,
        .slick-arrow,
        [class*="slick-slider"],
        [class*="slick-initialized"],
        [data-oscure-banner="true"],
        .MVAic,
        .dqpxyc,
        .sc-bAeIUo,
        .jXktXU,
        .swiper,
        .swiper-container,
        div:has(> .slick-slider),
        div:has(> * > .slick-slider):not(:has(h2)):not(:has(h3)):not(:has(select)),
        div:has(> * > * > .slick-slider):not(:has(h2)):not(:has(h3)):not(:has(select)) {
          display: none !important;
          height: 0px !important;
          min-height: 0px !important;
          max-height: 0px !important;
          margin: 0px !important;
          padding: 0px !important;
          border: none !important;
          box-shadow: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          overflow: hidden !important;
        }

        /* Forzar fondo oscuro en tarjetas de contenido de curso (.DIRcG) */
        .sc-dcOKER,
        .DIRcG,
        [class*="DIRcG"],
        [class*="dcOKER"],
        [data-oscure-content-card="true"] {
          background-color: #12131d !important;
          color: #f8fafc !important;
          border: 1px solid #24263a !important;
          border-radius: 14px !important;
        }

        [data-main-scroll="true"] [style*="rgb(255, 255, 255)"],
        [data-main-scroll="true"] [style*="#fff"],
        [data-main-scroll="true"] [style*="white"],
        [data-main-scroll="true"] [class*="absolute"][style*="255, 255, 255"] {
          background-color: #12131d !important;
          color: #f8fafc !important;
        }

        /* Bloques de semanas y acordeones oscuros (SOLO en table-item) */
        [data-testid="table-item"],
        [data-oscure-week-block="true"] {
          background-color: #151624 !important;
          border: 1px solid #26283c !important;
          border-radius: 10px !important;
          color: #f8fafc !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
          transition: all 0.2s ease !important;
        }

        [data-testid="table-item"]:hover {
          background-color: #1c1d2e !important;
          border-color: var(--oscure-accent, #6366f1) !important;
          box-shadow: 0 4px 16px var(--oscure-accent-glow, rgba(99, 102, 241, 0.25)) !important;
        }

        [data-testid="table-item"] p,
        [data-testid="table-item"] span,
        [data-testid="table-item"] h3,
        [data-testid="table-item"] h4 {
          color: #f8fafc !important;
        }

        [data-testid="table-item"][class*="border-l"],
        [data-testid="table-item"][style*="border-left"] {
          border-left: 4px solid var(--oscure-accent, #6366f1) !important;
        }

        [data-testid="table-item"] svg {
          stroke: #a5b4fc !important;
          transition: stroke 0.2s ease !important;
        }

        [data-testid="table-item"]:hover svg {
          stroke: #ffffff !important;
        }

        /* Contenedor general de la semana sin fondos blancos ni bordes dobles */
        [name*="SectionContentStudent"] {
          background-color: transparent !important;
          border: none !important;
        }

        [name*="SectionContentStudent"] [class*="bg-white"],
        [name*="SectionContentStudent"] [style*="rgb(255, 255, 255)"],
        [name*="SectionContentStudent"] [style*="#fff"],
        [name*="SectionContentStudent"] [style*="white"] {
          background-color: #12131d !important;
          color: #cbd5e1 !important;
          border-color: #24263a !important;
        }
      `;
    } else {
      styleEl.textContent = `
        .sc-dcOKER,
        .DIRcG,
        [class*="DIRcG"],
        [class*="dcOKER"],
        [data-oscure-content-card="true"] {
          background-color: #12131d !important;
          color: #f8fafc !important;
          border: 1px solid #24263a !important;
          border-radius: 14px !important;
        }

        [data-main-scroll="true"] [style*="rgb(255, 255, 255)"],
        [data-main-scroll="true"] [style*="#fff"],
        [data-main-scroll="true"] [style*="white"],
        [data-main-scroll="true"] [class*="absolute"][style*="255, 255, 255"] {
          background-color: #12131d !important;
          color: #f8fafc !important;
        }

        /* Bloques de semanas y acordeones oscuros (SOLO en table-item) */
        [data-testid="table-item"],
        [data-oscure-week-block="true"] {
          background-color: #151624 !important;
          border: 1px solid #26283c !important;
          border-radius: 10px !important;
          color: #f8fafc !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
          transition: all 0.2s ease !important;
        }

        [data-testid="table-item"]:hover {
          background-color: #1c1d2e !important;
          border-color: var(--oscure-accent, #6366f1) !important;
          box-shadow: 0 4px 16px var(--oscure-accent-glow, rgba(99, 102, 241, 0.25)) !important;
        }

        [data-testid="table-item"] p,
        [data-testid="table-item"] span,
        [data-testid="table-item"] h3,
        [data-testid="table-item"] h4 {
          color: #f8fafc !important;
        }

        [data-testid="table-item"][class*="border-l"],
        [data-testid="table-item"][style*="border-left"] {
          border-left: 4px solid var(--oscure-accent, #6366f1) !important;
        }

        [data-testid="table-item"] svg {
          stroke: #a5b4fc !important;
          transition: stroke 0.2s ease !important;
        }

        [data-testid="table-item"]:hover svg {
          stroke: #ffffff !important;
        }

        /* Contenedor general de la semana sin fondos blancos ni bordes dobles */
        [name*="SectionContentStudent"] {
          background-color: transparent !important;
          border: none !important;
        }

        [name*="SectionContentStudent"] [class*="bg-white"],
        [name*="SectionContentStudent"] [style*="rgb(255, 255, 255)"],
        [name*="SectionContentStudent"] [style*="#fff"],
        [name*="SectionContentStudent"] [style*="white"] {
          background-color: #12131d !important;
          color: #cbd5e1 !important;
          border-color: #24263a !important;
        }
      `;
    }
  }

  // Aplica el estado del tema y variables CSS
  function applyTheme(enabled, brightness = 100, contrast = 100, hideBanner = true, accentColor = '#6366f1') {
    shouldHideBanner = hideBanner !== false;
    const root = document.documentElement;
    if (!root) return;

    if (enabled) {
      root.setAttribute(ATTR_NAME, 'active');
      root.style.setProperty('--oscure-brightness', `${brightness}%`);
      root.style.setProperty('--oscure-contrast', `${contrast}%`);

      // Aplicar color de acento personalizado y sus variantes
      const palette = generateAccentPalette(accentColor);
      root.style.setProperty('--oscure-accent', palette.base);
      root.style.setProperty('--oscure-accent-hover', palette.hover);
      root.style.setProperty('--oscure-accent-light', palette.light);
      root.style.setProperty('--oscure-accent-glow', palette.glow);
      root.style.setProperty('--oscure-accent-subtle', palette.subtle);
    } else {
      root.removeAttribute(ATTR_NAME);
      root.style.removeProperty('--oscure-brightness');
      root.style.removeProperty('--oscure-contrast');
      root.style.removeProperty('--oscure-accent');
      root.style.removeProperty('--oscure-accent-hover');
      root.style.removeProperty('--oscure-accent-light');
      root.style.removeProperty('--oscure-accent-glow');
      root.style.removeProperty('--oscure-accent-subtle');
    }

    if (!shouldHideBanner) {
      root.setAttribute(ATTR_SHOW_BANNER, 'true');
    } else {
      root.removeAttribute(ATTR_SHOW_BANNER);
    }

    updateBannerKillerStyle(shouldHideBanner);
    tagSpecificComponents();
  }

  // Identifica y marca componentes específicos de UTP+class para estilos de máxima precisión
  function tagSpecificComponents() {
    const isDarkActive = document.documentElement.getAttribute(ATTR_NAME) === 'active';

    if (!isDarkActive) {
      const styledElements = document.querySelectorAll(
        '[data-oscure-content-card], [data-oscure-neutralized-bg], [data-oscure-week-block]'
      );
      for (const el of styledElements) {
        el.style.removeProperty('background-color');
        el.style.removeProperty('color');
        el.style.removeProperty('border');
        el.style.removeProperty('border-color');
      }
      removeBannerCompletely(shouldHideBanner);
      return;
    }

    // 1. Identificar barra lateral (Sidebar) por sus enlaces característicos
    const sidebarLink = document.querySelector('a[href*="/student/courses"], a[href*="/student/messages"], a[href*="/student/calendar"], a[href*="/student/help"], a[href*="messages"]');
    if (sidebarLink) {
      let container = sidebarLink.parentElement;
      while (container && container !== document.body && container.clientWidth < 240) {
        container.setAttribute('data-oscure-sidebar', 'true');
        container = container.parentElement;
      }
    }

    // 2. Identificar el widget de "Actividades semanales"
    const actHeader = document.querySelector('span[data-testid="header"], [data-testid="header"]');
    let actContainer = null;
    if (actHeader) {
      actContainer = actHeader.closest('div');
      actHeader.setAttribute('data-oscure-activities-header', 'true');
    } else {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, span, p');
      for (const h of headings) {
        if (h.textContent && h.textContent.trim().toLowerCase().includes('actividades semanales')) {
          actContainer = h.closest('div');
          h.setAttribute('data-oscure-activities-header', 'true');
          break;
        }
      }
    }

    if (actContainer) {
      actContainer.setAttribute('data-oscure-activities', 'true');
      const listContainer = actContainer.querySelector('.evKorX, div:has(> a[data-testid="card"]), div:last-child');
      if (listContainer) {
        listContainer.setAttribute('data-oscure-activities-list', 'true');
      }
      const cards = actContainer.querySelectorAll('a[data-testid="card"], [data-testid="card"], .djccpv');
      for (const card of cards) {
        card.setAttribute('data-oscure-activity-card', 'true');
      }
    }

    // 3. Identificar tarjetas de contenido de curso (.DIRcG, .sc-dcOKER, etc.)
    const contentCards = document.querySelectorAll(
      '.DIRcG, [class*="DIRcG"], .sc-dcOKER, [class*="dcOKER"], [data-testid="sub-layout"] .bg-white'
    );
    for (const card of contentCards) {
      card.setAttribute('data-oscure-content-card', 'true');
      card.style.setProperty('background-color', '#12131d', 'important');
      card.style.setProperty('color', '#f8fafc', 'important');
    }

    // Neutralizar elementos con estilos inline blancos dentro de la vista de curso y dentro de las semanas
    const whiteInlines = document.querySelectorAll(
      '[data-main-scroll="true"] [style*="rgb(255, 255, 255)"], [data-main-scroll="true"] [style*="#fff"], [data-main-scroll="true"] [style*="white"], [name*="SectionContentStudent"] [style*="rgb(255, 255, 255)"], [name*="SectionContentStudent"] [style*="#fff"], [name*="SectionContentStudent"] [style*="white"], [name*="SectionContentStudent"] .bg-white, .DIRcG [class*="absolute"], [class*="DIRcG"] [class*="absolute"]'
    );
    for (const el of whiteInlines) {
      el.setAttribute('data-oscure-neutralized-bg', 'true');
      el.style.setProperty('background-color', '#12131d', 'important');
      el.style.setProperty('color', '#cbd5e1', 'important');
      el.style.setProperty('border-color', '#26283c', 'important');
    }

    // 4. Identificar bloques de semanas e información del curso (SOLO [data-testid="table-item"])
    const weekBlocks = document.querySelectorAll('[data-testid="table-item"]');
    for (const block of weekBlocks) {
      block.setAttribute('data-oscure-week-block', 'true');
      block.style.setProperty('background-color', '#151624', 'important');
      block.style.setProperty('border', '1px solid #26283c', 'important');
      block.style.setProperty('border-radius', '10px', 'important');
      block.style.setProperty('color', '#f8fafc', 'important');

      const texts = block.querySelectorAll('p, span, h3, h4');
      for (const t of texts) {
        t.style.setProperty('color', '#f8fafc', 'important');
      }

      const svgs = block.querySelectorAll('svg');
      for (const svg of svgs) {
        svg.style.setProperty('stroke', '#a5b4fc', 'important');
      }
    }

    // 5. Eliminar / Ocultar el carrusel de banner de publicidad (.slick-slider y contenedores padre)
    removeBannerCompletely(shouldHideBanner);
  }

  function removeBannerCompletely(shouldHide) {
    if (!shouldHide) {
      // Restaurar si el usuario desactiva la opción
      const tagged = document.querySelectorAll('[data-oscure-banner="true"]');
      for (const el of tagged) {
        el.removeAttribute('data-oscure-banner');
        el.style.removeProperty('display');
        el.style.removeProperty('height');
        el.style.removeProperty('min-height');
        el.style.removeProperty('max-height');
        el.style.removeProperty('margin');
        el.style.removeProperty('padding');
        el.style.removeProperty('border');
        el.style.removeProperty('visibility');
        el.style.removeProperty('overflow');
      }
      return;
    }

    // 1. Localizar los sliders (slick, swiper o styled-components asociados)
    const sliders = document.querySelectorAll(
      '.slick-slider, [class*="slick-slider"], .slick-list, .slick-track, .MVAic, .dqpxyc, .swiper, .swiper-container'
    );

    for (const slider of sliders) {
      slider.setAttribute('data-oscure-banner', 'true');
      slider.style.setProperty('display', 'none', 'important');
      slider.style.setProperty('height', '0px', 'important');
      slider.style.setProperty('min-height', '0px', 'important');
      slider.style.setProperty('max-height', '0px', 'important');
      slider.style.setProperty('margin', '0px', 'important');
      slider.style.setProperty('padding', '0px', 'important');
      slider.style.setProperty('overflow', 'hidden', 'important');

      // Buscar el contenedor padre que envuelve exclusivamente el banner
      let parent = slider.parentElement;
      while (parent && parent !== document.body && parent !== document.getElementById('root')) {
        // Verificar si contiene elementos del contenido principal (Mis cursos, actividades, filtros)
        const text = parent.innerText || parent.textContent || '';
        const hasMainContent = 
          text.includes('Mis cursos') || 
          text.includes('Actividades semanales') || 
          text.includes('Filtrar por') ||
          parent.querySelector('h1, h2, h3, select, a[href*="/student/courses"], aside, nav');

        if (hasMainContent) {
          break;
        }

        // Es un contenedor exclusivo del banner
        parent.setAttribute('data-oscure-banner', 'true');
        parent.style.setProperty('display', 'none', 'important');
        parent.style.setProperty('height', '0px', 'important');
        parent.style.setProperty('min-height', '0px', 'important');
        parent.style.setProperty('max-height', '0px', 'important');
        parent.style.setProperty('margin', '0px', 'important');
        parent.style.setProperty('padding', '0px', 'important');
        parent.style.setProperty('border', 'none', 'important');
        parent.style.setProperty('box-shadow', 'none', 'important');
        parent.style.setProperty('visibility', 'hidden', 'important');
        parent.style.setProperty('overflow', 'hidden', 'important');

        parent = parent.parentElement;
      }
    }

    // 2. Búsqueda por imágenes promocionales del seminario / banner
    const bannerItems = document.querySelectorAll(
      'img[src*="banner" i], img[src*="empleabilidad" i], img[src*="seminario" i], img[src*="tutorias" i], img[src*="aniversario" i], img[src*="trivia" i]'
    );
    for (const item of bannerItems) {
      let container = item.closest('.slick-slider, .slick-list, .swiper, .MVAic, .dqpxyc, [data-oscure-banner="true"], div');
      if (container && container !== document.body && container !== document.getElementById('root')) {
        let parent = container;
        while (parent && parent !== document.body && parent !== document.getElementById('root')) {
          const text = parent.innerText || parent.textContent || '';
          const hasMainContent = text.includes('Mis cursos') || text.includes('Actividades') || parent.querySelector('h1, h2, h3');
          if (hasMainContent) break;

          parent.setAttribute('data-oscure-banner', 'true');
          parent.style.setProperty('display', 'none', 'important');
          parent.style.setProperty('height', '0px', 'important');
          parent.style.setProperty('margin', '0px', 'important');
          parent.style.setProperty('padding', '0px', 'important');
          parent.style.setProperty('overflow', 'hidden', 'important');

          parent = parent.parentElement;
        }
      }
    }
  }

  // Inicialización inmediata antes de que pinte el DOM
  chrome.storage.local.get([
    'oscureEnabled',
    'hideBanner',
    'brightness',
    'contrast',
    'bannerInitialized_v2',
    'accentColor'
  ], (result) => {
    let hideBanner = result.hideBanner;
    if (!result.bannerInitialized_v2 || hideBanner === undefined) {
      hideBanner = true;
      chrome.storage.local.set({ hideBanner: true, bannerInitialized_v2: true });
    }

    const isEnabled = result.oscureEnabled !== false;
    const brightness = result.brightness ?? 100;
    const contrast = result.contrast ?? 100;
    const accentColor = result.accentColor || '#6366f1';

    applyTheme(isEnabled, brightness, contrast, hideBanner, accentColor);
  });

  // Escuchar cambios reactivos desde el popup o background sin recargar la página
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    chrome.storage.local.get([
      'oscureEnabled',
      'hideBanner',
      'brightness',
      'contrast',
      'accentColor'
    ], (result) => {
      const isEnabled = result.oscureEnabled !== false;
      const hideBanner = result.hideBanner !== false;
      const brightness = result.brightness ?? 100;
      const contrast = result.contrast ?? 100;
      const accentColor = result.accentColor || '#6366f1';

      applyTheme(isEnabled, brightness, contrast, hideBanner, accentColor);
    });
  });

  // Observador de mutaciones para React SPA: intercepta montaje de .slick-slider inmediatamente
  let observerTimeout = null;
  const observer = new MutationObserver(() => {
    if (observerTimeout) return;
    observerTimeout = setTimeout(() => {
      observerTimeout = null;
      tagSpecificComponents();
    }, 20);
  });

  // Iniciar observador y ejecuciones periódicas iniciales para React SPA
  function initPageWatchers() {
    const rootTarget = document.body || document.documentElement;
    if (rootTarget) {
      observer.observe(rootTarget, { childList: true, subtree: true });
    }

    // Intervalo de barrido durante los primeros 4 segundos tras la carga
    let sweeps = 0;
    const sweepInterval = setInterval(() => {
      tagSpecificComponents();
      sweeps++;
      if (sweeps > 20) {
        clearInterval(sweepInterval);
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initPageWatchers();
      tagSpecificComponents();
    });
  } else {
    initPageWatchers();
    tagSpecificComponents();
  }
})();
