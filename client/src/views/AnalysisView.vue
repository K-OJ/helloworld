<template>
  <div>
    <NavBar />

    <!-- HERO -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-label">실시간 데이터 인사이트</div>
        <h1 class="hero-title"><span class="glow">📊 데이터 분석</span></h1>
        <p class="hero-sub">핵심 지표를 한눈에 파악하고 데이터 기반 의사결정을 내리세요.</p>
      </div>
    </section>

    <!-- STAT CARDS -->
    <section class="section" style="background:#0f0f1a; padding-top: 40px;">
      <div class="stat-cards" ref="statCards">
        <div v-for="card in statCardsList" :key="card.label" :class="['stat-card', card.color]">
          <div class="stat-icon">{{ card.icon }}</div>
          <div class="stat-label">{{ card.label }}</div>
          <div class="stat-value">{{ card.displayed }}</div>
          <div class="stat-change" v-html="card.change"></div>
        </div>
      </div>
    </section>

    <!-- BAR CHART -->
    <section class="section chart-section">
      <div style="max-width:1200px; margin:0 auto;">
        <div class="section-title">월별 매출 현황</div>
      </div>
      <div class="bar-chart-wrap">
        <div class="bar-chart-grid">
          <div class="chart-y-labels">
            <span v-for="v in ySteps" :key="v">{{ v }}</span>
          </div>
          <div class="bar-chart" ref="barChart">
            <div v-for="(val, i) in barData" :key="i" class="bar-col">
              <div class="bar-inner" :style="{ height: barHeights[i] + 'px' }">
                <div class="bar-tooltip">{{ months[i] }}: {{ val }}만</div>
              </div>
              <span class="bar-label">{{ months[i] }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DONUT CHART -->
    <section class="section donut-section">
      <div style="max-width:1200px; margin:0 auto;">
        <div class="section-title">카테고리별 매출 비율</div>
      </div>
      <div class="donut-wrap">
        <div class="donut-canvas-wrap">
          <canvas ref="donutCanvas" width="300" height="300"></canvas>
        </div>
        <div class="donut-legend">
          <div class="legend-item" v-for="seg in donutData" :key="seg.label">
            <div class="legend-dot" :style="{ background: seg.color, boxShadow: `0 0 8px ${seg.color}88` }"></div>
            <span class="legend-name">{{ seg.label }}</span>
            <span class="legend-pct">{{ seg.value }}%</span>
          </div>
        </div>
      </div>
    </section>

    <!-- TABLE -->
    <section class="section table-section">
      <div style="max-width:1200px; margin:0 auto;">
        <div class="section-title">상위 5개 제품</div>
      </div>
      <div class="data-table">
        <div class="dt-header">
          <span>제품명</span><span>매출</span><span>판매량</span><span>전환율</span><span>증감</span>
        </div>
        <div v-for="row in tableRows" :key="row.name" class="dt-row">
          <span><span class="dt-rank">{{ row.rank }}</span>{{ row.name }}</span>
          <span>{{ row.revenue }}</span>
          <span>{{ row.sales }}</span>
          <span>{{ row.conversion }}</span>
          <span :class="row.changeClass">{{ row.change }}</span>
        </div>
      </div>
    </section>

    <!-- LIVE FEED -->
    <section class="section feed-section">
      <div style="max-width:1200px; margin:0 auto;">
        <div class="section-title">실시간 활동 피드</div>
      </div>
      <div class="feed-box">
        <div class="feed-inner">
          <div v-for="(item, i) in feedItems" :key="i" class="feed-item">
            <span class="feed-time">{{ item.time }}</span>
            <div :class="['feed-dot', item.dot]"></div>
            <span class="feed-text">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </section>

    <FooterBar />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import FooterBar from '../components/FooterBar.vue'

// STAT CARDS
const statCards = ref(null)
const statCardsList = reactive([
  { icon: '💰', label: '총 매출', color: 'c1', target: 284750000, displayed: '₩0', isShort: true, prefix: '₩', suffix: '', divide: 1, change: '<span class="up">▲ 12.4%</span> 전월 대비' },
  { icon: '👥', label: '신규 가입', color: 'c2', target: 3842, displayed: '0명', isShort: false, prefix: '', suffix: '명', divide: 1, change: '<span class="up">▲ 8.1%</span> 전주 대비' },
  { icon: '🎯', label: '전환율', color: 'c3', target: 347, displayed: '0%', isShort: false, prefix: '', suffix: '%', divide: 10, change: '<span class="up">▲ 0.3%p</span> 전월 대비' },
  { icon: '⏱️', label: '평균 체류시간', color: 'c4', target: 412, displayed: '0초', isShort: false, prefix: '', suffix: '초', divide: 1, change: '<span class="down">▼ 2.1%</span> 전주 대비' },
])

function animateCounter(card) {
  const duration = 1800, step = card.target / (duration / 16)
  let cur = 0
  const fmt = v => {
    const real = v / card.divide
    if (card.isShort && real >= 100000000) return card.prefix + (real/100000000).toFixed(1) + '억'
    if (card.isShort && real >= 10000) return card.prefix + Math.round(real/10000) + '만'
    return card.prefix + real.toLocaleString() + card.suffix
  }
  const timer = setInterval(() => {
    cur = Math.min(cur + step, card.target)
    card.displayed = fmt(cur)
    if (cur >= card.target) { card.displayed = fmt(card.target); clearInterval(timer) }
  }, 16)
}

// BAR CHART
const barChart = ref(null)
const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const barData = [185, 220, 198, 265, 310, 290, 335, 380, 355, 420, 390, 448]
const chartH = 188
const barHeights = reactive(new Array(12).fill(0))
const ySteps = [500, 400, 300, 200, 100, 0]

// DONUT
const donutCanvas = ref(null)
const donutData = [
  { label: '프리미엄', value: 35, color: '#7c3aed' },
  { label: '엔터프라이즈', value: 28, color: '#06b6d4' },
  { label: '스탠다드', value: 22, color: '#10b981' },
  { label: 'API 이용권', value: 10, color: '#f59e0b' },
  { label: '기타', value: 5, color: '#6b7280' },
]

function drawDonut(ctx, progress) {
  ctx.clearRect(0, 0, 300, 300)
  let sa = -Math.PI / 2
  const total = donutData.reduce((a, b) => a + b.value, 0)
  donutData.forEach(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI * progress
    ctx.beginPath(); ctx.moveTo(150, 150)
    ctx.arc(150, 150, 120, sa, sa + sweep)
    ctx.arc(150, 150, 72, sa + sweep, sa, true)
    ctx.closePath(); ctx.fillStyle = seg.color; ctx.fill()
    sa += sweep
  })
  if (progress >= 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = 'bold 28px Segoe UI, system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('매출', 150, 138)
    ctx.font = '14px Segoe UI, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fillText('분석 비율', 150, 164)
  }
}

