<!-- Help for phones: the same guides and site map as Help.vue, as topic chips,
     step-by-step cards that open one at a time, and a site map list. -->
<template>
  <Basic>
    <section class="m-help">
      <header class="m-top">
        <button type="button" class="m-icon" aria-label="Back" @click="goBack">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1>Help</h1>
        <router-link :to="{ name: 'help', query: { ...route.query, view: 'desktop' } }" class="m-icon" aria-label="Desktop view">
          <i class="fa-solid fa-display"></i>
        </router-link>
      </header>

      <!-- Topics -->
      <nav class="m-topics" aria-label="Help topics">
        <button
          v-for="t in HELP_TOPICS"
          :key="t.id"
          type="button"
          class="m-topic"
          :class="{ active: topic.id === t.id }"
          :aria-current="topic.id === t.id ? 'page' : undefined"
          @click="setTopic(t.id)"
        >
          <i class="fa-solid" :class="t.icon"></i>{{ t.short }}
        </button>
      </nav>

      <main class="m-main">
        <div class="m-intro">
          <span class="m-badge"><i class="fa-solid" :class="topic.icon"></i></span>
          <div>
            <h2>{{ topic.title }}</h2>
            <p>{{ topic.intro }}</p>
          </div>
        </div>

        <!-- Guide: one step open at a time -->
        <ol v-if="topic.steps" class="m-steps">
          <li v-for="(step, i) in topic.steps" :key="step.title" class="m-step" :class="{ open: openStep === i, done: openStep > i }">
            <button type="button" class="m-step-head" :aria-expanded="openStep === i" @click="openStep = openStep === i ? -1 : i">
              <span class="m-num">
                <i v-if="openStep > i" class="fa-solid fa-check"></i>
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="m-step-title"><i class="fa-solid" :class="step.icon"></i>{{ step.title }}</span>
              <i class="fa-solid fa-chevron-down m-chevron"></i>
            </button>
            <div v-if="openStep === i" class="m-step-body">
              <p v-for="text in step.body" :key="text">{{ text }}</p>
              <ul v-if="step.tips" class="m-tips">
                <li v-for="tip in step.tips" :key="tip"><i class="fa-regular fa-lightbulb"></i>{{ tip }}</li>
              </ul>
              <div class="m-step-actions">
                <router-link v-if="step.action && showAction(step.action)" :to="step.action.to" class="m-link">
                  {{ step.action.label }} <i class="fa-solid fa-arrow-right"></i>
                </router-link>
                <button v-if="i < topic.steps.length - 1" type="button" class="m-next" @click="openStep = i + 1">
                  Next step <i class="fa-solid fa-chevron-down"></i>
                </button>
              </div>
            </div>
          </li>
        </ol>

        <!-- Site map -->
        <div v-else class="m-map">
          <section v-for="group in topic.map" :key="group.title" class="m-group">
            <header>
              <span class="m-group-icon"><i class="fa-solid" :class="group.icon"></i></span>
              <div>
                <h3>{{ group.title }}</h3>
                <small>{{ group.desc }}</small>
              </div>
            </header>
            <ul class="m-tree">
              <li v-for="node in group.children" :key="node.title">
                <component
                  :is="node.to ? 'router-link' : node.topic ? 'button' : 'div'"
                  v-bind="node.to ? { to: node.to } : node.topic ? { type: 'button' } : {}"
                  class="m-node"
                  :class="{ tappable: node.to || node.topic }"
                  @click="node.topic && setTopic(node.topic)"
                >
                  <i class="fa-solid" :class="node.icon"></i>
                  <span class="m-node-text">
                    <strong>{{ node.title }}</strong>
                    <code v-if="node.path">{{ node.path }}</code>
                    <small>{{ node.desc }}</small>
                  </span>
                  <i v-if="node.to || node.topic" class="fa-solid fa-chevron-right m-go"></i>
                </component>
                <ul v-if="node.children" class="m-tree sub">
                  <li v-for="child in node.children" :key="child.title">
                    <div class="m-node">
                      <i class="fa-solid" :class="child.icon"></i>
                      <span class="m-node-text">
                        <strong>{{ child.title }}</strong>
                        <small>{{ child.desc }}</small>
                      </span>
                    </div>
                  </li>
                </ul>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <footer v-if="nextTopic" class="m-bottom">
        <button type="button" class="m-btn" @click="setTopic(nextTopic.id)">
          Next: {{ nextTopic.short }} <i class="fa-solid fa-arrow-right"></i>
        </button>
      </footer>
    </section>
  </Basic>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import Basic from "@/views/Basic.vue";
import { HELP_TOPICS } from "@/config/help";
import { useHelpPage } from "@/composables/help";

const route = useRoute();
const { topic, nextTopic, setTopic, goBack, showAction } = useHelpPage();

