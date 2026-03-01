<script setup lang="ts">
import type { EventChannel } from '@prisma/client'

type ReplyRule = {
  id: string
  channel: EventChannel
  keyword: string
  replyText: string
  priority: number
  isActive: boolean
  createdAt: string
}

type InboundEvent = {
  id: string
  channel: EventChannel
  senderId: string
  senderUsername: string | null
  isSelfEvent: boolean
  content: string
  createdAt: string
  outboundReplies: Array<{
    id: string
    status: string
    replyText: string
    errorMessage: string | null
  }>
}

type IgAccount = {
  id: string
  platformUserId: string
  username: string
  enabled: boolean
  updatedAt: string
}

const route = useRoute()
const oauthConnectPath = '/api/ig-accounts/oauth/start'

const notice = ref('')
const errorMessage = ref('')
const submitting = ref(false)

const { data: meData } = await useFetch('/api/auth/me')

if (!meData.value?.authenticated) {
  await navigateTo('/login')
}

const isAdmin = computed(() => meData.value?.user?.role === 'ADMIN')

const { data: rulesData, refresh: refreshRules } = await useFetch('/api/reply-rules')
const { data: eventsData, refresh: refreshEvents } = await useFetch('/api/inbound-events')
const { data: accountsData, refresh: refreshAccounts } = await useFetch('/api/ig-accounts')

const rules = computed<ReplyRule[]>(() => rulesData.value?.rules || [])
const events = computed<InboundEvent[]>(() => eventsData.value?.events || [])
const accounts = computed<IgAccount[]>(() => accountsData.value?.accounts || [])

const editingRuleId = ref<string | null>(null)
const ruleForm = reactive({
  channel: 'DM' as EventChannel,
  keyword: '',
  replyText: '',
  priority: 100,
  isActive: true
})

const inboundForm = reactive({
  channel: 'DM' as EventChannel,
  senderId: '',
  senderUsername: '',
  content: ''
})

function resetRuleForm() {
  editingRuleId.value = null
  ruleForm.channel = 'DM'
  ruleForm.keyword = ''
  ruleForm.replyText = ''
  ruleForm.priority = 100
  ruleForm.isActive = true
}

function setNotice(message: string) {
  notice.value = message
  errorMessage.value = ''
}

function setError(message: string) {
  errorMessage.value = message
  notice.value = ''
}

function getSingleQueryParam(value: string | string[] | undefined): string {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0] || ''
  }

  return ''
}

onMounted(async () => {
  const connectedCount = getSingleQueryParam(route.query.ig_connected as string | string[] | undefined)
  const oauthError = getSingleQueryParam(route.query.ig_error as string | string[] | undefined)

  if (oauthError) {
    setError(oauthError)
  }
  else if (connectedCount) {
    setNotice(`Instagram連携が完了しました（${connectedCount}件）`)
    await refreshAccounts()
  }

  if (oauthError || connectedCount) {
    await navigateTo('/dashboard', { replace: true })
  }
})

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

async function saveRule() {
  submitting.value = true

  try {
    if (editingRuleId.value) {
      await $fetch(`/api/reply-rules/${editingRuleId.value}`, {
        method: 'PUT',
        body: ruleForm
      })
      setNotice('返信ルールを更新しました')
    }
    else {
      await $fetch('/api/reply-rules', {
        method: 'POST',
        body: ruleForm
      })
      setNotice('返信ルールを追加しました')
    }

    resetRuleForm()
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '返信ルールの保存に失敗しました')
  }
  finally {
    submitting.value = false
  }
}

function editRule(rule: ReplyRule) {
  editingRuleId.value = rule.id
  ruleForm.channel = rule.channel
  ruleForm.keyword = rule.keyword
  ruleForm.replyText = rule.replyText
  ruleForm.priority = rule.priority
  ruleForm.isActive = rule.isActive
}

async function toggleRule(rule: ReplyRule) {
  try {
    await $fetch(`/api/reply-rules/${rule.id}`, {
      method: 'PUT',
      body: {
        isActive: !rule.isActive
      }
    })
    setNotice('ルールの有効状態を更新しました')
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '有効状態の更新に失敗しました')
  }
}

