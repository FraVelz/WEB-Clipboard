# WEB-Clipboard

This document is in English. [Versión en español](./README.md)

**Paste clipboard screenshots, browse them, and manage titles. Everything stays in this browser only.**

**Published site:** [web-clipboard-five.vercel.app](https://web-clipboard-five.vercel.app)

Built with **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4**, and **pnpm**.

---

## What’s included

- Paste an image from the clipboard with **Ctrl+V / Cmd+V** or the **Paste** button.
- Optional title in the input: if empty, the capture is stored without a title.
- Local gallery: thumbnail, date, edit title (confirm / cancel), and delete (inline confirmation).
- Lightbox when clicking a thumbnail.
- Persistence in origin **IndexedDB**. No backend or cloud sync: reload keeps data in _this_ browser; another device or profile will not see it.

**Cross-cutting:**

- Spanish UI, dark theme, Lucide SVG icons (no emojis).
- Security headers (CSP allows `blob:` for thumbnails).
- GitHub Actions CI (lint, types, Prettier, tests, React Doctor, build, and e2e smoke).

---

## Quick start

**Requirements:** Node.js 22+ and pnpm 11.

```bash
git clone https://github.com/FraVelz/WEB-Clipboard.git
cd WEB-Clipboard
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

**Routes:**

| Route | Content                  |
| ----- | ------------------------ |
| `/`   | Composer + local gallery |

**Environment (optional):**

| Variable               | Use                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (metadata / CI). Defaults to `http://localhost:3000` locally and `https://web-clipboard-five.vercel.app` in CI. |

No `.env` file is required to use the app.

---

## Project structure

```text
├── src/
│   ├── app/                      # App Router
│   │   ├── layout.tsx            # Metadata, fonts, Analytics
│   │   ├── globals.css           # Tailwind v4 + dark tokens
│   │   ├── page.tsx              # Home page
│   │   └── favicon.ico
│   ├── components/
│   │   ├── ClipboardApp.tsx      # UI composition
│   │   ├── CaptureComposer.tsx   # Title input + paste
│   │   ├── CaptureGallery.tsx
│   │   ├── CaptureCard.tsx
│   │   ├── CaptureLightbox.tsx
│   │   └── icons/                # Vendored Lucide SVGs
│   ├── hooks/useCaptures.ts
│   └── lib/
│       ├── captures-db.ts        # IndexedDB
│       ├── clipboard.ts          # Extract image/* from clipboard
│       └── cn.ts
├── e2e/home.spec.ts              # Playwright smoke
├── security-headers.ts
├── vercel.json
└── .github/workflows/ci.yml
```

**Assets:** favicon at `src/app/favicon.ico`. No README screenshot yet.

---

## Scripts

| Command                             | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| `pnpm dev`                          | Dev server                                     |
| `pnpm build`                        | Production build                               |
| `pnpm start`                        | Serve the build                                |
| `pnpm lint`                         | ESLint                                         |
| `pnpm typecheck`                    | TypeScript                                     |
| `pnpm format` / `pnpm format:check` | Prettier                                       |
| `pnpm test`                         | Unit tests (Vitest)                            |
| `pnpm test:e2e`                     | E2E smoke (Playwright)                         |
| `pnpm react:doctor`                 | React diagnostics                              |
| `pnpm ci`                           | Lint + types + format + tests + doctor + build |

---

> **Author:** Fravelz
>
> **License:** Apache 2.0
