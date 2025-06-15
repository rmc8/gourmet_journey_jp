# 🍽️ グルメジャーニー (Gourmet Journey JP)

<div align="center">

![App Icon](static/logo/app_icon.png)

**全国47都道府県のご当地グルメお取り寄せ管理アプリ**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-2.5.0-orange.svg)](https://tauri.app/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.9.0-red.svg)](https://kit.svelte.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.1-yellow.svg)](https://firebase.google.com/)

[🚀 ダウンロード](#📱-ダウンロード) • [📚 ドキュメント](#📚-ドキュメント) • [🛠️ 開発環境](#🛠️-開発環境) • [🤝 コントリビューション](#🤝-コントリビューション)

</div>

## 🎯 概要

**グルメジャーニー**は、日本全国47都道府県のご当地グルメのお取り寄せを効率的に管理し、制覇を目指すためのデスクトップ・モバイルアプリケーションです。

### ✨ 主な特徴

- 🗾 **ヒートマップ表示**: 食事完了回数に応じた都道府県の視覚化
- 🎲 **ルーレット機能**: 購入回数最小の都道府県からランダム選択
- 📝 **記録管理**: お取り寄せ商品の詳細記録・編集・削除
- 🔍 **外部検索連携**: Perplexity、Yahoo、楽天での商品検索支援
- 📊 **統計・分析**: 制覇状況、支出、評価などの詳細分析
- 📱 **マルチプラットフォーム**: Windows/Mac/Android対応

## 🚀 主要機能

### 🗾 都道府県ヒートマップ
- **暖色系グラデーション**による視覚的な制覇状況表示
- **ホバー詳細表示**で各都道府県の統計情報
- **クリック操作**で都道府県別記録一覧

| 完了回数 | 表示色 | 説明 |
|---------|-------|------|
| 0回 | グレー | 未制覇 |
| 1-3回 | オレンジ系 | 初級制覇 |
| 4-10回 | 赤系 | 中級制覇 |
| 10回超 | 深紅 | 上級制覇 |

### 🎲 スマートルーレット
- **購入回数最小**の都道府県から自動選択
- **3-5秒のアニメーション**で視覚的演出
- **結果表示後**に即座に外部検索可能

### 📝 包括的記録管理
```typescript
interface GourmetRecord {
  product_name: string;        // 商品名（必須）
  prefecture: string;         // 都道府県（必須）
  order_date: Date;           // 注文日（必須）
  status: "purchased" | "completed";  // ステータス
  rating: number;             // 評価（0-5段階）
  price?: number;             // 価格
  memo?: string;              // メモ
  // ... その他詳細フィールド
}
```

### 🔍 外部検索連携
| サービス | 優先度 | 検索内容 |
|---------|-------|---------|
| **Perplexity** | 最高 | 5-10パターンの多様なクエリ |
| **Yahoo!ショッピング** | 高 | 特産品・ご当地グルメ |
| **楽天市場** | 高 | グルメ・食品 |

## 📱 ダウンロード

### デスクトップアプリ
- **Windows**: [gourmet_journey_jp.exe]()
- **macOS**: [gourmet_journey_jp.app]()

### モバイルアプリ
- **Android**: [gourmet_journey_jp.apk]()
- **iOS**: 開発予定

## 🛠️ 技術スタック

<div align="center">

| 分野 | 技術 | バージョン |
|-----|------|----------|
| **フロントエンド** | SvelteKit + TypeScript | 2.9.0 / 5.6.2 |
| **UI フレームワーク** | Svelte 5 (runes) | 5.0.0 |
| **デスクトップ** | Tauri V2 | 2.5.0 |
| **データベース** | Firebase Firestore | 11.9.1 |
| **ビルドツール** | Vite | 6.0.3 |
| **パッケージマネージャー** | npm/pnpm | - |

</div>

### 🏗️ アーキテクチャ
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SvelteKit     │    │      Tauri      │    │    Firebase     │
│   Frontend      │───▶│    Desktop      │───▶│   Firestore     │
│   (TypeScript)  │    │    (Rust)       │    │   (NoSQL DB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Native APIs   │    │  External APIs  │
│   (PWA Ready)   │    │ (File, Network) │    │ (Search, Maps)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🏃‍♂️ クイックスタート

### 📋 前提条件
- **Node.js** (v18+)
- **Rust** (latest stable)
- **Firebase** プロジェクト

### ⚡ インストール & 起動

```bash
# 1. リポジトリクローン
git clone https://github.com/rmc8/gourmet_journey_jp.git
cd gourmet_journey_jp

# 2. 依存関係インストール
npm install

# 3. 環境設定
cp .env.example .env
# .env ファイルを編集してFirebase設定を追加

# 4. 開発サーバー起動
npm run dev              # フロントエンドのみ (http://localhost:1420)
npm run tauri dev        # 完全なデスクトップアプリ
```

### 🔧 ビルド

```bash
# フロントエンドビルド
npm run build

# デスクトップアプリビルド
npm run tauri build

# Android APKビルド（要Android Studio）
npm run tauri android build
```

## 🔧 開発環境

### 📝 推奨エディター設定
[VS Code](https://code.visualstudio.com/) + 以下の拡張機能:
- [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

### 🌐 環境変数設定

`.env.example` を `.env` にコピーして以下を設定:

```bash
# Firebase設定
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:your_app_id

# Android署名設定（APKビルド時）
KEYSTORE_ALIAS=your_keystore_alias
KEYSTORE_KEY_PASSWORD=your_key_password
KEYSTORE_STORE_PASSWORD=your_store_password

# GitHub統合（開発時）
GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
```

### 🔥 Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクト作成
2. Firestore Database を有効化
3. 認証を無効化（個人利用のため）
4. 環境変数に設定情報を追加

```bash
# Firebase エミュレーター起動（開発時）
npm run firebase:emulators

# Firestore ルールデプロイ
npm run firebase:deploy
```

### 📱 Android開発
```bash
# Android開発環境確認
npm run tauri android android-studio-script

# 署名付きAPKビルド
KEYSTORE_ALIAS=your_alias \
KEYSTORE_KEY_PASSWORD=your_password \
KEYSTORE_STORE_PASSWORD=your_password \
npm run tauri android build
```

## 🗂️ プロジェクト構造

```
gourmet_journey_jp/
├── 📁 docs/                   # ドキュメント
│   └── requirements/          # 要件定義書
├── 📁 src/                    # SvelteKitフロントエンド
│   ├── 📁 lib/
│   │   ├── 📁 components/     # UIコンポーネント
│   │   ├── 📁 firebase/       # Firebase設定・操作
│   │   ├── 📁 stores/         # Svelte stores
│   │   ├── 📁 styles/         # グローバルスタイル
│   │   └── 📁 utils/          # ユーティリティ関数
│   └── 📁 routes/             # SvelteKitルート
├── 📁 src-tauri/              # Tauriバックエンド
│   ├── 📁 gen/                # 生成されたネイティブコード
│   ├── 📁 icons/              # アプリアイコン
│   └── 📁 src/                # Rustソースコード
├── 📁 static/                 # 静的アセット
│   ├── 📁 fonts/              # フォントファイル
│   ├── 📁 logo/               # ロゴ・アイコン
│   └── japan-map.svg          # 日本地図SVG
├── 📄 package.json            # Node.js設定
├── 📄 tauri.conf.json         # Tauri設定
├── 📄 firebase.json           # Firebase設定
├── 📄 vite.config.js          # Vite設定
└── 📄 .env.example            # 環境変数テンプレート
```

## 🎨 UI/UX設計

### 🎨 デザインシステム
- **カラーパレット**: 暖色系グラデーション
- **フォント**: Noto Sans JP
- **レスポンシブ**: Desktop-first、Mobile-optimized
- **アクセシビリティ**: ARIA属性, キーボード操作対応

### 📱 画面構成
```
Desktop Layout:
┌─────────────────────────────────────────┐
│ Header (統計サマリー)                    │
├───────────────┬─────────────────────────┤
│              │ Side Panel              │
│   Japan Map  │ - Prefecture Details    │
│  (Heatmap)   │ - Record List          │
│              │ - Search/Filter        │
│              │ - Roulette             │
└───────────────┴─────────────────────────┘

Mobile Layout:
┌─────────────────┐
│ Header          │
├─────────────────┤
│ Japan Map       │
│ (Heatmap)       │
├─────────────────┤
│ Bottom Actions  │
│ - Roulette      │
│ - Add Record    │
└─────────────────┘
```

## 🚀 使用方法

### 1️⃣ 初回設定
1. アプリを起動
2. Firebase接続を確認（デバッグモード: タイトル5回クリック）
3. 最初のお取り寄せ記録を追加

### 2️⃣ 記録追加
1. 「記録追加」ボタンをクリック
2. 商品情報を入力（商品名・都道府県・注文日は必須）
3. 保存後、ステータスは「購入済み」

### 3️⃣ 食事完了
1. 購入済み記録を選択
2. 編集画面で「食事完了」に変更
3. 評価・写真・メモを追加

### 4️⃣ ルーレット使用
1. ルーレットボタンをクリック
2. アニメーション後、推奨都道府県が表示
3. 外部検索ボタンで商品を探す

### 5️⃣ 統計確認
- ヘッダーで制覇状況を確認
- ヒートマップで視覚的に進捗確認
- 都道府県クリックで詳細統計

## 🐛 デバッグ機能

開発者向けデバッグモードを内蔵:

```javascript
// アクセス方法
// 1. アプリタイトルを5回クリック
// 2. または Ctrl+Shift+D (Windows) / Cmd+Shift+D (Mac)

// 利用可能な機能
- Firebase接続テスト
- プラットフォーム情報表示
- 環境変数確認
- エラーログ表示
```

## 🧪 テスト

```bash
# 型チェック
npm run check

# 型チェック（ウォッチモード）
npm run check:watch

# Firebaseエミュレーターテスト
npm run firebase:emulators
```

## 📚 ドキュメント

- [📋 要件定義書](docs/requirements/requirements_summary.md)
- [🔧 開発ガイド](CLAUDE.md)
- [🏗️ アーキテクチャ設計](docs/requirements/03_technical_hearing.md)
- [🎨 UI/UX仕様](docs/requirements/04_ui_ux_hearing.md)

## 🤝 コントリビューション

### 🐛 バグレポート
[GitHub Issues](https://github.com/rmc8/gourmet_journey_jp/issues) で報告してください。

### 💡 機能提案
新機能の提案はIssueでディスカッションしてから実装してください。

### 🔄 開発フロー
1. **Issue作成**: 機能・バグの詳細説明
2. **ブランチ作成**: `feature/issue-{番号}-{簡潔な説明}`
3. **実装・テスト**: 品質を保った実装
4. **Pull Request**: レビュー用PR作成
5. **マージ**: レビュー後にマージ

### 📝 コーディング規約
- **TypeScript**: 厳密な型定義
- **Svelte 5**: runes構文使用
- **コメント**: 必要に応じて日本語
- **命名**: 英語基本、UI表示は日本語

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🙏 謝辞

- **[Tauri](https://tauri.app/)**: クロスプラットフォームデスクトップアプリ
- **[SvelteKit](https://kit.svelte.dev/)**: モダンWebフレームワーク
- **[Firebase](https://firebase.google.com/)**: バックエンドサービス
- **[Vite](https://vitejs.dev/)**: 高速ビルドツール

## 📞 サポート

- **GitHub Issues**: [問題報告・質問](https://github.com/rmc8/gourmet_journey_jp/issues)
- **Discussions**: [コミュニティディスカッション](https://github.com/rmc8/gourmet_journey_jp/discussions)

---

<div align="center">

**🍽️ 美味しい日本のお取り寄せグルメの旅を楽しみましょう！ 🇯🇵**

Made with ❤️ by [rmc8](https://github.com/rmc8)

</div>