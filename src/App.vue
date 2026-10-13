<script setup>
// import HelloWorld from './components/HelloWorld.vue'
import { ref, computed, watch, watchEffect }  from 'vue'
import { useRoute } from 'vue-router'
import floatingMenu from "@/components/bottomMenu.vue";
import bytespeaks from "./components/bytespeaks.vue";
import imageSlider from "./components/imageSlider.vue";
import { useWeddingStore, weddingStatus } from "@/stores/wedding";
import { useAuthStore } from "@/stores/auth";
import { applyTheme } from "@/config/themes";

const wedding = useWeddingStore()
const auth = useAuthStore()
const route = useRoute()
// Settings and login render on their own, without the invitation chrome
const isBare = computed(() => !!route.meta.bare)

const shareCode = computed(() => route.params.code || null)

// Guests open /<code>; everyone else sees the signed-in user's wedding
// (or the template when signed out).
watch([shareCode, () => auth.user?.uid], ([code, uid]) => {
  const load = code ? wedding.loadByCode(code) : wedding.loadForUser(uid)
  load.catch((error) => console.error('Could not load wedding:', error))
}, { immediate: true })

// Save-the-date popup, decided once the wedding has loaded
const showImagePopup = ref(false)
watch(weddingStatus, (status) => {
  if (status !== 'ready') return
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
  <template v-if="isBare">
    <RouterView />
  </template>
  <div v-else-if="weddingStatus !== 'ready'" class="wedding-status">
    <template v-if="weddingStatus === 'loading'">
      <i class="fa-solid fa-spinner fa-spin"></i>
    </template>
    <template v-else-if="weddingStatus === 'not-found'">
      <i class="fa-regular fa-envelope-open"></i>
      <h1>Invitation not found</h1>
      <p>Please check the link you were given.</p>
    </template>
    <template v-else>
      <i class="fa-solid fa-triangle-exclamation"></i>
      <h1>Couldn't load this invitation</h1>
      <p>Check your connection and refresh the page.</p>
    </template>
  </div>
  <template v-else>
    <imageSlider :visible="showImagePopup" @update:visible="showImagePopup = $event"/>
    <floatingMenu v-if="!showImagePopup"/>
    <RouterView />
    <bytespeaks />
  </template>
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

body{
  overflow: hidden;
}

</style>
