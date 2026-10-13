<template>
  <Basic>
    <section class="settings-section">
      <!-- Toolbar -->
      <header class="settings-toolbar">
        <div class="toolbar-inner">
          <div class="toolbar-title">
            <router-link to="/" class="back-link" title="Back to site">
              <i class="fa-solid fa-arrow-left"></i>
            </router-link>
            <div>
              <h1>Settings</h1>
              <span class="status" :class="statusType">{{ statusText }}</span>
              <span v-if="weddingCode" class="code-chip">
                Code: <strong>{{ weddingCode }}</strong>
                <button type="button" title="Copy guest link" @click="copyShareLink">
                  <i class="fa-solid" :class="codeCopied ? 'fa-check' : 'fa-link'"></i> {{ codeCopied ? 'Copied' : 'Copy link' }}
                </button>
                <a :href="shareLink" target="_blank" rel="noopener" title="Open guest view">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </span>
              <span v-else-if="lastSaved !== null" class="code-chip">Save once to get your guest link</span>
            </div>
          </div>
          <div class="toolbar-actions">
            <button class="btn-ghost" @click="discard" :disabled="!isDirty" title="Discard unsaved changes">
              <i class="fa-solid fa-rotate-left"></i><span>Discard</span>
            </button>
            <button class="btn-ghost" @click="importInput.click()" title="Import a JSON file">
              <i class="fa-solid fa-file-import"></i><span>Import</span>
            </button>
            <button class="btn-ghost" @click="download" title="Download as JSON">
              <i class="fa-solid fa-download"></i><span>Export</span>
            </button>
            <button class="btn-primary" @click="save" :disabled="lastSaved === null || (!isDirty && weddingCode) || saving">
              <i class="fa-solid fa-floppy-disk"></i><span>{{ saving ? 'Saving…' : 'Save' }}</span>
            </button>
            <input ref="importInput" type="file" accept="application/json,.json" hidden @change="importFile" />
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
        <nav class="section-jump">
          <a v-for="s in sections" :key="s.id" :href="`#${s.id}`" @click.prevent="jumpTo(s.id)">{{ s.label }}</a>
        </nav>
      </header>

      <div v-if="lastSaved === null" class="settings-loading">
        <template v-if="loadError">
          <p>{{ loadError }}</p>
          <button class="btn-primary" @click="loadSaved"><i class="fa-solid fa-rotate-right"></i><span>Retry</span></button>
        </template>
        <p v-else><i class="fa-solid fa-spinner fa-spin"></i> Loading your wedding…</p>
      </div>

      <div v-else class="settings-body">

        <!-- Site -->
        <div class="card" id="site">
          <h2>Site</h2>
          <div class="grid">
            <label class="field span-2">
              <span>Browser tab title</span>
              <input v-model="wedding.site.title" />
            </label>
            <label class="field">
              <span>Monogram</span>
              <input v-model="wedding.site.monogram" placeholder="M&A" />
            </label>
          </div>
        </div>

        <!-- Theme -->
        <div class="card" id="theme">
          <h2>Theme</h2>
          <div class="theme-grid">
            <button
              v-for="theme in themes"
              :key="theme.id"
              type="button"
              class="theme-card"
              :class="{ selected: wedding.theme === theme.id }"
              :style="themePreviewStyle(theme)"
              @click="wedding.theme = theme.id"
            >
              <div class="theme-preview">
                <span class="tp-sub">You are invited</span>
                <span class="tp-names">{{ wedding.groom.shortName }} &amp; {{ wedding.bride.shortName }}</span>
                <span class="tp-body">Join us as we celebrate our wedding</span>
                <span class="tp-button">{{ wedding.site.monogram }}</span>
              </div>
              <div class="theme-swatches">
                <span v-for="c in ['cream', 'gold-light', 'gold', 'gold-dark', 'dark']" :key="c" :style="{ background: theme.colors[c] }"></span>
              </div>
              <div class="theme-meta">
                <strong>{{ theme.name }}</strong>
                <i v-if="wedding.theme === theme.id" class="fa-solid fa-circle-check"></i>
              </div>
              <p>{{ theme.description }}</p>
            </button>
          </div>
        </div>

        <!-- Groom & Bride -->
        <div class="card" v-for="key in ['groom', 'bride']" :key="key" :id="key">
          <h2>{{ key === 'groom' ? 'Groom' : 'Bride' }}</h2>
          <div class="partner-layout">
            <div class="photo-column">
              <img :src="wedding[key].photo" class="photo-preview" alt="" @click="photoInputs[key].click()" />
              <button class="btn-upload" @click="photoInputs[key].click()" :disabled="uploading === key">
                <i class="fa-solid" :class="uploading === key ? 'fa-spinner fa-spin' : 'fa-camera'"></i>
                {{ uploading === key ? 'Uploading…' : 'Upload photo' }}
              </button>
              <input
                :ref="(el) => (photoInputs[key] = el)"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                hidden
                @change="uploadPhoto(key, $event)"
              />
            </div>
            <div class="grid">
              <label class="field">
                <span>Full name</span>
                <input v-model="wedding[key].name" />
              </label>
              <label class="field">
                <span>Short name (home page)</span>
                <input v-model="wedding[key].shortName" />
              </label>
              <label class="field">
                <span>Role label</span>
                <input v-model="wedding[key].roleLabel" />
              </label>
              <label class="field">
                <span>Photo path</span>
                <input v-model="wedding[key].photo" />
              </label>
              <label class="field span-2">
                <span>Parents line</span>
                <input v-model="wedding[key].parents" />
              </label>
              <label class="field span-2">
                <span>Bio</span>
                <textarea v-model="wedding[key].bio" rows="4"></textarea>
              </label>
            </div>
          </div>

          <h3>Social links</h3>
          <div class="list">
            <div class="list-row" v-for="(social, i) in wedding[key].socials" :key="i">
              <select v-model="social.type" class="narrow">
                <option v-for="t in availableSocialTypes(wedding[key].socials, social)" :key="t" :value="t">{{ t }}</option>
              </select>
              <input v-model="social.url" placeholder="https://…" />
              <button class="icon-btn danger" @click="remove(wedding[key].socials, i)" title="Remove">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <button
            v-if="availableSocialTypes(wedding[key].socials).length"
            class="btn-add"
            @click="wedding[key].socials.push({ type: availableSocialTypes(wedding[key].socials)[0], url: '' })"
          >
            <i class="fa-solid fa-plus"></i> Add social link
          </button>
        </div>

        <!-- Hero -->
        <div class="card" id="hero">
          <h2>Home page</h2>
          <div class="grid">
            <label class="field span-2">
              <span>Invite line</span>
              <input v-model="wedding.hero.inviteLine" />
            </label>
            <label class="field">
              <span>Date text</span>
              <input v-model="wedding.hero.dateText" />
            </label>
            <label class="field">
              <span>Time text</span>
              <input v-model="wedding.hero.timeText" />
            </label>
            <label class="field span-2">
              <span>Location text</span>
              <input v-model="wedding.hero.locationText" />
            </label>
          </div>

          <h3>Background image</h3>
          <div class="background-picker">
            <div class="background-preview" @click="photoInputs.background.click()">
              <img v-if="wedding.hero.backgroundImage" :src="wedding.hero.backgroundImage" alt="" />
              <span v-else>No background image</span>
            </div>
            <div class="background-fields">
              <label class="field">
                <span>Image path</span>
                <input v-model="wedding.hero.backgroundImage" placeholder="/images/main.jpeg" />
              </label>
              <button class="btn-upload" @click="photoInputs.background.click()" :disabled="uploading === 'background'">
                <i class="fa-solid" :class="uploading === 'background' ? 'fa-spinner fa-spin' : 'fa-image'"></i>
                {{ uploading === 'background' ? 'Uploading…' : 'Upload background' }}
              </button>
              <input
                :ref="(el) => (photoInputs.background = el)"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                hidden
                @change="uploadBackground"
              />
            </div>
          </div>

          <h3>Countdown</h3>
          <div class="grid">
            <label class="field toggle">
              <input type="checkbox" v-model="wedding.hero.countdown.enabled" />
              <span>Show countdown</span>
            </label>
            <label class="field">
              <span>Counts down to</span>
              <input type="datetime-local" step="1" v-model="wedding.hero.countdown.target" />
            </label>
            <label class="field" v-for="(label, unit) in wedding.hero.countdown.labels" :key="unit">
              <span>Label for {{ unit }}</span>
              <input v-model="wedding.hero.countdown.labels[unit]" />
            </label>
          </div>
        </div>

        <!-- Navigation -->
        <div class="card" id="navigation">
          <h2>Navigation</h2>
          <div class="nav-table">
            <div class="nav-row nav-header">
              <span>Page</span>
              <span>Label</span>
              <span>Mobile label</span>
              <span>Icon</span>
            </div>
            <div class="nav-row" v-for="(item, key) in wedding.navigation" :key="key">
              <span class="nav-key">
                <i class="fa-solid" :class="item.icon"></i>
                {{ key }}
              </span>
              <label class="nav-field">
                <span class="nav-field-label">Label</span>
                <input v-model="item.label" />
              </label>
              <label class="nav-field">
                <span class="nav-field-label">Mobile label</span>
                <input v-model="item.shortLabel" />
              </label>
              <div class="nav-field nav-icon-field">
              <span class="nav-field-label">Icon</span>
              <div class="icon-picker" @click.stop>
                <button
                  type="button"
                  class="icon-picker-toggle"
                  :class="{ open: openIconPicker === key }"
                  @click="openIconPicker = openIconPicker === key ? '' : key"
                >
                  <i class="fa-solid" :class="item.icon"></i>
                  <span>{{ iconLabel(item.icon) }}</span>
                  <i class="fa-solid fa-chevron-down caret"></i>
                </button>
                <div v-if="openIconPicker === key" class="icon-picker-panel">
                  <button
                    v-for="icon in navIcons"
                    :key="icon"
                    type="button"
                    class="icon-option"
                    :class="{ selected: item.icon === icon }"
                    :title="iconLabel(icon)"
                    @click="item.icon = icon; openIconPicker = ''"
                  >
                    <i class="fa-solid" :class="icon"></i>
                  </button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Couple page -->
        <div class="card" id="couple-page">
          <h2>Couple page</h2>
          <div class="grid">
            <label class="field">
              <span>Sub title</span>
              <input v-model="wedding.couplePage.subTitle" />
            </label>
            <label class="field">
              <span>Title</span>
              <input v-model="wedding.couplePage.title" />
            </label>
          </div>
        </div>

        <!-- Events -->
        <div class="card" id="events">
          <h2>Events</h2>
          <div class="grid">
            <label class="field">
              <span>Sub title</span>
              <input v-model="wedding.eventsPage.subTitle" />
            </label>
            <label class="field">
              <span>Title</span>
              <input v-model="wedding.eventsPage.title" />
            </label>
            <label class="field">
              <span>Map button label</span>
              <input v-model="wedding.eventsPage.mapButtonLabel" />
            </label>
          </div>

          <div class="item-card" v-for="(event, i) in wedding.eventsPage.events" :key="i">
            <div class="item-head">
              <strong>{{ String(i + 1).padStart(2, '0') }} · {{ event.name || 'Untitled event' }}</strong>
              <ItemControls :list="wedding.eventsPage.events" :index="i" />
            </div>
            <div class="grid">
              <label class="field span-2">
                <span>Name</span>
                <input v-model="event.name" />
              </label>
              <label class="field">
                <span>Day</span>
                <input v-model="event.day" placeholder="12" />
              </label>
              <label class="field">
                <span>Month</span>
                <input v-model="event.month" placeholder="July" />
              </label>
              <label class="field span-2">
                <span>Time</span>
                <input v-model="event.time" />
              </label>
              <label class="field">
                <span>Venue</span>
                <input v-model="event.venue" />
              </label>
              <label class="field">
                <span>Location</span>
                <input v-model="event.location" />
              </label>
              <label class="field span-2">
                <span>Map URL (optional, otherwise searches venue + location)</span>
                <input v-model="event.mapUrl" placeholder="https://maps.app.goo.gl/…" />
              </label>
            </div>
          </div>
          <button class="btn-add" @click="wedding.eventsPage.events.push({ name: '', day: '', month: '', time: '', venue: '', location: '', mapUrl: '' })">
            <i class="fa-solid fa-plus"></i> Add event
          </button>
        </div>

        <!-- Story -->
        <div class="card" id="story">
          <h2>Story</h2>
          <div class="grid">
            <label class="field">
              <span>Sub title</span>
              <input v-model="wedding.storyPage.subTitle" />
            </label>
            <label class="field">
              <span>Title</span>
              <input v-model="wedding.storyPage.title" />
            </label>
            <label class="field">
              <span>Year label</span>
              <input v-model="wedding.storyPage.yearLabel" />
            </label>
          </div>

          <div class="item-card" v-for="(milestone, i) in wedding.storyPage.milestones" :key="i">
            <div class="item-head">
              <strong>{{ String(i + 1).padStart(2, '0') }} · {{ milestone.name || 'Untitled milestone' }}</strong>
              <ItemControls :list="wedding.storyPage.milestones" :index="i" />
            </div>
            <div class="grid">
              <label class="field span-2">
                <span>Name</span>
                <input v-model="milestone.name" />
              </label>
              <label class="field">
                <span>Day</span>
                <input v-model="milestone.day" />
              </label>
              <label class="field">
                <span>Month</span>
                <input v-model="milestone.month" />
              </label>
              <label class="field">
                <span>Year</span>
                <input v-model="milestone.year" />
              </label>
              <label class="field span-2">
                <span>Note</span>
                <textarea v-model="milestone.note" rows="2"></textarea>
              </label>
            </div>
          </div>
          <button class="btn-add" @click="wedding.storyPage.milestones.push({ name: '', day: '', month: '', year: '', note: '' })">
            <i class="fa-solid fa-plus"></i> Add milestone
          </button>
        </div>

        <!-- Moments -->
        <div class="card" id="moments">
          <h2>Moments gallery</h2>
          <div class="grid">
            <label class="field">
              <span>Sub title</span>
              <input v-model="wedding.momentsPage.subTitle" />
            </label>
            <label class="field">
              <span>Title</span>
              <input v-model="wedding.momentsPage.title" />
            </label>
          </div>
          <ImageList :images="wedding.momentsPage.images" placeholder="/images/1.jpeg" upload-key="gallery" />
        </div>

        <!-- Save the date -->
        <div class="card" id="save-the-date">
          <h2>Save the date popup</h2>
          <div class="grid">
            <label class="field toggle">
              <input type="checkbox" v-model="wedding.saveTheDate.enabled" />
              <span>Show popup on open</span>
            </label>
            <label class="field">
              <span>Hide after (leave empty to never expire)</span>
              <input type="datetime-local" step="1" v-model="wedding.saveTheDate.expiresAt" />
            </label>
            <label class="field">
              <span>Slide every (seconds)</span>
              <input type="number" min="1" :value="wedding.saveTheDate.autoplayMs / 1000"
                @input="wedding.saveTheDate.autoplayMs = Math.max(1, Number($event.target.value) || 1) * 1000" />
            </label>
          </div>
          <ImageList :images="wedding.saveTheDate.images" placeholder="/save_the_date/1.jpeg" upload-key="save-the-date" />
        </div>

      </div>

      <!-- Theme changed toast -->
      <Transition name="toast">
        <div v-if="themeToast" class="theme-toast" role="status">
          <i class="fa-solid fa-palette toast-icon"></i>
          <div class="toast-text">
            <strong>{{ themeToast }} theme applied</strong>
            <span>New theme applied, go to Home to see the results</span>
          </div>
          <router-link to="/" class="toast-link">Go to Home</router-link>
          <button class="toast-close" @click="themeToast = ''" aria-label="Dismiss">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </Transition>
    </section>
  </Basic>
