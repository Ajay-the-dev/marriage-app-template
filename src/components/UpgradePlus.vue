<template>
  <Teleport to="body">
    <Transition name="upgrade">
      <div v-if="upgradeReason !== null" class="upgrade-backdrop" @click.self="closeUpgrade">
        <div class="upgrade-dialog" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
          <button class="close-btn" @click="closeUpgrade" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>

          <header class="upgrade-head">
            <span class="crown"><i class="fa-solid fa-crown"></i></span>
            <h2 id="upgrade-title">{{ isPlus ? "You're on Plus" : 'Upgrade to Plus' }}</h2>
            <p>{{ isPlus ? 'Thank you for your support! Everything below is now unlocked.' : intro }}</p>
          </header>

          <div class="compare" role="table" aria-label="Free and Plus compared">
            <div class="compare-row compare-head" role="row">
              <span role="columnheader"></span>
              <span role="columnheader">Free</span>
              <span role="columnheader" class="plus-col">Plus</span>
            </div>
            <div
              v-for="row in rows"
              :key="row.key"
              class="compare-row"
              :class="{ highlight: row.key === upgradeReason }"
              role="row"
            >
              <span class="feature" role="cell"><i class="fa-solid" :class="row.icon"></i>{{ row.label }}</span>
              <span role="cell" class="free-val" v-html="format(PLANS.free[row.key], row)"></span>
              <span role="cell" class="plus-col plus-val" v-html="format(PLANS.plus[row.key], row)"></span>
            </div>
          </div>

          <template v-if="isPlus">
            <button class="upgrade-cta" @click="closeUpgrade">
              <i class="fa-solid fa-check"></i> Done
            </button>
          </template>
          <template v-else>
            <ol class="steps">
              <li>
                <span>Copy your Plus code</span>
                <span class="code-box">
                  <code>{{ code }}</code>
                  <button type="button" @click="copyCode" :title="copied ? 'Copied' : 'Copy code'">
                    <i class="fa-solid" :class="copied ? 'fa-check' : 'fa-copy'"></i>
                  </button>
                </span>
              </li>
              <li>Donate {{ PLUS_PRICE ? `${PLUS_PRICE} or more` : '' }} on Ko-fi and <strong>paste the code in your message</strong></li>
              <li>Plus unlocks automatically within a minute. This window updates by itself.</li>
            </ol>

            <a v-if="KOFI_URL" class="upgrade-cta" :href="KOFI_URL" target="_blank" rel="noopener" @click="copyCode">
              <i class="fa-solid fa-mug-hot"></i> Support on Ko-fi
            </a>
            <p v-else class="setup-note">Ko-fi isn't set up yet (VITE_KOFI_URL).</p>
            <button class="later-btn" @click="closeUpgrade">Maybe later</button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { PLANS, KOFI_URL, PLUS_PRICE, plusCode } from "@/config/plans";
import { upgradeReason, closeUpgrade } from "@/composables/upgrade";
import { useMyPlan } from "@/composables/plan";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const myPlan = useMyPlan();
const isPlus = computed(() => myPlan.value === "plus");

const rows = [
  { key: "invitations", label: "Invitations", icon: "fa-envelope-open-text" },
  { key: "visitors", label: "Unique visitors", icon: "fa-eye" },
  { key: "uploads", label: "Image uploads per invitation", icon: "fa-cloud-arrow-up" },
  { key: "events", label: "Events", icon: "fa-calendar-days" },
  { key: "milestones", label: "Story milestones", icon: "fa-timeline" },
  { key: "gallery", label: "Gallery images", icon: "fa-images" },
  { key: "saveTheDate", label: "Save-the-date images", icon: "fa-heart" },
  { key: "editNavigation", label: "Custom navigation", icon: "fa-compass" },
  { key: "hideBadge", label: "Remove “crafted by” badge", icon: "fa-signature" },
];

// Why the dialog was opened, shown as the intro line
const reasons = {
  invitations: "You've reached the invitation limit on Free.",
  visitors: "Keep your guest link open for every guest, with no visitor cap.",
  uploads: "You've used all the image uploads for this invitation.",
  events: "Add more events to your invitation.",
  milestones: "Tell more of your story.",
  gallery: "Share more of your moments.",
  saveTheDate: "Add more save-the-date photos.",
  editNavigation: "Make the menu your own with custom labels and icons.",
  hideBadge: "Remove the badge for a cleaner invitation.",
};
const intro = computed(() => reasons[upgradeReason.value] || "Get more room for photos, events and guests.");

