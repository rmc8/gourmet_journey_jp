# 技術仕様詳細ヒアリング

## ヒアリング日時
- **日付**: 2025-06-14
- **ステータス**: 進行中

## Firebase Firestore 設計

### Q1: コレクション構造について
**提案するコレクション設計**:
```javascript
// メインコレクション
gourmet_records: {
  id: string (自動生成),
  product_name: string,
  product_url?: string,
  order_date: timestamp,
  prefecture: string, // 都道府県名
  price?: number,
  shop_url?: string,
  shop_name?: string,
  
  // ステータス管理
  status: "purchased" | "completed", // 購入済み | 食事完了
  
  // 食事完了時のみ
  rating: number, // 0=未評価, 1-5=評価済み
  photo_url?: string,
  meal_date?: timestamp,
  memo?: string,
  
  // メタデータ
  created_at: timestamp,
  updated_at: timestamp,
  is_deleted: boolean, // ゴミ箱機能用
  deleted_at?: timestamp
}

// 都道府県統計キャッシュ（パフォーマンス向上用）
prefecture_stats: {
  id: string, // 都道府県名
  purchase_count: number, // 購入回数
  completed_count: number, // 食事完了回数
  last_updated: timestamp
}
```

**質問**:
1. この構造で十分でしょうか？
2. 都道府県統計を別コレクションにするか、リアルタイム計算するかどちらが良いですか？
3. ゴミ箱機能は論理削除（is_deleted フラグ）で良いですか？

**回答**: 個人利用で10万件になることも想定しづらいのでリアルタイム計算で十分だと思います。構造もOKです！論理削除OKです！

### Q2: Firebase設定の外部化
**提案する設定方法**:
```typescript
// .env.example
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

// firebase.config.ts
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

**質問**:
1. この環境変数管理方法で良いでしょうか？
2. ビルド時に環境ごとの設定を切り替える仕組みは必要ですか？
3. Firebase Security Rulesは認証なしの場合どう設定しますか？

**回答**: OKです！設定の切り替えの仕組みは不要です。Firebase Security RUlesとはなんですか？アプリ側に認証の設定などを準備してユーザー側が認証を意識することはなくアプリ側で認証が行われていると良いです。ちょっと理解ができていないのでこの点を教えてもらえると助かります。

### Q3: Firebase Security Rules
**認証なしでの提案ルール**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 全ユーザーがすべてのドキュメントを読み書き可能
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**質問**:
1. この設定で良いでしょうか？
2. 将来的に認証を追加する可能性はありますか？
3. データ保護のための制限は必要ですか？

**回答**: 設定はこれで良いです。認証の追加の可能性はありません。データ保護の制限も必要ありません。利用者の責任で行います。

## Tauri V2 モバイル対応

### Q4: モバイル対応の技術詳細
**Tauri V2 設定**:
```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = { version = "2.0", features = ["mobile"] }

