/**
 * Rebuilds every app icon / splash PNG from the Isoko logo.
 * Run:  node tools/generate-icons.js   (needs: npm i -D sharp)
 * Edit the colours or shapes below, run it again, and all icons update.
 */
const sharp = require('sharp');
const path = require('path');
const out = (f) => path.join(__dirname, '..', 'assets', 'images', f);

const COLORS = {
  bgTop: '#14A386', bgMid: '#0B6E5C', bgBottom: '#07423C',
  goldTop: '#FFD27A', goldBottom: '#F2A93B', lane: '#0B6E5C',
};

// The symbol only (roof + gold window + road), drawn on a 1024 grid.
const symbol = (fill = '#FFFFFF', gold = 'url(#gold)', lane = COLORS.lane, roadFill = 'url(#road)') => `
  <path d="M268 486 L512 290 L756 486" fill="none" stroke="${fill}" stroke-width="72" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="512" cy="468" r="54" fill="${gold}"/>
  <path d="M476 580 Q476 560 496 560 L528 560 Q548 560 548 580 L616 770 Q624 798 596 798 L428 798 Q400 798 408 770 Z" fill="${roadFill}"/>
  <rect x="504" y="616" width="16" height="46" rx="8" fill="${lane}" opacity="0.9"/>
  <rect x="501" y="694" width="22" height="62" rx="11" fill="${lane}" opacity="0.9"/>`;

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${COLORS.bgTop}"/><stop offset="0.55" stop-color="${COLORS.bgMid}"/><stop offset="1" stop-color="${COLORS.bgBottom}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.28" cy="0.18" r="0.75">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${COLORS.goldTop}"/><stop offset="1" stop-color="${COLORS.goldBottom}"/>
    </linearGradient>
    <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4F5F0"/>
    </linearGradient>
  </defs>`;

const svg = (body, size = 1024) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}">${defs}${body}</svg>`);

const background = (rx) => `<rect width="1024" height="1024" rx="${rx}" fill="url(#bg)"/><rect width="1024" height="1024" rx="${rx}" fill="url(#glow)"/>`;
// Shrinks the symbol toward the centre (Android safe zone is the middle ~66%).
const scaled = (s, inner) => `<g transform="translate(${512 - 512 * s} ${512 - 512 * s}) scale(${s})">${inner}</g>`;

async function main() {
  // iOS / store icon: full square, iOS rounds the corners itself.
  await sharp(svg(background(0) + symbol())).png().toFile(out('icon.png'));
  // Android adaptive icon layers.
  await sharp(svg(background(0))).png().toFile(out('android-icon-background.png'));
  await sharp(svg(scaled(0.72, symbol()))).png().toFile(out('android-icon-foreground.png'));
  await sharp(svg(scaled(0.72, symbol('#FFFFFF', '#FFFFFF', '#000000', '#FFFFFF')))).png().toFile(out('android-icon-monochrome.png'));
  // Splash: rounded logo tile on transparent background.
  await sharp(svg(background(232) + symbol())).resize(1024).png().toFile(out('splash-icon.png'));
  // Web favicon.
  await sharp(svg(background(232) + symbol())).resize(48).png().toFile(out('favicon.png'));
  // Brand files.
  await sharp(svg(background(232) + symbol())).resize(1024).png().toFile(path.join(__dirname, '..', 'assets', 'brand', 'isoko-logo-1024.png'));
  require('fs').writeFileSync(path.join(__dirname, '..', 'assets', 'brand', 'isoko-mark.svg'), svg(background(232) + symbol()).toString());
  console.log('Icons generated in assets/images');
}
main();
