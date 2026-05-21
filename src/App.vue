<script setup>
// import HelloWorld from './components/HelloWorld.vue'
import floatingMenu from "@/components/bottomMenu.vue";
import bytespeaks from "./components/bytespeaks.vue";
</script>

<template>
  <floatingMenu />
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
