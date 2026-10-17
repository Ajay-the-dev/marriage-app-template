<template>
  <Basic>
    <section class="m-trad">
      <!-- Top bar -->
      <header class="m-top">
        <router-link :to="backRoute" class="m-icon" aria-label="Back">
          <i class="fa-solid fa-arrow-left"></i>
        </router-link>
        <div class="m-title">
          <h1>Printed card</h1>
          <span v-if="config" class="m-status" :class="!cardId ? '' : isDirty ? 'warn' : 'ok'"><i class="m-dot"></i>{{ card.name || 'Untitled card' }} · {{ statusText }}</span>
        </div>
        <button v-show="!pdfView" type="button" class="m-icon" aria-label="Start this version again" :disabled="!config" @click="resetText">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <router-link :to="{ name: 'help-mobile', query: { topic: 'traditional' } }" class="m-icon" aria-label="Help">
          <i class="fa-regular fa-circle-question"></i>
        </router-link>
        <button type="button" class="m-icon" aria-label="Saved cards" :disabled="!config" @click="sheet = 'cards'">
          <i class="fa-solid fa-layer-group"></i>
        </button>
      </header>

      <div v-if="!config" class="m-loading">
        <p v-if="loadError">{{ loadError }}</p>
        <p v-else><i class="fa-solid fa-spinner fa-spin"></i> Loading invitation…</p>
      </div>

      <template v-else>
        <!-- Wording versions -->
        <!-- The uploaded PDF, shown in place of the card -->
        <div v-if="pdfView && ownPdf" class="m-pdf">
          <p class="m-hint"><i class="fa-solid fa-file-pdf"></i> {{ ownPdf.name || 'invitation.pdf' }} · guests see this on the home page</p>
          <iframe :src="ownPdf.url" :title="ownPdf.name || 'Invitation PDF'"></iframe>
        </div>

        <nav v-show="!pdfView" ref="versionPillsEl" class="m-versions" role="tablist" aria-label="Wording versions">
          <button
            v-for="v in CARD_VERSIONS"
            :key="v.id"
            type="button"
            role="tab"
            class="m-chip"
            :class="{ active: card.version === v.id }"
            :aria-selected="card.version === v.id"
            @mousedown.prevent
            @click="switchVersion(v.id)"
          >
            {{ v.label }}<span v-if="editedVersions.has(v.id)" class="m-edited" aria-label="edited"></span>
          </button>
        </nav>

        <div v-if="overflowing && !pdfView" class="m-banners">
          <div class="m-banner warn">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>The text doesn't fit inside the border. Shorten it or pick a larger paper.</span>
            <button type="button" class="m-link" @click="openDesign('paper')">Paper</button>
          </div>
        </div>

        <div v-show="!pdfView" ref="stage" class="m-stage">
          <PrintCard
            ref="printCard"
            :card="card"
            :card-style="cardStyle"
            :card-px="cardPx"
            :scale="scale"
            :exporting="exporting"
            @input="onInput"
            @paste="onPaste"
            @focus="onEditorFocus"
            @blur="onEditorBlur"
          />
        </div>
        <p v-show="!pdfView" class="m-hint"><i class="fa-solid fa-hand-pointer"></i> Tap the card to edit its text. Pinch to zoom in.</p>
      </template>

      <!-- Formatting, above the keyboard while editing -->
      <div v-if="editing" class="m-format" :style="{ bottom: `${keyboardOffset}px` }">
        <div v-if="panel === 'style'" class="m-format-panel">
          <button
            v-for="block in BLOCKS"
            :key="block.tag"
            type="button"
            class="m-chip"
            :class="{ active: state.block === block.tag }"
            @mousedown.prevent
            @click="setBlock(block.tag)"
          >{{ block.label }}</button>
        </div>
        <div v-else-if="panel === 'font'" class="m-format-panel">
          <button type="button" class="m-chip" :class="{ active: !currentFont }" @mousedown.prevent @click="applyFont(null)">Default</button>
          <template v-for="group in fontGroups" :key="group.name">
            <button
              v-for="font in group.fonts"
              :key="font.name + font.label"
              type="button"
              class="m-chip font"
              :class="{ active: isCurrentFont(font) }"
              :style="{ fontFamily: font.css }"
              @mousedown.prevent
              @click="applyFont(font)"
            >{{ font.sample || font.name }}</button>
          </template>
        </div>
        <div v-else-if="panel === 'colour'" class="m-format-panel">
          <button
            v-for="swatch in swatches"
            :key="swatch.name"
            type="button"
            class="m-chip"
            @mousedown.prevent
            @click="run('foreColor', swatch.value)"
          ><span class="m-swatch" :style="{ background: swatch.value }"></span>{{ swatch.name }}</button>
        </div>

        <div class="m-format-row" role="toolbar" aria-label="Text formatting">
          <button type="button" class="m-tool wide" :class="{ active: panel === 'style' }" @mousedown.prevent @click="togglePanel('style')">
            {{ blockLabel }} <i class="fa-solid fa-chevron-up"></i>
          </button>
          <button type="button" class="m-tool wide" :class="{ active: panel === 'font' }" @mousedown.prevent @click="togglePanel('font')">
            <span :style="{ fontFamily: currentFont?.css }">{{ currentFont?.name || 'Font' }}</span> <i class="fa-solid fa-chevron-up"></i>
          </button>
          <button type="button" class="m-tool" :class="{ active: state.bold }" aria-label="Bold" @mousedown.prevent @click="run('bold')"><i class="fa-solid fa-bold"></i></button>
          <button type="button" class="m-tool" :class="{ active: state.italic }" aria-label="Italic" @mousedown.prevent @click="run('italic')"><i class="fa-solid fa-italic"></i></button>
          <button type="button" class="m-tool" :class="{ active: state.underline }" aria-label="Underline" @mousedown.prevent @click="run('underline')"><i class="fa-solid fa-underline"></i></button>
          <button type="button" class="m-tool" :aria-label="`Align ${nextAlign.label}`" @mousedown.prevent @click="run(nextAlign.command)"><i class="fa-solid" :class="alignIcon"></i></button>
          <button type="button" class="m-tool" :class="{ active: panel === 'colour' }" aria-label="Colour" @mousedown.prevent @click="togglePanel('colour')"><i class="fa-solid fa-palette"></i></button>
          <button type="button" class="m-tool" aria-label="Insert ornament divider" @mousedown.prevent @click="run('insertHorizontalRule')"><i class="fa-solid fa-diamond"></i></button>
          <button type="button" class="m-tool" aria-label="Clear formatting" @mousedown.prevent @click="run('removeFormat')"><i class="fa-solid fa-text-slash"></i></button>
          <button type="button" class="m-tool" aria-label="Undo" @mousedown.prevent @click="run('undo')"><i class="fa-solid fa-rotate-left"></i></button>
          <button type="button" class="m-tool" aria-label="Redo" @mousedown.prevent @click="run('redo')"><i class="fa-solid fa-rotate-right"></i></button>
        </div>
        <button type="button" class="m-done" @click="stopEditing">Done</button>
      </div>

      <!-- Bottom bar -->
      <footer v-else-if="config && pdfView && ownPdf" class="m-bottom">
        <button type="button" class="m-btn" @click="hideOwnPdf">
          <i class="fa-solid fa-pen-ruler"></i> Design a card
        </button>
        <a class="m-btn primary" :href="ownPdf.url" target="_blank" rel="noopener">
          <i class="fa-solid fa-up-right-from-square"></i> Open PDF
        </a>
      </footer>
      <footer v-else-if="config" class="m-bottom">
        <button type="button" class="m-btn" @click="openDesign()">
          <i class="fa-solid fa-swatchbook"></i> Design
        </button>
        <button type="button" class="m-btn" :disabled="!canSave || saving || (!!cardId && !isDirty)" @click="saveCurrent()">
          <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          {{ saving ? 'Saving…' : cardId && !isDirty ? 'Saved' : 'Save' }}
        </button>
        <button type="button" class="m-btn primary" :disabled="exporting" @click="downloadPdf">
          <i class="fa-solid" :class="exporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'"></i> {{ exporting ? 'Preparing…' : 'PDF' }}
        </button>
      </footer>

      <!-- Messages -->
      <Transition name="m-toast">
        <div v-if="message && !editing" class="m-toast" :class="messageType" role="status">{{ message }}</div>
      </Transition>

      <!-- Design sheet -->
      <Transition name="m-sheet">
        <div v-if="sheet === 'design'" class="m-backdrop" @click.self="sheet = null">
          <div class="m-sheet" role="dialog" aria-modal="true" aria-label="Design">
            <div class="m-sheet-grip"></div>
            <div class="m-tabs" role="tablist">
              <button v-for="tab in DESIGN_TABS" :key="tab.id" type="button" role="tab" :class="{ active: designTab === tab.id }" :aria-selected="designTab === tab.id" @click="designTab = tab.id">
                {{ tab.label }}
              </button>
            </div>

            <div class="m-sheet-body">
              <div v-if="designTab === 'paper'" class="m-paper-grid">
                <button
                  v-for="p in PAPERS"
                  :key="p.id"
                  type="button"
                  class="m-option"
                  :class="{ active: card.paper === p.id }"
                  @click="card.paper = p.id"
                >
                  <span class="m-paper-icon" :style="{ aspectRatio: `${p.width} / ${p.height}` }"></span>
                  <strong>{{ p.label }}</strong>
                  <small>{{ p.width }} × {{ p.height }} mm</small>
                </button>
              </div>

              <div v-else-if="designTab === 'border'" class="m-choice-list">
                <button v-for="b in BORDERS" :key="b.id" type="button" class="m-sheet-item" :class="{ active: card.border === b.id }" @click="card.border = b.id">
                  <i class="fa-solid" :class="card.border === b.id ? 'fa-circle-check' : 'fa-circle'"></i>{{ b.label }}
                </button>
              </div>

              <div v-else-if="designTab === 'motif'" class="m-choice-list">
                <div class="m-size-pills" role="radiogroup" aria-label="Motif size">
                  <button
                    v-for="s in MOTIF_SIZES"
                    :key="s.id"
                    type="button"
                    role="radio"
                    :class="{ active: (card.motifSize || 'm') === s.id }"
                    :aria-checked="(card.motifSize || 'm') === s.id"
                    :disabled="card.motif === 'none'"
                    @click="card.motifSize = s.id"
                  >{{ s.label }}</button>
                </div>
                <button v-for="mo in MOTIFS" :key="mo.id" type="button" class="m-sheet-item" :class="{ active: card.motif === mo.id }" @click="card.motif = mo.id">
                  <i class="fa-solid" :class="card.motif === mo.id ? 'fa-circle-check' : 'fa-circle'"></i>{{ mo.label }}
                </button>
              </div>

              <div v-else class="m-theme-grid">
                <button
                  v-for="t in themes"
                  :key="t.id"
                  type="button"
                  class="m-option theme"
                  :class="{ active: theme.id === t.id }"
                  @click="card.theme = t.id"
                >
                  <span class="m-theme-dots">
                    <span :style="{ background: t.colors.cream }"></span>
                    <span :style="{ background: t.colors.gold }"></span>
                    <span :style="{ background: t.colors.dark }"></span>
                  </span>
                  <span class="m-theme-name" :style="{ fontFamily: t.fonts.display }">{{ t.name }}</span>
                </button>
              </div>
            </div>
            <button type="button" class="m-btn primary" @click="sheet = null">Done</button>
          </div>
        </div>
      </Transition>

      <!-- Saved cards sheet -->
      <Transition name="m-sheet">
        <div v-if="sheet === 'cards'" class="m-backdrop" @click.self="sheet = null">
          <div class="m-sheet" role="dialog" aria-modal="true" aria-label="Saved cards">
            <div class="m-sheet-grip"></div>
            <div class="m-sheet-head">
              <strong>Saved cards</strong>
              <small>Kept with the invitation. Only you can see them.</small>
            </div>
            <label class="m-field">
              <span>This card's name</span>
              <input v-model="card.name" type="text" maxlength="60" placeholder="eg. English, Malayalam" />
            </label>

            <div class="m-sheet-body">
              <div v-for="c in cards" :key="c.id" class="m-card-row" :class="{ active: c.id === cardId }">
                <button type="button" class="m-sheet-item" @click="openCard(c) && (sheet = null)">
                  <i class="fa-regular fa-file-lines"></i>
                  <span class="m-card-text">
                    <strong>{{ c.name || 'Untitled card' }}</strong>
                    <small v-if="c.updatedAt">Saved {{ formatDate(c.updatedAt) }}</small>
                  </span>
                  <i v-if="c.id === cardId" class="fa-solid fa-check m-current"></i>
                </button>
                <button type="button" class="m-icon small danger" :disabled="deletingId === c.id" :aria-label="`Delete ${c.name || 'card'}`" @click="removeCard(c)">
                  <i class="fa-solid" :class="deletingId === c.id ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
                </button>
              </div>
              <p v-if="!cards.length" class="m-empty">
                {{ weddingId ? 'No saved cards yet. Save this one to keep it with the invitation.' : 'Open this page from one of your invitations to save cards.' }}
              </p>
            </div>

            <p v-if="weddingId" class="m-empty">
              <i class="fa-solid" :class="canAddCard ? 'fa-layer-group' : 'fa-lock'"></i>
              {{ cards.length }} / {{ cardLimit }} cards saved{{ canAddCard ? '' : ` · ${limitText}` }}
            </p>
            <button type="button" class="m-sheet-item" :disabled="!!weddingId && !canAddCard" @click="newCard() && (sheet = null)">
              <i class="fa-solid fa-plus"></i>New card
            </button>
            <button type="button" class="m-sheet-item" :disabled="!canSave || saving || !cardId || !canAddCard" @click="saveCurrent(true); sheet = null">
              <i class="fa-regular fa-copy"></i>Save as copy
            </button>
            <template v-if="weddingId">
              <button v-if="ownPdf" type="button" class="m-sheet-item" :class="{ active: pdfView }" @click="showOwnPdf(); sheet = null">
                <i class="fa-solid fa-file-pdf"></i>Your PDF · {{ ownPdf.name || 'invitation.pdf' }}
              </button>
              <button type="button" class="m-sheet-item" :disabled="!canSave || uploadingPdf" @click="$refs.pdfInput.click()">
                <i class="fa-solid" :class="uploadingPdf ? 'fa-spinner fa-spin' : 'fa-file-arrow-up'"></i>{{ uploadingPdf ? 'Uploading…' : ownPdf ? 'Replace your PDF' : 'Upload your own PDF' }}
              </button>
              <button v-if="ownPdf" type="button" class="m-sheet-item" :disabled="!canSave || removingPdf || uploadingPdf" @click="removeOwnPdf(); sheet = null">
                <i class="fa-solid" :class="removingPdf ? 'fa-spinner fa-spin' : 'fa-trash'"></i>Remove your PDF
              </button>
              <input ref="pdfInput" type="file" accept="application/pdf" hidden @change="uploadOwnPdf" />
            </template>
            <router-link :to="{ name: 'traditional', query: { ...route.query, view: 'desktop' } }" class="m-sheet-item">
              <i class="fa-solid fa-display"></i>Desktop editor
            </router-link>
            <button type="button" class="m-btn" @click="sheet = null">Close</button>
          </div>
        </div>
      </Transition>
    </section>
  </Basic>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import Basic from "@/views/Basic.vue";
