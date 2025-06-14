/**
 * Firebase状態管理ストア
 * Svelte5 runesを使用したFirebaseの初期化状態管理
 */

import { initializeFirebase, isFirebaseConfigured } from '../firebase';

// Firebase初期化状態（モジュール内でのみ管理）
let firebaseInitialized = $state(false);
let firebaseError = $state<string | null>(null);
let firebaseLoading = $state(false);

/**
 * Firebase初期化を実行
 */
export async function initializeFirebaseApp(): Promise<boolean> {
  if (firebaseInitialized) {
    return true;
  }

  firebaseLoading = true;
  firebaseError = null;

  try {
    const result = await initializeFirebase();
    
    if (result.success) {
      firebaseInitialized = true;
      console.log('✅ Firebase初期化成功');
      return true;
    } else {
      firebaseError = result.error || 'Firebase初期化に失敗しました';
      console.error('❌ Firebase初期化失敗:', firebaseError);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    firebaseError = `Firebase初期化エラー: ${errorMessage}`;
    console.error('❌ Firebase初期化例外:', errorMessage);
    return false;
  } finally {
    firebaseLoading = false;
  }
}

/**
 * Firebase初期化状態を取得
 */
export function isFirebaseInitialized(): boolean {
  return firebaseInitialized;
}

/**
 * Firebaseエラー状態を取得
 */
export function getFirebaseError(): string | null {
  return firebaseError;
}

/**
 * Firebase読み込み状態を取得
 */
export function isFirebaseLoading(): boolean {
  return firebaseLoading;
}

/**
 * Firebase設定状態を取得
 */
export function getFirebaseStatus() {
  return {
    initialized: firebaseInitialized,
    loading: firebaseLoading,
    error: firebaseError,
    configured: isFirebaseConfigured(),
  };
}