</template>

<script setup>
import { ref, computed, h, watch, onMounted, onBeforeUnmount } from "vue";
import Basic from "@/views/Basic.vue";
import { useWeddingStore, weddingCode } from "@/stores/wedding";
import { useAuthStore } from "@/stores/auth";
import { uploadImage as uploadToCloudinary } from "@/services/cloudinary";
import { useRouter } from "vue-router";
import { themes, fontsUrl, getTheme } from "@/config/themes";

const wedding = useWeddingStore();
const auth = useAuthStore();
const router = useRouter();

const sections = [
  { id: "site", label: "Site" },
  { id: "theme", label: "Theme" },
  { id: "groom", label: "Groom" },
  { id: "bride", label: "Bride" },
  { id: "hero", label: "Home" },
  { id: "navigation", label: "Navigation" },
  { id: "couple-page", label: "Couple" },
  { id: "events", label: "Events" },
  { id: "story", label: "Story" },
  { id: "moments", label: "Moments" },
  { id: "save-the-date", label: "Save the date" },
];

const socialTypes = ["instagram", "facebook", "whatsapp"];

// Icons offered in the navigation icon picker (Font Awesome 6 free, solid)
const navIcons = [
  "fa-house", "fa-house-chimney", "fa-heart", "fa-heart-circle-check", "fa-hand-holding-heart",
  "fa-ring", "fa-gem", "fa-crown", "fa-infinity", "fa-dove",
  "fa-calendar", "fa-calendar-check", "fa-calendar-days", "fa-calendar-day", "fa-clock",
  "fa-list-check", "fa-clipboard-list", "fa-timeline", "fa-route", "fa-compass",
  "fa-user-friends", "fa-users", "fa-people-group", "fa-person-dress", "fa-hands-holding",
  "fa-handshake", "fa-face-smile", "fa-images", "fa-image", "fa-camera",
  "fa-camera-retro", "fa-photo-film", "fa-video", "fa-book-open", "fa-book",
  "fa-feather", "fa-pen-fancy", "fa-scroll", "fa-envelope", "fa-envelope-open-text",
  "fa-location-dot", "fa-map-location-dot", "fa-church", "fa-place-of-worship", "fa-om",
  "fa-champagne-glasses", "fa-wine-glass", "fa-cake-candles", "fa-gift", "fa-gifts",
  "fa-utensils", "fa-music", "fa-star", "fa-sun", "fa-moon",
  "fa-seedling", "fa-leaf", "fa-spa", "fa-wand-magic-sparkles", "fa-hotel",
];
const iconLabel = (icon) => icon.replace(/^fa-/, "").replace(/-/g, " ");
const openIconPicker = ref("");
const closeIconPicker = () => { openIconPicker.value = ""; };

