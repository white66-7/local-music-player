<!-- src/modules/bloghome/components/about/SpaceCursor.vue -->
<template>
  <div v-show="isVisible" class="space-cursor-layer">
    <!-- 1. 轻量等离子粒子尾流画布 -->
    <canvas ref="trailCanvasRef" class="trail-canvas"></canvas>

    <!-- 2. Ranger 漫游者号飞船主体 -->
    <div ref="shipRef" class="ship-wrapper">
      <!-- 动态双发等离子冷焰（严格对齐 Ranger 尾部内嵌喷口） -->
      <div class="thrusters-group">
        <div ref="thrusterLeft" class="thruster-plume left">
          <div class="plume-outer"></div>
          <div class="plume-core"></div>
        </div>
        <div ref="thrusterRight" class="thruster-plume right">
          <div class="plume-outer"></div>
          <div class="plume-core"></div>
        </div>
      </div>

      <!-- 《星际穿越》Ranger 高精度还原 SVG (48 x 64) -->
      <svg class="ship-svg" viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 航天陶瓷白装甲渐变 -->
          <linearGradient id="rangerHull" x1="24" y1="8" x2="24" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="60%" stop-color="#E2E8F0"/>
            <stop offset="100%" stop-color="#CBD5E1"/>
          </linearGradient>
          <!-- 侧翼切面阴影（强化多面体立体感） -->
          <linearGradient id="facetShadow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#000000" stop-opacity="0.18"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <!-- 1. 底部深黑防热瓦底盘与外边缘（碳黑隔热层） -->
        <path d="M21 7H27L43 45L40 54L34 52L24 53L14 52L8 54L5 45L21 7Z" fill="#111317" stroke="#2D3748" stroke-width="0.8" stroke-linejoin="round"/>

        <!-- 2. 主甲板：白色航天陶瓷机身（标志性平头楔形） -->
        <path d="M21.5 8.5H26.5L41.2 44.5L38.5 51.5L32.5 50L24 51L15.5 50L9.5 51.5L6.8 44.5L21.5 8.5Z" fill="url(#rangerHull)"/>

        <!-- 3. 左/右侧多面折角暗面（增强 3D 棱角折线） -->
        <path d="M6.8 44.5L21.5 8.5L24 22L16 48L9.5 51.5L6.8 44.5Z" fill="url(#facetShadow)"/>
        <path d="M41.2 44.5L26.5 8.5L24 22L32 48L38.5 51.5L41.2 44.5Z" fill="url(#facetShadow)" transform="scale(-1, 1) translate(-48, 0)"/>

        <!-- 4. 中央隆起脊梁与折线骨架（Spine） -->
        <polygon points="21.5,8.5 26.5,8.5 27.5,45 24,47 20.5,45" fill="#F1F5F9" stroke="#94A3B8" stroke-width="0.4"/>
        <line x1="24" y1="8.5" x2="24" y2="47" stroke="#CBD5E1" stroke-width="0.6"/>

        <!-- 5. 漫游者号标志性多联驾驶舱风挡（炭黑偏冷蓝多边形） -->
        <polygon points="21.5,15 26.5,15 27.2,19 20.8,19" fill="#090D14" stroke="#38BDF8" stroke-width="0.4" stroke-opacity="0.8"/>
        <!-- 侧边辅助观察窗 -->
        <polygon points="19.5,19.8 17.5,23 20.5,22.2" fill="#090D14"/>
        <polygon points="28.5,19.8 30.5,23 27.5,22.2" fill="#090D14"/>

        <!-- 6. 背部中央圆形对接气闸环（Interstellar 标志对接舱门） -->
        <circle cx="24" cy="32" r="3.2" fill="#1E293B" stroke="#64748B" stroke-width="0.6"/>
        <circle cx="24" cy="32" r="1.6" fill="#0F172A" stroke="#94A3B8" stroke-width="0.4"/>
        <circle cx="24" cy="32" r="0.6" fill="#38BDF8" opacity="0.8"/>

        <!-- 7. 机体黑色拼接接缝与装甲刻线 -->
        <line x1="16" y1="36" x2="9.5" y2="43" stroke="#94A3B8" stroke-width="0.5"/>
        <line x1="32" y1="36" x2="38.5" y2="43" stroke="#94A3B8" stroke-width="0.5"/>
        <line x1="18" y1="45" x2="16" y2="49" stroke="#64748B" stroke-width="0.5"/>
        <line x1="30" y1="45" x2="32" y2="49" stroke="#64748B" stroke-width="0.5"/>

        <!-- 8. 尾部双发主推进喷口（沉入式钛黑喷管） -->
        <rect x="14.5" y="50" width="4.5" height="3" rx="0.6" fill="#0F172A" stroke="#475569" stroke-width="0.6"/>
        <rect x="29" y="50" width="4.5" height="3" rx="0.6" fill="#0F172A" stroke="#475569" stroke-width="0.6"/>

        <!-- 9. 翼梢姿态控制喷嘴标记点（RCS） -->
        <rect x="7" y="44" width="1.2" height="1.2" fill="#334155"/>
        <rect x="39.8" y="44" width="1.2" height="1.2" fill="#334155"/>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)