// TABLE
const tableRows = [
  { rank:1, name:'프리미엄 플랜', revenue:'₩84,200,000', sales:'421건', conversion:'8.4%', change:'▲ 15.2%', changeClass:'change-up' },
  { rank:2, name:'엔터프라이즈 플랜', revenue:'₩72,500,000', sales:'290건', conversion:'12.1%', change:'▲ 9.8%', changeClass:'change-up' },
  { rank:3, name:'스탠다드 플랜', revenue:'₩58,400,000', sales:'584건', conversion:'5.2%', change:'▼ 2.3%', changeClass:'change-down' },
  { rank:4, name:'API 추가 이용권', revenue:'₩41,200,000', sales:'1,030건', conversion:'3.8%', change:'▲ 22.7%', changeClass:'change-up' },
  { rank:5, name:'스토리지 확장팩', revenue:'₩28,450,000', sales:'712건', conversion:'2.9%', change:'▼ 4.1%', changeClass:'change-down' },
]

// LIVE FEED
const feedItems = reactive([])
const feedMessages = [
  { dot: 'dot-green', text: '사용자 kim****@gmail.com 이 프리미엄 플랜을 구독했습니다.' },
  { dot: 'dot-blue', text: '새 리포트 "2026 Q1 분석"이 생성되었습니다.' },
  { dot: 'dot-purple', text: '엔터프라이즈 플랜 갱신 — 연간 계약 완료' },
  { dot: 'dot-yellow', text: 'API 호출 임계치 80% 도달 — 모니터링 중' },
  { dot: 'dot-green', text: '신규 사용자 park****@naver.com 가입 완료' },
  { dot: 'dot-blue', text: '데이터 동기화 완료 — 3,241건 처리' },
  { dot: 'dot-green', text: '결제 성공 ₩200,000 — 스탠다드 플랜 갱신' },
  { dot: 'dot-purple', text: '새 팀 워크스페이스 "Dev Team Alpha" 생성됨' },
  { dot: 'dot-yellow', text: '서버 응답시간 평균 142ms — 정상 범위' },
  { dot: 'dot-green', text: '사용자 choi****@company.com 이 API 이용권을 구매했습니다.' },
]
let feedIdx = 0
let feedTimer = null