import PrintCard from "@/components/PrintCard.vue";
import { themes } from "@/config/themes";
import { CARD_VERSIONS } from "@/config/cardWording";
import { PAPERS, BORDERS, MOTIFS, MOTIF_SIZES } from "@/utils/traditionalCard";
import { BLOCKS, useTraditionalEditor } from "@/composables/traditionalEditor";

const DESIGN_TABS = [
  { id: "paper", label: "Paper" },
  { id: "border", label: "Border" },
  { id: "motif", label: "Motif" },
  { id: "theme", label: "Colours" },
];
const ALIGNS = [
  { value: "left", label: "left", command: "justifyLeft", icon: "fa-align-left" },
  { value: "center", label: "centre", command: "justifyCenter", icon: "fa-align-center" },
  { value: "right", label: "right", command: "justifyRight", icon: "fa-align-right" },
];

const route = useRoute();
const {
  weddingId, backRoute, config, loadError, card, message, messageType,
  theme, cardPx, cardStyle, swatches, stage, scale,
  printCard, editorEl, state, overflowing, onInput, onPaste, run, setBlock,
  fontGroups, currentFont, isCurrentFont, fontMenuUsed, applyFont,
  editedVersions, versionPillsEl, switchVersion, resetText,
  cards, cardId, saving, deletingId, isDirty, canSave, statusText, formatDate,
  cardLimit, canAddCard, limitText,
  ownPdf, uploadingPdf, uploadOwnPdf, pdfView, showOwnPdf, hideOwnPdf, removingPdf, removeOwnPdf,
  openCard, newCard, saveCurrent, removeCard,
  exporting, downloadPdf,
} = useTraditionalEditor({ back: { editor: "edit-wedding-mobile", list: "settings-mobile" } });

