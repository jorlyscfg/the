const fs = require('fs');
const path = require('path');

// SVG template
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0ea5e9"/>
  <text
    x="${size/2}"
    y="${size/2}"
    font-size="${size * 0.4}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Arial, sans-serif"
  >TH</text>
</svg>`;

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG files (browsers can use these directly)
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), createSVG(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), createSVG(512));

console.log('✅ Iconos SVG generados exitosamente');
console.log('   - icon-192.svg');
console.log('   - icon-512.svg');
