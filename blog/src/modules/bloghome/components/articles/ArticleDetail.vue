<template>
  <div class="article-detail-container">
  <Navbar :transparent="false" />

  <button class="back-btn" @click="$router.back()">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
    返回
  </button>

  <div class="article-page" v-if="article">
    <main>
      <div class="content" ref="contentRef">
        <div class="hero-image">
          <img :src="article.cover" alt="cover" />
        </div>
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="meta">
          <span>{{ article.date }}</span>
        </div>
        <div class="tags" v-if="article.tags.length">
          <span class="tag" v-for="tag in article.tags" :key="tag">{{ tag }}</span>
        </div>
        <div class="markdown-body" v-html="renderedContent" @click="handleMarkdownClick"></div>
      </div>
    </main>
  </div>
  <div class="not-found" v-else>
    <p>文章未找到</p>
  </div>
  <div class="elastic-sidebar" :class="{ 'is-open': isOpen }">
    <svg class="sidebar-svg" :viewBox="`0 0 350 ${svgHeight}`" preserveAspectRatio="none">
      <path 
        class="s-path" 
        fill="rgba(243, 245, 248, 0.94)" 
        :d="currentPath" 
        @mousedown="startDrag" 
        @touchstart="startDrag" 
      />
    </svg>

    <!-- ==== 提示文字 ==== -->
    <transition name="hint-fade">
      <div class="sidebar-hint-text" v-show="showHintText">
        目录
      </div>
    </transition>

    <div class="sidebar-content" :class="{ 'active': isOpen }">
      <!-- 头部 -->
      <div class="toc__header">
        <div class="toc__icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
        <div class="toc__title-group">
          <span class="toc__title">目录</span>
          <span class="toc__subtitle">CONTENTS</span>
        </div>
      </div>

      <!-- 目录列表 -->
      <div class="toc-list">
        <a v-for="(h, i) in headings" :key="i" class="toc__item" :class="[
          `toc__item--h${h.level}`,
          { 'toc__item--active': activeHeading === i }
        ]" :style="{ paddingLeft: `${16 + (h.level - 1) * 14}px` }" @click.prevent="handleTocClick(i)">
          <span class="toc__dot"></span>
          <span class="toc__text">{{ h.text }}</span>
        </a>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="previewVisible" class="lightbox-overlay" @click="closePreview">
      <img :src="previewSrc" class="lightbox-image" />
    </div>
  </Teleport>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, onBeforeRouteLeave } from 'vue-router'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.css'
import { articles } from '@/date/articles'
import type { Article } from '@/date/articles'
import Navbar from '@/modules/bloghome/components/load.vue'
import { articleScrollCache } from '@/router/index'
import 'animate.css'

const md = new MarkdownIt({ html: true })
md.renderer.rules.fence = function (tokens, idx) {
  const token = tokens[idx]
  if (!token) return ''
  const code = token.content || ''
  const rawLang = (token.info || '').trim()
  const displayLang = rawLang.toUpperCase() || 'CODE'

  let hljsLang = rawLang.toLowerCase()
  if (hljsLang === 'c++') hljsLang = 'cpp'
  else if (hljsLang === 'c#') hljsLang = 'csharp'
  else if (hljsLang === 'vue') hljsLang = 'xml'

  let highlightedCode = ''
  if (hljsLang && hljs.getLanguage(hljsLang)) {
    try {
      highlightedCode = hljs.highlight(code, { language: hljsLang, ignoreIllegals: true }).value
    } catch (__) {
      highlightedCode = md.utils.escapeHtml(code)
    }
  } else {
    highlightedCode = md.utils.escapeHtml(code)
  }

  return `
    <div class="code-editor">
      <div class="header">
        <span class="title">${displayLang}</span>
        <button class="copy-btn" data-code="${encodeURIComponent(code)}" title="复制代码">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 11.397c0-2.726 0-4.089.843-4.936c.844-.847 2.201-.847 4.917-.847h2.88c2.715 0 4.073 0 4.916.847c.844.847.844 2.21.844 4.936v4.82c0 2.726 0 4.089-.844 4.936c-.843.847-2.201.847-4.916.847h-2.88c-2.716 0-4.073 0-4.917-.847s-.843-2.21-.843-4.936z"/><path fill="currentColor" d="M4.172 3.172C3 4.343 3 6.229 3 10v2c0 3.771 0 5.657 1.172 6.828c.617.618 1.433.91 2.62 1.048c-.192-.84-.192-1.996-.192-3.66v-4.819c0-2.726 0-4.089.843-4.936c.844-.847 2.201-.847 4.917-.847h2.88c1.652 0 2.8 0 3.638.19c-.138-1.193-.43-2.012-1.05-2.632C16.657 2 14.771 2 11 2S5.343 2 4.172 3.172" opacity=".5"/></svg>
          <span class="copy-tips">已复制</span>
        </button>
      </div>
      <div class="editor-content"><pre><code class="hljs ${hljsLang}">${highlightedCode}</code></pre></div>
    </div>
  `
}

