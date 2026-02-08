# Instagram DM/コメント自動返信プロトタイプ

日本向けの Instagram DM/コメント自動返信プロトタイプです。  
Nuxt 3（フロント + server routes）と MySQL を `docker-compose` で動かします。

## 特徴

- UI・APIメッセージは日本語固定
- ユーザー登録 / ログイン
- Instagram OAuth 連携（アクセストークン手入力不要）
- 返信ルール CRUD（DM / コメント別、ON/OFF、優先度）
- 受信イベント保存とキーワード一致による自動返信（送信はスタブ）
- Prisma マイグレーション対応

## 技術スタック

- Frontend / Backend: Nuxt 3 (Nitro)
- DB: MySQL 8
- ORM: Prisma
- 実行環境: Docker Compose
- Instagram連携: Meta Graph API (`v24.0`)

## ディレクトリ構成

```text
.
├─ app/                # Nuxt 3 アプリ
│  ├─ pages/           # 画面
│  ├─ server/api/      # API ルート
│  ├─ server/utils/    # サーバー共通処理
│  ├─ server/services/ # 外部API連携
│  └─ prisma/          # Prisma schema / migrations
├─ db/                 # MySQL コンテナ設定
└─ docker-compose.yml
```

## セットアップ

### 1. 環境変数を用意

`app/.env.example` を参考に `app/.env` を設定してください。

最低限、以下を本番値に変更してください。

- `SESSION_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`
- `APP_BASE_URL`

### 2. 起動

```bash
docker compose up --build
```

バックグラウンド起動:

```bash
docker compose up --build -d
```

停止:

```bash
docker compose down
```

## ローカル開発（Nuxt単体）

```bash
cd app
npm install
npm run dev
```

ビルド確認:

```bash
cd app
npm run build
```

## DBマイグレーション

開発:

```bash
cd app
npx prisma migrate dev
```

デプロイ:

```bash
cd app
npx prisma migrate deploy
```

## Instagram連携（OAuth）

ログイン後、ダッシュボードの「Instagramと連携する」ボタンを押すと、Meta認可画面へ遷移します。  
認可後、連携アカウントが自動で保存されます。

### Meta App 側で必要な設定

- OAuth リダイレクトURI:
  - `http://localhost:3000/api/ig-accounts/oauth/callback`
  - 本番は `APP_BASE_URL` に合わせたURL
- 必要権限（例）:
  - `instagram_basic`
  - `instagram_manage_messages`
  - `instagram_manage_comments`
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_metadata`
  - `business_management`

## 主要エンドポイント

- 認証
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Instagram連携
  - `GET /api/ig-accounts`
  - `GET /api/ig-accounts/oauth/start`
  - `GET /api/ig-accounts/oauth/callback`
  - `PATCH /api/ig-accounts/:id`
  - `DELETE /api/ig-accounts/:id`
- 返信ルール
  - `GET /api/reply-rules`
  - `POST /api/reply-rules`
  - `PUT /api/reply-rules/:id`
  - `DELETE /api/reply-rules/:id`
- 受信イベント
  - `GET /api/inbound-events`
  - `POST /api/inbound-events`
- Webhook
  - `GET /api/webhooks/instagram`
  - `POST /api/webhooks/instagram`

## 注意事項

- プロトタイプのため、返信送信は現在スタブ実装です。
- `app/.env` はGit管理しないでください。
- 本番では DB資格情報・秘密鍵を必ず変更してください。