function getNow() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
}

function addFeedItem() {
  const msg = feedMessages[feedIdx % feedMessages.length]; feedIdx++
  feedItems.unshift({ time: getNow(), dot: msg.dot, text: msg.text })
  if (feedItems.length > 20) feedItems.pop()
}

onMounted(() => {
  // Stat cards animation
  const cardObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      statCardsList.forEach(animateCounter)
      cardObs.disconnect()
    }
  }, { threshold: 0.5 })
  if (statCards.value) cardObs.observe(statCards.value)

  // Bar chart animation
  const barObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      barData.forEach((val, i) => {
        setTimeout(() => { barHeights[i] = (val / 500) * chartH }, i * 60)
      })
      barObs.disconnect()
    }
  }, { threshold: 0.3 })
  if (barChart.value) barObs.observe(barChart.value)

  // Donut animation
  const ctx = donutCanvas.value.getContext('2d')
  drawDonut(ctx, 0)
  const donutObs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      let prog = 0
      const tick = () => {
        prog = Math.min(prog + 0.03, 1)
        drawDonut(ctx, prog)
        if (prog < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      donutObs.disconnect()
    }
  }, { threshold: 0.4 })
  donutObs.observe(donutCanvas.value)

  // Live feed
  for (let i = 0; i < 6; i++) addFeedItem()
  feedTimer = setInterval(addFeedItem, 2200)
})

onUnmounted(() => {
  if (feedTimer) clearInterval(feedTimer)
})
</script>