// Platforms not yet used by another link (the current link keeps its own)
const availableSocialTypes = (socials, current = null) =>
  socialTypes.filter((t) => t === current?.type || !socials.some((s) => s !== current && s.type === t));

/* ── Theme picker ── */
const themePreviewStyle = (theme) => ({
  ...Object.fromEntries(Object.entries(theme.colors).map(([k, v]) => [`--${k}`, v])),
  ...Object.fromEntries(Object.entries(theme.fonts).map(([k, v]) => [`--font-${k}`, v])),
});

// Confirmation shown whenever a different theme is picked
const themeToast = ref("");
let toastTimer = null;
watch(
  () => wedding.theme,
  (id) => {
    themeToast.value = getTheme(id).name;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { themeToast.value = ""; }, 6000);
  }
);

// Load every theme's fonts so the previews render correctly
const previewFonts = document.createElement("link");
previewFonts.rel = "stylesheet";
previewFonts.href = fontsUrl([...new Set(themes.flatMap((t) => t.googleFonts))]);

/* ── List helpers ── */
const remove = (list, i) => list.splice(i, 1);
const move = (list, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
};

// Up / down / delete buttons for a list item
const ItemControls = (props) =>
  h("div", { class: "item-controls" }, [
    h("button", { class: "icon-btn", title: "Move up", disabled: props.index === 0, onClick: () => move(props.list, props.index, -1) }, [h("i", { class: "fa-solid fa-arrow-up" })]),
    h("button", { class: "icon-btn", title: "Move down", disabled: props.index === props.list.length - 1, onClick: () => move(props.list, props.index, 1) }, [h("i", { class: "fa-solid fa-arrow-down" })]),
    h("button", { class: "icon-btn danger", title: "Remove", onClick: () => remove(props.list, props.index) }, [h("i", { class: "fa-solid fa-trash" })]),
  ]);
