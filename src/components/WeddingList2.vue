<template>
  <Basic>
    <section class="m-list-page">
      <!-- Top bar -->
      <header class="m-top">
        <router-link to="/" class="m-icon" aria-label="Back to site">
          <i class="fa-solid fa-arrow-left"></i>
        </router-link>
        <h1>Invitations</h1>
        <button v-if="auth.user" type="button" class="m-avatar" aria-label="Account" @click="accountOpen = true">
          <img v-if="auth.user.photoURL" :src="auth.user.photoURL" alt="" referrerpolicy="no-referrer" />
          <span v-else>{{ initials }}</span>
        </button>
      </header>

      <main class="m-main">
        <!-- Plan usage -->
        <div v-if="weddings !== null" class="m-plan">
          <div class="m-plan-text">
            <strong>{{ limits.label }} plan</strong>
            <span>{{ weddings.length }} of {{ limits.invitations }} invitation{{ limits.invitations === 1 ? '' : 's' }} used</span>
          </div>
          <button v-if="planId === 'free'" type="button" class="m-btn-sm" @click="showUpgrade()">
            <i class="fa-solid fa-bolt"></i> Upgrade
          </button>
          <div class="m-meter"><span :style="{ width: `${Math.min(100, (weddings.length / limits.invitations) * 100)}%` }"></span></div>
        </div>

        <!-- Loading / error -->
        <div v-if="weddings === null" class="m-state">
          <template v-if="loadError">
            <i class="fa-solid fa-circle-exclamation m-state-icon error"></i>
            <p>{{ loadError }}</p>
            <button class="m-btn" @click="refresh"><i class="fa-solid fa-rotate-right"></i> Retry</button>
          </template>
          <template v-else>
            <div v-for="n in 2" :key="n" class="m-skeleton"></div>
          </template>
        </div>

        <!-- Empty -->
        <div v-else-if="!weddings.length" class="m-state">
          <i class="fa-regular fa-envelope-open m-state-icon"></i>
          <h2>No invitations yet</h2>
          <p>Create your first invitation and share it with your guests in minutes.</p>
        </div>

        <!-- List -->
        <template v-else>
          <p class="m-group">Your invitations</p>
          <div class="m-cards">
            <article v-for="w in weddings" :key="w.id" class="m-card" :class="{ locked: w.locked }">
              <router-link :to="editRoute(w)" class="m-card-main">
                <span class="m-mono">{{ initialsOf(w) }}</span>
                <span class="m-card-text">
                  <strong>{{ coupleNames(w) }}</strong>
                  <small>
                    {{ w.config.hero?.dateText || 'No date yet' }}
                    <template v-if="w.updatedAt"> · Edited {{ formatDate(w.updatedAt) }}</template>
                  </small>
                  <span class="m-tags">
                    <span class="m-tag" :class="statusOf(w).type"><i class="m-dot"></i>{{ statusOf(w).label }}</span>
                    <span v-if="w.hidden" class="m-tag muted"><i class="fa-solid fa-eye-slash"></i> Hidden</span>
                    <span v-if="w.id in views" class="m-tag" :class="visitorState(views[w.id])">
                      <i class="fa-solid fa-eye"></i> {{ views[w.id] }}
                    </span>
                  </span>
                </span>
              </router-link>
              <button type="button" class="m-icon" aria-label="More actions" @click="sheetFor = w">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>

              <p v-if="visitorState(views[w.id]) === 'warn'" class="m-callout warn">
                Nearing the {{ limits.visitors }}-visitor limit.
                <button type="button" @click="showUpgrade('visitors')">Upgrade</button> to keep the link open.
              </p>
              <p v-else-if="visitorState(views[w.id]) === 'full'" class="m-callout error">
                Reached {{ limits.visitors }} visitors, new guests can't open the link.
                <button type="button" @click="showUpgrade('visitors')">Upgrade</button>
              </p>
              <p v-if="w.locked" class="m-callout error">
                Over your plan's limit, so this one is read-only and its link is off.
              </p>
            </article>
          </div>
        </template>
      </main>

      <!-- New invitation -->
      <footer v-if="weddings !== null" class="m-bottom">
        <button
          class="m-btn primary"
          :disabled="creating || (atLimit && planId !== 'free')"
          @click="atLimit && planId === 'free' ? showUpgrade('invitations') : (signing = true)"
        >
          <i class="fa-solid" :class="creating ? 'fa-spinner fa-spin' : atLimit ? 'fa-lock' : 'fa-plus'"></i>
          {{ creating ? 'Creating…' : atLimit ? (planId === 'free' ? `Upgrade for up to ${PLANS.plus.invitations}` : 'Plan limit reached') : 'New invitation' }}
        </button>
      </footer>

      <!-- Action sheet -->
      <Transition name="m-sheet">
        <div v-if="sheetFor" class="m-backdrop" @click.self="sheetFor = null">
          <div class="m-sheet" role="dialog" aria-modal="true" :aria-label="coupleNames(sheetFor)">
            <div class="m-sheet-grip"></div>
            <div class="m-sheet-head">
              <strong>{{ coupleNames(sheetFor) }}</strong>
              <small v-if="sheetFor.code">Code {{ sheetFor.code }}</small>
              <small v-else>Save it once to get a guest link</small>
            </div>
            <router-link :to="editRoute(sheetFor)" class="m-sheet-item">
              <i class="fa-solid" :class="sheetFor.locked || sheetFor.editLocked ? 'fa-eye' : 'fa-pen'"></i>{{ sheetFor.locked || sheetFor.editLocked ? 'View' : 'Edit' }}
            </router-link>
            <button v-if="!sheetFor.locked" type="button" class="m-sheet-item" :disabled="lockingId === sheetFor.id" @click="toggleEditLock(sheetFor)">
              <i class="fa-solid" :class="lockingId === sheetFor.id ? 'fa-spinner fa-spin' : sheetFor.editLocked ? 'fa-lock-open' : 'fa-lock'"></i>{{ sheetFor.editLocked ? 'Unlock editing' : 'Lock editing' }}
            </button>
            <button type="button" class="m-sheet-item" :disabled="hidingId === sheetFor.id" @click="toggleHidden(sheetFor)">
              <i class="fa-solid" :class="hidingId === sheetFor.id ? 'fa-spinner fa-spin' : sheetFor.hidden ? 'fa-eye' : 'fa-eye-slash'"></i>{{ sheetFor.hidden ? 'Show to guests' : 'Hide from guests' }}
            </button>
            <template v-if="sheetFor.code">
              <button type="button" class="m-sheet-item" @click="share(sheetFor)">
                <i class="fa-solid fa-share-nodes"></i>Share invitation
              </button>
              <button type="button" class="m-sheet-item" @click="copyMessage(sheetFor)">
                <i class="fa-solid fa-message"></i>Copy message
              </button>
              <button type="button" class="m-sheet-item" @click="copyLink(sheetFor)">
                <i class="fa-solid fa-link"></i>Copy link
              </button>
              <a :href="shareLink(sheetFor)" target="_blank" rel="noopener" class="m-sheet-item" @click="sheetFor = null">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>Open guest view
              </a>
            </template>
            <router-link :to="{ name: 'edit-wedding', params: { id: sheetFor.id }, query: { view: 'desktop' } }" class="m-sheet-item">
              <i class="fa-solid fa-sliders"></i>Full editor
            </router-link>
            <button type="button" class="m-sheet-item danger" :disabled="deletingId === sheetFor.id" @click="remove(sheetFor)">
              <i class="fa-solid" :class="deletingId === sheetFor.id ? 'fa-spinner fa-spin' : 'fa-trash'"></i>Delete
            </button>
            <button type="button" class="m-btn" @click="sheetFor = null">Cancel</button>
          </div>
        </div>
      </Transition>

      <!-- Account sheet -->
      <Transition name="m-sheet">
        <div v-if="accountOpen" class="m-backdrop" @click.self="accountOpen = false">
          <div class="m-sheet" role="dialog" aria-modal="true" aria-label="Account">
            <div class="m-sheet-grip"></div>
            <div class="m-sheet-head">
              <strong>{{ auth.user?.displayName || 'Account' }}</strong>
              <small>{{ auth.user?.email }}</small>
            </div>
            <button v-if="planId === 'free'" type="button" class="m-sheet-item" @click="accountOpen = false; showUpgrade()">
              <i class="fa-solid fa-bolt"></i>Upgrade to Plus
            </button>
            <router-link :to="{ name: 'settings', query: { view: 'desktop' } }" class="m-sheet-item">
              <i class="fa-solid fa-display"></i>Desktop view
            </router-link>
            <button type="button" class="m-sheet-item danger" @click="logout">
              <i class="fa-solid fa-right-from-bracket"></i>Sign out
            </button>
            <button type="button" class="m-btn" @click="accountOpen = false">Cancel</button>
          </div>
        </div>
      </Transition>

      <!-- Messages -->
      <Transition name="m-toast">
        <div v-if="message" class="m-toast" :class="messageType" role="status">{{ message }}</div>
      </Transition>
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

