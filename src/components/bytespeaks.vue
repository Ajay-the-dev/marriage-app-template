<template>
    <!-- Floating Signature Badge -->
  <div class="floating-signature">
    <a href="https://bytespeaks.com" target="_blank" rel="noopener" class="signature-link">
      crafted by bytespeaks <i class="fa-solid fa-heart heart-icon"></i>
    </a>
  </div>
</template>
<script setup>
</script>
<style lang="scss" scoped>
/* ── Floating Signature Badge ── */
.floating-signature {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 10000; /* Stays on top of everything */
  pointer-events: auto;
}

.signature-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  background: rgba(253, 246, 236, 0.75); /* Matching your warm cream background */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid color-mix(in srgb, var(--gold-light) 40%, transparent);
  padding: 6px 14px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(26, 18, 8, 0.06);
  
  // Typography
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: lowercase;
  color: var(--text);
  opacity: 0.65;
  transition: all 0.3s ease;

  .heart-icon {
    font-size: 0.65rem;
    color: var(--gold-dark); /* Subtle hint of color */
    transition: transform 0.3s ease;
  }

  &:hover {
    opacity: 1;
    color: var(--dark);
    border-color: var(--gold-dark);
    box-shadow: 0 6px 16px rgba(154, 122, 69, 0.15);
    transform: translateY(-2px);

    .heart-icon {
      transform: scale(1.2);
    }
  }
}

/* Responsive adjustments for Mobile */
@media (max-width: 767.98px) {
  .floating-signature {
    bottom: 120px; /* Safely moves it right above your floating menu container */
    right: 0;
    transform: translateX(50%); /* Centers it horizontally on mobile screens */
    width: max-content;
    transform: scale(0.5);
    opacity: 0.6;
  }
  
  .signature-link {
    background: rgba(253, 246, 236, 0.9); /* Slightly more opaque for tiny screens */
  }
}
</style>