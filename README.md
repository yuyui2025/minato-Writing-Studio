# minato Writing Studio

汎用的な日本語執筆向けの PWA（Progressive Web App）です。  
アウトライン管理・エディタ・縦書きプレビュー・AI支援を1つにまとめ、短編から長編、ブログ下書き、資料作成まで幅広い執筆ワークフローに対応します。

---

## 主な特徴

- **プロジェクト/シーン管理**
  - 章・セクション単位で構成を整理
  - タイトル、概要、ステータス（未着手 / 執筆中 / 完成）を管理
- **構成ビュー**
  - ツリー形式で全体構成を俯瞰
  - シーンごとの文字数集計
- **執筆ビュー**
  - 集中しやすいエディタレイアウト
  - テキストとメタ情報を同時編集
- **縦書きプレビュー**
  - 日本語原稿の見え方を縦組みで確認
- **AI執筆支援（Claude連携）**
  - 続き提案、推敲、執筆ヒント、矛盾チェック
  - 概要生成、世界観メモ補助
- **自動保存 + バックアップ**
  - 900ms デバウンスで自動保存
  - 最大5世代の手動バックアップ
- **エクスポート**
  - Markdown / テキスト形式で出力
- **PWA対応**
  - ホーム画面追加
  - オフラインでも基本操作が可能

---

## 想定ユースケース

- 小説・シナリオ・エッセイなどの長文執筆
- ブログ記事や技術記事の下書き
- 研究メモや企画書の構成整理
- AIを使った初稿作成・リライト補助

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite 5 |
| 認証・DB | Supabase |
| AI | Anthropic Claude |
| PWA | vite-plugin-pwa |
| ホスティング | Vercel / Cloudflare Pages / その他静的配信 + APIプロキシ |

---

## 必要なもの

| サービス | 用途 |
|---|---|
| [Anthropic](https://console.anthropic.com/) | Claude APIキー |
| [Supabase](https://supabase.com/) | 認証（Google OAuth）・データ保存 |
| [Vercel](https://vercel.com/)（推奨） | APIキーを秘匿したまま配信（Serverless API） |

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集：

```env
# Anthropic（開発時のみ使用。推奨: 本番はサーバー側で設定）
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase の初期設定

Supabase ダッシュボードで以下を設定します。

- Authentication → Providers → **Google** を有効化
- SQL Editor で以下を実行

```sql
create table minato_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  unique (user_id, key)
);

alter table minato_data enable row level security;

create policy "Users can access only own rows"
  on minato_data for all
  using (auth.uid() = user_id);
```

### 4. 開発サーバー起動

```bash
npm run dev
# http://localhost:5173
```

---

## 利用可能なコマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 型チェック + 本番ビルド
npm run preview    # ビルド成果物のローカル確認
npm run lint       # ESLint
npm run typecheck  # TypeScript型チェック
npm run test       # Vitest（watch）
npm run test:run   # Vitest（単発実行）
```

---

## デプロイ

### Vercel（推奨）

1. GitHubへ push
2. Vercel にプロジェクトをインポート
3. 環境変数を設定
   - `ANTHROPIC_API_KEY`（サーバー側）
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. デプロイ

`/api/anthropic` がプロキシとして機能し、APIキーをクライアントへ露出せずに AI 機能を利用できます。

### Cloudflare Pages

```bash
npm run build
```

`dist/` をアップロードして配信可能です。  
ただし `api/anthropic.ts` は Cloudflare Pages Functions の設定なしでは動作しないため、AI機能を使うには別途バックエンドプロキシが必要です。

### VPS / 自前サーバー

```bash
npm run build
```

`dist/` を Nginx / Caddy 等で静的配信してください。AI機能を有効化する場合は API キーを秘匿する中継APIを別途用意してください。

---

## PWAとしてインストール

- **iOS (Safari)**: 共有 → 「ホーム画面に追加」
- **Android (Chrome)**: 「アプリをインストール」

---

## セキュリティ

- APIキーは**本番ではサーバー側管理**を推奨
- APIプロキシでリクエストの妥当性チェックを実施
- Supabase RLSでユーザーごとにデータアクセスを分離
- 縦書きプレビューの iframe 通信はオリジン検証を実施

---

## リリース情報

変更履歴は以下を参照してください。

- [`RELEASE_NOTES.md`](./RELEASE_NOTES.md)
- [`CHANGELOG.md`](./CHANGELOG.md)
