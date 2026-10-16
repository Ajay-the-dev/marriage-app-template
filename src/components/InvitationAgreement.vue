<template>
  <Teleport to="body">
    <Transition name="agreement">
      <div v-if="open" class="agreement-backdrop" @click.self="cancel">
        <div class="agreement-dialog" role="dialog" aria-modal="true" aria-labelledby="agreement-title">
          <button class="close-btn" @click="cancel" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>

          <header class="agreement-head">
            <span class="seal"><i class="fa-solid fa-file-signature"></i></span>
            <h2 id="agreement-title">Privacy &amp; usage agreement</h2>
            <p>Please read and sign before creating this invitation.</p>
          </header>

          <div ref="termsEl" class="terms" tabindex="0" @scroll="checkScrolled">
            <section v-for="section in AGREEMENT_SECTIONS" :key="section.title">
              <h3>{{ section.title }}</h3>
              <p>{{ section.body }}</p>
            </section>
            <p class="version">Version {{ AGREEMENT_VERSION }}</p>
          </div>
          <p v-if="!scrolled" class="hint"><i class="fa-solid fa-arrow-down"></i> Scroll to the end to continue</p>

          <form @submit.prevent="sign">
            <fieldset :disabled="!scrolled">
              <label v-for="(consent, i) in AGREEMENT_CONSENTS" :key="i" class="consent">
                <input type="checkbox" v-model="ticked[i]" />
                <span>{{ consent }}</span>
              </label>

              <label class="signature">
                <span>Type your full name to sign</span>
                <input v-model="name" type="text" autocomplete="name" maxlength="100" placeholder="Full name" />
              </label>
            </fieldset>

            <button type="submit" class="sign-btn" :disabled="!canSign">
              <i class="fa-solid fa-pen-nib"></i> Sign &amp; create invitation
            </button>
            <button type="button" class="later-btn" @click="cancel">Cancel</button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { AGREEMENT_VERSION, AGREEMENT_SECTIONS, AGREEMENT_CONSENTS } from "@/config/agreement";

// Opens with v-model:open; emits 'sign' with { version, name } once signed
const open = defineModel("open", { type: Boolean, default: false });
const emit = defineEmits(["sign"]);

const termsEl = ref(null);
const scrolled = ref(false);
const ticked = ref([]);
const name = ref("");

const canSign = computed(() =>
  scrolled.value && AGREEMENT_CONSENTS.every((_, i) => ticked.value[i]) && name.value.trim().length >= 2
);

// Short terms that don't need scrolling count as read
const checkScrolled = () => {
  const el = termsEl.value;
  if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) scrolled.value = true;
};

const cancel = () => { open.value = false; };

const sign = () => {
  if (!canSign.value) return;
  emit("sign", { version: AGREEMENT_VERSION, name: name.value.trim() });
  open.value = false;
};

const onKey = (e) => {
  if (e.key === "Escape") cancel();
};

// Every invitation is signed afresh, so start blank each time
watch(open, async (isOpen) => {
  if (!isOpen) {
    window.removeEventListener("keydown", onKey);
    return;
  }
  scrolled.value = false;
  ticked.value = AGREEMENT_CONSENTS.map(() => false);
  name.value = "";
  window.addEventListener("keydown", onKey);
  await nextTick();
  checkScrolled();
});
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style lang="scss" scoped>
.agreement-backdrop {
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

.agreement-dialog {
  position: relative;
  width: 100%;
  max-width: 520px;
  padding: 28px 24px 20px;
  border-radius: 20px;
  background: var(--cream);
  color: var(--text);
  font-family: 'Montserrat', sans-serif;
  box-shadow: 0 24px 60px rgba(26, 18, 8, 0.3);
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

.agreement-head {
  text-align: center;

  .seal {
    display: inline-grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
    color: var(--dark);
    font-size: 1.3rem;
    box-shadow: 0 6px 18px rgba(154, 122, 69, 0.35);
  }

  h2 {
    margin: 14px 0 6px;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 1.25rem;
    color: var(--dark);
  }

  p {
    margin: 0 0 16px;
    font-size: 0.85rem;
    color: var(--gold-dark);
  }
}

.terms {
  max-height: 260px;
  overflow-y: auto;
  padding: 4px 16px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  border-radius: 14px;
  background: #fff;
  font-size: 0.78rem;
  line-height: 1.55;

  h3 {
    margin: 12px 0 4px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--dark);
  }

  p { margin: 0 0 8px; }

  .version {
    margin: 12px 0;
    font-size: 0.7rem;
    color: var(--sage);
  }
}

.hint {
  margin: 8px 0 0;
  font-size: 0.72rem;
  color: var(--gold-dark);
  text-align: center;
}

fieldset {
  margin: 16px 0 0;
  padding: 0;
  border: none;
  &:disabled { opacity: 0.5; }
}

.consent {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 0.78rem;
  line-height: 1.45;
  cursor: pointer;

  & + & { margin-top: 8px; }

  input {
    flex-shrink: 0;
    margin-top: 2px;
    width: 16px;
    height: 16px;
    accent-color: var(--gold-dark);
  }
}

.signature {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
  font-size: 0.75rem;
  color: var(--gold-dark);

  input {
    padding: 10px 12px;
    border: 1px solid var(--gold-light);
    border-radius: 10px;
    background: #fff;
    color: var(--dark);
    font-family: 'Dancing Script', 'Brush Script MT', cursive;
    font-size: 1.15rem;
    &:focus { outline: 2px solid var(--gold); outline-offset: 1px; }
  }
}

.sign-btn {
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
  &:hover:not(:disabled) { box-shadow: 0 6px 18px rgba(154, 122, 69, 0.4); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

.later-btn {
  display: block;
  margin: 8px auto 0;
  padding: 8px 14px;
  border: none;
  background: none;
  color: var(--sage);
  font-size: 0.78rem;
  cursor: pointer;
  &:hover { color: var(--text); }
}

.agreement-enter-active,
.agreement-leave-active {
  transition: opacity 0.2s ease;
  .agreement-dialog { transition: transform 0.2s ease; }
}
.agreement-enter-from,
.agreement-leave-to {
  opacity: 0;
  .agreement-dialog { transform: translateY(12px) scale(0.98); }
}
</style>
