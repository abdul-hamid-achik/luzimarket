import fs from 'fs';
import path from 'path';

// List of required product images from seed data
const productImages = [
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
];

// Create products directory if it doesn't exist
const productsDir = path.join(process.cwd(), 'public', 'images', 'products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// SVG placeholder template
const createPlaceholderSVG = (filename: string) => {
  const name = filename.replace('.jpg', '').replace(/-/g, ' ');
  return `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="800" fill="#f3f4f6"/>
  <text x="400" y="400" font-family="Arial, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle">
    ${name}
  </text>
  <text x="400" y="440" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">
    Placeholder Image
  </text>
</svg>`;
};

// Create placeholder images
productImages.forEach((filename) => {
  const filepath = path.join(productsDir, filename);
  if (!fs.existsSync(filepath)) {
    // Create SVG content
    const svgContent = createPlaceholderSVG(filename);
    // Save as .svg first
    const svgPath = filepath.replace('.jpg', '.svg');
    fs.writeFileSync(svgPath, svgContent);
    console.log(`Created placeholder: ${filename}`);
  }
});

console.log('✅ Placeholder images created successfully');