async function deleteRule(ruleId: string) {
  if (!confirm('このルールを削除しますか？')) {
    return
  }

  try {
    await $fetch(`/api/reply-rules/${ruleId}`, {
      method: 'DELETE'
    })
    setNotice('返信ルールを削除しました')
    await refreshRules()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '返信ルールの削除に失敗しました')
  }
}

async function toggleAccount(account: IgAccount) {
  try {
    await $fetch(`/api/ig-accounts/${account.id}`, {
      method: 'PATCH',
      body: {
        enabled: !account.enabled
      }
    })

    setNotice('Instagram連携アカウントの状態を更新しました')
    await refreshAccounts()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || 'Instagram連携アカウントの更新に失敗しました')
  }
}

async function disconnectAccount(account: IgAccount) {
  if (!confirm(`@${account.username} の連携を解除しますか？`)) {
    return
  }

  try {
    await $fetch(`/api/ig-accounts/${account.id}`, {
      method: 'DELETE'
    })

    setNotice('Instagram連携を解除しました')
    await refreshAccounts()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || 'Instagram連携の解除に失敗しました')
  }
}

async function simulateInboundEvent() {
  try {
    await $fetch('/api/inbound-events', {
      method: 'POST',
      body: inboundForm
    })
    setNotice('受信イベントを保存し、自動返信処理を実行しました')
    inboundForm.senderId = ''
    inboundForm.senderUsername = ''
    inboundForm.content = ''
    await refreshEvents()
  }
  catch (error: any) {
    setError(error?.data?.statusMessage || '受信イベント処理に失敗しました')
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ja-JP')
}

function getInstagramProfileUrl(senderUsername: string) {
  return `https://www.instagram.com/${encodeURIComponent(senderUsername.trim())}/`
}
</script>

<template>
  <main class="dashboard-page">
    <header class="top-header">
      <div>
        <h1>Instagram DM/コメント 自動返信</h1>
        <p>ログイン中: {{ meData?.user?.email }}（{{ isAdmin ? 'システム管理者' : '一般' }}）</p>
      </div>
      <div class="top-actions">
        <NuxtLink v-if="isAdmin" class="secondary nav-link" to="/users">ユーザーマスター</NuxtLink>
        <button class="logout" @click="logout">ログアウト</button>
      </div>
    </header>

    <p v-if="notice" class="notice">{{ notice }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <section class="card">
      <h2>Instagram連携</h2>
      <p class="section-note">アクセストークンの入力は不要です。Metaの認可画面で連携したいアカウントを許可してください。</p>
      <a class="action link-button" :href="oauthConnectPath">Instagramと連携する</a>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>InstagramユーザーID</th>
              <th>ユーザー名</th>
              <th>状態</th>
              <th>更新日時</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>{{ account.platformUserId }}</td>
              <td>{{ account.username }}</td>
              <td>{{ account.enabled ? '有効' : '無効' }}</td>
              <td>{{ formatDate(account.updatedAt) }}</td>
              <td>
                <div class="row-actions">
                  <button class="mini" @click="toggleAccount(account)">{{ account.enabled ? '無効化' : '有効化' }}</button>
                  <button class="mini danger" @click="disconnectAccount(account)">連携解除</button>
                </div>
              </td>
            </tr>
            <tr v-if="accounts.length === 0">
              <td colspan="5">連携アカウントはまだありません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>返信ルール管理</h2>
      <div class="grid two">
        <label>
          チャネル
          <select v-model="ruleForm.channel">
            <option value="DM">DM</option>
            <option value="COMMENT">コメント</option>
          </select>
        </label>
        <label>
          優先度
          <input v-model.number="ruleForm.priority" type="number" />
        </label>
      </div>

      <label>
        キーワード
        <input v-model="ruleForm.keyword" type="text" placeholder="資料" />
      </label>

      <label>
        返信内容
        <textarea v-model="ruleForm.replyText" rows="3" placeholder="お問い合わせありがとうございます。"></textarea>
      </label>

      <label class="check">
        <input v-model="ruleForm.isActive" type="checkbox" />
        このルールを有効にする
      </label>

      <div class="actions">
        <button class="action" :disabled="submitting" @click="saveRule">
          {{ submitting ? '保存中...' : editingRuleId ? 'ルール更新' : 'ルール追加' }}
        </button>
        <button v-if="editingRuleId" class="secondary" @click="resetRuleForm">編集をキャンセル</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>チャネル</th>
              <th>キーワード</th>
              <th>返信内容</th>
              <th>優先度</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rule in rules" :key="rule.id">
              <td>{{ rule.channel }}</td>
              <td>{{ rule.keyword }}</td>
              <td>{{ rule.replyText }}</td>
              <td>{{ rule.priority }}</td>
              <td>{{ rule.isActive ? '有効' : '無効' }}</td>
              <td>
                <div class="row-actions">
                  <button class="mini" @click="editRule(rule)">編集</button>
                  <button class="mini" @click="toggleRule(rule)">{{ rule.isActive ? '無効化' : '有効化' }}</button>
                  <button class="mini danger" @click="deleteRule(rule.id)">削除</button>
                </div>
              </td>
            </tr>
            <tr v-if="rules.length === 0">
              <td colspan="6">返信ルールはまだありません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="card">
      <h2>受信イベントテスト（DM/コメント）</h2>
      <div class="grid two">
        <label>
          チャネル
          <select v-model="inboundForm.channel">
            <option value="DM">DM</option>
            <option value="COMMENT">コメント</option>
          </select>
        </label>
        <label>
          送信者ID
          <input v-model="inboundForm.senderId" type="text" placeholder="user_001" />
        </label>
      </div>
      <label>
        送信者ユーザー名（任意）
        <input v-model="inboundForm.senderUsername" type="text" placeholder="instagram_user" />
      </label>
      <label>
        受信本文
        <textarea v-model="inboundForm.content" rows="3" placeholder="資料をください"></textarea>
      </label>
      <button class="action" @click="simulateInboundEvent">テストイベントを送信</button>
    </section>

    <section class="card">
      <div class="section-head">
        <h2>受信イベントログ</h2>
        <button class="secondary" @click="() => refreshEvents()">再読み込み</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>日時</th>
              <th>チャネル</th>
              <th>送信者</th>
              <th>本文</th>
              <th>返信ステータス</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in events" :key="event.id">
              <td>{{ formatDate(event.createdAt) }}</td>
              <td>{{ event.channel }}</td>
              <td>
                <div class="sender-cell">
                  <a
                    v-if="event.senderUsername"
                    class="sender-link"
                    :href="getInstagramProfileUrl(event.senderUsername)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @{{ event.senderUsername }}
                  </a>
                  <span v-else class="sender-name sender-name-muted">ユーザー名未取得</span>
                  <span class="sender-id">ID: {{ event.senderId }}</span>
                  <span v-if="event.isSelfEvent" class="self-badge">自分</span>
                </div>
              </td>
              <td>{{ event.content }}</td>
              <td>
                <span v-if="event.outboundReplies[0]">
                  {{ event.outboundReplies[0].status }}
                </span>
                <span v-else>未処理</span>
              </td>
            </tr>
            <tr v-if="events.length === 0">
              <td colspan="5">イベントはまだありません</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.dashboard-page {
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

.top-actions {
  display: flex;
  gap: 8px;
  align-items: center;
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

.section-note {
  margin-bottom: 10px;
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
select,
textarea {
  border: 1px solid #90aeb8;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check input {
  width: 16px;
  height: 16px;
}

.actions {
  display: flex;
  gap: 8px;
}

.action,
.secondary,
.logout,
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

.link-button {
  display: inline-block;
  text-decoration: none;
}

.secondary {
  background: #d6e5eb;
  color: #1f3f4f;
}

.nav-link {
  text-decoration: none;
  display: inline-block;
}

.logout {
  background: #3c6273;
  color: #fff;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.sender-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.sender-link {
  color: #0b5b9d;
  text-decoration: underline;
  font-weight: 700;
}

.sender-link:hover {
  text-decoration: none;
}

.sender-name {
  color: #446273;
  font-size: 13px;
}

.sender-name-muted {
  color: #6f8794;
}

.sender-id {
  color: #527182;
  font-size: 12px;
}

.self-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  background: #d9f3e8;
  color: #1b6f4f;
  font-size: 12px;
  font-weight: 700;
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
  .dashboard-page {
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