// Phone-first version of WeddingList.vue; opens invitations in the mobile editor (Settings2.vue)
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

const loadError = ref("");
const creating = ref(false);
const signing = ref(false);
const deletingId = ref("");
const sheetFor = ref(null);
const accountOpen = ref(false);

// 'ok' | 'warn' (past the warning threshold) | 'full' (guest link closed)
const visitorState = (count) =>
  count === undefined ? "ok" : count >= limits.value.visitors ? "full" : count >= limits.value.visitorWarning ? "warn" : "ok";

const statusOf = (w) =>
  w.locked ? { label: "Locked", type: "error" }
    : w.editLocked ? { label: "Locked for editing", type: "warn" }
    : visitorState(views.value[w.id]) === "full" ? { label: "Link closed", type: "error" }
    : w.code ? { label: "Live", type: "ok" }
    : { label: "Draft", type: "muted" };

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

const message = ref("");
const messageType = ref("");
let flashTimer = null;
const flash = (text, type) => {
  message.value = text;
  messageType.value = type;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { message.value = ""; }, 3500);
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

const editRoute = (w) => ({ name: "edit-wedding-mobile", params: { id: w.id } });

const coupleNames = (w) => {
  const groom = w.config.groom?.shortName;
  const bride = w.config.bride?.shortName;
  return groom && bride ? `${groom} & ${bride}` : w.config.site?.title || "Untitled invitation";
};
// Groom's initial & bride's initial, e.g. "A&M"
const initialsOf = (w) => {
  const initial = (p) => (p?.shortName || p?.name || "").trim().charAt(0).toUpperCase();
  const [groom, bride] = [initial(w.config.groom), initial(w.config.bride)];
  return groom && bride ? `${groom}&${bride}` : groom || bride || "♥";
};
const initials = computed(() => (auth.user?.displayName || auth.user?.email || "?").slice(0, 1).toUpperCase());

