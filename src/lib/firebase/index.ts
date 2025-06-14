/**
 * Firebase統合エクスポート
 * アプリケーション全体でのFirebase操作の統一エントリーポイント
 */

// 設定関連
export {
  getFirebaseConfig,
  isFirebaseConfigured,
  developmentConfig,
  type FirebaseConfig,
} from './config';

// 型定義
export type {
  FirestoreGourmetRecord,
  FirestorePrefectureData,
  FirestoreResult,
  FirestoreQueryOptions,
  PrefectureStats,
} from './types';

export { FIRESTORE_COLLECTIONS } from './types';

// Firestore操作
export {
  initializeFirebase,
  getFirestoreInstance,
  addGourmetRecord,
  updateGourmetRecord,
  deleteGourmetRecord,
  getGourmetRecord,
  getGourmetRecords,
  getPrefectureStats,
  testFirestoreConnection,
} from './firestore';

// ユーティリティ関数
import type { GourmetRecord } from '../data/mockData';
import type { FirestoreGourmetRecord } from './types';
import { Timestamp } from 'firebase/firestore';

/**
 * mockData.ts の GourmetRecord を FirestoreGourmetRecord に変換
 */
export function convertToFirestoreRecord(
  record: Omit<GourmetRecord, 'id'>
): Omit<FirestoreGourmetRecord, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    productName: record.productName,
    productUrl: record.productUrl,
    orderDate: Timestamp.fromDate(record.orderDate),
    prefecture: record.prefecture,
    price: record.price,
    shopUrl: record.shopUrl,
    shopName: record.shopName,
    status: record.status,
    rating: record.rating,
    photoUrl: record.photoUrl,
    mealDate: record.mealDate ? Timestamp.fromDate(record.mealDate) : undefined,
    memo: record.memo,
  };
}

/**
 * FirestoreGourmetRecord を mockData.ts の GourmetRecord に変換
 */
export function convertFromFirestoreRecord(record: FirestoreGourmetRecord): GourmetRecord {
  return {
    id: record.id,
    productName: record.productName,
    productUrl: record.productUrl,
    orderDate: record.orderDate.toDate(),
    prefecture: record.prefecture,
    price: record.price,
    shopUrl: record.shopUrl,
    shopName: record.shopName,
    status: record.status,
    rating: record.rating,
    photoUrl: record.photoUrl,
    mealDate: record.mealDate?.toDate(),
    memo: record.memo,
    createdAt: record.createdAt.toDate(),
    updatedAt: record.updatedAt.toDate(),
  };
}