import { ref } from 'vue'
import { defineStore } from 'pinia'
import weddingConfig from '@/config/wedding.json'
import { fetchWedding, fetchWeddingByCode, saveWedding } from '@/services/weddings'

const clone = (value) => JSON.parse(JSON.stringify(value))

// Kept outside state so they never end up in the saved config
let loadedKey = null
let loading = null

// The code of the wedding currently shown (null until its first save)
export const weddingCode = ref(null)
// 'loading' | 'ready' | 'not-found' | 'error'
export const weddingStatus = ref('loading')

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
          weddingCode.value = result?.code ?? null
          // Merge over the template so newly added sections always exist
          this.load({ ...clone(weddingConfig), ...result?.config })
          weddingStatus.value = result === null ? 'not-found' : 'ready'
        })
        .catch((error) => {
          if (loadedKey === key) {
            loading = null
            weddingStatus.value = 'error'
          }
          throw error
        })
      return loading
    },
    // The signed-in user's wedding (template if they haven't saved yet).
    // Signed out → the default template.
    loadForUser(uid) {
      if (!uid) return this.loadOnce('template', async () => ({ config: null, code: null }))
      return this.loadOnce(`user:${uid}`, () => fetchWedding(uid))
    },
    // A shared wedding, opened by guests via /<code>
    loadByCode(code) {
      return this.loadOnce(`code:${code}`, () => fetchWeddingByCode(code))
    },
    async saveForUser(uid) {
      weddingCode.value = await saveWedding(uid, this.snapshot())
    },
  },
})
