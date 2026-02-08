<script setup lang="ts">
const { data } = await useFetch('/api/auth/me')

if (data.value?.authenticated) {
  await navigateTo('/dashboard')
}
else {
  await navigateTo('/login')
}
</script>

<template>
  <main class="center-box">
    <p>読み込み中です...</p>
  </main>
</template>

<style scoped>
.center-box {
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif;
}
</style>
