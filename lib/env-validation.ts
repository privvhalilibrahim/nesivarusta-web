/**
 * Environment Variables Validation
 * Tüm gerekli environment variable'ları kontrol eder
 */

export function validateEnv() {
  const errors: string[] = [];

  // OpenRouter API Key
  if (!process.env.OPENROUTER_API_KEY) {
    errors.push("OPENROUTER_API_KEY is required");
  }

  // Gemini API Key
  if (!process.env.GEMINI_API_KEY) {
    errors.push("GEMINI_API_KEY is required");
  }

  // Firebase Service Account Key
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    errors.push("FIREBASE_SERVICE_ACCOUNT_KEY is required");
  } else {
    // JSON formatını kontrol et
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      errors.push("FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON");
    }
  }

  // Firebase Public Config (Client-side)
  const requiredFirebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  for (const varName of requiredFirebaseVars) {
    if (!process.env[varName]) {
      errors.push(`${varName} is required`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Missing or invalid environment variables:\n${errors.join('\n')}`);
  }
}

/**
 * Safe API Key getter - throws error if missing
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