// 'design' | 'cards' | null
const sheet = ref(null);
const designTab = ref("paper");
const openDesign = (tab) => {
  if (tab) designTab.value = tab;
  sheet.value = "design";
};

// ── Editing ──
// The formatting bar shows while the card's text has focus, above the keyboard
const editing = ref(false);
// 'style' | 'font' | 'colour' | null: the chip row open above the tools
const panel = ref(null);
let blurTimer = null;

const onEditorFocus = () => {
  clearTimeout(blurTimer);
  editing.value = true;
};
// Tools keep the focus on the text; a short grace stops the bar flickering if it moves
const onEditorBlur = () => {
  blurTimer = setTimeout(() => {
    if (document.activeElement === editorEl.value) return;
    editing.value = false;
    panel.value = null;
  }, 150);
};
const stopEditing = () => editorEl.value?.blur();

const togglePanel = (name) => {
  panel.value = panel.value === name ? null : name;
  if (name === "font") fontMenuUsed.value = true;
};

const blockLabel = computed(() => BLOCKS.find((b) => b.tag === state.block)?.label || "Style");
const alignIndex = computed(() => Math.max(0, ALIGNS.findIndex((a) => a.value === state.align)));
const alignIcon = computed(() => ALIGNS[alignIndex.value].icon);
const nextAlign = computed(() => ALIGNS[(alignIndex.value + 1) % ALIGNS.length]);