<style scoped>
/* HERO */
.hero {
  min-height: 50vh; padding-top: 64px;
  display: flex; align-items: center; justify-content: center;
  text-align: center;
  background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 70%),
              linear-gradient(to bottom, #0f0f1a, #0f0f1a);
  position: relative; overflow: hidden;
}
.hero::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 60%, rgba(124,58,237,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 40%, rgba(6,182,212,0.1) 0%, transparent 60%);
}
.hero-inner { position: relative; z-index: 1; padding: 60px 24px; }
.hero-label { font-size:0.78rem;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#06b6d4;margin-bottom:16px; }
.hero-title { font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;letter-spacing:-2px;line-height:1.1;margin-bottom:16px; }
.glow { text-shadow:0 0 40px rgba(99,102,241,0.8),0 0 80px rgba(99,102,241,0.4);background:linear-gradient(135deg,#818cf8,#22d3ee,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 20px rgba(99,102,241,0.6)); }
.hero-sub { color:rgba(255,255,255,0.5);font-size:1rem; }

/* SECTIONS */
.section { padding: 80px 32px; }
.section-title { font-size:clamp(1.5rem,3.5vw,2.2rem);font-weight:800;letter-spacing:-1px;margin-bottom:40px;display:flex;align-items:center;gap:10px; }
.section-title::before { content:'';display:block;width:4px;height:1.4em;background:linear-gradient(to bottom,#7c3aed,#06b6d4);border-radius:4px; }

/* STAT CARDS */
.stat-cards { display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:1200px;margin:0 auto; }
@media (max-width:900px) { .stat-cards { grid-template-columns:1fr 1fr; } }
@media (max-width:480px) { .stat-cards { grid-template-columns:1fr; } }
.stat-card { background:rgba(255,255,255,0.03);border-radius:20px;padding:28px 24px;position:relative;overflow:hidden;transition:transform 0.3s,box-shadow 0.3s; }
.stat-card:hover { transform:translateY(-5px); }
.stat-card::before { content:'';position:absolute;top:0;left:0;right:0;height:2px; }
.stat-card.c1 { border:1px solid rgba(124,58,237,0.3);box-shadow:0 4px 24px rgba(124,58,237,0.1); }
.stat-card.c1::before { background:linear-gradient(90deg,#7c3aed,#a855f7); }
.stat-card.c1:hover { box-shadow:0 8px 40px rgba(124,58,237,0.25); }
.stat-card.c2 { border:1px solid rgba(6,182,212,0.3);box-shadow:0 4px 24px rgba(6,182,212,0.1); }
.stat-card.c2::before { background:linear-gradient(90deg,#0891b2,#22d3ee); }
.stat-card.c2:hover { box-shadow:0 8px 40px rgba(6,182,212,0.25); }
.stat-card.c3 { border:1px solid rgba(16,185,129,0.3);box-shadow:0 4px 24px rgba(16,185,129,0.1); }
.stat-card.c3::before { background:linear-gradient(90deg,#059669,#34d399); }
.stat-card.c3:hover { box-shadow:0 8px 40px rgba(16,185,129,0.25); }
.stat-card.c4 { border:1px solid rgba(251,191,36,0.3);box-shadow:0 4px 24px rgba(251,191,36,0.1); }
.stat-card.c4::before { background:linear-gradient(90deg,#d97706,#fbbf24); }
.stat-card.c4:hover { box-shadow:0 8px 40px rgba(251,191,36,0.25); }
.stat-icon { font-size:1.5rem;margin-bottom:14px; }
.stat-label { font-size:0.8rem;color:rgba(255,255,255,0.45);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px; }
.stat-value { font-size:2.2rem;font-weight:900;letter-spacing:-1px;line-height:1; }
.stat-card.c1 .stat-value { color:#c4b5fd; }
.stat-card.c2 .stat-value { color:#67e8f9; }
.stat-card.c3 .stat-value { color:#6ee7b7; }
.stat-card.c4 .stat-value { color:#fde68a; }
.stat-change { margin-top:10px;font-size:0.82rem;color:rgba(255,255,255,0.4); }

/* BAR CHART */
.chart-section { background: #13131f; }
.bar-chart-wrap { max-width:1200px;margin:0 auto;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:36px 32px; }
.bar-chart { display:flex;align-items:flex-end;gap:10px;height:220px;padding-bottom:32px;position:relative; }
.bar-chart::after { content:'';position:absolute;bottom:32px;left:0;right:0;height:1px;background:rgba(255,255,255,0.06); }
.bar-col { flex:1;display:flex;flex-direction:column;align-items:center;gap:0;position:relative;cursor:pointer; }
.bar-inner { width:100%;border-radius:8px 8px 0 0;min-height:4px;background:linear-gradient(to top,#7c3aed,#22d3ee);transition:height 0.8s cubic-bezier(0.22,1,0.36,1);position:relative; }
.bar-col:hover .bar-inner { opacity:0.75; }
.bar-tooltip { position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:rgba(15,15,26,0.95);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:6px 10px;border-radius:8px;font-size:0.78rem;font-weight:600;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.2s; }
.bar-col:hover .bar-tooltip { opacity:1; }
.bar-label { position:absolute;bottom:-28px;font-size:0.72rem;color:rgba(255,255,255,0.35);font-weight:500; }
.chart-y-labels { display:flex;flex-direction:column;justify-content:space-between;height:220px;padding-bottom:32px;margin-right:12px;font-size:0.72rem;color:rgba(255,255,255,0.25);text-align:right;min-width:32px; }
.bar-chart-grid { display:flex; }

/* DONUT */
.donut-section { background: #0f0f1a; }
.donut-wrap { max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center; }
@media (max-width:700px) { .donut-wrap { grid-template-columns:1fr; } }
.donut-canvas-wrap { display:flex;justify-content:center; }
canvas { max-width:300px;width:100%; }
.donut-legend { display:flex;flex-direction:column;gap:16px; }
.legend-item { display:flex;align-items:center;gap:14px; }
.legend-dot { width:14px;height:14px;border-radius:50%;flex-shrink:0; }
.legend-name { font-size:0.92rem;font-weight:600;flex:1; }
.legend-pct { font-size:0.88rem;color:rgba(255,255,255,0.45); }

/* TABLE */
.table-section { background: #13131f; }
.data-table { max-width:1200px;margin:0 auto;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.07);border-radius:20px;overflow:hidden; }
.dt-header { display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.08);padding:16px 24px;font-size:0.78rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.4); }
.dt-row { display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;padding:18px 24px;border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.2s;cursor:pointer;font-size:0.9rem;align-items:center; }
.dt-row:last-child { border-bottom:none; }
.dt-row:hover { background:rgba(255,255,255,0.04); }
.dt-rank { width:24px;height:24px;border-radius:6px;background:rgba(124,58,237,0.2);color:#c4b5fd;font-size:0.78rem;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-right:10px; }
.change-up { color:#34d399;font-weight:700; }
.change-down { color:#f87171;font-weight:700; }
@media (max-width:700px) { .dt-header, .dt-row { grid-template-columns:2fr 1fr 1fr; } .dt-header > *:nth-child(n+4), .dt-row > *:nth-child(n+4) { display:none; } }

/* FEED */
.feed-section { background: #0f0f1a; }
.feed-box { max-width:800px;margin:0 auto;background:rgba(0,0,0,0.4);border:1px solid rgba(99,102,241,0.2);border-radius:20px;padding:24px;height:280px;overflow:hidden;position:relative; }
.feed-box::before { content:'';position:absolute;top:0;left:0;right:0;height:60px;background:linear-gradient(to bottom,rgba(15,15,26,0.95),transparent);z-index:2;pointer-events:none; }
.feed-box::after { content:'';position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(to top,rgba(15,15,26,0.95),transparent);z-index:2;pointer-events:none; }
.feed-inner { display:flex;flex-direction:column;gap:10px; }
.feed-item { display:flex;align-items:flex-start;gap:12px;font-size:0.85rem;line-height:1.5;animation:feedAppear 0.4s ease forwards; }
@keyframes feedAppear { from { opacity:0;transform:translateY(10px); } to { opacity:1;transform:translateY(0); } }
.feed-time { color:rgba(255,255,255,0.25);font-size:0.78rem;flex-shrink:0;font-family:monospace; }
.feed-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px; }
.dot-green { background:#34d399;box-shadow:0 0 8px #34d399; }
.dot-blue { background:#60a5fa;box-shadow:0 0 8px #60a5fa; }
.dot-yellow { background:#fbbf24;box-shadow:0 0 8px #fbbf24; }
.dot-purple { background:#c4b5fd;box-shadow:0 0 8px #c4b5fd; }
.feed-text { color:rgba(255,255,255,0.65); }

/* UP/DOWN in v-html */
:deep(.up) { color: #34d399; }
:deep(.down) { color: #f87171; }
</style>
