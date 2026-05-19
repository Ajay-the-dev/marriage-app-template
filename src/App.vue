<script setup>
// import HelloWorld from './components/HelloWorld.vue'
import floatingMenu from "@/components/bottomMenu.vue";

</script>

<template>
  <floatingMenu />
  <RouterView />
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
