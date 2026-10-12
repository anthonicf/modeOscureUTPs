// Background Service Worker (Manifest V3)
// Manejo de atajos de teclado, estado inicial y badge de extensión

const DEFAULT_SETTINGS = {
  oscureEnabled: true,
  hideBanner: true,
  brightness: 100,
  contrast: 100,
  accentColor: '#00C2FF',
  accentName: 'Cian'
};

// Inicialización al instalar o actualizar la extensión
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get([
    'oscureEnabled',
    'hideBanner',
    'brightness',
    'contrast',
    'accentColor',
    'accentName'
  ]);
  const toSet = {};

  if (current.oscureEnabled === undefined) toSet.oscureEnabled = DEFAULT_SETTINGS.oscureEnabled;
  if (current.hideBanner === undefined) toSet.hideBanner = DEFAULT_SETTINGS.hideBanner;
  if (current.brightness === undefined) toSet.brightness = DEFAULT_SETTINGS.brightness;
  if (current.contrast === undefined) toSet.contrast = DEFAULT_SETTINGS.contrast;
  if (current.accentColor === undefined) toSet.accentColor = DEFAULT_SETTINGS.accentColor;
  if (current.accentName === undefined) toSet.accentName = DEFAULT_SETTINGS.accentName;

  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }

  const enabled = toSet.oscureEnabled ?? current.oscureEnabled ?? true;
  const accent = toSet.accentColor ?? current.accentColor ?? DEFAULT_SETTINGS.accentColor;
  await updateBadge(enabled, accent);
});

// Actualiza el badge visual en el icono de la barra de extensiones
async function updateBadge(enabled, accentColor = '#00C2FF') {
  try {
    if (enabled) {
      await chrome.action.setBadgeText({ text: 'ON' });
      await chrome.action.setBadgeBackgroundColor({ color: accentColor });
      await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
    } else {
      await chrome.action.setBadgeText({ text: 'OFF' });
      await chrome.action.setBadgeBackgroundColor({ color: '#64748B' });
      await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
    }
  } catch (error) {
    console.error('Error al actualizar badge:', error);
  }
}

// Escucha cambios en el almacenamiento local para actualizar el badge en tiempo real
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;

  if (changes.oscureEnabled || changes.accentColor) {
    const { oscureEnabled = true, accentColor = '#00C2FF' } = await chrome.storage.local.get(['oscureEnabled', 'accentColor']);
    await updateBadge(oscureEnabled, accentColor);
  }
});

// Manejo del comando / atajo de teclado (Alt + Shift + D)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-dark-mode') {
    const { oscureEnabled = true, accentColor = '#00C2FF' } = await chrome.storage.local.get(['oscureEnabled', 'accentColor']);
    const newState = !oscureEnabled;
    await chrome.storage.local.set({ oscureEnabled: newState });
    await updateBadge(newState, accentColor);
  }
});
