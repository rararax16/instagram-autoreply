# リポジトリ運用ガイド（修正版）

本ドキュメントは、**日本向けInstagram DM/コメント自動返信プロトタイプ**
（Nuxt3 + MySQL + docker-compose）の開発・運用ルールを定義します。  
UI・管理画面・エラーメッセージは **すべて日本語固定** を前提とします。

---

## プロジェクト構成とモジュール配置

このリポジトリは **Nuxt 3 アプリ（app）** と **MySQL（db）** を  
`docker-compose.yml` で連携する構成です。

```
/
├─ app/        # Nuxt 3 アプリ本体（フロント + server）
├─ db/         # MySQL コンテナ設定
└─ docker-compose.yml
```

### 各ディレクトリの役割

- `app/`
  - フロントエンド + サーバー実装を含む Nuxt3 アプリ
  - `app.vue`, `nuxt.config.ts`, `server/`, `public/`
- `db/`
  - MySQL コンテナ設定
  - `Dockerfile`, `my.cnf`
  - 永続化用 volume（ローカルでは `mysql_data`）
- `docker-compose.yml`
  - Web（Nuxt）+ DB（MySQL）の起動定義
  - プロトタイプでは **1台のEC2で完結**させる前提

### 機能追加時の配置ルール（重要）

- 画面（ページ）: `app/pages/`
- 再利用UIコンポーネント: `app/components/`
- API（server routes）: `app/server/api/`
- サーバー共通処理・ビジネスロジック: `app/server/utils/`
- 外部API連携（Instagram等）: `app/server/services/`
- 静的アセット: `app/public/`
- DB定義・マイグレーション: `app/prisma/`

**以下の生成物はコミットしない**
- `app/node_modules/`
- `app/.nuxt/`
- `app/.output/`
- `db/mysql_data/`（volume）

---

## ビルド・開発・運用コマンド

### ローカル開発（Nuxt単体）
```bash
cd app
npm install
npm run dev        # http://localhost:3000
```

### ビルド関連
```bash
cd app
npm run build
npm run preview
```

### Docker（推奨：実運用に近い形）
```bash
docker compose up --build
docker compose down
```

### DBマイグレーション（Prisma）
```bash
cd app
npx prisma migrate dev      # 開発用
npx prisma migrate deploy   # docker / EC2 用
```

> **原則**
> - docker-compose 起動時に `prisma migrate deploy` を実行してからアプリを起動する
> - DB構造変更は必ず Prisma マイグレーション経由で行う

---

## コーディング規約と命名ルール

### 共通
- Nuxt 3 前提
- TypeScript / ESM を使用
- インデントは **2スペース**
- すべて UTF-8

### Vue / UI
- Vueコンポーネント名: **PascalCase**
  - 例: `ReplyRuleForm.vue`
- UI文言は **すべて日本語**
- i18nライブラリは使用しない（プロトタイプ優先）

### API / サーバー
- APIファイル名: **kebab-case**
  - 例: `reply-rules.post.ts`
- 関数名は役割が分かる命名にする
  - 例: `handleInstagramWebhook`
- APIレスポンス・エラーメッセージは **日本語**

---

## テスト方針

自動テストは最小構成とする（プロトタイプ優先）。

### 必須チェック
- `npm run build` が成功する
- `npm run dev` または `docker compose up` で正常起動
- 日本語UIで主要画面が表示される
- ルールCRUDが動作する

### 任意
- ロジック追加時は `app/tests/*.spec.ts` を追加
- 手動テスト手順をPRに必ず記載

---

## コミット・プルリクエスト方針

- コミットメッセージは **Conventional Commits**
  - `feat:`, `fix:`, `chore:`, `docs:`
- 1コミット = 1論理変更
- PRには以下を必ず含める
  - 目的 / 変更概要
  - 変更ファイル一覧
  - 動作確認手順
  - UI変更時はスクリーンショット
  - DBスキーマ変更時は migration 名

---

## セキュリティ・設定ルール

- 秘密情報は **`app/.env`** にのみ記載し、Git管理しない
- `docker-compose.yml` のデフォルトDB資格情報は
  - **本番では必ず変更**
- MySQL は **外部公開しない**
- Webhook エンドポイントは署名検証を行う
- EC2公開前に以下を必ず確認
  - セキュリティグループ
  - ポート（3000 / 80 / 443）
  - 環境変数

---

## 本プロジェクトの前提（重要）

- 日本向けサービス
- UI・管理画面・APIメッセージは **日本語固定**
- プロトタイプ段階では **1EC2・1DB構成**
- 将来のSaaS化を考慮しつつ、
  **今は実装速度と分かりやすさを最優先**

---

以上。
