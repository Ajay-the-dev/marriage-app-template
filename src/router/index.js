import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/components/Home.vue'
import EventsView from '@/components/Events.vue'
import Story from '@/components/Story.vue'
import Moments from '@/components/Moments.vue'
import couple from '../components/couple.vue'
import { watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { demoActive, endDemo } from '@/stores/demo'
import { isMobileDevice, preferredSettingsView, setPreferredSettingsView } from '@/utils/device'

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
  // The default template needs a signed-in user or a running demo
  ...pages.map((page) => ({ ...page, path: `/${page.path}`, meta: { template: true } })),
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
    component: () => import('@/components/WeddingList.vue'),
    meta: { requiresAuth: true, bare: true }
  },
  {
    path: '/settings/:id',
    name: 'edit-wedding',
    component: () => import('@/components/Settings.vue'),
    meta: { requiresAuth: true, bare: true }
  },
  {
    path: '/settings/mobile',
    name: 'settings-mobile',
    component: () => import('@/components/WeddingList2.vue'),
    meta: { requiresAuth: true, bare: true }
  },
  {
    path: '/settings/:id/mobile',
    name: 'edit-wedding-mobile',
    component: () => import('@/components/Settings2.vue'),
    meta: { requiresAuth: true, bare: true }
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Phones get the mobile list and editor. Links to the desktop ones carry ?view=desktop,
// which is remembered for the rest of the session.
const MOBILE_ROUTES = { settings: 'settings-mobile', 'edit-wedding': 'edit-wedding-mobile' }
router.beforeEach((to) => {
  if (to.query.view === 'desktop') {
    setPreferredSettingsView('desktop')
    const { view, ...query } = to.query
    return { path: to.path, query, hash: to.hash, replace: true }
  }
  const mobileName = MOBILE_ROUTES[to.name]
  if (mobileName && isMobileDevice() && preferredSettingsView() !== 'desktop') {
    return { name: mobileName, params: to.params, query: to.query, replace: true }
  }
  return true
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.guestOnly && !to.meta.template) return true
  const auth = useAuthStore()
  await auth.waitUntilReady()
  if (to.meta.template && !auth.isLoggedIn && !demoActive.value) {
    return { name: 'login' }
  }
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isLoggedIn) {
    const target = to.query.redirect
    return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/'
  }
  return true
})

// Send demo visitors back to login when their time runs out
watch(demoActive, (active) => {
  if (active) return
  const route = router.currentRoute.value
  if (route.meta.template && !useAuthStore().isLoggedIn) router.replace({ name: 'login' })
})

// Signing in ends any demo, so it doesn't linger for the next signed-out visit
router.afterEach(() => {
  if (demoActive.value && useAuthStore().isLoggedIn) endDemo()
})

export default router
