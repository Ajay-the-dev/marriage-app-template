import { ref } from 'vue'
import { defineStore } from 'pinia'
import weddingConfig from '@/config/wedding.json'
import { fetchPlan, fetchViewCount, fetchWedding, fetchWeddingByCode, recordVisit, saveWedding } from '@/services/weddings'
import { useAuthStore } from '@/stores/auth'
import { getPlan, overLimits } from '@/config/plans'

const clone = (value) => JSON.parse(JSON.stringify(value))

// Kept outside state so they never end up in the saved config
let loadedKey = null
let loading = null

// The code of the wedding currently shown (null until its first save)
export const weddingCode = ref(null)
// 'loading' | 'ready' | 'not-found' | 'blocked' (over its owner's plan limits) | 'hidden' (by its owner)
export const weddingStatus = ref('loading')
// Bookkeeping for the wedding being edited: { uploads, locked, editLocked, hidden }
export const weddingMeta = ref({ uploads: 0, locked: false, editLocked: false, hidden: false })
// Plan of the shown wedding's owner ('free' for the template)
export const ownerPlan = ref('free')

// Counts a guest visit in the background; the owner's own previews don't count
const countVisit = async ({ id, ownerId }) => {
  const auth = useAuthStore()
  await auth.waitUntilReady()
  if (auth.user?.uid === ownerId) return
  recordVisit(id).catch((error) => console.warn('Could not record visit:', error))
}

// Whether guests may see this wedding under its owner's plan
const guestCanView = async (wedding, plan) => {
  if (wedding.locked || overLimits(wedding.config, plan).length) return false
  if (plan.visitors === Infinity) return true
  // Visitors already counted in this browser keep access
  try { if (localStorage.getItem(`visited:${wedding.id}`)) return true } catch { /* fall through */ }
  return (await fetchViewCount(wedding.id)) < plan.visitors
}

export const useWeddingStore = defineStore('wedding', {
  state: () => clone(weddingConfig),
  actions: {
    // Replace the whole config (import / discard changes)
    load(config) {
      this.$patch((state) => {
        Object.assign(state, clone(config))
      })
    },
    reset() {
      this.load(weddingConfig)
    },
    snapshot() {
      return clone(this.$state)
    },
    // Loads a wedding once per key; later calls with the same key reuse it
    // (so unsaved edits survive moving between Settings and the site).
    loadOnce(key, fetcher) {
      if (loadedKey === key && loading) return loading
      loadedKey = key
      weddingStatus.value = 'loading'
      loading = fetcher()
        .then((result) => {
          if (loadedKey !== key) return // a newer load replaced this one
          if (result?.blocked || result?.hidden) {
            weddingCode.value = null
            this.reset()
            weddingStatus.value = result.hidden ? 'hidden' : 'blocked'
            return
          }
          weddingCode.value = result?.code ?? null
          weddingMeta.value = { uploads: result?.uploads ?? 0, locked: !!result?.locked, editLocked: !!result?.editLocked, hidden: !!result?.hidden }
          ownerPlan.value = result?.plan ?? 'free'
          // Merge over the template so newly added sections always exist
          this.load({ ...clone(weddingConfig), ...result?.config })
          weddingStatus.value = result === null ? 'not-found' : 'ready'
        })
        .catch((error) => {
          if (loadedKey === key) {
            loading = null
            // Fall back to the default template so the site still renders
            weddingCode.value = null
            ownerPlan.value = 'free'
            this.reset()
            weddingStatus.value = 'ready'
          }
          throw error
        })
      return loading
    },
    // The default template, shown on the site root
    loadTemplate() {
      return this.loadOnce('template', async () => ({ config: null, code: null }))
    },
    // One of the signed-in user's weddings, for editing in Settings
    loadById(id) {
      return this.loadOnce(`wedding:${id}`, () => fetchWedding(id))
    },
    // A shared wedding, opened by guests via /<code>
    loadByCode(code) {
      return this.loadOnce(`code:${code}`, async () => {
        // Signed in first, so owners can still preview their hidden invitations
        await useAuthStore().waitUntilReady()
        const result = await fetchWeddingByCode(code)
        if (!result || result.hidden) return result
        const planId = await fetchPlan(result.ownerId)
        const plan = getPlan(planId)
        if (!(await guestCanView(result, plan))) return { blocked: true }
        countVisit(result)
        // Free plans can't customise navigation; guests see the defaults
        const config = plan.editNavigation ? result.config : { ...result.config, navigation: clone(weddingConfig.navigation) }
        return { ...result, config, plan: planId }
      })
    },
    // keepVersions: how many earlier versions to keep (Plus), 0 for none
    async saveById(id, uid, { keepVersions = 0 } = {}) {
      weddingCode.value = await saveWedding(id, uid, this.snapshot(), null, { keepVersions })
    },
    // Puts an earlier version into the editor (unsaved until the next save)
    restore(config) {
      this.load({ ...clone(weddingConfig), ...config })
    },
  },
})
