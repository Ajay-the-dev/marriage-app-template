<script setup>
// import HelloWorld from './components/HelloWorld.vue'
import { ref, computed, watch, watchEffect }  from 'vue'
import { useRoute, useRouter } from 'vue-router'
import floatingMenu from "@/components/bottomMenu.vue";
import bytespeaks from "./components/bytespeaks.vue";
import imageSlider from "./components/imageSlider.vue";
import UpgradePlus from "@/components/UpgradePlus.vue";
import { useWeddingStore, weddingStatus, ownerPlan } from "@/stores/wedding";
import { getPlan } from "@/config/plans";
import { applyTheme } from "@/config/themes";
import { useAuthStore } from "@/stores/auth";
import { demoActive, demoSecondsLeft } from "@/stores/demo";
import { isPreviewFrame, isPreviewMessage, PREVIEW_CONFIG, PREVIEW_NAVIGATE, PREVIEW_READY } from "@/utils/preview";

const wedding = useWeddingStore()
const route = useRoute()
// Settings and login render on their own, without the invitation chrome
const isBare = computed(() => !!route.meta.bare)

const shareCode = computed(() => route.params.code || null)

// Guests open /<code>; the site root shows the default template.
// Settings pages load the wedding being edited themselves.
watch([shareCode, isBare], ([code, bare]) => {
  if (bare || isPreviewFrame) return
  const load = code ? wedding.loadByCode(code) : wedding.loadTemplate()
  load.catch((error) => console.error('Could not load wedding:', error))
}, { immediate: true })

// Inside the editor's live preview, the wedding comes from the editor instead
// (with sample content in its empty fields, marked by a watermark)
const previewSample = ref(false)
if (isPreviewFrame) {
  const router = useRouter()
  window.addEventListener('message', (event) => {
    if (!isPreviewMessage(event, window.parent)) return
    const { type, config, plan, path, sample } = event.data
    if (type === PREVIEW_CONFIG) {
      previewSample.value = !!sample
      wedding.load(config)
      ownerPlan.value = plan ?? 'free'
      weddingStatus.value = 'ready'
    } else if (type === PREVIEW_NAVIGATE && path !== route.path) {
      router.push(path)
    }
  })
  window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin)
}

// Countdown for signed-out visitors previewing the template
const auth = useAuthStore()
const showDemoTimer = computed(() => demoActive.value && !auth.isLoggedIn && !!route.meta.template)
const demoTimeLeft = computed(() => {
  const s = demoSecondsLeft.value
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

// Signed in on the default template, the content is only sample data:
// buttons inside its pages send the user to their invitations instead (navigation still works)
const router = useRouter()
const SAMPLE_PAGES = ['events', 'story', 'moments', 'couple']
const CLICKABLE = 'button, a, [role="button"], .gallery-item'
const NAVIGATION = '.desktop-nav-container, .floating-menu-container, [data-allow-click]'
const redirectToSettings = (event) => {
  if (isPreviewFrame || shareCode.value || !SAMPLE_PAGES.includes(route.name) || !auth.isLoggedIn) return
  const target = event.target.closest?.(CLICKABLE)
  if (!target || target.closest(NAVIGATION)) return
  event.preventDefault()
  event.stopPropagation()
  router.push({ name: 'settings' })
}
document.addEventListener('click', redirectToSettings, true)

// Save-the-date popup, decided once the wedding has loaded
const showImagePopup = ref(false)
watch(weddingStatus, (status) => {
  if (status !== 'ready' || isPreviewFrame) return
  const { enabled, expiresAt, images } = wedding.saveTheDate
  const isExpired = expiresAt && new Date() > new Date(expiresAt)
  showImagePopup.value = !!(enabled && !isExpired && images?.length)
}, { immediate: true })

// Apply per-couple site settings (updates live while editing in Settings)
watchEffect(() => {
  document.title = wedding.site.title
  applyTheme(wedding.theme)
})

</script>

<template>
  <UpgradePlus />
  <template v-if="isBare">
    <RouterView />
  </template>
  <div v-else-if="weddingStatus !== 'ready'" class="wedding-status">
    <template v-if="weddingStatus === 'loading'">
      <i class="fa-solid fa-spinner fa-spin"></i>
    </template>
    <template v-else-if="weddingStatus === 'blocked'">
      <i class="fa-regular fa-envelope"></i>
      <h1>Invitation unavailable</h1>
      <p>This invitation can't be viewed right now. Please check with the couple.</p>
    </template>
    <template v-else-if="weddingStatus === 'hidden'">
      <i class="fa-regular fa-eye-slash"></i>
      <h1>Invitation hidden</h1>
      <p>The couple has hidden this invitation for now. Please check back later.</p>
    </template>
    <template v-else>
      <i class="fa-regular fa-envelope-open"></i>
      <h1>Invitation not found</h1>
      <p>Please check the link you were given.</p>
    </template>
  </div>
  <template v-else>
    <imageSlider :visible="showImagePopup" @update:visible="showImagePopup = $event"/>
    <floatingMenu v-if="!showImagePopup"/>
    <RouterView />
    <RouterLink v-if="showDemoTimer" :to="{ name: 'login' }" class="demo-timer" title="Sign in to keep going">
      <i class="fa-regular fa-clock"></i> Demo · {{ demoTimeLeft }}
    </RouterLink>
    <bytespeaks v-if="!getPlan(ownerPlan).hideBadge" />
  </template>
  <div v-if="previewSample" class="sample-watermark" aria-hidden="true">
    <span v-for="n in 12" :key="n">Sample</span>
  </div>
  <div v-if="previewSample" class="sample-badge">
    <i class="fa-solid fa-wand-magic-sparkles"></i> Sample content · fill in your details
  </div>
</template>
<style>
.wedding-status {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px;
  text-align: center;
  background: var(--cream);
  color: var(--text);
  font-family: var(--font-serif);
}
.wedding-status i { font-size: 2rem; color: var(--gold); }
.wedding-status h1 { font-family: var(--font-display); color: var(--dark); font-size: 1.6rem; margin: 6px 0 0; }
.wedding-status p { margin: 0; color: var(--sage); }

.full-screen {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow-y: auto;
}

.push-back{
  z-index: -1;
}

/* Pages scroll inside .full-screen; lock the document so mobile
   browsers don't scroll it and toggle the address bar */
html, body{
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
}

/* Live preview: marks sample content standing in for empty fields */
.sample-watermark {
  position: fixed;
  inset: -50%;
  z-index: 10002;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  place-items: center;
  transform: rotate(-30deg);
  pointer-events: none;
}
.sample-watermark span {
  font-family: var(--font-display, serif);
  font-size: clamp(2.5rem, 9vw, 5rem);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(120, 90, 40, 0.12);
  user-select: none;
}
.sample-badge {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10003;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(26, 18, 8, 0.78);
  color: #fdf6ec;
  font-family: system-ui, sans-serif;
  font-size: 0.75rem;
  white-space: nowrap;
  pointer-events: none;
}

.demo-timer {
  position: fixed;
  top: 12px;
  right: 16px;
  z-index: 10001;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--gold);
  background: color-mix(in srgb, var(--cream) 92%, transparent);
  color: var(--gold-dark);
  font-family: var(--font-serif);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
}
/* Desktop nav runs along the top, so sit bottom-left there */
@media (min-width: 768px) {
  .demo-timer { top: auto; right: auto; bottom: 24px; left: 24px; }
}

</style>
