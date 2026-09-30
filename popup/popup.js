// Popup Script - Lógica de control de la extensión Oscure UTP

document.addEventListener('DOMContentLoaded', async () => {
  const themeToggle = document.getElementById('themeToggle');
  const toggleStatusText = document.getElementById('toggleStatusText');
  const bannerToggle = document.getElementById('bannerToggle');
  const bannerStatusText = document.getElementById('bannerStatusText');
  const brightnessSlider = document.getElementById('brightnessSlider');
  const brightnessVal = document.getElementById('brightnessVal');
  const contrastSlider = document.getElementById('contrastSlider');
  const contrastVal = document.getElementById('contrastVal');
  const resetBtn = document.getElementById('resetBtn');
  const siteBadge = document.getElementById('siteBadge');

  // Elementos de Color de Acento
  const accentNameEl = document.getElementById('accentName');
  const accentDots = document.querySelectorAll('.color-dot');
  const customColorPicker = document.getElementById('customColorPicker');
  const customColorWrapper = customColorPicker ? customColorPicker.parentElement : null;

  // Paleta de colores helpers
  function hexToRgb(hex) {
    let c = hex.replace('#', '');
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
    const rgb = hexToRgb(baseHex);
    return {
      base: baseHex,
      hover: adjustBrightness(baseHex, -18),
      light: adjustBrightness(baseHex, 25),
      glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
      subtle: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`
    };
  }

  function applyPopupAccent(hex) {
    const palette = generateAccentPalette(hex);
    document.documentElement.style.setProperty('--popup-accent', palette.base);
    document.documentElement.style.setProperty('--popup-accent-hover', palette.hover);
    document.documentElement.style.setProperty('--popup-accent-light', palette.light);
    document.documentElement.style.setProperty('--popup-accent-glow', palette.glow);
    document.documentElement.style.setProperty('--popup-accent-subtle', palette.subtle);
  }

  function setAccentActiveUI(selectedHex, selectedName = 'Personalizado') {
    applyPopupAccent(selectedHex);
    if (accentNameEl) accentNameEl.textContent = selectedName;

    let matchedPreset = false;
    accentDots.forEach(dot => {
      const dotColor = dot.getAttribute('data-color').toLowerCase();
      if (dotColor === selectedHex.toLowerCase()) {
        dot.classList.add('active');
        matchedPreset = true;
      } else {
        dot.classList.remove('active');
      }
    });

    if (customColorWrapper) {
      if (!matchedPreset) {
        customColorWrapper.classList.add('active');
      } else {
        customColorWrapper.classList.remove('active');
      }
    }
    if (customColorPicker) {
      customColorPicker.value = selectedHex;
    }
  }

  // Detectar la pestaña actual para actualizar el indicador de sitio
  try {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab && currentTab.url) {
      const url = currentTab.url;
      if (url.includes('sso.utp.edu.pe')) {
        siteBadge.textContent = 'SSO UTP';
      } else if (url.includes('class.utp.edu.pe')) {
        siteBadge.textContent = 'UTP+CLASS';
      } else if (url.includes('canvas.utp.edu.pe')) {
        siteBadge.textContent = 'CANVAS';
      } else if (url.includes('utp.edu.pe')) {
        siteBadge.textContent = 'UTP';
      } else {
        siteBadge.textContent = 'EXTERNO';
      }
    }
  } catch (error) {
    console.debug('No se pudo leer la pestaña actual:', error);
  }

  // Cargar estado guardado desde chrome.storage.local
  const settings = await chrome.storage.local.get([
    'oscureEnabled',
    'hideBanner',
    'brightness',
    'contrast',
    'bannerInitialized_v2',
    'accentColor',
    'accentName'
  ]);
  const isEnabled = settings.oscureEnabled !== false;
  
  // Ocultar publicidad ACTIVADO por defecto
  let hideBanner = settings.hideBanner;
  if (!settings.bannerInitialized_v2 || hideBanner === undefined) {
    hideBanner = true;
    await chrome.storage.local.set({ hideBanner: true, bannerInitialized_v2: true });
  }

  const brightness = settings.brightness ?? 100;
  const contrast = settings.contrast ?? 100;
  const accentColor = settings.accentColor || '#6366f1';
  const accentName = settings.accentName || 'Índigo';

  // Aplicar valores a la interfaz
  themeToggle.checked = isEnabled;
  updateStatusDisplay(isEnabled);

  bannerToggle.checked = hideBanner;
  updateBannerDisplay(hideBanner);

  brightnessSlider.value = brightness;
  brightnessVal.textContent = `${brightness}%`;

  contrastSlider.value = contrast;
  contrastVal.textContent = `${contrast}%`;

  setAccentActiveUI(accentColor, accentName);

  // Cambiar interruptor principal (Modo Oscuro)
  themeToggle.addEventListener('change', async () => {
    const enabled = themeToggle.checked;
    updateStatusDisplay(enabled);
    await chrome.storage.local.set({ oscureEnabled: enabled });
  });

  // Cambiar interruptor de Ocultar Banner
  bannerToggle.addEventListener('change', async () => {
    const hide = bannerToggle.checked;
    updateBannerDisplay(hide);
    await chrome.storage.local.set({ hideBanner: hide });
  });

  // Selector de Color de Acento (Presets)
  accentDots.forEach(dot => {
    dot.addEventListener('click', async () => {
      const color = dot.getAttribute('data-color');
      const name = dot.getAttribute('data-name');
      setAccentActiveUI(color, name);
      await chrome.storage.local.set({ accentColor: color, accentName: name });
    });
  });

  // Selector de Color de Acento Personalizado (Input Color)
  if (customColorPicker) {
    customColorPicker.addEventListener('input', (e) => {
      const color = e.target.value;
      setAccentActiveUI(color, 'Personalizado');
    });

    customColorPicker.addEventListener('change', async (e) => {
      const color = e.target.value;
      setAccentActiveUI(color, 'Personalizado');
      await chrome.storage.local.set({ accentColor: color, accentName: 'Personalizado' });
    });
  }

  // Slider de Brillo
  brightnessSlider.addEventListener('input', (e) => {
    brightnessVal.textContent = `${e.target.value}%`;
  });

  brightnessSlider.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ brightness: parseInt(e.target.value, 10) });
  });

  // Slider de Contraste
  contrastSlider.addEventListener('input', (e) => {
    contrastVal.textContent = `${e.target.value}%`;
  });

  contrastSlider.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ contrast: parseInt(e.target.value, 10) });
  });

  // Botón restablecer valores
  resetBtn.addEventListener('click', async () => {
    brightnessSlider.value = 100;
    brightnessVal.textContent = '100%';
    contrastSlider.value = 100;
    contrastVal.textContent = '100%';

    const defaultAccent = '#6366f1';
    const defaultAccentName = 'Índigo';
    setAccentActiveUI(defaultAccent, defaultAccentName);

    await chrome.storage.local.set({
      brightness: 100,
      contrast: 100,
      accentColor: defaultAccent,
      accentName: defaultAccentName
    });
  });

  function updateStatusDisplay(enabled) {
    if (enabled) {
      toggleStatusText.textContent = 'Activado';
      toggleStatusText.classList.remove('disabled');
    } else {
      toggleStatusText.textContent = 'Desactivado';
      toggleStatusText.classList.add('disabled');
    }
  }

  function updateBannerDisplay(hide) {
    if (hide) {
      bannerStatusText.textContent = 'Oculto';
      bannerStatusText.classList.remove('disabled');
    } else {
      bannerStatusText.textContent = 'Visible';
      bannerStatusText.classList.add('disabled');
    }
  }
});
