<template>
  <!-- ================================================================= -->
  <!-- 1. DESKTOP HEADER NAVIGATION (Visible on md screens and up)       -->
  <!-- ================================================================= -->
  <header class="desktop-nav-container d-none d-md-block">
    <div class="desktop-navbar">
      <!-- Branding Logo Left -->
      <div class="nav-branding" @click="handleCenterAction">
        <span class="branding-text">M&A</span>
      </div>

      <!-- Navigation Links Right -->
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
          <i class="fa-solid fa-heart nav-mini-icon"></i> Our Story
        </router-link>
      </nav>
    </div>
  </header>

  <!-- ================================================================= -->
  <!-- 2. MOBILE FLOATING MENU (Visible on mobile screens only)          -->
  <!-- ================================================================= -->
  <nav class="floating-menu-container d-md-none">
    <div class="floating-menu">
      <!-- Home Link -->
      <router-link to="/" class="menu-item" active-class="active">
        <i class="fa-solid fa-house menu-icon"></i>
        <span class="menu-label">Home</span>
      </router-link>

      <!-- Events Link -->
      <router-link to="/events" class="menu-item" active-class="active">
        <i class="fa-calendar-check fa-solid menu-icon"></i>
        <span class="menu-label">Events</span>
      </router-link>

      <!-- Center Action Button -->
      <button @click="handleCenterAction" class="menu-item center-action-btn">
        <div class="action-circle">
          <span class="fw-bold action-button-text">M&A</span>
        </div>
      </button>

      <!-- Moments Link -->
      <router-link to="/moments" class="menu-item" active-class="active">
        <i class="fa-solid fa-images menu-icon"></i>
        <span class="menu-label">Moments</span>
      </router-link>

      <!-- Our Story Link -->
      <router-link to="/story" class="menu-item" active-class="active">
        <i class="fa-solid fa-heart menu-icon"></i>
        <span class="menu-label">Our Story</span>
      </router-link>  
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

const handleCenterAction = () => {
  router.push("/couple");
}
</script>

<style lang="scss" scoped>
/* ================================================================= */
/* DESKTOP NAVBAR STYLES                                            */
/* ================================================================= */
.desktop-nav-container {
  position: relative; /* Fixes navbar to the top during scrolling */
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(253, 246, 236, 0.9); /* var(--cream) fallback tint */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--gold-light);
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(26, 18, 8, 0.05);
}

.desktop-navbar {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Luxury Monogram Brand Left */
.nav-branding {
  cursor: pointer;
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  padding: 6px 18px;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(154, 122, 69, 0.2);
  transition: transform 0.25s ease;

  &:hover {
    transform: scale(1.05);
  }

  .branding-text {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 800;
    font-size: 1.3rem;
    color: var(--dark);
    letter-spacing: 0.5px;
  }
}

/* Nav Menu Links Right */
.nav-links {
  display: flex;
  gap: 32px;
}

.desktop-nav-item {
  text-decoration: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s ease;
  position: relative;
  padding: 4px 0;

  .nav-mini-icon {
    font-size: 0.85rem;
  }

  /* Subtle elegant hover underline animation line */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1.5px;
    background-color: var(--gold-dark);
    transition: width 0.25s ease;
  }

  &:hover {
    opacity: 1;
    color: var(--dark);
    &::after { width: 100%; }
  }

  &.active {
    opacity: 1;
    color: var(--gold-dark);
    
    &::after {
      width: 100%;
      background-color: var(--gold-dark);
    }
  }
}

/* ================================================================= */
/* MOBILE FLOATING MENU STYLES (Your Original Code Preserved)        */
/* ================================================================= */
.floating-menu-container {
  position: absolute; /* Switched to fixed so it floats consistently over scrolling pages */
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 100%;
  max-width: 450px;
  padding: 0 16px;
  box-sizing: border-box;
}

.floating-menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(253, 246, 236, 0.9); 
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--gold-light);  
  padding: 8px 16px;
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(26, 18, 8, 0.15); 
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-decoration: none;
  color: var(--text); 
  opacity: 0.65;
  transition: all 0.25s ease;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0;

  .menu-icon {
    font-size: 1.25rem;
    margin-bottom: 4px;
    transition: transform 0.2s ease;
    display: inline-block;
  }

  .menu-label {
    font-size: 0.7rem;
    font-weight: 500;
  }

  &:hover {
    opacity: 1;
    color: var(--dark); 
    .menu-icon {
      transform: translateY(-2px);
    }
  }

  &.active {
    opacity: 1;
    color: var(--gold-dark); 
    font-weight: 600;
    
    .menu-icon {
      transform: scale(1.1);
    }
  }
}

.center-action-btn {
  position: relative;
  top: -2px;
  opacity: 1;
  
  .action-circle {
    width: 75px;
    height: 75px;
    background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
    color: var(--dark);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    box-shadow: 0 6px 16px rgba(154, 122, 69, 0.4);
    transition: all 0.25s ease;
  }

  &:hover .action-circle {
    transform: scale(1.1) translateY(-4px);
    box-shadow: 0 10px 20px rgba(154, 122, 69, 0.6);
  }
}

.action-button-text {
  opacity: 1;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 800;
}
</style>