const formatDate = (date) => date.toLocaleDateString(undefined, { day: "numeric", month: "short" });

const shareLink = (w) => `${window.location.origin}/${w.code}`;

const copyLink = async (w) => {
  sheetFor.value = null;
  try {
    await navigator.clipboard.writeText(shareLink(w));
    flash("Guest link copied", "ok");
  } catch {
    flash(`Share this link: ${shareLink(w)}`, "warn");
  }
};

// The couple's share message with the guest link filled in
const copyMessage = async (w) => {
  sheetFor.value = null;
  const text = shareMessage(w.config, shareLink(w));
  try {
    await navigator.clipboard.writeText(text);
    flash("Invitation message copied", "ok");
  } catch {
    flash(text, "warn");
  }
};

// Native share sheet on phones, clipboard otherwise
const share = async (w) => {
  if (!navigator.share) return copyMessage(w);
  sheetFor.value = null;
  try {
    await navigator.share({ title: coupleNames(w), text: shareMessage(w.config, shareLink(w)) });
  } catch { /* closed the sheet */ }
};

// agreement = { version, name } from the signed agreement dialog
const create = async (agreement) => {
  if (atLimit.value) return;
  creating.value = true;
  try {
    const config = fitToPlan(blankWedding(), limits.value);
    const id = await createWedding(auth.user.uid, config, agreement);
    router.push({ name: "edit-wedding-mobile", params: { id } });
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
    sheetFor.value = null;
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
/* Same gold & cream look as Settings.vue (tokens shared with Settings2.vue) */
.m-list-page {
  --gold: #c9a96e;
  --gold-light: #e8d5a3;
  --gold-dark: #9a7a45;
  --cream: #fdf6ec;
  --dark: #1a1208;
  --blush: #f5e6d8;
  --sage: #8a9e8c;
  --bg: var(--cream);
  --surface: #ffffff;
  --field: #fffdf9;
  --subtle: var(--blush);
  --border: color-mix(in srgb, var(--gold-light) 45%, transparent);
  --border-strong: color-mix(in srgb, var(--gold-light) 80%, transparent);
  --text: #3d2c14;
  --muted: #8b7558;
  --faint: #bba98a;
  --accent: var(--gold-dark);
  --accent-soft: var(--blush);
  --ring: color-mix(in srgb, var(--gold-light) 40%, transparent);
  --red: #b3261e;
  --red-soft: #fbe9e7;
  --amber: var(--gold-dark);
  --amber-soft: #fbf3e2;
  --green: var(--sage);
  --green-soft: #eef2ee;
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
  padding: 6px 10px 6px 6px;
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
  transition: background 0.15s, color 0.15s;
  &:hover, &:active { background: var(--subtle); color: var(--text); }
}

.m-avatar {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 50%;
  overflow: hidden;
  background: var(--accent-soft);
  color: var(--accent);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
}

.m-main { padding: 16px; }

/* ── Plan ── */
.m-plan {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(61, 44, 20, 0.04);
}

.m-plan-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  strong { font-size: 0.9rem; font-weight: 600; }
  span { font-size: 0.8rem; color: var(--muted); }
}

.m-meter {
  flex-basis: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--subtle);
  overflow: hidden;
  span { display: block; height: 100%; border-radius: 3px; background: var(--accent); transition: width 0.3s; }
}

