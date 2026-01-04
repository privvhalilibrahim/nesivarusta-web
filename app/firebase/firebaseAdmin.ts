import admin from "firebase-admin"

if (!admin.apps.length) {
  // Environment variable'dan service account bilgilerini al
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set");
  }

  let serviceAccount: admin.ServiceAccount;
  try {
    // JSON string'i parse et
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore()
