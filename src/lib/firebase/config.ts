/**
 * Firebase設定
 * 環境変数からFirebase設定を読み込み
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Firebase設定を環境変数から取得
 */
export function getFirebaseConfig(): FirebaseConfig {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // 必須設定のバリデーション
  const requiredFields = Object.entries(config).filter(([_, value]) => !value);
  if (requiredFields.length > 0) {
    const missingFields = requiredFields.map(([key]) => key).join(', ');
    throw new Error(
      `Firebase設定が不完全です。以下の環境変数を設定してください: ${missingFields}`
    );
  }

  return config;
}

/**
 * Firebase設定が有効かチェック
 */
export function isFirebaseConfigured(): boolean {
  try {
    getFirebaseConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * 開発環境用のデフォルト設定
 */
export const developmentConfig: FirebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:demo',
};