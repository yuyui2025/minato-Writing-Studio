# Play ストア配信手順（TWA）

minato Writing Studio は **Trusted Web Activity（TWA）** を使って Android アプリとして Play ストアに配信できます。
TWA は Web アプリをそのまま Chrome ベースの Android アプリとしてラップする公式手法で、ネイティブ開発不要です。

---

## 前提条件

| 項目 | 内容 |
|------|------|
| Google Play Console アカウント | 初回登録料 $25（一回限り） |
| Java 17 以上 | `java -version` で確認 |
| Node.js 18 以上 | `node -v` で確認 |
| Android Studio（任意） | APK 署名・確認用 |
| Vercel デプロイ済みの本番 URL | HTTPS 必須 |

---

## ステップ 1: PWA 要件の確認

このリポジトリには以下がすでに含まれています:

- `vite.config.js` — `vite-plugin-pwa` による SW 自動生成・登録・マニフェスト出力
- `public/.well-known/assetlinks.json` — Digital Asset Links（後で更新）
- `public/icon-192.png` / `public/icon-512.png` — アイコン

ビルド後、`dist/manifest.webmanifest` と `dist/sw.js`（Workbox 生成）が出力されます。
デプロイ後、Chrome DevTools → Lighthouse → PWA スコアが 100 になることを確認してください。

---

## ステップ 2: Bubblewrap で TWA プロジェクトを生成

```bash
# Bubblewrap CLI をグローバルインストール
npm install -g @bubblewrap/cli

# TWA プロジェクトを初期化（別ディレクトリで実行）
mkdir minato-ws-twa && cd minato-ws-twa
bubblewrap init --manifest https://<あなたのVercelドメイン>/manifest.webmanifest
```

対話式で聞かれる主な項目:

| 項目 | 入力例 |
|------|--------|
| Application ID (Package Name) | `com.yourname.minatowritingstudio` |
| App name | `minato Writing Studio` |
| Short name | `minato ws` |
| Signing key path | `./minato-ws.keystore`（新規生成） |
| Key alias | `minato-ws` |

---

## ステップ 3: APK/AAB をビルド

```bash
# TWA ディレクトリで実行
bubblewrap build
```

生成物:
- `app-release-signed.apk` — テスト用
- `app-release-bundle.aab` — Play ストア提出用

---

## ステップ 4: Digital Asset Links を設定

Android アプリの署名情報を `public/.well-known/assetlinks.json` に書き込みます。

### SHA-256 フィンガープリントの取得

```bash
keytool -list -v -keystore ./minato-ws.keystore -alias minato-ws
```

出力の `SHA256:` の行をコピーして、`assetlinks.json` を更新:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourname.minatowritingstudio",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:..."
      ]
    }
  }
]
```

Vercel に再デプロイして、以下の URL で確認:

```
https://<あなたのドメイン>/.well-known/assetlinks.json
```

---

## ステップ 5: Play Console へ提出

1. [Google Play Console](https://play.google.com/console) にログイン
2. 「アプリを作成」→ アプリ名・言語・カテゴリを入力
3. 「内部テスト」トラックで `app-release-bundle.aab` をアップロード
4. ストア掲載情報を入力:
   - 説明文（短・長）
   - スクリーンショット（スマホ 2 枚以上）
   - 機能グラフィック（1024×500px）
   - アイコン（512×512px）
5. コンテンツレーティングアンケートに回答
6. 「本番」トラックに昇格してリリース申請

---

## ステップ 6: アップデート手順

Web アプリを更新する場合:
- Vercel デプロイのみ → **Android アプリの更新不要**（TWA は常に最新 Web を表示）
- パッケージ名・署名・マニフェスト変更時 → AAB を再ビルドして Play Console に提出

---

## トラブルシューティング

### TWA がブラウザ UI を表示してしまう

Digital Asset Links の検証失敗が原因です。

- `assetlinks.json` が正しい URL でアクセスできるか確認
- SHA-256 フィンガープリントが正確か確認
- Vercel の `Content-Type: application/json` ヘッダーを確認

### Bubblewrap ビルドエラー

```bash
# Android SDK のライセンス同意
bubblewrap doctor
```

`bubblewrap doctor` が自動で足りないツールを検出・インストールします。

---

## 関連ファイル

| ファイル | 役割 |
|---------|------|
| `vite.config.js` | VitePWA による SW・マニフェスト自動生成設定 |
| `public/.well-known/assetlinks.json` | Digital Asset Links（要更新） |
| `public/icon-192.png` | アイコン 192px |
| `public/icon-512.png` | アイコン 512px / Play ストア用 |
