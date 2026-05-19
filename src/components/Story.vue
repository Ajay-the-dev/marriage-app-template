<template>
  <Basic>
    <section class="events-section p-2">
      <div class="container py-5">
        
        <!-- Section Header Optimized for Love Story -->
        <div class="text-center mb-5 header-block">
          <span class="sub-title">How We Got Here</span>
          <h2 class="main-title">Our Sweet Journey</h2>
          <div class="luxury-divider">
            <span class="line"></span>
            <i class="fa-solid fa-heart divider-icon"></i>
            <span class="line"></span>
          </div>
        </div>

        <!-- Timeline Matrix -->
        <div class="events-timeline">
          <div 
            v-for="(event, index) in relationshipTimeline" 
            :key="index" 
            class="event-card-wrapper"
            :class="index % 2 === 0 ? 'left-aligned' : 'right-aligned'"
          >
            <!-- Elegant Floating Date Badge (Shows Day & Month) -->
            <div class="date-badge">
              <span class="day">{{ event.day }}</span>
              <span class="month">{{ event.month }}</span>
            </div>

            <!-- Main Milestone Display Card -->
            <div class="event-card">
              <div class="card-accent"></div>
              
              <h3 class="event-title">{{ event.name }}</h3>
              
              <div class="event-details">
                <!-- Year Frame Marker -->
                <div class="detail-item">
                  <i class="fa-regular fa-calendar-check detail-icon text-sage"></i>
                  <span><strong>Year:</strong> {{ event.year }}</span>
                </div>
                
                <!-- Custom Sub-description block (Optional notes can go here) -->
                <div class="detail-item mt-2">
                  <i class="fa-solid fa-star detail-icon text-gold"></i>
                  <div class="venue-info">
                    <span class="location-sub">{{ event.note }}</span>
                  </div>
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
import { ref } from "vue";
import Basic from "@/views/Basic.vue";

// Renamed and filled with your custom love story milestones
const relationshipTimeline = ref([
  {
    name: 'First Meet',
    day: '17',
    month: 'June',
    year: '2019',
    note: 'The beautiful day our paths crossed for the very first time.'
  },
  {
    name: 'Proposal',
    day: '15',
    month: 'July',
    year: '2022',
    note: 'A magical moment written in the stars.'
  },
  {
    name: 'We Said Yes',
    day: '22',
    month: 'July',
    year: '2022',
    note: 'Making promises to love each other for a lifetime.'
  },
  {
    name: 'Family Meet',
    day: '11',
    month: 'May',
    year: '2025',
    note: 'Two loving families coming together as one.'
  },
  {
    name: 'Official Pennukanal',
    day: '3', // Handled elegantly since no specific day was given
    month: 'Sept',
    year: '2025',
    note: 'Sealing the beautiful traditional custom with blessings.'
  }
]);
</script>

<style lang="scss" scoped>
/* Base Setup & Containers */
.events-section {
  background-color: var(--cream);
  color: var(--text);
  font-family: 'Playfair Display', serif;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
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

/* Timeline Layout */
.events-timeline {
  position: relative;
  max-width: 850px;
  margin: 50px auto 0 auto;
  padding: 20px 0;

  /* Central connecting thread line */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background-color: var(--gold-light);
    transform: translateX(-50%);
  }
}

/* Structural Layout for Individual Alternating Blocks */
.event-card-wrapper {
  position: relative;
  width: 50%;
  margin-bottom: 60px;
  display: flex;
  box-sizing: border-box;

  &.left-aligned {
    left: 0;
    padding-right: 50px;
    justify-content: flex-end;
    .date-badge { right: -24px; }
  }

  &.right-aligned {
    left: 50%;
    padding-left: 50px;
    justify-content: flex-start;
    .date-badge { left: -24px; }
  }
}

/* Date Badge Capsule */
.date-badge {
  position: absolute;
  top: 30px;
  width: 50px;
  height: 50px;
  background-color: var(--blush);
  border: 1px solid var(--gold);
  border-radius: 50%;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

  .day {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--dark);
    line-height: 1;
  }
  .month {
    font-size: 0.6rem;
    text-transform: uppercase;
    color: var(--gold-dark);
    letter-spacing: 0.5px;
    font-weight: 600;
  }
}

/* Event Luxury Card styling */
.event-card {
  background-color: #ffffff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 40%, transparent);
  border-radius: 20px;
  padding: 30px;
  width: 100%;
  max-width: 360px;
  position: relative;
  box-shadow: 0 10px 25px rgba(61, 44, 20, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(154, 122, 69, 0.12);
  }
}

.card-accent {
  position: absolute;
  top: 0;
  left: 30px;
  right: 30px;
  height: 3px;
  background: linear-gradient(90deg, var(--gold-light), var(--gold-dark));
  border-radius: 0 0 4px 4px;
}

.event-title {
  color: var(--dark);
  font-size: 1.6rem;
  margin-bottom: 20px;
}

/* Inner Details Frame */
.event-details {
  font-family: 'Inter', sans-serif;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  font-size: 0.95rem;
  color: var(--text);

  .detail-icon {
    width: 20px;
    margin-top: 3px;
    font-size: 1rem;
    margin-right: 12px;
  }
}

.text-sage { color: var(--sage); }
.text-gold { color: var(--gold-dark); }

.venue-info {
  display: flex;
  flex-direction: column;
  .location-sub { font-size: 0.9rem; font-style: italic; color: var(--text); opacity: 0.85; }
}

/* Responsive Structural Refactors for Mobile Screens */
@media (max-width: 768px) {
  .events-timeline {
    &::before { left: 20px; }
  }

  .event-card-wrapper {
    width: 100%;
    padding-left: 55px !important;
    padding-right: 0 !important;
    justify-content: flex-start !important;

    &.right-aligned { left: 0; }
    
    .date-badge {
      left: -5px !important;
      right: auto !important;
    }
  }

  .event-card {
    max-width: 100%;
  }
}
</style>