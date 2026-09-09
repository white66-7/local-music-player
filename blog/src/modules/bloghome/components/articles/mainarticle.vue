<script lang="ts">
// 记忆芯片
let globalSavedPage = 1
let globalSavedScroll = 0
// 记录这个页面的初始进入动画是否已经播放过
let globalSearchAnimated = false

export default {
  name: 'MainArticle'
}
</script>

<script setup lang="ts">
import axios from 'axios'
import { onActivated, ref, computed, watch, onMounted, nextTick, onDeactivated, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { articles as allArticles } from '@/date/articles'
import Navbar from '@/modules/bloghome/components/load.vue'
import SearchRecentCard from '@/modules/bloghome/components/articles/search_article.vue'
import PageHeader from '@/modules/bloghome/components/articles/PageHeader.vue'
import TarsWidget from '@/modules/bloghome/components/articles/TarsWidget.vue'
import { preloadImages as cachePreload, isImageLoaded, markImageLoaded } from '@/modules/bloghome/utils/imageCache'
import { prefetchArticleDetail } from '@/modules/bloghome/utils/prefetch'

import 'animate.css'

const router = useRouter()
const scrollRef = ref<HTMLElement | null>(null)
const articlesContainerRef = ref<HTMLElement | null>(null)
const contentTopRef = ref<HTMLElement | null>(null)
const searchKeyword = ref('')

const imageLoaded = ref<Record<number, boolean>>({})

// ===== 分页逻辑 =====
const currentPage = ref(globalSavedPage)
const pageSize = ref(6)
const playSearchAnimation = ref(!globalSearchAnimated)

const preloadCovers = (articles: { id: number; cover?: string }[]) => {
  const withCover = articles.filter(a => a.cover)
  withCover.forEach(a => {
    if (isImageLoaded(a.cover!)) imageLoaded.value[a.id] = true
  })
  cachePreload(withCover.map(a => a.cover!)).then(() => {
    withCover.forEach(a => { imageLoaded.value[a.id] = true })
  })
}

watch(currentPage, (newPage) => {
  globalSavedPage = newPage
})

const scrollToArticles = async () => {
  await nextTick()
  if (scrollRef.value && contentTopRef.value) {
    const targetTop = contentTopRef.value.offsetTop - 80
    scrollRef.value.scrollTo({ top: targetTop, behavior: 'auto' })
  }
}

watch(searchKeyword, () => {
  currentPage.value = 1
  scrollToArticles()
})

const onImageLoad = (articleId: number) => {
  imageLoaded.value[articleId] = true
  const article = paginatedArticles.value.find(a => a.id === articleId)
  if (article?.cover) markImageLoaded(article.cover)
}

const sortedArticles = computed(() =>
  [...allArticles].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0
    const timeB = b.date ? new Date(b.date).getTime() : 0
    return timeB - timeA
  })
)

const filteredArticles = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return sortedArticles.value
  return sortedArticles.value.filter(article =>
    article.title.toLowerCase().includes(kw) ||
    article.excerpt?.toLowerCase().includes(kw) ||
    article.tags?.some(tag => tag.toLowerCase().includes(kw)) ||
    article.type?.toLowerCase().includes(kw)
  )
})

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredArticles.value.slice(start, start + pageSize.value)
})

watch(paginatedArticles, () => preloadCovers(paginatedArticles.value), { immediate: true })

const totalPages = computed(() => Math.ceil(filteredArticles.value.length / pageSize.value) || 1)

const goToPage = (page: number) => {
  currentPage.value = page
  scrollToArticles()
}
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    scrollToArticles()
  }
}
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    scrollToArticles()
  }
}

// 💡 优化 1：点击进入详情页时，前端立即乐观 +1
const goToArticle = (id: number) => {
  if (typeof articleViews.value[id] === 'number') {
    articleViews.value[id]! += 1
  }
  router.push(`/article/${id}`)
}

