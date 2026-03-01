<script setup lang="ts">
type UserRole = 'ADMIN' | 'MEMBER'

type UserRow = {
  id: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

const notice = ref('')
const errorMessage = ref('')
const submitting = ref(false)
const editingUserId = ref<string | null>(null)

const { data: meData } = await useFetch('/api/auth/me')

if (!meData.value?.authenticated) {
  await navigateTo('/login')
}

if (meData.value?.user?.role !== 'ADMIN') {
  await navigateTo('/dashboard')
}

const { data: usersData, refresh: refreshUsers } = await useFetch('/api/users')
const users = computed<UserRow[]>(() => usersData.value?.users || [])

const form = reactive<{
  email: string
  password: string
  role: UserRole
}>({
  email: '',
  password: '',
  role: 'MEMBER'
})

function setNotice(message: string) {
  notice.value = message
  errorMessage.value = ''
}

function setError(message: string) {
  errorMessage.value = message
  notice.value = ''
}

function resetForm() {
  editingUserId.value = null
  form.email = ''
  form.password = ''
  form.role = 'MEMBER'
}

function editUser(user: UserRow) {
  editingUserId.value = user.id
  form.email = user.email
  form.password = ''
  form.role = user.role
}

async function saveUser() {
  submitting.value = true

  try {
    if (editingUserId.value) {
      const body: {
        email?: string
        password?: string
        role?: UserRole
      } = {
        email: form.email,
        role: form.role
      }

      if (form.password) {
        body.password = form.password
      }

      await $fetch(`/api/users/${editingUserId.value}`, {
        method: 'PUT',
        body
      })
      setNotice('ユーザー情報を更新しました')
    }
    else {
      await $fetch('/api/users', {
        method: 'POST',
        body: {
          email: form.email,
          password: form.password,
          role: form.role
        }
      })
      setNotice('ユーザーを作成しました')
    }

    resetForm()
    await refreshUsers()
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || 'ユーザー操作に失敗しました')
  }
  finally {
    submitting.value = false
  }
}

async function deleteUser(user: UserRow) {
  if (!confirm(`${user.email} を削除しますか？`)) {
    return
  }

  try {
    await $fetch(`/api/users/${user.id}`, {
      method: 'DELETE'
    })
    setNotice('ユーザーを削除しました')
    await refreshUsers()
  }
  catch (error: any) {
    setError(error?.data?.message || error?.data?.statusMessage || 'ユーザー削除に失敗しました')
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ja-JP')
}
</script>

<template>
  <main class="users-page">
    <header class="top-header">
      <div>
        <h1>ユーザーマスター（システム管理者）</h1>
        <p>システム管理者のみ全ユーザーの作成・更新・削除ができます。</p>
      </div>
      <NuxtLink class="back-link" to="/dashboard">ダッシュボードへ戻る</NuxtLink>
    </header>

    <p v-if="notice" class="notice">{{ notice }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <section class="card">
      <h2>{{ editingUserId ? 'ユーザー編集' : 'ユーザー作成' }}</h2>

      <div class="grid two">
        <label>
          メールアドレス
          <input v-model="form.email" type="email" placeholder="you@example.com" required />
        </label>
        <label>
          ロール
          <select v-model="form.role">
            <option value="MEMBER">一般</option>
            <option value="ADMIN">管理者</option>
          </select>
        </label>
      </div>

      <label>
        パスワード
        <input
          v-model="form.password"
          type="password"
          :placeholder="editingUserId ? '変更しない場合は空欄' : '8文字以上'"
        />
      </label>

      <div class="actions">
        <button class="action" :disabled="submitting" @click="saveUser">
          {{ submitting ? '保存中...' : editingUserId ? '更新する' : '作成する' }}
        </button>
        <button v-if="editingUserId" class="secondary" @click="resetForm">編集をキャンセル</button>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>ユーザー一覧</h2>
        <button class="secondary" @click="() => refreshUsers()">再読み込み</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>メールアドレス</th>
              <th>ロール</th>
              <th>作成日時</th>
              <th>更新日時</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.email }}</td>
              <td>{{ user.role === 'ADMIN' ? '管理者' : '一般' }}</td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>{{ formatDate(user.updatedAt) }}</td>
              <td>
                <div class="row-actions">
                  <button class="mini" @click="editUser(user)">編集</button>
                  <button class="mini danger" @click="deleteUser(user)">削除</button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="5">ユーザーはまだ登録されていません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.users-page {
  min-height: 100vh;
  padding: 18px;
  background: linear-gradient(180deg, #f7fbff 0%, #eaf4f8 100%);
  font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
  color: #18303d;
}

.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

h1 {
  margin: 0;
  font-size: 24px;
}

h2 {
  margin: 0 0 12px;
  font-size: 20px;
}

p {
  margin: 4px 0;
}

.back-link {
  background: #d6e5eb;
  color: #1f3f4f;
  text-decoration: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 700;
}

.notice {
  background: #def7eb;
  border: 1px solid #87c9a8;
  border-radius: 10px;
  padding: 10px;
}

.error {
  background: #ffe7e4;
  border: 1px solid #e79a91;
  border-radius: 10px;
  padding: 10px;
}

.card {
  background: #ffffff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(14, 44, 61, 0.08);
  margin-bottom: 16px;
}

.grid {
  display: grid;
  gap: 10px;
}

.grid.two {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

label {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
  font-weight: 600;
}

input,
select {
  border: 1px solid #90aeb8;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action,
.secondary,
.mini {
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.action {
  background: #0c7d5f;
  color: #fff;
}

.secondary {
  background: #d6e5eb;
  color: #1f3f4f;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.mini {
  padding: 6px 10px;
  background: #dbe7ed;
  color: #13394b;
}

.mini.danger {
  background: #f6d6d1;
  color: #7b1f13;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #dbe7ed;
  text-align: left;
  padding: 10px 8px;
  vertical-align: top;
  font-size: 14px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .users-page {
    padding: 12px;
  }

  .top-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .row-actions {
    flex-wrap: wrap;
  }
}
</style>
