import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const ORANGE = "#ff3300";
const WHITE = "#ffffff";

/**
 * Lucide `circle-user` — white strokes on brand orange.
 * Keep stroke-width in the 24×24 user space; the scale transform thickens it.
 */
function makeSvg(size, pad = 0.2) {
  const inner = size * (1 - 2 * pad);
  const offset = (size - inner) / 2;
  const scale = inner / 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${ORANGE}"/>
  <g fill="none" stroke="${WHITE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(${offset} ${offset}) scale(${scale})">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="10" r="3"/>
    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
  </g>
</svg>`;
}

const iconsDir = join("public", "icons");
mkdirSync(iconsDir, { recursive: true });
mkdirSync("app", { recursive: true });

writeFileSync(join(iconsDir, "icon.svg"), makeSvg(512));

const targets = [
  { file: join(iconsDir, "icon-192.png"), size: 192 },
  { file: join(iconsDir, "icon-512.png"), size: 512 },
  { file: join(iconsDir, "apple-touch-icon.png"), size: 180 },
  { file: join(iconsDir, "favicon-32.png"), size: 32 },
  { file: join(iconsDir, "favicon-16.png"), size: 16 },
  { file: join("public", "favicon.png"), size: 32 },
  { file: join("app", "icon.png"), size: 512 },
  { file: join("app", "apple-icon.png"), size: 180 },
];

for (const { file, size } of targets) {
  await sharp(Buffer.from(makeSvg(size))).png().toFile(file);
}

console.log("Generated:", targets.map((t) => t.file).join("\n  "));
