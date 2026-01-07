// lib/pdfmake.ts
// pdfmake'i TEK BİR YERDE init ediyoruz - font karışıklığını önlemek için
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import poppinsVfs from "@/lib/vfs_fonts_poppins";

let initialized = false;

export function getPdfMake() {
  if (!initialized) {
    // VFS'leri birleştir (Roboto + Poppins)
    // pdfFonts formatını kontrol et (default.pdfMake.vfs veya default.vfs)
    let robotoVfs = {};
    if (pdfFonts.default?.pdfMake?.vfs) {
      robotoVfs = pdfFonts.default.pdfMake.vfs;
    } else if (pdfFonts.default?.vfs) {
      robotoVfs = pdfFonts.default.vfs;
    } else if (pdfFonts.pdfMake?.vfs) {
      robotoVfs = pdfFonts.pdfMake.vfs;
    } else if (pdfFonts.vfs) {
      robotoVfs = pdfFonts.vfs;
    }
    
    pdfMake.vfs = {
      ...robotoVfs,
      ...poppinsVfs,
    };

    // Font tanımlarını ekle (KRİTİK: fonts tanımı YOKSA font asla kullanılmaz!)
    // ⚠️ VFS'te Poppins-Bold.ttf YOK, Poppins-Medium.ttf var!
    // pdfmake'te "medium" diye bir style yok, ama bold slotuna Medium'u bağlayabiliriz
    pdfMake.fonts = {
      Roboto: {
        normal: "Roboto-Regular.ttf",
        bold: "Roboto-Medium.ttf",
        italics: "Roboto-Italic.ttf",
        bolditalics: "Roboto-MediumItalic.ttf",
      },
      Poppins: {
        normal: "Poppins-Regular.ttf",
        bold: "Poppins-Bold.ttf", // ⬅️ Artık Poppins-Bold.ttf VFS'te var!
        italics: "Poppins-Italic.ttf",
        bolditalics: "Poppins-Bold.ttf", // ⬅️ BoldItalic için Bold kullanıyoruz
      },
    };

    initialized = true;
  }

  return pdfMake;
}
