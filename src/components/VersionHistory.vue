<template>
  <Transition name="vh">
    <div v-if="open" class="vh-backdrop" @click.self="close">
      <div class="vh-panel" role="dialog" aria-modal="true" aria-labelledby="vh-title">
        <div class="vh-grip"></div>
        <header class="vh-head">
          <div>
            <h2 id="vh-title">Version history</h2>
            <small>Your last {{ keep }} saves. Restoring puts a version in the editor; save to keep it.</small>
          </div>
          <button type="button" class="vh-icon" aria-label="Close" @click="close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div v-if="versions === null" class="vh-state">
          <template v-if="error">
            <p>{{ error }}</p>
            <button type="button" class="vh-btn" @click="load"><i class="fa-solid fa-rotate-right"></i> Retry</button>
          </template>
          <p v-else><i class="fa-solid fa-spinner fa-spin"></i> Loading versions…</p>
        </div>

        <div v-else-if="!versions.length" class="vh-state">
          <i class="fa-solid fa-clock-rotate-left vh-state-icon"></i>
          <p>No earlier versions yet. Each time you save, the version you replaced is kept here.</p>
        </div>

        <ol v-else class="vh-list">
          <li v-for="(v, i) in versions" :key="v.id" class="vh-item">
            <span class="vh-dot" :class="{ latest: i === 0 }"></span>
            <div class="vh-text">
              <strong>{{ formatDate(v.savedAt) }}</strong>
              <small>{{ summary(v.config) }}</small>
            </div>
            <div class="vh-actions">
              <button type="button" class="vh-btn primary" :disabled="readOnly" @click="restore(v)">Restore</button>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
import { listVersions } from "@/services/weddings";

// Lists a wedding's earlier saved versions (Plus); emits "restore" with the chosen config
const props = defineProps({
  open: Boolean,
  weddingId: { type: String, required: true },
  keep: { type: Number, default: 5 },
  readOnly: Boolean,
});
const emit = defineEmits(["update:open", "restore"]);

// null while loading
const versions = ref(null);
const error = ref("");

const load = async () => {
  versions.value = null;
  error.value = "";
  try {
    versions.value = await listVersions(props.weddingId);
  } catch (e) {
    error.value = `Could not load versions: ${e.message}`;
  }
};

const close = () => emit("update:open", false);
const onKey = (e) => e.key === "Escape" && close();

// Fresh list every time it opens, so the latest save shows up
watch(() => props.open, (open) => {
  if (open) {
    load();
    window.addEventListener("keydown", onKey);
  } else {
    window.removeEventListener("keydown", onKey);
  }
});
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

const formatDate = (date) =>
  date ? date.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Earlier save";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const summary = (config) => {
  const groom = config.groom?.shortName || config.groom?.name;
  const bride = config.bride?.shortName || config.bride?.name;
  const names = groom || bride ? `${groom || "Groom"} & ${bride || "Bride"}` : "No names";
  return [
    names,
    plural(config.eventsPage?.events?.length ?? 0, "event"),
    plural(config.momentsPage?.images?.length ?? 0, "photo"),
  ].join(" · ");
};

const restore = (v) => {
  emit("restore", { config: v.config, label: formatDate(v.savedAt) });
  close();
};
</script>

<style lang="scss" scoped>
/* Gold & cream, matching the editors */
.vh-backdrop {
  --gold-light: #e8d5a3;
  --gold-dark: #9a7a45;
  --cream: #fdf6ec;
  --dark: #1a1208;
  --text: #3d2c14;
  --blush: #f5e6d8;
  --sage: #8a9e8c;
  --muted: #8b7558;
  --border: color-mix(in srgb, var(--gold-light) 45%, transparent);
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(26, 18, 8, 0.45);
  font-family: 'Montserrat', sans-serif;
  color: var(--text);
}

.vh-panel {
  width: min(520px, 100%);
  max-height: min(640px, 100%);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--cream);
  box-shadow: 0 20px 48px rgba(26, 18, 8, 0.3);
  overflow: hidden;
}

.vh-grip { display: none; }

.vh-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 16px 14px 20px;
  border-bottom: 1px solid var(--border);
  > div { flex: 1; min-width: 0; }
  h2 { margin: 0 0 4px; font-family: 'Cinzel Decorative', cursive; font-size: 1.05rem; color: var(--dark); }
  small { font-size: 0.78rem; color: var(--muted); line-height: 1.4; }
}

.vh-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--muted);
  cursor: pointer;
  &:hover { background: var(--blush); color: var(--text); }
}

.vh-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 24px;
  text-align: center;
  color: var(--muted);
  font-size: 0.88rem;
  p { margin: 0; max-width: 320px; }
}

.vh-state-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--blush);
  color: var(--gold-dark);
  font-size: 1.3rem;
}

.vh-list {
  list-style: none;
  margin: 0;
  padding: 8px 12px 12px;
  overflow-y: auto;
}

.vh-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  & + & { border-top: 1px solid var(--border); }
}

.vh-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--gold-light);
  &.latest { border-color: var(--gold-dark); background: var(--gold-dark); }
}

.vh-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  strong { font-size: 0.9rem; font-weight: 600; color: var(--dark); }
  small { font-size: 0.78rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.vh-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.vh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  border-radius: 999px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  &:hover:not(:disabled) { background: var(--blush); }
  &.primary { border: 0; background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%); color: var(--dark); }
  &.primary:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(154, 122, 69, 0.35); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.vh-enter-active,
.vh-leave-active { transition: opacity 0.2s; .vh-panel { transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); } }
.vh-enter-from,
.vh-leave-to { opacity: 0; .vh-panel { transform: translateY(16px); } }

/* Bottom sheet on phones */
@media (max-width: 640px) {
  .vh-backdrop { align-items: flex-end; padding: 0; }
  .vh-panel {
    width: 100%;
    max-height: 85dvh;
    border-radius: 16px 16px 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }
  .vh-grip { display: block; width: 36px; height: 4px; margin: 8px auto 0; border-radius: 2px; background: var(--gold-light); }
  .vh-head { padding-top: 10px; }
  .vh-enter-from .vh-panel,
  .vh-leave-to .vh-panel { transform: translateY(100%); }
}
</style>