// Each guide opens on its first step
const openStep = ref(0);
watch(topic, () => (openStep.value = 0));
</script>

<style lang="scss" scoped>
/* Same tokens as the phone invitations list and editor */
.m-help {
  --gold: #c9a96e;
  --gold-light: #e8d5a3;
  --gold-dark: #9a7a45;
  --cream: #fdf6ec;
  --dark: #1a1208;
  --blush: #f5e6d8;
  --surface: #ffffff;
  --border: color-mix(in srgb, var(--gold-light) 45%, transparent);
  --text: #3d2c14;
  --muted: #8b7558;
  --accent: var(--gold-dark);
  --radius: 16px;
  --radius-sm: 10px;
  background: var(--cream);
  color: var(--text);
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  min-height: 100dvh;
  padding-bottom: calc(92px + env(safe-area-inset-bottom));
  -webkit-tap-highlight-color: transparent;
}

/* ── Top bar ── */
.m-top {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 6px;
  padding-top: calc(6px + env(safe-area-inset-top));
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
  h1 { flex: 1; margin: 0 4px; font-family: 'Cinzel Decorative', cursive; font-size: 1.05rem; font-weight: 700; color: var(--dark); }
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
  &:hover, &:active { background: var(--blush); color: var(--text); }
}

/* ── Topic chips ── */
.m-topics {
  position: sticky;
  top: calc(53px + env(safe-area-inset-top));
  z-index: 9;
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  background: var(--cream);
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.m-topic {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  i { color: var(--accent); font-size: 0.8rem; }
  &.active { background: var(--accent); border-color: var(--accent); color: #fff; i { color: #fff; } }
}

.m-main { padding: 4px 12px 0; }

.m-intro {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 6px 0 16px;
  h2 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 700; color: var(--dark); }
  p { margin: 0; font-size: 0.85rem; color: var(--muted); }
}

.m-badge {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--gold-light), var(--gold-dark));
  color: #fff;
}

/* ── Steps ── */
.m-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.m-step {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
  transition: box-shadow 0.2s;
  &.open { box-shadow: 0 8px 24px rgba(154, 122, 69, 0.14); border-color: var(--gold); }
}

.m-step-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 14px 8px 10px;
  border: 0;
  background: none;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.m-num {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--gold);
  border-radius: 50%;
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 700;
  .open & { background: var(--accent); border-color: var(--accent); color: #fff; }
  .done & { background: var(--blush); border-color: var(--blush); }
}

.m-step-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--dark);
  i { font-size: 0.8rem; color: var(--accent); }
}

.m-chevron {
  color: var(--muted);
  font-size: 0.75rem;
  transition: transform 0.2s;
  .open & { transform: rotate(180deg); }
}

.m-step-body {
  padding: 0 14px 14px 54px;
  p { margin: 0 0 8px; font-size: 0.86rem; line-height: 1.55; }
}

.m-tips {
  list-style: none;
  margin: 8px 0 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--gold-light) 18%, #fff);
  li { display: flex; gap: 8px; font-size: 0.8rem; & + li { margin-top: 6px; } }
  i { margin-top: 3px; color: var(--accent); }
}

.m-step-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.m-link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.m-next {
  margin-left: auto;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: none;
  color: var(--text);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  i { font-size: 0.7rem; margin-left: 4px; }
}

/* ── Site map ── */
.m-map { display: flex; flex-direction: column; gap: 12px; }

.m-group {
  padding: 14px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);

  > header {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 8px;
    h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--dark); }
    small { font-size: 0.75rem; color: var(--muted); }
  }
}

.m-group-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--blush);
  color: var(--accent);
}

.m-tree {
  list-style: none;
  margin: 0 0 0 17px;
  padding: 0 0 0 10px;
  border-left: 2px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  &.sub { margin-left: 8px; }
}

.m-node {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 44px;
  padding: 8px 6px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text);
  font: inherit;
  text-align: left;
  text-decoration: none;

  > i:first-child { width: 16px; margin-top: 3px; text-align: center; font-size: 0.8rem; color: var(--accent); }
  &.tappable { cursor: pointer; &:active { background: var(--blush); } }
}

.m-node-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  strong { font-size: 0.86rem; font-weight: 600; color: var(--dark); }
  code { align-self: flex-start; margin: 2px 0; font-size: 0.7rem; padding: 1px 6px; border-radius: 6px; background: var(--cream); color: var(--accent); }
  small { font-size: 0.76rem; color: var(--muted); }
}

.m-go { margin-top: 4px; font-size: 0.7rem; color: var(--muted); }

/* ── Bottom bar ── */
.m-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: rgba(253, 246, 236, 0.96);
  border-top: 1px solid var(--border);
}

.m-btn {
  width: 100%;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--gold-light), var(--gold-dark));
  color: var(--dark);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
