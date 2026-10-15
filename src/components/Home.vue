<template>
    <Basic>
        <div class="hero-wrapper" :class="`tpl-${template}`">
            <div class="brown-bg full-screen d-flex flex-column align-items-center hero-content" ref="heroContent">
              <div class="hero-inner">
                <span class="fs-5 fst-italic mb-2 hero-invite">{{ hero.inviteLine }}</span>
                <div class="hero-names">
                    <h1 class="fw-bold">{{ wedding.groom.shortName }}</h1>
                    <h1>&</h1>
                    <h1 class="fw-bold">{{ wedding.bride.shortName }}</h1>
                </div>
                <div class="hero-divider"></div>
                <div class="hero-details">
                    <div class="hero-date" v-if="hero.dateText">
                        <i class="fa-calendar fa-solid mx-2"></i>{{ hero.dateText }}
                    </div>
                    <div class="hero-time" v-if="hero.timeText">
                        <i class="fa-clock fa-solid mx-2"></i>{{ hero.timeText }}
                    </div>
                    <div class="hero-location" v-if="hero.locationText">
                        {{ hero.locationText }}
                    </div>
                </div>

                <!-- Countdown -->
                <div class="hero-countdown" :class="`cd-${countdownStyle}`" v-if="hero.countdown.enabled && hero.countdown.target && !marriageHappened">
                    <div class="countdown-item" v-for="unit in countdownUnits" :key="unit.label">
                        <span class="countdown-number">{{ unit.value }}</span>
                        <span class="countdown-label">{{ unit.label }}</span>
                    </div>
                </div>

                <!-- Signed-out visitors go via login (the settings guard redirects them) -->
                <div v-if="showCreate" class="hero-actions">
                    <RouterLink :to="{ name: 'settings' }" class="hero-create">
                        <i class="fa-solid fa-pen-to-square me-2"></i>{{ auth.isLoggedIn ? 'My invitations' : 'Login to create' }}
                    </RouterLink>
                    <button v-if="auth.isLoggedIn" type="button" class="hero-create" @click="logout">
                        <i class="fa-solid fa-right-from-bracket me-2"></i>Logout
                    </button>
                </div>
              </div>
            </div>
            <img :src="hero.backgroundImage || PLACEHOLDER_BACKGROUND" :alt="`${wedding.groom.shortName} & ${wedding.bride.shortName}`" class="full-screen-img push-back" ref="bgImage"/>
            <!-- Unsplash license: credit the photographer -->
            <div v-if="photoCredit" class="photo-credit">
                Photo by <a :href="photoCredit.photoUrl" target="_blank" rel="noopener">{{ photoCredit.photographer }}</a>
                on <a :href="photoCredit.unsplashUrl" target="_blank" rel="noopener">Unsplash</a>
            </div>
        </div>
    </Basic>    
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import Basic from "@/views/Basic.vue";
import gsap from "gsap";
import { useRoute, useRouter } from "vue-router";
import { useWeddingStore } from "@/stores/wedding";
import { PLACEHOLDER_BACKGROUND } from "@/config/blankWedding";
import { useAuthStore } from "@/stores/auth";
import { unsplashCredit } from "@/utils/unsplash";

const wedding = useWeddingStore();
const auth = useAuthStore();
const route = useRoute();
// Not on shared invitations (/<code>) — guests shouldn't see it.
// Waits for Firebase to restore the session so the label doesn't flip.
const showCreate = computed(() => !route.params.code && auth.initialized);

const router = useRouter();
const logout = async () => {
  await auth.logout();
  router.replace({ name: "login" });
};
const hero = computed(() => wedding.hero);
const photoCredit = computed(() => unsplashCredit(hero.value.backgroundImage));
// Layout picked in Settings; older invitations have none saved
const TEMPLATES = ["classic", "framed", "minimal"];
const template = computed(() => (TEMPLATES.includes(hero.value.template) ? hero.value.template : "classic"));

const bgImage = ref(null);
const heroContent = ref(null);

