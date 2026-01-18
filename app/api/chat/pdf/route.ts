import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/firebase/firebaseAdmin";
import admin from "firebase-admin";
import { getSesAnalizPrompt, getYuzdelikAksiyonPrompt } from "./prompts";
import { callOpenRouter } from "../../lib/openrouter";
import path from "path";
import fs from "fs";
import { Bold } from "lucide-react";
import { rateLimiter } from "@/lib/rate-limiter";
import { requestLimiter } from "@/lib/performance";
import { logger } from "@/lib/logger";
import { logger } from "@/lib/logger";

// **text** formatındaki metinleri kalın ve turuncu yapan helper fonksiyon
function parseBoldText(text: string): any[] {
  const parts: any[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Bold öncesi normal metin
    if (match.index > lastIndex) {
      const normalText = text.substring(lastIndex, match.index);
      if (normalText) {
        parts.push(normalText);
      }
    }
    // Bold metin (kalın ve turuncu)
    parts.push({
      text: match[1],
      bold: true,
      color: '#f97316',
      fontSize: 10 // Genel font size küçültüldü
    });
    lastIndex = regex.lastIndex;
  }

  // Kalan normal metin
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }

  // Eğer hiç ** bulunamadıysa, direkt string döndür
  if (parts.length === 0) {
    return [text];
  }

  return parts;
}

