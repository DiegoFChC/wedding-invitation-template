# Stiven & Milena — Invitación de Boda 💍

Invitación web interactiva y privada para compartir por WhatsApp. El invitado abre un sobre sellado con animación, recorre las secciones de la boda y confirma su asistencia mediante un formulario asociado a su código personal.

## ✨ Características

- **Sobre interactivo**: intro con sello de cera que abre la solapa y revela la tarjeta (GSAP).
- **Secciones a pantalla completa**:
  - Nombres de los novios con flores y partículas doradas.
  - Fecha de la boda con **cuenta regresiva en vivo**.
  - Cronograma (ceremonia y recepción) con timeline animada.
  - Ubicación con **mapa embebido** y botón hacia Google Maps.
  - Formulario de confirmación (**RSVP**) con número de asistentes y mensaje.
- **Invitaciones personalizadas por token**: cada invitado tiene su propio enlace `/invitacion/<token>` con saludo y cupos limitados según `src/data/invitados.json`.
- **Puerta privada en la raíz**: `/` solo pide el código de invitado; los datos viven únicamente en la página personalizada.
- Navegación fluida entre secciones (rueda, arrastre táctil o teclado), respeto a `prefers-reduced-motion` y página 404 amigable para enlaces inválidos.

## 🛠️ Tecnologías

| Herramienta   | Uso                                    |
| ------------- | -------------------------------------- |
| [Astro 7](https://docs.astro.build) | Framework static-site |
| [Tailwind CSS 4](https://tailwindcss.com) | Estilos y tokens de diseño (`@theme`) |
| [GSAP 3](https://gsap.com) | Animaciones (sobre, scroll, partículas) |
| TypeScript    | Lógica del cliente en `src/scripts/`   |

Requiere **Node.js >= 22.12**.

## 🚀 Uso

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo en http://localhost:4321
npm run build      # build de producción -> dist/
npm run preview    # previsualizar el build localmente
```

> En este proyecto `npm run dev` levanta el servidor **en segundo plano** y devuelve el control de inmediato. Se administra con `npx astro dev status | logs | stop`.

## 💌 Invitados

Los invitados se declaran en `src/data/invitados.json`:

```json
{
  "k8f3x9a1": {
    "name": "Familia Gómez",
    "allowedSlots": 4
  }
}
```

- `name`: nombre con el que se saluda al invitado.
- `allowedSlots`: máximo de asistentes que puede registrar.

El enlace a compartir tiene la forma:

```
https://<dominio>/invitacion/k8f3x9a1
```

Un código inexistente muestra una página 404 amigable. Cuando el invitado confirma, su respuesta se guarda en `localStorage` (`rsvp_confirmado_<token>`), así que si vuelve a entrar ve el resumen en lugar del formulario.

## 🎨 Personalización rápida

| Qué                    | Dónde                                              |
| ---------------------- | -------------------------------------------------- |
| Fecha de la boda       | Constante `TARGET` en `src/scripts/countdown.ts`   |
| Lugar / dirección / mapa | Constantes al inicio de `Schedule.astro`         |
| Horarios (ceremonia/recepción) | Tarjetas dentro de `Schedule.astro`         |
| Títulos y nombres      | `Layout.astro`, `Hero.astro`, `Footer.astro`, `Envelop.astro` |

## 📁 Estructura

```text
/
├── public/              # favicon y estáticos
├── src/
│   ├── assets/          # flores SVG usadas en la portada
│   ├── components/      # secciones y vista previa (Envelop, Hero, ...)
│   ├── data/            # invitados.json
│   ├── layouts/         # Layout base (fuentes, estilos globales)
│   ├── pages/           # /, 404 e /invitacion/[token]
│   ├── scripts/         # lógica del cliente (GSAP, countdown, rsvp...)
│   └── styles/          # global.css (tokens Tailwind)
└── package.json
```

## 🗺️ Pendientes

- Conectar el formulario RSVP con **Google Sheets** vía Google Apps Script (actualmente la respuesta validada se registra en consola y localStorage).
