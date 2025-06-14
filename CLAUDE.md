# CLAUDE.md

**Speak in Japanese!**

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

**グルメジャーニー**は、全国47都道府県のご当地グルメのお取り寄せを管理するデスクトップアプリケーションです。Tauri + SvelteKit + TypeScriptで構築されています。

### アプリの目的
全都道府県の食べ物を取り寄せたグルメを楽しむことを目標とし、そのお取り寄せ状況を効率的に管理・追跡するためのアプリケーションです。

### 主要機能
- **都道府県別状況表示**: 各都道府県のお取り寄せ状況を一覧で確認
- **ヒートマップ表示**: お取り寄せ回数に応じて都道府県を色分けして視覚化
- **ルーレット機能**: お取り寄せ回数がもっとも少ない都道府県から次の目標をランダム選択
- **検索サポート**: 選択した都道府県でYahooショッピング、楽天、Perplexityでの検索を支援
- **食事記録管理**: 食べた食べ物の記録・編集・削除機能

## 開発環境設定

### 前提条件
- Rust（Tauriバックエンド用）
- Node.js（SvelteKitフロントエンド用）
- GitHub Personal Access Token（MCP統合用）

### 環境設定
1. `.env.example` を `.env` にコピー
2. `.env` にGitHub Personal Access Tokenを設定：
   ```
   GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
   ```

### よく使うコマンド
- `npm run dev` - Vite開発サーバー起動（フロントエンドのみ）
- `npm run build` - 本番用SvelteKitアプリケーションビルド
- `npm run preview` - ビルドしたアプリケーションをローカルでプレビュー
- `npm run check` - SvelteKit同期とsvelte-checkによる型チェック実行
- `npm run check:watch` - 型チェックをウォッチモードで実行
- `npm run tauri dev` - Tauri開発モード実行（完全なデスクトップアプリ）
- `npm run tauri build` - Tauriデスクトップアプリケーションビルド

## MCP設定

`.mcp.json`で以下のMCPサーバーが設定されています：

### GitHub MCPサーバー
- リポジトリ情報とファイル操作
- Issue作成と管理
- Pull Request操作
- ユーザーと組織データアクセス

### Sequential Thinking MCPサーバー
- **積極的に活用**: 複雑な問題解決や設計判断時に思考プロセスを整理
- 段階的な思考フローの記録と整理
- 開発計画の論理的な構築支援
- バグ解析や機能実装の思考過程の明確化

## アーキテクチャ

### フロントエンド（SvelteKit）
- SPAモードのTypeScriptベースSvelteKitアプリケーション
- `src/` ディレクトリに配置
- `@sveltejs/adapter-static` を使用し、`index.html` にフォールバック
- Tauri統合用の固定ポート（1420）でViteビルドツール使用
- TypeScriptサポート付きSvelte 5

### バックエンド（Tauri）
- Rustベースのデスクトップアプリケーションフレームワーク
- `src-tauri/` ディレクトリに配置
- ライブラリ名：`gourmet_journey_jp_lib`（Windows命名競合回避）
- ネイティブシステム統合とデスクトップアプリパッケージング提供

### データアーキテクチャ
このアプリケーションは47都道府県の地域グルメを追跡し、以下が必要：
- 都道府県データ管理
- 食品アイテムの分類と追跡
- ユーザー進捗追跡
- 日本の食べ物・旅行API統合の可能性

## GitHub Issue管理ワークフロー

### 開発前の必須手順
1. **Issue作成**: 新機能やバグ修正に取り組む前に必ずGitHub Issueを作成
2. **ラベル付け**: 適切なラベル（feature/bug/enhancement/documentation等）を設定
3. **優先度設定**: 優先度ラベル（high/medium/low）を付与
4. **アサイン**: 担当者を明確にする

### Issue管理のベストプラクティス
- **タイトル**: 簡潔で具体的な内容（例：「都道府県ヒートマップ表示機能の実装」）
- **説明**: 受け入れ条件、技術要件、参考資料を明記
- **関連Issue**: 関連するIssueとのリンクを設定
- **マイルストーン**: リリース計画に応じてマイルストーンを設定

### 推奨ラベル体系
- **種類**: `feature`, `bug`, `enhancement`, `documentation`, `refactor`
- **優先度**: `priority-high`, `priority-medium`, `priority-low`
- **ステータス**: `ready`, `in-progress`, `blocked`, `review-needed`
- **コンポーネント**: `frontend`, `backend`, `ui/ux`, `data`

### 開発フロー
1. Issue作成・計画
2. ブランチ作成（`feature/issue-番号-簡潔な説明`）
3. 開発・テスト
4. Pull Request作成（Issueを参照）
5. レビュー・マージ
6. Issueクローズ

## ドキュメント管理

### 要件定義ドキュメント
プロジェクトの要件定義は `docs/requirements/` ディレクトリで管理：

- **01_initial_hearing.md**: 基本要件ヒアリング結果
- **02_detailed_hearing.md**: 詳細機能仕様ヒアリング結果  
- **03_technical_hearing.md**: 技術仕様詳細ヒアリング結果
- **04_ui_ux_hearing.md**: UI/UX設計詳細ヒアリング結果
- **requirements_summary.md**: 最終統合要件定義書

### ドキュメント更新方針
- 要件変更時は該当ヒアリングドキュメントを更新
- 重要な変更は requirements_summary.md にも反映
- 技術仕様変更は関連する GitHub Issue も合わせて更新

### Firebase 設定管理
- 環境変数ファイル（.env）での設定管理
- ビルド時に特定のFirebaseプロジェクトを指定
- 認証なし・データ完全共有の方針