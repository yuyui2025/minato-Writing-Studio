# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 作業フロー

### 起動時
- Linear の Issue を取得して内容を確認・分類する
- Linear MCP が利用できない場合は GitHub Issues を参照する（`mcp__github__list_issues`）

### 作業開始時
- 必ず新しいブランチを切ってから作業を開始する
- ブランチ名は対応する Issue 番号・内容に基づいて命名する

### 作業終了時
- 作業完了後は PR を作成して提出する

---

## コマンド

```bash
npm run dev        # 開発サーバー起動 (http://localhost:5173)
npm run build      # 型チェック + 本番ビルド
npm run lint       # ESLint
npm run typecheck  # TypeScript 型チェック
npm run test       # Vitest（watch モード）
npm run test:run   # Vitest（単発実行）

# 特定テストファイルを実行
npx vitest run src/__tests__/ai.test.ts

# Rust/WASM のビルド（text-analyzer を変更した場合のみ必要）
npm run build:wasm
```

### 環境変数

`.env`（開発時）に以下が必要：

```env
# 開発時のみ（本番は Vercel 側で設定）
ANTHROPIC_API_KEY=sk-ant-...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

**Vercel 本番環境変数（サーバー側）**

```env
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...          # admin 操作用
BYOK_ENCRYPTION_KEY=...                # 64文字 hex（AES-256-GCM 鍵）
PLAN_FREE_DAILY_LIMIT=10               # 省略時デフォルト
PLAN_FREE_MONTHLY_LIMIT=100
PLAN_PRO_DAILY_LIMIT=100
PLAN_PRO_MONTHLY_LIMIT=2000
```

**クライアント側（ビルド時 `.env`）**

```env
VITE_KOFI_URL=https://ko-fi.com/...    # ドネーションボタン（未設定で非表示）
VITE_AD_CLIENT=...                     # AdSense クライアント ID（未設定でプレースホルダー）
VITE_AD_SLOT=...                       # AdSense スロット ID
```

テスト実行時は `vitest.config.ts` でモック値が自動設定される。

---

## アーキテクチャ概要

### 全体構造

```
App.tsx
 └─ StudioProvider (src/contexts/StudioContext.tsx)  ← 副作用専用
     └─ Studio コンポーネント
         ├─ Header / Sidebar / Modal 群
         ├─ WriteView / StructureView / SettingsView / PrefsView
         └─ AiAssistant
```

**認証フロー**: `App.tsx` が Supabase セッションを管理し、`authenticated` / `offline` / `select` の 3 状態を持つ。`StudioProvider` は `user` prop を受け取る。

### 状態管理

全状態は **単一の Zustand ストア** (`src/stores/useStudioStore.ts`) に集約されている。

- `useStudio()` フック = `useStudioStore` の再エクスポート（後方互換ラッパー）
- `StudioProvider` は状態を持たず、副作用（初期ロード・自動保存・テーマ・WASM 解析・オフライン同期）のみを担当
- `computeDerived()` ヘルパーが `selectedScene` / `manuscriptText` / `wordCount` を `scenes`・`manuscripts`・`selectedSceneId` から同期的に再計算する

### データ永続化

`src/utils/storage.ts` の `storageGet` / `storageSet`:
- **localStorage を一次ストア**として扱い、その成否を保存結果とする
- Supabase 同期はベストエフォート（失敗しても `storageSet` は `true` を返す）
- ログイン時は `updated_at` で新しい方を採用（ローカルが新しければローカル優先）

ストレージキーはすべて `minato:` プレフィックス（例: `minato:scenes`, `minato:manuscripts`）。

自動保存は 1000ms デバウンス、自動バックアップは 10 分間隔（最大 5 世代）。

### AI 連携

`src/utils/ai.ts` の `callAnthropic()` が `/api/anthropic/v1/messages` へ POST する。

- **開発時**: `vite.config.js` のプロキシが `ANTHROPIC_API_KEY` をヘッダーに付与して `https://api.anthropic.com` へ転送
- **本番 (Vercel)**: `api/anthropic.ts` のサーバーレス関数が `ANTHROPIC_API_KEY` を秘匿したままプロキシ
- 許可モデル: `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001`
- `max_tokens` 上限: 2000（サーバー側で強制）
- 4xx エラーはリトライしない。ネットワーク障害のみ最大 2 回リトライ（1s, 2s 待機）