const shipRef = ref(null)
const trailCanvasRef = ref(null)
const thrusterLeft = ref(null)
const thrusterRight = ref(null)


// 鼠标位置与物理坐标
let mouseX = -100
let mouseY = -100
let shipX = -100
let shipY = -100
let prevX = -100
let prevY = -100

// 航向、侧倾与油门
let shipAngle = 0
let targetAngle = 0
let rollTilt = 0
let currentSpeed = 0
let engineThrottle = 0
let rafId = null

// Canvas 尺寸与粒子池
let ctx = null
let canvasW = 0
let canvasH = 0
const particles = []
const MAX_PARTICLES = 36

const onMouseMove = (e) => {
  if (!isVisible.value) {
    isVisible.value = true
    mouseX = e.clientX
    mouseY = e.clientY
    shipX = e.clientX
    shipY = e.clientY
    prevX = e.clientX
    prevY = e.clientY
  } else {
    mouseX = e.clientX
    mouseY = e.clientY
  }
}

const onMouseOver = (e) => {
  if (!shipRef.value) return
  const isInteractive = !!e.target.closest('button, a, input, textarea, .interactive-beacon, .leave-btn')
  shipRef.value.classList.toggle('is-locked', isInteractive)
}

const onMouseLeave = () => {
  isVisible.value = false
}

