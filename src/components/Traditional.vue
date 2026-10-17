<template>
  <Basic>
    <section class="traditional-section">
      <header class="t-toolbar">
        <div class="toolbar-inner">
          <div class="toolbar-title">
            <router-link :to="backRoute" class="back-link" title="Back">
              <i class="fa-solid fa-arrow-left"></i>
            </router-link>
            <div>
              <h1>Printed invitation</h1>
              <small v-if="config">{{ coupleNames }}</small>
            </div>
          </div>
          <div class="toolbar-actions">
            <router-link :to="{ name: 'help', query: { topic: 'traditional' } }" class="btn-ghost" title="How to make the traditional PDF">
              <i class="fa-regular fa-circle-question"></i><span>Help</span>
            </router-link>
            <template v-if="pdfView && ownPdf">
              <span class="save-status">Your PDF is on the home page</span>
              <button class="btn-ghost" type="button" @click="hideOwnPdf" title="Back to designing a card">
                <i class="fa-solid fa-pen-ruler"></i><span>Design a card</span>
              </button>
              <button class="btn-ghost" type="button" :disabled="!canSave || removingPdf" @click="removeOwnPdf" title="Take the PDF off the home page">
                <i class="fa-solid" :class="removingPdf ? 'fa-spinner fa-spin' : 'fa-trash'"></i><span>Remove PDF</span>
              </button>
              <a class="btn-primary" :href="ownPdf.url" target="_blank" rel="noopener">
                <i class="fa-solid fa-up-right-from-square"></i><span>Open PDF</span>
              </a>
            </template>
            <template v-else>
            <span v-if="config" class="save-status" :class="{ dirty: isDirty || !cardId }">{{ statusText }}</span>
            <button class="btn-ghost" type="button" @click="resetText" :disabled="!config" title="Start this version again from the invitation's details">
              <i class="fa-solid fa-rotate-left"></i><span>Reset text</span>
            </button>
            <button class="btn-ghost" type="button" @click="saveCurrent()" :disabled="!canSave || saving || (!!cardId && !isDirty)" :title="saveHint">
              <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i><span>{{ saving ? 'Saving…' : 'Save' }}</span>
            </button>
            <button class="btn-primary" type="button" @click="downloadPdf" :disabled="!config || exporting">
              <i class="fa-solid" :class="exporting ? 'fa-spinner fa-spin' : 'fa-file-pdf'"></i>
              <span>{{ exporting ? 'Preparing…' : 'Download PDF' }}</span>
            </button>
            </template>
          </div>
        </div>
      </header>

      <div v-if="!config" class="t-state">
        <p v-if="loadError">{{ loadError }}</p>
        <p v-else><i class="fa-solid fa-spinner fa-spin"></i> Loading invitation…</p>
      </div>

      <div v-else class="t-body">
        <p v-if="message" class="message" :class="messageType">{{ message }}</p>

        <div class="t-layout">
          <!-- ── Editor ── -->
          <div class="t-editor">
            <!-- The uploaded PDF, shown in place of the card -->
            <div v-if="pdfView && ownPdf" class="pdf-preview">
              <div class="pdf-preview-bar">
                <i class="fa-solid fa-file-pdf"></i>
                <strong>{{ ownPdf.name || 'invitation.pdf' }}</strong>
                <span>Guests see this on the home page</span>
              </div>
              <iframe :src="ownPdf.url" :title="ownPdf.name || 'Invitation PDF'"></iframe>
              <p class="editor-hint">
                <i class="fa-solid fa-circle-info"></i> Not showing? <a :href="ownPdf.url" target="_blank" rel="noopener">Open the PDF in a new tab</a>.
              </p>
            </div>

            <div v-show="!pdfView" class="format-bar" role="toolbar" aria-label="Text formatting">
              <div class="version-row">
                <span class="version-label">Versions</span>
                <div ref="versionPillsEl" class="version-pills" role="tablist" aria-label="Wording versions">
                  <button
                    v-for="v in CARD_VERSIONS"
                    :key="v.id"
                    type="button"
                    role="tab"
                    class="version-pill"
                    :class="{ active: card.version === v.id }"
                    :aria-selected="card.version === v.id"
                    :title="editedVersions.has(v.id) ? `${v.label} (edited)` : v.label"
                    @click="switchVersion(v.id)"
                  >
                    {{ v.label }}<span v-if="editedVersions.has(v.id)" class="edited-dot" aria-hidden="true"></span>
                  </button>
                </div>
              </div>
              <div class="format-group">
                <button
                  v-for="block in BLOCKS"
                  :key="block.tag"
                  type="button"
                  class="fmt-btn text-btn"
                  :class="{ active: state.block === block.tag }"
                  :title="block.hint"
                  @mousedown.prevent="setBlock(block.tag)"
                >{{ block.label }}</button>
              </div>
              <div ref="fontMenuEl" class="format-group font-menu">
                <button
                  type="button"
                  class="fmt-btn font-toggle"
                  :class="{ active: fontMenuOpen }"
                  title="Font of the selected text (or the current line)"
                  aria-haspopup="listbox"
                  :aria-expanded="fontMenuOpen"
                  @mousedown.prevent="toggleFontMenu"
                >
                  <span :style="{ fontFamily: currentFont?.css }">{{ currentFont?.name || "Font" }}</span>
                  <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div v-if="fontMenuOpen" class="font-options" role="listbox" aria-label="Fonts">
                  <button type="button" class="font-option" :class="{ active: !currentFont }" @mousedown.prevent="applyFont(null)">
                    <span>Default</span><small>Follows the text style</small>
                  </button>
                  <template v-for="group in fontGroups" :key="group.name">
                    <span class="font-group-label">{{ group.name }}</span>
                    <button
                      v-for="font in group.fonts"
                      :key="font.name + font.label"
                      type="button"
                      class="font-option"
                      :class="{ active: currentFont && fontFamilyName(currentFont.css) === fontFamilyName(font.css) }"
                      @mousedown.prevent="applyFont(font)"
                    >
                      <span :style="{ fontFamily: font.css }">{{ font.sample || font.name }}</span>
                      <small v-if="font.label">{{ font.label }}</small>
                    </button>
                  </template>
                </div>
              </div>
              <div class="format-group">
                <button type="button" class="fmt-btn" :class="{ active: state.bold }" title="Bold" @mousedown.prevent="run('bold')"><i class="fa-solid fa-bold"></i></button>
                <button type="button" class="fmt-btn" :class="{ active: state.italic }" title="Italic" @mousedown.prevent="run('italic')"><i class="fa-solid fa-italic"></i></button>
                <button type="button" class="fmt-btn" :class="{ active: state.underline }" title="Underline" @mousedown.prevent="run('underline')"><i class="fa-solid fa-underline"></i></button>
              </div>
              <div class="format-group">
                <button type="button" class="fmt-btn" :class="{ active: state.align === 'left' }" title="Align left" @mousedown.prevent="run('justifyLeft')"><i class="fa-solid fa-align-left"></i></button>
                <button type="button" class="fmt-btn" :class="{ active: state.align === 'center' }" title="Centre" @mousedown.prevent="run('justifyCenter')"><i class="fa-solid fa-align-center"></i></button>
                <button type="button" class="fmt-btn" :class="{ active: state.align === 'right' }" title="Align right" @mousedown.prevent="run('justifyRight')"><i class="fa-solid fa-align-right"></i></button>
              </div>
              <div class="format-group">
                <button
                  v-for="swatch in swatches"
                  :key="swatch.name"
                  type="button"
                  class="fmt-btn swatch"
                  :title="`${swatch.name} colour`"
                  @mousedown.prevent="run('foreColor', swatch.value)"
                ><span :style="{ background: swatch.value }"></span></button>
              </div>
              <div class="format-group">
                <button type="button" class="fmt-btn" title="Insert ornament divider" @mousedown.prevent="run('insertHorizontalRule')"><i class="fa-solid fa-diamond"></i></button>
                <button type="button" class="fmt-btn" title="Clear formatting" @mousedown.prevent="run('removeFormat')"><i class="fa-solid fa-text-slash"></i></button>
                <button type="button" class="fmt-btn" title="Undo" @mousedown.prevent="run('undo')"><i class="fa-solid fa-rotate-left"></i></button>
                <button type="button" class="fmt-btn" title="Redo" @mousedown.prevent="run('redo')"><i class="fa-solid fa-rotate-right"></i></button>
              </div>
            </div>

            <p v-show="!pdfView" class="editor-hint">
              <i class="fa-solid fa-pen-nib"></i> Click on the card to edit its text.
            </p>
            <p v-if="overflowing && !pdfView" class="overflow-warning">
              <i class="fa-solid fa-triangle-exclamation"></i> The text doesn't fit inside the border. Shorten it, use smaller styles or pick a larger paper.
            </p>

            <div v-show="!pdfView" ref="stage" class="card-stage">
              <PrintCard ref="printCard" :card="card" :card-style="cardStyle" :card-px="cardPx" :scale="scale" :exporting="exporting" @input="onInput" @paste="onPaste" @focus="updateState" />
            </div>
          </div>

          <!-- ── Design ── -->
          <aside class="t-design">
            <div class="panel">
              <h2>Saved cards</h2>
              <label v-show="!pdfView" class="field">
                <span>Card name</span>
                <input v-model="card.name" type="text" maxlength="60" placeholder="eg. English, Malayalam" />
              </label>
              <ul v-if="cards.length" class="card-list">
                <li v-for="c in cards" :key="c.id" :class="{ active: c.id === cardId }">
                  <button type="button" class="card-item" @click="openCard(c)">
                    <i class="fa-regular fa-file-lines"></i>
                    <span>
                      <strong>{{ c.name || 'Untitled card' }}</strong>
                      <small v-if="c.updatedAt">Saved {{ formatDate(c.updatedAt) }}</small>
                    </span>
                  </button>
                  <button type="button" class="card-delete" :disabled="deletingId === c.id" title="Delete this card" @click="removeCard(c)">
                    <i class="fa-solid" :class="deletingId === c.id ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
                  </button>
                </li>
              </ul>
              <p v-else class="card-empty">{{ weddingId ? 'No saved cards yet. Save this one to keep it with the invitation.' : 'Open this page from one of your invitations to save cards.' }}</p>
              <p v-if="weddingId" class="card-limit" :class="{ full: !canAddCard }">
                <i class="fa-solid" :class="canAddCard ? 'fa-layer-group' : 'fa-lock'"></i>
                {{ cards.length }} / {{ cardLimit }} cards saved{{ canAddCard ? '' : ' · limit reached' }}
              </p>
              <div class="pill-row">
                <button type="button" class="pill" :disabled="!!weddingId && !canAddCard" :title="weddingId && !canAddCard ? limitText : 'Start a new card'" @click="newCard"><i class="fa-solid fa-plus"></i> New card</button>
                <button type="button" class="pill" :disabled="!canSave || saving || !cardId || !canAddCard" :title="canAddCard ? 'Save as a separate card, eg. for another language' : limitText" @click="saveCurrent(true)">
                  <i class="fa-regular fa-copy"></i> Save as copy
                </button>
              </div>
            </div>

            <div v-if="weddingId" class="panel">
              <h2>Your own PDF</h2>
              <p class="card-empty">Already have an invitation PDF? Upload it to show guests on the home page instead of a designed card (up to 10 MB, counts as one upload).</p>
              <a v-if="ownPdf" :href="ownPdf.url" target="_blank" rel="noopener" class="own-pdf">
                <i class="fa-solid fa-file-pdf"></i>
                <span><strong>{{ ownPdf.name || 'invitation.pdf' }}</strong><small>Shown on the home page</small></span>
              </a>
              <div v-if="ownPdf && !pdfView" class="pill-row own-pdf-view">
                <button type="button" class="pill" @click="showOwnPdf"><i class="fa-regular fa-eye"></i> Preview PDF</button>
              </div>
              <div class="pill-row">
                <button type="button" class="pill" :disabled="!canSave || uploadingPdf" :title="canSave ? '' : saveHint" @click="$refs.pdfInput.click()">
                  <i class="fa-solid" :class="uploadingPdf ? 'fa-spinner fa-spin' : 'fa-file-arrow-up'"></i>
                  {{ uploadingPdf ? 'Uploading…' : ownPdf ? 'Replace PDF' : 'Upload PDF' }}
                </button>
                <button v-if="ownPdf" type="button" class="pill danger" :disabled="!canSave || removingPdf || uploadingPdf" @click="removeOwnPdf">
                  <i class="fa-solid" :class="removingPdf ? 'fa-spinner fa-spin' : 'fa-trash'"></i> Remove PDF
                </button>
              </div>
              <input ref="pdfInput" type="file" accept="application/pdf" hidden @change="uploadOwnPdf" />
            </div>

            <div v-show="!pdfView" class="panel">
              <h2>Paper</h2>
              <div class="choice-grid">
                <button
                  v-for="paper in PAPERS"
                  :key="paper.id"
                  type="button"
                  class="choice"
                  :class="{ active: card.paper === paper.id }"
                  @click="card.paper = paper.id"
                >
                  <span class="paper-icon" :style="{ aspectRatio: `${paper.width} / ${paper.height}` }"></span>
                  <span>{{ paper.label }}</span>
                  <small>{{ paper.width }} × {{ paper.height }} mm</small>
                </button>
              </div>
            </div>

            <div v-show="!pdfView" class="panel">
              <h2>Border</h2>
              <div class="pill-row">
                <button v-for="border in BORDERS" :key="border.id" type="button" class="pill" :class="{ active: card.border === border.id }" @click="card.border = border.id">
                  {{ border.label }}
                </button>
              </div>
            </div>

            <div v-show="!pdfView" class="panel">
              <div class="motif-head" :class="{ off: card.motif === 'none' }">
                <h2><i class="fa-solid fa-spa"></i> Motif</h2>
                <div class="size-seg" role="radiogroup" aria-label="Motif size">
                  <button
                    v-for="s in MOTIF_SIZES"
                    :key="s.id"
                    type="button"
                    role="radio"
                    :class="{ active: (card.motifSize || 'm') === s.id }"
                    :aria-checked="(card.motifSize || 'm') === s.id"
                    :aria-label="s.label"
                    :title="s.label"
                    :disabled="card.motif === 'none'"
                    @click="card.motifSize = s.id"
                  >
                    <span class="size-dot" :style="{ '--s': s.scale }"></span>{{ s.short }}
                  </button>
                </div>
              </div>
              <div class="pill-row">
                <button v-for="motif in MOTIFS" :key="motif.id" type="button" class="pill" :class="{ active: card.motif === motif.id }" @click="card.motif = motif.id">
                  {{ motif.label }}
                </button>
              </div>
            </div>

            <div v-show="!pdfView" class="panel">
              <h2>Colours &amp; fonts</h2>
              <div class="theme-list">
                <button
                  v-for="t in themes"
                  :key="t.id"
                  type="button"
                  class="theme-chip"
                  :class="{ active: theme.id === t.id }"
                  :title="t.description"
                  @click="card.theme = t.id"
                >
                  <span class="theme-dots">
                    <span :style="{ background: t.colors.cream }"></span>
                    <span :style="{ background: t.colors.gold }"></span>
                    <span :style="{ background: t.colors.dark }"></span>
                  </span>
                  <span class="theme-name" :style="{ fontFamily: t.fonts.display }">{{ t.name }}</span>
                </button>
              </div>
            </div>

            <p class="panel-note">
              <i class="fa-solid fa-circle-info"></i>
              Cards are saved with the invitation as HTML, so you can come back and download the PDF again anytime. Only you can see them. The PDF is print-ready at 300 dpi.
            </p>
          </aside>
        </div>
      </div>
    </section>
  </Basic>
