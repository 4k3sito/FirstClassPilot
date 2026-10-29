// Shared header/footer, cart state and per-page behaviour. Each page sets <body data-page="...">.
(() => {
  'use strict';

  const { products, markets, defaultMarket } = window.CATALOG;
  const CART_KEY = 'fcp-cart';
  const MARKET_KEY = 'fcp-market';
  const MAX_QTY = 10;

  const $ = (sel, root = document) => root.querySelector(sel);
  const findProduct = (id) => products.find((p) => p.id === id);

  /* ---------- Market (country → currency, shipping, postal format) ---------- */
  function initialMarket() {
    try { const saved = localStorage.getItem(MARKET_KEY); if (Object.hasOwn(markets, saved)) return saved; } catch { /* no storage */ }
    // First visit: guess from the browser region (es-MX, en-CA, fr-CA…); the header selector corrects it.
    const region = (navigator.language.split('-')[1] || '').toUpperCase();
    return Object.hasOwn(markets, region) ? region : defaultMarket;
  }
  // "$" alone is ambiguous across MXN/USD/CAD, so always append the ISO code: "$1,150.00 MXN".
  function moneyFor(m) {
    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: m.currency, currencyDisplay: 'narrowSymbol' });
    return (n) => `${fmt.format(n)} ${m.currency}`;
  }
  let marketCode = initialMarket();
  let market = markets[marketCode];
  let money = moneyFor(market);
  function setMarket(code) {
    if (!Object.hasOwn(markets, code)) return;
    marketCode = code;
    market = markets[code];
    money = moneyFor(market);
    try { localStorage.setItem(MARKET_KEY, code); } catch { /* no storage */ }
  }
  const priceOf = (p) => p.prices[market.currency];

  // Lucide-style outline icons, 1.5px stroke.
  const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICONS = {
    bag: icon('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
    close: icon('<path d="M18 6 6 18M6 6l12 12"/>'),
    minus: icon('<path d="M5 12h14"/>'),
    plus: icon('<path d="M12 5v14M5 12h14"/>'),
    trash: icon('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6L12 17.2 5.8 21.7l2.4-7.6L2 9.6h7.6z"/></svg>',
    wings: icon('<path d="M12 8v8M2 9c3 0 6 1 8 3M22 9c-3 0-6 1-8 3M4 13c2 0 4 .5 6 1.5M20 13c-2 0-4 .5-6 1.5"/><circle cx="12" cy="6" r="2"/>'),
    thread: icon('<path d="M4 20 20 4M8 20l12-12M4 16 16 4"/>'),
    flag: icon('<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>'),
  };

  // ponytail: stock photos until the client's product shoot; one image per product (no per-color photos yet).
  function productImg(product, alt = '', eager = false) {
    return `<img src="${product.image}" alt="${alt}" width="1000" height="1250" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  }

  /* ---------- Cart (localStorage; may be unavailable in private mode) ---------- */
  const Cart = {
    // localStorage is user-editable: keep only lines that match the catalog, so nothing untrusted reaches innerHTML.
    read() {
      let raw;
      try { raw = JSON.parse(localStorage.getItem(CART_KEY)); } catch { return []; }
      if (!Array.isArray(raw)) return [];
      return raw.filter((i) => {
        const p = i && findProduct(i.id);
        return p && p.sizes.includes(i.size) && p.colors.some((c) => c.name === i.color)
          && Number.isInteger(i.qty) && i.qty >= 1 && i.qty <= MAX_QTY;
      });
    },
    write(items) {
      try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* cart lives only for this page view */ }
      updateBadge();
    },
    add({ id, size, color, qty = 1 }) {
      const items = Cart.read();
      const line = items.find((i) => i.id === id && i.size === size && i.color === color);
      if (line) line.qty = Math.min(line.qty + qty, MAX_QTY); else items.push({ id, size, color, qty: Math.min(qty, MAX_QTY) });
      Cart.write(items);
    },
    setQty(index, qty) {
      const items = Cart.read();
      if (!items[index]) return;
      if (qty < 1) items.splice(index, 1); else items[index].qty = Math.min(qty, MAX_QTY);
      Cart.write(items);
    },
    count: () => Cart.read().reduce((n, i) => n + i.qty, 0),
    clear: () => Cart.write([]),
  };

  // Cart lines store only ids, so switching market reprices the whole cart in the new currency.
  function cartTotals(items, method = 'standard', m = market) {
    const subtotal = items.reduce((sum, i) => sum + (findProduct(i.id)?.prices[m.currency] ?? 0) * i.qty, 0);
    const ship = subtotal === 0 ? 0
      : method === 'express' ? m.shipping.express
      : subtotal >= m.freeShippingFrom ? 0 : m.shipping.standard;
    return { subtotal, shipping: ship, total: subtotal + ship };
  }

  /* ---------- Chrome ---------- */
  function renderChrome(page) {
    $('#site-header').outerHTML = `
      <header class="site-header">
        <div class="container">
          <a class="brand" href="index.html" aria-label="First Class Pilot, inicio">
            <img src="assets/img/logo-emblem.webp" alt="" width="860" height="400">
            <span class="brand-text" aria-hidden="true">First Class<small>Pilot</small></span>
          </a>
          <nav class="nav" aria-label="Principal">
            <a class="hide-sm" href="index.html#coleccion">Colección</a>
            <label class="market"><span class="visually-hidden">País de envío y moneda</span>
              <select id="market-select">${Object.entries(markets).map(([code, m]) =>
                `<option value="${code}" ${code === marketCode ? 'selected' : ''}>${code} · ${m.currency}</option>`).join('')}</select>
            </label>
            <a class="icon-btn" href="cart.html" aria-label="Carrito" ${page === 'cart' ? 'aria-current="page"' : ''}>
              ${ICONS.bag}<span class="badge" id="cart-badge" hidden></span>
            </a>
          </nav>
        </div>
      </header>`;
    $('#site-footer').outerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div>
            <img class="footer-logo" src="assets/img/logo.webp" alt="First Class Pilot" width="1320" height="852" loading="lazy">
            <p>Premium · Hecho en México</p>
          </div>
          <div><h3>Tienda</h3><ul>${products.map((p) => `<li><a href="product.html?id=${p.id}">${p.name}</a></li>`).join('')}</ul></div>
          <div><h3>Ayuda</h3><ul><li><a href="#">Envíos y devoluciones</a></li><li><a href="#">Guía de tallas</a></li><li><a href="#">Contacto</a></li></ul></div>
        </div>
      </footer>`;
    // Prices are rendered on load, so re-render by reloading. Checkout switches in place instead (keeps typed data).
    $('#market-select').addEventListener('change', (e) => {
      // Checkout owns the switch (country field) so typed data survives; elsewhere just re-render by reloading.
      if (page === 'checkout') { const c = $('#country'); if (c) { c.value = e.target.value; c.dispatchEvent(new Event('change')); } return; }
      setMarket(e.target.value);
      location.reload();
    });
    paintMarketText();
    document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = ICONS[el.dataset.icon] ?? ''; });
    updateBadge();
  }

  function paintMarketText() {
    document.querySelectorAll('[data-free-ship]').forEach((el) => { el.textContent = money(market.freeShippingFrom); });
    document.querySelectorAll('[data-ship]').forEach((el) => { el.textContent = money(market.shipping[el.dataset.ship]); });
  }

  function updateBadge() {
    const badge = $('#cart-badge');
    if (!badge) return;
    const n = Cart.count();
    badge.textContent = n;
    badge.hidden = n === 0;
    badge.parentElement.setAttribute('aria-label', `Carrito, ${n} ${n === 1 ? 'artículo' : 'artículos'}`);
  }

  /* ---------- Pages ---------- */
  function initHome() {
    const featured = products[products.length - 1];
    const chip = $('#hero-feature');
    chip.href = `product.html?id=${featured.id}`;
    chip.innerHTML = `${productImg(featured)}<span><span class="eyebrow">Destacado</span><strong>${featured.name}</strong><span class="price">${money(priceOf(featured))}</span></span>`;
    chip.hidden = false;
    $('#product-grid').innerHTML = products.map((p) => `
      <a class="card" href="product.html?id=${p.id}">
        <div class="card-media">${productImg(p)}</div>
        <div class="card-body">
          <div><h3>${p.name}</h3><p class="muted" style="margin:0">${p.tagline}</p></div>
          <span class="price">${money(priceOf(p))}</span>
        </div>
      </a>`).join('');
  }

  function initProduct() {
    const product = findProduct(new URLSearchParams(location.search).get('id'));
    const root = $('#pdp');
    if (!product) {
      root.innerHTML = `<div class="empty"><h1>Producto no encontrado</h1><a class="btn" href="index.html#coleccion">Ver colección</a></div>`;
      return;
    }
    document.title = `${product.name} · First Class Pilot`;
    const state = { color: product.colors[0], size: null };

    root.innerHTML = `
      <div class="pdp">
        <div class="pdp-gallery" role="region" aria-label="Galería de fotos" tabindex="0">
          <div class="pdp-media" id="pdp-media"></div>
          ${(product.gallery ?? []).map((g) => `<div class="pdp-media"><img src="${g.src}" alt="${g.alt}" width="1000" height="1250" loading="lazy" decoding="async"></div>`).join('')}
        </div>
        <div class="pdp-panel">
          <p class="eyebrow">Premium · Hecho en México</p>
          <h1>${product.name}</h1>
          <p class="price">${money(priceOf(product))}</p>
          <form id="add-form" novalidate>
            <fieldset class="option-group">
              <legend>Color: <span class="muted" id="color-name">${state.color.name}</span></legend>
              <div class="options">${product.colors.map((c, i) => `
                <label class="option swatch"><input type="radio" name="color" value="${i}" ${i === 0 ? 'checked' : ''}>
                <span><i style="background:${c.hex}"></i><span class="visually-hidden">${c.name}</span></span></label>`).join('')}
              </div>
            </fieldset>
            <fieldset class="option-group" aria-describedby="size-error">
              <legend>Talla</legend>
              <div class="options">${product.sizes.map((s) => {
                const out = product.soldOut.includes(s);
                return `<label class="option"><input type="radio" name="size" value="${s}" ${out ? 'disabled' : ''}>
                  <span>${s}${out ? '<span class="visually-hidden"> (agotada)</span>' : ''}</span></label>`;
              }).join('')}
              </div>
              <p class="field-error" id="size-error" role="alert"></p>
              <button type="button" class="link-btn" id="open-sizes">Guía de tallas</button>
            </fieldset>
            <div class="pdp-actions"><button class="btn btn--block" type="submit">Agregar al carrito</button></div>
          </form>
          <details open><summary>Descripción</summary><div>${product.description}</div></details>
          <details><summary>Materiales y cuidado</summary><div>${product.materials}</div></details>
          <details><summary>Envío y devoluciones</summary><div>Envío estándar gratis desde ${money(market.freeShippingFrom)}. Devoluciones sin costo dentro de 30 días.</div></details>
        </div>
      </div>
      <dialog id="size-guide" aria-labelledby="size-guide-title">
        <div class="dialog-head"><h2 id="size-guide-title">Guía de tallas</h2>
          <button class="icon-btn" type="button" data-close aria-label="Cerrar">${ICONS.close}</button></div>
        <table><thead><tr><th>Talla</th><th>Pecho (cm)</th><th>Cuello (cm)</th></tr></thead>
          <tbody>${[['S', '92–97', '37–38'], ['M', '98–103', '39–40'], ['L', '104–109', '41–42'], ['XL', '110–116', '43–44'], ['XXL', '117–123', '45–46']]
            .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      </dialog>
      <dialog class="added" id="added" aria-labelledby="added-title">
        <div class="dialog-head"><h2 id="added-title">Agregado al carrito</h2>
          <button class="icon-btn" type="button" data-close aria-label="Cerrar">${ICONS.close}</button></div>
        <div class="added-item" id="added-item"></div>
        <a class="btn btn--block" href="checkout.html">Pagar</a>
        <a class="btn btn--ghost btn--block" href="cart.html" id="view-cart">Ver carrito</a>
        <button class="link-btn" type="button" data-close>Seguir comprando</button>
      </dialog>`;

    const paintMedia = () => { $('#pdp-media').innerHTML = productImg(product, `${product.name} en color ${state.color.name}`, true); };
    paintMedia();

    const form = $('#add-form');
    const sizeError = $('#size-error');
    form.addEventListener('change', (e) => {
      if (e.target.name === 'color') {
        state.color = product.colors[Number(e.target.value)];
        $('#color-name').textContent = state.color.name;
        paintMedia();
      }
      if (e.target.name === 'size') { state.size = e.target.value; sizeError.textContent = ''; }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.size) {
        sizeError.textContent = 'Selecciona una talla para continuar.';
        form.querySelector('input[name="size"]:not(:disabled)').focus();
        return;
      }
      Cart.add({ id: product.id, size: state.size, color: state.color.name });
      $('#added-item').innerHTML = `<div class="thumb">${productImg(product)}</div>
        <div><strong>${product.name}</strong><p class="muted" style="margin:0">Color: ${state.color.name} · Talla: ${state.size}</p>
        <p class="price" style="margin:0">${money(priceOf(product))}</p></div>`;
      $('#view-cart').textContent = `Ver carrito (${Cart.count()})`;
      const added = $('#added');
      if (!added.open) added.show();
      $('[data-close]', added).focus();
    });

    $('#open-sizes').addEventListener('click', () => $('#size-guide').showModal());
    root.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) e.target.closest('dialog').close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#added').close(); });
  }

  function summaryHtml(items, method, cta) {
    const t = cartTotals(items, method);
    const toFree = market.freeShippingFrom - t.subtotal;
    return `
      <h2>Resumen</h2>
      <dl>
        <dt>Subtotal</dt><dd data-testid="subtotal">${money(t.subtotal)}</dd>
        <dt>Envío</dt><dd>${t.shipping === 0 ? 'Gratis' : money(t.shipping)}</dd>
        <dt class="total">Total</dt><dd class="total" data-testid="total">${money(t.total)}</dd>
      </dl>
      ${cta}
      ${method === 'standard' && toFree > 0 ? `<p class="note">Te faltan ${money(toFree)} para envío gratis.</p>` : ''}
      <p class="note">Impuestos calculados al finalizar la compra. Devoluciones gratis en 30 días.</p>`;
  }

  function initCart() {
    const root = $('#cart');
    const render = () => {
      const items = Cart.read();
      if (items.length === 0) {
        root.innerHTML = `<div class="empty"><h2>Tu carrito está vacío</h2><p class="muted">Empieza por nuestra colección insignia.</p>
          <a class="btn" href="index.html#coleccion">Ver colección</a></div>`;
        return;
      }
      root.innerHTML = `<div class="cart-layout">
        <ul class="cart-list">${items.map((item, i) => {
          const p = findProduct(item.id);
          if (!p) return '';
          return `<li class="cart-item">
            <a class="thumb" href="product.html?id=${p.id}" aria-label="${p.name}">${productImg(p)}</a>
            <div>
              <h3>${p.name}</h3>
              <p class="meta">Color: ${item.color} · Talla: ${item.size} · ${money(priceOf(p))}</p>
              <div class="cart-row">
                <div class="stepper" role="group" aria-label="Cantidad de ${p.name}">
                  <button class="icon-btn" data-qty="${i}" data-delta="-1" aria-label="Quitar uno">${ICONS.minus}</button>
                  <output aria-live="polite">${item.qty}</output>
                  <button class="icon-btn" data-qty="${i}" data-delta="1" aria-label="Agregar uno" ${item.qty >= MAX_QTY ? 'disabled' : ''}>${ICONS.plus}</button>
                </div>
                <span class="price">${money(priceOf(p) * item.qty)}</span>
                <button class="icon-btn" data-remove="${i}" aria-label="Eliminar ${p.name}">${ICONS.trash}</button>
              </div>
            </div>
          </li>`;
        }).join('')}</ul>
        <aside class="summary" aria-label="Resumen del pedido">
          ${summaryHtml(items, 'standard', '<a class="btn btn--block" href="checkout.html">Continuar al pago</a>')}
        </aside>
      </div>`;
    };
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const items = Cart.read();
      if (btn.dataset.qty) {
        const i = Number(btn.dataset.qty);
        Cart.setQty(i, items[i].qty + Number(btn.dataset.delta));
      } else if (btn.dataset.remove) {
        Cart.setQty(Number(btn.dataset.remove), 0);
      } else return;
      render();
    });
    render();
  }

  function initCheckout() {
    const items = Cart.read();
    const root = $('#checkout');
    if (items.length === 0) {
      root.innerHTML = `<div class="empty"><h2>No hay nada que pagar todavía</h2><a class="btn" href="index.html#coleccion">Ver colección</a></div>`;
      return;
    }
    const form = $('#checkout-form');
    const summary = $('#checkout-summary');
    const method = () => form.elements.delivery.value;
    const paintSummary = () => {
      summary.innerHTML = `
        <ul class="cart-list" style="margin-bottom:var(--s3)">${items.map((i) => {
          const p = findProduct(i.id);
          return p ? `<li class="cart-row" style="padding:var(--s1) 0"><span>${i.qty} × ${p.name} <span class="muted">(${i.size}, ${i.color})</span></span><span class="price">${money(priceOf(p) * i.qty)}</span></li>` : '';
        }).join('')}</ul>
        ${summaryHtml(items, method(), '<button class="btn btn--block" type="submit" form="checkout-form">Confirmar pedido</button>')}`;
    };
    paintSummary();
    form.addEventListener('change', (e) => { if (e.target.name === 'delivery') paintSummary(); });

    // Country drives currency, shipping and postal format; switch in place so typed data survives.
    const country = form.elements.country;
    country.innerHTML = Object.entries(markets)
      .map(([code, m]) => `<option value="${code}" ${code === marketCode ? 'selected' : ''}>${m.name} (${m.currency})</option>`).join('');
    const applyMarket = () => {
      const zip = form.elements.zip;
      zip.pattern = market.postal.pattern;
      zip.title = `Formato: ${market.postal.example}`;
      zip.inputMode = /[A-Za-z]/.test(market.postal.example) ? 'text' : 'numeric';
      $('#zip-help').textContent = `Ej. ${market.postal.example}`;
      $('#region-label').textContent = market.regionLabel;
      $('#market-select').value = marketCode;
      if (zip.value) showError(zip);
      paintMarketText();
      paintSummary();
    };
    country.addEventListener('change', () => { setMarket(country.value); applyMarket(); });

    // Validate on blur, show the browser's message below the field.
    const showError = (input) => {
      const err = document.getElementById(`${input.id}-error`);
      if (!err) return;
      const valid = input.checkValidity();
      input.setAttribute('aria-invalid', String(!valid));
      err.textContent = valid ? '' : input.validationMessage;
    };
    form.addEventListener('focusout', (e) => { if (e.target.matches('input, select')) showError(e.target); });
    applyMarket();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = [...form.querySelectorAll('input[required], select[required]')];
      fields.forEach((f) => { if (f.tagName === 'INPUT') f.value = f.value.trim(); });
      fields.forEach(showError);
      const firstInvalid = fields.find((f) => !f.checkValidity());
      if (firstInvalid) { firstInvalid.focus(); return; }

      const btn = summary.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Procesando…';
      // ponytail: simulated payment; replace with Stripe/Shopify checkout in production.
      setTimeout(() => {
        const t = cartTotals(items, method());
        const orderNo = `FCP-${Date.now().toString().slice(-6)}`;
        Cart.clear();
        root.innerHTML = `<div class="confirm">
          <p class="eyebrow">Pedido confirmado</p>
          <h1>¡Gracias por volar con nosotros!</h1>
          <p class="order-no" data-testid="order-no">${orderNo}</p>
          <p class="muted">Enviaremos la confirmación a <strong id="confirm-email"></strong>. Total pagado: <span class="price">${money(t.total)}</span>.</p>
          <div class="rule">${ICONS.star}</div>
          <a class="btn" href="index.html">Volver a la tienda</a>
        </div>`;
        $('#confirm-email').textContent = form.elements.email.value;
        root.querySelector('h1').setAttribute('tabindex', '-1');
        root.querySelector('h1').focus();
      }, 600);
    });
  }

  const page = document.body.dataset.page;
  renderChrome(page);
  ({ home: initHome, product: initProduct, cart: initCart, checkout: initCheckout })[page]?.();

  window.FCP = { Cart, cartTotals, ICONS };
})();
