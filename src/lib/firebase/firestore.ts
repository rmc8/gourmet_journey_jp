/**
 * Firestore操作ヘルパー関数
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  type Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type QuerySnapshot,
  type DocumentSnapshot,
  type Query,
  type CollectionReference,
  Timestamp,
  connectFirestoreEmulator,
} from 'firebase/firestore';

import { getFirebaseConfig, developmentConfig, isFirebaseConfigured } from './config';
import type {
  FirestoreGourmetRecord,
  FirestoreResult,
  FirestoreQueryOptions,
  PrefectureStats,
} from './types';
import { FIRESTORE_COLLECTIONS } from './types';

let app: FirebaseApp;
let db: Firestore;
let isInitialized = false;

/**
 * Firebase/Firestoreを初期化
 */
export async function initializeFirebase(): Promise<FirestoreResult<boolean>> {
  try {
    if (isInitialized) {
      return { success: true, data: true };
    }

    // 環境変数が設定されていない場合は開発モード
    const config = isFirebaseConfigured() ? getFirebaseConfig() : developmentConfig;
    
    app = initializeApp(config);
    db = getFirestore(app);

    // 開発環境でエミュレーターに接続
    if (import.meta.env.DEV && !isFirebaseConfigured()) {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('🔧 Firestore エミュレーターに接続しました');
      } catch (error) {
        console.warn('⚠️ Firestore エミュレーターに接続できませんでした:', error);
      }
    }

    isInitialized = true;
    console.log('✅ Firebase初期化完了');
    
    return { success: true, data: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    console.error('❌ Firebase初期化エラー:', errorMessage);
    return { success: false, error: `Firebase初期化に失敗しました: ${errorMessage}` };
  }
}

/**
 * Firestoreインスタンスを取得
 */
export function getFirestoreInstance(): Firestore {
  if (!isInitialized || !db) {
    throw new Error('Firebaseが初期化されていません。initializeFirebase()を先に実行してください。');
  }
  return db;
}

/**
 * グルメ記録を追加
 */
export async function addGourmetRecord(
  record: Omit<FirestoreGourmetRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FirestoreResult<string>> {
  try {
    const db = getFirestoreInstance();
    const now = Timestamp.now();
    
    const recordWithTimestamps = {
      ...record,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.GOURMET_RECORDS), recordWithTimestamps);
    
    return { success: true, data: docRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `記録の追加に失敗しました: ${errorMessage}` };
  }
}

/**
 * グルメ記録を更新
 */
export async function updateGourmetRecord(
  id: string,
  updates: Partial<Omit<FirestoreGourmetRecord, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<FirestoreResult<boolean>> {
  try {
    const db = getFirestoreInstance();
    const recordRef = doc(db, FIRESTORE_COLLECTIONS.GOURMET_RECORDS, id);
    
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(recordRef, updatesWithTimestamp);
    
    return { success: true, data: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `記録の更新に失敗しました: ${errorMessage}` };
  }
}

/**
 * グルメ記録を削除
 */
export async function deleteGourmetRecord(id: string): Promise<FirestoreResult<boolean>> {
  try {
    const db = getFirestoreInstance();
    const recordRef = doc(db, FIRESTORE_COLLECTIONS.GOURMET_RECORDS, id);
    
    await deleteDoc(recordRef);
    
    return { success: true, data: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `記録の削除に失敗しました: ${errorMessage}` };
  }
}

/**
 * グルメ記録を取得（単一）
 */
export async function getGourmetRecord(id: string): Promise<FirestoreResult<FirestoreGourmetRecord>> {
  try {
    const db = getFirestoreInstance();
    const recordRef = doc(db, FIRESTORE_COLLECTIONS.GOURMET_RECORDS, id);
    const docSnap = await getDoc(recordRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: '記録が見つかりません' };
    }
    
    const data = docSnap.data() as Omit<FirestoreGourmetRecord, 'id'>;
    const record: FirestoreGourmetRecord = {
      id: docSnap.id,
      ...data,
    };
    
    return { success: true, data: record };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `記録の取得に失敗しました: ${errorMessage}` };
  }
}

/**
 * グルメ記録を取得（複数・クエリ付き）
 */
export async function getGourmetRecords(
  options: FirestoreQueryOptions = {}
): Promise<FirestoreResult<FirestoreGourmetRecord[]>> {
  try {
    const db = getFirestoreInstance();
    let q: Query | CollectionReference = collection(db, FIRESTORE_COLLECTIONS.GOURMET_RECORDS);

    // クエリ条件を適用
    if (options.where) {
      for (const condition of options.where) {
        q = query(q, where(condition.field, condition.operator, condition.value));
      }
    }

    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const querySnapshot = await getDocs(q);
    const records: FirestoreGourmetRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<FirestoreGourmetRecord, 'id'>;
      records.push({
        id: doc.id,
        ...data,
      });
    });
    
    return { success: true, data: records };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `記録の取得に失敗しました: ${errorMessage}` };
  }
}

/**
 * 都道府県別の統計を取得
 */
export async function getPrefectureStats(): Promise<FirestoreResult<PrefectureStats[]>> {
  try {
    const result = await getGourmetRecords();
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const records = result.data;
    const statsMap = new Map<string, PrefectureStats>();

    // 都道府県ごとに統計を集計
    for (const record of records) {
      const prefectureId = record.prefecture;
      
      if (!statsMap.has(prefectureId)) {
        statsMap.set(prefectureId, {
          prefectureId,
          prefectureName: prefectureId, // TODO: 名前マッピング
          completedCount: 0,
          purchasedCount: 0,
          totalSpent: 0,
          averageRating: 0,
        });
      }

      const stats = statsMap.get(prefectureId)!;
      
      if (record.status === 'completed') {
        stats.completedCount++;
      }
      if (record.status === 'purchased' || record.status === 'completed') {
        stats.purchasedCount++;
      }
      if (record.price) {
        stats.totalSpent += record.price;
      }
      if (record.orderDate) {
        stats.lastOrderDate = record.orderDate;
      }
    }

    // 平均評価を計算
    for (const stats of statsMap.values()) {
      const prefectureRecords = records.filter(r => r.prefecture === stats.prefectureId && r.rating > 0);
      if (prefectureRecords.length > 0) {
        stats.averageRating = prefectureRecords.reduce((sum, r) => sum + r.rating, 0) / prefectureRecords.length;
      }
    }

    return { success: true, data: Array.from(statsMap.values()) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `統計の取得に失敗しました: ${errorMessage}` };
  }
}

/**
 * 接続テスト
 */
export async function testFirestoreConnection(): Promise<FirestoreResult<boolean>> {
  try {
    const db = getFirestoreInstance();
    
    // テスト用ドキュメントの作成/更新
    const testDoc = doc(db, 'test', 'connection');
    const testData = { 
      timestamp: Timestamp.now(),
      message: 'Firebase接続テスト成功'
    };
    
    // setDoc を使用してドキュメントを作成または更新
    await updateDoc(testDoc, testData).catch(async () => {
      // ドキュメントが存在しない場合は作成
      const { setDoc } = await import('firebase/firestore');
      await setDoc(testDoc, testData);
    });
    
    return { success: true, data: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `接続テストに失敗しました: ${errorMessage}` };
  }
}