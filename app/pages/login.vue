<script setup lang="ts">
const mode = ref<'login' | 'register'>('login')

const tenantName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const { data: meData } = await useFetch('/api/auth/me')

if (meData.value?.authenticated) {
  await navigateTo('/dashboard')
}

async function submit() {
  loading.value = true
  errorMessage.value = ''

  try {
    if (mode.value === 'register') {
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: {
          tenantName: tenantName.value,
          email: email.value,
          password: password.value
        }
      })
    }
    else {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: email.value,
          password: password.value
        }
      })
    }

    await navigateTo('/dashboard')
  }
  catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || '処理に失敗しました'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <h1>Instagram 自動返信プロトタイプ</h1>
      <p class="lead">日本語UIでDM/コメント自動返信ルールを管理できます。</p>

      <div class="mode-buttons">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">ログイン</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">新規登録</button>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <label v-if="mode === 'register'">
          テナント名
          <input v-model="tenantName" type="text" placeholder="例: 株式会社サンプル" />
        </label>

        <label>
          メールアドレス
          <input v-model="email" type="email" placeholder="you@example.com" required />
        </label>

        <label>
          パスワード
          <input v-model="password" type="password" placeholder="8文字以上" required />
        </label>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button class="submit" :disabled="loading">
          {{ loading ? '送信中...' : mode === 'login' ? 'ログイン' : '登録する' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  background: linear-gradient(160deg, #f4fff8 0%, #dceef5 100%);
  font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
}

.auth-card {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(28, 58, 75, 0.15);
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #1a2f3a;
}

.lead {
  margin: 8px 0 20px;
  color: #395261;
}

.mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.mode-buttons button {
  border: none;
  border-radius: 10px;
  padding: 10px;
  background: #d7e9ef;
  color: #1f3b4a;
  font-weight: 700;
  cursor: pointer;
}

.mode-buttons button.active {
  background: #158465;
  color: #ffffff;
}

.auth-form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 6px;
  color: #223d4c;
  font-weight: 600;
}

input {
  width: 100%;
  border: 1px solid #9eb9c3;
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
}

.error {
  margin: 0;
  color: #c0392b;
}

.submit {
  border: none;
  border-radius: 10px;
  background: #0f6a51;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 12px;
  cursor: pointer;
}

.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
