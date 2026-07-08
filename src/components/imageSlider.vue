<template>
  <div v-if="visible" class="image-popup" @click.self="close">
    <div class="image-popup__content">
      <button v-if="showButtons" type="button" class="image-popup__close" @click.self="close" aria-label="Close">&times;</button>
      <button v-if="showButtons" type="button" class="image-popup__nav image-popup__nav--prev" @click.stop="prev" aria-label="Previous image">‹</button>
      <button v-if="showButtons" type="button" class="image-popup__nav image-popup__nav--next" @click.stop="next" aria-label="Next image">›</button>
        <Transition name="fade" mode="out-in">
            <img
                :key="currentSrc"
                :src="currentSrc"
                :alt="currentAlt"
                class="image-popup__image"
            />
        </Transition>
      <!-- <img :src="currentSrc" :alt="currentAlt" class="image-popup__image" /> -->
      <!-- <p class="image-popup__caption">{{ currentCaption }}</p> -->
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const showButtons = ref(true)
const emit = defineEmits(['update:visible', 'close'])

const images = Array.from({ length: 12 }, (_, index) => `/save_the_date/${index + 1}.jpeg`)
const currentIndex = ref(0)

const currentSrc = computed(() => images[currentIndex.value])
const currentAlt = computed(() => `Save the date image ${currentIndex.value + 1}`)
// const currentCaption = computed(() => `Image ${currentIndex.value + 1} of ${images.length}`)

function close() {
  emit('update:visible', false)
  emit('close')
}

function prev() {
  currentIndex.value = (currentIndex.value + images.length - 1) % images.length
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % images.length
}

const startAutoClicking = () => {
  setInterval(() => {
    showButtons.value = false
    next()
    setTimeout(() => {
        showButtons.value = true
    }, 500);
  }, 8000)
}

onMounted(()=>{
    setTimeout(() => {
        startAutoClicking()
    }, 8000);
})
</script>

<style scoped>
.image-popup {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  z-index: 1000;
  padding: 1rem;
}
.image-popup__content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  width: 100%;
  background: #111;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}
.image-popup__image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
}
.image-popup__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #111;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
  opacity: 0.4;
}

.image-popup__close:hover {
  opacity: 1;
}


.image-popup__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: #111;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-popup__nav--prev {
  left: 0.75rem;
  opacity: 0.4;
}
.image-popup__nav--next {
  right: 0.75rem;
  opacity: 0.4;
}

.image-popup__nav--next:hover,
.image-popup__nav--prev:hover {
  opacity: 1;
}

.image-popup__caption {
  padding: 0.75rem 1rem 1rem;
  color: #fff;
  font-size: 0.95rem;
  background: rgba(0, 0, 0, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: scale(1.03);
}

.fade-enter-to {
  opacity: 1;
  transform: scale(1);
}

.fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
