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

/**
 * タイムアウト付きでPromiseを実行
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`操作がタイムアウトしました (${timeoutMs}ms)`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

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
    // Firebase初期化を先に実行
    const initResult = await initializeFirebase();
    if (!initResult.success) {
      return { success: false, error: initResult.error };
    }

    const db = getFirestoreInstance();
    const now = Timestamp.now();
    
    const recordWithTimestamps = {
      ...record,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await withTimeout(
      addDoc(collection(db, FIRESTORE_COLLECTIONS.GOURMET_RECORDS), recordWithTimestamps),
      15000 // 15秒タイムアウト
    );
    
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

// 都道府県IDから名前への変換マップ
const PREFECTURE_NAME_MAP: Record<string, string> = {
  'hokkaido': '北海道', 'aomori': '青森県', 'iwate': '岩手県', 'miyagi': '宮城県', 'akita': '秋田県',
  'yamagata': '山形県', 'fukushima': '福島県', 'ibaraki': '茨城県', 'tochigi': '栃木県', 'gunma': '群馬県',
  'saitama': '埼玉県', 'chiba': '千葉県', 'tokyo': '東京都', 'kanagawa': '神奈川県', 'niigata': '新潟県',
  'toyama': '富山県', 'ishikawa': '石川県', 'fukui': '福井県', 'yamanashi': '山梨県', 'nagano': '長野県',
  'gifu': '岐阜県', 'shizuoka': '静岡県', 'aichi': '愛知県', 'mie': '三重県', 'shiga': '滋賀県',
  'kyoto': '京都府', 'osaka': '大阪府', 'hyogo': '兵庫県', 'nara': '奈良県', 'wakayama': '和歌山県',
  'tottori': '鳥取県', 'shimane': '島根県', 'okayama': '岡山県', 'hiroshima': '広島県', 'yamaguchi': '山口県',
  'tokushima': '徳島県', 'kagawa': '香川県', 'ehime': '愛媛県', 'kochi': '高知県', 'fukuoka': '福岡県',
  'saga': '佐賀県', 'nagasaki': '長崎県', 'kumamoto': '熊本県', 'oita': '大分県', 'miyazaki': '宮崎県',
  'kagoshima': '鹿児島県', 'okinawa': '沖縄県'
};

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
          prefectureName: PREFECTURE_NAME_MAP[prefectureId] || prefectureId,
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
    // Firebase初期化を先に実行
    const initResult = await withTimeout(initializeFirebase(), 10000);
    if (!initResult.success) {
      return { success: false, error: initResult.error };
    }

    const db = getFirestoreInstance();
    
    // テスト用ドキュメントの作成/更新
    const testDoc = doc(db, 'test', 'connection');
    const testData = { 
      timestamp: Timestamp.now(),
      message: 'Firebase接続テスト成功'
    };
    
    // setDoc を使用してドキュメントを作成または更新
    await withTimeout(
      updateDoc(testDoc, testData).catch(async () => {
        // ドキュメントが存在しない場合は作成
        const { setDoc } = await import('firebase/firestore');
        await setDoc(testDoc, testData);
      }),
      10000 // 10秒タイムアウト
    );
    
    return { success: true, data: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    return { success: false, error: `接続テストに失敗しました: ${errorMessage}` };
  }
}