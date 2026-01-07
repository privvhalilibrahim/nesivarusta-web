/**
 * Poppins font'unu pdfmake vfs'e eklemek için script
 * 
 * Kullanım:
 * 1. Poppins font dosyalarını Google Fonts'tan indirin:
 *    https://fonts.google.com/specimen/Poppins
 *    "Download family" butonuna tıklayın ve ZIP'i indirin
 * 
 * 2. ZIP'i açın ve şu dosyaları fonts/Poppins/ klasörüne koyun:
 *    - Poppins-Regular.ttf
 *    - Poppins-Medium.ttf (bold için)
 *    - Poppins-Italic.ttf
 *    - Poppins-MediumItalic.ttf (bolditalics için)
 * 
 * 3. Bu script'i çalıştırın: node scripts/add-poppins-to-vfs.js
 * 
 * 4. Oluşturulan lib/vfs_fonts_poppins.js dosyasını kullanın
 */

const fs = require('fs');
const path = require('path');

// Font dosyalarının yolu
const fontsDir = path.join(__dirname, '..', 'fonts', 'Poppins');
const outputFile = path.join(__dirname, '..', 'lib', 'vfs_fonts_poppins.js');

// Font dosyalarını kontrol et
// ⚠️ pdfmake'te "medium" yok, sadece "bold" var! Bu yüzden Poppins-Bold.ttf kullanıyoruz
const fontFiles = {
  normal: 'Poppins-Regular.ttf',
  bold: 'Poppins-Bold.ttf', // ⬅️ Medium değil, Bold!
  italics: 'Poppins-Italic.ttf',
  bolditalics: 'Poppins-Bold.ttf' // BoldItalic yoksa Bold kullan
};

console.log('🔍 Poppins font dosyalarını kontrol ediliyor...');
console.log(`📁 Font klasörü: ${fontsDir}\n`);

// Tüm font dosyalarının var olup olmadığını kontrol et
const missingFiles = [];
for (const [key, filename] of Object.entries(fontFiles)) {
  const filePath = path.join(fontsDir, filename);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(filename);
  }
}

if (missingFiles.length > 0) {
  console.error('❌ Eksik font dosyaları:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  console.error('\n📥 Lütfen Poppins font dosyalarını şuradan indirin:');
  console.error('   https://fonts.google.com/specimen/Poppins');
  console.error('   "Download family" butonuna tıklayın');
  console.error(`   Ve font dosyalarını ${fontsDir} klasörüne koyun.`);
  console.error('\n📁 Gerekli dosyalar:');
  Object.values(fontFiles).forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

console.log('✅ Tüm font dosyaları bulundu!');
console.log('📦 VFS dosyası oluşturuluyor...\n');

// Font dosyalarını base64'e çevir ve vfs objesi oluştur
const vfs = {};

for (const [key, filename] of Object.entries(fontFiles)) {
  const filePath = path.join(fontsDir, filename);
  const fontBuffer = fs.readFileSync(filePath);
  const base64 = fontBuffer.toString('base64');
  vfs[filename] = base64;
  const sizeKB = (fontBuffer.length / 1024).toFixed(2);
  console.log(`   ✓ ${filename} eklendi (${sizeKB} KB)`);
}

// vfs_fonts.js dosyasını oluştur (pdfmake formatında)
const vfsBefore = "var vfs = ";
const vfsAfter = "; var _global = typeof window === 'object' ? window : typeof global === 'object' ? global : typeof self === 'object' ? self : this; if (typeof _global.pdfMake !== 'undefined' && typeof _global.pdfMake.addVirtualFileSystem !== 'undefined') { _global.pdfMake.addVirtualFileSystem(vfs); } if (typeof module !== 'undefined') { module.exports = vfs; }";

const vfsFileContent = vfsBefore + JSON.stringify(vfs, null, 2) + vfsAfter;

// Output dizinini oluştur
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Dosyayı yaz
fs.writeFileSync(outputFile, vfsFileContent, 'utf8');

console.log(`\n✅ VFS dosyası oluşturuldu: ${outputFile}`);
console.log(`\n📝 Sonraki adımlar:`);
console.log(`   1. app/chat/page.tsx dosyasında Poppins font'larını yükleyin`);
console.log(`   2. Backend'de font: "Poppins" olarak değiştirin`);
console.log(`\n💡 Örnek kullanım:`);
console.log(`   import poppinsVfs from '@/lib/vfs_fonts_poppins';`);
console.log(`   pdfMakeInstance.vfs = { ...pdfMakeInstance.vfs, ...poppinsVfs };`);
