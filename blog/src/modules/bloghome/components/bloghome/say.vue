<template>
  <div>
    <!-- 堆叠卡片主体：点击打开时间线弹窗 -->
    <div
      class="stack"
      @mouseenter="stopAutoPlay"
      @mouseleave="startAutoPlay"
      @click="openModal"
    >
      <div class="card">
        <!-- 聊天气泡图标 + 标题 -->
        <div class="say-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 512 512">
            <path d="M0 0h512v512H0z" fill="none" />
            <path
              fill="currentColor"
              d="M254.156 56.938c-64.144 0-122.393 19.17-165.03 50.718c-42.64 31.547-69.845 76.01-69.845 125.5c0 49.492 27.207 93.952 69.845 125.5c6.388 4.727 13.13 9.164 20.188 13.313l-12.657 95.905l90.594-65.75c21.226 4.708 43.67 7.25 66.906 7.25c64.144 0 122.362-19.17 165-50.72C461.794 327.11 489 282.65 489 233.156c0-49.49-27.206-93.95-69.844-125.5c-42.638-31.546-100.856-50.718-165-50.718M157 274.438c12.69 0 23 10.276 23 22.968c0 12.69-10.31 23-23 23s-22.97-10.31-22.97-23s10.28-22.97 22.97-22.97zm96.844 0c12.69 0 22.97 10.276 22.97 22.968c-.002 12.69-10.28 23-22.97 23s-23-10.31-23-23s10.31-22.97 23-22.97zm99.844 0c12.69 0 22.968 10.276 22.968 22.968c0 12.69-10.278 23-22.97 23c-12.69 0-22.998-10.31-22.998-23s10.31-22.97 23-22.97z"
            />
          </svg>
          <h3>随心一说</h3>
          <span class="click-tip">点击查看全部</span>
        </div>

        <!-- 说说内容区 -->
        <div class="say-content-wrapper">
          <Transition name="slide-fade" mode="out-in">
            <div :key="currentIndex" class="say-body">
              <p class="content">“{{ currentSay?.content ?? '' }}”</p>
              <div class="date-container">
                <span class="date-line"></span>
                <span class="date-text">{{ currentSay?.date ?? '' }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 弹窗：使用 Teleport 挂载到 body -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <!-- 核心：直接调用 animate.css 的 bounceIn / bounceOut -->
        <Transition
          appear
          enter-active-class="animate__animated animate__bounceIn"
          leave-active-class="animate__animated animate__bounceOut"
        >
          <div v-if="isModalOpen" class="modal-window">
            <!-- 弹窗顶部栏 -->
            <div class="modal-header">
              <div class="modal-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="1.3em" height="1.3em" viewBox="0 0 512 512">
                  <path fill="currentColor" d="M254.156 56.938c-64.144 0-122.393 19.17-165.03 50.718c-42.64 31.547-69.845 76.01-69.845 125.5c0 49.492 27.207 93.952 69.845 125.5c6.388 4.727 13.13 9.164 20.188 13.313l-12.657 95.905l90.594-65.75c21.226 4.708 43.67 7.25 66.906 7.25c64.144 0 122.362-19.17 165-50.72C461.794 327.11 489 282.65 489 233.156c0-49.49-27.206-93.95-69.844-125.5c-42.638-31.546-100.856-50.718-165-50.718M157 274.438c12.69 0 23 10.276 23 22.968c0 12.69-10.31 23-23 23s-22.97-10.31-22.97-23s10.28-22.97 22.97-22.97zm96.844 0c12.69 0 22.97 10.276 22.97 22.968c-.002 12.69-10.28 23-22.97 23s-23-10.31-23-23s10.31-22.97 23-22.97zm99.844 0c12.69 0 22.968 10.276 22.968 22.968c0 12.69-10.278 23-22.97 23c-12.69 0-22.998-10.31-22.998-23s10.31-22.97 23-22.97z" />
                </svg>
                <h2>随心一说</h2>
                <span class="count-badge">共 {{ timelineSays.length }} 条</span>
              </div>
              <button class="close-btn" @click="closeModal" aria-label="关闭">✕</button>
            </div>

            <!-- 时间线内容滚动区域 -->
            <div class="modal-body" ref="modalBodyRef">
              <div class="timeline">
                <div
                  v-for="(say, index) in timelineSays"
                  :key="say.id"
                  class="timeline-item"
                  :ref="(el) => setItemRef(el, index)"
                >
                  <div class="timeline-axis">
                    <div class="timeline-dot"></div>
                    <div class="timeline-line"></div>
                  </div>

                  <div class="timeline-card">
                    <div class="timeline-header">
                      <span class="timeline-date">{{ say.date }}</span>
                    </div>
                    <p class="timeline-text">{{ say.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import 'animate.css'

const saysList = [
  { id: 1, content: '终于在今天把首页的代码写完了', date: '2026-06-14 22:36' },
  { id: 2, content: '过完端午马上期末有点焦虑啊😶‍🌫️', date: '2026-06-22 17:50' },
  { id: 3, content: '搬宿舍好累啊', date: '2026-06-25 22:05' },
  { id: 4, content: '终于考完了可以开始爽玩了🥳', date: '2026-07-01 12:48' },
  { id: 5, content: '参加了趟ACM,差点拿到省级赛的资格', date: '2026-07-06 17:21' },
  { id: 6, content: '到千灯了', date: '2026-07-07 22:06' },
  { id: 7, content: '在打雷下雨的天气写代码或是打游戏,让我感觉像是被充能了', date: '2026-07-20 19:41' },
  { id: 8, content: '拍摄星轨的时候看着一闪一闪的星星想东想西', date: '2026-08-09 21:45' },
  { id: 9, content: '这似乎是我人生最后一个能完整享受的暑期了🥲', date: '2026-08-17 19:32' },
  { id: 10, content: '因为豪哥,梦想哭了这个博主去看了《局外人》,老实说没咋读懂', date: '2026-08-20 22:58' },
  { id: 11, content: '读完《局外人》了,稍微有了点读小说的感觉,打算接着读《堕落》', date: '2026-08-23 12:59' },
  { id: 12, content: '被财经频道的长视频震撼了', date: '2026-08-26 23:58' },
  { id: 13, content: '回到学校', date: '2026-09-05 22:15' },
  { id: 14, content: '总是莫名感到好累好困', date: '2026-09-07 21:58' },
]

const timelineSays = computed(() => [...saysList].reverse())

const currentIndex = ref(0)
const currentSay = computed(() => saysList[currentIndex.value] ?? saysList[0])
const isModalOpen = ref(false)
const modalBodyRef = ref<HTMLElement | null>(null)

const itemRefs = ref<HTMLElement[]>([])
const setItemRef = (el: any, index: number) => {
  if (el) itemRefs.value[index] = el
}

let timer: number | null = null
let observer: IntersectionObserver | null = null

const pickRandomSay = () => {
  if (saysList.length <= 1) return
  let nextIndex = currentIndex.value
  while (nextIndex === currentIndex.value) {
    nextIndex = Math.floor(Math.random() * saysList.length)
  }
  currentIndex.value = nextIndex
}

const startAutoPlay = () => {
  if (!timer) {
    timer = window.setInterval(pickRandomSay, 5000)
  }
}

const stopAutoPlay = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const openModal = async () => {
  stopAutoPlay()
  isModalOpen.value = true
  itemRefs.value = []

  await nextTick()

  if (modalBodyRef.value) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      {
        root: modalBodyRef.value,
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px',
      }
    )

    itemRefs.value.forEach((el) => {
      if (el) observer?.observe(el)
    })
  }
}

const closeModal = () => {
  isModalOpen.value = false
  if (observer) {
    observer.disconnect()
    observer = null
  }
  startAutoPlay()
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
  if (observer) observer.disconnect()
})
</script>

