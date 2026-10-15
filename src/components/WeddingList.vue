<template>
  <Basic>
    <section class="weddings-section">
      <header class="weddings-toolbar">
        <div class="toolbar-inner">
          <div class="toolbar-title">
            <router-link to="/" class="back-link" title="Back to site">
              <i class="fa-solid fa-arrow-left"></i>
            </router-link>
            <h1>My invitations</h1>
          </div>
          <div class="toolbar-actions">
            <span v-if="auth.user" class="user-chip" :title="auth.user.email">
              <img v-if="auth.user.photoURL" :src="auth.user.photoURL" alt="" referrerpolicy="no-referrer" />
              <i v-else class="fa-solid fa-circle-user"></i>
              <span>{{ auth.user.displayName || auth.user.email }}</span>
            </span>
            <button class="btn-ghost" @click="logout" title="Sign out">
              <i class="fa-solid fa-right-from-bracket"></i><span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div class="weddings-body">
        <p v-if="message" class="message" :class="messageType">{{ message }}</p>

        <div v-if="weddings !== null" class="plan-banner">
          <i class="fa-solid fa-crown"></i>
          <span>{{ limits.label }} plan · {{ weddings.length }} / {{ limits.invitations }} invitation{{ limits.invitations === 1 ? '' : 's' }}</span>
          <button v-if="planId === 'free'" type="button" class="upgrade-link" @click="showUpgrade()">Upgrade to Plus</button>
        </div>

        <div v-if="weddings === null" class="weddings-state">
          <template v-if="loadError">
            <p>{{ loadError }}</p>
            <button class="btn-primary" @click="refresh"><i class="fa-solid fa-rotate-right"></i><span>Retry</span></button>
          </template>
          <p v-else><i class="fa-solid fa-spinner fa-spin"></i> Loading your invitations…</p>
        </div>

        <div v-else class="wedding-grid">
          <button class="wedding-card new-card" @click="atLimit && planId === 'free' ? showUpgrade('invitations') : (signing = true)" :disabled="creating || (atLimit && planId !== 'free')">
            <i class="fa-solid" :class="creating ? 'fa-spinner fa-spin' : atLimit ? 'fa-lock' : 'fa-plus'"></i>
            <span>{{ creating ? 'Creating…' : atLimit ? `${limits.label} plan limit reached` : 'New invitation' }}</span>
            <small v-if="atLimit && planId === 'free'">Upgrade to Plus for up to {{ PLANS.plus.invitations }}</small>
          </button>

          <article v-for="w in weddings" :key="w.id" class="wedding-card" :class="{ locked: w.locked }">
            <router-link :to="{ name: 'edit-wedding', params: { id: w.id } }" class="card-main">
              <span class="monogram">{{ w.config.site?.monogram || '♥' }}</span>
              <h2>{{ coupleNames(w) }}</h2>
              <span v-if="w.config.hero?.dateText" class="date">{{ w.config.hero.dateText }}</span>
              <span v-if="w.locked" class="badge locked-badge">
                <i class="fa-solid fa-lock"></i> Read-only · guest link off
              </span>
              <span v-else-if="w.editLocked" class="badge edit-locked-badge">
                <i class="fa-solid fa-lock"></i> Locked for editing
              </span>
              <span v-if="w.hidden" class="badge hidden-badge">
                <i class="fa-solid fa-eye-slash"></i> Hidden from guests
              </span>
              <span v-if="w.id in views" class="visitors" :class="visitorState(views[w.id])" title="Unique visitors to the guest link">
                <i class="fa-solid fa-eye"></i> {{ visitorLabel(views[w.id]) }}
              </span>
              <span v-if="visitorState(views[w.id]) === 'warn'" class="visitor-note warn">
                Nearing the {{ limits.visitors }}-visitor limit. The guest link will stop working at {{ limits.visitors }} unless you
                <button type="button" class="upgrade-link inline" @click.prevent="showUpgrade('visitors')">upgrade</button>.
              </span>
              <span v-else-if="visitorState(views[w.id]) === 'full'" class="visitor-note full">
                Reached {{ limits.visitors }} visitors. The guest link no longer works for new visitors.
                <button type="button" class="upgrade-link inline" @click.prevent="showUpgrade('visitors')">Upgrade</button> to reopen it.
              </span>
              <span class="meta">
                <template v-if="w.code">Code <strong>{{ w.code }}</strong></template>
                <template v-if="w.updatedAt"> · Updated {{ formatDate(w.updatedAt) }}</template>
              </span>
            </router-link>
            <div class="card-actions">
              <router-link :to="{ name: 'edit-wedding', params: { id: w.id } }" class="btn-ghost">
                <i class="fa-solid" :class="w.locked || w.editLocked ? 'fa-eye' : 'fa-pen'"></i><span>{{ w.locked || w.editLocked ? 'View' : 'Edit' }}</span>
              </router-link>
              <button
                v-if="!w.locked"
                class="btn-ghost"
                @click="toggleEditLock(w)"
                :disabled="lockingId === w.id"
                :title="w.editLocked ? 'Unlock to edit again' : 'Lock so it can\'t be edited by mistake'"
              >
                <i class="fa-solid" :class="lockingId === w.id ? 'fa-spinner fa-spin' : w.editLocked ? 'fa-lock-open' : 'fa-lock'"></i>
              </button>
              <button
                class="btn-ghost"
                @click="toggleHidden(w)"
                :disabled="hidingId === w.id"
                :title="w.hidden ? 'Show to guests' : 'Hide from guests'"
              >
                <i class="fa-solid" :class="hidingId === w.id ? 'fa-spinner fa-spin' : w.hidden ? 'fa-eye' : 'fa-eye-slash'"></i>
              </button>
              <template v-if="w.code">
                <button class="btn-ghost" @click="copyLink(w)" title="Copy the invitation message with the guest link">
                  <i class="fa-solid" :class="copiedId === w.id ? 'fa-check' : 'fa-link'"></i>
                </button>
                <a class="btn-ghost" :href="shareLink(w)" target="_blank" rel="noopener" title="Open guest view">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </template>
              <button class="btn-ghost danger" @click="remove(w)" :disabled="deletingId === w.id" title="Delete">
                <i class="fa-solid" :class="deletingId === w.id ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
    <InvitationAgreement v-model:open="signing" @sign="create" />
  </Basic>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import Basic from "@/views/Basic.vue";
