# 🌙 Oscure UTP - Modo Oscuro para UTP+class y SSO UTP

Extensión moderna de Google Chrome (Manifest V3) diseñada específicamente para oscurecer la plataforma **UTP+class** (`class.utp.edu.pe`) y el portal de inicio de sesión **SSO UTP** (`sso.utp.edu.pe`), con cero parpadeo blanco (FOUC), protección de diapositivas/fotos y controles interactivos.

---

## 🚀 Cómo instalar la extensión en Google Chrome / Brave / Edge

1. Abre tu navegador y ve a la página de extensiones:
   - **Chrome**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`
   - **Edge**: `edge://extensions/`
2. Activa el interruptor **"Modo de desarrollador"** (Developer Mode) en la esquina superior derecha.
3. Haz clic en el botón **"Cargar descomprimida"** (Load unpacked).
4. Selecciona la carpeta raíz de este proyecto (donde se encuentra `manifest.json`).
5. ¡Listo! Verás el icono de la luna azul de **Oscure UTP** en tu barra de extensiones.

---

## ✨ Características y Funcionalidades

- **Cero parpadeo blanco (Zero FOUC)**: Los estilos se cargan al instante (`document_start`), eliminando los molestos flashes blancos antes de renderizar la página.
- **SSO Login UTP estilizado**: El formulario de inicio de sesión (código UTP, contraseña, botones) adopta un elegante tema oscuro con resplandor moderno.
- **Soporte completo para UTP+class (React SPA)**: Tarjetas de cursos, foros, calendario, evaluaciones, modales y barra de navegación adaptados.
- **Protección de fotos y material de estudio**: Las diapositivas, PDFs, diagramas y fotos de profesores no se alteran ni invierten sus colores originales.
- **Popup interactivo**:
  - Interruptor maestro (ON / OFF).
  - Deslizador de **Brillo** (70% al 120%).
  - Deslizador de **Contraste** (80% al 130%).
  - Botón para restablecer ajustes.
- **Atajo de teclado rápido**: Presiona `Alt + Shift + D` en cualquier momento para activar o desactivar el modo oscuro al instante.
