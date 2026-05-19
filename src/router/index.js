import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/components/Home.vue'
import EventsView from '@/components/Events.vue'
import Story from '@/components/Story.vue'
import Moments from '@/components/Moments.vue'
import couple from '../components/couple.vue'

  const routes = [
    {
      path: '/',
      name: '.root',
      component: HomeView
    },
    {
      path: '/events',
      name: 'events',
      component: EventsView
    },
    {
        path: '/story',
        name: 'story',
        component: Story
    },
    {
        path: '/moments',
        name: 'moments',
        component: Moments
    },
    {
        path: '/couple',
        name: 'couple',
        component: couple
    }
  ]

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
  })

  export default router