<template>
  <Teleport to="body">
    <Transition name="sync">
      <div v-if="options" class="sync-backdrop" @click.self="emit('cancel')">
        <div class="sync-dialog" role="dialog" aria-modal="true" aria-labelledby="sync-title">
          <button class="close-btn" @click="emit('cancel')" aria-label="Close without saving">
            <i class="fa-solid fa-xmark"></i>
          </button>

          <span class="sync-icon"><i class="fa-solid fa-house-chimney"></i></span>
          <h2 id="sync-title">Update the home page too?</h2>
          <p v-if="options.length === 1">You changed the {{ options[0].event }} event. The home page still shows the old details:</p>
          <template v-else>
            <p>You changed {{ options.length }} events. Pick the one the home page should show:</p>
            <div class="sync-events" role="radiogroup" aria-label="Event for the home page">
              <button
                v-for="(o, i) in options"
                :key="o.event"
                type="button"
                role="radio"
                :aria-checked="picked === i"
                :class="{ selected: picked === i }"
                @click="picked = i"
              >
                {{ o.event }}
              </button>
            </div>
          </template>

          <ul class="sync-changes">
            <li v-for="c in chosen.changes" :key="c.key">
              <span class="label">{{ c.label }}</span>
              <span class="from">{{ show(c, c.from) || "Not set" }}</span>
              <i class="fa-solid fa-arrow-down"></i>
              <span class="to">{{ show(c, c.to) }}</span>
            </li>
          </ul>

          <button class="sync-cta" @click="emit('update', chosen.changes)">
            <i class="fa-solid fa-check"></i> Update home page & save
          </button>
          <button class="later-btn" @click="emit('keep')">Save without changing the home page</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue";

// Asked on save when events changed but the home page didn't follow.
// options: [{ event, changes: [{ key, label, from, to }] }] from heroSyncOptions, or null when closed.
// "update" sends the picked event's changes.
const props = defineProps({ options: { type: Array, default: null } });
const emit = defineEmits(["update", "keep", "cancel"]);

const picked = ref(0);
watch(() => props.options, () => { picked.value = 0; });
const chosen = computed(() => props.options?.[picked.value] ?? { changes: [] });

// The countdown target "2027-06-12T10:00:00" reads as "12 Jun 2027, 10:00 AM"
const show = (change, value) => {
  if (change.key !== "target" || !value) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
};
</script>

<style lang="scss" scoped>
.sync-backdrop {
  --gold-light: #e8d5a3;
  --gold-dark: #9a7a45;
  --cream: #fdf6ec;
  --dark: #1a1208;
  --text: #3d2c14;
  --blush: #f5e6d8;
  --sage: #8a9e8c;
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(26, 18, 8, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  overflow-y: auto;
}

.sync-dialog {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 28px 24px 20px;
  border-radius: 20px;
  background: var(--cream);
  color: var(--text);
  font-family: 'Montserrat', sans-serif;
  box-shadow: 0 24px 60px rgba(26, 18, 8, 0.3);
  text-align: center;

  h2 {
    margin: 14px 0 6px;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 1.2rem;
    color: var(--dark);
  }

  p { margin: 0; font-size: 0.85rem; line-height: 1.5; }
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  &:hover { background: var(--blush); }
}

.sync-icon {
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  color: var(--dark);
  font-size: 1.2rem;
}

.sync-events {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;

  button {
    padding: 6px 14px;
    border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
    border-radius: 30px;
    background: #fff;
    color: var(--text);
    font-family: inherit;
    font-size: 0.78rem;
    cursor: pointer;

    &.selected {
      background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
      border-color: transparent;
      color: var(--dark);
      font-weight: 600;
    }
  }
}

.sync-changes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  text-align: left;

  li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 14px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
    font-size: 0.82rem;
  }

  .label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--sage); font-weight: 600; }
  .from { color: var(--sage); text-decoration: line-through; }
  i { font-size: 0.65rem; color: var(--gold-dark); }
  .to { color: var(--dark); font-weight: 600; }
}

.sync-cta {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 18px;
  border: none;
  border-radius: 30px;
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  color: var(--dark);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
  &:hover { box-shadow: 0 6px 18px rgba(154, 122, 69, 0.4); }
}

.later-btn {
  margin-top: 8px;
  padding: 8px 14px;
  border: none;
  background: none;
  color: var(--sage);
  font-family: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  &:hover { color: var(--text); }
}

.sync-enter-active,
.sync-leave-active {
  transition: opacity 0.2s ease;
  .sync-dialog { transition: transform 0.2s ease; }
}
.sync-enter-from,
.sync-leave-to {
  opacity: 0;
  .sync-dialog { transform: translateY(12px) scale(0.98); }
}
</style>