async function handleCopy(e: MouseEvent) {
  const target = e.target as HTMLElement
  const btn = target.closest('.copy-btn') as HTMLElement
  if (!btn) return
  const codeStr = btn.getAttribute('data-code')
  if (codeStr) {
    try {
      await navigator.clipboard.writeText(decodeURIComponent(codeStr))
      btn.classList.add('copied')
      setTimeout(() => btn.classList.remove('copied'), 2000)
    } catch (err) {
      alert('您的浏览器不支持自动复制，请手动复制。')
    }
  }
}

const route = useRoute()
const article = ref<Article | null>(null)

function addSpacing(text: string): string {
  if (!text) return ''

  const placeholders: string[] = []
  const PH = '\u0000SP\u0000'

  text = text.replace(/```[\s\S]*?```/g, (match) => {
    const key = `${PH}${placeholders.length}\u0000`
    placeholders.push(match)
    return key
  })
  text = text.replace(/`[^`]*`/g, (match) => {
    const key = `${PH}${placeholders.length}\u0000`
    placeholders.push(match)
    return key
  })

  text = text.replace(/([\u4e00-\u9fa5])(?![ \t])([a-zA-Z0-9])/g, '$1 $2')
  text = text.replace(/([a-zA-Z0-9])(?![ \t])([\u4e00-\u9fa5])/g, '$1 $2')
  text = text.replace(/\\(?=[A-Za-z0-9])/g, '\\\u200B')

  text = text.replace(new RegExp(`${PH}(\\d+)\u0000`, 'g'), (_, idx) => {
    return placeholders[parseInt(idx)] ?? ''
  })

  return text
}

const renderedContent = computed(() => {
  if (!article.value) return ''
  return md.render(addSpacing(article.value.content))
})

const contentRef = ref<HTMLElement | null>(null)
const headings = ref<{ text: string; level: number }[]>([])
let headingElements: HTMLElement[] = []
const activeHeading = ref(-1)

watch(() => renderedContent.value, async (newVal) => {
  if (!newVal) return
  await nextTick()
  if (!contentRef.value) return
  const els = contentRef.value.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3')
  headingElements = Array.from(els) as HTMLElement[]
  headings.value = headingElements.map(el => ({
    text: el.textContent || '',
    level: Number(el.tagName.charAt(1))
  }))
  handleScroll()
}, { immediate: true })

function scrollToHeading(index: number) {
  const el = headingElements[index]
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top, behavior: 'smooth' })
}

function handleTocClick(index: number) {
  scrollToHeading(index)
  if (isOpen.value) closeSidebar()
}

function handleScroll() {
  if (headingElements.length === 0) return
  const midline = window.innerHeight / 2
  let active = -1
  headingElements.forEach((el, i) => {
    const rect = el.getBoundingClientRect()
    if (rect.top <= midline) active = i
  })
  activeHeading.value = active
}

const svgHeight = ref(window.innerHeight > 70 ? window.innerHeight - 70 : 800)

const easings = {
  smallElastic: function (t: number, b: number, c: number, d: number) {
    let ts = (t /= d) * t
    let tc = ts * t
    return b + c * (33 * tc * ts + -106 * ts * ts + 126 * tc + -67 * ts + 15 * t)
  },
  inCubic: function (t: number, b: number, c: number, d: number) {
    let tc = (t /= d) * t * t
    return b + c * (tc)
  }
}

const START_BASE = 40
const OPEN_BASE = 280
const ANIM_TIME = 1200
const FRAME = 1000 / 60

const currentBaseX = ref(START_BASE)
const currentArcX = ref(0)
const currentDir = ref(1)

const currentPath = computed(() => {
  const h = svgHeight.value
  const arc = Math.abs(currentArcX.value)
  return `M0,0 ${currentBaseX.value},0 a${arc},${h / 2} 0 1,${currentDir.value} 0,${h} L0,${h}`
})

let animating = ref(false)
let isOpen = ref(false)
let animationFrameId = 0
let hintTimeoutId: ReturnType<typeof setTimeout> | null = null
let stayTimeoutId: ReturnType<typeof setTimeout> | null = null
const hasInteracted = ref(false)
const showHintText = ref(false)

function animatePath(
  targetBase: number,
  targetArc: number,
  time: number,
  easingFunc: keyof typeof easings,
  callback?: () => void
) {
  cancelAnimationFrame(animationFrameId)
  const steps = Math.floor(time / FRAME)
  let step = 0
  const startBase = currentBaseX.value
  const startArc = currentArcX.value
  const diffBase = targetBase - startBase
  const diffArc = targetArc - startArc

  function tick() {
    step++
    currentBaseX.value = easings[easingFunc](step, startBase, diffBase, steps)
    currentArcX.value = easings[easingFunc](step, startArc, diffArc, steps)
    currentDir.value = currentArcX.value >= 0 ? 1 : 0

    if (step >= steps) {
      currentBaseX.value = targetBase
      currentArcX.value = targetArc
      if (callback) callback()
    } else {
      animationFrameId = requestAnimationFrame(tick)
    }
  }
  animationFrameId = requestAnimationFrame(tick)
}

function playHintAnimation() {
  if (hasInteracted.value || isOpen.value) return
  animating.value = true
  showHintText.value = true

  animatePath(65, 15, 1200, 'smallElastic', () => {
    if (hasInteracted.value) {
      showHintText.value = false
      return
    }

    stayTimeoutId = setTimeout(() => {
      if (hasInteracted.value) return
      showHintText.value = false

      animatePath(START_BASE, 0, 1600, 'smallElastic', () => {
        animating.value = false
        if (!hasInteracted.value && !isOpen.value) {
          hintTimeoutId = setTimeout(playHintAnimation, 1500)
        }
      })
    }, 1500)
  })
}

let startMouseX = 0
let diffX = 0

function startDrag(e: MouseEvent | TouchEvent) {
  hasInteracted.value = true
  showHintText.value = false

  if (hintTimeoutId) clearTimeout(hintTimeoutId)
  if (stayTimeoutId) clearTimeout(stayTimeoutId)

  cancelAnimationFrame(animationFrameId)
  animating.value = false
  if (isOpen.value) return

  if ('touches' in e) {
    startMouseX = e.touches[0]?.pageX ?? 0
  } else {
    startMouseX = (e as MouseEvent).pageX
  }

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchend', onDragEnd)
}

function onDragMove(e: MouseEvent | TouchEvent) {
  let pageX = 0
  if ('touches' in e) {
    pageX = e.touches[0]?.pageX ?? 0
  } else {
    pageX = (e as MouseEvent).pageX
  }
  diffX = startMouseX - pageX
  if (diffX < 0) diffX = 0
  if (diffX > 350) diffX = 350
  currentArcX.value = Math.floor(diffX / 2)
  currentDir.value = 1
}

function onDragEnd() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchend', onDragEnd)

  if (animating.value || !diffX) return
  if (diffX < 40) {
    animatePath(START_BASE, 0, ANIM_TIME, 'smallElastic')
  } else {
    openSidebar()
  }
}

function openSidebar() {
  if (animating.value || isOpen.value) return
  animating.value = true
  animatePath(OPEN_BASE, 0, ANIM_TIME, 'smallElastic', () => {
    isOpen.value = true
    animating.value = false
    setTimeout(() => document.addEventListener('click', closeSidebarOutside), 100)
  })
}

function closeSidebar() {
  if (animating.value || !isOpen.value) return
  animating.value = true
  isOpen.value = false
  document.removeEventListener('click', closeSidebarOutside)
  setTimeout(() => {
    animatePath(125, -100, ANIM_TIME / 1.5, 'inCubic', () => {
      animatePath(START_BASE, 0, ANIM_TIME * 1.33, 'smallElastic', () => {
        animating.value = false
        diffX = 0
      })
    })
  }, 200)
}

function closeSidebarOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.elastic-sidebar')) return
  closeSidebar()
}

onBeforeRouteLeave(() => {
  const currentId = Number(route.params.id)
  articleScrollCache.set(currentId, window.scrollY || document.documentElement.scrollTop)
})

onMounted(() => {
  window.addEventListener('resize', () => {
    svgHeight.value = window.innerHeight > 70 ? window.innerHeight - 70 : 800
  })
  hintTimeoutId = setTimeout(playHintAnimation, 500)
  const id = Number(route.params.id)
  article.value = articles.find(a => a.id === id) || null

  axios.post(`/api/views?id=${id}`)
    .then(res => {
      const newViews = res.data?.views
      if (typeof newViews === 'number') {
        try {
          const stored = JSON.parse(sessionStorage.getItem('preloaded_views') || '{}')
          stored[id] = newViews
          sessionStorage.setItem('preloaded_views', JSON.stringify(stored))
        } catch { }
      }
    })
    .catch(() => { })

  window.addEventListener('scroll', handleScroll)
  const savedHeight = articleScrollCache.get(id) || 0
  if (savedHeight > 0) {
    requestAnimationFrame(() => window.scrollTo(0, savedHeight))
  }
})

const previewVisible = ref(false)
const previewSrc = ref('')
const IMAGE_EXTENSIONS = /\.(webp|png|jpg|jpeg|gif|bmp|svg)$/i
function closePreview() { previewVisible.value = false }
function handleMarkdownClick(e: MouseEvent) {
  handleCopy(e)
  const link = (e.target as HTMLElement).closest('a')
  if (!link) return
  const href = link.getAttribute('href')
  if (href && IMAGE_EXTENSIONS.test(href)) {
    e.preventDefault()
    previewSrc.value = href
    previewVisible.value = true
  }
}
</script>

<style>
.markdown-body img {
  display: block;
  margin: 1.5em auto;
  max-width: 100%;
  border-radius: 8px;
}

.navbar {
  background: #ececec !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border-bottom: none !important;
  box-shadow: none !important;
}
</style>

<style scoped>
.elastic-sidebar {
  position: fixed;
  top: 0px;
  right: 0;
  width: 350px;
  height: 100vh;
  z-index: 90;
  pointer-events: none;
}

.sidebar-svg {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
  overflow: visible;
}

.s-path {
  cursor: grab;
  pointer-events: auto;
  filter: drop-shadow(-8px 0px 18px rgba(0, 0, 0, 0.07));
}
.s-path:active {
  cursor: grabbing;
}

.sidebar-hint-text {
  position: absolute;
  top: 50%;
  right: 18px;
  transform: translateY(-50%) translateX(0); 
  font-family: 'YouSheBiaoTiHei', sans-serif;
  font-size: 16px;
  color: #4b5563;
  writing-mode: vertical-rl;
  letter-spacing: 4px;
  pointer-events: none;
  z-index: 10;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(30px);
}

.sidebar-content {
  position: absolute;
  top: 30px;
  right: 0;
  width: 290px;
  height: calc(100% - 60px);
  padding: 50px 20px 40px 16px;
  background: rgba(245, 247, 250, 0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  opacity: 0;
  z-index: -1;
  overflow-y: auto;
  pointer-events: none;
  border-radius: 24px 0 0 24px;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.03);
  transition: opacity 300ms ease, transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateX(30px);
}

.sidebar-content.active {
  opacity: 1;
  z-index: 2;
  transform: translateX(0);
  pointer-events: auto;
}

.sidebar-content::-webkit-scrollbar {
  display: none;
}

.toc__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-left: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.toc__icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 1);
}

.toc__title-group {
  display: flex;
  flex-direction: column;
}

.toc__title {
  font-family: 'ShangShouJiangHuShuFa';
  font-size: 18px;
  color: #1f2937;
  letter-spacing: 1px;
}

.toc__subtitle {
  font-size: 9px;
  color: #9ca3af;
  font-weight: 700;
  letter-spacing: 1.5px;
}

.toc-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 6px;
}

.toc-list::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 20px;
  left: 12px;
  width: 2px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 2px;
}

.toc__item {
  position: relative;
  display: flex;
  align-items: center;
  text-decoration: none;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-right: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: #4b5563;
}

.toc__text {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}

.toc__item--h1 .toc__text {
  font-weight: 600;
  font-size: 14.5px;
  color: #1f2937;
}

.toc__item--h2 .toc__text {
  font-size: 13.5px;
  color: #4b5563;
}

.toc__item--h3 .toc__text {
  font-size: 12.5px;
  color: #6b7280;
}

.toc__dot {
  position: absolute;
  left: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cbd5e1;
  border: 1.5px solid #f5f7fa;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

.toc__item--h1 .toc__dot {
  width: 7px;
  height: 7px;
  left: 2.5px;
}

.toc__item:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateX(4px);
}

.toc__item:hover .toc__text {
  color: #111827;
}

.toc__item:hover .toc__dot {
  background: #94a3b8;
  transform: scale(1.3);
}

.toc__item--active {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.04),
    inset 0 1px 1px rgba(255, 255, 255, 1);
  transform: translateX(4px);
}

.toc__item--active .toc__text {
  color: #111827;
  font-weight: 600;
}

.toc__item--active .toc__dot {
  width: 8px;
  height: 8px;
  left: 2px;
  background: #1f2937;
  border: 2px solid #ffffff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.article-page {
  min-height: 100vh;
  background: #ececec;
  position: relative;
  z-index: 10;
  font-weight: 400;
  padding-top: 1px;
}

.article-page *,
.content *,
.markdown-body * {
  user-select: text !important;
  -webkit-user-select: text !important;
}

main {
  display: flex;
  position: relative;
}

.content {
  margin: 0 auto 0;
  padding: 0 60px 80px;
  max-width: 1400px;
  width: 100%;
  background: #fafafa;
  min-height: calc(100vh - 140px);
  border-radius: 0 0 30px 30px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.08);
  overflow: visible;
}

.hero-image {
  position: relative;
  width: 100%;
  margin-top: 40px;
  margin-bottom: 40px;
  padding: 12px;
  background: #fafafa;
  border-radius: 24px;
  box-shadow: inset 8px 8px 16px #bebebe, inset -8px -8px 16px #ffffff;
  height: auto;
  overflow: visible;
}

.hero-image img {
  width: 100%;
  height: auto !important;
  max-height: none !important;
  object-fit: contain !important;
  display: block;
  border-radius: 12px;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.1);
}

.article-title {
  font-family: 'ShangShouJiangHuShuFa';
  font-size: clamp(1.6rem, 2vw + 0.6rem, 2.6rem); 
  font-weight: 400;
  text-align: center;
  margin: 0 0 16px 0;
  color: #1a1a1a;
  line-height: 1.35; /* 略微调大一点行高，多行时不拥挤 */
  letter-spacing: 1.5px;
  position: relative;
  z-index: 1;
}

.meta {
  color: #888;
  font-size: 14px;
  font-family: 'ShangShouJiangHuShuFa', sans-serif;
  margin: 0 0 20px 0;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.tags {
  margin: 0 0 40px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.tag {
  background: #ececec;
  color: #000;
  padding: 4px 14px;
  border-radius: 45px;
  font-size: 18px;
  font-weight: 500;
  font-family: 'YouSheBiaoTiHei';
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 4px 4px 8px #bebebe, -4px -4px 8px #ffffff;
  transition: all 0.3s ease;
  cursor: default;
}

.tag:hover {
  background-color: #23c483;
  color: #fff;
  box-shadow: 0px 15px 20px rgba(46, 229, 157, 0.4);
  transform: translateY(-7px);
}

/* ==================== 1. Markdown 正文 ==================== */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  line-height: 1.8;
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  color: #000;
  /* 例如 1000px ~ 1100px */
  max-width: 920px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  letter-spacing: 0.02em;
  text-align: left;
  word-break: normal;
  overflow-wrap: break-word;
}

/* 一级标题 */
.markdown-body :deep(h1) {
  font-family: 'Ma Shan Zheng', cursive, sans-serif;
  font-weight: normal;
  font-size: clamp(1.4rem, 1.8vw + 0.6rem, 2.2rem); /* 缩小到合适比例 */
  text-align: center;
  margin: 1.6em 0 0.6em;
  line-height: 1.3;
}

/* ==================== 2. 二级标题（得意黑） ==================== */
.markdown-body :deep(h2) {
  font-family: 'Smiley Sans', '得意黑', sans-serif;
  font-weight: 600;
  font-size: clamp(1.4rem, 2.2vw + 0.8rem, 2.2rem);
  margin: 1.8em 0 0.6em;
  line-height: 1.35;
  letter-spacing: 0.5px;
  color: #1a1a1a;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 0.35em;
}

/* ==================== 3. 三级标题（得意黑） ==================== */
.markdown-body :deep(h3) {
  font-family: 'Smiley Sans', '得意黑', sans-serif;
  font-weight: 600;
  font-size: clamp(1.18rem, 1.8vw + 0.5rem, 1.6rem);
  margin: 1.4em 0 0.5em;
  line-height: 1.4;
  letter-spacing: 0.4px;
  color: #2c3e50;
}

.markdown-body :deep(p) {
  margin-bottom: 1.25rem;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #bebebe;
  padding-left: 16px;
  color: #666;
  margin: 1.5em 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0 12px 12px 0;
  padding: 12px 16px;
}

/* 行内代码标签：等宽编程字体 */
.markdown-body :deep(p code),
.markdown-body :deep(li code),
.markdown-body :deep(h1 code),
.markdown-body :deep(h2 code),
.markdown-body :deep(h3 code) {
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-body :deep(.code-editor) {
  max-width: 100%;
  background-color: #1e1e1e;
  box-shadow: 0px 4px 30px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 2px;
  margin: 1.5em 0;
}

.markdown-body :deep(.code-editor .header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 12px;
}

.markdown-body :deep(.code-editor .title) {
  font-family: Lato, 'Open Sans', sans-serif;
  font-weight: 900;
  font-size: 14px;
  letter-spacing: 1.57px;
  color: rgb(212, 212, 212);
}

.markdown-body :deep(.code-editor .copy-btn) {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #8b92a5;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 20px;
}

.markdown-body :deep(.code-editor .copy-btn:hover) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.markdown-body :deep(.code-editor .copy-btn.copied svg) {
  color: #23c483;
}

.markdown-body :deep(.code-editor .copy-btn .copy-tips) {
  position: absolute;
  right: 36px;
  font-size: 12px;
  font-family: sans-serif;
  color: #23c483;
  font-weight: bold;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
  pointer-events: none;
}

.markdown-body :deep(.code-editor .copy-btn.copied .copy-tips) {
  opacity: 1;
  transform: translateX(0);
}

.markdown-body :deep(.code-editor .editor-content pre) {
  background: transparent !important;
  margin: 0;
  padding: 10px 14px;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, 'Courier New', monospace !important;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #d4d4d4;
}

.markdown-body :deep(.code-editor .editor-content pre code.hljs) {
  background: transparent !important;
  padding: 0;
}

/* ==================== 经典科技深蓝 + 水平向右箭头 ==================== */
.markdown-body :deep(a) {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  text-decoration: none;
  font-weight: 700;
  padding: 0 1px;
  margin: 0 2px;
  cursor: pointer;
  vertical-align: baseline;
  white-space: nowrap;

  /* 沉稳科技深蓝，掠过清透冰蓝高光 */
  background: linear-gradient(
    110deg,
    #1d4ed8 0%,
    #1d4ed8 35%,
    #93c5fd 50%,
    #1d4ed8 65%,
    #1d4ed8 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textShine 4s linear infinite;

  /* 点击时的弹性按压反馈 */
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 纯水平向右矢量箭头（→） */
.markdown-body :deep(a)::after {
  content: '';
  display: inline-block;
  width: 0.85em;  /* 水平箭头的黄金比例尺寸 */
  height: 0.85em;
  background-color: #1d4ed8; /* 与文字完全同色一体 */

  /* 顶尖开源图标库的标准水平向右箭头（粗度 3.2，端点圆润） */
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='4' y1='12' x2='19' y2='12'%3E%3C/line%3E%3Cpolyline points='12 5 19 12 12 19'%3E%3C/polyline%3E%3C/svg%3E") no-repeat center / contain;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='4' y1='12' x2='19' y2='12'%3E%3C/line%3E%3Cpolyline points='12 5 19 12 12 19'%3E%3C/polyline%3E%3C/svg%3E") no-repeat center / contain;

  /* 精准对准中文字体垂直中心线 */
  transform: translateY(1px);
  flex-shrink: 0;

  /* 平滑顺畅的向右平移过渡 */
  transition: transform 0.25s ease-in-out, background-color 0.2s ease;
}

/* ==================== 交互动效 ==================== */

/* 悬停时：箭头顺着指向自然向右滑出 4px，颜色加亮至 2563eb */
.markdown-body :deep(a):hover::after {
  background-color: #2563eb;
  transform: translateY(1px) translateX(4px);
}

/* 鼠标按下时的微机械触感 */
.markdown-body :deep(a):active {
  transform: scale(0.96);
}

/* ==================== 渐变流动动画 ==================== */
@keyframes textShine {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
.back-btn {
  position: fixed;
  top: 80px;
  left: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ececec;
  color: #1a1a1a;
  border: none;
  padding: 10px 20px;
  border-radius: 45px;
  font-family: 'YouSheBiaoTiHei';
  font-size: 16px;
  font-weight: normal;
  cursor: pointer;
  z-index: 20;
  box-shadow: 6px 6px 12px #bebebe, -6px -6px 12px #ffffff;
  transition: all 0.3s ease;
}

.back-btn:hover {
  box-shadow: inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff;
  color: #e05a5a;
}

.back-btn:active {
  transform: scale(0.96);
}

.lightbox-overlay {
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1em;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.not-found {
  text-align: center;
  margin-top: 200px;
  color: #999;
}

@media (max-width: 768px) {
  .elastic-sidebar {
    pointer-events: none;
  }

  .s-path {
    pointer-events: auto;
  }

  .sidebar-content {
    background: rgba(237, 242, 247, 0.75) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }

  .toc__item {
    background: rgba(255, 255, 255, 0.6);
    box-shadow: none;
    color: #222;
  }

  .toc__item--active {
    background: rgba(35, 196, 131, 0.8);
    color: #fff;
  }

  .sidebar-hint-text {
    color: #1a7a3a;
    font-weight: bold;
  }
}
</style>