</template>

<script setup>
import Basic from "@/views/Basic.vue";
import PrintCard from "@/components/PrintCard.vue";
import { themes } from "@/config/themes";
import { CARD_VERSIONS } from "@/config/cardWording";
import { PAPERS, BORDERS, MOTIFS, MOTIF_SIZES, fontFamilyName } from "@/utils/traditionalCard";
import { BLOCKS, useTraditionalEditor } from "@/composables/traditionalEditor";

const {
  weddingId, backRoute, config, loadError, coupleNames, card, message, messageType,
  theme, cardPx, cardStyle, swatches, stage, scale,
  printCard, state, overflowing, onInput, onPaste, updateState, run, setBlock,
  fontGroups, currentFont, fontMenuEl, fontMenuOpen, toggleFontMenu, applyFont,
  editedVersions, versionPillsEl, switchVersion, resetText,
  cards, cardId, saving, deletingId, isDirty, canSave, saveHint, statusText, formatDate,
  cardLimit, canAddCard, limitText,
  ownPdf, uploadingPdf, uploadOwnPdf, pdfView, showOwnPdf, hideOwnPdf, removingPdf, removeOwnPdf,
  openCard, newCard, saveCurrent, removeCard,
  exporting, downloadPdf,
} = useTraditionalEditor();
</script>

