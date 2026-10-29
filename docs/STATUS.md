# Estado del proyecto
Actualizado: 2026-10-28

## Hecho
- Prototipo estático en `feat/static-prototype`: inicio, producto (`?id=`), carrito y checkout simulado con confirmación.
- Multi-mercado MX/US/CA: selector en el header, precios por moneda (no conversión), envío y umbral de envío gratis por país, código postal y Estado/Provincia según el país en el checkout.
- Fotos de stock de Unsplash (licencia libre, uso comercial) en `assets/img/`: producto + galería por producto, hero de ala al atardecer, franja de cabina. Fuentes anotadas en `products.js` e `index.html`. Se quitó el color Negro porque no hay foto.
- Logo extraído de la foto del parche (canvas, fondo transparente): `assets/img/logo.webp` / `logo.png` (completo) y `logo-emblem.webp` (header + favicon). Es raster con textura de bordado; falta el vector del cliente.
- Diseño basado en el parche del logo (negro + cobre, Cinzel + Barlow) y referencias de Mobbin (H&M, lululemon, Superpower, Shopify).
- Pruebas Playwright: flujo completo, MX, CA, producto inexistente (desktop + mobile) y `responsive.spec.ts`: 4 páginas × 10 anchos (320–1024px) sin scroll horizontal, header sin empalmes y botones ≥44px.

## Decisiones
- Sin framework ni backend; si el cliente aprueba → Next.js + TS o Shopify (Shopify Markets resuelve multi-moneda/impuestos).
- Moneda siempre con código ISO ("$64.00 USD"), porque "$" es ambiguo en los 3 mercados.
- Mercado inicial adivinado por idioma del navegador; por defecto US.

## Pendiente del cliente
Fotos reales (por color), logo en vector, precios y tarifas de envío reales, tallas, idioma (EN para US/CA; francés es obligatorio para clientes de Quebec), significado de "BH".

## Siguiente
- Revisión del cliente → ajustes.
- Primer commit (`chore: add pipeline setup`) y PR del prototipo; cargar tareas en Notion.
- Producción: impuestos (IVA / sales tax / GST-HST), aranceles transfronterizos, pagos reales.

## Bloqueos
- (ninguno) Deploy deshabilitado a propósito mientras sea prototipo.