// ========= 滚动动画 =========
const animatedIds = ref(new Set<number>())
let observer: IntersectionObserver | null = null

const initCardsObserver = async () => {
  animatedIds.value.clear()
  await nextTick()
  if (!articlesContainerRef.value) return

  observer?.disconnect()

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target as HTMLElement
          const id = Number(card.dataset.articleId)
          if (id && !animatedIds.value.has(id)) {
            animatedIds.value.add(id)
            observer?.unobserve(card)
          }
        }
      })
    },
    { threshold: 0.1 }
  )

  const cards = articlesContainerRef.value.querySelectorAll('.card')
  cards.forEach(card => observer!.observe(card))
}

// ==================== 💡 核心新增：TARS 仅在文章可见时出现的观察器 ====================
const isArticlesVisible = ref(false)
let tarsObserver: IntersectionObserver | null = null

const initTarsVisibilityObserver = async () => {
  await nextTick()
  if (!articlesContainerRef.value || !scrollRef.value) return
  tarsObserver?.disconnect()

  tarsObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) {
        // 当卡片容器进入视口时为 true，滑到顶部海报时为 false
        isArticlesVisible.value = entry.isIntersecting
      }
    },
    {
      root: scrollRef.value,
      threshold: 0.05 // 只要卡片露出一角就自然唤出
    }
  )

  tarsObserver.observe(articlesContainerRef.value)
}

// 分页变化时重新联动监听
watch(paginatedArticles, () => {
  initCardsObserver()
  initTarsVisibilityObserver()
}, { immediate: true })