ItemControls.props = ["list", "index"];

// Editable list of image paths with thumbnails
const ImageList = (props) =>
  h("div", { class: "image-list" }, [
    ...props.images.map((src, i) =>
      h("div", { class: "image-row", key: i }, [
        h("img", { src, class: "thumb", alt: "" }),
        h("input", { value: src, placeholder: props.placeholder, onInput: (e) => (props.images[i] = e.target.value) }),
        h(ItemControls, { list: props.images, index: i }),
      ])
    ),
    h("div", { class: "image-list-actions" }, [
      h(
        "button",
        {
          class: "btn-upload",
          disabled: uploading.value === props.uploadKey,
          onClick: (e) => e.currentTarget.parentElement.querySelector("input[type=file]").click(),
        },
        uploading.value === props.uploadKey
          ? [h("i", { class: "fa-solid fa-spinner fa-spin" }), ` Uploading ${uploadProgress.value}…`]
          : [h("i", { class: "fa-solid fa-cloud-arrow-up" }), " Upload images"]
      ),
      h("input", {
        type: "file",
        accept: "image/jpeg,image/png,image/webp,image/gif,image/avif",
        multiple: true,
        hidden: true,
        onChange: (e) => uploadMany(props.uploadKey, props.images, e),
      }),
      h("button", { class: "btn-add", onClick: () => props.images.push("") }, [h("i", { class: "fa-solid fa-plus" }), " Add path"]),
    ]),
  ]);
