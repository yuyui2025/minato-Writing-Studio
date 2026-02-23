# minato Writing Studio

「港に届いた例外」執筆支援PWA

Claude AI（Anthropic）と連携した日本語小説執筆ツールです。縦書きプレビュー・シーン管理・AI推敲など、創作に特化した機能を備えています。

---

## 機能一覧

- **シーン管理** — 章・タイトル・概要・ステータス（未着手 / 執筆中 / 完成）
- **構成ビュー** — 章ツリーで全体像を俯瞰・文字数集計
- **縦書きプレビュー** — iframeによる縦組み表示
- **AI支援**
  - 続き提案（200字）
  - 文章推敲（3案）
  - 執筆ヒント（3点）
  - 矛盾チェック
  - 概要自動生成
  - 世界観拡張メモ
- **自動保存** — 900msデバウンスでSupabaseに保存
- **バックアップ** — 最大5世代のバージョン履歴
- **出力** — Markdown / テキスト形式でエクスポート
- **PWA対応** — ホーム画面追加・オフライン対応

---

## 必要なもの

| サービス | 用途 |
|---------|------|
| [Anthropic](https://console.anthropic.com/) | Claude APIキー |
| [Supabase](https://supabase.com/) | 認証（Google OAuth）・データ保存 |
| [Vercel](https://vercel.com/)（推奨） | ホスティング・APIプロキシ |

---

## セットアップ

### 1. インストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集：

```
# Anthropic（開発時のみ使用。本番はサーバー側で設定）
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase の設定

Supabaseダッシュボードで以下を設定してください。

**Google OAuthの有効化：**
Authentication → Providers → Google をオン

**データテーブルの作成：**

```sql
create table minato_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  unique (user_id, key)
);

-- RLS（行レベルセキュリティ）を有効化
alter table minato_data enable row level security;

create policy "自分のデータのみ操作可"
  on minato_data for all
  using (auth.uid() = user_id);
```

### 4. 開発サーバーの起動

```bash
npm run dev
# http://localhost:5173
```

---

## デプロイ

### Vercel（推奨）

APIキーをサーバー側で管理できるため、最もセキュアな構成です。

1. GitHubにpush
2. Vercelにプロジェクトをインポート
3. 環境変数を設定：
   - `ANTHROPIC_API_KEY` — Anthropic APIキー（サーバー側）
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. デプロイ

`/api/anthropic` のサーバーレス関数がプロキシとして動作し、APIキーはブラウザに露出しません。

### Cloudflare Pages

```bash
npm run build
# dist/ をCloudflare Pagesにアップロード
# 環境変数 VITE_ANTHROPIC_API_KEY を設定
```

> **注意：** Cloudflare Pagesでは `api/anthropic.js` が動作しないため、APIキーがフロントエンドに含まれます。自分専用の閉じた環境での利用にとどめてください。

### VPS / 自宅サーバー

```bash
npm run build
# dist/ フォルダをnginxやcaddyで配信
```

nginx設定例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

APIキーを隠すには、バックエンドリバースプロキシを別途用意してください。

---

## スマホでのインストール（PWA）

1. Safari で開く
2. 共有ボタン →「ホーム画面に追加」
3. アプリとして起動できます（Android は Chrome から「アプリをインストール」）

---

## セキュリティ

- **Vercel デプロイ時：** APIキーはサーバーレス関数内にのみ存在し、ブラウザには露出しません
- **APIプロキシのバリデーション：** 使用モデル・トークン数・メッセージ形式を検証し、不正なリクエストを拒否します
- **認証：** Supabase Google OAuth によるユーザー認証。データはユーザーIDで厳密に分離されています（RLS）
- **縦書きエディタ：** iframeとのメッセージングはオリジン検証済み

---

## データ保存

- **Supabase**（ログイン時）にリアルタイム保存
- 自動保存（900msデバウンス）＋手動バックアップ（最大5世代）
- 「出力」機能でMarkdownまたはテキストとしてローカルにエクスポート可能

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript |
| ビルド | Vite 5 |
| 認証・DB | Supabase |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| PWA | vite-plugin-pwa |
| ホスティング | Vercel / Cloudflare Pages |
