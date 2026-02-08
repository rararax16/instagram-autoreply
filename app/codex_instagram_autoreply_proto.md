# Instagram DM/コメント 自動返信SaaS（プロトタイプ）— Codex 実装指示書  
（Nuxt 3 + MySQL + docker-compose / **UI言語：日本語固定**）

このMarkdownは **Codexに渡して実装を進めるための単一コンテキスト**です。  
対象は **Nuxt 3（server routes含む） + MySQL + Prisma** を使ったプロトタイプです。  
**アプリの利用者は日本国内向けのため、UI・文言・管理画面はすべて日本語で実装**します。

デプロイは **AWS EC2 1台に Web アプリ + DB を同居**させ、  
**docker-compose** によって起動・運用します。

---

## 0. ゴール（最終成果物）

- 日本語UIのWebアプリとして動作する
- ユーザーがアプリに登録 / ログインできる
- ユーザーが自身の Instagram ビジネスアカウントと連携できる
- Instagramの **DM / コメント** を受信し、設定したルールに応じて自動返信できる
- 返信ルールは **日本語UIの管理画面** でCRUDできる
- DBは **MySQL** を使用し、**アプリ側から簡単にマイグレーション**できる
- EC2上で docker-compose 一発起動できる

---

## 1. 要件（最新版・言語要件含む）

### 機能要件
- DMやコメントの **どのキーワードに対してどんな返信をするか** を設定できる
- DM / コメントを区別してルールを設定できる
- ルールは ON / OFF 切り替え可能

### 技術要件
- Nuxt3 を使ってアプリケーションを作成する
- バックエンドも Nuxt3 の server（Nitro）を使用する
- DBは MySQL を使用する
- Prisma を使い、マイグレーションを簡単に実行できる仕組みを採用する
- AWS EC2 1台に Web アプリ + DB を同居させる
- docker-compose を使用してプロトタイプを起動する

### 言語要件（重要）
- **アプリの表示言語は日本語のみ**
- 英語UIや多言語対応は行わない
- フロントエンドの文言例：
  - 「ログイン」「ログアウト」「ルール追加」「返信内容」「保存」など
- バリデーションエラー・APIエラーも日本語メッセージで返す

---

## 2. スコープ（プロトタイプ）

### やること
- ルール管理（CRUD / 有効・無効）
- 受信イベント（DM / コメント）の保存（ログ用途）
- キーワード一致（contains）で自動返信（固定テキスト）
- 多テナント設計（tenantIdでスコープ）
- docker-compose による Web + MySQL 起動
- Prisma migrate によるDBマイグレーション

### やらないこと（後回し）
- AI生成（LLM）
- 高度なテンプレート差し込み
- 管理者向け多言語UI
- ジョブキュー / 大規模非同期処理

---

## 3. 技術スタック

- Frontend: Nuxt 3（UIは日本語固定）
- Backend: Nuxt 3 server routes（Nitro）
- DB: MySQL（Docker）
- ORM / Migration: Prisma
- Deploy: AWS EC2 + docker-compose

---

## 4. 環境変数（.env）

```env
APP_BASE_URL="http://localhost:3000"
SESSION_SECRET="change-me-long-random"

DATABASE_URL="mysql://app_user:app_pass@mysql:3306/app_db"

TOKEN_ENCRYPTION_KEY="32-bytes-secret-key........"

META_APP_ID=""
META_APP_SECRET=""
META_WEBHOOK_VERIFY_TOKEN="your-verify-token"
```

---

## 5. UI実装ルール（日本語固定）

### 基本方針
- i18nライブラリは **使用しない**
- 文言は直接日本語で記述してOK（プロトタイプ優先）
- コンポーネント・APIレスポンスは日本語前提で設計

### 画面例（文言）
- ログイン画面
  - メールアドレス
  - パスワード
  - ログイン
- ルール管理
  - DM / コメント 切り替え
  - キーワード
  - 返信内容
  - 優先度
  - 有効 / 無効

---

## 6. DB設計（MySQL + Prisma）

（※ 構造は前バージョンと同じ。DM/コメント両対応）

- tenants
- users
- ig_accounts
- reply_rules
- inbound_events
- outbound_replies

> Prisma schema は **MySQL対応**で作成すること。
（詳細は前回mdの schema をそのまま使用）

---

## 7. マイグレーション運用

- 開発時：`prisma migrate dev`
- EC2（docker-compose）：`prisma migrate deploy`
- Webコンテナ起動時に migrate deploy を実行してからアプリ起動

---

## 8. API実装ルール

- APIレスポンスの `message` は日本語
- バリデーションエラー例：
  - 「キーワードは必須です」
  - 「返信内容を入力してください」

---

## 9. docker-compose 運用

- Web + MySQL を同一 compose で管理
- DBデータは volume 永続化
- プロトタイプでは MySQL を外部公開しなくてもよい

---

## 10. Done定義（プロトタイプ完了条件）

- 日本語UIでルール作成・編集ができる
- DM / コメント受信イベントを保存できる
- キーワード一致で返信処理が呼ばれる（送信はstubでも可）
- docker-compose で一発起動できる
- Prisma migrate deploy が正常に動作する

---

## 11. 実装タスク順

1. Nuxt3 プロジェクト作成（日本語UI前提）
2. Prisma + MySQL 接続
3. docker-compose 作成
4. 認証（ログイン / ログアウト）
5. ルールCRUD API + 日本語UI
6. Webhook受信（DM / コメント）
7. EC2デプロイ（プロトタイプ起動）

---

以上。