ImageList.props = ["images", "placeholder", "uploadKey"];

/* ── Save / import / export ── */
// null until the user's wedding has loaded from Firestore
const lastSaved = ref(null);
const loadError = ref("");
const isDirty = computed(() => lastSaved.value !== null && JSON.stringify(wedding.snapshot()) !== lastSaved.value);

const loadSaved = async () => {
  loadError.value = "";
  try {
    await wedding.loadForUser(auth.user.uid);
    lastSaved.value = JSON.stringify(wedding.snapshot());
  } catch (error) {
    loadError.value = `Could not load your wedding: ${error.message}`;
  }
};

const logout = async () => {
  if (isDirty.value && !confirm("You have unsaved changes. Sign out anyway?")) return;
  await auth.logout();
  router.replace({ name: "login" });
};
const saving = ref(false);
const message = ref("");
const messageType = ref("");

const statusText = computed(() =>
  message.value || loadError.value || (lastSaved.value === null ? "Loading…" : isDirty.value ? "Unsaved changes" : "All changes saved"));
const statusType = computed(() => messageType.value || (loadError.value ? "error" : isDirty.value || lastSaved.value === null ? "warn" : "ok"));

const flash = (text, type) => {
  message.value = text;
  messageType.value = type;
  setTimeout(() => { message.value = ""; messageType.value = ""; }, 4000);
};