// How far the on-screen keyboard covers the bottom of the page
const keyboardOffset = ref(0);
const onViewportChange = () => {
  const vv = window.visualViewport;
  keyboardOffset.value = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
};

onMounted(() => {
  window.visualViewport?.addEventListener("resize", onViewportChange);
  window.visualViewport?.addEventListener("scroll", onViewportChange);
  nextTick(onViewportChange);
});
onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener("resize", onViewportChange);
  window.visualViewport?.removeEventListener("scroll", onViewportChange);
  clearTimeout(blurTimer);
});
</script>

<style lang="scss" scoped>
/* Same gold & cream look as Settings2.vue */
.m-trad {
  --gold: #c9a96e;
  --gold-light: #e8d5a3;
  --gold-dark: #9a7a45;
  --cream: #fdf6ec;
  --dark: #1a1208;
  --blush: #f5e6d8;
  --sage: #8a9e8c;
  --bg: var(--cream);
  --surface: #ffffff;
  --subtle: var(--blush);
  --border: color-mix(in srgb, var(--gold-light) 45%, transparent);
  --border-strong: color-mix(in srgb, var(--gold-light) 80%, transparent);
  --text: #3d2c14;
  --muted: #8b7558;
  --faint: #bba98a;
  --accent: var(--gold-dark);
  --red: #b3261e;
  --red-soft: #fbe9e7;
  --amber: var(--gold-dark);
  --amber-soft: #fbf3e2;
  --green: var(--sage);
  --radius: 16px;
  --radius-sm: 10px;
  background: var(--bg);
  color: var(--text);
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: calc(150px + env(safe-area-inset-bottom));
  -webkit-tap-highlight-color: transparent;
}

