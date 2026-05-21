<template>
  <!-- Desktop Header -->
  <header class="desktop-nav-container d-none d-md-block">
    <div class="desktop-navbar">
      <!-- Left Section: Branding + New Credit Tagline -->
      <div class="nav-branding-wrapper">
        <div class="nav-branding" @click="handleCenterAction">
          <span class="branding-text">M&A</span>
        </div>
        <span class="navbar-credit" v-if="false">with love from bytespeaks.com</span>
      </div>

      <nav class="nav-links">
        <router-link to="/" class="desktop-nav-item" active-class="active">
          <i class="fa-solid fa-house nav-mini-icon"></i> Home
        </router-link>
        <router-link to="/events" class="desktop-nav-item" active-class="active">
          <i class="fa-solid fa-calendar-check nav-mini-icon"></i> Events
        </router-link>
        <router-link to="/couple" class="desktop-nav-item" active-class="active">
          <i class="fa-solid fa-user-friends nav-mini-icon"></i> The Couple
        </router-link>
        <router-link to="/moments" class="desktop-nav-item" active-class="active">
          <i class="fa-solid fa-images nav-mini-icon"></i> Moments
        </router-link>
        <router-link to="/story" class="desktop-nav-item" active-class="active">
          <i class="fa-solid fa-heart nav-mini-icon"></i> The Story
        </router-link>
      </nav>
    </div>
  </header>

  <!-- Mobile Floating Menu (Unchanged) -->
  <nav class="floating-menu-container d-md-none">
    <div class="floating-menu">
      <router-link to="/" class="menu-item" active-class="active">
        <i class="fa-solid fa-house menu-icon"></i>
        <span class="menu-label">Home</span>
      </router-link>

      <router-link to="/events" class="menu-item" active-class="active">
        <i class="fa-calendar-check fa-solid menu-icon"></i>
        <span class="menu-label">Events</span>
      </router-link>

      <button @click="handleCenterAction" class="menu-item center-action-btn">
        <div class="action-circle">
          <span class="action-button-text">M&A</span>
        </div>
      </button>

      <router-link to="/moments" class="menu-item" active-class="active">
        <i class="fa-solid fa-images menu-icon"></i>
        <span class="menu-label">Moments</span>
      </router-link>

      <router-link to="/story" class="menu-item" active-class="active">
        <i class="fa-solid fa-heart menu-icon"></i>
        <span class="menu-label">Story</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
const handleCenterAction = () => router.push("/couple");
</script>

<style lang="scss" scoped>
/* ── Desktop ── */
.desktop-nav-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(253, 246, 236, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(26, 18, 8, 0.04);
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
  font-family: 'Cinzel Decorative', cursive;
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
  font-family: 'Cormorant Garamond', serif;
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
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 100%;
  max-width: 420px;
  padding: 0 16px;
  box-sizing: border-box;
}

.floating-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(253, 246, 236, 0.93);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  padding: 8px 12px;
  border-radius: 30px;
  box-shadow: 0 8px 32px rgba(26, 18, 8, 0.12);
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
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  &:hover {
    opacity: 1;
    color: var(--dark);
    .menu-icon { transform: translateY(-2px); }
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
    box-shadow: 0 4px 16px rgba(154, 122, 69, 0.35);
    transition: all 0.25s ease;
  }

  &:hover .action-circle {
    transform: scale(1.08) translateY(-3px);
    box-shadow: 0 8px 20px rgba(154, 122, 69, 0.5);
  }
}

.action-button-text {
  font-family: 'Cinzel Decorative', cursive;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--dark);
}

.nav-branding-wrapper {
  display: flex;
  align-items: baseline; /* Aligns the bottom of the texts nicely */
  gap: 16px;             /* Space between M&A and the credit text */
}

.navbar-credit {
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.8rem;
  font-style: italic;
  color: var(--text);
  opacity: 0.45;         /* Soft, out of the way, but visible */
  letter-spacing: 0.5px;
}
</style>