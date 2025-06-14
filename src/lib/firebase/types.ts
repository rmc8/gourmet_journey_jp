/**
 * Firebase / Firestore用型定義
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Firestore用のGourmetRecord型
 * mockData.tsと同等だが、Firestore用にDate型をTimestamp型に変更
 */
export interface FirestoreGourmetRecord {
  id: string;
  productName: string;
  productUrl?: string;
  orderDate: Timestamp;
  prefecture: string;
  price?: number;
  shopUrl?: string;
  shopName?: string;
  status: 'purchased' | 'completed';
  rating: number; // 0=未評価, 1-5=評価済み
  photoUrl?: string;
  mealDate?: Timestamp;
  memo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * FirestoreのPrefectureData型
 * 統計データはリアルタイム計算のため、recordsのみ保存
 */
export interface FirestorePrefectureData {
  id: string;
  name: string;
  // completedCount と purchasedCount はリアルタイム計算
  records: FirestoreGourmetRecord[];
}

/**
 * Firestoreコレクション名
 */
export const FIRESTORE_COLLECTIONS = {
  GOURMET_RECORDS: 'gourmet_records',
  PREFECTURE_DATA: 'prefecture_data', // 将来的な拡張用
} as const;

/**
 * Firestore操作の結果型
 */
export interface FirestoreResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Firestoreクエリオプション
 */
export interface FirestoreQueryOptions {
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: {
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in';
    value: any;
  }[];
}

/**
 * 統計データ型
 */
export interface PrefectureStats {
  prefectureId: string;
  prefectureName: string;
  completedCount: number;
  purchasedCount: number;
  totalSpent: number;
  averageRating: number;
  lastOrderDate?: Timestamp;
}