<style lang="scss" scoped>
.traditional-section {
  --gold: #c9a96e;
  --gold-light: #e8d5a3;
  --gold-dark: #9a7a45;
  --cream: #fdf6ec;
  --dark: #1a1208;
  --text: #3d2c14;
  --blush: #f5e6d8;
  --sage: #8a9e8c;
  background-color: var(--cream);
  color: var(--text);
  font-family: 'Montserrat', sans-serif;
  min-height: 100vh;
  padding-bottom: 80px;
}

/* ── Toolbar ── */
.t-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
}

.toolbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 14px;

  h1 {
    font-family: 'Cinzel Decorative', cursive;
    font-size: 1.3rem;
    color: var(--dark);
    margin: 0;
  }

  small { display: block; font-size: 0.72rem; color: var(--sage); }
}

.back-link {
  color: var(--gold-dark);
  font-size: 1rem;
  text-decoration: none;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.save-status {
  font-size: 0.72rem;
  color: var(--sage);
  &.dirty { color: var(--gold-dark); }
}

.btn-ghost,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 30px;
  padding: 7px 14px;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.btn-ghost {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  color: var(--text);
  &:hover:not(:disabled) { background: var(--blush); }
}

.btn-primary {
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  border: none;
  color: var(--dark);
  &:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(154, 122, 69, 0.35); }
}