const save = async () => {
  saving.value = true;
  try {
    const body = JSON.stringify(wedding.snapshot());
    await wedding.saveForUser(auth.user.uid);
    lastSaved.value = body;
    flash("Saved", "ok");
  } catch (error) {
    flash(`Save failed: ${error.message}`, "error");
  } finally {
    saving.value = false;
  }
};

// What guests open: https://<site>/<code>
const shareLink = computed(() => weddingCode.value && `${window.location.origin}/${weddingCode.value}`);
const codeCopied = ref(false);
const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    codeCopied.value = true;
    setTimeout(() => { codeCopied.value = false; }, 1500);
  } catch {
    flash(`Could not copy, share this link: ${shareLink.value}`, "error");
  }
};

const discard = () => {
  if (!confirm("Discard all unsaved changes?")) return;
  wedding.load(JSON.parse(lastSaved.value));
  flash("Changes discarded", "ok");
};

const download = () => {
  const blob = new Blob([JSON.stringify(wedding.snapshot(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "wedding.json";
  a.click();
  URL.revokeObjectURL(a.href);
};

/* ── Photo upload ── */
const photoInputs = {};
const uploading = ref("");

// Uploads one file to Cloudinary and returns its URL (or null)
const uploadFile = async (key, file) => {
  if (!file.type.startsWith("image/")) {
    flash(`${file.name} is not an image`, "error");
    return null;
  }

  try {
    return await uploadToCloudinary(file, { uid: auth.user.uid, key });
  } catch (error) {
    flash(`Upload failed for ${file.name}: ${error.message}`, "error");
    return null;
  }
};

// Single-image picker (groom, bride, background)
const uploadImage = async (key, e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return null;
  uploading.value = key;
  try {
    return await uploadFile(key, file);
  } finally {
    uploading.value = "";
  }
};

// Multi-image picker: uploads each file in turn and appends it to the list
const uploadProgress = ref("");
const uploadMany = async (key, list, e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (!files.length) return;

  uploading.value = key;
  let added = 0;
  try {
    for (const [i, file] of files.entries()) {
      uploadProgress.value = `${i + 1}/${files.length}`;
      const path = await uploadFile(key, file);
      if (path) {
        list.push(path);
        added++;
      }
    }
  } finally {
    uploading.value = "";
    uploadProgress.value = "";
  }
  if (added) flash(`${added} image${added > 1 ? "s" : ""} added, click Save to keep them`, "warn");
};

const uploadPhoto = async (key, e) => {
  const path = await uploadImage(key, e);
  if (!path) return;
  wedding[key].photo = path;
  flash(`${key === "groom" ? "Groom" : "Bride"} photo uploaded, click Save to keep it`, "warn");
};

const uploadBackground = async (e) => {
  const path = await uploadImage("background", e);
  if (!path) return;
  wedding.hero.backgroundImage = path;
  flash("Background uploaded, click Save to keep it", "warn");
};

const importInput = ref(null);
const importFile = async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    wedding.load(JSON.parse(await file.text()));
    flash(`Imported ${file.name} — review and Save to keep it`, "warn");
  } catch (error) {
    flash(`Import failed: ${error.message}`, "error");
  }
};

const jumpTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

// Warn before leaving with unsaved changes
const beforeUnload = (e) => {
  if (isDirty.value) e.preventDefault();
};
onMounted(() => {
  loadSaved();
  window.addEventListener("beforeunload", beforeUnload);
  document.addEventListener("click", closeIconPicker);
  document.head.appendChild(previewFonts);
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", beforeUnload);
  document.removeEventListener("click", closeIconPicker);
  previewFonts.remove();
  clearTimeout(toastTimer);
});
</script>

<style lang="scss" scoped>
.settings-section {
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

.settings-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 80px 16px;
  text-align: center;
}

/* ── Toolbar ── */
.settings-toolbar {
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
  padding: 14px 16px 8px;
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

.code-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 0.72rem;
  color: var(--text);
  flex-wrap: wrap;
  strong { font-family: ui-monospace, monospace; letter-spacing: 0.08em; color: var(--dark); }
  button, a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
    border-radius: 30px;
    background: none;
    font-size: 0.7rem;
    color: var(--gold-dark);
    text-decoration: none;
    &:hover { background: var(--blush); }
  }
}

.status {
  font-size: 0.72rem;
  letter-spacing: 0.5px;
  &.ok { color: var(--sage); }
  &.warn { color: var(--gold-dark); }
  &.error { color: #b3261e; }
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
  transition: all 0.2s ease;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.btn-ghost {
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  color: var(--text);
  &:hover:not(:disabled) { background: var(--blush); }
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

.btn-primary {
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  border: none;
  color: var(--dark);
  &:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(154, 122, 69, 0.35); }
}

.section-jump {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 16px 10px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;

  a {
    flex-shrink: 0;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text);
    opacity: 0.65;
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 20px;
    background: var(--blush);
    &:hover { opacity: 1; }
  }
}

/* ── Body ── */
.settings-body {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 35%, transparent);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 18px rgba(61, 44, 20, 0.05);
  scroll-margin-top: 120px;

  h2 {
    font-family: 'Cinzel Decorative', cursive;
    font-size: 1.05rem;
    color: var(--gold-dark);
    margin: 0 0 16px;
  }

  h3 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--sage);
    margin: 22px 0 10px;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.span-2 { grid-column: span 2; }

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  > span {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text);
    opacity: 0.7;
  }

  &.toggle {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    > span { text-transform: none; letter-spacing: 0; font-size: 0.88rem; opacity: 1; }
    input { width: 18px; height: 18px; accent-color: var(--gold-dark); }
  }
}

