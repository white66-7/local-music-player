export interface Article {
  id: number
  title: string
  type: string
  date: string
  readTime: string
  excerpt: string
  tags: string[]
  cover: string
  content: string   
}

import md1 from './md/1.md?raw'
import md2 from './md/2.md?raw'
import md3 from './md/3.md?raw'
import md4 from './md/4.md?raw'
import md5 from './md/5.md?raw'
import md6 from './md/6.md?raw'
import md7 from './md/7.md?raw'
import md8 from './md/8.md?raw'
import md9 from './md/9.md?raw'
import md10 from './md/10.md?raw'
import md11 from './md/11.md?raw'
import md12 from './md/12.md?raw'
import md13 from './md/13.md?raw'
import md14 from './md/14.md?raw'
import md15 from './md/15.md?raw'
import md16 from './md/16.md?raw'
import md17 from './md/17.md?raw'
import md18 from './md/18.md?raw'

export const articles: Article[] = [
  {
    id: 1,
    title: '从零开始的进阶之路',
    type: '前端',
    date: '2026-06-14',
    readTime: '10 minutes',
    excerpt: '那是一个月黑风高的白天...',
    tags: ['vue3', '前端','网站构建'],
    cover: '/covers/text.webp',
    content: md1
  },
  {
    id: 2,
    title: '新手村的第一个BOSS',
    type: '复盘',
    date: '2026-06-16',
    readTime: '2 minutes',
    excerpt: '5月末写完第一个网页时认为逻辑缜密,待到后来回想起发现漏洞有很多',
    tags: ['html', 'css','javascript'],
    cover: '/covers/game.webp',   
       content:md2,
  },
  {
    id: 3,
    title: '实战记录:实时天气动画组件设计',
    type: '前端',
    date: '2026-06-17',
    readTime: '5 minute',
    excerpt: '常用前端网站与实时天气组件',
    tags: ['组件式设计', '实时天气'],
    cover: '/messages/3/view.webp',
    content:md3,
  },
  {
    id: 4,
    title: '实战记录:相册组件设计',
    type: '前端',
    date: '2026-06-19',
    readTime: '5 minutes',
    excerpt: '承接上文,浅谈我的相册组件设计',
    tags: ['组件式设计', '相册展示'],
    cover: '/covers/left.webp',
    content:md4,
  },
    {
    id: 5,
    title: '实战记录:双网页视图与深色遮罩',
    type: '前端',
    date: '2026-06-27',
    readTime: '10 minutes',
    excerpt: '波浪动画,页面深色遮罩,上下双页面实现原理',
    tags: ['组件式设计', 'swiper'],
    cover: '/covers/animation.webp',
    content:md5,
  },
      {
    id: 6,
    title: '实战记录:悬停与入场动画效果',
    type: '前端',
    date: '2026-06-30',
    readTime: '3 minutes',
    excerpt: '记录几个悬停效果和入场动画,适合用在按钮亦或是装饰性的元素上',
    tags: ['css', 'animation','动画'],
    cover: '/messages/6/rest.gif',
    content:md6,
  },
  {
    id: 7,
    title: 'Re:从零开始的异世界生活-11集',
    type: '杂谈',
    date: '2026-06-20',
    readTime: '2 minutes',
    excerpt: '攒了好久了re0第四季前半部看完了,有点感概',
    tags: ['动漫', 're0'],
    cover: '/messages/7/re0.webp',
    content:md7,
  },
  {
    id: 8,
    title: '期末自救笔记',
    type: '大学',
    date: '2026-07-01',
    readTime: '2 minutes',
    excerpt: '稍微复习整理一下,一些基本的学科知识点来应付期末考试',
    tags: ['大学', '数据结构','应试'],
    cover: '/messages/8/tired.webp',
    content:md8,
  },
  {
    id: 9,
    title: '对算法的初级理解',
    type: '算法',
    date: '2026-07-03',
    readTime: '20 minutes',
    excerpt: '考完后去感受了一下ACM,比赛前总结一下对算法知识的理解',
    tags: ['大学', 'ACM', '算法'],
    cover: '/messages/9/view.webp',
    content:md9,
  },
  {
    id: 10,
    title: '建站的步骤与基本原理',
    type: '复盘',
    date: '2026-07-10',
    readTime: '20 minutes',
    excerpt: '因为网站更换网络后不稳定,所以花了一个月研究了国内网络下如何正常的建站',
    tags: ['vercel', '网站', '服务器'],
    cover: '/messages/10/earth.webp',
    content:md10,
  },
  {
    id: 11,
    title: '博客文章主界面渲染逻辑',
    type: '前端',
    date: '2026-07-12',
    readTime: '20 minutes',
    excerpt: '动态路由,makedown解析,目录导航等一系列蛮有意思的东西。',
    tags: ['MarkdownIt', '前端', '动态路由'],
    cover: '/messages/11/difficult.webp',
    content:md11,
  },
  {
    id: 12,
    title: '前端资源数据处理与骨架屏加载',
    type: '后端',
    date: '2026-07-18',
    readTime: '20 minutes',
    excerpt: '对图片,字体,音频及基本数据处理方式,夹带骨架屏加载动画实现效果。',
    tags: ['数据库', '数据'],
    cover: '/messages/12/big.webp',
    content:md12,
  },
  {
    id: 13,
    title: '磁盘清理方法焚诀',
    type: '杂谈',
    date: '2026-07-22',
    readTime: '10 minutes',
    excerpt: '难道说你的C盘又、又、又、又爆红啦?',
    tags: ['win11', '磁盘','焚诀'],
    cover: '/messages/13/robot.webp',
    content:md13,
  },
  {
    id: 14,
    title: '告别限制:在笔记本上部署本地模型',
    type: '杂谈',
    date: '2026-07-29',
    readTime: '10 minutes',
    excerpt: '难道会拒绝一个输出结果不受官方限制的本地模型?',
    tags: ['Ollama', '大模型'],
    cover: '/messages/14/climb.webp',
    content:md14,
  },
  {
    id: 15,
    title: '加载屏实现逻辑',
    type: '前端',
    date: '2026-08-03',
    readTime: '10 minutes',
    excerpt: '加载屏如何实现后台加载和实时更新？',
    tags: ['前端', 'Typescript','多屏逻辑'],
    cover: '/messages/15/stay.gif',
    content:md15,
  },
  {
    id: 16,
    title: '用python简单实现桌面工具开发',
    type: '后端',
    date: '2026-08-20',
    readTime: '10 minutes',
    excerpt: '或许用过之后,才能理解何谓  "Life is short, I use Python."',
    tags: ['Python', 'tkinter','pystray'],
    cover: '/messages/16/法环.gif',
    content:md16,
  },
  {
    id: 17,
    title: '那些不得不薅的云羊毛',
    type: '杂谈',
    date: '2026-08-27',
    readTime: '10 minutes',
    excerpt: '就自己使用体验锐评国内外云免费套餐',
    tags: ['Serverless', '免费套餐'],
    cover: '/messages/17/1.webp',
    content:md17,
  },
  {
    id: 18,
    title: '3D效果与动画实现',
    type: '前端',
    date: '2026-09-01',
    readTime: '10 minutes',
    excerpt: '',
    tags: ['前端', 'Gsap', 'Snap'],
    cover: '/messages/18/space.webp',
    content:md18,
  },
  // {
  //   id: 14,
  //   title: '论我的学生时代',
  //   type: '杂谈',
  //   date: '2026-07-26',
  //   readTime: '10 minutes',
  //   excerpt: '找到逆转时间的公式,然后彻底接受失去',
  //   tags: ['高中', '感想'],
  //   cover: '/messages/14/figure.webp',
  //   content:md14,
  // },
]