/* ── Body ── */
.t-state {
  display: flex;
  justify-content: center;
  padding: 80px 16px;
  text-align: center;
}

.t-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
}

.message {
  margin: 0 0 16px;
  font-size: 0.8rem;
  &.ok { color: var(--sage); }
  &.warn { color: var(--gold-dark); }
  &.error { color: #b3261e; }
}

.t-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
}

/* ── Formatting bar ── */
.format-bar {
  position: sticky;
  top: 72px;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(61, 44, 20, 0.05);
}

.version-row {
  flex: 1 0 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 0 0 8px;
  margin-bottom: 2px;
  border-bottom: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);
}

.version-label {
  flex-shrink: 0;
  padding-left: 6px;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--sage);
}

.version-pills {
  display: flex;
  gap: 6px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  padding: 2px;
  // Fade the edge so it's clear there are more to scroll to
  mask-image: linear-gradient(90deg, #000 calc(100% - 28px), transparent);
}

.version-pill {
  position: relative;
  flex-shrink: 0;
  padding: 5px 14px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  border-radius: 30px;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.74rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover { background: var(--blush); }
  &.active { background: var(--gold-light); border-color: var(--gold-light); color: var(--dark); font-weight: 500; }
}

.edited-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: 6px;
  vertical-align: middle;
  border-radius: 50%;
  background: var(--gold-dark);
}

