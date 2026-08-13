# WEB-Clipboard

[English version](./README.EN.md)

**Pega capturas del portapapeles, visualízalas y gestiona títulos. Todo se guarda solo en este navegador.**

**Sitio publicado:** [web-clipboard.vercel.app](https://web-clipboard.vercel.app)

Hecho con **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4** y **pnpm**.

---

## Qué incluye

- Pegar una imagen del portapapeles con **Ctrl+V / Cmd+V** o el botón **Pegar**.
- Título opcional en el input: si está vacío, la captura se guarda sin título.
- Galería local: miniatura, fecha, editar título (confirmar / cancelar) y borrar (confirmación inline).
- Lightbox al hacer clic en una miniatura.
- Persistencia en **IndexedDB** del origen. No hay backend ni sincronización en la nube: recargar conserva los datos en _este_ navegador; otro dispositivo o perfil no los ve.

**Transversal:**

- UI en español, tema oscuro, iconos Lucide (SVG, sin emojis).
- Cabeceras de seguridad (CSP con `blob:` para las miniaturas).
- CI en GitHub Actions (lint, types, Prettier, tests, React Doctor, build y e2e smoke).

---

## Inicio rápido

**Requisitos:** Node.js 22+ y pnpm 11.

```bash
git clone https://github.com/FraVelz/WEB-Clipboard.git
cd WEB-Clipboard
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Rutas:**

| Ruta | Contenido                |
| ---- | ------------------------ |
| `/`  | Composer + galería local |

**Variables (opcional):**

| Variable               | Uso                                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | URL canónica (metadata / CI). Por defecto `http://localhost:3000` en local y `https://web-clipboard.vercel.app` en CI. |

No hace falta `.env` para usar la app.

---

## Estructura del proyecto

```text
├── src/
│   ├── app/                      # App Router
│   │   ├── layout.tsx            # Metadata, fuentes, Analytics
│   │   ├── globals.css           # Tailwind v4 + tokens oscuros
│   │   ├── page.tsx              # Página principal
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ClipboardApp.tsx      # Composición de la UI
│   │   ├── CaptureComposer.tsx   # Input de título + pegar
│   │   ├── CaptureGallery.tsx
│   │   ├── CaptureCard.tsx
│   │   ├── CaptureLightbox.tsx
│   │   └── icons/                # SVG Lucide vendorizados
│   ├── hooks/useCaptures.ts
│   └── lib/
│       ├── captures-db.ts        # IndexedDB
│       ├── clipboard.ts          # Extraer image/* del portapapeles
│       └── cn.ts
├── e2e/home.spec.ts              # Smoke Playwright
├── security-headers.ts
├── vercel.json
└── .github/workflows/ci.yml
```

**Assets:** favicon en `src/app/favicon.ico`. No hay captura de README todavía.

---

## Scripts

| Comando                             | Descripción                                    |
| ----------------------------------- | ---------------------------------------------- |
| `pnpm dev`                          | Servidor de desarrollo                         |
| `pnpm build`                        | Build de producción                            |
| `pnpm start`                        | Servir build                                   |
| `pnpm lint`                         | ESLint                                         |
| `pnpm typecheck`                    | TypeScript                                     |
| `pnpm format` / `pnpm format:check` | Prettier                                       |
| `pnpm test`                         | Tests unitarios (Vitest)                       |
| `pnpm test:e2e`                     | Smoke e2e (Playwright)                         |
| `pnpm react:doctor`                 | Diagnóstico React                              |
| `pnpm ci`                           | Lint + types + format + tests + doctor + build |

---

> **Autor:** Fravelz
>
> **Licencia:** Apache 2.0
