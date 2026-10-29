// Catalog data. Adding a product = adding one object; pages render from this list.
// ponytail: static array, move to a CMS/API once the client edits the catalog themselves.
// Prices, shipping, copy and photos are placeholders until the client confirms them.
window.CATALOG = {
  // One entry per country we sell to. Prices are set per currency (not FX-converted)
  // so the client controls psychological pricing in each market.
  markets: {
    MX: {
      name: 'México', currency: 'MXN',
      freeShippingFrom: 1800, shipping: { standard: 149, express: 349 },
      regionLabel: 'Estado', postal: { pattern: '\\d{5}', example: '64000' },
    },
    US: {
      name: 'Estados Unidos', currency: 'USD',
      freeShippingFrom: 100, shipping: { standard: 8, express: 20 },
      regionLabel: 'Estado', postal: { pattern: '\\d{5}(-\\d{4})?', example: '77001' },
    },
    CA: {
      name: 'Canadá', currency: 'CAD',
      freeShippingFrom: 140, shipping: { standard: 12, express: 28 },
      regionLabel: 'Provincia', postal: { pattern: '[A-Za-z]\\d[A-Za-z] ?\\d[A-Za-z]\\d', example: 'M5V 2T6' },
    },
  },
  defaultMarket: 'US',
  products: [
    {
      id: 'manga-larga',
      name: 'Camisa Piloto Manga Larga',
      // Stock photo (Unsplash license, free commercial use): https://unsplash.com/photos/GDebkNryTd4 — Nimble Made
      image: 'assets/img/manga-larga.webp',
      // Supporting shots (Unsplash): fabric https://unsplash.com/photos/wNyL-I2IA3U, cockpit https://unsplash.com/photos/-Pw8mH3mWws
      gallery: [
        { src: 'assets/img/detalle-tela.webp', alt: 'Detalle de la tela blanca antiarrugas' },
        { src: 'assets/img/ambiente-cabina.webp', alt: 'Pilotos en la cabina de un avión comercial' },
      ],
      prices: { MXN: 1150, USD: 64, CAD: 88 },
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      soldOut: ['XXL'],
      colors: [
        { name: 'Blanco', hex: '#F5F1EB' },
      ],
      tagline: 'Para las rutas largas.',
      description: 'Camisa de piloto con charreteras desmontables, cuello estructurado y botones metálicos. Corte recto que se mantiene impecable de la cabina a la escala.',
      materials: '65% algodón, 35% poliéster. Tejido antiarrugas. Lavar a máquina en frío.',
    },
    {
      id: 'manga-corta',
      name: 'Camisa Piloto Manga Corta',
      // Stock photo (Unsplash license, free commercial use): https://unsplash.com/photos/fEUAXea9Pxk — nicola dowie
      image: 'assets/img/manga-corta.webp',
      // Supporting shots (Unsplash): fabric https://unsplash.com/photos/wNyL-I2IA3U, sunset https://unsplash.com/photos/A093ajsVSjc
      gallery: [
        { src: 'assets/img/detalle-tela.webp', alt: 'Detalle de la tela blanca transpirable' },
        { src: 'assets/img/ambiente-atardecer.webp', alt: 'Ala de avión sobre el mar al atardecer' },
      ],
      prices: { MXN: 1050, USD: 58, CAD: 79 },
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      soldOut: [],
      colors: [
        { name: 'Blanco', hex: '#F5F1EB' },
      ],
      tagline: 'Para los climas cálidos.',
      description: 'La versión de verano de nuestra camisa insignia. Charreteras desmontables, dos bolsillos de pecho y tela transpirable para jornadas largas.',
      materials: '65% algodón, 35% poliéster. Tejido transpirable. Lavar a máquina en frío.',
    },
  ],
};
