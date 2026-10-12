// Content Script - Inyección reactiva y control del Modo Oscuro
// Ejecutado en document_start para eliminar el parpadeo blanco (Zero FOUC)

(function () {
  'use strict';

  const ATTR_NAME = 'data-oscure-utp';
  const ATTR_HIDE_BANNER = 'data-oscure-hide-banner';

  // 1. APLICACIÓN SÍNCRONA INMEDIATA EN document_start (Cero FOUC)
  // Aplica el modo oscuro antes del primer pintado del navegador (eliminando el flash blanco)
  const root = document.documentElement;
  if (root) {
    root.setAttribute(ATTR_NAME, 'active');
    root.setAttribute(ATTR_HIDE_BANNER, 'true');
  }

  // Utilidades para cálculo dinámico del color de acento
  function hexToRgb(hex) {
    let c = (hex || '#00C2FF').replace('#', '');
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
    const base = baseHex || '#00C2FF';
    const rgb = hexToRgb(base);
    return {
      base: base,
      hover: adjustBrightness(base, -18),
      light: adjustBrightness(base, 25),
      glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
      subtle: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
    };
  }

  // Aplica el estado del tema y variables CSS de forma puramente declarativa
  function applyTheme(enabled, brightness = 100, contrast = 100, hideBanner = true, accentColor = '#00C2FF') {
    if (!root) return;

    if (enabled) {
      root.setAttribute(ATTR_NAME, 'active');
      root.style.setProperty('--oscure-brightness', `${brightness}%`);
      root.style.setProperty('--oscure-contrast', `${contrast}%`);

      // Aplicar paleta de acento personalizada
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

    if (enabled && hideBanner) {
      root.setAttribute(ATTR_HIDE_BANNER, 'true');
    } else {
      root.removeAttribute(ATTR_HIDE_BANNER);
    }
  }

  // 2. Carga asíncrona de preferencias guardadas
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
    const accentColor = result.accentColor || '#00C2FF';

    applyTheme(isEnabled, brightness, contrast, hideBanner, accentColor);
  });

  // 3. Escucha cambios reactivos desde el popup o el atajo de teclado (Alt+Shift+D)
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
      const accentColor = result.accentColor || '#00C2FF';

      applyTheme(isEnabled, brightness, contrast, hideBanner, accentColor);
    });
  });
})();