.format-group {
  display: flex;
  gap: 2px;
  padding-right: 6px;
  border-right: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);

  &:last-child { border-right: 0; padding-right: 0; }
}

.fmt-btn {
  display: inline-grid;
  place-items: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover { background: var(--blush); }
  &.active { background: var(--gold-light); color: var(--dark); }

  &.text-btn { font-size: 0.72rem; font-weight: 500; letter-spacing: 0.3px; }

  &.swatch span {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
  }
}

/* ── Font menu ── */
.font-menu { position: relative; }

.font-toggle {
  display: inline-flex;
  gap: 8px;
  width: 150px;
  justify-content: space-between;
  border: 1px solid color-mix(in srgb, var(--gold-light) 70%, transparent);

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.85rem;
  }

  i { font-size: 0.6rem; color: var(--gold-dark); }
}

.font-options {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: 260px;
  max-height: 360px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 6px;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(154, 122, 69, 0.18);
}

.font-group-label {
  padding: 10px 10px 4px;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--sage);
}

.font-option {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--text);
  text-align: left;
  cursor: pointer;

  span { font-size: 1.05rem; line-height: 1.3; }
  small { flex-shrink: 0; font-family: 'Montserrat', sans-serif; font-size: 0.65rem; color: var(--sage); }

  &:hover { background: var(--blush); }
  &.active { background: var(--gold-light); color: var(--dark); }
}

