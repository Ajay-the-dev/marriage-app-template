<!-- Help for desktop and tablet: guides to setting up and sending an invitation, making the
     traditional PDF, and a site map. Phones get Help2.vue. ?topic= picks the guide. -->
<template>
  <Basic>
    <section class="help-page">
      <header class="help-toolbar">
        <div class="toolbar-inner">
          <div class="toolbar-title">
            <button type="button" class="back-link" title="Back" @click="goBack">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div>
              <h1>Help</h1>
              <small>Guides and site map</small>
            </div>
          </div>
          <div class="toolbar-actions">
            <router-link v-if="auth.isLoggedIn" :to="{ name: 'settings' }" class="btn-ghost">
              <i class="fa-solid fa-layer-group"></i><span>My invitations</span>
            </router-link>
            <router-link v-else :to="{ name: 'login' }" class="btn-primary">
              <i class="fa-solid fa-right-to-bracket"></i><span>Sign in</span>
            </router-link>
          </div>
        </div>
      </header>

      <div class="help-body">
        <!-- Topics -->
        <nav class="help-nav" aria-label="Help topics">
          <button
            v-for="t in HELP_TOPICS"
            :key="t.id"
            type="button"
            class="topic-card"
            :class="{ active: topic.id === t.id }"
            :aria-current="topic.id === t.id ? 'page' : undefined"
            @click="setTopic(t.id)"
          >
            <span class="topic-icon"><i class="fa-solid" :class="t.icon"></i></span>
            <span class="topic-text">
              <strong>{{ t.title }}</strong>
              <small>{{ t.steps ? `${t.steps.length} steps` : 'Every page at a glance' }}</small>
            </span>
          </button>
        </nav>

        <main class="help-main">
          <header class="topic-head">
            <span class="topic-badge"><i class="fa-solid" :class="topic.icon"></i></span>
            <div>
              <h2>{{ topic.title }}</h2>
              <p>{{ topic.intro }}</p>
            </div>
          </header>

          <!-- Guide: numbered steps along a line -->
          <ol v-if="topic.steps" class="steps">
            <li v-for="(step, i) in topic.steps" :key="step.title" class="step">
              <span class="step-num" aria-hidden="true">{{ i + 1 }}</span>
              <div class="step-card">
                <h3><i class="fa-solid" :class="step.icon"></i>{{ step.title }}</h3>
                <p v-for="text in step.body" :key="text">{{ text }}</p>
                <ul v-if="step.tips" class="tips">
                  <li v-for="tip in step.tips" :key="tip"><i class="fa-regular fa-lightbulb"></i>{{ tip }}</li>
                </ul>
                <router-link v-if="step.action && showAction(step.action)" :to="step.action.to" class="step-action">
                  {{ step.action.label }} <i class="fa-solid fa-arrow-right"></i>
                </router-link>
              </div>
            </li>
          </ol>

          <!-- Site map: one card per area, its pages as a tree -->
          <div v-else class="site-map">
            <section v-for="group in topic.map" :key="group.title" class="map-group">
              <header>
                <span class="map-icon"><i class="fa-solid" :class="group.icon"></i></span>
                <div>
                  <h3>{{ group.title }}</h3>
                  <small>{{ group.desc }}</small>
                </div>
              </header>
              <ul class="map-tree">
                <li v-for="node in group.children" :key="node.title">
                  <div class="node-row">
                    <i class="fa-solid" :class="node.icon"></i>
                    <div class="node-text">
                      <strong>{{ node.title }}</strong>
                      <code v-if="node.path">{{ node.path }}</code>
                      <small>{{ node.desc }}</small>
                    </div>
                    <router-link v-if="node.to && showAction(node)" :to="node.to" class="node-go">Open</router-link>
                    <button v-else-if="node.topic" type="button" class="node-go" @click="setTopic(node.topic)">Read</button>
                  </div>
                  <ul v-if="node.children" class="map-tree sub">
                    <li v-for="child in node.children" :key="child.title">
                      <div class="node-row">
                        <i class="fa-solid" :class="child.icon"></i>
                        <div class="node-text">
                          <strong>{{ child.title }}</strong>
                          <small>{{ child.desc }}</small>
                        </div>
                      </div>
                    </li>
                  </ul>
                </li>
              </ul>
            </section>
          </div>

          <footer v-if="nextTopic" class="topic-next">
            <button type="button" class="btn-primary" @click="setTopic(nextTopic.id)">
              Next: {{ nextTopic.title }} <i class="fa-solid fa-arrow-right"></i>
            </button>
          </footer>
        </main>
      </div>
    </section>
  </Basic>
</template>

<script setup>
import Basic from "@/views/Basic.vue";
import { useAuthStore } from "@/stores/auth";
import { HELP_TOPICS } from "@/config/help";
import { useHelpPage } from "@/composables/help";

const auth = useAuthStore();
const { topic, nextTopic, setTopic, goBack, showAction } = useHelpPage();
</script>

<style lang="scss" scoped>
/* Same gold & cream look as the invitations list and editor */
.help-page {
  --gold: #c9a96e;
  --gold-light: #e8d5a3;
  --gold-dark: #9a7a45;
  --cream: #fdf6ec;
  --dark: #1a1208;
  --text: #3d2c14;
  --muted: #8b7558;
  --blush: #f5e6d8;
  --line: color-mix(in srgb, var(--gold-light) 60%, transparent);
  background-color: var(--cream);
  color: var(--text);
  font-family: 'Montserrat', sans-serif;
  min-height: 100vh;
  padding-bottom: 80px;
}

