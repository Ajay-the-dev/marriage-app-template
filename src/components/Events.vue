<template>
    <Basic>
        <section class="events-section">
          <div class="container py-5">

            <!-- Section Header -->
            <div class="text-center mb-5 header-block">
              <span class="sub-title">Join Our Celebrations</span>
              <h2 class="main-title">The Wedding Itinerary</h2>
              <div class="luxury-divider">
                <span class="line"></span>
                <i class="fa-solid fa-heart divider-icon"></i>
                <span class="line"></span>
              </div>
            </div>

            <!-- Events Stack -->
            <div class="events-list mb-5">
              <div
                v-for="(event, index) in weddingEvents"
                :key="index"
                class="event-row"
              >
                <!-- Left: Number + date -->
                <div class="event-meta">
                  <span class="event-num">0{{ index + 1 }}</span>
                  <div class="event-date">
                    <span class="date-day">{{ event.day }}</span>
                    <span class="date-month">{{ event.month }}</span>
                  </div>
                </div>

                <!-- Connector dot -->
                <div class="connector">
                  <div class="dot"></div>
                  <div class="thread" v-if="index < weddingEvents.length - 1"></div>
                </div>

                <!-- Right: Card -->
                <div class="event-card">
                  <h3 class="event-name">{{ event.name }}</h3>

                  <div class="event-info">
                    <div class="info-row">
                      <i class="fa-regular fa-clock"></i>
                      <span>{{ event.time }}</span>
                    </div>
                    <div class="info-row">
                      <i class="fa-solid fa-location-dot"></i>
                      <span>{{ event.venue }}, <em>{{ event.location }}</em></span>
                    </div>
                  </div>

                  <a
                    :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(event.venue + ' ' + event.location)"
                    target="_blank"
                    class="map-link"
                  >
                    <i class="fa-solid fa-map-location-dot"></i> View on Map
                  </a>
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

const weddingEvents = ref([
  {
    name: 'Haldi',
    day: '11',
    month: 'Jul',
    time: '5:00 PM – 10:00 PM',
    venue: 'Green Nest',
    location: 'Kumbalangi'
  },
  {
    name: 'Wedding',
    day: '12',
    month: 'Jul',
    time: '10:30 AM – 11:30 AM',
    venue: 'Green Nest',
    location: 'Kumbalangi'
  },
  {
    name: 'Reception 1',
    day: '14',
    month: 'Jul',
    time: '11:00 AM – 3:00 PM',
    venue: 'Grand Auditorium',
    location: 'Chittur'
  },
  {
    name: 'Reception 2',
    day: '16',
    month: 'Jul',
    time: '5:30 PM – 9:00 PM',
    venue: "Parish Hall, St. Mary's Church",
    location: 'Kalathoor'
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

/* ── Events List ── */
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

/* ── Left meta column ── */
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

/* ── Connector column ── */
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
  min-height: 60px;
  background: linear-gradient(to bottom, var(--gold-light), transparent);
  margin-top: 6px;
}

/* ── Card ── */
.event-card {
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 35%, transparent);
  border-radius: 16px;
  padding: 16px 18px 14px;
  margin-bottom: 28px;
  box-shadow: 0 4px 18px rgba(61, 44, 20, 0.05);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;

  /* top accent bar */
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
  margin: 0 0 10px;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: clamp(0.78rem, 2.5vw, 0.88rem);
  color: var(--text);
  line-height: 1.4;
  font-family: 'Cormorant Garamond', serif;

  i {
    color: var(--gold-dark);
    font-size: 0.8rem;
    margin-top: 3px;
    flex-shrink: 0;
    width: 14px;
  }

  em {
    font-style: normal;
    opacity: 0.7;
  }
}

/* ── Map link ── */
.map-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-family: 'Cormorant Garamond', serif;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--gold-dark);
  text-decoration: none;
  border: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);
  padding: 6px 14px;
  border-radius: 30px;
  transition: all 0.2s ease;

  i { font-size: 0.75rem; }

  &:hover {
    background-color: var(--gold-light);
    color: var(--dark);
    border-color: var(--gold-light);
  }
}

/* ── Mobile ── */
@media (max-width: 480px) {
  .event-row {
    grid-template-columns: 52px 22px 1fr;
    gap: 0 8px;
  }

  .date-day {
    font-size: 1.2rem;
  }

  .event-card {
    padding: 14px 14px 12px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }
}
</style>