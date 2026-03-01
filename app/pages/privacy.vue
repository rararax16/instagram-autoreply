<script setup lang="ts">
const updatedAt = '2026年3月2日'
</script>

<template>
  <main class="privacy-page">
    <section class="privacy-card">
      <h1>プライバシーポリシー</h1>
      <p class="lead">
        本ポリシーは、Instagram DM/コメント自動返信プロトタイプ（以下「本サービス」）における、
        利用者情報の取り扱いについて定めるものです。
      </p>

      <section>
        <h2>1. 取得する情報</h2>
        <p>
          本サービスは、アカウント登録情報（メールアドレス等）、Instagram連携時に必要な識別情報、
          受信したDM/コメント本文、送受信イベントの履歴を取得します。
        </p>
      </section>

      <section>
        <h2>2. 利用目的</h2>
        <p>
          取得した情報は、ログイン認証、Instagramアカウント連携、自動返信機能の提供、
          不正利用防止、運用上の問い合わせ対応のために利用します。
        </p>
      </section>

      <section>
        <h2>3. 第三者提供</h2>
        <p>
          法令に基づく場合を除き、利用者の同意なく個人情報を第三者へ提供しません。
        </p>
      </section>

      <section>
        <h2>4. 外部サービスとの連携</h2>
        <p>
          本サービスはMetaが提供するInstagram関連APIを利用します。連携時のデータ取り扱いは、
          Metaの利用規約およびプライバシーポリシーにも従います。
        </p>
      </section>

      <section>
        <h2>5. 安全管理</h2>
        <p>
          本サービスは、アクセス制御、暗号化保存、ログ管理等の合理的な安全管理措置を講じます。
          ただし、インターネット通信の性質上、完全な安全性を保証するものではありません。
        </p>
      </section>

      <section>
        <h2>6. 開示・訂正・削除</h2>
        <p>
          利用者本人からの請求があった場合、法令の定めに従い、保有情報の開示・訂正・削除に対応します。
        </p>
      </section>

      <section>
        <h2>7. 改定</h2>
        <p>
          本ポリシーは、必要に応じて改定する場合があります。重要な変更がある場合は、
          本ページ上で告知します。
        </p>
      </section>

      <section>
        <h2>8. お問い合わせ</h2>
        <p>
          本ポリシーに関するお問い合わせは、サービス提供者までご連絡ください。
        </p>
      </section>

      <p class="updated">最終更新日: {{ updatedAt }}</p>
      <p class="links">
        <NuxtLink to="/login">ログイン画面へ戻る</NuxtLink>
      </p>
    </section>
  </main>
</template>

<style scoped>
.privacy-page {
  min-height: 100vh;
  padding: 24px 16px;
  background: linear-gradient(160deg, #f4fff8 0%, #dceef5 100%);
  font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
}

.privacy-card {
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(28, 58, 75, 0.15);
  color: #1a2f3a;
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

.lead {
  margin: 0 0 24px;
  color: #395261;
  line-height: 1.8;
}

section {
  margin-bottom: 16px;
}

h2 {
  margin: 0 0 6px;
  font-size: 18px;
}

p {
  margin: 0;
  line-height: 1.8;
}

.updated {
  margin-top: 24px;
  font-size: 14px;
  color: #526b78;
}

.links {
  margin-top: 12px;
}

a {
  color: #0f6a51;
  text-decoration: none;
  font-weight: 700;
}

a:hover {
  text-decoration: underline;
}
</style>
