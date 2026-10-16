import { effectScope, ref, watch } from 'vue'
import { watchPlan } from '@/services/weddings'
import { useAuthStore } from '@/stores/auth'

// The signed-in user's plan, kept live so a Ko-fi payment unlocks Plus
// without a reload. null until it has loaded.
export const myPlan = ref(null)

let started = false

// Starts listening on first use; the listener follows sign-in and sign-out
// and outlives the component that started it.
export const useMyPlan = () => {
  if (started) return myPlan
  started = true
  const auth = useAuthStore()
  let stop = null
  effectScope(true).run(() => {
    watch(() => auth.user?.uid, (uid) => {
      stop?.()
      stop = null
      myPlan.value = null
      if (!uid) return
      stop = watchPlan(uid, (plan) => { myPlan.value = plan }, (error) => {
        console.warn('Could not load plan:', error)
        myPlan.value = 'free'
      })
    }, { immediate: true })
  })
  return myPlan
}
