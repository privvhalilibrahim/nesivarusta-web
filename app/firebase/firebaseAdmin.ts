import admin from "firebase-admin"

let dbInstance: admin.firestore.Firestore | null = null;

function isBuildTime(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build" || 
         process.env.NEXT_PHASE === "phase-development-build";
}

function getServiceAccount(): admin.ServiceAccount {
  // Önce environment variable'ı kontrol et (Vercel/Production için)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountJson) {
    try {
      return JSON.parse(serviceAccountJson);
    } catch (error) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
    }
  }
  
  // Environment variable yoksa local dosyayı kullan (Development için)
  // Build zamanında dosya yoksa hata verme (Vercel'de dosya olmayacak)
  if (isBuildTime()) {
    // Build zamanında environment variable yoksa hata ver
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY must be set for production builds");
  }
  
  try {
    // Dynamic require - sadece runtime'da çalışır
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const serviceAccount = require("./serviceAccountKey.json");
    return serviceAccount as admin.ServiceAccount;
  } catch (error: any) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set and serviceAccountKey.json file not found");
  }
}

function initializeFirebase() {
  if (!admin.apps.length) {
    const serviceAccount = getServiceAccount();
    
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
