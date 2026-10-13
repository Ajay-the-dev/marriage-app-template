<template>
    <Basic>
        <div class="hero-wrapper"> 
            <div class="brown-bg full-screen d-flex flex-column align-items-center" ref="heroContent" style="padding-top: 18vh;">
                <span class="fs-5 fst-italic mb-2">{{ hero.inviteLine }}</span>
                <h1 class="fw-bold">{{ wedding.groom.shortName }}</h1>
                <h1>&</h1>
                <h1 class="fw-bold">{{ wedding.bride.shortName }}</h1>
                <div class="hero-divider"></div>
                <div class="hero-date" v-if="hero.dateText">
                    <i class="fa-calendar fa-solid mx-2"></i>{{ hero.dateText }}
                </div>
                 <div class="hero-time" v-if="hero.timeText">
                    <i class="fa-clock fa-solid mx-2"></i>{{ hero.timeText }}
                </div>
                <div class="hero-location" v-if="hero.locationText">
                    {{ hero.locationText }}
                </div>

                <!-- Countdown -->
                <div class="hero-countdown" v-if="hero.countdown.enabled && !marriageHappened">
                    <div class="countdown-item" v-for="unit in countdownUnits" :key="unit.label">
                        <span class="countdown-number">{{ unit.value }}</span>
                        <span class="countdown-label">{{ unit.label }}</span>
                    </div>
                </div>
            </div>
            <img :src="hero.backgroundImage" :alt="`${wedding.groom.shortName} & ${wedding.bride.shortName}`" class="full-screen-img push-back" ref="bgImage"/>
        </div>
    </Basic>    
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import Basic from "@/views/Basic.vue";
import gsap from "gsap";
import { useWeddingStore } from "@/stores/wedding";

const wedding = useWeddingStore();
const hero = computed(() => wedding.hero);

const bgImage = ref(null);
const heroContent = ref(null);

const weddingDate = computed(() => new Date(hero.value.countdown.target));

const now = ref(new Date());
let timer = null;

const marriageHappened = ref(false);

const countdownUnits = computed(() => {
    const diff = Math.max(0, weddingDate.value - now.value);
    const labels = hero.value.countdown.labels;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);


    marriageHappened.value = diff === 0;

    return [
        { label: labels.days, value: String(days).padStart(2, "0") },
        { label: labels.hours, value: String(hours).padStart(2, "0") },
        { label: labels.minutes, value: String(minutes).padStart(2, "0") },
        { label: labels.seconds, value: String(seconds).padStart(2, "0") },
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
    background-color: var(--overlay);
    opacity: 0.8;
    z-index: 1;
}

.brown-bg span {
    color: var(--gold-light);
    opacity: 1;
    font-family: var(--font-serif);
}

.brown-bg h1 {
    color: var(--gold);
    opacity: 1;
    font-family: var(--font-display);
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
    border-top: 1px solid color-mix(in srgb, var(--gold) 30%, transparent); /* subtle gold divider */
}

.countdown-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 2.5rem;
}

.countdown-number {
    font-family: var(--font-serif);
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
  height: 100dvh;
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
    height: 100dvh;
    overflow: hidden;
}
</style>