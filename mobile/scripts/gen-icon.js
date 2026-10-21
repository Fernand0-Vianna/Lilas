const fs = require('fs');
const path = require('path');

const outDir = 'assets/images';

const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='28' fill='#7c5ce0'/>
  <circle cx='42' cy='50' r='10' fill='#ffffff'/>
  <circle cx='86' cy='50' r='10' fill='#ffffff'/>
  <circle cx='32' cy='8' r='8' fill='#5b3fc4'/>
  <circle cx='96' cy='8' r='8' fill='#5b3fc4'/>
  <circle cx='64' cy='76' r='6' fill='#ffffff'/>
</svg>`;

const bgSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 108'><rect width='108' height='108' rx='24' fill='#E6F4FE'/></svg>`;

const sizes = [
  { name: 'icon.png', size: 1024 },
  { name: 'android-icon-foreground.png', size: 288 },
  { name: 'android-icon-background.png', size: 288, bg: true },
];

try {
  const sharp = require('sharp');
  const buf = Buffer.from(svg);
  for (const s of sizes) {
    if (s.bg) {
      sharp(Buffer.from(bgSvg)).resize(288, 288).png().toFile(path.join(outDir, s.name));
    } else {
      sharp(buf).resize(s.size, s.size).png().toFile(path.join(outDir, s.name));
    }
  }
  console.log('PNGs gerados com sharp');
} catch(e) {
  console.log('Sharp indisponivel, salvando SVG');
  fs.writeFileSync(path.join(outDir, 'icon.svg'), svg);
}