.m-btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  i { color: var(--accent); }
  &:hover { background: var(--subtle); }
}

/* ── States ── */
.m-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 24px;
  text-align: center;
  color: var(--muted);
  h2 { margin: 4px 0 0; font-size: 1.05rem; font-weight: 600; color: var(--text); }
  p { margin: 0; max-width: 280px; font-size: 0.88rem; }
}

.m-state-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 1.4rem;
  &.error { background: var(--red-soft); color: var(--red); }
}

.m-skeleton {
  width: 100%;
  height: 84px;
  border-radius: var(--radius);
  background: linear-gradient(90deg, var(--blush) 0%, var(--cream) 50%, var(--blush) 100%);
  background-size: 200% 100%;
  animation: m-shimmer 1.2s linear infinite;
}

@keyframes m-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

/* ── Cards ── */
.m-group {
  margin: 24px 4px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--sage);
}

.m-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.m-card {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 4px 4px 4px 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(61, 44, 20, 0.04);
  &.locked { opacity: 0.85; }
  > .m-icon { margin-top: 8px; }
}

.m-card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 12px;
  padding: 10px 4px 10px 14px;
  color: inherit;
  text-decoration: none;
}

.m-mono {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--subtle);
  border: 1px solid var(--border);
  overflow: hidden;
  padding: 0 4px;
  white-space: nowrap;
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--gold-dark);
}

.m-card-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong { font-size: 0.95rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  small { font-size: 0.8rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.m-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.m-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 11px;
  background: var(--subtle);
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 500;
  i { font-size: 0.65rem; }
  .m-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  &.ok { background: var(--green-soft); color: var(--green); }
  &.warn { background: var(--amber-soft); color: var(--amber); }
  &.error, &.full { background: var(--red-soft); color: var(--red); }
}

.m-callout {
  flex-basis: 100%;
  margin: 0 0 8px 14px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  &.warn { background: var(--amber-soft); color: #7a5c2e; }
  &.error { background: var(--red-soft); color: #8c1d18; }
  button { padding: 0; border: 0; background: none; color: inherit; font: inherit; font-weight: 600; text-decoration: underline; cursor: pointer; }
}

/* ── Bottom bar ── */
.m-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-top: 1px solid var(--border);
  .m-btn { width: 100%; }
}

.m-btn {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  &:hover:not(:disabled) { background: var(--subtle); }
  &.primary { border: 0; background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%); color: var(--dark); }
  &.primary:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(154, 122, 69, 0.35); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

/* ── Bottom sheets ── */
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
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: var(--surface);
  box-shadow: 0 -10px 30px rgba(61, 44, 20, 0.15);
  > .m-btn { margin-top: 8px; }
}

.m-sheet-grip {
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
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border);
  strong { font-size: 0.95rem; font-weight: 600; }
  small { font-size: 0.8rem; color: var(--muted); }
}

.m-sheet-item {
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
  &.danger, &.danger i { color: var(--red); }
  &:disabled { opacity: 0.5; }
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

/* ── Toast ── */
.m-toast {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(84px + env(safe-area-inset-bottom));
  z-index: 30;
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

/* Keep it phone-shaped on larger screens */
@media (min-width: 640px) {
  .m-main { max-width: 560px; margin: 0 auto; }
  .m-bottom { padding-left: calc(50% - 264px); padding-right: calc(50% - 264px); }
  .m-toast { max-width: 528px; margin: 0 auto; }
}
</style>
