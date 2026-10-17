<template>
    <Basic>
        <div class="hero-wrapper" :class="`tpl-${template}`">
            <div class="brown-bg full-screen d-flex flex-column align-items-center hero-content" :style="overlayStyle" ref="heroContent">
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

                <!-- Printed invitation attached in Settings -->
                <div v-if="printCard || cardPdf" class="hero-actions">
                    <a v-if="cardPdf" :href="cardPdf.url" target="_blank" rel="noopener" class="hero-create">
                        <i class="fa-solid fa-scroll me-2"></i>Invitation card
                    </a>
                    <button v-else type="button" class="hero-create" @click="cardOpen = true">
                        <i class="fa-solid fa-scroll me-2"></i>Invitation card
                    </button>
                </div>

                <!-- Signed-out visitors go via login (the settings guard redirects them) -->
                <div v-if="showCreate" class="hero-actions">
                    <RouterLink v-if="showHelp" :to="{ name: 'help' }" class="hero-create">
                        <i class="fa-regular fa-circle-question me-2"></i>How it works
                    </RouterLink>
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
        <!-- Drawn off screen for the first-visit auto download -->
        <div v-if="autoDownloading" class="card-offscreen" aria-hidden="true">
            <PrintCard ref="autoCardEl" readonly :card="printCard" :card-style="cardStyle" :card-px="cardPx" exporting />
        </div>
        <Teleport to="body">
            <div v-if="cardOpen && printCard" class="card-viewer" role="dialog" aria-modal="true" aria-label="Invitation card" @click.self="cardOpen = false">
                <div class="card-viewer-bar">
                    <button type="button" class="hero-create" :disabled="exporting" @click="downloadPdf">
                        <i class="fa-solid me-2" :class="exporting ? 'fa-spinner fa-spin' : 'fa-download'"></i>{{ exporting ? 'Preparing…' : 'Download PDF' }}
                    </button>
                    <button type="button" class="hero-create" title="Close" @click="cardOpen = false">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <PrintCard ref="printCardEl" readonly :card="printCard" :card-style="cardStyle" :card-px="cardPx" :scale="cardScale" :exporting="exporting" />
            </div>
        </Teleport>
    </Basic>    
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from "vue";
import Basic from "@/views/Basic.vue";
import gsap from "gsap";
import { useRoute, useRouter } from "vue-router";
import { useWeddingStore, weddingStatus } from "@/stores/wedding";
import { isPreviewFrame } from "@/utils/preview";
import { PLACEHOLDER_BACKGROUND } from "@/config/blankWedding";
import { useAuthStore } from "@/stores/auth";
import { listWeddings } from "@/services/weddings";
import { unsplashCredit } from "@/utils/unsplash";
import PrintCard from "@/components/PrintCard.vue";
import { downloadUrl } from "@/services/cloudinary";
import { getTheme, fontsUrl } from "@/config/themes";
import { getPaper, sanitizeCardHtml, usedFontSpecs, cardStyleFor, downloadCardPdf, pdfFileName, MM_TO_PX } from "@/utils/traditionalCard";

const wedding = useWeddingStore();
const auth = useAuthStore();
const route = useRoute();
// Not on shared invitations (/<code>) — guests shouldn't see it.
// Waits for Firebase to restore the session so the label doesn't flip.
const showCreate = computed(() => !route.params.code && auth.initialized);

