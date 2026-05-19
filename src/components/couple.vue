<template>
  <Basic>
    <section class="couple-section p-2">
      <div class="container py-5">
        
        <!-- Section Header -->
        <div class="text-center mb-5 header-block">
          <span class="sub-title">Meet the Couple</span>
          <h2 class="main-title">Groom & Bride</h2>
          <div class="luxury-divider">
            <span class="line"></span>
            <i class="fa-solid fa-heart divider-icon"></i>
            <span class="line"></span>
          </div>
        </div>

        <!-- Couple Cards Container -->
        <div class="row justify-content-center align-items-stretch g-4 couple-container ">
          
          <!-- Groom Column -->
          <div class="col-md-5 col-lg-4">
            <div class="couple-card groom-card">
              <div class="image-frame">
                <!-- Replace with actual groom image path -->
                <img src="/images/groom.jpeg" alt="The Groom" class="couple-img" />
                <span class="role-badge">The Groom</span>
              </div>
              
              <div class="profile-details text-center mt-4">
                <h3 class="partner-name">Mithun</h3>
                <span class="parent-names">Son of Mr.Mohanan A & Mrs. Vijaya S</span>
                <p class="partner-bio mt-3">
                  A brief, heartwarming sentence about the groom. His personality, passions, or a sweet note about his excitement for the big day.
                </p>
                
                <!-- Social Connect handles -->
                <div class="social-links mt-4">
                  <a href="https://www.instagram.com/mithun_m_o_h_a_n?igsh=aWx0bGdmaDd1dm84&utm_source=qr" target="_blank" class="social-icon">
                    <i class="fa-brands fa-instagram"></i>
                  </a>
                  <a href="https://wa.me/8156892272" target="_blank" class="social-icon">
                    <i class="fa-brands fa-whatsapp"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Decorative Golden Ampersand Divider (Hidden on mobile) -->
          <div class="col-md-1 d-none d-md-flex align-items-center justify-content-center ampersand-divider">
            <span>&</span>
          </div>

          <!-- Bride Column -->
          <div class="col-md-5 col-lg-4">
            <div class="couple-card bride-card">
              <div class="image-frame">
                <!-- Replace with actual bride image path -->
                <img src="/images/bride.jpeg" alt="The Bride" class="couple-img" />
                <span class="role-badge">The Bride</span>
              </div>
              
              <div class="profile-details text-center mt-4">
                <h3 class="partner-name">Aiswarya Shaji</h3>
                <span class="parent-names">Daughter of Mr. Shaji Joseph & Mrs.  Mini shaji</span>
                <p class="partner-bio mt-3">
                  A brief, heartwarming sentence about the bride. Her passions, a reflection on this beautiful journey, or a tiny note about her partner.
                </p>
                
                <!-- Social Connect handles -->
                <div class="social-links mt-4">
                  <a href="https://www.instagram.com/aiswarya__shaji?igsh=bGw0cWRseXV2NHRk" target="_blank" class="social-icon">
                    <i class="fa-brands fa-instagram"></i>
                  </a>
                  <a href="https://wa.me/919544910548" target="_blank" class="social-icon">
                    <i class="fa-brands fa-whatsapp"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  </Basic>
</template>

<script setup>
import Basic from "@/views/Basic.vue";
</script>

<style lang="scss" scoped>
.couple-section {
  background-color: var(--cream);
  color: var(--text);
  font-family: 'Playfair Display', serif;
  min-height: 100vh;
}

/* Typography Header Layout */
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
}

.luxury-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
  
  .line {
    height: 1px;
    width: 60px;
    background-color: var(--gold-light);
  }
  .divider-icon {
    margin: 0 15px;
    color: var(--gold);
    font-size: 0.8rem;
  }
}

/* Profiles Layout & Structure */
.couple-container {
  margin-top: 30px;
  margin-bottom: 4rem;
}

.couple-card {
  background-color: #ffffff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 35%, transparent);
  border-radius: 24px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(61, 44, 20, 0.04);
  transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 15px 35px rgba(154, 122, 69, 0.12);
  }
}

/* Luxury Portrait Frame Layout */
.image-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--blush);

  .couple-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s ease;
  }
  
  &:hover .couple-img {
    transform: scale(1.05);
  }
}

/* Floating Badges */
.role-badge {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(253, 246, 236, 0.9); /* --cream fallback */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--gold);
  color: var(--dark);
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  padding: 6px 16px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Content Details */
.partner-name {
  font-size: 2rem;
  color: var(--gold-dark);
  margin-bottom: 4px;
}

.parent-names {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: var(--sage);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.partner-bio {
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text);
  opacity: 0.9;
}

/* Social Media Interaction Buttons */
.social-links {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.social-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--blush);
  color: var(--dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  text-decoration: none;

  &:hover {
    background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
    color: var(--cream);
    transform: scale(1.1);
  }
}

/* Ornamental Desktop Center Splitting Ampersand */
.ampersand-divider {
  font-size: 4rem;
  color: var(--gold-light);
  font-family: 'Playfair Display', serif;
  font-style: italic;
  opacity: 0.6;
}

/* Mobile Screens Optimization handles */
@media (max-width: 768px) {
  .main-title {
    font-size: 2.2rem;
  }
  .partner-name {
    font-size: 1.75rem;
  }
  .couple-card {
    padding: 16px;
  }
}
</style>