const COUNTDOWN_STYLES = ["classic", "boxes", "circles", "inline"];
const countdownStyle = computed(() => (COUNTDOWN_STYLES.includes(hero.value.countdown.style) ? hero.value.countdown.style : "classic"));

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

/* ── Countdown styles ── */
.cd-boxes,
.cd-circles {
    border-top: none;
    gap: 0.75rem;
}

.cd-boxes .countdown-item {
    min-width: 3.75rem;
    padding: 0.6rem 0.5rem 0.5rem;
    border: 1px solid color-mix(in srgb, var(--gold) 55%, transparent);
    border-radius: 10px;
    background-color: color-mix(in srgb, var(--gold) 10%, transparent);
}

.cd-circles .countdown-item {
    width: 4.25rem;
    height: 4.25rem;
    justify-content: center;
    border: 2px solid var(--gold);
    border-radius: 50%;
}

.cd-circles .countdown-label {
    font-size: 0.5rem;
}

.cd-inline {
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 0;
    border-top: none;
}

.cd-inline .countdown-item {
    flex-direction: row;
    align-items: baseline;
    min-width: 0;
    gap: 0.3rem;
}

.cd-inline .countdown-item + .countdown-item::before {
    content: "·";
    margin: 0 0.6rem;
    color: var(--gold);
}

.cd-inline .countdown-number {
    font-size: clamp(1rem, 2.5vw, 1.25rem);
}

.cd-inline .countdown-label {
    margin-top: 0;
    font-size: 0.7rem;
}

.hero-actions {
    margin-top: 1.75rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
}

.hero-create {
    background: none;
    cursor: pointer;
    padding: 0.6rem 1.4rem;
    border: 1px solid var(--gold);
    border-radius: 999px;
    color: var(--gold-light);
    font-family: var(--font-serif);
    letter-spacing: 0.1em;
    text-decoration: none;
    transition: background-color 0.2s, color 0.2s;
}

.hero-create:hover {
    background-color: var(--gold);
    color: var(--dark);
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

/* Bottom-left: the signature badge and mobile menu take the other corners */
.photo-credit {
    position: absolute;
    left: 12px;
    bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    z-index: 2;
    font-size: 0.65rem;
    letter-spacing: 0.3px;
    color: rgba(255, 255, 255, 0.75);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);

    a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
        &:hover { color: #fff; }
    }
}

.hero-content {
    padding-top: 18vh;
}

.hero-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.hero-names,
.hero-details {
    display: flex;
    flex-direction: column;
    align-items: center;
}

/* ── Framed: details inside an ornate card ── */
.tpl-framed .hero-content {
    justify-content: center;
    padding: 1.5rem;
    background-color: color-mix(in srgb, var(--overlay) 45%, transparent);
}

.tpl-framed .hero-inner {
    padding: 2.5rem 2rem;
    max-width: 34rem;
    width: 100%;
    border: 3px double var(--gold);
    outline: 1px solid color-mix(in srgb, var(--gold) 50%, transparent);
    outline-offset: 8px;
    border-radius: 4px;
    background-color: var(--overlay);
}

/* ── Minimal: names on one line, details along the bottom ── */
.tpl-minimal .hero-content {
    justify-content: center;
    padding: 2rem 1rem 0;
    background-color: color-mix(in srgb, var(--overlay) 60%, transparent);
}

.tpl-minimal .hero-names {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0 0.75rem;
}

.tpl-minimal .hero-names h1 {
    font-size: clamp(1.75rem, 6vw, 3rem);
    font-weight: 400 !important;
}

.tpl-minimal .hero-divider {
    display: none;
}

.tpl-minimal .hero-details {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 2rem;
    padding: 1rem;
    border-top: 1px solid color-mix(in srgb, var(--gold) 30%, transparent);
}

.tpl-minimal .hero-details > div {
    margin-top: 0;
    font-size: clamp(0.75rem, 1.6vw, 1rem);
}
</style>