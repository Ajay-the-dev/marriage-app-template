<template>
  <div class="interest-pills" :class="{ compact }">
    <div class="pill-box" @click="input?.focus()">
      <span v-for="(item, i) in modelValue" :key="item" class="pill">
        {{ item }}
        <button type="button" :aria-label="`Remove ${item}`" @click.stop="remove(i)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </span>
      <input
        v-if="modelValue.length < max"
        ref="input"
        v-model="draft"
        :id="id"
        maxlength="30"
        :placeholder="modelValue.length ? 'Add another…' : placeholder"
        autocomplete="off"
        @keydown.enter.prevent="add(draft)"
        @keydown.backspace="!draft && modelValue.length && remove(modelValue.length - 1)"
        @input="draft.includes(',') && add(draft.replace(',', ''))"
        @blur="add(draft)"
      />
    </div>
    <div v-if="suggested.length && modelValue.length < max" class="pill-suggestions" role="group" aria-label="Suggested interests">
      <button v-for="item in suggested" :key="item" type="button" @mousedown.prevent @click="add(item)">
        <i class="fa-solid fa-plus"></i> {{ item }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  suggestions: { type: Array, default: () => [] },
  max: { type: Number, default: 8 },
  placeholder: { type: String, default: "Type and press Enter" },
  id: { type: String, default: undefined },
  compact: Boolean,
});
const emit = defineEmits(["update:modelValue"]);

const input = ref(null);
const draft = ref("");
const has = (item) => props.modelValue.some((v) => v.toLowerCase() === item.toLowerCase());

const add = (text) => {
  const item = text.trim();
  draft.value = "";
  if (!item || has(item) || props.modelValue.length >= props.max) return;
  emit("update:modelValue", [...props.modelValue, item]);
};
const remove = (i) => emit("update:modelValue", props.modelValue.filter((_, j) => j !== i));

// Unpicked suggestions, narrowed by what's being typed
const suggested = computed(() => {
  const q = draft.value.trim().toLowerCase();
  return props.suggestions
    .filter((s) => !has(s) && (!q || s.toLowerCase().includes(q)))
    .slice(0, q ? 8 : 12);
});
</script>

<style lang="scss" scoped>
.interest-pills {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pill-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 42px;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  border-radius: 10px;
  background: #fffdf9;
  cursor: text;

  &:focus-within { border-color: var(--gold); }

  input {
    flex: 1 0 120px;
    min-width: 0;
    border: 0;
    outline: 0;
    padding: 4px;
    background: none;
    font: inherit;
    color: var(--text);
  }
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 10px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  color: var(--dark);
  font-size: 0.78rem;

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.45);
    color: var(--dark);
    font-size: 0.65rem;
    cursor: pointer;
  }
}

.pill-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  button {
    padding: 3px 10px;
    border: 1px dashed color-mix(in srgb, var(--gold-light) 80%, transparent);
    border-radius: 20px;
    background: #fffdf9;
    color: var(--text);
    font-size: 0.74rem;
    cursor: pointer;
    &:hover { border-color: var(--gold); background: var(--blush); }
    i { font-size: 0.6rem; opacity: 0.6; }
  }
}

.compact {
  .pill-box { min-height: 44px; }
  .pill-suggestions button { padding: 6px 12px; font-size: 0.8rem; }
}
</style>
