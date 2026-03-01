# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