// Markdown'ı pdfmake formatına çeviren basit parser
function parseMarkdownToPdfmake(
  markdown: string, 
  logoBase64: string, 
  vehicleInfo?: { marka: string; model: string; yil: string; km: string },
  reportNumber?: string
): any {
  const lines = markdown.split('\n');
  const content: any[] = [];
  let inTable = false;
  let tableRows: any[] = [];
  let tableHeaders: string[] = [];
  let titleAdded = false; // Başlık eklendi mi kontrolü
  
  // Markdown'daki ilk tablodan (araç bilgileri tablosu) vehicleInfo'yu güncelle
  // Eğer vehicleInfo boşsa veya eksikse, markdown'daki tablodan çıkar
  if (vehicleInfo) {
    let inInfoTable = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Tablo başlığı bul (Alan | Değer)
      if (line.includes('**Alan**') && line.includes('**Değer**')) {
        inInfoTable = true;
        continue;
      }
      
      // Tablo ayırıcı
      if (inInfoTable && line.includes('---')) {
        continue;
      }
      
      // Tablo satırlarını parse et
      if (inInfoTable && line.startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 2) {
          const label = cells[0].replace(/\*\*/g, '').replace(/<strong>/g, '').replace(/<\/strong>/g, '').trim();
          const value = cells[1].replace(/\*\*/g, '').replace(/<strong>/g, '').replace(/<\/strong>/g, '').trim();
          
          // Marka bul (eğer boşsa)
          if ((label.includes('Marka') || (label.includes('Araç') && !label.includes('Model'))) && !vehicleInfo.marka && value && value !== 'Belirtilmemiş') {
            // "Audi" veya "Audi A6 (2020)" formatından marka çıkar
            const markaMatch = value.match(/^([A-Za-z]+)/);
            if (markaMatch) {
              vehicleInfo.marka = markaMatch[1];
            }
          }
          
          // Model bul (eğer boşsa)
          if (label.includes('Model') && !vehicleInfo.model && value && value !== 'Belirtilmemiş') {
            vehicleInfo.model = value;
          } else if (label.includes('Araç') && !vehicleInfo.model && value && value !== 'Belirtilmemiş' && value.includes(' ')) {
            // "Audi A6 (2020)" formatından model çıkar
            const modelMatch = value.match(/^[A-Za-z]+\s+([A-Za-z0-9]+)/);
            if (modelMatch) {
              vehicleInfo.model = modelMatch[1];
            }
          }
          
          // KM bul (eğer boşsa)
          if ((label.includes('KM') || label.includes('Kilometre')) && !vehicleInfo.km && value && value !== 'Belirtilmemiş') {
            const kmValue = value.replace(/\s*km\s*/gi, '').trim();
            if (kmValue) {
              vehicleInfo.km = kmValue;
            }
          }
        }
        
        // Tablo bitti (başka bir başlık geldi veya tablo dışına çıktık)
        if (line.startsWith('##') || line.startsWith('#')) {
          inInfoTable = false;
          break;
        }
      }
      
      // Tablo dışına çıktık
      if (inInfoTable && !line.startsWith('|') && line.trim() !== '' && !line.includes('---')) {
        inInfoTable = false;
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Boş satır
    if (!line) {
      // Tablo içindeyse boş satırı görmezden gel (tablo devam edebilir)
      if (!inTable) {
        content.push({ text: '', margin: [0, 5] });
      }
      continue;
    }

    // Logo ve başlık (div align="center")
    if (line.includes('<div align="center">')) {
      // Logo
      if (logoBase64) {
        content.push({
          image: logoBase64,
          width: 100,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        });
      }
      // Başlığı bul
      let j = i + 1;
      while (j < lines.length && !lines[j].includes('</div>')) {
        const titleMatch = lines[j].match(/#\s+(.+)/);
        if (titleMatch) {
          const titleText = titleMatch[1].replace(/<[^>]+>/g, '').trim();
          content.push({
            text: titleText,
            fontSize: 16, // Küçültüldü (24 -> 16)
            bold: true,
            color: '#f97316',
            alignment: 'center',
            margin: [0, 0, 0, 20],
            noWrap: true // Tek satır olması için
          });
          
          // Başlığın hemen altına araç bilgileri tablosunu ekle (sadece ilk başlıkta)
          // TÜM alanlar her zaman görünecek, değerler "Belirtilmemiş" olsa bile
          if (!titleAdded) {
            const vehicleTableData: any[] = [];
            
            // Marka - her zaman ekle (hem sol hem sağ kalın)
            vehicleTableData.push([
              { text: 'Marka', bold: true, fillColor: '#f9fafb' },
              { text: vehicleInfo?.marka || 'Belirtilmemiş', bold: true, color: '#000' }
            ]);
            
            // Model - her zaman ekle (hem sol hem sağ kalın)
            vehicleTableData.push([
              { text: 'Model', bold: true, fillColor: '#f9fafb' },
              { text: vehicleInfo?.model || 'Belirtilmemiş', bold: true, color: '#000' }
            ]);
            
            // Yıl - her zaman ekle (hem sol hem sağ kalın)
            vehicleTableData.push([
              { text: 'Yıl', bold: true, fillColor: '#f9fafb' },
              { text: vehicleInfo?.yil || 'Belirtilmemiş', bold: true, color: '#000' }
            ]);
            
            // KM - her zaman ekle (hem sol hem sağ kalın)
            const kmText = vehicleInfo?.km ? `${vehicleInfo.km} km` : 'Belirtilmemiş';
            vehicleTableData.push([
              { text: 'KM', bold: true, fillColor: '#f9fafb' },
              { text: kmText, bold: true, color: '#000' }
            ]);
            
            // Rapor No - her zaman ekle (hem sol hem sağ kalın)
            vehicleTableData.push([
              { text: 'Rapor No', bold: true, fillColor: '#f9fafb' },
              { text: reportNumber || 'Belirtilmemiş', bold: true, color: '#000' }
            ]);
            
            // Rapor tarihi - her zaman ekle (hem sol hem sağ kalın)
            const reportDate = new Date().toLocaleDateString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
            vehicleTableData.push([
              { text: 'Rapor tarihi', bold: true, fillColor: '#f9fafb' },
              { text: reportDate, bold: true, color: '#000' }
            ]);
            
            // Tabloyu ekle
            content.push({
              table: {
                headerRows: 0,
                widths: ['*', '*'],
                body: vehicleTableData
              },
              layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#e5e7eb',
                vLineColor: () => '#e5e7eb',
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 8,
                paddingBottom: () => 8
              },
              margin: [0, 0, 0, 20]
            });
            titleAdded = true; // Tablo eklendikten sonra işaretle
          } else {
            titleAdded = true; // Tablo eklenmese bile başlık eklendi
          }
        }
        j++;
      }
      i = j;
      continue;
    }

    // H1 başlık
    if (line.startsWith('# ')) {
      const text = line.replace(/^#\s+/, '').replace(/<[^>]+>/g, '').trim();
      content.push({
        text: text,
        fontSize: 16, // Küçültüldü (24 -> 16)
        bold: true,
        color: '#f97316',
        alignment: 'center',
        margin: [0, 15, 0, 10],
        noWrap: true // Tek satır olması için
      });
      // Başlığın hemen altına araç bilgileri tablosunu ekle (sadece ilk başlıkta)
      // TÜM alanlar her zaman görünecek, değerler "Belirtilmemiş" olsa bile
      if (!titleAdded) {
        const vehicleTableData: any[] = [];
        
        // Marka - her zaman ekle (hem sol hem sağ kalın)
        vehicleTableData.push([
          { text: 'Marka', bold: true, fillColor: '#f9fafb' },
          { text: vehicleInfo?.marka || 'Belirtilmemiş', bold: true, color: '#000' }
        ]);
        
        // Model - her zaman ekle (hem sol hem sağ kalın)
        vehicleTableData.push([
          { text: 'Model', bold: true, fillColor: '#f9fafb' },
          { text: vehicleInfo?.model || 'Belirtilmemiş', bold: true, color: '#000' }
        ]);
        
        // Yıl - her zaman ekle (hem sol hem sağ kalın)
        vehicleTableData.push([
          { text: 'Yıl', bold: true, fillColor: '#f9fafb' },
          { text: vehicleInfo?.yil || 'Belirtilmemiş', bold: true, color: '#000' }
        ]);
        
        // KM - her zaman ekle (hem sol hem sağ kalın)
        const kmText = vehicleInfo?.km ? `${vehicleInfo.km} km` : 'Belirtilmemiş';
        vehicleTableData.push([
          { text: 'KM', bold: true, fillColor: '#f9fafb' },
          { text: kmText, bold: true, color: '#000' }
        ]);
        
        // Rapor No - her zaman ekle (hem sol hem sağ kalın)
        vehicleTableData.push([
          { text: 'Rapor No', bold: true, fillColor: '#f9fafb' },
          { text: reportNumber || 'Belirtilmemiş', bold: true, color: '#000' }
        ]);
        
        // Rapor tarihi - her zaman ekle (hem sol hem sağ kalın)
        const reportDate = new Date().toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        vehicleTableData.push([
          { text: 'Rapor tarihi', bold: true, fillColor: '#f9fafb' },
          { text: reportDate, bold: true, color: '#000' }
        ]);
        
        // Tabloyu ekle
        content.push({
          table: {
            headerRows: 0,
            widths: ['*', '*'],
            body: vehicleTableData
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 8,
            paddingBottom: () => 8
          },
          margin: [0, 0, 0, 20]
        });
        titleAdded = true; // Tablo eklendikten sonra işaretle
      } else {
        titleAdded = true; // Tablo eklenmese bile başlık eklendi
      }
      continue;
    }

    // H2 başlık (örn: "2) Vaka Bilgileri ve Belirtiler")
    if (line.startsWith('## ')) {
      const text = line.replace(/^##\s+/, '').replace(/<[^>]+>/g, '').trim();
      content.push({
        text: text,
        fontSize: 14, // Biraz artırıldı (14 -> 15) daha kalın görünmesi için
        bold: true,
        color: '#f97316',
        margin: [0, 6, 0, 4] // Boşluklar azaltıldı (üst: 10->6, alt: 8->4)
      });
      continue;
    }

    // H3 başlık (örn: "2.1 Araç Bilgileri")
    if (line.startsWith('### ')) {
      const text = line.replace(/^###\s+/, '').replace(/<[^>]+>/g, '').trim();
      content.push({
        text: text,
        fontSize: 12, // Biraz artırıldı (daha kalın görünmesi için, bold ile birlikte)
        bold: true,
        color: '#f97316',
        margin: [0, 4, 0, 3] // Boşluklar azaltıldı (üst: 7->4, alt: 5->3)
      });
      continue;
    }

    // Tablo başlığı (bold olabilir veya olmayabilir)
    // Format: | **Alan** | **Değer** | veya | Alan | Değer |
    if (line.startsWith('|') && !line.includes('---') && line.split('|').length >= 3) {
      // Eğer zaten bir tablo içindeysek, önceki tabloyu kapat
      if (inTable && tableRows.length > 0 && tableHeaders.length > 0) {
        // Önceki tabloyu ekle
        const colCount = tableHeaders.length;
        const widths = colCount === 3 ? ['*', '*', '*'] : colCount === 2 ? ['*', '*'] : Array(colCount).fill('*');
        const tableBody = [
          tableHeaders.map(h => {
            const parsedH = parseBoldText(h);
            return { 
              text: parsedH.length === 1 && typeof parsedH[0] === 'string' ? parsedH[0] : parsedH, 
              bold: true, 
              fillColor: '#f9fafb' 
            };
          }),
          ...tableRows.map(row => row.map((cell: string) => {
            const parsedCell = parseBoldText(cell);
            return { 
              text: parsedCell.length === 1 && typeof parsedCell[0] === 'string' ? parsedCell[0] : parsedCell, 
              color: '#000' 
            };
          }))
        ];
        content.push({
          table: {
            headerRows: 1,
            widths: widths,
            body: tableBody
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 8,
            paddingBottom: () => 8
          },
          margin: [0, 10, 0, 15]
        });
        tableRows = [];
        tableHeaders = [];
      }
      // Yeni tablo başlığı
      inTable = true;
      // ** karakterlerini kaldırma, parseBoldText ile işleyeceğiz
      tableHeaders = line.split('|').map(c => c.trim().replace(/<strong>/g, '').replace(/<\/strong>/g, '')).filter(c => c);
      continue;
    }

    // Tablo ayırıcı (--- satırı)
    if (line.startsWith('|') && line.includes('---')) {
      continue;
    }

    // Tablo satırı
    if (inTable && line.startsWith('|') && line.split('|').length >= 3) {
      // ** karakterlerini kaldırma, parseBoldText ile işleyeceğiz
      const cells = line.split('|').map(c => c.trim().replace(/<strong>/g, '').replace(/<\/strong>/g, '')).filter(c => c);
      if (cells.length > 0) {
        tableRows.push(cells);
      }
      continue;
    }

    // Tablo bitişi (boş satır veya tablo olmayan bir satır geldiğinde)
    if (inTable && !line.startsWith('|') && line.trim() !== '') {
      if (tableRows.length > 0 && tableHeaders.length > 0) {
        // Tablo sütun sayısına göre genişlikleri ayarla
        const colCount = tableHeaders.length;
        const widths = colCount === 3 
          ? ['*', '*', '*'] 
          : colCount === 2 
          ? ['*', '*'] 
          : Array(colCount).fill('*');
        
        const tableBody = [
          tableHeaders.map(h => {
            const parsedH = parseBoldText(h);
            return { 
              text: parsedH.length === 1 && typeof parsedH[0] === 'string' ? parsedH[0] : parsedH, 
              bold: true, 
              fillColor: '#f9fafb' 
            };
          }),
          ...tableRows.map(row => row.map((cell: string) => {
            const parsedCell = parseBoldText(cell);
            return { 
              text: parsedCell.length === 1 && typeof parsedCell[0] === 'string' ? parsedCell[0] : parsedCell, 
              color: '#000' 
            };
          }))
        ];
        content.push({
          table: {
            headerRows: 1,
            widths: widths,
            body: tableBody
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 8,
            paddingBottom: () => 8
          },
          margin: [0, 10, 0, 15]
        });
      }
      inTable = false;
      tableRows = [];
      tableHeaders = [];
    }

    // Liste item
    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      const text = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/<[^>]+>/g, '').trim();
      // Son eleman bir liste değilse yeni liste oluştur
      const lastItem = content[content.length - 1];
      if (!lastItem || !lastItem.ul) {
        content.push({ ul: [] });
      }
      // Son elemana ekle - **text** formatını parse et
      const currentList = content[content.length - 1];
      if (currentList.ul) {
        const parsedText = parseBoldText(text);
        currentList.ul.push({
          text: parsedText.length === 1 && typeof parsedText[0] === 'string' ? parsedText[0] : parsedText,
          fontSize: 10,
          margin: [0, 2]
        });
      }
      continue;
    }

    // Normal paragraf - önce "Çapraz Delinme:" gibi başlıkları kontrol et
    const cleanText = line.replace(/<[^>]+>/g, '').trim();
    if (cleanText) {
      // "Çapraz Delinme:" gibi başlıkları kalın ve turuncu yap
      const boldOrangePattern = /^([^:]+):\s*(.+)?$/;
      const boldOrangeMatch = cleanText.match(boldOrangePattern);
      
      if (boldOrangeMatch && boldOrangeMatch[1] && boldOrangeMatch[1].length < 50 && !boldOrangeMatch[1].includes('|')) {
        // Başlık kısmı (kalın ve turuncu)
        const headerText = boldOrangeMatch[1].trim();
        const contentText = boldOrangeMatch[2] ? boldOrangeMatch[2].trim() : '';
        
        if (contentText) {
          // Başlık + içerik (içerikte **text** formatını parse et)
          const parsedContent = parseBoldText(contentText);
          content.push({
            text: [
              { text: `${headerText}: `, bold: true, color: '#f97316', fontSize: 12 },
              ...parsedContent
            ],
            margin: [0, 5]
          });
        } else {
          // Sadece başlık
          content.push({
            text: `${headerText}:`,
            fontSize: 10,
            bold: true,
            color: '#f97316',
            margin: [0, 5]
          });
        }
        continue;
      }
      
      // Normal paragraf - **text** formatını parse et
      const parsedText = parseBoldText(cleanText);
      if (parsedText.length === 1 && typeof parsedText[0] === 'string') {
        // Tek bir string ise direkt ekle
        content.push({
          text: parsedText[0],
          fontSize: 10,
          margin: [0, 5]
        });
      } else {
        // Array ise (bold kısımlar var)
        content.push({
          text: parsedText,
          fontSize: 10,
          margin: [0, 5]
        });
      }
    }
  }

  // Son tablo varsa ekle
  if (inTable && tableRows.length > 0 && tableHeaders.length > 0) {
    const colCount = tableHeaders.length;
    const widths = colCount === 3 
      ? ['*', '*', '*'] 
      : colCount === 2 
      ? ['*', '*'] 
      : Array(colCount).fill('*');
    
    const tableBody = [
      tableHeaders.map(h => {
        const parsedH = parseBoldText(h);
        return { 
          text: parsedH.length === 1 && typeof parsedH[0] === 'string' ? parsedH[0] : parsedH, 
          bold: true, 
          fillColor: '#f9fafb' 
        };
      }),
      ...tableRows.map(row => row.map((cell: string) => {
        const parsedCell = parseBoldText(cell);
        return { 
          text: parsedCell.length === 1 && typeof parsedCell[0] === 'string' ? parsedCell[0] : parsedCell, 
          color: '#000' 
        };
      }))
    ];
    content.push({
      table: {
        headerRows: 1,
        widths: widths,
        body: tableBody
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 8,
        paddingBottom: () => 8
      },
      margin: [0, 10, 0, 15]
    });
  }

  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: content,
    defaultStyle: {
      font: 'Poppins', // Poppins font kullan (frontend'de tanımlı)
      fontSize: 10, // Genel font size küçültüldü (12 -> 10)
      lineHeight: 1.5
    }
    // NOT: Font tanımları frontend'de yapılacak (vfs_fonts ile)
    // Poppins font'u frontend'de vfs'ye eklenecek
  };
}

