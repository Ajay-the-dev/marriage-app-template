import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/components/Home.vue'
import EventsView from '@/components/Events.vue'
import Story from '@/components/Story.vue'
import Moments from '@/components/Moments.vue'
import couple from '../components/couple.vue'
import { useAuthStore } from '@/stores/auth'

// Invitation pages. They are served twice:
//   /events             → the signed-in user's own wedding (or the template)
//   /AB12CD34EF56/events → a shared wedding, looked up by its 12-character code
const pages = [
  { path: '', name: '.root', component: HomeView },
  { path: 'events', name: 'events', component: EventsView },
  { path: 'story', name: 'story', component: Story },
  { path: 'moments', name: 'moments', component: Moments },
  { path: 'couple', name: 'couple', component: couple },
]

export const SHARE_CODE_PATTERN = '[A-Z0-9]{12}'

const routes = [
  ...pages.map((page) => ({ ...page, path: `/${page.path}` })),
  {
    path: `/:code(${SHARE_CODE_PATTERN})`,
    children: pages.map((page) => ({ ...page, name: `shared${page.name}` })),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/components/Login.vue'),
    meta: { guestOnly: true, bare: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/components/Settings.vue'),
    meta: { requiresAuth: true, bare: true }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.guestOnly) return true
  const auth = useAuthStore()
  await auth.waitUntilReady()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isLoggedIn) {
    const target = to.query.redirect
    return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/'
  }
  return true
})

export default router
