<template>
    <Basic>
        <div class="hero-wrapper"> 
            <div class="brown-bg full-screen d-flex flex-column justify-content-center align-items-center" ref="heroContent">
                <span class="fs-5 fst-italic mb-2">You are invited to the wedding ceremony of</span>
                <h1 class="fw-bold">Mithun</h1>
                <h1>&</h1>
                <h1 class="fw-bold">Aiswarya</h1>
                <div class="hero-divider"></div>
                <div class="hero-date">
                    <i class="fa-calendar fa-solid mx-2"></i>12 · 07 · 2026
                </div>
                 <div class="hero-time">
                    <i class="fa-clock fa-solid mx-2"></i>10 : 30 AM - 11 : 30 AM
                </div>
                <div class="hero-location">
                    GREEN NEST KUMBALANGI, KOCHI
                </div>
            </div>
            <img src="/images/main.jpeg" alt="Mithun" class="full-screen-img push-back" ref="bgImage"/>
        </div>
    </Basic>    
</template>
<script setup>
import { ref,onMounted } from "vue";
import Basic from "@/views/Basic.vue";
import gsap from "gsap";
const bgImage = ref(null);
const heroContent = ref(null);

onMounted(() => {
 
    // Slow cinematic zoom for background image
    gsap.fromTo(
        bgImage.value,
        {
            scale: 1,
        },
        {
            scale: 1.25,
            duration: 20,
            ease: "sine.inOut",
            // repeat: 1,
        }
    );

    // Floating animation for all text
            // gsap.to(heroContent.value.children, {
            //     y: -30,
            //     duration: 3,
            //     ease: "sine.inOut",
            //     // repeat: -1,
            //     yoyo: true,
            // });
});
</script>
<style scoped>
.brown-bg {
    position: relative;
    overflow: hidden;
    background-color: var(--dark);
    opacity: 0.8;
    z-index: 1;
}


.brown-bg span {
    color: var(--gold-light);
    opacity: 1;
    font-family: 'Cormorant Garamond', serif;
}

.brown-bg h1 {
    color: var(--gold);
    opacity: 1;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 38pt;
}

.hero-divider {
width: 120px; height: 1px;
background: linear-gradient(90deg, transparent, var(--gold), transparent);
margin: 1.5rem auto;
opacity: 1;
}

.hero-date {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    color: var(--gold-light);
    letter-spacing: 0.2em;
    margin-top: 1.5rem;
    opacity: 1;
}

.hero-time {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(0.875rem, 2.5vw, 1.5rem);
    color: var(--gold-light);
    letter-spacing: 0.2em;
    margin-top: 1.5rem;
    opacity: 1;
}

.hero-location {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(0.875rem, 2.5vw, 1.5rem);
    color: var(--gold-light);
    letter-spacing: 0.2em;
    margin-top: 1.5rem;
    opacity: 1;
}

.full-screen-img {
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

.hero-wrapper {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden; /* ← This clips the zooming image */
}
</style>