// KRİTİK: Vercel serverless için Node.js runtime belirt (Edge runtime değil!)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// NOT: Puppeteer/Chromium kaldırıldı - Client-side PDF generation kullanılıyor (pdfmake)
// Bu sayede Chromium başlatma sorunları tamamen çözüldü

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chat_id = body?.chat_id as string | undefined;
    const user_id = body?.user_id as string | undefined;

    // Production kontrolü (bir kere tanımla)
    const isVercel = process.env.VERCEL === '1';
    const isProduction = isVercel || process.env.NODE_ENV === 'production';

    if (!isProduction) {
      logger.debug("[PDF] Request body", { chat_id, user_id });
    }

    if (!chat_id || !user_id) {
      return NextResponse.json(
        { error: "chat_id ve user_id zorunlu" },
        { status: 400 }
      );
    }

    // Rate limiting (PDF generation ağır işlem)
    const rateLimitCheck = rateLimiter.check(user_id, 'pdf');
    if (!rateLimitCheck.allowed) {
      logger.warn('POST /api/chat/pdf - Rate limit exceeded', { user_id, chat_id });
      return NextResponse.json(
        { 
          error: "Çok fazla PDF oluşturma isteği gönderdiniz. Lütfen bir süre bekleyin.",
          retryAfter: Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitCheck.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimitCheck.remaining),
            'X-RateLimit-Reset': String(rateLimitCheck.resetAt)
          }
        }
      );
    }

    // Concurrent request limiter (PDF generation memory-intensive)
    // Not: Şimdilik direkt devam ediyoruz, requestLimiter wrapper'ı sonra eklenebilir
    // await requestLimiter.execute(`pdf:${user_id}`, async () => { ... });

    // 1️⃣ Chat mesajlarını çek (soft delete'li mesajları atla)
    // NOT: Firestore'da deleted field'ı undefined olan mesajlar != true sorgusu ile gelmiyor
    // Bu yüzden önce tüm mesajları çekip sonra filtreleyeceğiz
    const messagesSnap = await db
      .collection("messages")
      .where("chat_id", "==", chat_id)
      .where("user_id", "==", user_id)
      .orderBy("created_at", "asc")
      .get();

    if (!isProduction) {
      logger.debug("[PDF] Firestore'dan dönen mesaj sayısı", { count: messagesSnap.docs.length });
    }

    // Mesajları formatla (sadece user ve AI mesajları, welcome message'ı atla)
    let hasMediaAnalysis = false; // SADECE ses/video analizi var mı? (görsel analizi değil!)

    // NOT: Firestore'da deleted field'ı undefined olan mesajlar != true sorgusu ile gelmiyor
    // Bu yüzden önce tüm mesajları çekip sonra JavaScript'te filtreliyoruz
    const chatMessages = messagesSnap.docs
      .filter((doc) => {
        const data = doc.data();
        // deleted field'ı true olan mesajları atla (undefined veya false olanlar geçer)
        return data.deleted !== true;
      })
      .map((doc) => {
        const data = doc.data();
        const content = data.content || "";

        // Welcome message'ı atla
        if (content.includes("Merhaba! Ben NesiVarUsta Analiz Asistanı") && data.sender === "model") {
          return null;
        }

        // KRİTİK: Sadece video veya audio analizi varsa "Ses Analiz Raporu" oluştur
        // Görsel analizi (image) için "Yüzdelik Arıza Aksiyon Raporu" oluştur
        if (data.has_media === true && (data.media_type === "video" || data.media_type === "audio")) {
          hasMediaAnalysis = true;
        }

        // Mesaj içeriğinde gerçek ses/video analizi belirtileri var mı? (görsel analizi değil!)
        const contentLower = content.toLowerCase();
        // "ses kaydı", "video kaydı", "duyduğun", "dinlediğin" gibi ifadeler
        // Ama "görüntü", "gördüğün", "fotoğraf" gibi ifadeler görsel analizi, ses analizi değil!
        if ((contentLower.includes("ses kaydı") || contentLower.includes("video kaydı") ||
          contentLower.includes("duyduğun") || contentLower.includes("dinlediğin") ||
          contentLower.includes("ses analizi") || contentLower.includes("video analizi")) &&
          !contentLower.includes("görüntü") && !contentLower.includes("fotoğraf") && !contentLower.includes("gördüğün")) {
          hasMediaAnalysis = true;
        }

        return {
          sender: data.sender === "user" ? "Kullanıcı" : "NesiVarUsta Analiz Asistanı",
          content: content,
          timestamp: data.created_at?.toDate() || new Date(),
          isUser: data.sender === "user",
          hasMedia: data.has_media === true,
          mediaType: data.media_type || null,
        };
      })
      .filter((msg) => msg !== null) as Array<{
        sender: string;
        content: string;
        timestamp: Date;
        isUser: boolean;
        hasMedia?: boolean;
        mediaType?: string | null;
      }>;

    if (!isProduction) {
      logger.debug("[PDF] Filtreleme sonrası chatMessages.length", { count: chatMessages.length });
    }

    // 0️⃣ Mesaj kontrolü (filtreleme sonrası)
    if (chatMessages.length === 0) {
      return NextResponse.json(
        { error: "Bu chat'te mesaj bulunamadı veya tüm mesajlar silinmiş" },
        { status: 404 }
      );
    }

    // 1️⃣ Minimum mesaj sayısı kontrolü (en az 6 mesaj)
    if (chatMessages.length < 6) {
      return NextResponse.json(
        { error: "PDF raporu oluşturmak için en az 6 mesaj gereklidir" },
        { status: 400 }
      );
    }

    // 2️⃣ En az 2 kullanıcı mesajı ve 2 AI mesajı olmalı
    const userMessages = chatMessages.filter((msg) => msg.isUser);
    const aiMessages = chatMessages.filter((msg) => !msg.isUser);

    if (userMessages.length < 2 || aiMessages.length < 2) {
      return NextResponse.json(
        { error: "PDF raporu oluşturmak için en az 2 kullanıcı mesajı ve 2 AI mesajı gereklidir" },
        { status: 400 }
      );
    }

    // 3️⃣ AI'nin teşhis yapmış olması kontrolü (opsiyonel - sadece uyarı)
    const hasDiagnosis = aiMessages.some((msg) => {
      const content = msg.content.toLowerCase();

      // ❌ SORU İÇEREN MESAJLARI FİLTRELE (teşhis değil)
      const isQuestionOnly =
        /(\?|soru|nedir|ne|hangi|kaç|nasıl|neden\s+soruyor|bilgi\s+eksik|verin|lütfen\s+şu\s+bilgileri)/i.test(content) &&
        !/(teşhis|neden|sebep|olası|muhtemel|çözüm|öneri|yapılmalı|değiştir|tamir)/i.test(content);

      if (isQuestionOnly) return false; // Sadece soru soran mesajlar teşhis değil

      // ✅ GERÇEK TEŞHİS KONTROLLERİ
      // 1. Numaralı liste + teşhis kelimeleri (1. Neden: ... gibi)
      const hasNumberedDiagnosis = /\d+\.\s+.*(?:neden|sebep|olası|muhtemel|teşhis|problem|arıza)/i.test(content);

      // 2. Teşhis kelimeleri + çözüm önerisi
      const hasDiagnosisWithSolution =
        /(?:neden|sebep|olası|muhtemel|teşhis|problem|arıza|tahmin)/i.test(content) &&
        /(?:çözüm|öneri|yapılmalı|değiştir|tamir|kontrol|bakım)/i.test(content);

      // 3. Markdown bold ile sebepler (**Neden:** gibi)
      const hasBoldCauses = /\*\*.*(?:neden|sebep|olası|muhtemel)\*\*/i.test(content);

      // 4. "Şu nedenlerden biri olabilir" gibi açık teşhis ifadeleri
      const hasExplicitDiagnosis =
        /(?:şu\s+nedenlerden|olası\s+nedenler|muhtemel\s+sebepler|teşhis|tanı)/i.test(content);

      // 5. Numaralı liste + açıklama (sadece soru değil, açıklama var)
      const hasNumberedListWithExplanation =
        /\d+\.\s+[^?]+\s+[^?]+/i.test(content) && // En az 2 kelime, soru işareti yok
        !content.includes("?");

      return hasNumberedDiagnosis || hasDiagnosisWithSolution || hasBoldCauses ||
        hasExplicitDiagnosis || hasNumberedListWithExplanation;
    });

    // Teşhis yoksa uyarı ekle (ama devam et)
    if (!hasDiagnosis) {
      logger.warn("PDF oluşturuluyor ancak AI henüz teşhis yapmamış görünüyor", { chat_id, user_id });
    }

    // 2️⃣ Chat mesajlarından araç bilgilerini çıkar (Marka, Model, Yıl, KM) - AI model ile
    const allUserMessages = userMessages.map(msg => msg.content);

    // Güncel yılı al
    const currentYear = new Date().getFullYear();

    // AI model'e prompt gönder
    const prompt = `Kullanıcının mesajlarından araç bilgilerini çıkar ve SADECE JSON formatında döndür.

TALİMATLAR:
- MARKA: Araç üreticisi (Audi, BMW, Mercedes, Hyundai, Toyota, vb.)
- MODEL: Markaya ait model adı/numarası (A4, 3 Serisi, C200, i10, Corolla, vb.)
- YIL: Araç üretim yılı (1985-${currentYear} arası) - Sadece 4 haneli yıl sayısı
  * KRİTİK: 1985'ten önceki veya ${currentYear}'den sonraki yılları ASLA çıkarma, boş bırak
  * 1985'ten önceki ve gelecek yıllar analiz için uygun değil
- KM: Araç kilometresi (50000, 120000, vb.) - Sadece sayı, "km" yazma

ÖNEMLİ:
- Bilgiler dağınık olabilir, tüm mesajları dikkatlice oku
- "hyundai gec duruyo" gibi mesajlarda "hyundai" marka olabilir
- "2018 model" veya "2020'de aldım" gibi ifadelerde yıl var
- 1985'ten önceki veya ${currentYear}'den sonraki yıl görürsen YIL alanını boş bırak
- Emin değilsen alanı boş bırak
- SADECE JSON döndür, başka açıklama yapma

ÖRNEKLER:
"audi a6 virajda titreme" → {"marka": "Audi", "model": "A6", "yil": "", "km": ""}
"bmw 320d 2015 150000 km" → {"marka": "BMW", "model": "320d", "yil": "2015", "km": "150000"}
"hyundai gec duruyo" → {"marka": "Hyundai", "model": "", "yil": "", "km": ""}

Kullanıcı mesajları:
${allUserMessages.join(" ")}

JSON (sadece bu formatı döndür):
{
  "marka": "",
  "model": "",
  "yil": "",
  "km": ""
}`;

    const vehicleExtractModel = "xiaomi/mimo-v2-flash:free"; // Chat için kullanılan model

    const vehicleExtractMessages = [
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    if (!isProduction) {
      logger.debug("[PDF] AI model'e araç bilgileri çıkarma isteği gönderiliyor", { chat_id, user_id });
    }
    const vehicleInfoResult = await callOpenRouter(vehicleExtractModel, vehicleExtractMessages, {
      max_tokens: 200,
      temperature: 0.3, // Düşük temperature - daha tutarlı JSON çıktısı için
      maxRetries: 5, // PDF için daha fazla retry (kritik)
    });

    let responseText = vehicleInfoResult.content.trim();

    // JSON'u parse et
    let vehicleInfo = {
      marka: "",
      model: "",
      yil: "",
      km: ""
    };

    try {
      // JSON bloğunu bul (```json ... ``` veya sadece { ... })
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        vehicleInfo = {
          marka: parsed.marka || "",
          model: parsed.model || "",
          yil: parsed.yil || "",
          km: parsed.km || ""
        };
      } else {
        // Direkt JSON parse dene
        const parsed = JSON.parse(responseText);
        vehicleInfo = {
          marka: parsed.marka || "",
          model: parsed.model || "",
          yil: parsed.yil || "",
          km: parsed.km || ""
        };
      }
    } catch (parseError) {
      logger.error("[PDF] JSON parse hatası", parseError as Error, { 
        chat_id, 
        user_id,
        responseText: responseText.substring(0, 500) // İlk 500 karakter
      });
      // Parse hatası olsa bile boş obje ile devam et
    }

    // 1985'ten önceki ve gelecek yılları kontrol et ve boş bırak
    if (vehicleInfo.yil) {
      const yilNum = parseInt(vehicleInfo.yil);
      const currentYear = new Date().getFullYear();
      if (!isNaN(yilNum) && (yilNum < 1985 || yilNum > currentYear)) {
        logger.debug(`[PDF] Geçersiz yıl tespit edildi: ${yilNum} (1985-${currentYear} arası olmalı), boş bırakılıyor`, { 
          yil: yilNum, 
          chat_id, 
          user_id 
        });
        vehicleInfo.yil = "";
      }
    }

    if (!isProduction) {
      logger.debug("[PDF] AI'dan çıkarılan araç bilgileri", { vehicleInfo, chat_id, user_id });
    }

    // 3️⃣ Chat özetini oluştur (OpenRouter'a gönderilecek)
    const chatSummary = chatMessages
      .map((msg) => `${msg.sender}: ${msg.content}`)
      .join("\n\n");

    // 4️⃣ OpenRouter'a PDF raporu oluşturması için prompt gönder
    const vehicleInfoText = [
      vehicleInfo.marka ? `Marka: ${vehicleInfo.marka}` : "",
      vehicleInfo.model ? `Model: ${vehicleInfo.model}` : "",
      vehicleInfo.yil ? `Yıl: ${vehicleInfo.yil}` : "",
      vehicleInfo.km ? `Kilometre: ${vehicleInfo.km} km` : ""
    ].filter(Boolean).join(", ");

    // Rapor tipini belirle: 
    // - SADECE gerçek ses/video analizi varsa "Ses Analiz Raporu" 
    // - Görsel analizi veya sadece yazışma varsa "Yüzdelik Arıza Aksiyon Raporu"
    const reportType = hasMediaAnalysis ? "ses_analiz" : "yuzdelik_aksiyon";

    if (!isProduction) {
      logger.debug("[PDF] Rapor tipi belirlendi", { reportType, hasMediaAnalysis, chat_id, user_id });
    }

    // Rapor numarası oluştur
    const reportNumber = `NVU-${vehicleInfo.marka?.substring(0, 3).toUpperCase() || "GEN"}-${vehicleInfo.model?.substring(0, 3).toUpperCase() || "XXX"}-${reportType === "ses_analiz" ? "SES" : "YAP"}-${new Date().toISOString().split("T")[0].replace(/-/g, "")}`;

    // İki farklı prompt: Ses Analiz veya Yüzdelik Aksiyon
    const pdfPrompt = reportType === "ses_analiz"
      ? getSesAnalizPrompt(vehicleInfo, vehicleInfoText, reportNumber, chatSummary)
      : getYuzdelikAksiyonPrompt(vehicleInfo, vehicleInfoText, reportNumber, chatSummary);

    // OpenRouter ile PDF raporu oluştur (chat için kullanılan text-only model)
    const pdfModel = "xiaomi/mimo-v2-flash:free"; // Chat için kullanılan model

    const pdfMessages = [
      {
        role: "user" as const,
        content: pdfPrompt,
      },
    ];

    if (!isProduction) {
      logger.debug("[PDF] OpenRouter'a PDF raporu oluşturma isteği gönderiliyor", { chat_id, user_id });
    }
    const result = await callOpenRouter(pdfModel, pdfMessages, {
      max_tokens: 4000, // PDF raporları uzun olabilir
      temperature: 0.7,
      maxRetries: 5, // PDF için daha fazla retry (kritik)
    });

    let pdfMarkdown = result.content.trim();

    // YAZIM HATALARINI DÜZELT
    const spellingFixes: { [key: string]: string } = {
      "arika": "arıza",
      "teshis": "teşhis",
      "egzos": "egzoz",
      "egzozs": "egzoz",
      "kontol": "kontrol",
      "kontroll": "kontrol",
      "muayene": "muayene", // Doğru
      "muayane": "muayene",
      "Aşınanma": "Aşınma",
      "Aşınanması": "Aşınması",
      "Aşınanmasına": "Aşınmasına",
    };

    // Yaygın yazım hatalarını düzelt
    for (const [wrong, correct] of Object.entries(spellingFixes)) {
      // Kelime sınırları ile değiştir (tam kelime eşleşmesi)
      const regex = new RegExp(`\\b${wrong}\\b`, "gi");
      pdfMarkdown = pdfMarkdown.replace(regex, correct);
    }

    // Başlıkların sonundaki ** işaretlerini kaldır
    // Örnek: "## 7) Önceliklendirilmiş İş Listesi**" -> "## 7) Önceliklendirilmiş İş Listesi"
    pdfMarkdown = pdfMarkdown.replace(/(#{1,6}\s+[^\n]+)\*\*/g, '$1');

    // PDF markdown'dan özet çıkar (ilk 500 karakter)
    const analysisSummary = pdfMarkdown
      .replace(/#{1,6}\s+/g, "") // Başlıkları kaldır
      .replace(/\*\*/g, "") // Bold işaretlerini kaldır
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Linkleri kaldır
      .substring(0, 500)
      .trim();

    // PDF markdown'dan possible_causes ve recommended_actions çıkar
    const possibleCauses: string[] = [];
    const recommendedActions: string[] = [];

    // "Olası Kaynaklar" veya "Olasılıkların Gerekçeli Açıklaması" bölümünden nedenleri çıkar
    const causesMatch = pdfMarkdown.match(/(?:Olası Kaynaklar|Olasılıkların Gerekçeli Açıklaması|Olası arıza grubu)[\s\S]*?(?=##|$)/i);
    if (causesMatch) {
      const causesText = causesMatch[0];
      const causeItems = causesText.match(/\d+\.\s+([^\n]+)|###\s+([^\n]+)/g);
      if (causeItems) {
        causeItems.forEach((item: string) => {
          const cleanItem = item.replace(/^\d+\.\s+|^###\s+/, "").trim();
          if (cleanItem && cleanItem.length > 10) {
            possibleCauses.push(cleanItem);
          }
        });
      }
    }

    // "Önceliklendirilmiş İş Listesi" veya "Serviste Doğrulama" bölümünden aksiyonları çıkar
    const actionsMatch = pdfMarkdown.match(/(?:Önceliklendirilmiş İş Listesi|Serviste Doğrulama|Kullanıcının Kendi Başına Yapabileceği Kontroller)[\s\S]*?(?=##|$)/i);
    if (actionsMatch) {
      const actionsText = actionsMatch[0];
      const actionItems = actionsText.match(/\d+\.\s+([^\n]+)|-\s+([^\n]+)/g);
      if (actionItems) {
        actionItems.forEach((item: string) => {
          const cleanItem = item.replace(/^\d+\.\s+|^-\s+/, "").trim();
          if (cleanItem && cleanItem.length > 10) {
            recommendedActions.push(cleanItem);
          }
        });
      }
    }

    // Risk level'i belirle (PDF'de "Acil" veya "Yüksek" gibi kelimeler varsa)
    let riskLevel = "";
    const riskKeywords = {
      "yüksek": "high",
      "orta": "medium",
      "düşük": "low",
      "acil": "urgent"
    };
    const pdfLower = pdfMarkdown.toLowerCase();
    for (const [tr, en] of Object.entries(riskKeywords)) {
      if (pdfLower.includes(tr)) {
        riskLevel = en;
        break;
      }
    }

    // Used media types
    const usedMediaTypes: string[] = [];
    if (hasMediaAnalysis) {
      const mediaMessages = chatMessages.filter(msg => msg.hasMedia);
      mediaMessages.forEach(msg => {
        if (msg.mediaType === "video" && !usedMediaTypes.includes("video")) {
          usedMediaTypes.push("video");
        } else if (msg.mediaType === "image" && !usedMediaTypes.includes("image")) {
          usedMediaTypes.push("image");
        }
      });
    }

    // 4️⃣ Firestore'a PDF'i kaydet (tüm alanlarla)
    const reportRef = db.collection("reports").doc();
    await reportRef.set({
      // Temel bilgiler
      chat_id,
      user_id,
      report_id: reportNumber,
      report_type: reportType, // "ses_analiz" veya "yuzdelik_aksiyon"

      // PDF içeriği
      pdf_markdown: pdfMarkdown,
      pdf_url: "", // Şimdilik boş, sonra eklenebilir

      // Analiz özeti
      analysis_summary: analysisSummary || "",

      // Teşhis bilgileri
      possible_causes: possibleCauses.length > 0 ? possibleCauses : [],
      recommended_actions: recommendedActions.length > 0 ? recommendedActions : [],
      confidence_score: hasDiagnosis ? 0.7 : 0.5, // Teşhis varsa daha yüksek
      risk_level: riskLevel || "",

      // Maliyet (şimdilik 0, PDF'den çıkarılabilir)
      estimated_cost_min: 0,
      estimated_cost_max: 0,
      currency: "TRY",

      // Media bilgisi
      used_media_types: usedMediaTypes,

      // Araç bilgileri
      vehicle: {
        make: vehicleInfo.marka || "",
        model: vehicleInfo.model || "",
        year: vehicleInfo.yil ? parseInt(vehicleInfo.yil) || 0 : 0,
        mileage_km: vehicleInfo.km ? parseInt(vehicleInfo.km.replace(/\s/g, "")) || 0 : 0,
        fuel: "", // Chat'ten çıkarılabilir, şimdilik boş
        engine: "", // Chat'ten çıkarılabilir, şimdilik boş
        transmission: "", // Chat'ten çıkarılabilir, şimdilik boş
        vin: "", // Chat'ten çıkarılabilir, şimdilik boş
        plate_country: "", // Chat'ten çıkarılabilir, şimdilik boş
        detected_by_ai: true,
        confidence_score: vehicleInfo.marka && vehicleInfo.model ? 0.8 : 0.5,
        version: 1,
      },

      // Metadata
      generated_by: "xiaomi/mimo-v2-flash:free",
      is_final: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      pdf_generated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5️⃣ Logo'yu base64'e çevir
    let logoBase64 = '';
    try {
      const rootPath = process.cwd();
      const logoPath = path.join(rootPath, 'public', 'logo.jpeg');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (err) {
      logger.warn('[PDF] Logo yüklenemedi', err instanceof Error ? err : new Error(String(err)), { chat_id, user_id });
    }

    // 6️⃣ Markdown'daki tablodan araç bilgilerini çıkar ve vehicleInfo'yu güncelle
    // AI markdown'da tablo oluşturmuşsa, oradan bilgileri al (daha güvenilir)
    if (pdfMarkdown) {
      // Markdown'daki ilk tabloyu bul (araç bilgileri tablosu)
      const tableLines = pdfMarkdown.split('\n');
      let inInfoTable = false;
      let foundMarka = false, foundModel = false, foundKm = false;
      
      for (let i = 0; i < tableLines.length; i++) {
        const line = tableLines[i].trim();
        
        // Tablo başlığı bul (Alan | Değer)
        if (line.includes('**Alan**') && line.includes('**Değer**')) {
          inInfoTable = true;
          continue;
        }
        
        // Tablo ayırıcı
        if (inInfoTable && line.includes('---')) {
          continue;
        }
        
        // Tablo satırlarını parse et
        if (inInfoTable && line.startsWith('|')) {
          const cells = line.split('|').map(c => c.trim()).filter(c => c);
          if (cells.length >= 2) {
            const label = cells[0].replace(/\*\*/g, '').replace(/<strong>/g, '').replace(/<\/strong>/g, '').trim();
            const value = cells[1].replace(/\*\*/g, '').replace(/<strong>/g, '').replace(/<\/strong>/g, '').trim();
            
            // Marka bul
            if ((label.includes('Marka') || label.includes('Araç')) && !foundMarka && value && value !== 'Belirtilmemiş') {
              // "Audi A6 (2020)" formatından marka çıkar
              const markaMatch = value.match(/^([A-Za-z]+)/);
              if (markaMatch && !vehicleInfo.marka) {
                vehicleInfo.marka = markaMatch[1];
                foundMarka = true;
              }
            }
            
            // Model bul
            if ((label.includes('Model') || (label.includes('Araç') && value.includes(' '))) && !foundModel && value && value !== 'Belirtilmemiş') {
              // "Audi A6 (2020)" formatından model çıkar
              const modelMatch = value.match(/^[A-Za-z]+\s+([A-Za-z0-9]+)/);
              if (modelMatch && !vehicleInfo.model) {
                vehicleInfo.model = modelMatch[1];
                foundModel = true;
              }
            }
            
            // KM bul
            if ((label.includes('KM') || label.includes('Kilometre')) && !foundKm && value && value !== 'Belirtilmemiş') {
              const kmValue = value.replace(/\s*km\s*/gi, '').trim();
              if (kmValue && !vehicleInfo.km) {
                vehicleInfo.km = kmValue;
                foundKm = true;
              }
            }
          }
          
          // Tablo bitti (başka bir başlık geldi)
          if (line.startsWith('##') || line.startsWith('#')) {
            inInfoTable = false;
            break;
          }
        }
        
        // Tablo dışına çıktık
        if (inInfoTable && !line.startsWith('|') && line.trim() !== '') {
          inInfoTable = false;
        }
      }
      
      if (!isProduction) {
        logger.debug("[PDF] Markdown'dan çıkarılan güncellenmiş vehicleInfo", { vehicleInfo, chat_id, user_id });
      }
    }

    // 7️⃣ Markdown'ı pdfmake formatına çevir (basit parser)
    const pdfmakeContent = parseMarkdownToPdfmake(pdfMarkdown, logoBase64, vehicleInfo, reportNumber);

    if (!isProduction) {
      logger.debug('[PDF] pdfmake formatına çevrildi, frontend\'e gönderiliyor', { chat_id, user_id });
    }

    // pdfmake document definition + metadata'yı JSON olarak döndür
    return NextResponse.json({
      pdfmake: pdfmakeContent,
      reportNumber: reportNumber,
      vehicleInfo: vehicleInfo,
    });
  } catch (err: any) {
    logger.error("PDF error", err instanceof Error ? err : new Error(String(err)), { 
      chat_id: req.body?.chat_id || 'unknown',
      user_id: req.body?.user_id || 'unknown'
    });
    return NextResponse.json(
      { error: err.message || "PDF oluşturulamadı" },
      { status: 500 }
    );
  }
}