.editor-hint,
.overflow-warning {
  margin: 12px 4px 0;
  font-size: 0.75rem;
  color: var(--sage);
  i { color: var(--gold-dark); margin-right: 4px; }
}

.overflow-warning {
  color: #8c1d18;
  i { color: #b3261e; }
}

/* ── Card stage ── */
.card-stage {
  margin-top: 16px;
  padding: 24px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--gold-light) 70%, transparent) 1px, transparent 0) 0 0 / 18px 18px,
    var(--blush);
  display: flex;
  justify-content: center;
}


/* ── Design panel ── */
.t-design {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel {
  padding: 16px;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 35%, transparent);
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(61, 44, 20, 0.05);

  h2 {
    margin: 0 0 12px;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--dark);
  }
}

// Motif title bar: the heading and its size control as one strip along the panel's top
.motif-head {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  margin: -16px -16px 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--gold-light) 45%, transparent);
  border-radius: 16px 16px 0 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--gold-light) 22%, #fff), #fff 70%);
  overflow: hidden;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding: 12px 16px;

    i { font-size: 0.8rem; color: var(--gold-dark); }
  }

  &.off .size-seg { opacity: 0.45; }
}

// Sizes as one joined control; each dot grows with its size
.size-seg {
  display: flex;
  border-left: 1px solid color-mix(in srgb, var(--gold-light) 45%, transparent);

  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    min-width: 36px;
    padding: 6px 6px 5px;
    border: 0;
    background: none;
    color: var(--text);
    font: inherit;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    cursor: pointer;
    position: relative;
    transition: background-color 0.15s, color 0.15s;

    & + button { border-left: 1px solid color-mix(in srgb, var(--gold-light) 30%, transparent); }
    &:hover:not(:disabled) { background: color-mix(in srgb, var(--gold-light) 25%, transparent); }
    &:disabled { cursor: not-allowed; }

    // Underline marks the picked size, sitting on the strip's bottom edge
    &::after {
      content: "";
      position: absolute;
      left: 6px;
      right: 6px;
      bottom: 0;
      height: 2px;
      border-radius: 2px 2px 0 0;
      background: var(--gold-dark);
      transform: scaleX(0);
      transition: transform 0.2s ease;
    }

    &.active {
      background: color-mix(in srgb, var(--gold-light) 40%, transparent);
      color: var(--dark);
      &::after { transform: scaleX(1); }
      .size-dot { background: var(--gold-dark); border-color: var(--gold-dark); }
    }
  }
}

.size-dot {
  width: calc(14px * var(--s));
  height: calc(14px * var(--s));
  border: 1.5px solid var(--gold);
  border-radius: 50%;
  background: color-mix(in srgb, var(--gold-light) 50%, transparent);
  transition: background-color 0.15s, border-color 0.15s;
}

/* ── Your own PDF ── */
.pdf-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;

  iframe {
    width: 100%;
    height: min(78vh, 900px);
    border: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 18px 50px rgba(61, 44, 20, 0.12);
  }

  a { color: var(--gold-dark); }
}

