<!-- src/modules/bloghome/components/articles/TarsWidget.vue -->
<template>
  <div class="tars-widget-wrapper">

    <!-- 1. 卡通云朵对白气泡 -->
    <transition name="cloud-bounce">
      <div v-show="isBubbleShow" class="tars-cloud-bubble">
        <span class="cloud-puff puff-left"></span>
        <span class="cloud-puff puff-center"></span>
        <span class="cloud-puff puff-right"></span>

        <div class="cloud-content">
          {{ currentQuote }}
        </div>

        <span class="cloud-dot dot-1"></span>
        <span class="cloud-dot dot-2"></span>
      </div>
    </transition>

    <!-- 2. Q 版 TARS 主体容器 -->
    <div 
      class="tars-pet-container" 
      @click="onTarsClick"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <!-- 矮胖 Q 版 3D 机械方碑手办 -->
      <div class="tars-stage" :class="{ 'is-bouncing': isBouncing }">
        <!-- 柔和微缩地影 -->
        <div class="tars-ground-shadow"></div>

        <div class="tars-chibi-body">
          
          <!-- 【左柱小手/足】 -->
          <div class="pillar p-left">
            <div class="face front">
              <span class="screw top"></span>
              <span class="screw bottom"></span>
            </div>
            <div class="face back"></div>
            <div class="face left"></div>
            <div class="face right"></div>
            <div class="face top"></div>
            <div class="face bottom"></div>
          </div>

          <!-- 【核心大脸/主躯干】 -->
          <div class="pillar p-torso">
            <div class="face front">
              <span class="screw top-l"></span>
              <span class="screw top-r"></span>

              <!-- 大弧度大眼终端面罩 -->
              <div class="terminal-screen">
                <div class="screen-glare"></div>
                <!-- 卡通大眼 HUD -->
                <div class="hud-display" :class="{ 'happy-mode': isHovered }">
                  <div class="eye eye-l">
                    <span class="glint"></span>
                  </div>
                  <div class="eye eye-r">
                    <span class="glint"></span>
                  </div>
                </div>
              </div>

              <!-- 卡通风 TARS 标牌与波点盲文 -->
              <div class="tars-brand">
                <div class="chibi-logo">TARS</div>
                <div class="yellow-braille">
                  <span class="dot"></span>
                  <span class="dot dim"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>

              <span class="screw btm-l"></span>
              <span class="screw btm-r"></span>
            </div>
            <div class="face back"></div>
            <div class="face left"></div>
            <div class="face right"></div>
            <div class="face top"></div>
            <div class="face bottom"></div>
          </div>

          <!-- 【右柱小手/足】 -->
          <div class="pillar p-right">
            <div class="face front">
              <span class="screw top"></span>
              <span class="screw bottom"></span>
            </div>
            <div class="face back"></div>
            <div class="face left"></div>
            <div class="face right"></div>
            <div class="face top"></div>
            <div class="face bottom"></div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const isBubbleShow = ref<boolean>(false)
const isHovered = ref<boolean>(false)
const isBouncing = ref<boolean>(false)
const currentQuote = ref<string>('TARS 正在待命。(诚实度 90%)')
let bubbleTimer: ReturnType<typeof setTimeout> | null = null

const popSpeech = (text: string, duration = 3200) => {
  currentQuote.value = text
  isBubbleShow.value = true
  if (bubbleTimer) clearTimeout(bubbleTimer)
  bubbleTimer = setTimeout(() => {
    isBubbleShow.value = false
  }, duration)
}

const triggerBounce = () => {
  isBouncing.value = true
  setTimeout(() => {
    isBouncing.value = false
  }, 450)
}

// 语句池
const tarsQuotes: string[] = [
  '自爆倒计时启动: 3、2、1……(幽默度 90%)',
  '牛顿第三定律：人类前进的唯一方式，是留下点什么。',
  '对情绪化生物来说，完全的坦诚既不安全也不外交。',
  '检测到你在当前页面发呆已超过警戒值。',
  '主躯干自检完毕，钛合金装甲完好率 60%。',
  '这里的一秒，是地球上的七年。',
  '你好帅啊(诚实度 0%)'
]

const onTarsClick = () => {
  triggerBounce()
  const chosen = tarsQuotes[Math.floor(Math.random() * tarsQuotes.length)]
  popSpeech(chosen ?? '系统正常。')
}