### Rust/WASM テキスト解析

`rust/text-analyzer/` に Rust クレートがあり、`wasm-pack` でビルドして `src/wasm/text_analyzer/` に出力される。

`src/utils/textAnalyzer.ts` の `analyzeText()` / `parseDocument()` が動的インポートで遅延ロードする。`StudioProvider` が原稿変更後 500ms デバウンスで呼び出し、`TextMetrics`（文字数・文数・漢字率・読書時間など）を更新する。

### プロジェクト管理

`ProjectRecord[]` が `minato:projects` キーで永続化される。`createProject()` / `switchProject()` でプロジェクト切り替え時に現在の状態を一覧へ保存してから新しいプロジェクトを読み込む。

### プラン・クレジットシステム

`api/_lib/planConfig.ts` にプランごとの上限値を定義（環境変数でオーバーライド可）。

```
Free:  10/日,  100/月
Pro:  100/日, 2000/月
BYOK: 無制限
```

- `api/_lib/credits.ts` の `checkAndConsumeCredit()` がリクエストごとにアトミックに消費
- Supabase RPC `check_and_consume_credit()` でレースコンディションを排除
- クレジット消費は `standard` モードのみ。BYOK モードはスキップ
- `src/hooks/useCredits.ts` がクライアント側で 30s ポーリング
- `src/hooks/useUserProfile.ts` がプラン情報を取得（staleTime: 10s）

### BYOK（Bring Your Own Key）

ユーザーが自分の Anthropic API キーを使うモード。クレジット消費なし。

| モード | キー保存先 | 複数端末 |
|--------|-----------|---------|
| `byok_local` | ブラウザ localStorage | 不可 |
| `byok_cloud` | Supabase（AES-256-GCM 暗号化） | 可 |

- `ALLOW_BYOK_LOCAL` / `ALLOW_BYOK_CLOUD` サーバー環境変数で実行制御
- `VITE_ENABLE_BYOK_LOCAL` / `VITE_ENABLE_BYOK_CLOUD` クライアント環境変数で UI 表示制御

### Supabase マイグレーション

`supabase/migrations/` に 001〜009 の SQL ファイル。**番号順に適用が必須**。

```bash
# Supabase CLI（Scoop でインストール）
supabase login
supabase link --project-ref <ref>
supabase db push
```

手動適用の場合は Supabase ダッシュボードの SQL エディタに順番に貼り付け。各ファイルは冪等（`create table if not exists` / `create or replace`）。

### テスト

`src/__mocks__/` にモジュールモックを配置。Supabase・WASM モジュールはモックされている。テストファイルは `src/__tests__/` に集約。

---

## 型定義

コアデータ型はすべて `src/types.ts` に定義：

- `Scene`: シーン（章・タイトル・ステータス・あらすじ）
- `Manuscripts`: `Record<number, string>`（シーン ID → 本文）
- `Settings`: 世界観・登場人物・テーマのテキスト
- `AiResults` / `AiLoading` / `AiErrors`: AI 機能ごとのキーを持つ Record
- `TabKey`: `"write" | "structure" | "settings" | "prefs" | "ai"`
- `AiMode`: `"standard" | "byok_local" | "byok_cloud"`
- `UserPlan`: `"free" | "pro" | "byok"`
- `UserCredits`: `{ dailyUsed, dailyLimit, monthlyUsed, monthlyLimit }`
- `UserProfile`: `{ plan: UserPlan }`
