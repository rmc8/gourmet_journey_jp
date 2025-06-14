/**
 * ヒートマップの色分けロジック
 * 食事完了回数に基づく暖色系グラデーション
 */

export interface ColorConfig {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export function getHeatmapColor(completedCount: number): ColorConfig {
  // 基本の色設定
  const baseConfig: ColorConfig = {
    fill: '#E0E0E0', // グレー（0回）
    stroke: '#BDBDBD',
    strokeWidth: 1
  };

  if (completedCount === 0) {
    return baseConfig;
  }

  // 暖色系グラデーション
  const colors = [
    '#FFE0B2', // 1回: 薄いオレンジ
    '#FFB74D', // 2回: オレンジ
    '#FF9800', // 3回: 濃いオレンジ
    '#F44336', // 4-5回: 赤系
    '#F44336', // 4-5回: 赤系
    '#C62828'  // 6回以上: 深紅
  ];

  let colorIndex: number;
  if (completedCount <= 6) {
    colorIndex = Math.min(completedCount - 1, colors.length - 1);
  } else {
    // 10回超の場合は相対評価（後で実装）
    colorIndex = colors.length - 1;
  }

  return {
    fill: colors[colorIndex],
    stroke: '#9E9E9E',
    strokeWidth: 1.5
  };
}

/**
 * ホバー時の色設定
 */
export function getHoverColor(completedCount: number): ColorConfig {
  return {
    fill: '#FDD835', // 自然な黄色（グラデーションに調和）
    stroke: '#FF9800', // オレンジ系の境界線
    strokeWidth: 1.5 // 細いストローク
  };
}

/**
 * 選択時の色設定
 */
export function getSelectedColor(): ColorConfig {
  return {
    fill: '#FF9800', // 暖色系オレンジ（自然な強調色）
    stroke: '#F57C00', // 濃いオレンジ
    strokeWidth: 2 // 控えめなストローク
  };
}