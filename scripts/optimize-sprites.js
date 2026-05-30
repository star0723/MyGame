// 降分辨率 50% + 转 WebP
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, '../public/assets');
const CWEBP = '/tmp/libwebp-1.3.2-windows-x64/bin/cwebp.exe';
const SPRITES = ['skeleton', 'bat', 'goblin', 'militia', 'archer', 'paladin'];

async function optimizeSprite(name) {
  const pngFile = path.join(ASSETS_DIR, `${name}.png`);
  const halfFile = path.join(ASSETS_DIR, `${name}_half.png`);
  const webpFile = path.join(ASSETS_DIR, `${name}.webp`);

  console.log(`\n处理 ${name}.png...`);
  const origSize = fs.statSync(pngFile).size / 1024;
  console.log(`  原始: ${origSize.toFixed(0)}K`);

  // 1. 降分辨率 50%
  console.log(`  1. 降分辨率 50%...`);
  const metadata = await sharp(pngFile).metadata();
  await sharp(pngFile)
    .resize(Math.floor(metadata.width / 2), Math.floor(metadata.height / 2), {
      kernel: 'lanczos3'
    })
    .png({ compressionLevel: 9 })
    .toFile(halfFile);

  // 2. 转 WebP
  console.log(`  2. 转 WebP (质量 85)...`);
  execSync(`"${CWEBP}" -q 85 -alpha_q 100 -m 6 "${halfFile}" -o "${webpFile}"`, {
    stdio: 'pipe'
  });

  const webpSize = fs.statSync(webpFile).size / 1024;
  console.log(`  → WebP: ${webpSize.toFixed(0)}K (压缩 ${(100 - webpSize/origSize*100).toFixed(0)}%)`);

  // 删除临时文件
  fs.unlinkSync(halfFile);
}

async function main() {
  console.log('=== 降分辨率 50% + 转 WebP ===');

  for (const sprite of SPRITES) {
    await optimizeSprite(sprite);
  }

  console.log('\n=== 总体积对比 ===');
  let pngTotal = 0, webpTotal = 0;
  for (const sprite of SPRITES) {
    pngTotal += fs.statSync(path.join(ASSETS_DIR, `${sprite}.png`)).size;
    webpTotal += fs.statSync(path.join(ASSETS_DIR, `${sprite}.webp`)).size;
  }
  pngTotal /= (1024 * 1024);
  webpTotal /= (1024 * 1024);
  console.log(`PNG 总计: ${pngTotal.toFixed(1)}MB`);
  console.log(`WebP 总计: ${webpTotal.toFixed(1)}MB`);
  console.log(`压缩率: ${(100 - webpTotal/pngTotal*100).toFixed(0)}%`);
}

main().catch(console.error);
