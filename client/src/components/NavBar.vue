<template>
  <nav :class="{ scrolled: isScrolled }">
    <RouterLink to="/main" class="nav-logo">✨ MyApp</RouterLink>
    <div class="nav-links">
      <RouterLink to="/main" :class="{ active: route.path === '/main' }">메인</RouterLink>
      <RouterLink to="/intro" :class="{ active: route.path === '/intro' }">소개</RouterLink>
      <RouterLink to="/analysis" :class="{ active: route.path === '/analysis' }">분석</RouterLink>
    </div>
    <button class="btn-logout" @click="router.push('/login')">로그아웃</button>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isScrolled = ref(false)

const onScroll = () => { isScrolled.value = window.scrollY > 40 }
onMounted(() => window.addEventListener('scroll', onScroll))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
  height: 64px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px;
  transition: background 0.35s, backdrop-filter 0.35s, box-shadow 0.35s;
}
nav.scrolled {
  background: rgba(15,15,26,0.92);
  backdrop-filter: blur(16px);
  box-shadow: 0 2px 24px rgba(0,0,0,0.4);
}
.nav-logo {
  font-size: 1.35rem; font-weight: 800;
  background: linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px; text-decoration: none;
}
.nav-links { display: flex; align-items: center; gap: 8px; }
.nav-links a {
  color: rgba(255,255,255,0.75); text-decoration: none;
  padding: 6px 14px; border-radius: 8px;
  font-size: 0.92rem; font-weight: 500;
  transition: color 0.2s, background 0.2s;
}
.nav-links a:hover { color: #fff; background: rgba(255,255,255,0.1); }
.nav-links a.active { color: #fff; background: rgba(168,85,247,0.25); }
.btn-logout {
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: #fff; border: none; padding: 8px 20px;
  border-radius: 20px; font-size: 0.88rem; font-weight: 600;
  cursor: pointer; transition: opacity 0.2s, transform 0.15s;
}
.btn-logout:hover { opacity: 0.85; transform: translateY(-1px); }
@media (max-width: 640px) {
  nav { padding: 0 16px; }
  .nav-links a { padding: 6px 10px; font-size: 0.82rem; }
  .btn-logout { padding: 7px 14px; font-size: 0.82rem; }
}
</style>