import InvitationAgreement from "@/components/InvitationAgreement.vue";
import { blankWedding } from "@/config/blankWedding";
import { useAuthStore } from "@/stores/auth";
import { listWeddings, createWedding, deleteWedding, fetchViewCounts, setLocked, setEditLocked, setHidden } from "@/services/weddings";
import { useMyPlan } from "@/composables/plan";
import { PLANS, getPlan, fitToPlan } from "@/config/plans";
import { showUpgrade } from "@/composables/upgrade";
import { shareMessage } from "@/utils/shareMessage";

const auth = useAuthStore();
const router = useRouter();

// null until the first load finishes
const weddings = ref(null);
// { [weddingId]: unique visitors }, filled in after the list loads
const views = ref({});
const myPlan = useMyPlan();
const planId = computed(() => myPlan.value ?? "free");
const limits = computed(() => getPlan(planId.value));
const atLimit = computed(() => weddings.value !== null && weddings.value.length >= limits.value.invitations);

// 'ok' | 'warn' (past the warning threshold) | 'full' (guest link closed)
const visitorState = (count) =>
  count === undefined ? "ok" : count >= limits.value.visitors ? "full" : count >= limits.value.visitorWarning ? "warn" : "ok";

// The oldest invitations within the plan's limit stay editable; the rest are
// locked (read-only, guest link off) until the user upgrades or deletes some.
const syncLocks = async () => {
  const updates = weddings.value
    .map((w, i) => ({ w, locked: i >= limits.value.invitations }))
    .filter(({ w, locked }) => w.locked !== locked);
  await Promise.all(updates.map(async ({ w, locked }) => {
    await setLocked(w.id, locked);
    w.locked = locked;
  }));
};
const loadError = ref("");
const creating = ref(false);
// The agreement dialog, signed before every new invitation
const signing = ref(false);
const deletingId = ref("");
const copiedId = ref("");
const message = ref("");
const messageType = ref("");