# タスクとバイルド設定
[target.android]
[target.ios]
```

**質問**:
1. Android/iOS の最小対応バージョンに希望はありますか？
2. モバイル特有の権限（ネットワーク、ストレージなど）で必要なものはありますか？
3. プッシュ通知機能は必要ですか？

**回答**: 一般的に広く使われているバージョンを最小対応のバージョンとしてください。ネットワーク通信は必要です。プッシュ通知は不要です。

### Q5: モバイル UI 調整の詳細
**提案する対応方針**:
- **レスポンシブデザイン**: CSS Grid/Flexbox
- **タッチ操作最適化**: ボタンサイズ44px以上
- **スワイプジェスチャー**: 記録削除、画面切り替え
- **モバイル専用コンポーネント**: プルダウン→底面シート

**質問**:
1. スワイプジェスチャーの実装は必要ですか？
2. モバイル専用の画面遷移パターンはありますか？
3. 縦画面・横画面の両方に対応しますか？

**回答**: スマートフォン向けだとスワイプジェスチャーがあると便利だと思います。現状とくにパターンはありません。モバイルについては縦画面のみとしましょう。画面遷移のパターンは特に考えていません。都道府県のヒートマップや統計表示、データのCRUD、ルーレットが主な画面になるのでシンプルなルーティングになると思います。

## 外部サービス連携

### Q6: Perplexity クエリ生成の詳細
**提案するクエリ生成ロジック**:
```typescript
function generatePerplexityQuery(prefecture: string): string {
  const queries = [
    `${prefecture}の美味しい特産品・グルメお取り寄せおすすめ`,
    `${prefecture}の郷土料理・ご当地グルメをお取り寄せで楽しむ`,
    `${prefecture}産の名物・特産品の人気お取り寄せ商品`
  ];
  
  // ランダムまたは都道府県の特徴に応じて選択
  return queries[Math.floor(Math.random() * queries.length)];
}
```

**質問**:
1. このクエリパターンで十分ですか？
2. 都道府県ごとの特産品キーワード（例：北海道→海産物）を事前定義しますか？
3. ユーザーがクエリをカスタマイズできる機能は必要ですか？

**回答**: クエリはユーザーが特産品などを選ぶのに役立てるべきものなので紹介してもらうことを明記しつつ５〜10個は欲しいですよね。Perplexityで検索するので事前定義も不要です。３は必須ではないですがクエリをカスタマイズする機能、といいますかインストラクションを追加できるk脳はあっても良いかもです。

### Q7: 外部検索リンク生成
**提案する実装**:
```typescript
const searchUrls = {
  perplexity: (query: string) => 
    `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
  yahoo: (prefecture: string) => 
    `https://shopping.yahoo.co.jp/search?p=${encodeURIComponent(prefecture + ' 特産品')}`,
  rakuten: (prefecture: string) => 
    `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(prefecture + ' グルメ')}`
};
```

**質問**:
1. Yahoo・楽天の検索キーワードはこれで良いですか？
2. 検索履歴を保存して、よく使うパターンを学習する機能は必要ですか？
3. 他の検索サイト（Amazon、食べログなど）の追加は必要ですか？

**回答**: Yahooと楽天はそれで良いです。食べログは不要ですがアマゾンはあっても良いです。

## データ処理・パフォーマンス

### Q8: 都道府県統計の計算方法
**提案する実装方式**:
- **リアルタイム計算**: 毎回Firestoreクエリで集計
- **キャッシュ方式**: 統計を別コレクションに保存、更新時に再計算
- **ハイブリッド**: 基本はキャッシュ、更新時はリアルタイム

**質問**:
1. データ量が増えた場合のパフォーマンスを考慮してどの方式が良いですか？
2. 統計の更新頻度はどの程度を想定しますか？
3. オフライン対応は必要ですか？

**回答**: Firestoreへの通信が減らせる方法が良いです。更新頻度はアプリを開いたタイミングやCRUDを行ったタイミングです。オフライン対応はあった方が望ましいです。

### Q9: 検索・フィルタリングの実装
**提案する実装**:
```typescript
// Firestore クエリ例
const query = collection(db, 'gourmet_records')
  .where('prefecture', '==', selectedPrefecture)
  .where('rating', '>=', minRating)
  .where('order_date', '>=', startDate)
  .where('order_date', '<=', endDate)
  .orderBy('order_date', 'desc');
```

**質問**:
1. 複合インデックスが必要になりますが、作成方法を自動化しますか？
2. 部分一致検索（商品名）はFirestoreでは制限があります。どう対応しますか？
3. 検索結果のページネーション（無限スクロール）は必要ですか？

**回答**: 作成方法は自動化で。Firestoreで制限というのはどういうことですか？無限スクロールはあった方がよいです。ただ、そんなに量が多くならないとは思います（1万いくともなかなかおもえません。）

## エラーハンドリング・ログ

### Q10: エラー処理とログ
**提案する方針**:
- **Firebase接続エラー**: リトライ機能付きエラー表示
- **データ保存失敗**: ローカル一時保存→再同期
- **外部API障害**: フォールバック表示
- **ログ**: 開発環境のみコンソール出力

**質問**:
1. ユーザーへのエラー表示方法に希望はありますか？
2. クラッシュレポート（Sentry等）の導入は必要ですか？
3. 使用統計の収集は必要ですか？

**回答**: ユーザーが理解できる簡便なものならなんでもよいです。クラッシュレポートや使用統計は不要です。

## 次のステップ
回答いただいた後、以下を作成予定：
- 04_ui_ux_hearing.md - 画面設計詳細
- requirements_summary.md - 最終仕様書
- 技術アーキテクチャ図の作成