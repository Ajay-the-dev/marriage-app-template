<script setup>
// import HelloWorld from './components/HelloWorld.vue'
import { ref }  from 'vue'
import floatingMenu from "@/components/bottomMenu.vue";
import bytespeaks from "./components/bytespeaks.vue";
import imageSlider from "./components/imageSlider.vue";

const showImagePopup = ref(true)

</script>

<template>
  <imageSlider :visible="showImagePopup" @update:visible="showImagePopup = $event"/>
  <floatingMenu v-if="!showImagePopup"/>
  <RouterView />
  <bytespeaks />
</template>
<style>
.full-screen {
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
}

.push-back{
  z-index: -1;
}

body{
  overflow: hidden;
}

</style>
