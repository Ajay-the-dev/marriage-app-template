<template>
    <Basic>
        <div class="hero-wrapper"> 
            <div class="brown-bg full-screen d-flex flex-column align-items-center" ref="heroContent" style="padding-top: 18vh;">
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

                <!-- Countdown -->
                <div class="hero-countdown" v-if="!marriageHappened">
                    <div class="countdown-item" v-for="unit in countdownUnits" :key="unit.label">
                        <span class="countdown-number">{{ unit.value }}</span>
                        <span class="countdown-label">{{ unit.label }}</span>
                    </div>
                </div>
            </div>
            <img src="/images/main.jpeg" alt="Mithun" class="full-screen-img push-back" ref="bgImage"/>
        </div>
    </Basic>    
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import Basic from "@/views/Basic.vue";
import gsap from "gsap";

const bgImage = ref(null);
const heroContent = ref(null);

// Set your wedding date/time here
const weddingDate = new Date("2026-07-12T10:30:00");

const now = ref(new Date());
let timer = null;

const marriageHappened = ref(false);

const countdownUnits = computed(() => {
    const diff = Math.max(0, weddingDate - now.value);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);


    if(diff === 0){
        marriageHappened.value = true;
    }

    return [
        { label: "Days", value: String(days).padStart(2, "0") },
        { label: "Hrs", value: String(hours).padStart(2, "0") },
        { label: "Min", value: String(minutes).padStart(2, "0") },
        { label: "Sec", value: String(seconds).padStart(2, "0") },
    ];
});

onMounted(() => {
    gsap.fromTo(
        bgImage.value,
        { scale: 1 },
        { scale: 1.25, duration: 20, ease: "sine.inOut" }
    );

    timer = setInterval(() => {
        now.value = new Date();
    }, 1000);
});

onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
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
    font-size: 22pt;
}

.hero-divider {
    width: 120px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    margin: 0.5rem auto;
    opacity: 1;
}

.hero-date {
    font-family: 'Sans-serif', serif;
    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    color: var(--gold-light);
    letter-spacing: 0.2em;
    margin-top: 0.5rem;
    opacity: 1;
}

.hero-time {
    font-family: 'Sans-serif', serif;
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    color: var(--gold-light);
    letter-spacing: 0.2em;
    margin-top: 0.5rem;
    opacity: 1;
}

.hero-location {
    font-family: 'Sans-serif', serif;
    font-size: clamp(0.875rem, 2.5vw, 1.5rem);
    color: var(--gold-light);
    letter-spacing: 0.2em;
    margin-top: 0.5rem;
    opacity: 1;
}

/* Countdown */
.hero-countdown {
    display: flex;
    gap: 1.25rem;
    margin-top: 1.25rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(212, 175, 55, 0.3); /* subtle gold divider */
}

.countdown-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 2.5rem;
}

.countdown-number {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(1.1rem, 3vw, 1.6rem);
    color: var(--gold);
    line-height: 1;
    font-weight: 600;
}

.countdown-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: var(--gold-light);
    text-transform: uppercase;
    margin-top: 0.2rem;
    opacity: 0.85;
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
    overflow: hidden;
}
</style>