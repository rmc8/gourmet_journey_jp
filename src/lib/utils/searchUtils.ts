import type { PrefectureData } from '../data/mockData';

/**
 * 外部検索サービス用のURL生成ユーティリティ
 */

/**
 * 検索サービスの種類
 */
export type SearchService = 'yahoo' | 'rakuten' | 'perplexity';

/**
 * 検索サービス情報
 */
export interface SearchServiceInfo {
  name: string;
  description: string;
  icon: string;
}

/**
 * 検索サービス情報のマップ
 */
export const searchServiceMap: Record<SearchService, SearchServiceInfo> = {
  yahoo: {
    name: 'Yahoo!ショッピング',
    description: 'Yahoo!ショッピングで商品を検索',
    icon: '🛒'
  },
  rakuten: {
    name: '楽天市場',
    description: '楽天市場で商品を検索',
    icon: '🛍️'
  },
  perplexity: {
    name: 'Perplexity',
    description: 'Perplexityで詳細な情報を検索',
    icon: '🔍'
  }
};

/**
 * 都道府県名から検索キーワードを生成
 * @param prefecture 都道府県データ
 * @returns 検索用キーワード
 */
function generateSearchKeyword(prefecture: PrefectureData): string {
  // 都道府県名から「県」「府」「都」「道」を除去してキーワード化
  const cleanedName = prefecture.name
    .replace(/[県府都道]$/, '')
    .trim();
    
  return cleanedName;
}

/**
 * Yahoo!ショッピング検索URLを生成
 * @param prefecture 都道府県データ
 * @returns Yahoo!ショッピング検索URL
 */
export function generateYahooSearchUrl(prefecture: PrefectureData): string {
  const keyword = generateSearchKeyword(prefecture);
  const searchQuery = encodeURIComponent(`${keyword} 特産品 グルメ お取り寄せ`);
  return `https://shopping.yahoo.co.jp/search?p=${searchQuery}`;
}

/**
 * 楽天市場検索URLを生成
 * @param prefecture 都道府県データ
 * @returns 楽天市場検索URL
 */
export function generateRakutenSearchUrl(prefecture: PrefectureData): string {
  const keyword = generateSearchKeyword(prefecture);
  const searchQuery = encodeURIComponent(`${keyword} 特産品 グルメ お取り寄せ`);
  return `https://search.rakuten.co.jp/search/mall/${searchQuery}/`;
}

/**
 * Perplexity検索URLを生成
 * @param prefecture 都道府県データ
 * @returns Perplexity検索URL
 */
export function generatePerplexitySearchUrl(prefecture: PrefectureData): string {
  const keyword = generateSearchKeyword(prefecture);
  
  const naturalQuery = `${prefecture.name}の人気ご当地グルメでお取り寄せ可能な商品を教えてください。以下の形式でテーブル表示してください：

【${prefecture.name}のおすすめお取り寄せグルメ】

| 商品名 | 特徴・説明 | 価格帯 | Yahoo!ショッピング検索 |
|--------|-----------|--------|----------------------|
| 商品1 | 詳細説明 | 価格例 | [Yahoo!で検索](https://shopping.yahoo.co.jp/search?p=商品名+${keyword}) |
| 商品2 | 詳細説明 | 価格例 | [Yahoo!で検索](https://shopping.yahoo.co.jp/search?p=商品名+${keyword}) |

5-10個の人気商品をテーブル形式で紹介し、それぞれにYahoo!ショッピングの検索リンクを含めてください。商品名は具体的に、特徴は簡潔に、価格帯は目安を教えてください。`;

  const searchQuery = encodeURIComponent(naturalQuery);
  return `https://www.perplexity.ai/search?q=${searchQuery}`;
}

/**
 * 指定されたサービスの検索URLを生成
 * @param service 検索サービス
 * @param prefecture 都道府県データ
 * @returns 検索URL
 */
export function generateSearchUrl(service: SearchService, prefecture: PrefectureData): string {
  switch (service) {
    case 'yahoo':
      return generateYahooSearchUrl(prefecture);
    case 'rakuten':
      return generateRakutenSearchUrl(prefecture);
    case 'perplexity':
      return generatePerplexitySearchUrl(prefecture);
    default:
      throw new Error(`不明な検索サービス: ${service}`);
  }
}

/**
 * すべての検索サービスのURLを生成
 * @param prefecture 都道府県データ
 * @returns 各検索サービスのURL情報
 */
export function generateAllSearchUrls(prefecture: PrefectureData): Record<SearchService, {
  url: string;
  service: SearchServiceInfo;
}> {
  return {
    yahoo: {
      url: generateYahooSearchUrl(prefecture),
      service: searchServiceMap.yahoo
    },
    rakuten: {
      url: generateRakutenSearchUrl(prefecture),
      service: searchServiceMap.rakuten
    },
    perplexity: {
      url: generatePerplexitySearchUrl(prefecture),
      service: searchServiceMap.perplexity
    }
  };
}

/**
 * 検索クエリの分析情報を生成
 * @param prefecture 都道府県データ
 * @returns 検索クエリ分析情報
 */
export function analyzeSearchQuery(prefecture: PrefectureData): {
  baseKeyword: string;
  searchTerms: string[];
  expectedResults: string[];
} {
  const baseKeyword = generateSearchKeyword(prefecture);
  
  const searchTerms = [
    baseKeyword,
    '特産品',
    'グルメ',
    'お取り寄せ'
  ];

  const expectedResults = [
    `${prefecture.name}の名産品`,
    `${baseKeyword}の特産グルメ`,
    'お取り寄せ可能な商品',
    '地域限定商品'
  ];

  return {
    baseKeyword,
    searchTerms,
    expectedResults
  };
}