// ==================== 浏览量加载体系 ====================
const getPreloadedViews = (): Record<number, number> => {
  try {
    const raw = sessionStorage.getItem('preloaded_views')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const articleViews = ref<Record<number, number | undefined>>(getPreloadedViews())

const fetchViewsForArticles = async (articles: typeof paginatedArticles.value) => {
  if (!articles || articles.length === 0) return

  const ids = articles.map(a => a.id).join(',')
  try {
    const res = await axios.get(`/api/views?ids=${ids}&_t=${Date.now()}`)
    const remoteViews = res.data.views || {}

    articles.forEach(a => {
      articleViews.value[a.id] = remoteViews[a.id] ?? remoteViews[String(a.id)] ?? 0
    })
  } catch (err) {
    console.warn('[Views] 获取阅读量失败:', err)
    articles.forEach(a => {
      if (articleViews.value[a.id] === undefined) {
        articleViews.value[a.id] = 0
      }
    })
  }
}

watch(paginatedArticles, (newArticles) => {
  fetchViewsForArticles(newArticles)
}, { immediate: false })

onActivated(async () => {
  console.log('✅ MainArticle 从缓存恢复')
  await initCardsObserver()
  await initTarsVisibilityObserver()
  fetchViewsForArticles(paginatedArticles.value)
})

onDeactivated(() => {
  console.log('📦 MainArticle 被缓存，离开页面')
})

onBeforeRouteLeave(() => {
  if (scrollRef.value) globalSavedScroll = scrollRef.value.scrollTop
})

onMounted(async () => {
  await nextTick()
  if (!globalSearchAnimated) {
    globalSearchAnimated = true
    setTimeout(() => {
      playSearchAnimation.value = false
    }, 3000)
  }

  if (scrollRef.value && globalSavedScroll > 0) {
    scrollRef.value.scrollTop = globalSavedScroll
  }

  fetchViewsForArticles(paginatedArticles.value)
  prefetchArticleDetail()
})

onUnmounted(() => {
  if (tarsObserver) tarsObserver.disconnect()
})
</script>

<template>
  <div class="app-page-wrapper">
    <Navbar :transparent="false" />
    <div class="scrollable-content" ref="scrollRef">
      <div class="main-body">

        <PageHeader v-show="currentPage === 1" :total-count="filteredArticles.length" :articles="allArticles" />

        <!-- 锚点：不管上面海报在不在，永远对准这里跳转 -->
        <div class="content-full" ref="contentTopRef">

          <div :class="[playSearchAnimation ? 'animate__animated animate__fadeInUp' : '']"
            style="animation-delay: 1.40s">
            <SearchRecentCard v-model="searchKeyword" class="search-card" />
          </div>

          <div ref="articlesContainerRef" class="articles-container">
            <div v-for="(article, index) in paginatedArticles" :key="article.id" :class="[
              'card',
              index % 2 === 0 ? 'horizontal' : 'reverse-horizontal',
              { 'animate__animated animate__bounceIn fast-enter': animatedIds.has(article.id) }
            ]" :data-article-id="article.id" @mouseenter="prefetchArticleDetail" @click="goToArticle(article.id)">
              <div v-if="article.cover" class="card__img-wrapper">
                <div :class="['skeleton-img', { 'skeleton-hidden': imageLoaded[article.id] }]"></div>
                <img :src="article.cover" class="card__img" :class="{ 'img-visible': imageLoaded[article.id] }"
                  @load="onImageLoad(article.id)" @error="onImageLoad(article.id)" />
              </div>
              <div v-else class="card__img placeholder-img">暂无封面</div>
              <div class="card__content">
                <div class="card__title">{{ article.title }}</div>
                <div class="card__info-bar">
                  <div class="card__date">{{ article.date }}</div>

                  <!-- 浏览量展示区域 -->
                  <div class="card__views">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" viewBox="0 0 24 24"
                      class="view-icon">
                      <path d="M0 0h24v24H0z" fill="none" />
                      <path fill="currentColor"
                        d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5" />
                    </svg>

                    <span v-if="articleViews[article.id] === undefined" class="skeleton-views-pill"></span>
                    <span v-else class="views-num-text">
                      {{ articleViews[article.id] }}
                    </span>
                  </div>
                </div>
                <div class="card__excerpt">{{ article.excerpt }}</div>
                <div class="card__tags">
                  <span v-for="tag in article.tags" :key="tag" class="tag">
                    <i class="fa fa-tag"></i> {{ tag || '未知' }}
                  </span>
                </div>

              </div>
            </div>
          </div>

          <div class="pagination" v-if="totalPages > 1">
            <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">上一页</button>
            <div class="page-numbers">
              <button v-for="page in totalPages" :key="page" :class="['page-num-btn', { active: currentPage === page }]"
                @click="goToPage(page)">
                {{ page }}
              </button>
            </div>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">下一页</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 💡 2. 仅在文章卡片显示时才浮现，带平滑弹性滑入/滑出动画 -->
    <transition name="tars-pop">
      <TarsWidget v-show="isArticlesVisible" />
    </transition>
  </div>
</template>

<style scoped>
/* ========= 全局布局 ========= */
.app-page-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: #FAF7F2;
  background-image:
    radial-gradient(rgba(120, 90, 60, .03) 1px,
      transparent 1px);
}

.scrollable-content {
  position: relative;
  z-index: 2;
  height: 100vh;
  height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(180%);
}

.main-body {
  padding: 80px 5% 60px 5%;
  box-sizing: border-box;
  max-width: 1400px;
  margin: 0 auto;
}

/* ========= 全宽内容区 ========= */
.content-full {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-card {
  width: 100%;
  height: auto;
  margin-top: -10px;
}

/* ========= 文章列表容器及卡片样式 ========= */
.articles-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.fast-enter {
  animation-duration: 0.6s !important;
}

.articles-container .card {
  min-height: 220px;
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08);
}

.articles-container .card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.card.horizontal {
  flex-direction: row;
}

.card.reverse-horizontal {
  flex-direction: row-reverse;
}

/* ========= 图片包裹容器及骨架屏 ========= */
.card.horizontal .card__img-wrapper,
.card.reverse-horizontal .card__img-wrapper {
  width: 40%;
  aspect-ratio: 16 / 9;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
}

