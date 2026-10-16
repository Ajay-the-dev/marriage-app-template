<!-- The printable card: border, ornaments, motif and the editable text.
     Shown scaled to fit (scale), at its real size in mm for the PDF. -->
<template>
  <div class="card-frame" :style="{ width: `${cardPx.width * scale}px`, height: `${cardPx.height * scale}px` }">
    <div class="card-scaler" :style="{ transform: `scale(${scale})` }">
      <article
        ref="cardEl"
        class="t-card"
        :class="[`border-${card.border}`, { exporting }]"
        :style="cardStyle"
      >
        <!-- Border -->
        <div v-if="card.border !== 'none'" class="card-border outer"></div>
        <div v-if="card.border === 'temple' || card.border === 'double'" class="card-border inner"></div>
        <template v-if="card.border === 'temple'">
          <svg v-for="(flip, corner) in CORNERS" :key="corner" class="corner" :class="corner" viewBox="0 0 60 60" aria-hidden="true">
            <g :transform="flip">
              <path d="M3 57 V22 Q3 3 22 3 H57" fill="none" stroke="currentColor" stroke-width="1.6" />
              <path d="M10 57 V26 Q10 10 26 10 H57" fill="none" stroke="currentColor" stroke-width="0.7" />
              <path d="M17 17 L23 11 L29 17 L23 23 Z M17 17 L11 23 L17 29 L23 23" fill="currentColor" opacity="0.85" />
              <path d="M30 10 Q34 20 26 26 Q20 34 10 30" fill="none" stroke="currentColor" stroke-width="0.7" />
              <circle cx="40" cy="10" r="1.6" fill="currentColor" />
              <circle cx="10" cy="40" r="1.6" fill="currentColor" />
              <circle cx="48" cy="10" r="1" fill="currentColor" />
              <circle cx="10" cy="48" r="1" fill="currentColor" />
            </g>
          </svg>
          <svg class="crest top" viewBox="0 0 80 16" aria-hidden="true">
            <path d="M0 8 H28 M52 8 H80" stroke="currentColor" stroke-width="0.8" />
            <path d="M40 1 L47 8 L40 15 L33 8 Z" fill="currentColor" />
            <circle cx="30" cy="8" r="1.4" fill="currentColor" />
            <circle cx="50" cy="8" r="1.4" fill="currentColor" />
          </svg>
          <svg class="crest bottom" viewBox="0 0 80 16" aria-hidden="true">
            <path d="M0 8 H28 M52 8 H80" stroke="currentColor" stroke-width="0.8" />
            <path d="M40 1 L47 8 L40 15 L33 8 Z" fill="currentColor" />
            <circle cx="30" cy="8" r="1.4" fill="currentColor" />
            <circle cx="50" cy="8" r="1.4" fill="currentColor" />
          </svg>
        </template>

        <div ref="contentEl" class="card-content">
          <div class="card-centre">
            <!-- Motif -->
            <svg v-if="card.motif === 'lotus'" class="motif lotus" viewBox="0 0 120 64" aria-hidden="true">
              <g v-for="angle in [-64, -32, 32, 64]" :key="angle" :transform="`rotate(${angle} 60 56)`">
                <path d="M60 14 C68 28 68 44 60 56 C52 44 52 28 60 14 Z" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="1" />
              </g>
              <path d="M60 6 C71 22 71 42 60 56 C49 42 49 22 60 6 Z" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="1" />
              <path d="M60 18 C64 28 64 40 60 50 C56 40 56 28 60 18 Z" fill="var(--c-accent-light)" />
              <path d="M22 58 Q60 66 98 58" fill="none" stroke="var(--c-accent-dark)" stroke-width="1.2" />
              <circle cx="16" cy="57" r="1.8" fill="var(--c-accent)" />
              <circle cx="104" cy="57" r="1.8" fill="var(--c-accent)" />
            </svg>
            <svg v-else-if="card.motif === 'mandala'" class="motif mandala" viewBox="-50 -50 100 100" aria-hidden="true">
              <circle r="44" fill="none" stroke="var(--c-accent-light)" stroke-width="0.8" />
              <circle v-for="n in 24" :key="`d${n}`" :cx="0" :cy="-40" r="1.3" fill="var(--c-accent)" :transform="`rotate(${n * 15})`" />
              <ellipse v-for="n in 16" :key="`o${n}`" cx="0" cy="-26" rx="4.5" ry="10" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="0.7" :transform="`rotate(${n * 22.5})`" />
              <ellipse v-for="n in 8" :key="`i${n}`" cx="0" cy="-13" rx="3.6" ry="7" fill="var(--c-accent)" :transform="`rotate(${n * 45 + 22.5})`" />
              <circle r="6" fill="var(--c-accent-dark)" />
              <circle r="2.4" fill="var(--c-accent-light)" />
            </svg>

            <div
              ref="editorEl"
              class="card-text"
              contenteditable="true"
              spellcheck="false"
              role="textbox"
              aria-multiline="true"
              aria-label="Invitation text"
              @input="$emit('input')"
              @paste="$emit('paste', $event)"
              @focus="$emit('focus')"
                @blur="$emit('blur')"
            ></div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  // { paper, border, motif } of the card
  card: { type: Object, required: true },
  // Its size, colours and fonts (see useTraditionalEditor)
  cardStyle: { type: Object, required: true },
  // On-screen size in px at scale 1
  cardPx: { type: Object, required: true },
  scale: { type: Number, default: 1 },
  // While the PDF is being drawn: no shadow
  exporting: { type: Boolean, default: false },
});
defineEmits(["input", "paste", "focus", "blur"]);

