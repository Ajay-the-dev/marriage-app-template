<!-- The printable card: border, ornaments, motif and the editable (or read-only) text.
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
        <div v-if="!['none', ...ART_BORDERS].includes(card.border)" class="card-border outer"></div>
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

        <!-- Drawn borders: one layer in mm, the card's own size, so nothing stretches -->
        <svg v-if="ART_BORDERS.includes(card.border)" class="card-art" :viewBox="`0 0 ${mm.w} ${mm.h}`" aria-hidden="true">
          <template v-if="card.border === 'floral'">
            <rect x="7" y="7" :width="mm.w - 14" :height="mm.h - 14" fill="none" stroke="var(--c-accent)" stroke-width="0.35" />
            <g v-for="(flip, corner) in mmCorners" :key="corner" :transform="flip">
              <path d="M12 7.6 Q20 4.4 30 7.4 M7.6 12 Q4.4 20 7.4 30" fill="none" stroke="var(--c-accent-dark)" stroke-width="0.35" />
              <ellipse v-for="(leaf, i) in FLORAL_LEAVES" :key="i" :cx="leaf[0]" :cy="leaf[1]" rx="0.9" ry="2" fill="var(--c-accent)" :transform="`rotate(${leaf[2]} ${leaf[0]} ${leaf[1]})`" />
              <ellipse v-for="n in 5" :key="`p${n}`" cx="9" cy="6.2" rx="1.5" ry="2.6" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="0.25" :transform="`rotate(${n * 72} 9 9)`" />
              <circle cx="9" cy="9" r="1.2" fill="var(--c-accent-dark)" />
            </g>
            <g v-for="y in [7, mm.h - 7]" :key="`bud${y}`">
              <circle :cx="mm.w / 2" :cy="y" r="1.6" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="0.3" />
              <circle :cx="mm.w / 2" :cy="y" r="0.6" fill="var(--c-accent-dark)" />
            </g>
          </template>

          <template v-else-if="card.border === 'arch'">
            <path :d="archPath(7, 8)" fill="none" stroke="var(--c-accent)" stroke-width="0.6" />
            <path :d="archPath(9.2, 10.6)" fill="none" stroke="var(--c-accent-light)" stroke-width="0.3" />
            <path :d="`M${mm.w / 2} 1.8 L${mm.w / 2 + 1.6} 4.4 L${mm.w / 2} 7 L${mm.w / 2 - 1.6} 4.4 Z`" fill="var(--c-accent-dark)" />
            <circle v-for="x in [7, mm.w - 7]" :key="x" :cx="x" :cy="mm.h - 7" r="1.4" fill="var(--c-accent-dark)" />
            <path :d="`M10 ${mm.h - 9.5} H${mm.w - 10}`" fill="none" stroke="var(--c-accent-light)" stroke-width="0.3" stroke-dasharray="0.8 1.2" />
          </template>

          <template v-else-if="card.border === 'paisley'">
            <rect x="6" y="6" :width="mm.w - 12" :height="mm.h - 12" fill="none" stroke="var(--c-accent)" stroke-width="0.5" />
            <rect x="8" y="8" :width="mm.w - 16" :height="mm.h - 16" fill="none" stroke="var(--c-accent-light)" stroke-width="0.25" />
            <g v-for="(flip, corner) in mmCorners" :key="corner" :transform="flip">
              <g transform="translate(14 14) rotate(-135) scale(1.7)">
                <path :d="PAISLEY" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="0.3" />
                <path :d="PAISLEY" fill="var(--c-accent-light)" transform="translate(0 0.8) scale(0.55)" />
                <circle cx="0" cy="1.2" r="0.6" fill="var(--c-accent-dark)" />
              </g>
            </g>
            <g v-for="(y, i) in [6, mm.h - 6]" :key="`m${y}`" :transform="`translate(${mm.w / 2} ${y}) rotate(${i ? 0 : 180})`">
              <rect x="-9" y="-1.5" width="18" height="3" fill="var(--c-bg)" />
              <path :d="PAISLEY" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="0.2" transform="translate(-3.4 0) rotate(-90) scale(0.9)" />
              <path :d="PAISLEY" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="0.2" transform="translate(3.4 0) rotate(-90) scale(0.9 -0.9)" />
              <circle cx="0" cy="0" r="0.8" fill="var(--c-accent-dark)" />
            </g>
          </template>

          <template v-else-if="card.border === 'deco'">
            <rect x="6" y="6" :width="mm.w - 12" :height="mm.h - 12" fill="none" stroke="var(--c-accent)" stroke-width="0.5" />
            <g v-for="(flip, corner) in mmCorners" :key="corner" :transform="flip">
              <path d="M6 6 H18 V9 H9 V18 H6 Z" fill="var(--c-accent)" />
              <path d="M11.5 22 V11.5 H22" fill="none" stroke="var(--c-accent-dark)" stroke-width="0.35" />
              <path d="M13.5 26 V13.5 H26" fill="none" stroke="var(--c-accent-light)" stroke-width="0.3" />
              <path v-for="a in [15, 30, 45, 60, 75]" :key="a" :d="`M9 9 L${9 + 7 * Math.cos(a * Math.PI / 180)} ${9 + 7 * Math.sin(a * Math.PI / 180)}`" fill="none" stroke="var(--c-accent-dark)" stroke-width="0.25" />
            </g>
            <g v-for="(y, i) in [6, mm.h - 6]" :key="`c${y}`" :transform="`translate(${mm.w / 2} ${y}) scale(1 ${i ? -1 : 1})`">
              <path d="M-9 0 L0 4 L9 0 M-6 0 L0 2.6 L6 0" fill="none" stroke="var(--c-accent-dark)" stroke-width="0.35" />
              <path d="M-2 0 L0 -1.6 L2 0 Z" fill="var(--c-accent-dark)" />
            </g>
          </template>

          <template v-else-if="card.border === 'pearl'">
            <rect x="6.5" y="6.5" :width="mm.w - 13" :height="mm.h - 13" fill="none" stroke="var(--c-accent)" stroke-width="0.3" />
            <circle v-for="(p, i) in pearls" :key="i" :cx="p[0]" :cy="p[1]" r="0.55" fill="var(--c-accent)" />
            <g v-for="(flip, corner) in mmCorners" :key="corner" :transform="flip">
              <circle cx="9.2" cy="9.2" r="1.5" fill="var(--c-accent-light)" stroke="var(--c-accent-dark)" stroke-width="0.3" />
              <circle cx="9.2" cy="9.2" r="0.5" fill="var(--c-accent-dark)" />
            </g>
          </template>
        </svg>

        <div ref="contentEl" class="card-content">
          <div class="card-centre" :style="{ '--motif': motifScale(card.motifSize) }">
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
            <svg v-else-if="card.motif === 'om'" class="motif icon" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M28 30 C30 16 54 16 52 31 C51 40 43 44 36 44 C52 43 62 54 56 67 C50 79 30 78 22 66" fill="none" stroke="var(--c-accent-dark)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M48 48 C58 40 76 42 78 56 C80 70 68 80 58 76" fill="none" stroke="var(--c-accent-dark)" stroke-width="5" stroke-linecap="round" />
              <path d="M56 24 Q70 36 84 24" fill="none" stroke="var(--c-accent)" stroke-width="4" stroke-linecap="round" />
              <circle cx="70" cy="14" r="3.5" fill="var(--c-accent)" />
            </svg>
            <svg v-else-if="card.motif === 'ganapathy'" class="motif icon" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M38 30 C20 20 12 42 22 54 C28 60 36 54 40 46 Z" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="1.5" />
              <path d="M62 30 C80 20 88 42 78 54 C72 60 64 54 60 46 Z" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="1.5" />
              <path d="M38 30 C38 20 62 20 62 30 L60 46 C56 50 44 50 40 46 Z" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="1.5" />
              <path d="M40 24 L44 12 L50 18 L56 12 L60 24 Z" fill="var(--c-accent-dark)" />
              <circle cx="50" cy="9" r="2.5" fill="var(--c-accent-dark)" />
              <path d="M50 26 V33" fill="none" stroke="var(--c-accent-light)" stroke-width="2" stroke-linecap="round" />
              <circle cx="44" cy="36" r="1.6" fill="var(--c-accent-dark)" />
              <circle cx="56" cy="36" r="1.6" fill="var(--c-accent-dark)" />
              <path d="M44 48 L40 56" fill="none" stroke="var(--c-accent-light)" stroke-width="3" stroke-linecap="round" />
              <path d="M50 46 C50 60 44 70 50 80 C55 88 66 84 64 76 C62 70 56 72 57 76" fill="none" stroke="var(--c-accent-dark)" stroke-width="5" stroke-linecap="round" />
            </svg>
            <svg v-else-if="card.motif === 'kalash'" class="motif icon" viewBox="0 0 100 100" aria-hidden="true">
              <ellipse v-for="angle in [-60, -30, 0, 30, 60]" :key="angle" cx="50" cy="20" rx="4.5" ry="14" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="1" :transform="`rotate(${angle} 50 36)`" />
              <circle cx="50" cy="27" r="9" fill="var(--c-accent-dark)" />
              <rect x="36" y="34" width="28" height="5" rx="2" fill="var(--c-accent)" />
              <path d="M38 39 C20 50 22 78 40 84 H60 C78 78 80 50 62 39 Z" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="1.5" />
              <path d="M27 60 Q50 68 73 60" fill="none" stroke="var(--c-accent-light)" stroke-width="2" />
              <circle v-for="x in [36, 50, 64]" :key="x" :cx="x" cy="72" r="2" fill="var(--c-accent-light)" />
              <rect x="40" y="84" width="20" height="6" rx="2" fill="var(--c-accent-dark)" />
            </svg>
            <svg v-else-if="card.motif === 'diya'" class="motif icon" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M50 12 C58 26 60 38 50 48 C40 38 42 26 50 12 Z" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="1.2" />
              <path d="M50 26 C54 34 54 40 50 45 C46 40 46 34 50 26 Z" fill="var(--c-accent)" />
              <path d="M14 54 H84 L94 48 L88 60 C82 72 66 78 50 78 C34 78 18 72 14 54 Z" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="1.5" stroke-linejoin="round" />
              <path d="M22 60 Q50 70 80 60" fill="none" stroke="var(--c-accent-light)" stroke-width="1.5" />
              <rect x="40" y="78" width="20" height="6" rx="2" fill="var(--c-accent-dark)" />
            </svg>
            <svg v-else-if="card.motif === 'bells'" class="motif icon" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M16 10 Q50 24 84 10" fill="none" stroke="var(--c-accent-dark)" stroke-width="2" />
              <path d="M30 15 V36 M70 15 V36" fill="none" stroke="var(--c-accent)" stroke-width="1.5" stroke-dasharray="2 2" />
              <g v-for="x in [30, 70]" :key="x" :transform="`translate(${x} 40)`">
                <circle cx="0" cy="-2" r="3" fill="none" stroke="var(--c-accent-dark)" stroke-width="1.5" />
                <path d="M-12 26 C-12 9 -8 1 0 1 C8 1 12 9 12 26 L17 32 H-17 Z" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="1.5" stroke-linejoin="round" />
                <path d="M-9 18 H9" fill="none" stroke="var(--c-accent-light)" stroke-width="1.5" />
                <circle cx="0" cy="37" r="3.5" fill="var(--c-accent-dark)" />
              </g>
            </svg>
            <svg v-else-if="card.motif === 'peacock'" class="motif tall" viewBox="0 0 60 100" aria-hidden="true">
              <path v-for="n in 7" :key="n" :d="`M30 ${40 + n * 7} Q${12 - n} ${34 + n * 6} ${8 + n} ${24 + n * 5} M30 ${40 + n * 7} Q${48 + n} ${34 + n * 6} ${52 - n} ${24 + n * 5}`" fill="none" stroke="var(--c-accent-light)" stroke-width="0.8" />
              <path d="M30 98 C30 76 30 56 30 36" fill="none" stroke="var(--c-accent-dark)" stroke-width="1.5" />
              <ellipse cx="30" cy="32" rx="18" ry="26" fill="var(--c-accent-light)" />
              <ellipse cx="30" cy="34" rx="11" ry="15" fill="var(--c-accent)" />
              <ellipse cx="30" cy="36" rx="6.5" ry="8.5" fill="var(--c-accent-dark)" />
              <ellipse cx="30" cy="37" rx="3" ry="4" fill="var(--c-accent-light)" />
            </svg>
            <svg v-else-if="card.motif === 'cross'" class="motif icon" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="34" r="16" fill="none" stroke="var(--c-accent-light)" stroke-width="1.5" />
              <path d="M50 8 V92 M26 34 H74" fill="none" stroke="var(--c-accent-dark)" stroke-width="7" stroke-linecap="square" />
              <path d="M50 8 V92 M26 34 H74" fill="none" stroke="var(--c-accent)" stroke-width="2.5" stroke-linecap="square" />
            </svg>
            <svg v-else-if="card.motif === 'moon'" class="motif icon" viewBox="0 0 100 100" aria-hidden="true">
              <path d="M62 16 A36 36 0 1 0 62 84 A40 40 0 0 1 62 16 Z" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="1.5" />
              <polygon v-for="s in [[76, 32, 8], [86, 56, 5], [72, 74, 4]]" :key="s.join()" :points="starPoints(...s)" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="1" />
            </svg>
            <svg v-else-if="card.motif === 'rings'" class="motif icon" viewBox="0 0 100 80" aria-hidden="true">
              <circle cx="40" cy="50" r="20" fill="none" stroke="var(--c-accent)" stroke-width="4" />
              <circle cx="60" cy="50" r="20" fill="none" stroke="var(--c-accent-dark)" stroke-width="4" />
              <path d="M60 30 L53 21 L57 15 H63 L67 21 Z" fill="var(--c-accent-light)" stroke="var(--c-accent-dark)" stroke-width="1.2" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="card.motif === 'hearts'" class="motif icon" viewBox="0 0 100 80" aria-hidden="true">
              <path d="M0 18 C-26 2 -22 -20 -10 -20 C-4 -20 0 -14 0 -10 C0 -14 4 -20 10 -20 C22 -20 26 2 0 18 Z" fill="var(--c-accent-light)" stroke="var(--c-accent)" stroke-width="1.5" transform="translate(40 42)" />
              <path d="M0 18 C-26 2 -22 -20 -10 -20 C-4 -20 0 -14 0 -10 C0 -14 4 -20 10 -20 C22 -20 26 2 0 18 Z" fill="var(--c-accent)" stroke="var(--c-accent-dark)" stroke-width="1.5" transform="translate(62 38) scale(0.85)" />
            </svg>

            <!-- Guests: the saved text, already sanitized -->
            <div v-if="readonly" class="card-text" v-html="card.html"></div>
            <div
              v-else
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
import { computed, ref } from "vue";
import { motifScale, MM_TO_PX } from "@/utils/traditionalCard";

