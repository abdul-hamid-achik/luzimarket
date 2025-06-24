const fs = require('fs');
const path = require('path');

// List of ALL product images needed (from seed data and missing ones)
const productImages = [
  // Original list
  'rosas-rojas-24.jpg',
  'rosas-rojas-24-2.jpg',
  'arreglo-primaveral.jpg',
  'orquidea-blanca.jpg',
  'tulipanes.jpg',
  'corona-funebre.jpg',
  'trufas-24.jpg',
  'trufas-24-2.jpg',
  'tableta-85.jpg',
  'bombones-mezcal.jpg',
  'caja-degustacion.jpg',
  'vela-lavanda.jpg',
  'set-velas-citricos.jpg',
  'difusor-sandalo.jpg',
  'vela-navidad.jpg',
  'caja-vino-grabada.jpg',
  'album-personalizado.jpg',
  'taza-magica.jpg',
  'caja-spa.jpg',
  'caja-gourmet-mx.jpg',
  'caja-desayuno.jpg',
  'jarron-talavera.jpg',
  'macetas-macrame.jpg',
  'espejo-sol.jpg',
  'cojines-otomi.jpg',
  'collar-ambar.jpg',
  'anillo-plata.jpg',
  'aretes-jade.jpg',
  'pulsar-turquesa.jpg',
  // Missing ones from test failures
  'aretes-perlas.jpg',
  'anillo-turquesa.jpg',
  'pulsera-dijes.jpg',
  'canasta-vinos.jpg',
  'tabla-quesos.jpg',
  'kit-cafe.jpg',
  'aceite-oliva.jpg',
];

// Create a simple 1x1 pixel placeholder image in base64
const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const placeholderBuffer = Buffer.from(placeholderBase64, 'base64');

// Create products directory if it doesn't exist
const productsDir = path.join(process.cwd(), 'public', 'images', 'products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Create all placeholder images
productImages.forEach((filename) => {
  const filepath = path.join(productsDir, filename);
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, placeholderBuffer);
    console.log(`Created placeholder: ${filename}`);
  } else {
    console.log(`Already exists: ${filename}`);
  }
});

console.log('✅ All placeholder images created successfully');