// Each corner is the top-left flourish mirrored into place
const CORNERS = { tl: "", tr: "translate(60 0) scale(-1 1)", bl: "translate(0 60) scale(1 -1)", br: "translate(60 60) scale(-1 -1)" };

const cardEl = ref(null);
const contentEl = ref(null);
const editorEl = ref(null);
defineExpose({ cardEl, contentEl, editorEl });
</script>

<style lang="scss" scoped>
.card-frame {
  position: relative;
  flex-shrink: 0;
}

.card-scaler {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
}

/* ── Card ──
   Uses its own --c-* colours (from the chosen theme) and real units (mm / pt),
   so the PDF matches print sizes */
.t-card {
  position: relative;
  overflow: hidden;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--f-serif);
  box-shadow: 0 18px 50px rgba(61, 44, 20, 0.18);

  &.exporting { box-shadow: none; }
}

.card-border {
  position: absolute;
  pointer-events: none;

  &.outer { inset: 6mm; border: 0.6mm solid var(--c-accent); }
  &.inner { inset: 8mm; border: 0.25mm solid var(--c-accent-light); }
}

.border-double .card-border {
  &.outer { inset: 7mm; border-width: 0.3mm; }
  &.inner { inset: 8.4mm; border: 0.3mm solid var(--c-accent); }
}

.border-minimal .card-border.outer {
  inset: 8mm;
  border-width: 0.25mm;
}

.corner {
  position: absolute;
  width: 16mm;
  height: 16mm;
  color: var(--c-accent-dark);
  background: transparent;

  &.tl { top: 3.5mm; left: 3.5mm; }
  &.tr { top: 3.5mm; right: 3.5mm; }
  &.bl { bottom: 3.5mm; left: 3.5mm; }
  &.br { bottom: 3.5mm; right: 3.5mm; }
}

.crest {
  position: absolute;
  left: 50%;
  width: 26mm;
  height: 5.2mm;
  margin-left: -13mm;
  color: var(--c-accent-dark);
  padding: 0 1.5mm;
  background: var(--c-bg);

  &.top { top: 3.4mm; }
  &.bottom { bottom: 3.4mm; }
}

.card-content {
  position: absolute;
  inset: 14mm 15mm;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.border-none .card-content { inset: 10mm 12mm; }

// Auto margins centre the text, and still let tall text start from the top
.card-centre {
  margin: auto 0;
  text-align: center;
}

.motif {
  display: block;
  margin: 0 auto calc(2mm * var(--u));

  &.lotus { width: calc(24mm * var(--u)); }
  &.mandala { width: calc(18mm * var(--u)); }
}

.card-text {
  outline: none;
  min-height: 2em;
  font-size: calc(10.5pt * var(--u));
  line-height: 1.45;
  border-radius: 2mm;
  transition: box-shadow 0.2s ease;

  &:focus { box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-accent-light) 70%, transparent); }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h6),
  :deep(p) {
    margin: 0 0 0.55em;
  }

  :deep(h1) {
    font-family: var(--f-display);
    font-size: calc(21pt * var(--u));
    font-weight: 400;
    line-height: 1.15;
    color: var(--c-accent-dark);
    margin-bottom: 0.25em;
  }

  :deep(h2) {
    font-family: var(--f-display);
    font-size: calc(13pt * var(--u));
    font-weight: 400;
    font-style: italic;
    color: var(--c-heading);
  }

  :deep(h3) {
    font-family: var(--f-sans);
    font-size: calc(8.5pt * var(--u));
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--c-accent-dark);
    margin-bottom: 0.3em;
  }

  :deep(p) {
    color: var(--c-text);
  }

  :deep(h6) {
    font-family: var(--f-serif);
    font-size: calc(8.5pt * var(--u));
    font-weight: 400;
    font-style: italic;
    color: var(--c-muted);
  }

  :deep(hr) {
    position: relative;
    width: 55%;
    height: 0.3mm;
    margin: 1.1em auto;
    border: 0;
    opacity: 1;
    overflow: visible;
    background: linear-gradient(90deg, transparent, var(--c-accent), transparent);
  }

  :deep(hr)::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 2mm;
    height: 2mm;
    margin: -1mm 0 0 -1mm;
    transform: rotate(45deg);
    background: var(--c-accent);
    box-shadow: 0 0 0 0.8mm var(--c-bg);
  }
}
</style>