:deep(.image-row input),
input:not([type="checkbox"]):not([type="color"]),
textarea,
select {
  width: 100%;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 0.88rem;
  font-family: inherit;
  color: var(--dark);
  background: #fffdf9;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: var(--gold-dark);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--gold-light) 40%, transparent);
  }
}

textarea { resize: vertical; line-height: 1.5; }

/* ── Theme toast ── */
.theme-toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 20;
  width: min(560px, calc(100vw - 32px));
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 16px;
  background: var(--dark);
  color: var(--cream);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(26, 18, 8, 0.3);
}

.toast-icon { color: var(--gold); font-size: 1.1rem; flex-shrink: 0; }

.toast-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  strong { font-size: 0.85rem; color: var(--gold-light); }
  span { font-size: 0.78rem; opacity: 0.85; }
}

.toast-link {
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
  color: var(--dark);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 30px;
  white-space: nowrap;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--cream);
  opacity: 0.6;
  cursor: pointer;
  &:hover { opacity: 1; }
}

.toast-enter-active,
.toast-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translate(-50%, 16px); }

/* ── Theme picker ── */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.theme-card {
  text-align: left;
  background: #fff;
  border: 1px solid #ece3d3;
  border-radius: 14px;
  padding: 10px;
  cursor: pointer;
  font-family: 'Montserrat', sans-serif;
  color: #3d2c14;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;

  &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(61, 44, 20, 0.08); }
  &.selected { border-color: #9a7a45; box-shadow: 0 0 0 2px #e8d5a3; }

  p { font-size: 0.72rem; opacity: 0.7; margin: 2px 0 0; line-height: 1.4; }
}

.theme-preview {
  /* Rendered with the theme's own variables, set inline */
  background: var(--cream);
  border-radius: 10px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  border: 1px solid color-mix(in srgb, var(--gold-light) 50%, transparent);

  .tp-sub {
    font-family: var(--font-serif);
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--sage);
  }
  .tp-names {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: var(--gold-dark);
    line-height: 1.2;
  }
  .tp-body {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 0.8rem;
    color: var(--text);
  }
  .tp-button {
    margin-top: 6px;
    font-family: var(--font-display);
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--on-accent);
    background: linear-gradient(135deg, var(--gold-light), var(--gold-dark));
    border-radius: 50%;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.theme-swatches {
  display: flex;
  margin: 10px 0 8px;
  border-radius: 6px;
  overflow: hidden;
  height: 10px;
  span { flex: 1; }
}

