export default defineEventHandler(() => {
  throw createError({
    statusCode: 405,
    statusMessage: '手動でのアクセストークン登録は廃止されました。Instagram連携ボタンを利用してください'
  })
})