const format = (value, row) => {
  if (typeof value === "boolean") {
    return value ? '<i class="fa-solid fa-check yes"></i>' : '<i class="fa-solid fa-xmark no"></i>';
  }
  return value === Infinity ? "Unlimited" : String(value);
};

const code = computed(() => (auth.user ? plusCode(auth.user.uid) : ""));
const copied = ref(false);
// Also runs when opening Ko-fi, so the code is ready to paste
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch { /* the code is visible to copy by hand */ }
};

const onKey = (e) => {
  if (e.key === "Escape") closeUpgrade();
};
watch(upgradeReason, (reason) => {
  if (reason !== null) window.addEventListener("keydown", onKey);
  else window.removeEventListener("keydown", onKey);
});
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style lang="scss" scoped>
.upgrade-backdrop {
  --gold: #c9a96e;
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

.upgrade-dialog {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 28px 24px 20px;
  border-radius: 20px;
  background: var(--cream);
  color: var(--text);
  font-family: 'Montserrat', sans-serif;
  box-shadow: 0 24px 60px rgba(26, 18, 8, 0.3);
  text-align: center;
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

.upgrade-head {
  .crown {
    display: inline-grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
    color: var(--dark);
    font-size: 1.4rem;
    box-shadow: 0 6px 18px rgba(154, 122, 69, 0.35);
  }

  h2 {
    margin: 14px 0 6px;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 1.35rem;
    color: var(--dark);
  }

  p {
    margin: 0 0 18px;
    font-size: 0.85rem;
    color: var(--gold-dark);
  }
}

.compare {
  border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  text-align: left;
}

.compare-row {
  display: grid;
  grid-template-columns: 1fr 64px 84px;
  align-items: center;
  font-size: 0.78rem;

  > span { padding: 9px 10px; }
  > span:not(.feature) { text-align: center; }

  & + & { border-top: 1px solid color-mix(in srgb, var(--gold-light) 30%, transparent); }

  &.highlight {
    background: #fdf0d5;
    .feature { font-weight: 600; color: var(--dark); }
  }
}

.compare-head {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--sage);
}

.feature {
  display: flex;
  align-items: center;
  gap: 8px;
  i { width: 16px; color: var(--gold-dark); text-align: center; }
}

.plus-col {
  align-self: stretch;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--gold-light) 25%, transparent);
}

.compare-head .plus-col { color: var(--gold-dark); font-weight: 600; }
.free-val { color: var(--sage); }
.plus-val { font-weight: 600; color: var(--dark); }

:deep(.yes) { color: var(--gold-dark); }
:deep(.no) { color: #c4b8a8; }

.steps {
  margin: 18px 0 0;
  padding: 0 0 0 20px;
  text-align: left;
  font-size: 0.8rem;
  line-height: 1.5;

  li + li { margin-top: 8px; }
  li::marker { color: var(--gold-dark); font-weight: 600; }
  strong { color: var(--dark); }
}

.code-box {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding: 4px 4px 4px 10px;
  border: 1px dashed var(--gold);
  border-radius: 10px;
  background: #fff;

  code {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 0.72rem;
    color: var(--dark);
  }

  button {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 8px;
    background: var(--blush);
    color: var(--gold-dark);
    cursor: pointer;
    &:hover { background: var(--gold-light); }
  }
}

.setup-note {
  margin: 16px 0 0;
  font-size: 0.75rem;
  color: #b3261e;
}

.upgrade-cta {
  width: 100%;
  border: none;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding: 12px 18px;
  border-radius: 30px;
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  color: var(--dark);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  transition: box-shadow 0.2s ease;
  &:hover { box-shadow: 0 6px 18px rgba(154, 122, 69, 0.4); }
  i { font-size: 1.1rem; }
}

.later-btn {
  margin-top: 8px;
  padding: 8px 14px;
  border: none;
  background: none;
  color: var(--sage);
  font-size: 0.78rem;
  cursor: pointer;
  &:hover { color: var(--text); }
}

.upgrade-enter-active,
.upgrade-leave-active {
  transition: opacity 0.2s ease;
  .upgrade-dialog { transition: transform 0.2s ease; }
}
.upgrade-enter-from,
.upgrade-leave-to {
  opacity: 0;
  .upgrade-dialog { transform: translateY(12px) scale(0.98); }
}
</style>