.skeleton-img {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: linear-gradient(90deg,
      #e0e0e0 25%,
      #f5f5f5 50%,
      #e0e0e0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  opacity: 1;
  transition: opacity 0.4s ease;
}

.skeleton-hidden {
  opacity: 0;
  pointer-events: none;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.card__img-wrapper .card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  position: relative;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.img-visible {
  opacity: 1 !important;
}

.placeholder-img {
  width: 40%;
  aspect-ratio: 16 / 9;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

/* ========= 卡片内容区 ========= */
.card.horizontal .card__content,
.card.reverse-horizontal .card__content {
  width: 60%;
  display: flex;
  flex-direction: column;
  padding: 20px 30px;
  box-sizing: border-box;
  justify-content: center;
}

.card__title {
  font-family: 'YouSheBiaoTiHei';
  font-size: 22px;
  font-weight: normal;
  margin-bottom: 10px;
  color: #1a1a1a;
  line-height: 1.3;
}

.card__info-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
}

.card__date {
  font-family: 'Orbitron', 'YouSheBiaoTiHei';
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 0;
  display: flex;
  align-items: center;
}

/* 浏览量容器 */
.card__views {
  margin-top: 0;
  font-family: 'Orbitron', 'YouSheBiaoTiHei';
  font-size: 12px;
  color: #9CA3AF;
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 16px;
}

.view-icon {
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.card:hover .view-icon {
  transform: scale(1.15);
  color: #23c483;
}

.skeleton-views-pill {
  display: inline-block;
  width: 26px;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: views-shimmer 1.2s infinite linear;
}

@keyframes views-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.views-num-text {
  display: inline-block;
  animation: numFadeIn 0.35s ease-out forwards;
}

@keyframes numFadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

.card__excerpt {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  font-weight: 550;
  color: #374151; 
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  white-space: pre-wrap;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-self: flex-start;
}

.tag {
  background: #fff;
  color: #000;
  padding: 6px 15px;
  border-radius: 45px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'YouSheBiaoTiHei';
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease 0s;
  cursor: default;
}

.tag:hover {
  background-color: #23c483;
  color: #fff;
  box-shadow: 0px 15px 20px rgba(46, 229, 157, 0.4);
  transform: scale(1.15);
}

/* ========= 分页 ========= */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.page-btn {
  padding: 6px 14px;
  border: none;
  background-color: #fff;
  color: #333;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background-color: #23c483;
  color: #fff;
}

.page-btn:disabled {
  background-color: rgba(255, 255, 255, 0.3);
  color: #999;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-num-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: #fff;
  cursor: pointer;
  font-weight: bold;
}

.page-num-btn.active {
  background-color: #23c483;
  color: white;
}

/* ================= 💡 3. TARS 弹性平滑浮现与缩回动画 ================= */
.tars-pop-enter-active,
.tars-pop-leave-active {
  transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tars-pop-enter-from,
.tars-pop-leave-to {
  opacity: 0;
  transform: translateY(40px) scale(0.8);
  pointer-events: none;
}

/* ========= 响应式适配 ========= */
@media (max-width: 768px) {
  .main-body {
    padding: 80px 5% 40px 5%;
  }

  .articles-container .card {
    height: auto;
  }

  .card.horizontal,
  .card.reverse-horizontal {
    flex-direction: column !important;
  }

  .card.horizontal .card__img-wrapper,
  .card.reverse-horizontal .card__img-wrapper {
    width: 100%;
    height: 160px;
  }

  .card.horizontal .card__img,
  .card.reverse-horizontal .card__img {
    height: 100%;
  }

  .card.horizontal .card__content,
  .card.reverse-horizontal .card__content {
    width: 100%;
    padding: 16px;
  }

  .page-numbers {
    display: none;
  }
}
</style>