const flash = (text, type) => {
  message.value = text;
  messageType.value = type;
  setTimeout(() => { message.value = ""; messageType.value = ""; }, 4000);
};

const refresh = async () => {
  loadError.value = "";
  try {
    weddings.value = await listWeddings(auth.user.uid);
  } catch (error) {
    loadError.value = `Could not load your invitations: ${error.message}`;
    return;
  }
  // Counts are extra; the list still shows if they fail
  fetchViewCounts(weddings.value.map((w) => w.id))
    .then((counts) => { views.value = counts; })
    .catch((error) => console.warn("Could not load visitor counts:", error));
};

const visitorLabel = (count) => `${count} visitor${count === 1 ? "" : "s"}`;

const coupleNames = (w) => {
  const groom = w.config.groom?.shortName;
  const bride = w.config.bride?.shortName;
  return groom && bride ? `${groom} & ${bride}` : w.config.site?.title || "Untitled invitation";
};

const formatDate = (date) => date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const shareLink = (w) => `${window.location.origin}/${w.code}`;

const copyLink = async (w) => {
  try {
    await navigator.clipboard.writeText(shareMessage(w.config, shareLink(w)));
    copiedId.value = w.id;
    setTimeout(() => { if (copiedId.value === w.id) copiedId.value = ""; }, 1500);
  } catch {
    flash(`Could not copy, share this link: ${shareLink(w)}`, "error");
  }
};

// Starts from a blank invitation and opens it in the editor.
// agreement = { version, name } from the signed agreement dialog.
const create = async (agreement) => {
  if (atLimit.value) return;
  creating.value = true;
  try {
    const config = fitToPlan(blankWedding(), limits.value);
    const id = await createWedding(auth.user.uid, config, agreement);
    router.push({ name: "edit-wedding", params: { id } });
  } catch (error) {
    flash(`Could not create invitation: ${error.message}`, "error");
  } finally {
    creating.value = false;
  }
};

// Owner's lock: guests can still open it, but nobody can edit it until it's unlocked
const lockingId = ref("");
const toggleEditLock = async (w) => {
  const locked = !w.editLocked;
  lockingId.value = w.id;
  try {
    await setEditLocked(w.id, locked);
    w.editLocked = locked;
    flash(locked ? "Invitation locked" : "Invitation unlocked", "ok");
  } catch (error) {
    flash(`Could not ${locked ? "lock" : "unlock"}: ${error.message}`, "error");
  } finally {
    lockingId.value = "";
  }
};

// Hidden invitations show guests a "hidden" page until they're shown again
const hidingId = ref("");
const toggleHidden = async (w) => {
  const hidden = !w.hidden;
  hidingId.value = w.id;
  try {
    await setHidden(w.id, hidden);
    w.hidden = hidden;
    flash(hidden ? "Invitation hidden from guests" : "Invitation visible to guests", "ok");
  } catch (error) {
    flash(`Could not ${hidden ? "hide" : "show"} it: ${error.message}`, "error");
  } finally {
    hidingId.value = "";
  }
};

const remove = async (w) => {
  if (!confirm(`Delete "${coupleNames(w)}"? Its guest link will stop working. This can't be undone.`)) return;
  deletingId.value = w.id;
  try {
    await deleteWedding(w.id);
    weddings.value = weddings.value.filter((x) => x.id !== w.id);
    flash("Invitation deleted", "ok");
  } catch (error) {
    flash(`Delete failed: ${error.message}`, "error");
  } finally {
    deletingId.value = "";
  }
};

const logout = async () => {
  await auth.logout();
  router.replace({ name: "login" });
};

// (Re)apply locks once both the list and the plan are known, and again when
// either changes (an upgrade unlocks, a deletion frees a slot)
watch([() => weddings.value?.length, myPlan], ([count, plan]) => {
  if (count === undefined || plan === null) return;
  syncLocks().catch((error) => console.warn("Could not update locked invitations:", error));
});

