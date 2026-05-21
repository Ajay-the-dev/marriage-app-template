<template>
    <Basic>
        <section class="gallery-section">
            <div class="container py-5">
            
            <!-- Section Header -->
            <div class="text-center mb-5 header-block">
                <span class="sub-title">Captured Moments</span>
                <h2 class="main-title">Our Gallery</h2>
                <div class="luxury-divider">
                <span class="line"></span>
                <i class="fa-solid fa-camera divider-icon"></i>
                <span class="line"></span>
                </div>
            </div>

            <!-- Staggered 2-Column Photo Grid -->
            <div class="gallery-grid">
                <div 
                v-for="(image, index) in galleryImages" 
                :key="index" 
                class="gallery-item"
                @click="openLightbox(index)"
                >
                <div class="image-inner-wrapper">
                    <img :src="image.src" :alt="image.alt" class="gallery-img" />
                    <div class="hover-overlay">
                    <i class="fa-solid fa-magnifying-glass-plus zoom-icon"></i>
                    </div>
                </div>
                </div>
            </div>

            <!-- Full-Screen Cinematic Lightbox Overlay -->
            <div 
                v-if="isLightboxOpen" 
                ref="lightboxRef" 
                class="lightbox-overlay"
                @click.self="closeLightbox"
            >
                <button class="close-btn" @click="closeLightbox">
                <i class="fa-solid fa-xmark"></i>
                </button>
                
                <button class="nav-btn prev-btn" @click="prevImage">
                <i class="fa-solid fa-chevron-left"></i>
                </button>
                
                <div class="lightbox-content">
                <img 
                    ref="activeImgRef" 
                    :src="galleryImages[currentIdx].src" 
                    :alt="galleryImages[currentIdx].alt" 
                    class="lightbox-img" 
                />
                </div>

                <button class="nav-btn next-btn" @click="nextImage">
                <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>

            </div>
        </section>
    </Basic>
</template>

<script setup>
import Basic from "@/views/Basic.vue";
import { ref, onMounted, nextTick, computed } from 'vue'
import { gsap } from 'gsap'

const galleryImages = computed(() => {
  var result = []
  for (let index = 1; index <= 14; index++) {
    result.push({ src: `/images/${index}.jpeg`, alt: `Gallery image ${index}` })
  }
  return result
})

const isLightboxOpen = ref(false)
const currentIdx = ref(0)
const lightboxRef = ref(null)
const activeImgRef = ref(null)

onMounted(() => {
  gsap.from('.gallery-item', {
    opacity: 0,
    y: 40,
    scale: 0.9,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power2.out'
  })
})

const openLightbox = async (index) => {
  currentIdx.value = index
  isLightboxOpen.value = true
  await nextTick()
  const tl = gsap.timeline()
  tl.to(lightboxRef.value, { opacity: 1, duration: 0.3 })
    .from(activeImgRef.value, { scale: 0.8, opacity: 0, duration: 0.4, ease: 'back.out(1.2)' }, '-=0.1')
}

const closeLightbox = () => {
  if (!lightboxRef.value) return
  gsap.to(lightboxRef.value, {
    opacity: 0,
    duration: 0.3,
    onComplete: () => { isLightboxOpen.value = false }
  })
}

const nextImage = () => {
  gsap.to(activeImgRef.value, {
    opacity: 0, x: -30, duration: 0.2, onComplete: () => {
      currentIdx.value = (currentIdx.value + 1) % galleryImages.value.length
      gsap.fromTo(activeImgRef.value, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 })
    }
  })
}

const prevImage = () => {
  gsap.to(activeImgRef.value, {
    opacity: 0, x: 30, duration: 0.2, onComplete: () => {
      currentIdx.value = (currentIdx.value - 1 + galleryImages.value.length) % galleryImages.value.length
      gsap.fromTo(activeImgRef.value, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 })
    }
  })
}
</script>

<style lang="scss" scoped>
.gallery-section {
  background-color: var(--cream);
  min-height: 100vh;
  color: var(--text);
  font-family: 'Playfair Display', serif;
}

/* Header Text Styles */
.sub-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--sage);
  font-weight: 600;
}
.main-title {
  color: var(--dark);
  font-size: 2.8rem;
  margin-top: 8px;
  font-family: 'Cormorant Garamond', serif;
}
.luxury-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
  .line { height: 1px; width: 60px; background-color: var(--gold-light); }
  .divider-icon { margin: 0 15px; color: var(--gold); font-size: 0.8rem; }
}

/* Staggered 2-Column Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 40px;
  align-items: start; /* Columns flow independently — essential for stagger */
}

/* Push every even item (right column) down to create staggered depth */
.gallery-item:nth-child(even) {
  margin-top: 60px;
}

.gallery-item {
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 4 / 5;
  cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--gold-light) 30%, transparent);
  box-shadow: 0 8px 20px rgba(61, 44, 20, 0.04);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 16px 40px rgba(61, 44, 20, 0.12);
  }
}

.image-inner-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .gallery-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  }
}

/* Hover Overlay */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(26, 18, 8, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s ease;

  .zoom-icon {
    color: var(--cream);
    font-size: 1.8rem;
    transform: scale(0.7);
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

.gallery-item:hover {
  .gallery-img { transform: scale(1.08); }
  .hover-overlay { opacity: 1; .zoom-icon { transform: scale(1); } }
}

/* Lightbox */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(26, 18, 8, 0.95);
  z-index: 10000;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-content {
  max-width: 85%;
  max-height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  background: none;
  border: none;
  color: var(--gold-light);
  font-size: 2.2rem;
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: var(--cream); }
}

.nav-btn {
  position: absolute;
  background: rgba(253, 246, 236, 0.05);
  border: 1px solid rgba(232, 213, 163, 0.2);
  color: var(--gold-light);
  width: 55px;
  height: 55px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  
  &:hover {
    background: var(--gold-dark);
    color: var(--dark);
    border-color: transparent;
  }
}

.prev-btn { left: 40px; }
.next-btn { right: 40px; }

/* Mobile */
@media (max-width: 768px) {
  .main-title { font-size: 2.2rem; }

  .gallery-grid {
    gap: 12px;
  }

  /* Remove offset on mobile — images too narrow to stagger */
  .gallery-item:nth-child(even) {
    margin-top: 0;
  }

  .nav-btn {
    width: 45px;
    height: 45px;
    background: rgba(26, 18, 8, 0.6);
    backdrop-filter: blur(4px);
  }
  .prev-btn { left: 15px; }
  .next-btn { right: 15px; }
  .close-btn { top: 20px; right: 20px; font-size: 1.8rem; }
}
</style>