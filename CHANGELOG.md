# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **ZIP ファイルのインポートに対応（YUY-43）**
  - `fflate` を依存追加（軽量 zip ライブラリ、動的インポートで遅延ロード）。
  - zip 内の `.md` / `.txt` を名前順にすべて展開・結合して解析。`__MACOSX` 等のメタファイルを除外。
  - エンコード自動検出（UTF-8 BOM / UTF-8 / Shift-JIS）を zip 内ファイルにも適用。
  - ドロップゾーンとファイル選択で `.zip` を受け付けるよう更新。
- **インポートモード選択を追加（YUY-38）**
  - `ImportModal` の Preview ステップに「新規プロジェクト / 既存に追加 / 現在を置き換え」の選択 UI を追加（デフォルト: 新規プロジェクト）。
  - `useStudioStore` に `appendToProject`（シーン追加・設定変更なし）と `createProjectFromImport`（新規プロジェクト作成＋インポート）を追加。
  - 「追加」モードではキャラ・世界観フィールドを非表示にしてシンプルに。

### Fixed
- **AI提案を「閉じる」後も内容を保持するよう修正（YUY-34）**
  - `AiPanel` に `dismissed` ローカル状態を追加。「閉じる」はストアの result をクリアせず、ローカルで非表示にするだけに変更。新しい result が来たら自動リセット。
- **サイドパネル展開ボタンで執筆ビューに自動切替（YUY-35）**
  - ▶ ボタン（サイドバー折り畳み時）クリックで `setSidebarOpen(true)` と同時に `setTab("write")` を呼ぶよう変更。
- **カスタムスクロールバーを全体適用（YUY-45）**
  - `src/index.css` を新規作成して `::-webkit-scrollbar` スタイルを定義（6px・ダーク系テーマ統一）。`main.tsx` でインポート。
- **タイトル未反映・AI履歴未分離・文字化けバグを修正（YUY-41/42/44）**
- **退出ボタンでログアウトされない問題を修正し、再ログインボタンを追加（YUY-40）**
- **自動保存をサイレント化し「保存中」表示を手動保存のみに限定（YUY-19）**
- **サイドバーのリサイズハンドルを固定モード時のみ表示・位置を修正（YUY-31）**

### Changed
- **状態管理を React Context から Zustand に完全移行**
  - `src/stores/useStudioStore.ts` を新規作成。全ステート・アクションを Zustand ストアに一元管理。
  - `StudioContext.tsx` をデータロード・副作用（自動保存・テーマ・オフライン同期・自動バックアップ）専用のラッパーに刷新（399行 → 144行）。
  - `useStudio()` の API は後方互換を維持。全コンポーネントを変更せずに移行完了。
  - テスト間のストア状態汚染を防ぐ `resetStudioStore()` をエクスポートし、`StudioContext.test.tsx` の `beforeEach` / `afterEach` で呼び出すよう修正。

## [1.0.0] - 2026-02-27

### Added
- Initial release of Minato Writing Studio.
- `src/contexts/StudioContext.tsx`（React Context API）によるアプリ全体の状態管理。`useStudioState` フックからの移行でプロップドリルを解消。
- データ永続化・Supabase 同期ロジックを `src/utils/storage.ts` に抽出し、関心の分離を強化。
- `useStudio` フックで全コンポーネントがコンテキストを消費できる構成。
- テストスイートを Context ベースのアーキテクチャに対応。
- リリースワークフロー（`.github/workflows/release.yml`）を追加し、テスト・ビルド・パッケージング・GitHub Release 公開を自動化。