<style scoped>
/* ----- 堆叠卡片容器 ----- */
.stack {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  transition: 0.25s ease;
}

.stack:hover {
  transform: rotate(4deg);
}
.stack:hover .card:before {
  transform: translateY(-2%) rotate(-4deg);
}
.stack:hover .card:after {
  transform: translateY(2%) rotate(4deg);
}

/* ----- 卡片本体 ----- */
.card {
  height: 160px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  box-sizing: border-box;
  border-radius: 16px;
  background-color: #fff;
  position: relative;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  transition: 0.15s ease;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  color: #1a1a1a;
}

.card:before,
.card:after {
  content: '';
  display: block;
  position: absolute;
  height: 100%;
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background-color: #fff;
  transform-origin: center center;
  z-index: -1;
  transition: 0.15s ease;
  top: 0;
  left: 0;
}

.card:before {
  transform: translateY(-2%) rotate(-6deg);
}

.card:after {
  transform: translateY(2%) rotate(6deg);
}

/* ----- 内部元素 ----- */
.say-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.say-header h3 {
  margin: 0;
  font-size: 25px;
  font-family:  'Orbitron','ShangShouJiangHuShuFa';
  font-weight: normal;
  letter-spacing: 1px;
  color: #2c2c2c;
}

.say-header svg {
  color: #d4a373;
  flex-shrink: 0;
}

