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
.full-screen-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

.push-back{
  z-index: -1;
}

body{
  overflow: hidden;
}

</style>
