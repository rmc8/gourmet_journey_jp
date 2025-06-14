export interface PrefectureData {
  id: string;
  name: string;
  completedCount: number;
  purchasedCount: number;
  records: GourmetRecord[];
}

export interface GourmetRecord {
  id: string;
  productName: string;
  productUrl?: string;
  orderDate: Date;
  prefecture: string;
  price?: number;
  shopUrl?: string;
  shopName?: string;
  status: 'purchased' | 'completed';
  rating: number; // 0=未評価, 1-5=評価済み
  photoUrl?: string;
  mealDate?: Date;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 47都道府県のモックデータ
export const mockPrefectureData: PrefectureData[] = [
  { id: 'hokkaido', name: '北海道', completedCount: 3, purchasedCount: 4, records: [] },
  { id: 'aomori', name: '青森県', completedCount: 1, purchasedCount: 2, records: [] },
  { id: 'iwate', name: '岩手県', completedCount: 0, purchasedCount: 1, records: [] },
  { id: 'miyagi', name: '宮城県', completedCount: 2, purchasedCount: 2, records: [] },
  { id: 'akita', name: '秋田県', completedCount: 0, purchasedCount: 0, records: [] },
  { id: 'yamagata', name: '山形県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'fukushima', name: '福島県', completedCount: 1, purchasedCount: 2, records: [] },
  { id: 'ibaraki', name: '茨城県', completedCount: 0, purchasedCount: 1, records: [] },
  { id: 'tochigi', name: '栃木県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'gunma', name: '群馬県', completedCount: 0, purchasedCount: 0, records: [] },
  { id: 'saitama', name: '埼玉県', completedCount: 2, purchasedCount: 3, records: [] },
  { id: 'chiba', name: '千葉県', completedCount: 1, purchasedCount: 2, records: [] },
  { id: 'tokyo', name: '東京都', completedCount: 4, purchasedCount: 5, records: [] },
  { id: 'kanagawa', name: '神奈川県', completedCount: 2, purchasedCount: 3, records: [] },
  { id: 'niigata', name: '新潟県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'toyama', name: '富山県', completedCount: 0, purchasedCount: 1, records: [] },
  { id: 'ishikawa', name: '石川県', completedCount: 2, purchasedCount: 2, records: [] },
  { id: 'fukui', name: '福井県', completedCount: 0, purchasedCount: 0, records: [] },
  { id: 'yamanashi', name: '山梨県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'nagano', name: '長野県', completedCount: 1, purchasedCount: 2, records: [] },
  { id: 'gifu', name: '岐阜県', completedCount: 0, purchasedCount: 1, records: [] },
  { id: 'shizuoka', name: '静岡県', completedCount: 2, purchasedCount: 2, records: [] },
  { id: 'aichi', name: '愛知県', completedCount: 3, purchasedCount: 4, records: [] },
  { id: 'mie', name: '三重県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'shiga', name: '滋賀県', completedCount: 0, purchasedCount: 0, records: [] },
  { id: 'kyoto', name: '京都府', completedCount: 2, purchasedCount: 3, records: [] },
  { id: 'osaka', name: '大阪府', completedCount: 5, purchasedCount: 6, records: [] },
  { id: 'hyogo', name: '兵庫県', completedCount: 2, purchasedCount: 3, records: [] },
  { id: 'nara', name: '奈良県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'wakayama', name: '和歌山県', completedCount: 0, purchasedCount: 1, records: [] },
  { id: 'tottori', name: '鳥取県', completedCount: 0, purchasedCount: 0, records: [] },
  { id: 'shimane', name: '島根県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'okayama', name: '岡山県', completedCount: 1, purchasedCount: 2, records: [] },
  { id: 'hiroshima', name: '広島県', completedCount: 2, purchasedCount: 2, records: [] },
  { id: 'yamaguchi', name: '山口県', completedCount: 0, purchasedCount: 1, records: [] },
  { id: 'tokushima', name: '徳島県', completedCount: 0, purchasedCount: 0, records: [] },
  { id: 'kagawa', name: '香川県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'ehime', name: '愛媛県', completedCount: 0, purchasedCount: 1, records: [] },
  { id: 'kochi', name: '高知県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'fukuoka', name: '福岡県', completedCount: 3, purchasedCount: 4, records: [] },
  { id: 'saga', name: '佐賀県', completedCount: 0, purchasedCount: 1, records: [] },
  { id: 'nagasaki', name: '長崎県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'kumamoto', name: '熊本県', completedCount: 2, purchasedCount: 2, records: [] },
  { id: 'oita', name: '大分県', completedCount: 1, purchasedCount: 2, records: [] },
  { id: 'miyazaki', name: '宮崎県', completedCount: 1, purchasedCount: 1, records: [] },
  { id: 'kagoshima', name: '鹿児島県', completedCount: 1, purchasedCount: 2, records: [] },
  { id: 'okinawa', name: '沖縄県', completedCount: 2, purchasedCount: 2, records: [] }
];

export function getPrefectureData(prefectureId: string): PrefectureData | undefined {
  return mockPrefectureData.find(p => p.id === prefectureId);
}

export function getAllPrefectureData(): PrefectureData[] {
  return mockPrefectureData;
}