/* ── Top bar ── */
.m-top {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px;
  padding-top: calc(6px + env(safe-area-inset-top));
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
}

.m-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0 4px;
  h1 { margin: 0; font-family: 'Cinzel Decorative', cursive; font-size: 1.05rem; font-weight: 700; color: var(--dark); }
}

.m-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 0.75rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  .m-dot { flex-shrink: 0; width: 6px; height: 6px; border-radius: 50%; background: var(--faint); }
  &.ok .m-dot { background: var(--green); }
  &.warn .m-dot { background: var(--amber); }
}

.m-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--muted);
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover, &:active { background: var(--subtle); color: var(--text); }
  &:disabled { opacity: 0.35; background: none; }
  &.small { width: 36px; height: 36px; font-size: 0.8rem; }
  &.danger:hover, &.danger:active { background: var(--red-soft); color: var(--red); }
}

.m-loading {
  padding: 96px 16px;
  text-align: center;
  color: var(--muted);
}

/* ── Versions ── */
.m-versions {
  position: sticky;
  top: calc(53px + env(safe-area-inset-top));
  z-index: 9;
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  overflow-x: auto;
  scrollbar-width: none;
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  &::-webkit-scrollbar { display: none; }
}

.m-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.82rem;
  white-space: nowrap;
  cursor: pointer;
  &.active { background: var(--gold-light); border-color: var(--gold-light); color: var(--dark); font-weight: 600; }
  &.font { font-size: 1rem; }
}