.pdf-preview-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  font-size: 0.8rem;
  color: var(--text);

  i { color: var(--gold-dark); }
  strong { font-weight: 600; color: var(--dark); }
  span { opacity: 0.7; }
}

.own-pdf-view { margin-bottom: 8px; }

.pill.danger {
  i { color: #b4472f; }
  &:hover:not(:disabled) { background: #fbe9e4; border-color: #e9b7aa; }
}

.own-pdf {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px 10px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  border-radius: 10px;
  color: var(--text);
  text-decoration: none;

  i { font-size: 1.1rem; color: var(--gold-dark); }
  span { display: flex; flex-direction: column; min-width: 0; }
  strong { font-size: 0.8rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { font-size: 0.68rem; opacity: 0.7; }
  &:hover { background: var(--blush); }
}

/* ── Saved cards ── */
.card-limit {
  margin: 0 0 10px;
  font-size: 0.72rem;
  color: var(--text);
  opacity: 0.75;

  i { margin-right: 4px; color: var(--gold-dark); }
  &.full { opacity: 1; color: var(--gold-dark); font-weight: 500; }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  span { font-size: 0.7rem; color: var(--sage); }

  input {
    padding: 8px 12px;
    border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
    border-radius: 10px;
    background: var(--cream);
    color: var(--text);
    font: inherit;
    font-size: 0.85rem;

    &:focus { outline: none; border-color: var(--gold); box-shadow: 0 0 0 2px color-mix(in srgb, var(--gold-light) 60%, transparent); }
  }
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    border: 1px solid transparent;
    border-radius: 10px;

    &:hover { background: var(--blush); }
    &.active { border-color: var(--gold); background: var(--blush); }
  }
}

.card-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  background: none;
  color: var(--text);
  text-align: left;
  cursor: pointer;

  i { color: var(--gold-dark); }

  span { min-width: 0; display: flex; flex-direction: column; }
  strong { font-size: 0.82rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { font-size: 0.65rem; color: var(--sage); }
}

.card-delete {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-right: 4px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--sage);
  cursor: pointer;

  &:hover:not(:disabled) { color: #b3261e; }
  &:disabled { opacity: 0.5; cursor: wait; }
}

.card-empty {
  margin: 0 0 12px;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--sage);
}

.choice-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  border-radius: 12px;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s ease;

  small { font-size: 0.65rem; color: var(--sage); }

  &:hover { background: var(--blush); }
  &.active { border-color: var(--gold); background: var(--blush); box-shadow: 0 0 0 1px var(--gold); }
}

.paper-icon {
  height: 30px;
  border: 1.5px solid var(--gold-dark);
  border-radius: 2px;
  background: var(--cream);
}

.pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pill {
  padding: 6px 14px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  border-radius: 30px;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;

  i { margin-right: 4px; font-size: 0.7rem; color: var(--gold-dark); }

  &:hover:not(:disabled) { background: var(--blush); }
  &.active { background: var(--gold-light); border-color: var(--gold-light); color: var(--dark); font-weight: 500; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.theme-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 320px;
  overflow-y: auto;
  margin: 0 -6px;
  padding: 0 6px;
}

.theme-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: none;
  color: var(--text);
  text-align: left;
  cursor: pointer;

  &:hover { background: var(--blush); }
  &.active { border-color: var(--gold); background: var(--blush); }
}

.theme-dots {
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

.theme-name {
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-note {
  margin: 0;
  padding: 0 4px;
  font-size: 0.72rem;
  line-height: 1.5;
  color: var(--sage);
  i { color: var(--gold-dark); margin-right: 4px; }
}

/* ── Smaller screens ── */
@media (max-width: 900px) {
  .t-layout { grid-template-columns: minmax(0, 1fr); }
  .format-bar { top: 64px; }
  .theme-list { max-height: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
}

@media (max-width: 480px) {
  .toolbar-title h1 { font-size: 1.05rem; }
  .btn-ghost span { display: none; }
  .card-stage { padding: 12px; margin-left: -8px; margin-right: -8px; }
  .format-group { border-right: 0; padding-right: 0; }
  .version-label { display: none; }
}
</style>
