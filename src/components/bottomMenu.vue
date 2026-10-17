<template>
  <!-- Desktop Header -->
  <header class="desktop-nav-container d-none d-md-block">
    <div class="desktop-navbar">
      <!-- Left Section: Branding + New Credit Tagline -->
      <div class="nav-branding-wrapper">
        <div class="nav-branding" @click="handleCenterAction">
          <span class="branding-text">{{ monogram }}</span>
        </div>
        <span class="navbar-credit" v-if="false">with love from bytespeaks.com</span>
      </div>

      <nav class="nav-links">
        <router-link v-for="item in desktopItems" :key="item.to" :to="item.to" class="desktop-nav-item" active-class="" exact-active-class="active">
          <i class="fa-solid nav-mini-icon" :class="item.icon"></i> {{ item.label }}
        </router-link>
      </nav>
    </div>
  </header>

  <!-- Mobile Floating Menu -->
  <nav class="floating-menu-container d-md-none">
    <div class="floating-menu">
      <template v-for="(item, index) in mobileItems" :key="item.to">
        <button v-if="hasStory && index === 2" @click="handleCenterAction" class="menu-item center-action-btn">
          <div class="action-circle">
            <span class="action-button-text">{{ monogram }}</span>
          </div>
        </button>

        <router-link :to="item.to" class="menu-item" active-class="" exact-active-class="active">
          <i class="fa-solid menu-icon" :class="item.icon"></i>
          <span class="menu-label">{{ item.shortLabel }}</span>
        </router-link>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { computed } from "vue";
import { useWeddingStore } from "@/stores/wedding";

const router = useRouter();
const route = useRoute();
// Keep guests inside a shared invitation (/<code>/events, …)
const base = computed(() => (route.params.code ? `/${route.params.code}` : ""));
const wedding = useWeddingStore();
// Falls back to the couple's initials (G&B with the sample names) until a monogram is set
const initial = (person) => (person.shortName || person.name || "").trim().charAt(0).toUpperCase();
const monogram = computed(() => {
  const set = wedding.site.monogram?.trim();
  if (set) return set;
  const g = initial(wedding.groom);
  const b = initial(wedding.bride);
  return g && b ? `${g}&${b}` : g || b;
});

// A milestone counts once it has a date or a note; a row with only a preset name isn't a story yet
const hasStory = computed(() =>
  (wedding.storyPage?.milestones || []).some((m) => [m.day, m.month, m.year, m.note].some((v) => String(v ?? "").trim())),
);

const desktopItems = computed(() => {
  const nav = wedding.navigation;
  return [
    { to: base.value || "/", ...nav.home },
    { to: `${base.value}/events`, ...nav.events },
    { to: `${base.value}/couple`, ...nav.couple },
    { to: `${base.value}/moments`, ...nav.moments },
    hasStory.value && { to: `${base.value}/story`, ...nav.story },
  ].filter(Boolean);
});
// With a story: Couple sits behind the centre monogram button (4 links + monogram).
// Without one: Couple is a plain link like the rest (4 links, no monogram).
const mobileItems = computed(() =>
  hasStory.value ? desktopItems.value.filter((item) => !item.to.endsWith("/couple")) : desktopItems.value,
);

const handleCenterAction = () => router.push(`${base.value}/couple`);
</script>

<style lang="scss" scoped>
/* ── Desktop ── */
.desktop-nav-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  background: color-mix(in srgb, var(--cream) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);
  z-index: 9999;
  box-shadow: 0 4px 20px color-mix(in srgb, var(--shadow) 4%, transparent);
}

.desktop-navbar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-branding {
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gold-dark);
  letter-spacing: 1px;
  transition: opacity 0.2s;
  &:hover { opacity: 0.7; }
}

.nav-links {
  display: flex;
  gap: 28px;
}

.desktop-nav-item {
  text-decoration: none;
  font-family: var(--font-serif);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text);
  opacity: 0.6;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s ease;
  position: relative;
  padding: 4px 0;

  .nav-mini-icon { font-size: 0.75rem; }

  &::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0; height: 1px;
    background-color: var(--gold-dark);
    transition: width 0.25s ease;
  }

  &:hover { opacity: 1; color: var(--dark); &::after { width: 100%; } }

  &.active {
    opacity: 1;
    color: var(--gold-dark);
    &::after { width: 100%; background-color: var(--gold-dark); }
  }
}

/* ── Mobile floating menu ── */
.floating-menu-container {
  position: fixed;
  /* Fixed px offset: vh/dvh shift as the mobile address bar shows/hides */
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  width: 100%;
  max-width: 420px;
  padding: 0 16px;
  box-sizing: border-box;
}

.floating-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: color-mix(in srgb, var(--cream) 93%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  padding: 8px 12px;
  border-radius: 30px;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--shadow) 12%, transparent);
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-decoration: none;
  color: var(--text);
  opacity: 0.55;
  transition: all 0.25s ease;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0;

  .menu-icon {
    font-size: 1.1rem;
    margin-bottom: 3px;
    transition: transform 0.2s ease;
    display: inline-block;
  }

  .menu-label {
    font-family: var(--font-serif);
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* Mouse only: on touch screens :hover sticks to the last tapped item */
  @media (hover: hover) {
    &:hover {
      opacity: 1;
      color: var(--dark);
      .menu-icon { transform: translateY(-2px); }
    }
  }

  &.active {
    opacity: 1;
    color: var(--gold-dark);
    .menu-icon { transform: scale(1.1); }
  }
}

/* Center monogram button */
.center-action-btn {
  opacity: 1;
  position: relative;
  top: -6px;

  .action-circle {
    width: 62px;
    height: 62px;
    background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--gold-dark) 35%, transparent);
    transition: all 0.25s ease;
  }

  @media (hover: hover) {
    &:hover .action-circle {
      transform: scale(1.08) translateY(-3px);
      box-shadow: 0 8px 20px color-mix(in srgb, var(--gold-dark) 50%, transparent);
    }
  }
}

.action-button-text {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--on-accent);
}

.nav-branding-wrapper {
  display: flex;
  align-items: baseline; /* Aligns the bottom of the texts nicely */
  gap: 16px;             /* Space between M&A and the credit text */
}

.navbar-credit {
  font-family: var(--font-serif);
  font-size: 0.8rem;
  font-style: italic;
  color: var(--text);
  opacity: 0.45;         /* Soft, out of the way, but visible */
  letter-spacing: 0.5px;
}
</style>