onMounted(refresh);
</script>

<style lang="scss" scoped>
.weddings-section {
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
.weddings-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
}

.toolbar-inner {
  max-width: 960px;
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
}

.back-link {
  color: var(--gold-dark);
  font-size: 1rem;
  text-decoration: none;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  &.danger:hover:not(:disabled) { color: #b3261e; border-color: #b3261e; background: none; }
}

.btn-primary {
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  border: none;
  color: var(--dark);
  &:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(154, 122, 69, 0.35); }
}

.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
  padding: 4px 10px 4px 4px;
  border-radius: 30px;
  background: var(--blush);
  font-size: 0.78rem;
  color: var(--text);
  img, i { width: 24px; height: 24px; border-radius: 50%; font-size: 24px; line-height: 1; flex-shrink: 0; }
  span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

/* ── Body ── */
.weddings-body {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

.plan-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--blush);
  font-size: 0.8rem;
  i { color: var(--gold-dark); }
}

.upgrade-link {
  margin-left: auto;
  padding: 4px 12px;
  border: 1px solid var(--gold);
  border-radius: 30px;
  background: #fff;
  color: var(--gold-dark);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--gold); color: var(--dark); }

  &.inline {
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    text-decoration: underline;
    &:hover { background: none; }
  }
}

.wedding-card.locked { opacity: 0.75; }

.new-card small { font-size: 0.72rem; color: var(--sage); }

.message {
  margin: 0 0 16px;
  font-size: 0.8rem;
  &.ok { color: var(--sage); }
  &.warn { color: var(--gold-dark); }
  &.error { color: #b3261e; }
}

.weddings-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 80px 16px;
  text-align: center;
}

.wedding-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.wedding-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 35%, transparent);
  border-radius: 16px;
  box-shadow: 0 4px 18px rgba(61, 44, 20, 0.05);
  overflow: hidden;
}

.new-card {
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 200px;
  border: 2px dashed var(--gold-light);
  background: transparent;
  box-shadow: none;
  color: var(--gold-dark);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s ease;
  i { font-size: 1.5rem; }
  &:hover:not(:disabled) { background: var(--blush); }
  &:disabled { opacity: 0.6; cursor: wait; }
}

.card-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 16px 16px;
  text-align: center;
  color: inherit;
  text-decoration: none;

  &:hover h2 { color: var(--gold-dark); }

  .monogram {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--blush);
    color: var(--gold-dark);
    font-family: 'Cinzel Decorative', cursive;
    font-size: 0.85rem;
  }

  h2 {
    margin: 6px 0 0;
    font-family: 'Cinzel Decorative', cursive;
    font-size: 1.05rem;
    color: var(--dark);
    transition: color 0.2s ease;
  }

  .date { font-size: 0.8rem; color: var(--gold-dark); }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 30px;
    font-size: 0.72rem;
  }

  .locked-badge { background: #fbeae8; color: #8c1d18; }
  .edit-locked-badge { background: #fdf3e1; color: #6b4e1f; }
  .hidden-badge { background: #ecebe8; color: #4a4640; }

  .visitor-note {
    font-size: 0.72rem;
    line-height: 1.4;
    &.warn { color: var(--gold-dark); }
    &.full { color: #b3261e; }
  }

  .visitors {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border-radius: 30px;
    background: var(--blush);
    font-size: 0.72rem;
    color: var(--text);
    i { color: var(--gold-dark); }
    &.warn { background: #fdf0d5; }
    &.full { background: #fbeae8; color: #8c1d18; }
  }

  .meta {
    font-size: 0.7rem;
    color: var(--sage);
    strong { font-family: ui-monospace, monospace; letter-spacing: 0.08em; color: var(--text); }
  }
}

.card-actions {
  display: flex;
  gap: 6px;
  padding: 12px 16px;
  border-top: 1px solid color-mix(in srgb, var(--gold-light) 35%, transparent);

  > :first-child { margin-right: auto; }
}
</style>
