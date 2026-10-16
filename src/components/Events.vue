<template>
    <Basic>
        <section class="events-section">
          <div class="container py-5">

            <!-- Section Header -->
            <div class="text-center mb-5 header-block">
              <span class="sub-title">{{ page.subTitle }}</span>
              <h2 class="main-title">{{ page.title }}</h2>
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
                  <span class="event-num">{{ String(index + 1).padStart(2, "0") }}</span>
                  <div class="event-date">
                    <span class="date-day">{{ event.day }}</span>
                    <span class="date-month">
                      <span class="month-full">{{ event.month }}</span>
                      <span class="month-short">{{ String(event.month || "").trim().slice(0, 3) }}</span>
                    </span>
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
                    <div class="info-row event-time">
                      <i class="fa-regular fa-clock"></i>
                      <span>{{ event.time }}</span>
                    </div>
                    <div class="info-row">
                      <i class="fa-solid fa-location-dot"></i>
                      <span>{{ event.venue }}, <em>{{ event.location }}</em></span>
                    </div>
                  </div>

                  <div class="event-actions">
                    <a
                      :href="mapLink(event)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="map-link"
                    >
                      <i class="fa-solid fa-map-location-dot"></i> {{ page.mapButtonLabel }}
                    </a>

                    <!-- Add to calendar: only for events with an exact date -->
                    <details v-if="entries[index]" class="calendar-menu">
                      <summary class="map-link">
                        <i class="fa-regular fa-calendar-plus"></i> {{ page.calendarButtonLabel || "Add to Calendar" }}
                      </summary>
                      <div class="calendar-options">
                        <a :href="googleCalendarUrl(entries[index])" target="_blank" rel="noopener noreferrer" @click="closeMenu">
                          <i class="fa-brands fa-google"></i> Google Calendar
                        </a>
                        <a :href="outlookCalendarUrl(entries[index])" target="_blank" rel="noopener noreferrer" @click="closeMenu">
                          <i class="fa-brands fa-microsoft"></i> Outlook
                        </a>
                        <button type="button" @click="closeMenu($event); downloadIcs([entries[index]], event.name)">
                          <i class="fa-brands fa-apple"></i> Apple Calendar / other
                        </button>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>

            <!-- Every dated event in one file -->
            <div v-if="datedEntries.length > 1" class="text-center">
              <button type="button" class="map-link" @click="downloadIcs(datedEntries, 'Wedding events')">
                <i class="fa-regular fa-calendar-plus"></i> Add all events to calendar
              </button>
            </div>

          </div>
        </section>
    </Basic>
</template>

<script setup>
import Basic from "@/views/Basic.vue";
import { computed, onBeforeUnmount, onMounted } from "vue";
import { useWeddingStore, weddingCode } from "@/stores/wedding";
import { safeUrl } from "@/utils/validation";
import { calendarEntry, downloadIcs, googleCalendarUrl, outlookCalendarUrl } from "@/utils/calendar";

const wedding = useWeddingStore();
const page = computed(() => wedding.eventsPage);
const weddingEvents = computed(() => page.value.events);

// A map link that isn't a plain web link falls back to searching the venue
const mapLink = (event) =>
  safeUrl(event.mapUrl?.trim()) || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(event.venue + " " + event.location);

// Calendar entry per event (null for events without an exact date)
const inviteUrl = computed(() => (weddingCode.value ? `${window.location.origin}/${weddingCode.value}` : ""));
const entries = computed(() => weddingEvents.value.map((event) => calendarEntry(event, wedding, inviteUrl.value)));
const datedEntries = computed(() => entries.value.filter(Boolean));

// Calendar menus close when an option is picked or on a click elsewhere
const closeMenu = (e) => {
  const menu = e.currentTarget.closest("details");
  if (menu) menu.open = false;
};
const closeOtherMenus = (e) => {
  document.querySelectorAll(".calendar-menu[open]").forEach((menu) => {
    if (!menu.contains(e.target)) menu.open = false;
  });
};
onMounted(() => document.addEventListener("click", closeOtherMenus));
onBeforeUnmount(() => document.removeEventListener("click", closeOtherMenus));
</script>

<style lang="scss" scoped>
.events-section {
  background-color: var(--cream);
  color: var(--text);
  font-family: var(--font-serif);
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
  font-family: var(--font-serif);
}

.main-title {
  color: var(--dark);
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  margin-top: 6px;
  font-family: var(--font-display);
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
  font-family: var(--font-serif);
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
  font-family: var(--font-display);
}

.date-month {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--gold-dark);
  font-family: var(--font-serif);
  font-weight: 600;
}

// Phones show the month as 3 letters (AUG)
.month-short { display: none; }

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
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--gold-light) 35%, transparent);
  border-radius: 16px;
  padding: 16px 18px 14px;
  margin-bottom: 28px;
  box-shadow: 0 4px 18px color-mix(in srgb, var(--shadow) 5%, transparent);
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
    box-shadow: 0 10px 30px color-mix(in srgb, var(--gold-dark) 10%, transparent);
  }
}

.event-name {
  font-family: var(--font-display);
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
  font-family: var(--font-serif);

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
  font-family: var(--font-serif);
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
    color: var(--on-accent);
    border-color: var(--gold-light);
  }
}

button.map-link {
  background: none;
  cursor: pointer;
}

.event-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* ── Add to calendar ── */
// An open menu must not be clipped by its card or hidden under the next event
.event-row:has(.calendar-menu[open]) {
  position: relative;
  z-index: 5;

  .event-card { overflow: visible; }
}

.calendar-menu {
  position: relative;

  summary {
    list-style: none;
    cursor: pointer;

    &::-webkit-details-marker { display: none; }
  }

  &[open] summary {
    background-color: var(--gold-light);
    color: var(--on-accent);
    border-color: var(--gold-light);
  }
}

.calendar-options {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  padding: 6px;
  background-color: var(--cream);
  border: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);
  border-radius: 12px;
  box-shadow: 0 10px 30px color-mix(in srgb, var(--gold-dark) 15%, transparent);

  a, button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--text);
    font-family: var(--font-serif);
    font-size: 0.85rem;
    text-align: left;
    text-decoration: none;
    cursor: pointer;

    i { width: 16px; color: var(--gold-dark); }

    &:hover { background-color: color-mix(in srgb, var(--gold-light) 25%, transparent); }
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

  .month-full { display: none; }
  .month-short { display: inline; }

  .event-card {
    padding: 14px 14px 12px;
  }

  .dot {
    width: 8px;
    height: 8px;
  }
}

.event-time{
  font-family: 'sans-serif', serif;
}
</style>