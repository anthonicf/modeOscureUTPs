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

        /* Bloques de semanas y tareas oscuras (table-item e item) */
        [data-testid="table-item"],
        [data-testid="item"],
        .sc-BOulX,
        .dxpKWb,
        [class*="BOulX"],
        [class*="dxpKWb"],
        [data-oscure-week-block="true"],
        [data-oscure-task-item="true"],
        [style*="rgb(49, 56, 69)"],
        [style*="rgb(49,56,69)"],
        [style*="#313845"] {
          background-color: #151624 !important;
          border: 1px solid #26283c !important;
          border-radius: 8px !important;
          color: #f8fafc !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
          transition: all 0.2s ease !important;
        }

        [data-testid="table-item"]:hover,
        [data-testid="item"]:hover,
        .sc-BOulX:hover,
        .dxpKWb:hover,
        a[href*="/homework/"]:hover [data-testid="item"] {
          background-color: #1c1d2e !important;
          border-color: var(--oscure-accent, #6366f1) !important;
          box-shadow: 0 4px 16px var(--oscure-accent-glow, rgba(99, 102, 241, 0.25)) !important;
        }

        [data-testid="table-item"] p,
        [data-testid="table-item"] span,
        [data-testid="table-item"] h3,
        [data-testid="table-item"] h4,
        [data-testid="item"] p,
        [data-testid="item"] span,
        [data-testid="item"] h3,
        [data-testid="item"] h4 {
          color: #f8fafc !important;
        }

        [data-testid="item"] span:first-of-type,
        .dxpKWb span:first-of-type {
          color: var(--oscure-accent-light, #818cf8) !important;
        }

        [data-testid="table-item"][class*="border-l"],
        [data-testid="table-item"][style*="border-left"] {
          border-left: 4px solid var(--oscure-accent, #6366f1) !important;
        }

        [data-testid="table-item"] svg,
        [data-testid="item"] svg {
          stroke: var(--oscure-accent-light, #818cf8) !important;
          transition: stroke 0.2s ease !important;
        }

        [data-testid="table-item"]:hover svg,
        [data-testid="item"]:hover svg {
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

        /* Panel y tarjetas de notificaciones */
        .sc-frDjqD,
        .hCiPVT,
        [class*="frDjqD"],
        [class*="hCiPVT"],
        [data-oscure-notification-item="true"],
        a[href*="/student/courses/"] > div[class*="py-xlg"] {
          background-color: #151624 !important;
          border-bottom: 1px solid #24263a !important;
          color: #f8fafc !important;
        }

        .hCiPVT:hover,
        [class*="frDjqD"]:hover,
        a:hover > .hCiPVT,
        a:hover > [class*="frDjqD"] {
          background-color: #1c1e30 !important;
          border-bottom-color: var(--oscure-accent, #6366f1) !important;
        }

        .hCiPVT p,
        .hCiPVT span,
        [class*="frDjqD"] p,
        [class*="frDjqD"] span {
          color: #cbd5e1 !important;
        }

        .hCiPVT p:first-of-type,
        .hCiPVT span:first-of-type,
        [class*="frDjqD"] p:first-of-type,
        [class*="frDjqD"] span:first-of-type {
          color: #ffffff !important;
          font-weight: 600 !important;
        }

        .hCiPVT svg,
        [class*="frDjqD"] svg {
          stroke: var(--oscure-accent-light, #818cf8) !important;
        }

        /* Perfil de usuario en la barra superior (Hola, [Nombre] y Rol) */
        [data-testid="name-user-avatar"] [style*="color"],
        [data-testid="name-user-avatar"] .flex.flex-row,
        [data-testid="name-user-avatar"] .text-body {
          color: #cbd5e1 !important;
        }

        [data-testid="name-user-avatar"] .font-bold,
        [data-testid="name-user-avatar"] [class*="font-bold"],
        [data-testid="name-user-avatar"] [data-oscure-user-name="true"] {
          color: var(--oscure-accent-light, #818cf8) !important;
          font-weight: 700 !important;
        }

        [data-testid="name-user-avatar"]:hover .font-bold,
        [data-testid="name-user-avatar"]:hover [class*="font-bold"] {
          color: #ffffff !important;
          text-shadow: 0 0 10px var(--oscure-accent-glow, rgba(99, 102, 241, 0.4)) !important;
        }

        [data-testid="name-user-avatar"] .flex-row-reverse span,
        [data-testid="name-user-avatar"] [class*="row-reverse"] span {
          color: #94a3b8 !important;
        }

        [data-testid="name-user-avatar"] cc-icon,
        [data-testid="name-user-avatar"] [data-testid="cc-icon"],
        [data-testid="name-user-avatar"] svg {
          color: var(--oscure-accent-light, #818cf8) !important;
        }

        .cIHFvM,
        .sc-bZQynM,
        [data-testid="name-user-avatar"] .cIHFvM,
        [data-testid="name-user-avatar"] .sc-bZQynM,
        [data-testid="name-user-avatar"] [class*="shadow"][class*="rounded"] {
          background-color: #161724 !important;
          border: 1px solid #282a3e !important;
          color: #f8fafc !important;
        }

        /* Mensajería y Chat (Burbujas de mensaje, archivos adjuntos y autor) */
        [data-testid="message"],
        .sc-ilQDRA,
        .fYYGRc,
        [class*="ilQDRA"],
        [class*="fYYGRc"],
        [style*="rgb(230, 235, 241)"],
        [style*="rgb(230,235,241)"] {
          background-color: #1a1c2c !important;
          color: #f1f5f9 !important;
          border: 1px solid #282a3e !important;
          border-radius: 10px !important;
        }

        .items-end [data-testid="message"],
        [class*="items-end"] [data-testid="message"],
        .items-end .fYYGRc,
        [class*="items-end"] .fYYGRc,
        .items-end .sc-ilQDRA,
        [class*="items-end"] .sc-ilQDRA,
        [data-oscure-chat-message-sent="true"] {
          background-color: #1e2238 !important;
          border: 1px solid var(--oscure-accent, #6366f1) !important;
          color: #ffffff !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
        }

        [data-testid="message"] a,
        [data-testid="message"] [class*="attachment" i],
        [data-testid="message"] [class*="download" i] {
          color: var(--oscure-accent-light, #818cf8) !important;
        }

        [data-testid="message"] svg {
          stroke: var(--oscure-accent-light, #818cf8) !important;
        }

        [data-testid="author"],
        .sc-hJwwgy,
        .eYcVyx,
        [class*="hJwwgy"],
        [class*="eYcVyx"] {
          color: #94a3b8 !important;
        }

        /* Conversación activa en la lista lateral de chats (.hAbBOz) */
        [data-testid="sidebar-message"] .hAbBOz,
        [data-testid="sidebar-message"] [class*="hAbBOz"],
        .hAbBOz,
        [class*="hAbBOz"],
        [data-oscure-chat-item-active="true"] {
          background-color: #1c1e30 !important;
          border-left: 4px solid var(--oscure-accent, #6366f1) !important;
        }

        [data-testid="sidebar-message"] .hAbBOz span,
        [class*="hAbBOz"] span {
          color: #ffffff !important;
          font-weight: 600 !important;
        }

        [data-testid="sidebar-message"] .hAbBOz p,
        [class*="hAbBOz"] p {
          color: #cbd5e1 !important;
        }

        [data-testid="sidebar-message"] [role="button"]:hover,
        [data-testid="sidebar-message"] .sc-gyhKFA:hover {
          background-color: #181928 !important;
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

        /* Bloques de semanas y tareas oscuras (table-item e item) */
        [data-testid="table-item"],
        [data-testid="item"],
        .sc-BOulX,
        .dxpKWb,
        [class*="BOulX"],
        [class*="dxpKWb"],
        [data-oscure-week-block="true"],
        [data-oscure-task-item="true"],
        [style*="rgb(49, 56, 69)"],
        [style*="rgb(49,56,69)"],
        [style*="#313845"] {
          background-color: #151624 !important;
          border: 1px solid #26283c !important;
          border-radius: 8px !important;
          color: #f8fafc !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
          transition: all 0.2s ease !important;
        }

        [data-testid="table-item"]:hover,
        [data-testid="item"]:hover,
        .sc-BOulX:hover,
        .dxpKWb:hover,
        a[href*="/homework/"]:hover [data-testid="item"] {
          background-color: #1c1d2e !important;
          border-color: var(--oscure-accent, #6366f1) !important;
          box-shadow: 0 4px 16px var(--oscure-accent-glow, rgba(99, 102, 241, 0.25)) !important;
        }

        [data-testid="table-item"] p,
        [data-testid="table-item"] span,
        [data-testid="table-item"] h3,
        [data-testid="table-item"] h4,
        [data-testid="item"] p,
        [data-testid="item"] span,
        [data-testid="item"] h3,
        [data-testid="item"] h4 {
          color: #f8fafc !important;
        }

        [data-testid="item"] span:first-of-type,
        .dxpKWb span:first-of-type {
          color: var(--oscure-accent-light, #818cf8) !important;
        }

        [data-testid="table-item"][class*="border-l"],
        [data-testid="table-item"][style*="border-left"] {
          border-left: 4px solid var(--oscure-accent, #6366f1) !important;
        }

        [data-testid="table-item"] svg,
        [data-testid="item"] svg {
          stroke: var(--oscure-accent-light, #818cf8) !important;
          transition: stroke 0.2s ease !important;
        }

        [data-testid="table-item"]:hover svg,
        [data-testid="item"]:hover svg {
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

        /* Panel y tarjetas de notificaciones */
        .sc-frDjqD,
        .hCiPVT,
        [class*="frDjqD"],
        [class*="hCiPVT"],
        [data-oscure-notification-item="true"],
        a[href*="/student/courses/"] > div[class*="py-xlg"] {
          background-color: #151624 !important;
          border-bottom: 1px solid #24263a !important;
          color: #f8fafc !important;
        }

        .hCiPVT:hover,
        [class*="frDjqD"]:hover,
        a:hover > .hCiPVT,
        a:hover > [class*="frDjqD"] {
          background-color: #1c1e30 !important;
          border-bottom-color: var(--oscure-accent, #6366f1) !important;
        }

        .hCiPVT p,
        .hCiPVT span,
        [class*="frDjqD"] p,
        [class*="frDjqD"] span {
          color: #cbd5e1 !important;
        }

        .hCiPVT p:first-of-type,
        .hCiPVT span:first-of-type,
        [class*="frDjqD"] p:first-of-type,
        [class*="frDjqD"] span:first-of-type {
          color: #ffffff !important;
          font-weight: 600 !important;
        }

        .hCiPVT svg,
        [class*="frDjqD"] svg {
          stroke: var(--oscure-accent-light, #818cf8) !important;
        }

        /* Perfil de usuario en la barra superior (Hola, [Nombre] y Rol) */
        [data-testid="name-user-avatar"] [style*="color"],
        [data-testid="name-user-avatar"] .flex.flex-row,
        [data-testid="name-user-avatar"] .text-body {
          color: #cbd5e1 !important;
        }

        [data-testid="name-user-avatar"] .font-bold,
        [data-testid="name-user-avatar"] [class*="font-bold"],
        [data-testid="name-user-avatar"] [data-oscure-user-name="true"] {
          color: var(--oscure-accent-light, #818cf8) !important;
          font-weight: 700 !important;
        }

        [data-testid="name-user-avatar"]:hover .font-bold,
        [data-testid="name-user-avatar"]:hover [class*="font-bold"] {
          color: #ffffff !important;
          text-shadow: 0 0 10px var(--oscure-accent-glow, rgba(99, 102, 241, 0.4)) !important;
        }

        [data-testid="name-user-avatar"] .flex-row-reverse span,
        [data-testid="name-user-avatar"] [class*="row-reverse"] span {
          color: #94a3b8 !important;
        }

        [data-testid="name-user-avatar"] cc-icon,
        [data-testid="name-user-avatar"] [data-testid="cc-icon"],
        [data-testid="name-user-avatar"] svg {
          color: var(--oscure-accent-light, #818cf8) !important;
        }

        .cIHFvM,
        .sc-bZQynM,
        [data-testid="name-user-avatar"] .cIHFvM,
        [data-testid="name-user-avatar"] .sc-bZQynM,
        [data-testid="name-user-avatar"] [class*="shadow"][class*="rounded"] {
          background-color: #161724 !important;
          border: 1px solid #282a3e !important;
          color: #f8fafc !important;
        }

        /* Mensajería y Chat (Burbujas de mensaje, archivos adjuntos y autor) */
        [data-testid="message"],
        .sc-ilQDRA,
        .fYYGRc,
        [class*="ilQDRA"],
        [class*="fYYGRc"],
        [style*="rgb(230, 235, 241)"],
        [style*="rgb(230,235,241)"] {
          background-color: #1a1c2c !important;
          color: #f1f5f9 !important;
          border: 1px solid #282a3e !important;
          border-radius: 10px !important;
        }

        .items-end [data-testid="message"],
        [class*="items-end"] [data-testid="message"],
        .items-end .fYYGRc,
        [class*="items-end"] .fYYGRc,
        .items-end .sc-ilQDRA,
        [class*="items-end"] .sc-ilQDRA,
        [data-oscure-chat-message-sent="true"] {
          background-color: #1e2238 !important;
          border: 1px solid var(--oscure-accent, #6366f1) !important;
          color: #ffffff !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3) !important;
        }

        [data-testid="message"] a,
        [data-testid="message"] [class*="attachment" i],
        [data-testid="message"] [class*="download" i] {
          color: var(--oscure-accent-light, #818cf8) !important;
        }

        [data-testid="message"] svg {
          stroke: var(--oscure-accent-light, #818cf8) !important;
        }

        [data-testid="author"],
        .sc-hJwwgy,
        .eYcVyx,
        [class*="hJwwgy"],
        [class*="eYcVyx"] {
          color: #94a3b8 !important;
        }

        /* Conversación activa en la lista lateral de chats (.hAbBOz) */
        [data-testid="sidebar-message"] .hAbBOz,
        [data-testid="sidebar-message"] [class*="hAbBOz"],
        .hAbBOz,
        [class*="hAbBOz"],
        [data-oscure-chat-item-active="true"] {
          background-color: #1c1e30 !important;
          border-left: 4px solid var(--oscure-accent, #6366f1) !important;
        }

        [data-testid="sidebar-message"] .hAbBOz span,
        [class*="hAbBOz"] span {
          color: #ffffff !important;
          font-weight: 600 !important;
        }

        [data-testid="sidebar-message"] .hAbBOz p,
        [class*="hAbBOz"] p {
          color: #cbd5e1 !important;
        }

        [data-testid="sidebar-message"] [role="button"]:hover,
        [data-testid="sidebar-message"] .sc-gyhKFA:hover {
          background-color: #181928 !important;
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
        '[data-oscure-content-card], [data-oscure-neutralized-bg], [data-oscure-week-block], [data-oscure-task-item], [data-oscure-notification-item], [data-oscure-notification-drawer], [data-oscure-user-profile], [data-oscure-user-name], [data-oscure-chat-message], [data-oscure-chat-message-sent], [data-oscure-chat-author], [data-oscure-chat-item], [data-oscure-chat-item-active]'
      );
      for (const el of styledElements) {
        el.style.removeProperty('background-color');
        el.style.removeProperty('color');
        el.style.removeProperty('border');
        el.style.removeProperty('border-bottom');
        el.style.removeProperty('border-color');
        el.style.removeProperty('border-radius');
        el.style.removeProperty('font-weight');
        el.style.removeProperty('text-shadow');
        el.style.removeProperty('box-shadow');
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

    // 4. Identificar bloques de semanas y tareas ([data-testid="table-item"], [data-testid="item"])
    const weekBlocks = document.querySelectorAll(
      '[data-testid="table-item"], [data-testid="item"], .sc-BOulX, .dxpKWb, [class*="BOulX"], [class*="dxpKWb"]'
    );
    for (const block of weekBlocks) {
      const isTask = block.getAttribute('data-testid') === 'item' || 
                     block.classList.contains('dxpKWb') || 
                     block.classList.contains('sc-BOulX');

      block.setAttribute(isTask ? 'data-oscure-task-item' : 'data-oscure-week-block', 'true');
      block.style.setProperty('background-color', '#151624', 'important');
      block.style.setProperty('border', '1px solid #26283c', 'important');
      block.style.setProperty('border-radius', '8px', 'important');
      block.style.setProperty('color', '#f8fafc', 'important');

      const texts = block.querySelectorAll('p, span, h3, h4');
      for (const t of texts) {
        t.style.setProperty('color', '#f8fafc', 'important');
      }

      if (isTask) {
        const firstSpan = block.querySelector('span');
        if (firstSpan) {
          firstSpan.style.setProperty('color', 'var(--oscure-accent-light, #818cf8)', 'important');
        }
        const lastDiv = block.querySelector('div:last-child');
        if (lastDiv) {
          const subTexts = lastDiv.querySelectorAll('span, p');
          for (const st of subTexts) {
            st.style.setProperty('color', '#94a3b8', 'important');
          }
        }
      }

      const svgs = block.querySelectorAll('svg');
      for (const svg of svgs) {
        svg.style.setProperty('stroke', 'var(--oscure-accent-light, #818cf8)', 'important');
      }
    }

    // 5. Identificar y estilizar panel lateral y tarjetas de notificaciones
    const notifCards = document.querySelectorAll(
      '.hCiPVT, .sc-frDjqD, [class*="frDjqD"], [class*="hCiPVT"], a[href*="/student/courses/"] > div[class*="py-xlg"]'
    );
    for (const card of notifCards) {
      card.setAttribute('data-oscure-notification-item', 'true');
      card.style.setProperty('background-color', '#151624', 'important');
      card.style.setProperty('border-bottom', '1px solid #24263a', 'important');
      card.style.setProperty('color', '#f8fafc', 'important');

      const texts = card.querySelectorAll('p, span, h4, h5');
      for (const t of texts) {
        const textContent = t.innerText || t.textContent || '';
        if (textContent.includes('Hace') || textContent.includes('Ayer') || textContent.includes('minuto') || textContent.includes('hora')) {
          t.style.setProperty('color', '#818cf8', 'important');
        } else if (t === texts[0]) {
          t.style.setProperty('color', '#ffffff', 'important');
        } else {
          t.style.setProperty('color', '#cbd5e1', 'important');
        }
      }

      const svgs = card.querySelectorAll('svg');
      for (const svg of svgs) {
        svg.style.setProperty('stroke', '#818cf8', 'important');
      }
    }

    const notifDrawer = document.querySelector(
      'div:has(> .overflow-auto > div > div > a > [class*="hCiPVT"]), div:has(> * > [class*="hCiPVT"])'
    );
    if (notifDrawer) {
      notifDrawer.setAttribute('data-oscure-notification-drawer', 'true');
      notifDrawer.style.setProperty('background-color', '#10111a', 'important');
      notifDrawer.style.setProperty('color', '#f8fafc', 'important');
    }

    // 6. Identificar y estilizar perfil de usuario en cabecera (Hola, [Nombre] y Rol)
    const userAvatarContainer = document.querySelector('[data-testid="name-user-avatar"]');
    if (userAvatarContainer) {
      userAvatarContainer.setAttribute('data-oscure-user-profile', 'true');

      // Limpiar/reemplazar el inline style "color: rgb(22, 29, 31);" en el contenedor de saludo
      const greetingWrapper = userAvatarContainer.querySelector('.flex.flex-row, [style*="color"]');
      if (greetingWrapper) {
        greetingWrapper.style.setProperty('color', '#cbd5e1', 'important');
      }

      // Nombre en negrita del usuario -> color de acento dinámico
      const nameBold = userAvatarContainer.querySelector('.font-bold, [class*="font-bold"]');
      if (nameBold) {
        nameBold.setAttribute('data-oscure-user-name', 'true');
        nameBold.style.setProperty('color', 'var(--oscure-accent-light, #818cf8)', 'important');
        nameBold.style.setProperty('font-weight', '700', 'important');
      }

      // Saludo ("Hola, ")
      const greetingSpan = userAvatarContainer.querySelector('.text-body:not(.font-bold)');
      if (greetingSpan) {
        greetingSpan.style.setProperty('color', '#cbd5e1', 'important');
      }

      // Rol ("Estudiante")
      const roleSpan = userAvatarContainer.querySelector('.flex-row-reverse span, [class*="row-reverse"] span');
      if (roleSpan) {
        roleSpan.style.setProperty('color', '#94a3b8', 'important');
      }

      // Icono chevron desplegable
      const chevron = userAvatarContainer.querySelector('cc-icon, [data-testid="cc-icon"], svg');
      if (chevron) {
        chevron.style.setProperty('color', 'var(--oscure-accent-light, #818cf8)', 'important');
      }

      // Menú flotante desplegable ("Cerrar sesión")
      const userMenu = userAvatarContainer.querySelector('.cIHFvM, .sc-bZQynM, [class*="shadow"][class*="rounded"]');
      if (userMenu) {
        userMenu.style.setProperty('background-color', '#161724', 'important');
        userMenu.style.setProperty('border', '1px solid #282a3e', 'important');
        userMenu.style.setProperty('color', '#f8fafc', 'important');
      }
    }

    // 7. Identificar y estilizar elementos de Chat y Mensajería ([data-testid="message"], .fYYGRc, .sc-ilQDRA)
    const chatMessages = document.querySelectorAll(
      '[data-testid="message"], .sc-ilQDRA, [class*="ilQDRA"], .fYYGRc, [class*="fYYGRc"], [style*="rgb(230, 235, 241)"], [style*="rgb(230,235,241)"]'
    );
    for (const msg of chatMessages) {
      const isSent = msg.closest('.items-end, [class*="items-end"]');
      if (isSent) {
        msg.setAttribute('data-oscure-chat-message-sent', 'true');
        msg.style.setProperty('background-color', '#1e2238', 'important');
        msg.style.setProperty('border', '1px solid var(--oscure-accent, #6366f1)', 'important');
        msg.style.setProperty('color', '#ffffff', 'important');
        msg.style.setProperty('border-radius', '12px', 'important');
      } else {
        msg.setAttribute('data-oscure-chat-message', 'true');
        msg.style.setProperty('background-color', '#1a1c2c', 'important');
        msg.style.setProperty('border', '1px solid #282a3e', 'important');
        msg.style.setProperty('color', '#f1f5f9', 'important');
        msg.style.setProperty('border-radius', '12px', 'important');
      }

      // Asegurar contraste de textos internos
      const innerTexts = msg.querySelectorAll('p, span, div:not([data-testid="message"])');
      for (const t of innerTexts) {
        if (!t.closest('a')) {
          t.style.setProperty('color', isSent ? '#ffffff' : '#f1f5f9', 'important');
        }
      }

      // Enlaces y archivos adjuntos
      const links = msg.querySelectorAll('a, [class*="download" i], [class*="attachment" i]');
      for (const a of links) {
        a.style.setProperty('color', 'var(--oscure-accent-light, #818cf8)', 'important');
      }

      const svgs = msg.querySelectorAll('svg');
      for (const svg of svgs) {
        svg.style.setProperty('stroke', 'var(--oscure-accent-light, #818cf8)', 'important');
      }
    }

    const chatAuthors = document.querySelectorAll('[data-testid="author"], .sc-hJwwgy, .eYcVyx, [class*="hJwwgy"]');
    for (const author of chatAuthors) {
      author.setAttribute('data-oscure-chat-author', 'true');
      author.style.setProperty('color', '#94a3b8', 'important');
    }

    // 7.2 Conversaciones en la barra lateral de mensajes (.hAbBOz, .sc-gyhKFA)
    const chatSidebarItems = document.querySelectorAll(
      '[data-testid="sidebar-message"] [role="button"], [data-testid="sidebar-message"] .sc-gyhKFA, [data-testid="sidebar-message"] [class*="gyhKFA"], .hAbBOz, [class*="hAbBOz"]'
    );
    for (const item of chatSidebarItems) {
      const isSelected = item.classList.contains('hAbBOz') || 
                         item.className.includes('hAbBOz') ||
                         item.getAttribute('aria-selected') === 'true';

      if (isSelected) {
        item.setAttribute('data-oscure-chat-item-active', 'true');
        item.removeAttribute('data-oscure-chat-item');
        item.style.setProperty('background-color', '#1c1e30', 'important');
        item.style.setProperty('border-left', '4px solid var(--oscure-accent, #6366f1)', 'important');

        const title = item.querySelector('span');
        if (title) {
          title.style.setProperty('color', '#ffffff', 'important');
          title.style.setProperty('font-weight', '600', 'important');
        }

        const subtitle = item.querySelector('p');
        if (subtitle) {
          subtitle.style.setProperty('color', '#cbd5e1', 'important');
        }
      } else {
        item.setAttribute('data-oscure-chat-item', 'true');
        item.removeAttribute('data-oscure-chat-item-active');
        item.style.setProperty('background-color', 'transparent', 'important');
        item.style.setProperty('border-left', '4px solid transparent', 'important');

        const title = item.querySelector('span');
        if (title) {
          title.style.setProperty('color', '#f1f5f9', 'important');
        }

        const subtitle = item.querySelector('p');
        if (subtitle) {
          subtitle.style.setProperty('color', '#94a3b8', 'important');
        }
      }
    }

    // 8. Eliminar / Ocultar el carrusel de banner de publicidad (.slick-slider y contenedores padre)
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