.m-edited {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gold-dark);
}

.m-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
}

/* ── Banners ── */
.m-banners { padding: 12px 16px 0; }

.m-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #ecd3a6;
  border-radius: var(--radius);
  background: var(--amber-soft);
  font-size: 0.8rem;
  color: #6b4e1f;
  span { flex: 1; }
  i { color: var(--accent); }
}

.m-link {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

/* ── Card ── */
.m-stage {
  display: flex;
  justify-content: center;
  margin: 16px 12px 0;
}

.m-pdf {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 12px 12px;

  iframe {
    flex: 1;
    width: 100%;
    min-height: 60vh;
    border: 0;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  }
}

.m-hint {
  margin: 12px 16px 0;
  font-size: 0.75rem;
  color: var(--muted);
  text-align: center;
  i { margin-right: 4px; color: var(--accent); }
}

/* ── Formatting bar ── */
.m-format {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 15;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  box-shadow: 0 -6px 20px rgba(61, 44, 20, 0.08);
  padding-bottom: env(safe-area-inset-bottom);
}

.m-format-panel {
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid var(--border);
  &::-webkit-scrollbar { display: none; }
}

.m-format-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 4px 6px 8px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.m-tool {
  flex-shrink: 0;
  min-width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  &.wide {
    max-width: 130px;
    border: 1px solid var(--border-strong);
    font-size: 0.82rem;
    span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    i { font-size: 0.6rem; color: var(--accent); }
  }
  &.active { background: var(--gold-light); color: var(--dark); }
}

.m-done {
  align-self: center;
  margin: 0 10px 0 4px;
  padding: 0 16px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: var(--dark);
  color: var(--cream);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

/* ── Bottom bar ── */
.m-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-top: 1px solid var(--border);
}

.m-btn {
  text-decoration: none;
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  &.primary { border: 0; background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%); color: var(--dark); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.m-toast {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(84px + env(safe-area-inset-bottom));
  z-index: 11;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--dark);
  color: var(--cream);
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(61, 44, 20, 0.25);
  &.error { background: #8c1d18; }
}

.m-toast-enter-active,
.m-toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.m-toast-enter-from,
.m-toast-leave-to { opacity: 0; transform: translateY(8px); }

/* ── Sheets ── */
.m-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(61, 44, 20, 0.4);
}

.m-sheet {
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: var(--surface);
  box-shadow: 0 -10px 30px rgba(61, 44, 20, 0.15);
  > .m-btn { flex-shrink: 0; margin-top: 8px; }
}

.m-sheet-grip {
  flex-shrink: 0;
  width: 36px;
  height: 4px;
  margin: 0 auto 8px;
  border-radius: 2px;
  background: var(--border-strong);
}

.m-sheet-head {
  display: flex;
  flex-direction: column;
  padding: 4px 8px 12px;
  strong { font-size: 1rem; color: var(--dark); }
  small { font-size: 0.75rem; color: var(--muted); }
}

.m-sheet-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0;
}