// "How it works" for visitors who haven't made an invitation yet
const hasInvitations = ref(null);
watch(() => auth.user?.uid, async (uid) => {
  hasInvitations.value = null;
  if (!uid || route.params.code) return;
  try {
    hasInvitations.value = (await listWeddings(uid)).length > 0;
  } catch {
    hasInvitations.value = true; // unknown: leave the button out
  }
}, { immediate: true });
const showHelp = computed(() => !auth.isLoggedIn || hasInvitations.value === false);

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
// Overlay strength (0-100) and colour picked in Settings; unset keeps the template/theme defaults.
// Colour is a theme role (follows theme changes) or a custom #hex.
// Text colour works the same way and replaces both the accent and its soft tint.
const COLOR_ROLES = ["overlay", "dark", "text", "shadow", "gold-dark", "gold", "gold-light", "sage", "blush", "cream", "card"];
const heroColor = (c) => (COLOR_ROLES.includes(c) ? `var(--${c})` : /^#[0-9a-f]{6}$/i.test(c || "") ? c : null);
const overlayStyle = computed(() => {
  const style = {};
  const n = hero.value.overlayOpacity;
  if (typeof n === "number") style["--hero-overlay"] = `${Math.min(100, Math.max(0, n))}%`;
  const overlay = heroColor(hero.value.overlayColor);
  if (overlay) style["--hero-overlay-color"] = overlay;
  const text = heroColor(hero.value.textColor);
  if (text) style["--hero-text"] = style["--hero-text-soft"] = text;
  return style;
});

// ── Printed invitation (a copy of a saved card, attached in Settings) ──
const printCard = computed(() => {
    const c = hero.value.printCard;
    return c?.type !== "pdf" && c?.html ? { ...c, html: sanitizeCardHtml(c.html) } : null;
});
// Or a PDF the couple uploaded (only https links)
const cardPdf = computed(() => {
    const c = hero.value.printCard;
    return c?.type === "pdf" && /^https:\/\//.test(c.url || "") ? c : null;
});
const cardOpen = ref(false);
const cardTheme = computed(() => getTheme(printCard.value?.theme || wedding.theme));
const cardPaper = computed(() => getPaper(printCard.value?.paper));
const cardStyle = computed(() => cardStyleFor(cardTheme.value, cardPaper.value));
const cardPx = computed(() => ({ width: cardPaper.value.width * MM_TO_PX, height: cardPaper.value.height * MM_TO_PX }));
// Fits the card inside the window, leaving room for the buttons
const viewport = ref({ width: window.innerWidth, height: window.innerHeight });
const onResize = () => (viewport.value = { width: window.innerWidth, height: window.innerHeight });
const cardScale = computed(() => Math.min(1, (viewport.value.width - 32) / cardPx.value.width, (viewport.value.height - 120) / cardPx.value.height));

// The card's fonts load the first time it's opened
const loadCardFonts = () => {
    const specs = [...cardTheme.value.googleFonts, ...usedFontSpecs(printCard.value.html)];
    let link = document.getElementById("print-card-fonts");
    if (!link) {
        link = document.createElement("link");
        link.id = "print-card-fonts";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }
    link.href = fontsUrl([...new Map(specs.map((f) => [f.split(":")[0], f])).values()]);
};
watch(cardOpen, (open) => open && printCard.value && loadCardFonts());

const printCardEl = ref(null);
const exporting = ref(false);
const savePdf = (cardEl) =>
    downloadCardPdf(cardEl, {
        paper: cardPaper.value,
        background: cardTheme.value.colors.cream,
        title: `${wedding.groom.shortName} & ${wedding.bride.shortName} invitation`,
        fileName: pdfFileName(wedding.$state),
    });
const downloadPdf = async () => {
    exporting.value = true;
    try {
        await savePdf(printCardEl.value.cardEl);
    } catch (error) {
        console.error("Could not create PDF:", error);
        alert(`Could not create the PDF: ${error.message}`);
    } finally {
        exporting.value = false;
    }
};

// Site setting: guests get the PDF once, the first time they open a shared invitation's
// home page in this browser (not in the editor's preview)
const autoCardEl = ref(null);
const autoDownloading = ref(false);
const autoDownloadKey = computed(() => `autoDownloaded:${route.params.code}`);
const autoDownloaded = () => {
    try { return !!localStorage.getItem(autoDownloadKey.value); } catch { return false; }
};
const remember = () => {
    try { localStorage.setItem(autoDownloadKey.value, "1"); } catch { /* may download again next time */ }
};
const autoDownload = async () => {
    if (autoDownloading.value || !route.params.code || isPreviewFrame || !wedding.site.autoDownload || autoDownloaded()) return;
    if (cardPdf.value) {
        const a = document.createElement("a");
        a.href = downloadUrl(cardPdf.value.url);
        a.download = cardPdf.value.name || "invitation.pdf";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        remember();
        return;
    }
    if (!printCard.value) return;
    autoDownloading.value = true;
    try {
        loadCardFonts();
        await nextTick();
        await savePdf(autoCardEl.value.cardEl);
        remember();
    } catch (error) {
        console.warn("Could not auto download the invitation:", error);
    } finally {
        autoDownloading.value = false;
    }
};
// The invitation loads after the page mounts
watch(() => weddingStatus.value === "ready" && wedding.site.autoDownload && !!(printCard.value || cardPdf.value), (ready) => ready && autoDownload(), { immediate: true });

const onKeydown = (e) => {
    if (e.key === "Escape") cardOpen.value = false;
};

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

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeydown);

    timer = setInterval(() => {
        now.value = new Date();
    }, 1000);
});

onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("keydown", onKeydown);
});
</script>
<style scoped>
.brown-bg {
    position: relative;
    overflow: hidden;
    background-color: color-mix(in srgb, var(--hero-overlay-color, var(--overlay)) var(--hero-overlay, 80%), transparent);
    z-index: 1;
}

.hero-inner {
    opacity: 0.8;
}

.brown-bg span {
    color: var(--hero-text-soft, var(--gold-light));
    opacity: 1;
    font-family: var(--font-serif);
}

.brown-bg h1 {
    color: var(--hero-text, var(--gold));
    opacity: 1;
    font-family: var(--font-display);
    font-size: 22pt;
}

.hero-divider {
    width: 120px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--hero-text, var(--gold)), transparent);
    margin: 0.5rem auto;
    opacity: 1;
}

.hero-date {
    font-family: 'Sans-serif', serif;
    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    color: var(--hero-text-soft, var(--gold-light));
    letter-spacing: 0.2em;
    margin-top: 0.5rem;
    opacity: 1;
}

.hero-time {
    font-family: 'Sans-serif', serif;
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    color: var(--hero-text-soft, var(--gold-light));
    letter-spacing: 0.2em;
    margin-top: 0.5rem;
    opacity: 1;
}

.hero-location {
    font-family: 'Sans-serif', serif;
    font-size: clamp(0.875rem, 2.5vw, 1.5rem);
    color: var(--hero-text-soft, var(--gold-light));
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
    border-top: 1px solid color-mix(in srgb, var(--hero-text, var(--gold)) 30%, transparent); /* subtle gold divider */
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
    color: var(--hero-text, var(--gold));
    line-height: 1;
    font-weight: 600;
}

.countdown-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: var(--hero-text-soft, var(--gold-light));
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
    border: 1px solid color-mix(in srgb, var(--hero-text, var(--gold)) 55%, transparent);
    border-radius: 10px;
    background-color: color-mix(in srgb, var(--hero-text, var(--gold)) 10%, transparent);
}

.cd-circles .countdown-item {
    width: 4.25rem;
    height: 4.25rem;
    justify-content: center;
    border: 2px solid var(--hero-text, var(--gold));
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
    color: var(--hero-text, var(--gold));
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
    border: 1px solid var(--hero-text, var(--gold));
    border-radius: 999px;
    color: var(--hero-text-soft, var(--gold-light));
    font-family: var(--font-serif);
    letter-spacing: 0.1em;
    text-decoration: none;
    transition: background-color 0.2s, color 0.2s;
}

.hero-create:hover {
    background-color: var(--hero-text, var(--gold));
    color: var(--dark);
}

/* ── Printed invitation viewer ── */
.card-viewer {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.75);
}

.card-offscreen {
    position: fixed;
    left: -10000px;
    top: 0;
    pointer-events: none;
}

.card-viewer-bar {
    display: flex;
    gap: 0.75rem;

    .hero-create {
        background-color: rgba(0, 0, 0, 0.35);
    }
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
    background-color: color-mix(in srgb, var(--hero-overlay-color, var(--overlay)) var(--hero-overlay, 36%), transparent);
}

.tpl-framed .hero-inner {
    padding: 2.5rem 2rem;
    max-width: 34rem;
    width: 100%;
    border: 3px double var(--hero-text, var(--gold));
    outline: 1px solid color-mix(in srgb, var(--hero-text, var(--gold)) 50%, transparent);
    outline-offset: 8px;
    border-radius: 4px;
    background-color: var(--hero-overlay-color, var(--overlay));
}

/* ── Minimal: names on one line, details along the bottom ── */
.tpl-minimal .hero-content {
    justify-content: center;
    padding: 2rem 1rem 0;
    background-color: color-mix(in srgb, var(--hero-overlay-color, var(--overlay)) var(--hero-overlay, 48%), transparent);
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
    border-top: 1px solid color-mix(in srgb, var(--hero-text, var(--gold)) 30%, transparent);
}

.tpl-minimal .hero-details > div {
    margin-top: 0;
    font-size: clamp(0.75rem, 1.6vw, 1rem);
}
</style>