const props = defineProps({
  // { paper, border, motif, motifSize } of the card
  card: { type: Object, required: true },
  // Its size, colours and fonts (see useTraditionalEditor)
  cardStyle: { type: Object, required: true },
  // On-screen size in px at scale 1
  cardPx: { type: Object, required: true },
  scale: { type: Number, default: 1 },
  // While the PDF is being drawn: no shadow
  exporting: { type: Boolean, default: false },
  // Shows card.html instead of the editable text
  readonly: { type: Boolean, default: false },
});
defineEmits(["input", "paste", "focus", "blur"]);

// Each corner is the top-left flourish mirrored into place
const CORNERS = { tl: "", tr: "translate(60 0) scale(-1 1)", bl: "translate(0 60) scale(1 -1)", br: "translate(60 60) scale(-1 -1)" };

// Borders drawn as one SVG over the whole card (in mm)
const ART_BORDERS = ["floral", "arch", "paisley", "deco", "pearl"];
const mm = computed(() => ({ w: Math.round(props.cardPx.width / MM_TO_PX), h: Math.round(props.cardPx.height / MM_TO_PX) }));
// Each corner's ornament is drawn top-left, then mirrored into place
const mmCorners = computed(() => ({
  tl: "",
  tr: `translate(${mm.value.w} 0) scale(-1 1)`,
  bl: `translate(0 ${mm.value.h}) scale(1 -1)`,
  br: `translate(${mm.value.w} ${mm.value.h}) scale(-1 -1)`,
}));
// Leaves along the floral corner's two stems: [x, y, angle]
const FLORAL_LEAVES = [[16, 5.6, 60], [20, 7.4, 120], [24, 5.8, 70], [28, 7.6, 115], [5.6, 16, 30], [7.4, 20, -30], [5.8, 24, 20], [7.6, 28, -25]];
// A paisley (mango) drop, its round end at the origin and its tip curling up
const PAISLEY = "M0 3 C-3.2 3 -3.6 -1.4 -1 -2.6 C1.2 -3.6 3 -2.2 2.6 0.6 C2.4 2.4 3.6 4.6 5.4 4.4 C4 6.4 1.4 5.4 0 3 Z";
// Royal arch frame at the given side inset and top: straight sides, a pointed arch over the top
const archPath = (side, top) => {
  const { w, h } = mm.value;
  const rise = Math.min(30, h * 0.16);
  const bottom = h - side;
  return `M${side} ${bottom} V${top + rise} C${side} ${top + rise * 0.45} ${w / 2 - w * 0.16} ${top + rise * 0.18} ${w / 2} ${top}`
    + ` C${w / 2 + w * 0.16} ${top + rise * 0.18} ${w - side} ${top + rise * 0.45} ${w - side} ${top + rise} V${bottom} Z`;
};
// Pearls every ~3 mm just inside the pearl frame, leaving the corners for the big ones
const pearls = computed(() => {
  const { w, h } = mm.value;
  const inset = 9.2;
  const line = (from, to) => {
    const count = Math.max(1, Math.round((to - from) / 3));
    return Array.from({ length: count - 1 }, (_, i) => from + ((to - from) * (i + 1)) / count);
  };
  return [
    ...line(inset, w - inset).flatMap((x) => [[x, inset], [x, h - inset]]),
    ...line(inset, h - inset).flatMap((y) => [[inset, y], [w - inset, y]]),
  ];
});

// Points of a five-pointed star centred on (cx, cy)
const starPoints = (cx, cy, r) =>
  Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const d = i % 2 ? r * 0.45 : r;
    return `${(cx + d * Math.cos(angle)).toFixed(2)},${(cy + d * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");

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

.card-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

// The arch's peak sits lower than a straight frame's top edge
.border-arch .card-content { top: 22mm; }

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

  // --motif: the size picked for it (MOTIF_SIZES)
  &.lotus { width: calc(24mm * var(--u) * var(--motif, 1)); }
  &.mandala { width: calc(18mm * var(--u) * var(--motif, 1)); }
  &.icon { width: calc(16mm * var(--u) * var(--motif, 1)); }
  &.tall { width: calc(10mm * var(--u) * var(--motif, 1)); }
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
