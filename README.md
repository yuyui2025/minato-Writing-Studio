# minato Writing Studio1

「港に届いた例外」執筆支援PWAアプリ

## セットアップ

```bash
# 依存インストール
npm install

# APIキーを設定
cp .env.example .env
# .envを編集してANTHROPIC_API_KEYを設定

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build
npm run preview
```

## デプロイ

### VPS / 自宅サーバー

```bash
npm run build
# dist/ フォルダをnginxやcaddyで配信

# nginx設定例
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

### Cloudflare Pages（無料）

```bash
npm run build
# dist/ をCloudflare Pagesにアップロード
# 環境変数 VITE_ANTHROPIC_API_KEY を設定
```

## スマホでのインストール（PWA）

1. Safariで開く
2. 共有ボタン →「ホーム画面に追加」
3. アプリとして起動できます

## ⚠️ セキュリティ注意

APIキーはフロントエンドに含まれるため、**自分専用の閉じた環境**での利用を推奨します。
外部公開する場合はバックエンドプロキシ経由でAPIキーを隠してください。

## データ保存

- ブラウザのlocalStorageに保存
- クリアすると消えるので定期的に「出力」からバックアップを