.click-tip {
  margin-left: auto;
  font-size: 12px;
  color: #999;
  font-family:  'Orbitron','YouSheBiaoTiHei', '优设标题黑', sans-serif;
  opacity: 0.7;
}

.say-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.say-body {
  width: 100%;
}

.content {
  margin: 0 0 10px 0;
  font-family:  'Orbitron','YouSheBiaoTiHei', '优设标题黑', sans-serif;
  font-size: 14.5px;
  line-height: 1.6;
  font-weight: 400;
  letter-spacing: 0.5px;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 4;
}

.date-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  opacity: 0.6;
}

.date-line {
  height: 1px;
  width: 20px;
  background-color: #666;
}

.date-text {
  font-size: 12px;
  font-family:  'Orbitron','YouSheBiaoTiHei', '优设标题黑', sans-serif;
  color: #555;
}

/* 卡片轮播切换动画 */
.slide-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

/* ================== 弹窗全屏与时间线样式 ================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  background: rgba(20, 20, 20, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.modal-window {
  background: #faf7f2;
  width: 100%;
  max-width: 620px;
  height: 82vh;
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title svg {
  color: #d4a373;
}

.modal-title h2 {
  margin: 0;
  font-size: 20px;
  font-family:  'Orbitron','ShangShouJiangHuShuFa', sans-serif;
  font-weight: normal;
  color: #2c2c2c;
  letter-spacing: 1px;
}

.count-badge {
  font-family:  'Orbitron';
  font-size: 12px;
  background: #f0e6dc;
  color: #8c6a4e;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #888;
  padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #222;
}

/* 时间线滚动内容区 */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 28px 24px;
  scrollbar-width: thin;
  scrollbar-color: #ddd transparent;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 4px;
}

/* 时间线主体容器 */
.timeline {
  display: flex;
  flex-direction: column;
}

/* 时间线单项：下滑隐入效果 */
.timeline-item {
  display: flex;
  gap: 16px;
  opacity: 0;
  transform: translateY(28px) scale(0.98);
  transition: opacity 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
              transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: opacity, transform;
}

.timeline-item.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 轴线与节点圆圈 */
.timeline-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 16px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ffffff;
  border: 3px solid #d4a373;
  box-shadow: 0 0 0 2px rgba(212, 163, 115, 0.2);
  margin-top: 4px;
  z-index: 2;
}

.timeline-line {
  flex: 1;
  width: 2px;
  background: rgba(212, 163, 115, 0.28);
  margin: 4px 0;
}

.timeline-item:last-child .timeline-line {
  display: none;
}

/* 时间线单卡片 */
.timeline-card {
  flex: 1;
  background: #ffffff;
  border-radius: 14px;
  padding: 14px 18px;
  margin-bottom: 22px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.timeline-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.timeline-header {
  margin-bottom: 6px;
}

.timeline-date {
  font-size: 12px;
  color: #8c8c8c;
  font-family:  'Orbitron','YouSheBiaoTiHei', sans-serif;
  letter-spacing: 0.5px;
}

.timeline-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #333333;
  font-family:  'Orbitron','YouSheBiaoTiHei', '优设标题黑', sans-serif;
}

/* 适配移动端 */
@media (max-width: 600px) {
  .modal-window {
    height: 90vh;
    border-radius: 16px;
  }

  .modal-body {
    padding: 20px 14px;
  }

  .timeline-card {
    padding: 12px 14px;
  }
}
</style>