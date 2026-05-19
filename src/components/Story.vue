<template>
  <Basic>
    <section class="events-section">
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

        <!-- Relationship Timeline Stack -->
        <div class="events-list mb-5">
          <div
            v-for="(event, index) in relationshipTimeline"
            :key="index"
            class="event-row"
          >
            <!-- Left: Sequential Counter + Date -->
            <div class="event-meta">
              <span class="event-num">0{{ index + 1 }}</span>
              <div class="event-date">
                <span class="date-day">{{ event.day }}</span>
                <span class="date-month">{{ event.month }}</span>
              </div>
            </div>

            <!-- Central Asymmetric Connector -->
            <div class="connector">
              <div class="dot"></div>
              <div class="thread" v-if="index < relationshipTimeline.length - 1"></div>
            </div>

            <!-- Right: Milestone Details Card -->
            <div class="event-card">
              <h3 class="event-name">{{ event.name }}</h3>

              <div class="event-info">
                <!-- Year Frame Block -->
                <div class="info-row">
                  <i class="fa-regular fa-calendar-check text-sage"></i>
                  <span><strong>Year:</strong> {{ event.year }}</span>
                </div>
                
                <!-- Description Note Block -->
                <div class="info-row align-items-start mt-1">
                  <i class="fa-solid fa-star text-gold"></i>
                  <p class="story-note">{{ event.note }}</p>
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
    day: '03',
    month: 'Sept',
    year: '2025',
    note: 'Sealing the beautiful traditional custom with blessings.'
  }
]);
</script>

<style lang="scss" scoped>
.events-section {
  background-color: var(--cream);
  color: var(--text);
  font-family: 'Cormorant Garamond', serif;
  min-height: 100vh;
}

/* ── Header ── */
.sub-title {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--sage);
  font-weight: 600;
  font-family: 'Cormorant Garamond', serif;
}

.main-title {
  color: var(--dark);
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  margin-top: 6px;
  font-family: 'Cinzel Decorative', cursive;
  font-weight: 400;
}

.luxury-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px;

  .line {
    height: 1px;
    width: 50px;
    background-color: var(--gold-light);
  }
  .divider-icon {
    margin: 0 12px;
    color: var(--gold);
    font-size: 0.7rem;
  }
}

/* ── Events List Layout ── */
.events-list {
  max-width: 600px;
  margin: 0 auto;
  padding: 10px 0 40px;
}

.event-row {
  display: grid;
  grid-template-columns: 64px 28px 1fr;
  gap: 0 12px;
  align-items: start;
  margin-bottom: 0;
}

/* ── Left Metadata Column ── */
.event-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-top: 14px;
  gap: 4px;
}

.event-num {
  font-size: 0.65rem;
  letter-spacing: 2px;
  color: var(--gold-light);
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  text-transform: uppercase;
}

.event-date {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.date-day {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--dark);
  line-height: 1;
  font-family: 'Cinzel Decorative', cursive;
}

.date-month {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--gold-dark);
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
}

/* ── Center Connector Line ── */
.connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--gold);
  border: 2px solid var(--cream);
  box-shadow: 0 0 0 1px var(--gold-light);
  flex-shrink: 0;
}

.thread {
  width: 1px;
  flex: 1;
  min-height: 70px;
  background: linear-gradient(to bottom, var(--gold-light), transparent);
  margin-top: 6px;
}

/* ── Milestone Card ── */
.event-card {
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 35%, transparent);
  border-radius: 16px;
  padding: 18px 20px 16px;
  margin-bottom: 28px;
  box-shadow: 0 4px 18px rgba(61, 44, 20, 0.05);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;

  /* Top brand gradient accent line */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 20px;
    right: 20px;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold-light), transparent);
    border-radius: 0 0 4px 4px;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(154, 122, 69, 0.1);
  }
}

.event-name {
  font-family: 'Cinzel Decorative', cursive;
  font-size: clamp(0.95rem, 3vw, 1.15rem);
  font-weight: 400;
  color: var(--dark);
  margin: 0 0 12px;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: clamp(0.82rem, 2.5vw, 0.92rem);
  color: var(--text);
  line-height: 1.4;
  font-family: 'Cormorant Garamond', serif;

  i {
    font-size: 0.85rem;
    flex-shrink: 0;
    width: 14px;
    text-align: center;
  }
}

.text-sage { color: var(--sage); }
.text-gold { color: var(--gold-dark); }

.story-note {
  margin: 0;
  font-style: italic;
  opacity: 0.85;
}

/* ── Mobile Optimization ── */
@media (max-width: 480px) {
  .event-row {
    grid-template-columns: 52px 22px 1fr;
    gap: 0 8px;
  }

  .date-day {
    font-size: 1.2rem;
  }

  .event-card {
    padding: 14px 16px 14px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }
}
</style>