// 尾喷粒子发射器（严格对齐 Ranger 新尺寸 48x64）
const spawnTrailParticles = () => {
  if (engineThrottle < 0.25 || particles.length >= MAX_PARTICLES) return

  const rad = (shipAngle * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // 左右两个主喷口在旋转矩阵下的真实世界坐标 (X 偏移: ±7.25, Y 偏移从机头算起: 45)
  const nozzleLeftX = shipX + (-7.25 * cos - 45 * sin)
  const nozzleLeftY = shipY + (-7.25 * sin + 45 * cos)
  const nozzleRightX = shipX + (7.25 * cos - 45 * sin)
  const nozzleRightY = shipY + (7.25 * sin + 45 * cos)

  const count = engineThrottle > 1.2 ? 2 : 1
  for (let i = 0; i < count; i++) {
    const baseSpeed = 0.8 + Math.random() * 1.2
    const spread = (Math.random() - 0.5) * 0.3
    const pRad = rad + Math.PI + spread

    particles.push({
      x: nozzleLeftX + (Math.random() - 0.5) * 2,
      y: nozzleLeftY + (Math.random() - 0.5) * 2,
      vx: Math.sin(pRad) * baseSpeed,
      vy: -Math.cos(pRad) * baseSpeed,
      life: 1.0,
      decay: 0.05 + Math.random() * 0.04,
      size: 1.2 + Math.random() * 1.2
    })

    particles.push({
      x: nozzleRightX + (Math.random() - 0.5) * 2,
      y: nozzleRightY + (Math.random() - 0.5) * 2,
      vx: Math.sin(pRad) * baseSpeed,
      vy: -Math.cos(pRad) * baseSpeed,
      life: 1.0,
      decay: 0.05 + Math.random() * 0.04,
      size: 1.2 + Math.random() * 1.2
    })
  }
}

// 物理与运动循环
const updateLoop = () => {
  if (isVisible.value && shipRef.value) {
    const dx = mouseX - prevX
    const dy = mouseY - prevY
    prevX = mouseX
    prevY = mouseY
    const rawSpeed = Math.hypot(dx, dy)
    currentSpeed += (rawSpeed - currentSpeed) * 0.35

    // 高精度跟随（吸附锁定，消除拖曳抖动）
    const distX = mouseX - shipX
    const distY = mouseY - shipY
    if (Math.hypot(distX, distY) < 0.4) {
      shipX = mouseX
      shipY = mouseY
    } else {
      shipX += distX * 0.84
      shipY += distY * 0.84
    }

    // 动态航向角与小角度翻滚侧倾
    if (rawSpeed > 1.0) {
      targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    }

    let diff = (targetAngle - shipAngle) % 360
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    
    const turnRate = diff * 0.22
    shipAngle += turnRate
    rollTilt += (turnRate * 0.6 - rollTilt) * 0.25

    // 位姿变换（中心锚定在机头 24px, 8px）
    shipRef.value.style.transform = `translate3d(${shipX - 24}px, ${shipY - 8}px, 0) rotate(${shipAngle}deg) skewX(${rollTilt * -0.35}deg)`

    // 喷射引擎油门控制（静止时归 0 彻底熄火）
    const targetThrottle = rawSpeed > 0.4 ? Math.min(rawSpeed / 4.2, 2.6) : 0
    const lerpRate = targetThrottle > engineThrottle ? 0.45 : 0.2
    engineThrottle += (targetThrottle - engineThrottle) * lerpRate

    if (thrusterLeft.value && thrusterRight.value) {
      if (engineThrottle < 0.03) {
        thrusterLeft.value.style.opacity = '0'
        thrusterRight.value.style.opacity = '0'
        thrusterLeft.value.style.transform = 'scale(0.6, 0)'
        thrusterRight.value.style.transform = 'scale(0.6, 0)'
      } else {
        const scaleY = 0.3 + engineThrottle * 1.05
        const scaleX = Math.max(0.75, 1.05 - engineThrottle * 0.1)
        const opacity = Math.min(engineThrottle * 1.25, 1.0)
        const transformStr = `scale(${scaleX}, ${scaleY})`

        thrusterLeft.value.style.transform = transformStr
        thrusterRight.value.style.transform = transformStr
        thrusterLeft.value.style.opacity = opacity.toFixed(2)
        thrusterRight.value.style.opacity = opacity.toFixed(2)
      }
    }

    spawnTrailParticles()
  }

  // 渲染尾迹 Canvas
  if (ctx && canvasW > 0) {
    ctx.clearRect(0, 0, canvasW, canvasH)

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx
      p.y += p.vy
      p.life -= p.decay

      if (p.life <= 0) {
        particles.splice(i, 1)
        continue
      }

      ctx.fillStyle = `rgba(56, 189, 248, ${p.life * 0.7})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  rafId = requestAnimationFrame(updateLoop)
}

const resizeCanvas = () => {
  const canvas = trailCanvasRef.value
  if (!canvas) return
  canvasW = window.innerWidth
  canvasH = window.innerHeight
  canvas.width = canvasW
  canvas.height = canvasH
  ctx = canvas.getContext('2d')
}

onMounted(() => {
  if (window.matchMedia('(pointer: coarse)').matches) return

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mouseover', onMouseOver, { passive: true })
  document.addEventListener('mouseleave', onMouseLeave)

  rafId = requestAnimationFrame(updateLoop)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseover', onMouseOver)
  document.removeEventListener('mouseleave', onMouseLeave)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.space-cursor-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99999;
  overflow: hidden;
}

.trail-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 飞船主体容器（针对 48x64 Ranger 调整中心原点） */
.ship-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 48px;
  height: 64px;
  transform-origin: 24px 8px; /* 旋转中心位于机首钝头中央 */
  will-change: transform;
  pointer-events: none;
}

.ship-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  /* 增加白色机身在深色/浅色背景上的对比立体光影 */
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.6));
  transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), filter 0.15s ease;
}

/* 双发等离子尾推总成 */
.thrusters-group {
  position: absolute;
  top: 51px; /* 对齐喷口 Y 轴 */
  left: 0;
  width: 100%;
  height: 28px;
  z-index: 1;
  pointer-events: none;
}

/* 喷射火焰本体 */
.thruster-plume {
  position: absolute;
  width: 5px;
  height: 20px;
  transform-origin: top center;
  transform: scale(0.6, 0);
  opacity: 0;
  will-change: transform, opacity;
  display: flex;
  justify-content: center;
}

/* 精准对齐 Ranger 左右喷口位置 */
.thruster-plume.left {
  left: 14.5px;
}

.thruster-plume.right {
  left: 28.5px;
}

/* 外焰：等离子冷蓝能量流 */
.plume-outer {
  position: absolute;
  inset: 0;
  border-radius: 1px 1px 5px 5px;
  background: linear-gradient(to bottom, #ffffff 0%, #38bdf8 30%, #0284c7 75%, transparent 100%);
  box-shadow: 0 0 8px #38bdf8, 0 0 14px rgba(56, 189, 248, 0.85);
  animation: plume-jitter 0.08s infinite alternate ease-in-out;
}

/* 内焰：超高温等离子白核 */
.plume-core {
  position: absolute;
  top: 0;
  width: 2px;
  height: 65%;
  background: #ffffff;
  border-radius: 1px;
  box-shadow: 0 0 4px #ffffff, 0 0 8px #7dd3fc;
  z-index: 2;
  animation: plume-core-pulse 0.12s infinite alternate ease-in-out;
}

@keyframes plume-jitter {
  0% { transform: scaleX(0.92); opacity: 0.88; }
  100% { transform: scaleX(1.08); opacity: 1; }
}

@keyframes plume-core-pulse {
  0% { height: 60%; }
  100% { height: 72%; }
}

/* 交互悬停锁定 */
.ship-wrapper.is-locked .ship-svg {
  transform: scale(1.12);
  filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.9)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8));
}
</style>