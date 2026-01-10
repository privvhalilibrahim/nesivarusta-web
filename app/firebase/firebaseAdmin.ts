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
  // fs.readFileSync kullanarak Webpack bundling sorunlarını önliyoruz
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs");
    const serviceAccountPath = path.join(process.cwd(), "app", "firebase", "serviceAccountKey.json");
    
    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(serviceAccountPath)) {
      console.error(`Firebase service account file not found at: ${serviceAccountPath}`);
      console.error("Please ensure serviceAccountKey.json exists in app/firebase/ directory");
      return null;
    }
    
    // Dosyayı oku ve JSON parse et (require yerine fs.readFileSync kullan)
    const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
    const serviceAccount = JSON.parse(fileContent);
    return serviceAccount as admin.ServiceAccount;
  } catch (error: any) {
    // Dosya yoksa veya okunamazsa null döndür, runtime'da hata verecek
    console.error("Error loading serviceAccountKey.json:", error.message);
    return null;
  }
}

function initializeFirebase() {
  if (!admin.apps.length) {
    const serviceAccount = getServiceAccount();
    
    if (!serviceAccount) {
      const isDev = process.env.NODE_ENV === "development";
      const errorMessage = isDev
        ? "Firebase initialization failed. Please ensure either:\n" +
          "1. FIREBASE_SERVICE_ACCOUNT_KEY environment variable is set in .env.local, OR\n" +
          "2. serviceAccountKey.json file exists in app/firebase/ directory"
        : "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required for production";
      throw new Error(errorMessage);
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