onUnmounted(() => {
  if (bubbleTimer) clearTimeout(bubbleTimer)
})
</script>

<style scoped>
/* ================= 全局最外层 ================= */
.tars-widget-wrapper {
  position: fixed;
  bottom: 24px;
  right: 28px;
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  user-select: none;
}

/* ================= Q 版 TARS 3D 舞台 ================= */
.tars-pet-container {
  position: relative;
  width: 88px;
  height: 104px;
  cursor: pointer;
}

/* 应用能露出干净顶部的俯视视角 */
.tars-stage {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: perspective(650px) rotateX(-15deg) rotateY(-14deg);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 悬停时微微抬头对视 */
.tars-pet-container:hover .tars-stage {
  transform: perspective(650px) rotateX(-8deg) rotateY(-8deg) translateY(-6px) scale(1.04);
}

/* 点击时的 Q 弹跳跃反馈 */
.tars-stage.is-bouncing {
  animation: chibi-jump 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes chibi-jump {
  0%   { transform: perspective(650px) rotateX(-15deg) rotateY(-14deg) scale(1, 1); }
  35%  { transform: perspective(650px) rotateX(-8deg)  rotateY(-10deg) translateY(-14px) scale(0.94, 1.08); }
  65%  { transform: perspective(650px) rotateX(-18deg) rotateY(-16deg) translateY(2px) scale(1.06, 0.94); }
  100% { transform: perspective(650px) rotateX(-15deg) rotateY(-14deg) scale(1, 1); }
}

/* ================= 核心：矮胖小方块体 ================= */
.tars-chibi-body {
  position: absolute;
  top: 4px;
  left: 3px;
  width: 82px;
  height: 90px;
  display: flex;
  gap: 2px;
  transform-style: preserve-3d;
  animation: chibi-idle 4s ease-in-out infinite;
}

.pillar {
  position: relative;
  height: 90px;
  transform-style: preserve-3d;
}
.pillar.p-left  { width: 18px; }
.pillar.p-torso { width: 42px; }
.pillar.p-right { width: 18px; }

/* ================= 柔和清透的潮玩银钛质感 ================= */
.face {
  position: absolute;
  box-sizing: border-box;
}

.face.front {
  width: 100%;
  height: 90px;
  transform: translateZ(9px);
  background: linear-gradient(
    115deg,
    #e8edf2 0%,
    #ffffff 28%,
    #dbe2e8 60%,
    #b8c4ce 100%
  );
  border-radius: 6px;
  box-shadow: 
    inset 1px 1px 0 rgba(255, 255, 255, 0.9),
    inset -1px -1px 0 rgba(148, 163, 184, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.face.back {
  width: 100%;
  height: 90px;
  transform: rotateY(180deg) translateZ(9px);
  background: #475569;
  border-radius: 6px;
}

.face.left {
  width: 18px;
  height: 90px;
  left: 0;
  transform: rotateY(-90deg) translateZ(9px);
  background: linear-gradient(to right, #475569, #334155);
}

.face.right {
  width: 18px;
  height: 90px;
  right: 0;
  transform: rotateY(90deg) translateZ(9px);
  background: linear-gradient(to left, #64748b, #475569);
  border-radius: 0 4px 4px 0;
}

/* 干净纯粹的高光纯净顶面，无多余黑槽 */
.face.top {
  width: 100%;
  height: 18px;
  top: -9px;
  transform: rotateX(90deg);
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
  border-radius: 4px 4px 0 0;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.95);
}

.face.bottom {
  width: 100%;
  height: 18px;
  bottom: -9px;
  transform: rotateX(-90deg);
  background: #1e293b;
  border-radius: 0 0 4px 4px;
}

/* 螺栓孔（第一版原样） */
.screw {
  position: absolute;
  width: 2.5px;
  height: 2.5px;
  border-radius: 50%;
  background: #64748b;
  box-shadow: inset 0.5px 0.5px 0.5px #ffffff, 0 0.5px 0 rgba(255, 255, 255, 0.6);
}
.screw.top    { top: 5px; left: 50%; transform: translateX(-50%); }
.screw.bottom { bottom: 5px; left: 50%; transform: translateX(-50%); }
.screw.top-l  { top: 5px; left: 4px; }
.screw.top-r  { top: 5px; right: 4px; }
.screw.btm-l  { bottom: 5px; left: 4px; }
.screw.btm-r  { bottom: 5px; right: 4px; }

/* ================= 大眼面罩与五官 ================= */
.terminal-screen {
  position: absolute;
  top: 12px;
  left: 3.5px;
  right: 3.5px;
  height: 34px;
  background: #090d16;
  border: 1.5px solid #1e293b;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
}

.screen-glare {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* 智能发光大眼 */
.hud-display {
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 2;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.eye {
  position: relative;
  width: 9px;
  height: 14px;
  background: #38bdf8;
  border-radius: 4px;
  box-shadow: 0 0 10px #0284c7, 0 0 14px rgba(56, 189, 248, 0.8);
  animation: natural-blink 4.2s infinite ease-in-out;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.eye .glint {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 3px;
  height: 3px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 2px #fff;
}

@keyframes natural-blink {
  0%, 46%, 50%, 94%, 98%, 100% { transform: scaleY(1); }
  48%, 96%                     { transform: scaleY(0.1); }
}

/* 悬停时的可爱月牙笑眯眯眼 */
.hud-display.happy-mode .eye {
  height: 6px !important;
  border-radius: 6px 6px 0 0 !important;
  background: #34d399 !important;
  box-shadow: 0 0 12px #10b981 !important;
  transform: translateY(-2px) scaleY(1) !important;
  animation: none !important;
}

/* 卡通风横版 TARS 标志 */
.tars-brand {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.chibi-logo {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 10px;
  font-weight: 900;
  color: #f59e0b;
  letter-spacing: 1.5px;
  line-height: 1;
  text-shadow: 0.5px 0.5px 0 rgba(0, 0, 0, 0.15);
}

.yellow-braille {
  display: flex;
  gap: 3px;
}

.yellow-braille .dot {
  width: 3px;
  height: 3px;
  background: #f59e0b;
  border-radius: 50%;
  box-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.15);
}
.yellow-braille .dot.dim {
  opacity: 0.25;
}

/* ================= 柔和地影与萌系小摇摆 ================= */
.tars-ground-shadow {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%) rotateX(90deg);
  width: 68px;
  height: 18px;
  background: radial-gradient(ellipse, rgba(15, 23, 42, 0.35) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(3.5px);
  animation: shadow-breathe 4s ease-in-out infinite;
}

@keyframes chibi-idle {
  0%, 100% { 
    transform: translateY(0) rotateZ(0deg); 
  }
  50% { 
    transform: translateY(-4px) rotateZ(1deg); 
  }
}

@keyframes shadow-breathe {
  0%, 100% { transform: translateX(-50%) rotateX(90deg) scale(1); opacity: 0.35; }
  50%      { transform: translateX(-50%) rotateX(90deg) scale(0.85); opacity: 0.2; }
}

/* ================= 蓬松云朵气泡 ================= */
.tars-cloud-bubble {
  position: absolute;
  bottom: calc(100% + 16px);
  right: -8px;
  min-width: 120px;
  max-width: 190px;
  background: #ffffff;
  border-radius: 18px;
  padding: 9px 12px;
  box-shadow: 
    0 10px 24px rgba(15, 23, 42, 0.12),
    0 2px 6px rgba(15, 23, 42, 0.06);
  pointer-events: none;
  z-index: 10000;
}

.cloud-puff {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
}
.puff-left   { width: 24px; height: 24px; top: -8px; left: 10px; }
.puff-center { width: 30px; height: 30px; top: -13px; left: 30px; }
.puff-right  { width: 20px; height: 20px; top: -6px; right: 14px; }

.cloud-content {
  position: relative;
  z-index: 2;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.45;
  color: #0f172a;
  text-align: center;
  word-break: break-word;
}

.cloud-dot {
  position: absolute;
  background: #ffffff;
  border-radius: 50%;
}
.dot-1 { bottom: -7px; right: 28px; width: 8px; height: 8px; }
.dot-2 { bottom: -13px; right: 24px; width: 5px; height: 5px; }

.cloud-bounce-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.cloud-bounce-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.cloud-bounce-enter-from,
.cloud-bounce-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.9);
}

@media (max-width: 768px) {
  .tars-widget-wrapper {
    transform: scale(0.9);
    transform-origin: bottom right;
    bottom: 16px;
    right: 16px;
  }
}
</style>