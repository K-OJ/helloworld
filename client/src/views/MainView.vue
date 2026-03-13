<template>
  <div>
    <NavBar />

    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
      <div class="hero-content">
        <div class="hero-badge">🎉 새로운 기능 출시</div>
        <h1 class="hero-title">
          데이터를 <span class="grad">인사이트</span>로<br>바꾸는 플랫폼
        </h1>
        <p class="hero-sub">강력한 분석 도구와 직관적인 대시보드로 비즈니스의 모든 것을 한눈에 파악하세요.</p>
        <div class="hero-ctas">
          <button class="btn-primary" @click="router.push('/analysis')">📊 분석 시작하기</button>
          <button class="btn-secondary" @click="router.push('/intro')">더 알아보기 →</button>
        </div>
      </div>
      <div class="scroll-indicator"><span>스크롤</span><span>↓</span></div>
    </section>

    <!-- IMAGE CARDS -->
    <section class="section image-section">
      <p class="section-label">갤러리</p>
      <h2 class="section-title">세상을 담다</h2>
      <p class="section-desc">아름다운 세계 곳곳의 순간을 포착한 이미지들을 감상해보세요.</p>
      <div class="cards-grid">
        <div class="img-card" v-for="card in imageCards" :key="card.title">
          <img :src="card.img" :alt="card.title" loading="lazy" />
          <div class="img-card-body">
            <div class="img-card-title">{{ card.title }}</div>
            <div class="img-card-desc">{{ card.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="stats-section" ref="statsSection">
      <p class="section-label">우리의 성과</p>
      <h2 class="section-title">숫자로 증명합니다</h2>
      <p class="section-desc">매일 성장하는 플랫폼과 함께 더 큰 성과를 만들어보세요.</p>
      <div class="stats-grid">
        <div class="stat-item" v-for="stat in stats" :key="stat.label">
          <div class="stat-num">{{ stat.displayed }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="section features-section">
      <p class="section-label">핵심 기능</p>
      <h2 class="section-title">무엇이 다른가요?</h2>
      <p class="section-desc">경쟁사와 차별화된 세 가지 핵심 기능을 경험해보세요.</p>
      <div class="features-grid">
        <div class="feature-card" v-for="f in features" :key="f.title">
          <div class="feature-icon">{{ f.icon }}</div>
          <div class="feature-title">{{ f.title }}</div>
          <div class="feature-desc">{{ f.desc }}</div>
        </div>
      </div>
    </section>

    <FooterBar />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import FooterBar from '../components/FooterBar.vue'

const router = useRouter()
const statsSection = ref(null)

const imageCards = [
  { img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600', title: '자연의 웅장함', desc: '설산과 호수가 어우러진 절경의 자연 풍경' },
  { img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600', title: '기술과 협업', desc: '현대 기술 환경에서의 창의적인 팀워크' },
  { img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600', title: '비즈니스 혁신', desc: '데이터 기반의 스마트한 비즈니스 전략' },
]

const stats = reactive([
  { target: 12847, suffix: '', label: '총 방문자 수', displayed: '0' },
  { target: 3291, suffix: '', label: '분석 데이터 건수', displayed: '0' },
  { target: 98, suffix: '%', label: '고객 만족도', displayed: '0' },
])

const features = [
  { icon: '🔮', title: 'AI 예측 분석', desc: '머신러닝 기반의 예측 모델로 미래 트렌드를 미리 파악하고 선제적으로 대응하세요.' },
  { icon: '⚡', title: '실시간 대시보드', desc: '0.1초 단위로 업데이트되는 실시간 데이터로 비즈니스의 현재 상태를 즉시 파악하세요.' },
  { icon: '🛡️', title: '엔터프라이즈 보안', desc: '군사급 암호화와 다중 인증으로 소중한 비즈니스 데이터를 안전하게 보호합니다.' },
]

function animateStat(stat) {
  const duration = 1800
  const step = stat.target / (duration / 16)
  let cur = 0
  const timer = setInterval(() => {
    cur = Math.min(cur + step, stat.target)
    stat.displayed = Math.floor(cur).toLocaleString() + stat.suffix
    if (cur >= stat.target) { stat.displayed = stat.target.toLocaleString() + stat.suffix; clearInterval(timer) }
  }, 16)
}

onMounted(() => {
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      stats.forEach(animateStat)
      obs.disconnect()
    }
  }, { threshold: 0.5 })
  if (statsSection.value) obs.observe(statsSection.value)
})
</script>

<style scoped>
:root { --nav-h: 64px; }

/* HERO */
.hero {
  position: relative; min-height: 100vh; overflow: hidden;
  display: flex; align-items: center; justify-content: center; text-align: center;
}
.hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #1e0040, #0a1628, #2d0036);
  animation: gradShift 8s ease-in-out infinite alternate;
}
@keyframes gradShift {
  0%   { background: linear-gradient(135deg, #1e0040 0%, #0a1628 50%, #2d0036 100%); }
  33%  { background: linear-gradient(135deg, #0a1628 0%, #2d0036 50%, #1e0040 100%); }
  66%  { background: linear-gradient(135deg, #2d0036 0%, #1e0040 50%, #0a1628 100%); }
  100% { background: linear-gradient(135deg, #1e0040 0%, #0d1f40 50%, #1a0030 100%); }
}
.blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; pointer-events: none; }
.blob-1 { width:520px;height:520px;background:radial-gradient(circle,#7c3aed,transparent);top:-120px;left:-100px;animation:blobFloat1 12s ease-in-out infinite; }
.blob-2 { width:420px;height:420px;background:radial-gradient(circle,#2563eb,transparent);bottom:-100px;right:-80px;animation:blobFloat2 14s ease-in-out infinite; }
.blob-3 { width:300px;height:300px;background:radial-gradient(circle,#db2777,transparent);top:40%;left:55%;animation:blobFloat3 10s ease-in-out infinite; }
@keyframes blobFloat1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(60px,40px) scale(1.1);} }
@keyframes blobFloat2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-50px,-30px) scale(1.08);} }
@keyframes blobFloat3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-40px,50px) scale(1.12);} }
.hero-content { position:relative;z-index:2;padding:0 24px; }
.hero-badge { display:inline-block;background:rgba(168,85,247,0.2);border:1px solid rgba(168,85,247,0.4);color:#c4b5fd;padding:6px 18px;border-radius:20px;font-size:0.82rem;font-weight:600;letter-spacing:0.5px;margin-bottom:24px; }
.hero-title { font-size:clamp(2.4rem,6vw,5rem);font-weight:900;line-height:1.1;letter-spacing:-2px;margin-bottom:20px; }
.hero-title .grad { background:linear-gradient(135deg,#a78bfa 0%,#60a5fa 50%,#f472b6 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
.hero-sub { font-size:clamp(1rem,2.5vw,1.25rem);color:rgba(255,255,255,0.65);max-width:560px;margin:0 auto 40px;line-height:1.7; }
.hero-ctas { display:flex;gap:16px;justify-content:center;flex-wrap:wrap; }
.btn-primary { background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border:none;padding:14px 36px;border-radius:50px;font-size:1rem;font-weight:700;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 24px rgba(124,58,237,0.4); }
.btn-primary:hover { transform:translateY(-3px);box-shadow:0 8px 32px rgba(124,58,237,0.6); }
.btn-secondary { background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.3);padding:13px 36px;border-radius:50px;font-size:1rem;font-weight:600;cursor:pointer;transition:border-color 0.2s,background 0.2s; }
.btn-secondary:hover { border-color:rgba(255,255,255,0.7);background:rgba(255,255,255,0.07); }
.scroll-indicator { position:absolute;bottom:32px;left:50%;transform:translateX(-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(255,255,255,0.4);font-size:0.75rem;animation:bounce 2s ease-in-out infinite; }
@keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0);} 50%{transform:translateX(-50%) translateY(8px);} }

/* SECTIONS */
.section { padding: 100px 32px; }
.section-label { text-align:center;font-size:0.8rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#a78bfa;margin-bottom:12px; }
.section-title { text-align:center;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;margin-bottom:16px;letter-spacing:-1px; }
.section-desc { text-align:center;color:rgba(255,255,255,0.55);max-width:480px;margin:0 auto 60px;line-height:1.7; }

/* IMAGE CARDS */
.image-section { background: #13131f; }
.cards-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:28px;max-width:1100px;margin:0 auto; }
@media (max-width:900px) { .cards-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:580px) { .cards-grid { grid-template-columns:1fr; } }
.img-card { border-radius:20px;overflow:hidden;position:relative;cursor:pointer;transition:transform 0.35s,box-shadow 0.35s;box-shadow:0 4px 24px rgba(0,0,0,0.3); }
.img-card:hover { transform:scale(1.04);box-shadow:0 16px 48px rgba(124,58,237,0.35); }
.img-card img { width:100%;height:240px;object-fit:cover;display:block; }
.img-card-body { padding:20px 22px 22px;background:linear-gradient(to bottom,rgba(15,15,26,0.8),rgba(15,15,26,0.98)); }
.img-card-title { font-size:1.05rem;font-weight:700;margin-bottom:6px; }
.img-card-desc { font-size:0.85rem;color:rgba(255,255,255,0.55);line-height:1.6; }

/* STATS */
.stats-section { background:linear-gradient(135deg,#0f0f1a 0%,#1a0a2e 50%,#0a1628 100%);padding:100px 32px; }
.stats-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:40px;max-width:900px;margin:0 auto; }
@media (max-width:640px) { .stats-grid { grid-template-columns:1fr; } }
.stat-item { text-align:center; }
.stat-num { font-size:clamp(2.5rem,5vw,4rem);font-weight:900;background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1; }
.stat-label { margin-top:10px;color:rgba(255,255,255,0.55);font-size:0.95rem; }

/* FEATURES */
.features-section { background: #0f0f1a; }
.features-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:28px;max-width:1100px;margin:0 auto; }
@media (max-width:900px) { .features-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:580px) { .features-grid { grid-template-columns:1fr; } }
.feature-card { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(20px);border-radius:24px;padding:36px 28px;transition:transform 0.3s,border-color 0.3s,box-shadow 0.3s; }
.feature-card:hover { transform:translateY(-6px);border-color:rgba(168,85,247,0.5);box-shadow:0 12px 40px rgba(168,85,247,0.2); }
.feature-icon { font-size:2.5rem;margin-bottom:18px; }
.feature-title { font-size:1.15rem;font-weight:700;margin-bottom:10px; }
.feature-desc { color:rgba(255,255,255,0.55);font-size:0.9rem;line-height:1.7; }
</style>