.theme-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  strong { font-size: 0.85rem; color: #1a1208; }
  i { color: #9a7a45; }
}

/* ── Partner ── */
.partner-layout {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 20px;
  align-items: start;
}

.background-picker {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  align-items: start;
}

.background-preview {
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  overflow: hidden;
  background: var(--blush);
  border: 1px solid var(--blush);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.background-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  .field { width: 100%; }
}

:deep(.image-list-actions) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 6px;

  .btn-add { margin-top: 0; }
}

:deep(.image-list-actions .btn-upload) {
  padding: 7px 16px;
  font-size: 0.78rem;
}

.photo-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-upload,
:deep(.btn-upload) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--blush);
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  color: var(--text);
  border-radius: 30px;
  padding: 6px 10px;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) { border-color: var(--gold-dark); color: var(--dark); }
  &:disabled { opacity: 0.6; cursor: wait; }
}

.photo-preview {
  cursor: pointer;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid var(--blush);
  background: var(--blush);
}

/* ── Lists ── */
.list,
:deep(.image-list) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-row,
:deep(.image-row) {
  display: flex;
  gap: 8px;
  align-items: center;
}

.narrow { width: 140px !important; flex-shrink: 0; }

:deep(.image-list) { margin-top: 18px; }

:deep(.image-row input) { flex: 1; }

:deep(.thumb) {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--blush);
  flex-shrink: 0;
}

.item-card {
  border: 1px solid var(--blush);
  border-radius: 12px;
  padding: 14px;
  margin-top: 16px;
  background: #fffdf9;
}

.item-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;

  strong {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.05rem;
    color: var(--dark);
  }
}

:deep(.item-controls) {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn,
:deep(.icon-btn) {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--gold-light) 70%, transparent);
  background: #fff;
  color: var(--text);
  font-size: 0.75rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover:not(:disabled) { background: var(--blush); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
  &.danger:hover { background: #fbe9e7; color: #b3261e; border-color: #f2b8b5; }
}

.btn-add,
:deep(.btn-add) {
  margin-top: 14px;
  align-self: flex-start;
  background: none;
  border: 1px dashed var(--gold);
  color: var(--gold-dark);
  border-radius: 30px;
  padding: 7px 16px;
  font-size: 0.78rem;
  cursor: pointer;
  &:hover { background: var(--blush); }
}

/* ── Navigation table ── */
.nav-table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-row {
  display: grid;
  grid-template-columns: 110px 1fr 1fr 1fr;
  gap: 12px;
  align-items: center;
}

.nav-header span {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
}

.nav-key {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
  i { width: 16px; text-align: center; color: var(--gold-dark); font-size: 0.8rem; }
}

.nav-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

/* Per-field labels are only needed once the table collapses on mobile */
.nav-field-label {
  display: none;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.7;
}

.icon-picker {
  position: relative;
}

.icon-picker-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  border-radius: 10px;
  padding: 8px 10px;
  background: #fffdf9;
  font-size: 0.85rem;
  color: var(--dark);
  text-transform: capitalize;
  cursor: pointer;
  text-align: left;

  i:first-child { width: 18px; color: var(--gold-dark); text-align: center; }
  span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .caret { font-size: 0.65rem; opacity: 0.5; transition: transform 0.2s; }

  &.open {
    border-color: var(--gold-dark);
    .caret { transform: rotate(180deg); }
  }
}

.icon-picker-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 15;
  width: 292px;
  max-height: 260px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  padding: 10px;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--gold-light) 80%, transparent);
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(61, 44, 20, 0.15);
}

.icon-option {
  aspect-ratio: 1;
  border: 1px solid transparent;
  border-radius: 8px;
  background: none;
  color: var(--text);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { background: var(--blush); color: var(--gold-dark); }
  &.selected {
    background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
    color: var(--dark);
  }
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
  .span-2 { grid-column: auto; }
  .partner-layout { grid-template-columns: 1fr; }
  .photo-column { width: 140px; }
  .background-picker { grid-template-columns: 1fr; }
  .toolbar-actions span { display: none; }
  .nav-table { gap: 12px; }
  .nav-header { display: none; }
  .nav-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 12px;
    border: 1px solid var(--blush);
    border-radius: 12px;
    background: #fffdf9;
  }
  .nav-key { grid-column: span 2; font-size: 0.95rem; }
  .nav-field-label { display: block; }
  .nav-icon-field { grid-column: span 2; }
  .icon-picker-panel { left: 0; right: auto; width: 100%; }
}
</style>
