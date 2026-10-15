import { ref, computed } from 'vue'

// Signed-out visitors can preview the default template for a limited time
export const DEMO_DURATION_MS = 5 * 60 * 1000
const STORAGE_KEY = 'demoExpiresAt'

const readStored = () => {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0
  } catch {
    return 0
  }
}

export const demoExpiresAt = ref(readStored())

// Ticks every second while a demo runs, so the countdown and expiry stay live
const now = ref(Date.now())
let ticker = null
const tick = () => {
  now.value = Date.now()
  if (now.value >= demoExpiresAt.value) {
    clearInterval(ticker)
    ticker = null
  }
}
const startTicker = () => {
  if (!ticker && demoExpiresAt.value > Date.now()) ticker = setInterval(tick, 1000)
}
startTicker()

export const demoActive = computed(() => demoExpiresAt.value > now.value)
export const demoSecondsLeft = computed(() => Math.max(0, Math.ceil((demoExpiresAt.value - now.value) / 1000)))

export const startDemo = () => {
  demoExpiresAt.value = Date.now() + DEMO_DURATION_MS
  now.value = Date.now()
  try { localStorage.setItem(STORAGE_KEY, String(demoExpiresAt.value)) } catch { /* demo still runs this tab */ }
  startTicker()
}

export const endDemo = () => {
  demoExpiresAt.value = 0
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* nothing stored */ }
}