/* ── Toolbar ── */
.help-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.toolbar-inner {
  max-width: 1140px;
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
  gap: 12px;

  h1 {
    margin: 0;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 1.2rem;
    color: var(--dark);
  }

  small { font-size: 0.72rem; color: var(--muted); }
}

.back-link {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: none;
  color: var(--text);
  cursor: pointer;
  &:hover { background: var(--blush); }
}

.toolbar-actions { display: flex; gap: 8px; }

.btn-ghost,
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 30px;
  padding: 7px 14px;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-ghost {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  color: var(--text);
  &:hover { background: var(--blush); }
}

.btn-primary {
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  border: none;
  color: var(--dark);
  &:hover { box-shadow: 0 4px 14px rgba(154, 122, 69, 0.35); }
}

/* ── Layout: topics beside the guide; stacked on tablets ── */
.help-body {
  max-width: 1140px;
  margin: 0 auto;
  padding: 28px 16px 0;
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 32px;
  align-items: start;
}

.help-nav {
  position: sticky;
  top: 90px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topic-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;

  &:hover { border-color: var(--gold); transform: translateY(-1px); }

  &.active {
    border-color: var(--gold-dark);
    box-shadow: 0 8px 24px rgba(154, 122, 69, 0.16);
    .topic-icon { background: var(--gold-dark); color: #fff; }
  }
}

.topic-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--blush);
  color: var(--gold-dark);
  transition: background 0.15s, color 0.15s;
}

.topic-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  strong { font-size: 0.86rem; font-weight: 600; color: var(--dark); }
  small { font-size: 0.72rem; color: var(--muted); }
}

/* ── Topic ── */
.topic-head {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 28px;

  h2 {
    margin: 0 0 6px;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 1.35rem;
    color: var(--dark);
  }

  p { margin: 0; max-width: 62ch; font-size: 0.9rem; line-height: 1.6; color: var(--muted); }
}

.topic-badge {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--gold-light), var(--gold-dark));
  color: #fff;
  font-size: 1.3rem;
  box-shadow: 0 10px 24px rgba(154, 122, 69, 0.28);
}

/* Steps hang off a line through their numbers */
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 17px;
    top: 18px;
    bottom: 18px;
    width: 2px;
    background: linear-gradient(var(--gold-light), color-mix(in srgb, var(--gold-light) 30%, transparent));
  }
}

.step {
  position: relative;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.step-num {
  position: relative;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--gold);
  border-radius: 50%;
  background: var(--cream);
  color: var(--gold-dark);
  font-weight: 700;
  font-size: 0.85rem;
}

.step-card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 18px rgba(61, 44, 20, 0.05);

  h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 8px;
    font-size: 0.98rem;
    font-weight: 600;
    color: var(--dark);
    i { color: var(--gold-dark); font-size: 0.9rem; }
  }

  p { margin: 0 0 8px; font-size: 0.86rem; line-height: 1.6; }
}

.tips {
  list-style: none;
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--gold-light) 18%, #fff);

  li {
    display: flex;
    gap: 8px;
    font-size: 0.8rem;
    line-height: 1.5;
    & + li { margin-top: 6px; }
  }
  i { margin-top: 3px; color: var(--gold-dark); }
}

.step-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gold-dark);
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

/* ── Site map ── */
.site-map {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  align-items: start;
}

.map-group {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fff;

  > header {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
    h3 { margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--dark); }
    small { font-size: 0.72rem; color: var(--muted); }
  }
}

.map-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--blush);
  color: var(--gold-dark);
}

/* Each page hangs off a line from its area */
.map-tree {
  list-style: none;
  margin: 0 0 0 17px;
  padding: 0 0 0 14px;
  border-left: 2px solid color-mix(in srgb, var(--gold-light) 60%, transparent);

  > li { position: relative; }
  > li::before {
    content: "";
    position: absolute;
    left: -14px;
    top: 17px;
    width: 10px;
    height: 2px;
    background: color-mix(in srgb, var(--gold-light) 60%, transparent);
  }

  &.sub { margin: 2px 0 4px 8px; }
}

.node-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 10px;

  > i { width: 16px; margin-top: 3px; text-align: center; font-size: 0.8rem; color: var(--gold-dark); }
}

.node-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 8px;
  strong { font-size: 0.84rem; font-weight: 600; color: var(--dark); }
  code { font-size: 0.7rem; padding: 1px 6px; border-radius: 6px; background: var(--cream); color: var(--gold-dark); }
  small { flex-basis: 100%; font-size: 0.75rem; line-height: 1.45; color: var(--muted); }
}

.node-go {
  flex-shrink: 0;
  padding: 3px 10px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: none;
  color: var(--gold-dark);
  font: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  &:hover { background: var(--blush); }
}

.topic-next {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

/* Tablets: topics as a row above the guide */
@media (max-width: 960px) {
  .help-body {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    padding-top: 20px;
  }

  .help-nav {
    position: static;
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .topic-card { flex: 1 0 220px; }
}
</style>
