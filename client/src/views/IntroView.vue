<template>
  <div>
    <NavBar />

    <!-- PARTICLE HERO -->
    <section class="hero">
      <canvas ref="particleCanvas" id="particleCanvas"></canvas>
      <div class="hero-content">
        <div class="hero-tag">✦ 우리를 소개합니다</div>
        <h1 class="hero-title"><span class="grad">🚀 소개</span></h1>
        <p class="hero-sub">혁신을 향한 열정으로 더 나은 세상을 만들어 나가는 팀과 서비스를 소개합니다.</p>
      </div>
    </section>

    <!-- TEAM CARDS -->
    <section class="section team-section">
      <p class="section-label">팀 & 서비스</p>
      <h2 class="section-title">우리를 만나보세요</h2>
      <p class="section-desc">최고의 전문가들이 모여 혁신적인 솔루션을 만들어냅니다.</p>
      <div class="team-grid">
        <div class="team-card" v-for="t in teams" :key="t.name">
          <div class="team-emoji">{{ t.emoji }}</div>
          <div class="team-name">{{ t.name }}</div>
          <div class="team-desc">{{ t.desc }}</div>
          <div class="tags">
            <span v-for="tag in t.tags" :key="tag.text" :class="['tag', tag.color]">{{ tag.text }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- TIMELINE -->
    <section class="section timeline-section">
      <p class="section-label">우리의 여정</p>
      <h2 class="section-title">성장의 기록</h2>
      <p class="section-desc">작은 아이디어에서 시작해 업계를 선도하는 플랫폼으로 성장했습니다.</p>
      <div class="timeline">
        <div v-for="(item, i) in timeline" :key="item.year" :class="['tl-item', i % 2 === 0 ? 'left' : '']">
          <div class="tl-dot"></div>
          <div class="tl-content">
            <div class="tl-year">{{ item.year }}</div>
            <div class="tl-title">{{ item.title }}</div>
            <div class="tl-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- SKILL BARS -->
    <section class="section skills-section">
      <p class="section-label">기술 스택</p>
      <h2 class="section-title">전문 기술 역량</h2>
      <p class="section-desc">최신 기술을 활용해 최고의 제품을 만들어냅니다.</p>
      <div class="skills-container" ref="skillsContainer">
        <div class="skill-row" v-for="(skill, i) in skills" :key="skill.name">
          <div class="skill-header">
            <span>{{ skill.name }}</span>
            <span class="skill-pct">{{ skill.pct }}%</span>
          </div>
          <div class="skill-bar-bg">
            <div :class="['skill-bar-fill', `fill-${i+1}`]" :style="{ width: animated ? skill.pct + '%' : '0' }"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <h2 class="cta-title">지금 바로 시작하세요</h2>
      <p class="cta-sub">궁금한 점이 있으신가요? 언제든지 문의해주세요. 전문가 팀이 도와드리겠습니다.</p>
      <RouterLink to="/analysis" class="btn-cta">📊 분석 페이지로 이동</RouterLink>
    </section>

    <FooterBar />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import NavBar from '../components/NavBar.vue'
import FooterBar from '../components/FooterBar.vue'

const particleCanvas = ref(null)
const skillsContainer = ref(null)
const animated = ref(false)

const teams = [
  { emoji: '🎯', name: '제품 전략', desc: '시장을 깊이 이해하고 사용자 중심의 제품 전략을 수립합니다. 데이터 기반의 의사결정으로 비즈니스 성과를 극대화합니다.', tags: [{ text:'전략기획', color:'tag-blue' }, { text:'로드맵', color:'tag-purple' }, { text:'OKR', color:'tag-green' }] },
  { emoji: '⚙️', name: '기술 개발', desc: '최신 기술 스택으로 확장 가능하고 안정적인 시스템을 구축합니다. 성능과 보안을 최우선으로 생각합니다.', tags: [{ text:'React', color:'tag-blue' }, { text:'Node.js', color:'tag-yellow' }, { text:'Cloud', color:'tag-green' }] },
  { emoji: '🎨', name: '디자인 경험', desc: '사용자가 첫눈에 반하는 인터페이스와 직관적인 사용자 경험을 설계합니다. 아름다움과 기능성의 완벽한 조화.', tags: [{ text:'UX/UI', color:'tag-pink' }, { text:'Figma', color:'tag-purple' }, { text:'모션', color:'tag-blue' }] },
]

const timeline = [
  { year: '2021', title: '창업의 시작', desc: '5명의 열정적인 개발자들이 모여 데이터 분석 플랫폼의 초기 아이디어를 구체화했습니다.' },
  { year: '2022', title: '베타 서비스 출시', desc: '첫 번째 베타 버전을 출시하여 초기 사용자 100명을 확보하고 소중한 피드백을 수집했습니다.' },
  { year: '2023', title: '시리즈 A 투자 유치', desc: '주요 벤처캐피털로부터 50억 원의 시리즈 A 투자를 유치하며 빠른 성장의 기반을 마련했습니다.' },
  { year: '2024', title: '글로벌 확장', desc: '일본, 동남아시아 시장에 진출하여 해외 사용자 기반을 확보하고 글로벌 플랫폼으로 도약했습니다.' },
  { year: '2025~', title: 'AI 통합 & 미래', desc: '생성형 AI를 플랫폼에 통합하여 더욱 강력한 인사이트를 제공합니다. 미래를 향한 여정은 계속됩니다.' },
]

const skills = [
  { name: 'React / Next.js', pct: 95 },
  { name: 'Node.js / TypeScript', pct: 90 },
  { name: '데이터 분석 / Python', pct: 85 },
  { name: 'Cloud Architecture (AWS)', pct: 88 },
  { name: 'Machine Learning', pct: 78 },
]

let animFrame = null
let W, H, particles = []

function Particle(canvas) {
  this.x = Math.random() * W
  this.y = Math.random() * H
  this.vx = (Math.random() - 0.5) * 0.6
  this.vy = (Math.random() - 0.5) * 0.6
  this.r = Math.random() * 2.5 + 0.5
  this.alpha = Math.random() * 0.5 + 0.2
  const hues = [230, 260, 280, 200]
  this.color = `hsl(${hues[Math.floor(Math.random()*hues.length)]},80%,70%)`
}

Particle.prototype.update = function() {
  this.x += this.vx; this.y += this.vy
  if (this.x < 0) this.x = W
  if (this.x > W) this.x = 0
  if (this.y < 0) this.y = H
  if (this.y > H) this.y = 0
}

function initParticles() {
  particles = []
  const n = Math.min(120, Math.floor(W * H / 8000))
  for (let i = 0; i < n; i++) particles.push(new Particle())
}

function drawParticles(ctx) {
  ctx.clearRect(0, 0, W, H)
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j]
      const dx = a.x - b.x, dy = a.y - b.y
      const dist = Math.sqrt(dx*dx + dy*dy)
      if (dist < 130) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(99,102,241,${(1 - dist/130) * 0.3})`
        ctx.lineWidth = 0.8; ctx.stroke()
      }
    }
    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2)
    ctx.fillStyle = a.color; ctx.globalAlpha = a.alpha; ctx.fill(); ctx.globalAlpha = 1
    a.update()
  }
  animFrame = requestAnimationFrame(() => drawParticles(ctx))
}

function resizeCanvas(canvas) {
  W = canvas.width = canvas.offsetWidth
  H = canvas.height = canvas.offsetHeight
}

onMounted(() => {
  const canvas = particleCanvas.value
  const ctx = canvas.getContext('2d')
  resizeCanvas(canvas)
  initParticles()
  drawParticles(ctx)
  const onResize = () => { resizeCanvas(canvas); initParticles() }
  window.addEventListener('resize', onResize)

  const skillsObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { animated.value = true; skillsObs.disconnect() }
  }, { threshold: 0.3 })
  if (skillsContainer.value) skillsObs.observe(skillsContainer.value)
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})
</script>

<style scoped>
/* HERO */
.hero {
  position: relative; min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  text-align: center; overflow: hidden;
}
#particleCanvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  background: linear-gradient(135deg, #0a0a1a, #0d1628, #100a1a);
}
.hero-content { position: relative; z-index: 2; padding: 0 24px; }
.hero-tag { display:inline-block;background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.35);color:#93c5fd;padding:6px 18px;border-radius:20px;font-size:0.82rem;font-weight:600;letter-spacing:0.5px;margin-bottom:24px; }
.hero-title { font-size:clamp(2.4rem,6vw,4.5rem);font-weight:900;letter-spacing:-2px;line-height:1.1;margin-bottom:20px; }
.hero-title .grad { background:linear-gradient(135deg,#60a5fa,#a78bfa,#34d399);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
.hero-sub { font-size:clamp(1rem,2.2vw,1.2rem);color:rgba(255,255,255,0.6);max-width:500px;margin:0 auto;line-height:1.7; }

/* SECTIONS */
.section { padding: 100px 32px; }
.section-label { text-align:center;font-size:0.8rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#60a5fa;margin-bottom:12px; }
.section-title { text-align:center;font-size:clamp(1.8rem,4vw,2.8rem);font-weight:800;margin-bottom:16px;letter-spacing:-1px; }
.section-desc { text-align:center;color:rgba(255,255,255,0.55);max-width:480px;margin:0 auto 60px;line-height:1.7; }

/* TEAM */
.team-section { background: #13131f; }
.team-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:28px;max-width:1100px;margin:0 auto; }
@media (max-width:900px) { .team-grid { grid-template-columns:1fr 1fr; } }
@media (max-width:580px) { .team-grid { grid-template-columns:1fr; } }
.team-card { background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:40px 28px 32px;transition:transform 0.3s,border-color 0.3s,box-shadow 0.3s;display:flex;flex-direction:column; }
.team-card:hover { transform:translateY(-8px);border-color:rgba(96,165,250,0.4);box-shadow:0 16px 48px rgba(37,99,235,0.2); }
.team-emoji { font-size:3rem;margin-bottom:20px; }
.team-name { font-size:1.15rem;font-weight:700;margin-bottom:10px; }
.team-desc { color:rgba(255,255,255,0.55);font-size:0.9rem;line-height:1.7;flex:1;margin-bottom:20px; }
.tags { display:flex;flex-wrap:wrap;gap:8px; }
.tag { padding:4px 12px;border-radius:12px;font-size:0.78rem;font-weight:600; }
.tag-blue { background:rgba(37,99,235,0.25);color:#93c5fd; }
.tag-purple { background:rgba(124,58,237,0.25);color:#c4b5fd; }
.tag-green { background:rgba(16,185,129,0.25);color:#6ee7b7; }
.tag-pink { background:rgba(219,39,119,0.25);color:#f9a8d4; }
.tag-yellow { background:rgba(234,179,8,0.25);color:#fde047; }

/* TIMELINE */
.timeline-section { background: #0f0f1a; }
.timeline { max-width:800px;margin:0 auto;position:relative; }
.timeline::before { content:'';position:absolute;left:50%;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,transparent,#7c3aed 10%,#2563eb 50%,#06b6d4 90%,transparent);transform:translateX(-50%); }
@media (max-width:640px) { .timeline::before { left:16px; } }
.tl-item { display:flex;align-items:flex-start;margin-bottom:56px;position:relative; }
.tl-item:last-child { margin-bottom:0; }
.tl-item.left { flex-direction:row-reverse; }
.tl-dot { position:absolute;left:50%;top:12px;transform:translateX(-50%);width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);box-shadow:0 0 0 4px rgba(124,58,237,0.25),0 0 16px rgba(124,58,237,0.5);z-index:2;flex-shrink:0; }
@media (max-width:640px) { .tl-dot { left:16px; } .tl-item, .tl-item.left { flex-direction:row;padding-left:48px; } .tl-content { margin-left:0 !important;margin-right:0 !important; } }
.tl-content { width:calc(50% - 40px);background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:24px 28px;transition:border-color 0.3s,box-shadow 0.3s; }
.tl-item.left .tl-content { margin-left:auto;margin-right:40px; }
.tl-item:not(.left) .tl-content { margin-left:40px; }
.tl-content:hover { border-color:rgba(96,165,250,0.35);box-shadow:0 8px 32px rgba(37,99,235,0.15); }
@media (max-width:640px) { .tl-content { width:100%; } }
.tl-year { font-size:0.78rem;font-weight:700;letter-spacing:2px;color:#60a5fa;text-transform:uppercase;margin-bottom:8px; }
.tl-title { font-size:1.05rem;font-weight:700;margin-bottom:8px; }
.tl-desc { font-size:0.88rem;color:rgba(255,255,255,0.55);line-height:1.65; }

/* SKILLS */
.skills-section { background: #13131f; }
.skills-container { max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:28px; }
.skill-header { display:flex;justify-content:space-between;font-size:0.92rem;font-weight:600;margin-bottom:10px; }
.skill-pct { color:#a78bfa; }
.skill-bar-bg { height:10px;background:rgba(255,255,255,0.08);border-radius:10px;overflow:hidden; }
.skill-bar-fill { height:100%;border-radius:10px;width:0;transition:width 1.4s cubic-bezier(0.22,1,0.36,1); }
.fill-1 { background:linear-gradient(90deg,#7c3aed,#a855f7); }
.fill-2 { background:linear-gradient(90deg,#2563eb,#60a5fa); }
.fill-3 { background:linear-gradient(90deg,#0891b2,#22d3ee); }
.fill-4 { background:linear-gradient(90deg,#059669,#34d399); }
.fill-5 { background:linear-gradient(90deg,#d97706,#fbbf24); }

/* CTA */
.cta-section { background:linear-gradient(135deg,#1e0040,#0a1628,#003320);padding:120px 32px;text-align:center; }
.cta-title { font-size:clamp(2rem,5vw,3.5rem);font-weight:900;letter-spacing:-1.5px;margin-bottom:20px; }
.cta-sub { color:rgba(255,255,255,0.6);font-size:1.1rem;max-width:480px;margin:0 auto 48px;line-height:1.7; }
.btn-cta { display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border:none;padding:16px 48px;border-radius:50px;font-size:1.05rem;font-weight:700;cursor:pointer;text-decoration:none;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 24px rgba(124,58,237,0.4); }
.btn-cta:hover { transform:translateY(-3px);box-shadow:0 8px 40px rgba(124,58,237,0.6); }
</style>
