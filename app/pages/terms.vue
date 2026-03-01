<script setup lang="ts">
const updatedAt = '2026年3月2日'
</script>

<template>
  <main class="terms-page">
    <section class="terms-card">
      <h1>利用規約</h1>
      <p class="lead">
        本利用規約（以下「本規約」）は、Instagram DM/コメント自動返信プロトタイプ（以下「本サービス」）の
        利用条件を定めるものです。本サービスを利用する場合、本規約に同意したものとみなします。
      </p>

      <section>
        <h2>1. 適用</h2>
        <p>本規約は、本サービスの利用に関する一切の関係に適用されます。</p>
      </section>

      <section>
        <h2>2. 提供内容</h2>
        <p>
          本サービスは、Instagram連携、DM/コメント受信ログ管理、自動返信ルール設定等の機能を提供します。
          なお、機能は予告なく変更・追加・停止される場合があります。
        </p>
      </section>

      <section>
        <h2>3. アカウント管理</h2>
        <p>
          利用者は、自身の登録情報およびログイン情報を適切に管理する責任を負います。
          不正利用の疑いがある場合は、速やかに運営者へ連絡してください。
        </p>
      </section>

      <section>
        <h2>4. 禁止事項</h2>
        <p>
          法令または公序良俗に反する行為、不正アクセス、システムへの過度な負荷、第三者の権利侵害、
          その他運営者が不適切と判断する行為を禁止します。
        </p>
      </section>

      <section>
        <h2>5. 免責事項</h2>
        <p>
          本サービスは現状有姿で提供され、特定目的適合性・完全性・継続性を保証しません。
          運営者は、本サービス利用により生じた損害について、法令上許される範囲で責任を負いません。
        </p>
      </section>

      <section>
        <h2>6. 利用停止・変更</h2>
        <p>
          運営者は、保守・障害対応・法令対応等のため、事前通知なく本サービスの一部または全部を
          停止または変更できるものとします。
        </p>
      </section>

      <section>
        <h2>7. データ削除について</h2>
        <p>
          利用者データの削除を希望する場合は、運営者への連絡により対応します。
          本人確認および法令上の保存義務等を確認したうえで、合理的な期間内に削除手続きを行います。
        </p>
      </section>

      <section>
        <h2>8. 規約の改定</h2>
        <p>本規約は、必要に応じて改定されることがあります。改定後の内容は本ページに掲載した時点で効力を生じます。</p>
      </section>

      <section>
        <h2>9. 準拠法・管轄</h2>
        <p>本規約の準拠法は日本法とし、本サービスに関する紛争は運営者所在地を管轄する裁判所を第一審の専属的合意管轄とします。</p>
      </section>

      <section>
        <h2>10. お問い合わせ</h2>
        <p>データ削除依頼を含むお問い合わせは、サービス提供者までご連絡ください。</p>
      </section>

      <p class="updated">最終更新日: {{ updatedAt }}</p>
      <p class="links">
        <NuxtLink to="/privacy">プライバシーポリシーを見る</NuxtLink>
      </p>
      <p class="links">
        <NuxtLink to="/login">ログイン画面へ戻る</NuxtLink>
      </p>
    </section>
  </main>
</template>

<style scoped>
.terms-page {
  min-height: 100vh;
  padding: 24px 16px;
  background: linear-gradient(160deg, #f4fff8 0%, #dceef5 100%);
  font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
}

.terms-card {
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
