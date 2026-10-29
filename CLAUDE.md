# FirstClassPilot

> Reglas globales del pipeline: se cargan desde `~/.claude/CLAUDE.md`. Este archivo las complementa para este repo; si hay conflicto, gana este.

## Proyecto
- **Qué es**: prototipo clickable de e-commerce para **First Class Pilot**, marca de ropa de aviador (camisas de piloto manga larga y manga corta). Sirve para validar flujo y look & feel con el cliente antes de invertir en backend y pagos.
- **Tipo**: web/app
- **Fase**: prototipo (sin backend, pagos simulados, sin deploy).
- **Mercados**: México (MXN), Estados Unidos (USD), Canadá (CAD).

## Idioma
Por defecto el global (español para reportes, tareas y docs; inglés para código y commits). Cambios para este repo: la UI del sitio está en español; EN/FR (Quebec) pendiente de confirmar con el cliente.

## Stack
HTML + CSS + JS vanilla, sin framework ni build. Pruebas E2E con Playwright (TypeScript). Servidor local en Python (stdlib).

## Comandos
| Acción | Comando |
|---|---|
| Instalar | `npm install && npx playwright install chromium` |
| Desarrollo | `npm run serve` → http://localhost:8000 (sin caché, `serve.py`) |
| Lint | TODO (no hay linter configurado) |
| Tests | `npm test` (levanta el servidor solo; flujo de compra desktop + mobile y `responsive.spec.ts` en 10 anchos) |
| Build | No aplica (sitio estático) |

## Deploy
- **Modo**: `disabled` (fase de prototipo). No configurar `DEPLOY_MODE` todavía.
- **Destino**: TODO (cuando se elija hosting; el sitio estático encaja con `rsync` o `ftp`).
- **Rollback**: TODO
- El deploy lo dispara `.github/workflows/deploy.yml` al llegar a `main` y requiere aprobación del environment `production`.
- Antes de activarlo: separar lo público (`*.html` + `assets/`) en una carpeta (p. ej. `public/`) y usar `BUILD_DIR=public`, para no publicar `tests/`, `docs/`, `design-system/` ni `serve.py`.

## Git (excepción a las reglas globales)
- **Sin pull requests**: los commits van directo a `main` y se hace push a `origin/main` (`git@github.com:4k3sito/FirstClassPilot.git`).
- Se mantienen: Conventional Commits pequeños, checkpoint antes de cada commit/push y revisión con el subagente `reviewer` antes del push.
- `/ship` en este repo = commit + push a `main` (sin abrir PR). CI corre en cada push a `main`.

## Notion
- **Base de tareas**: https://app.notion.com/p/6958461f59704d9c82f97ac5ea4d18d4
- **Data source**: collection://e89131c3-6eff-4e39-91f2-dd914138f63f

## Convenciones del repo
- `assets/products.js` — catálogo y mercados (precios por moneda, envío, formato postal). Agregar producto o país = agregar un objeto; las páginas renderizan desde ahí.
- `assets/app.js` — header/footer, carrito (localStorage), mercado y lógica por página según `<body data-page>`.
- `assets/styles.css` — tokens de diseño en `:root`; nada de hex sueltos en componentes.
- `design-system/firstclasspilot/MASTER.md` — sistema de diseño; la sección "Brand overrides" manda sobre lo generado.
- Imágenes en `assets/img/` (WebP). Fotos de stock de Unsplash con su fuente anotada en `products.js` / `index.html`; se reemplazan por las del cliente con el mismo nombre de archivo.
- Precios siempre con código ISO (`$64.00 USD`).
- Atajos deliberados marcados con comentarios `ponytail:`.

## No tocar
- `assets/img/logo-patch.webp` (foto original del cliente; los `logo*.webp/png` se derivan de ella).
- `node_modules/`, `test-results/`, `playwright-report/` (generados).
