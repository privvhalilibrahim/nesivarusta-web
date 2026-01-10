import admin from "firebase-admin"

let dbInstance: admin.firestore.Firestore | null = null;

function isBuildTime(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build" || 
         process.env.NEXT_PHASE === "phase-development-build";
}

function getServiceAccount(): admin.ServiceAccount | null {
  // Önce environment variable'ı kontrol et (Vercel/Production için)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson);
    } catch (error) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
    }
  }
  
  // Build zamanında environment variable yoksa null döndür (hata verme)
  // Build zamanında local dosyayı require etme (webpack hatası vermesin)
  if (isBuildTime()) {
    return null;
  }
  
  // Development için local dosyayı kullan (sadece runtime'da)
  // Build zamanında buraya gelmeyecek çünkü yukarıda return ediyoruz
  // Webpack'in build zamanında bu dosyayı analiz etmemesi için
  // require'ı bir string olarak saklayıp runtime'da çağırıyoruz
  try {
    // Dynamic require - sadece runtime'da çalışır
    // Webpack build zamanında bu satırı analiz edecek ama dosya yoksa hata vermeyecek
    // çünkü try-catch içinde ve build zamanında buraya gelmeyecek
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccountPath = "./serviceAccountKey.json";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require(serviceAccountPath);
    return serviceAccount as admin.ServiceAccount;
  } catch (error: any) {
    // Dosya yoksa null döndür, runtime'da hata verecek
    return null;
  }
}

function initializeFirebase() {
  if (!admin.apps.length) {
    const serviceAccount = getServiceAccount();
    
    if (!serviceAccount) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

// Lazy initialization - sadece kullanıldığında initialize et
function getDb() {
  if (!dbInstance) {
    // Build zamanında environment variable yoksa hata verme
    if (isBuildTime() && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Build zamanında - sadece uyarı ver, runtime'da hata verecek
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set during build - will be required at runtime");
      // Dummy instance döndür (build tamamlanması için)
      dbInstance = {} as any;
    } else {
      initializeFirebase();
      dbInstance = admin.firestore();
    }
  }
  return dbInstance;
}

// Backward compatibility için db export'u - lazy getter
export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const db = getDb();
    // Build zamanında dummy instance ise runtime'da hata verecek
    if (!db || typeof (db as any).collection !== "function") {
      throw new Error("Firebase is not initialized. FIREBASE_SERVICE_ACCOUNT_KEY must be set at runtime.");
    }
    return db[prop as keyof admin.firestore.Firestore];
  }
});
