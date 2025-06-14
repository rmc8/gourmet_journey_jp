import type { PrefectureData } from '../data/mockData';

/**
 * ルーレット選択のロジックを提供するユーティリティ
 */

/**
 * 最小の完了回数を持つ都道府県を抽出
 * @param prefectureData 都道府県データ配列
 * @returns 最小完了回数の都道府県配列
 */
export function getMinimumCompletedPrefectures(prefectureData: PrefectureData[]): PrefectureData[] {
  if (prefectureData.length === 0) {
    return [];
  }

  // 最小の完了回数を取得
  const minCompletedCount = Math.min(...prefectureData.map(p => p.completedCount));
  
  // 最小完了回数と一致する都道府県をフィルタリング
  return prefectureData.filter(p => p.completedCount === minCompletedCount);
}

/**
 * 配列からランダムに一つの要素を選択
 * @param array 選択対象の配列
 * @returns ランダムに選択された要素（配列が空の場合はnull）
 */
export function selectRandomPrefecture<T>(array: T[]): T | null {
  if (array.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * ルーレット選択のメイン処理
 * 最小完了回数の都道府県からランダムに一つを選択
 * @param prefectureData 都道府県データ配列
 * @returns 選択された都道府県と候補リスト
 */
export function executeRoulette(prefectureData: PrefectureData[]): {
  selected: PrefectureData | null;
  candidates: PrefectureData[];
  minCompletedCount: number;
} {
  const candidates = getMinimumCompletedPrefectures(prefectureData);
  const selected = selectRandomPrefecture(candidates);
  const minCompletedCount = candidates.length > 0 ? candidates[0].completedCount : 0;

  return {
    selected,
    candidates,
    minCompletedCount
  };
}

/**
 * ルーレットアニメーション用のランダムシーケンス生成
 * アニメーション中に表示する都道府県のシーケンスを生成
 * @param candidates 候補の都道府県配列
 * @param sequenceLength アニメーションシーケンスの長さ
 * @returns アニメーション用の都道府県シーケンス
 */
export function generateAnimationSequence(
  candidates: PrefectureData[], 
  sequenceLength: number = 20
): PrefectureData[] {
  if (candidates.length === 0) {
    return [];
  }

  const sequence: PrefectureData[] = [];
  
  for (let i = 0; i < sequenceLength; i++) {
    const randomPrefecture = selectRandomPrefecture(candidates);
    if (randomPrefecture) {
      sequence.push(randomPrefecture);
    }
  }
  
  return sequence;
}

/**
 * ルーレット結果の統計情報を生成
 * @param result ルーレット実行結果
 * @param totalPrefectures 総都道府県数
 * @returns 統計情報
 */
export function generateRouletteStats(
  result: { candidates: PrefectureData[]; minCompletedCount: number },
  totalPrefectures: number
): {
  candidateCount: number;
  completionRate: number;
  encouragementMessage: string;
} {
  const candidateCount = result.candidates.length;
  const completionRate = Math.round((candidateCount / totalPrefectures) * 100);
  
  let encouragementMessage = '';
  
  if (result.minCompletedCount === 0) {
    encouragementMessage = `まだ${candidateCount}都道府県が未体験です！新しい味覚の発見に出かけましょう🍽️`;
  } else if (candidateCount <= 5) {
    encouragementMessage = `残り${candidateCount}都道府県！制覇まであと少しです🎯`;
  } else if (candidateCount <= 15) {
    encouragementMessage = `${candidateCount}都道府県が同率です。新しいグルメを探してみましょう🌟`;
  } else {
    encouragementMessage = `${candidateCount}都道府県からの選択です。お取り寄せの冒険を始めましょう🚀`;
  }

  return {
    candidateCount,
    completionRate,
    encouragementMessage
  };
}