.m-sheet-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 48px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  i { width: 20px; text-align: center; color: var(--muted); }
  &:hover, &:active { background: var(--subtle); }
  &.active i { color: var(--accent); }
  &:disabled { opacity: 0.5; }
}

// Motif size, above the motif list
.m-size-pills {
  display: flex;
  gap: 6px;
  padding: 4px 8px 10px;

  button {
    flex: 1;
    min-height: 36px;
    border: 1px solid var(--line, color-mix(in srgb, var(--muted) 30%, transparent));
    border-radius: 999px;
    background: none;
    color: var(--text);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
    &.active { background: var(--accent); border-color: var(--accent); color: #fff; }
    &:disabled { opacity: 0.5; }
  }
}

.m-sheet-enter-active,
.m-sheet-leave-active {
  transition: opacity 0.2s;
  .m-sheet { transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
}
.m-sheet-enter-from,
.m-sheet-leave-to {
  opacity: 0;
  .m-sheet { transform: translateY(100%); }
}

.m-tabs {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 4px;
  margin-bottom: 8px;
  border-radius: 999px;
  background: var(--subtle);

  button {
    min-height: 36px;
    border: 0;
    border-radius: 999px;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    &.active { background: var(--surface); color: var(--dark); box-shadow: 0 1px 3px rgba(61, 44, 20, 0.12); }
  }
}

.m-paper-grid,
.m-theme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.m-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text);
  font: inherit;
  cursor: pointer;
  strong { font-size: 0.88rem; font-weight: 600; }
  small { font-size: 0.7rem; color: var(--muted); }
  &.active { border-color: var(--gold); background: var(--subtle); box-shadow: 0 0 0 1px var(--gold); }

  &.theme {
    flex-direction: row;
    justify-content: flex-start;
    gap: 10px;
    padding: 10px;
  }
}

.m-paper-icon {
  height: 34px;
  border: 1.5px solid var(--gold-dark);
  border-radius: 2px;
  background: var(--cream);
}

.m-theme-dots {
  display: inline-flex;
  flex-shrink: 0;
  span {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: 0 0 0 1.5px #fff;
    & + span { margin-left: -5px; }
  }
}

.m-theme-name {
  min-width: 0;
  font-size: 0.85rem;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.m-field {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px 8px;
  span { font-size: 0.75rem; color: var(--muted); }
  input {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: #fffdf9;
    color: var(--text);
    font: inherit;
    // 16px stops iOS zooming into the field
    font-size: 16px;
    &:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 3px color-mix(in srgb, var(--gold-light) 40%, transparent); }
  }
}

.m-card-row {
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  &.active { background: var(--subtle); }
  .m-sheet-item { flex: 1; min-width: 0; }
}

.m-card-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  strong { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { font-size: 0.72rem; color: var(--muted); }
}

.m-current { color: var(--accent) !important; }

.m-empty {
  margin: 4px 8px 8px;
  font-size: 0.8rem;
  color: var(--muted);
}
</style>
