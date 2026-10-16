<template>
  <Basic :class="{ 'has-preview': showPreview && previewDocked }">
    <section class="settings-section" @focusin="trackSection">
      <!-- Toolbar -->
      <header class="settings-toolbar">
        <div class="toolbar-inner">
          <div class="toolbar-title">
            <router-link :to="{ name: 'settings' }" class="back-link" title="Back to my invitations">
              <i class="fa-solid fa-arrow-left"></i>
            </router-link>
            <div>
              <h1>Settings</h1>
              <span class="status" :class="statusType">{{ statusText }}</span>
              <span v-if="weddingCode" class="code-chip">
                Code: <strong>{{ weddingCode }}</strong>
                <button type="button" title="Copy the share message with the guest link" @click="copyShareLink">
                  <i class="fa-solid" :class="codeCopied ? 'fa-check' : 'fa-link'"></i> {{ codeCopied ? 'Copied' : 'Copy invite' }}
                </button>
                <a :href="shareLink" target="_blank" rel="noopener" title="Open guest view">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
              </span>
              <span v-else-if="lastSaved !== null" class="code-chip">Save once to get your guest link</span>
            </div>
          </div>
          <div class="toolbar-actions">
            <button class="btn-ghost" @click="discard" :disabled="!isDirty || readOnly" title="Discard unsaved changes">
              <i class="fa-solid fa-rotate-left"></i><span>Discard</span>
            </button>
            <button
              class="btn-ghost"
              @click="toggleEditLock"
              :disabled="lastSaved === null || planLocked || lockBusy || (!editLocked && isDirty)"
              :title="editLocked ? 'Unlock to edit again' : isDirty ? 'Save or discard your changes before locking' : 'Lock so it can\'t be edited by mistake'"
            >
              <i class="fa-solid" :class="lockBusy ? 'fa-spinner fa-spin' : editLocked ? 'fa-lock-open' : 'fa-lock'"></i><span>{{ editLocked ? 'Unlock' : 'Lock' }}</span>
            </button>
            <button
              class="btn-ghost"
              @click="toggleHidden"
              :disabled="lastSaved === null || hideBusy"
              :title="weddingMeta.hidden ? 'Guests see a hidden page. Show it to them again' : 'Hide from guests'"
            >
              <i class="fa-solid" :class="hideBusy ? 'fa-spinner fa-spin' : weddingMeta.hidden ? 'fa-eye' : 'fa-eye-slash'"></i><span>{{ weddingMeta.hidden ? 'Show' : 'Hide' }}</span>
            </button>
            <button class="btn-ghost" @click="openHistory" :disabled="lastSaved === null" title="Earlier saved versions">
              <i class="fa-solid" :class="limits.history ? 'fa-clock-rotate-left' : 'fa-lock'"></i><span>History</span>
            </button>
            <router-link
              :to="{ name: 'traditional', query: { id: $route.params.id } }"
              class="btn-ghost"
              title="Design a printed invitation card and download it as a PDF (starts from the saved details)"
            >
              <i class="fa-solid fa-file-pdf"></i><span>Print card</span>
            </router-link>
            <template v-if="showImportExport">
            <button class="btn-ghost" @click="importInput.click()" :disabled="lastSaved === null || readOnly" title="Import a JSON file">
              <i class="fa-solid fa-file-import"></i><span>Import</span>
            </button>
            <button class="btn-ghost" @click="download" title="Download as JSON">
              <i class="fa-solid fa-download"></i><span>Export</span>
            </button>
            </template>
            <button
              v-if="shownIssues.length"
              type="button"
              class="issues-chip"
              :class="{ error: errorIssues.length }"
              :title="shownIssues[0].message"
              @click="jumpToIssue(shownIssues[0])"
            >
              <i class="fa-solid" :class="errorIssues.length ? 'fa-circle-exclamation' : 'fa-triangle-exclamation'"></i>
              {{ shownIssues.length }} need{{ shownIssues.length === 1 ? 's' : '' }} attention
            </button>
            <button
              v-if="canPreview"
              class="btn-ghost"
              :class="{ active: previewOpen }"
              @click="previewOpen = !previewOpen"
              :title="previewOpen ? 'Hide the live preview' : 'Show a live preview of the invitation'"
            >
              <i class="fa-solid fa-display"></i><span>Preview</span>
            </button>
            <button class="btn-primary" @click="save" :disabled="lastSaved === null || (!isDirty && weddingCode) || saving || readOnly || overList.length > 0">
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
        <nav class="section-jump" ref="sectionNav">
          <a
            v-for="(s, i) in sections"
            :key="s.id"
            :href="`#${s.id}`"
            :data-section="s.id"
            :class="{ active: activeSection === s.id, done: i < activeIndex }"
            :aria-current="activeSection === s.id ? 'step' : null"
            @click.prevent="jumpTo(s.id)"
          >
            <span class="step-num">{{ i + 1 }}</span>
            <span class="step-label">{{ s.label }}</span>
          </a>
        </nav>
      </header>

      <div v-if="lastSaved === null" class="settings-loading">
        <template v-if="loadError">
          <p>{{ loadError }}</p>
          <button class="btn-primary" @click="loadSaved"><i class="fa-solid fa-rotate-right"></i><span>Retry</span></button>
        </template>
        <p v-else><i class="fa-solid fa-spinner fa-spin"></i> Loading your wedding…</p>
      </div>

      <template v-else>
      <!-- Plan status (outside the fieldset so Upgrade works when read-only) -->
      <div v-if="myPlan !== null" class="plan-banners">
        <div v-if="planLocked" class="plan-banner error">
          <i class="fa-solid fa-lock"></i>
          <span>This invitation is over your {{ limits.label }} plan's limit of {{ limits.invitations }} invitation{{ limits.invitations === 1 ? '' : 's' }}, so it's read-only and its guest link is off. Upgrade, or delete another invitation to unlock it.</span>
          <button v-if="planId === 'free'" type="button" class="upgrade-link" @click="showUpgrade('invitations')">Upgrade</button>
        </div>
        <div v-else-if="overList.length" class="plan-banner error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Over your {{ limits.label }} plan's limits: {{ overList.join(', ') }}. The guest link is off and you can't save until you remove the extra items, or upgrade.</span>
          <button v-if="planId === 'free'" type="button" class="upgrade-link" @click="showUpgrade()">Upgrade</button>
        </div>
        <div v-if="weddingMeta.hidden" class="plan-banner locked">
          <i class="fa-solid fa-eye-slash"></i>
          <span>Hidden from guests: the guest link shows a "hidden" page. You can still preview it while signed in.</span>
          <button type="button" class="upgrade-link" :disabled="hideBusy" @click="toggleHidden">Show to guests</button>
        </div>
        <div v-if="editLocked && !planLocked" class="plan-banner locked">
          <i class="fa-solid fa-lock"></i>
          <span>This invitation is locked, so it can't be edited. Guests can still open it. Unlock it to make changes.</span>
          <button type="button" class="upgrade-link" :disabled="lockBusy" @click="toggleEditLock">Unlock</button>
        </div>
        <div class="plan-banner">
          <i class="fa-solid fa-crown"></i>
          <span>{{ limits.label }} plan · {{ weddingMeta.uploads }} / {{ limits.uploads }} image uploads used for this invitation</span>
          <button v-if="planId === 'free'" type="button" class="upgrade-link" @click="showUpgrade(uploadsLeft <= 0 ? 'uploads' : '')">Upgrade to Plus</button>
        </div>
      </div>

      <fieldset class="settings-body" :disabled="readOnly">


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
                <span class="tp-names">{{ wedding.groom.shortName || 'Groom' }} &amp; {{ wedding.bride.shortName || 'Bride' }}</span>
                <span class="tp-body">Join us as we celebrate our wedding</span>
                <span class="tp-button">{{ wedding.site.monogram || 'G&B' }}</span>
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
              <img :src="wedding[key].photo || PLACEHOLDER_PHOTO" class="photo-preview" alt="" @click="!readOnly && photoInputs[key].click()" />
              <button class="btn-upload" @click="photoInputs[key].click()" :disabled="uploading === key">
                <i class="fa-solid" :class="uploading === key ? 'fa-spinner fa-spin' : 'fa-camera'"></i>
                {{ uploading === key ? 'Uploading…' : 'Upload photo' }}
              </button>
              <button
                v-if="wedding[key].photo"
                type="button"
                class="btn-upload btn-clear"
                :disabled="uploading === key"
                @click="removeImage(wedding[key], 'photo', 'photo')"
              >
                <i class="fa-solid fa-trash"></i> Remove photo
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
                <input v-model="wedding[key].name" maxlength="60" :id="`${key}-name`" :class="issueClass(`${key}-name`)" :placeholder="`Eg: ${examples[key].name}`" />
                <FieldIssue :for="`${key}-name`" />
              </label>
              <label class="field">
                <span>Short name (home page)</span>
                <input v-model="wedding[key].shortName" maxlength="30" :id="`${key}-shortName`" :class="issueClass(`${key}-shortName`)" :placeholder="`Eg: ${examples[key].shortName}`" />
              </label>
              <label class="field">
                <span>Role label</span>
                <input v-model="wedding[key].roleLabel" maxlength="30" :placeholder="`Eg: ${examples[key].roleLabel}`" />
              </label>
              <label class="field">
                <span>Profession / passion</span>
                <input v-model="wedding[key].profession" maxlength="60" :list="`${key}-professions`" autocomplete="off" :placeholder="`Eg: ${examples[key].profession}`" />
                <datalist :id="`${key}-professions`">
                  <option v-for="job in PROFESSIONS" :key="job" :value="job" />
                </datalist>
              </label>
              <label class="field">
                <span>Father's name</span>
                <input :value="wedding[key].father" @input="setParentName(key, wedding[key], 'father', $event.target.value)" maxlength="60" :placeholder="`Eg: ${examples[key].father}`" />
              </label>
              <label class="field">
                <span>Mother's name</span>
                <input :value="wedding[key].mother" @input="setParentName(key, wedding[key], 'mother', $event.target.value)" maxlength="60" :placeholder="`Eg: ${examples[key].mother}`" />
              </label>
              <div v-if="parentsSuggestions(key).length" class="span-2 note-suggestions" role="group" :aria-label="`Parents line suggestions for the ${key}`">
                <span>Parents line suggestions</span>
                <button
                  v-for="text in parentsSuggestions(key)"
                  :key="text"
                  type="button"
                  class="note-suggestion"
                  :class="{ selected: wedding[key].parents === text }"
                  :aria-pressed="wedding[key].parents === text"
                  @click="wedding[key].parents = text"
                >{{ text }}</button>
              </div>
              <label class="field span-2">
                <span>Parents line <small class="field-hint">pick a suggestion or write your own</small></span>
                <input v-model="wedding[key].parents" maxlength="150" :placeholder="`Eg: ${examples[key].parents}`" />
              </label>
              <div class="field span-2">
                <label :for="`${key}-interests`">Interests</label>
                <InterestPills v-model="wedding[key].interests" :id="`${key}-interests`" :suggestions="INTERESTS" :max="MAX_INTERESTS" :placeholder="`Eg: ${examples[key].interests}`" />
              </div>
              <div v-if="bioSuggestions(wedding[key]).length" class="span-2 note-suggestions" role="group" :aria-label="`Bio suggestions for the ${key}`">
                <span>Bio suggestions</span>
                <button
                  v-for="text in bioSuggestions(wedding[key])"
                  :key="text"
                  type="button"
                  class="note-suggestion"
                  :class="{ selected: wedding[key].bio === text }"
                  :aria-pressed="wedding[key].bio === text"
                  @click="wedding[key].bio = text"
                >{{ text }}</button>
              </div>
              <label class="field span-2">
                <span>Bio <small class="field-hint">pick a suggestion or write your own</small></span>
                <textarea v-model="wedding[key].bio" rows="4" maxlength="600" :id="`${key}-bio`" :class="issueClass(`${key}-bio`)" :placeholder="`Eg: ${examples[key].bio}`"></textarea>
                <FieldIssue :for="`${key}-bio`" />
              </label>
            </div>
          </div>

          <h3>Social links</h3>
          <div class="social-toggles" role="group" :aria-label="`${key} social links`">
            <button
              v-for="t in SOCIAL_TYPES"
              :key="t"
              type="button"
              class="social-toggle"
              :class="{ open: socials.isOpen(key, t), filled: socials.url(key, t) }"
              :aria-expanded="socials.isOpen(key, t)"
              :title="socials.url(key, t) ? `Edit ${t} link` : `Add ${t} link`"
              @click="socials.toggle(key, t)"
            >
              <i class="fa-brands" :class="`fa-${t}`"></i>
              <span>{{ t }}</span>
              <i v-if="socials.url(key, t)" class="fa-solid fa-check social-check"></i>
            </button>
          </div>
          <div class="list">
            <template v-for="t in SOCIAL_TYPES" :key="t">
            <div v-if="socials.isOpen(key, t)" class="list-row">
              <span class="social-label narrow"><i class="fa-brands" :class="`fa-${t}`"></i> {{ t }}</span>
              <input
                type="url"
                maxlength="300"
                :data-social="`${key}:${t}`"
                :id="socials.id(key, t)"
                :class="issueClass(socials.id(key, t))"
                :value="socials.url(key, t)"
                :placeholder="socialExamples[t]"
                @input="socials.set(key, t, $event.target.value)"
              />
              <button class="icon-btn danger" @click="socials.remove(key, t)" title="Remove">
                <i class="fa-solid fa-trash"></i>
              </button>
              <FieldIssue :for="socials.id(key, t)" class="row-issue" />
            </div>
            </template>
          </div>
        </div>

        <!-- Couple page -->
        <div class="card" id="couple-page">
          <h2>Couple page</h2>
          <div class="grid">
            <label class="field">
              <span>Sub title</span>
              <select v-model="coupleSubTitleChoice">
                <option value="" disabled>Choose a sub title</option>
                <option v-for="text in coupleSubTitles" :key="text" :value="text">{{ text }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="coupleSubTitleChoice === CUSTOM"
                v-model="wedding.couplePage.subTitle"
                maxlength="60"
                placeholder="Eg: Meet the Couple"
              />
            </label>
            <label class="field">
              <span>Title</span>
              <select v-model="coupleTitleChoice">
                <option value="" disabled>Choose a title</option>
                <option v-for="text in coupleTitles" :key="text" :value="text">{{ text }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="coupleTitleChoice === CUSTOM"
                v-model="wedding.couplePage.title"
                maxlength="60"
                placeholder="Eg: Arjun & Meera"
              />
            </label>
          </div>
        </div>

        <!-- Events -->
        <div class="card" id="events">
          <h2>Events</h2>
          <div class="grid">
            <label class="field">
              <span>Sub title</span>
              <select v-model="eventsSubTitleChoice">
                <option value="" disabled>Choose a sub title</option>
                <option v-for="text in eventsSubTitles" :key="text" :value="text">{{ text }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="eventsSubTitleChoice === CUSTOM"
                v-model="wedding.eventsPage.subTitle"
                maxlength="60"
                placeholder="Eg: Join Our Celebrations"
              />
            </label>
            <label class="field">
              <span>Title</span>
              <select v-model="eventsTitleChoice">
                <option value="" disabled>Choose a title</option>
                <option v-for="text in eventsTitles" :key="text" :value="text">{{ text }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="eventsTitleChoice === CUSTOM"
                v-model="wedding.eventsPage.title"
                maxlength="60"
                placeholder="Eg: The Wedding Itinerary"
              />
            </label>
            <label class="field">
              <span>Map button label</span>
              <input v-model="wedding.eventsPage.mapButtonLabel" maxlength="30" placeholder="Eg: View on Map" />
            </label>
            <label class="field">
              <span>Calendar button label</span>
              <input v-model="wedding.eventsPage.calendarButtonLabel" maxlength="30" placeholder="Eg: Add to Calendar" />
            </label>
            <label class="field">
              <span>Time zone of the events (for guests' calendars)</span>
              <select v-model="wedding.eventsPage.timezone">
                <option value="">Guest's own time zone</option>
                <option v-for="tz in timeZones" :key="tz" :value="tz">{{ tz.replace(/_/g, ' ') }}</option>
              </select>
            </label>
            <div class="field span-2">
              <span>Events</span>
              <div class="template-pills" role="group" aria-label="Events">
                <button
                  v-for="name in eventList.names"
                  :key="name"
                  type="button"
                  class="template-pill"
                  :class="{ selected: eventList.has(name) }"
                  :aria-pressed="eventList.has(name)"
                  :title="eventList.has(name) ? `Remove ${name}` : `Add ${name}`"
                  :disabled="readOnly || (!eventList.has(name) && eventList.full())"
                  @click="eventList.toggle(name)"
                >
                  <i class="fa-solid" :class="eventList.has(name) ? 'fa-check' : 'fa-plus'"></i> {{ name }}
                </button>
                <button
                  type="button"
                  class="template-pill"
                  title="Add one with your own name"
                  :disabled="readOnly || eventList.full()"
                  @click="eventList.addCustom"
                >
                  <i class="fa-solid fa-pen"></i> Custom
                </button>
              </div>
            </div>
          </div>

          <div class="item-card" v-for="(event, i) in wedding.eventsPage.events" :key="i">
            <div class="item-head">
              <strong>{{ String(i + 1).padStart(2, '0') }} · {{ event.name || 'Untitled event' }}</strong>
              <ItemControls :list="wedding.eventsPage.events" :index="i" />
            </div>
            <div class="grid">
              <label class="field span-2">
                <span>Name</span>
                <select :value="eventList.nameChoice(event)" :id="`event-${i}-name`" :class="issueClass(`event-${i}-name`)" @change="eventList.setName(event, $event.target.value)">
                  <option value="" disabled>Choose an event</option>
                  <option v-for="name in eventList.names" :key="name" :value="name">{{ name }}</option>
                  <option :value="CUSTOM">Custom…</option>
                </select>
                <input
                  v-if="eventList.nameChoice(event) === CUSTOM"
                  v-model="event.name"
                  maxlength="40"
                  :class="issueClass(`event-${i}-name`)"
                  placeholder="Eg: Nichayathartham"
                />
                <FieldIssue :for="`event-${i}-name`" />
              </label>
              <label class="field span-2">
                <span>Date</span>
                <input type="date" :value="event.date" :id="`event-${i}-date`" :class="issueClass(`event-${i}-date`)" @change="pickEventDate(event, $event.target.value)" />
                <FieldIssue :for="`event-${i}-date`" />
              </label>
              <label class="field">
                <span>Starts (empty = all day)</span>
                <input type="time" :value="event.start" :id="`event-${i}-start`" :class="issueClass(`event-${i}-start`)" @change="setEventTime(event, 'start', $event.target.value)" />
                <FieldIssue :for="`event-${i}-start`" />
              </label>
              <label class="field">
                <span>Ends (optional)</span>
                <input type="time" :value="event.end" @change="setEventTime(event, 'end', $event.target.value)" />
              </label>
              <label class="field span-2">
                <span>Time shown to guests (filled from start & end)</span>
                <input v-model="event.time" maxlength="40" placeholder="Eg: 10:00 AM – 12:00 PM" />
              </label>
              <label class="field">
                <span>Venue</span>
                <input v-model="event.venue" maxlength="80" :id="`event-${i}-venue`" :class="issueClass(`event-${i}-venue`)" placeholder="Eg: Sri Krishna Mahal" />
                <FieldIssue :for="`event-${i}-venue`" />
              </label>
              <label class="field">
                <span>Location</span>
                <input v-model="event.location" maxlength="80" placeholder="Eg: Chennai" />
              </label>
              <label class="field span-2">
                <span>Map URL (optional, otherwise searches venue + location)</span>
                <input v-model.trim="event.mapUrl" type="url" maxlength="500" :id="`event-${i}-mapUrl`" :class="issueClass(`event-${i}-mapUrl`)" placeholder="Eg: https://maps.app.goo.gl/…" />
                <FieldIssue :for="`event-${i}-mapUrl`" />
              </label>
            </div>
          </div>
          <button class="btn-add" :disabled="wedding.eventsPage.events.length >= limits.events" @click="wedding.eventsPage.events.push(blankEvent())">
            <i class="fa-solid fa-plus"></i> Add event ({{ wedding.eventsPage.events.length }} / {{ limits.events }})
          </button>
        </div>

        <!-- Hero -->
        <div class="card" id="hero">
          <div class="card-head">
            <h2>Home page</h2>
            <div class="template-pills" role="radiogroup" aria-label="Home page template">
              <button
                v-for="t in heroTemplates"
                :key="t.id"
                type="button"
                role="radio"
                class="template-pill"
                :class="{ selected: (wedding.hero.template || 'classic') === t.id }"
                :aria-checked="(wedding.hero.template || 'classic') === t.id"
                :title="t.description"
                :disabled="readOnly"
                @click="wedding.hero.template = t.id"
              >
                <i class="fa-solid" :class="t.icon"></i> {{ t.label }}
              </button>
            </div>
          </div>
          <div class="grid">
            <label class="field span-2">
              <span>Invite line</span>
              <select v-model="inviteChoice">
                <option value="" disabled>Choose an invite line</option>
                <option v-for="line in inviteLines" :key="line" :value="line">{{ line }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="inviteChoice === CUSTOM"
                v-model="wedding.hero.inviteLine"
                maxlength="120"
                id="hero-inviteLine"
                :class="issueClass('hero-inviteLine')"
                placeholder="Eg: You are invited to the wedding ceremony of"
              />
              <FieldIssue for="hero-inviteLine" />
            </label>
            <div v-if="heroSuggestions.length" class="span-2 note-suggestions" role="group" aria-label="Fill from an event">
              <span>Fill from an event</span>
              <button
                v-for="(s, i) in heroSuggestions"
                :key="i"
                type="button"
                class="note-suggestion event-fill"
                :class="{ selected: isHeroFrom(s) }"
                :title="`Use ${s.label}'s date, time and place`"
                @click="fillHeroFrom(s)"
              >
                <strong>{{ s.label }}</strong>
                <small>{{ [s.dateTexts[1], s.timeText, s.locationText].filter(Boolean).join(' · ') }}</small>
              </button>
            </div>
            <label class="field">
              <span>Date text</span>
              <input v-model="wedding.hero.dateText" maxlength="40" list="hero-date-options" autocomplete="off" placeholder="Eg: 12 · 06 · 2027" />
              <datalist id="hero-date-options">
                <option v-for="text in heroDateTexts" :key="text" :value="text"></option>
              </datalist>
            </label>
            <label class="field">
              <span>Time text</span>
              <input v-model="wedding.hero.timeText" maxlength="40" list="hero-time-options" autocomplete="off" placeholder="Eg: 10 : 00 AM - 12 : 00 PM" />
              <datalist id="hero-time-options">
                <option v-for="text in heroTimeTexts" :key="text" :value="text"></option>
              </datalist>
            </label>
            <label class="field span-2">
              <span>Location text</span>
              <input v-model="wedding.hero.locationText" maxlength="100" list="hero-location-options" autocomplete="off" placeholder="Eg: SRI KRISHNA MAHAL, CHENNAI" />
              <datalist id="hero-location-options">
                <option v-for="text in heroLocationTexts" :key="text" :value="text"></option>
              </datalist>
            </label>
          </div>

          <h3>Background image</h3>
          <div class="background-picker">
            <div class="background-preview" @click="!readOnly && photoInputs.background.click()">
              <img v-if="wedding.hero.backgroundImage" :src="wedding.hero.backgroundImage" alt="" />
              <span v-else>No background image</span>
              <span v-if="backgroundCredit" class="photo-watermark">
                Photo by {{ backgroundCredit.photographer }} on Unsplash
              </span>
            </div>
            <div class="background-fields">
              <button class="btn-upload" @click="photoInputs.background.click()" :disabled="uploading === 'background'">
                <i class="fa-solid" :class="uploading === 'background' ? 'fa-spinner fa-spin' : 'fa-image'"></i>
                {{ uploading === 'background' ? 'Uploading…' : 'Upload background' }}
              </button>
              <button
                v-if="wedding.hero.backgroundImage"
                type="button"
                class="btn-upload btn-clear"
                :disabled="uploading === 'background'"
                @click="removeImage(wedding.hero, 'backgroundImage', 'background image')"
              >
                <i class="fa-solid fa-trash"></i> Remove background
              </button>
              <input
                :ref="(el) => (photoInputs.background = el)"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                hidden
                @change="uploadBackground"
              />
              <label class="field overlay-field">
                <span>
                  Overlay darkness <strong>{{ overlayValue }}%</strong>
                  <button
                    v-if="typeof wedding.hero.overlayOpacity === 'number'"
                    type="button"
                    class="overlay-reset"
                    :disabled="readOnly"
                    @click.prevent="resetOverlay"
                  >Reset</button>
                </span>
                <input v-model.number="overlayValue" type="range" min="0" max="100" step="5" :disabled="readOnly" />
                <small>0% shows the photo clearly, 100% hides it behind the overlay colour</small>
              </label>
              <div v-for="p in heroColorPickers" :key="p.field" class="field overlay-field">
                <span>{{ p.label }}</span>
                <div class="overlay-swatches" role="radiogroup" :aria-label="p.label">
                  <button
                    v-for="r in p.roles"
                    :key="r.id"
                    type="button"
                    role="radio"
                    class="overlay-swatch"
                    :class="{ selected: pickedColor(p) === r.id }"
                    :aria-checked="pickedColor(p) === r.id"
                    :title="r.label"
                    :disabled="readOnly"
                    :style="{ background: themeColors[r.id] }"
                    @click="pickHeroColor(p, r.id)"
                  ></button>
                  <label
                    class="overlay-swatch overlay-custom"
                    :class="{ selected: isHexColor(wedding.hero[p.field]), disabled: readOnly }"
                    title="Custom colour"
                    :style="isHexColor(wedding.hero[p.field]) ? { background: wedding.hero[p.field] } : {}"
                  >
                    <i v-if="!isHexColor(wedding.hero[p.field])" class="fa-solid fa-eye-dropper"></i>
                    <input
                      type="color"
                      :value="isHexColor(wedding.hero[p.field]) ? wedding.hero[p.field] : themeColors[p.roles[0].id]"
                      :disabled="readOnly"
                      @input="pickHeroColor(p, $event.target.value)"
                    />
                  </label>
                </div>
                <small>{{ p.hint }}</small>
              </div>
            </div>
          </div>

          <p class="background-gallery-label">Or pick one of ours</p>
          <div class="background-gallery">
            <button
              v-for="src in backgroundGallery"
              :key="src"
              type="button"
              class="background-option"
              :class="{ selected: wedding.hero.backgroundImage === src }"
              :disabled="readOnly"
              @click="wedding.hero.backgroundImage = src"
            >
              <img :src="src.replace('/bg-home/', '/bg-home/thumbs/')" alt="" loading="lazy" />
              <i v-if="wedding.hero.backgroundImage === src" class="fa-solid fa-circle-check"></i>
              <span v-if="unsplashCredit(src)" class="photo-watermark" :title="`Photo by ${unsplashCredit(src).photographer} on Unsplash`">
                Unsplash · {{ unsplashCredit(src).photographer }}
              </span>
            </button>
          </div>

          <div class="card-subhead">
            <h3>Countdown</h3>
            <div class="template-pills" role="radiogroup" aria-label="Countdown style">
              <button
                v-for="t in countdownStyles"
                :key="t.id"
                type="button"
                role="radio"
                class="template-pill"
                :class="{ selected: countdownChoice === t.id }"
                :aria-checked="countdownChoice === t.id"
                :title="t.description"
                :disabled="readOnly"
                @click="countdownChoice = t.id"
              >
                <i class="fa-solid" :class="t.icon"></i> {{ t.label }}
              </button>
            </div>
          </div>
          <div class="grid" v-if="wedding.hero.countdown.enabled">
            <label class="field span-2">
              <span>Counts down to (Eg: 12 Jun 2027, 10:00 AM)</span>
              <input type="datetime-local" step="1" v-model="weddingDate" id="wedding-date" :class="issueClass('wedding-date')" />
              <FieldIssue for="wedding-date" />
            </label>
            <div v-if="heroTargets.length" class="span-2 note-suggestions date-suggestions" role="group" aria-label="Use an event's date">
              <button
                v-for="s in heroTargets"
                :key="s.label"
                type="button"
                class="template-pill"
                :class="{ selected: weddingDate === s.target }"
                @click="weddingDate = s.target"
              >
                <i class="fa-regular fa-calendar"></i> {{ s.label }} · {{ s.dateTexts[1] }}
              </button>
            </div>
            <label class="field" v-for="(label, unit) in wedding.hero.countdown.labels" :key="unit">
              <span>Label for {{ unit }}</span>
              <input v-model="wedding.hero.countdown.labels[unit]" maxlength="12" :placeholder="`Eg: ${countdownExamples[unit]}`" />
            </label>
          </div>
        </div>

        <!-- Story -->
        <div class="card" id="story">
          <h2>Story</h2>
          <div class="grid">
            <label class="field">
              <span>Sub title</span>
              <select v-model="storySubTitleChoice">
                <option value="" disabled>Choose a sub title</option>
                <option v-for="text in storySubTitles" :key="text" :value="text">{{ text }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="storySubTitleChoice === CUSTOM"
                v-model="wedding.storyPage.subTitle"
                maxlength="60"
                placeholder="Eg: How We Got Here"
              />
            </label>
            <label class="field">
              <span>Title</span>
              <select v-model="storyTitleChoice">
                <option value="" disabled>Choose a title</option>
                <option v-for="text in storyTitles" :key="text" :value="text">{{ text }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="storyTitleChoice === CUSTOM"
                v-model="wedding.storyPage.title"
                maxlength="60"
                placeholder="Eg: Our Sweet Journey"
              />
            </label>
            <label class="field">
              <span>Year label</span>
              <input v-model="wedding.storyPage.yearLabel" maxlength="20" placeholder="Eg: Year:" />
            </label>
            <div class="field span-2">
              <span>Milestones</span>
              <div class="template-pills" role="group" aria-label="Milestones">
                <button
                  v-for="name in milestoneList.names"
                  :key="name"
                  type="button"
                  class="template-pill"
                  :class="{ selected: milestoneList.has(name) }"
                  :aria-pressed="milestoneList.has(name)"
                  :title="milestoneList.has(name) ? `Remove ${name}` : `Add ${name}`"
                  :disabled="readOnly || (!milestoneList.has(name) && milestoneList.full())"
                  @click="milestoneList.toggle(name)"
                >
                  <i class="fa-solid" :class="milestoneList.has(name) ? 'fa-check' : 'fa-plus'"></i> {{ name }}
                </button>
                <button
                  type="button"
                  class="template-pill"
                  title="Add one with your own name"
                  :disabled="readOnly || milestoneList.full()"
                  @click="milestoneList.addCustom"
                >
                  <i class="fa-solid fa-pen"></i> Custom
                </button>
              </div>
            </div>
          </div>

          <div class="item-card" v-for="(milestone, i) in wedding.storyPage.milestones" :key="i">
            <div class="item-head">
              <strong>{{ String(i + 1).padStart(2, '0') }} · {{ milestone.name || 'Untitled milestone' }}</strong>
              <ItemControls :list="wedding.storyPage.milestones" :index="i" />
            </div>
            <div class="grid">
              <label class="field span-2">
                <span>Name</span>
                <select :value="milestoneList.nameChoice(milestone)" :id="`milestone-${i}-name`" :class="issueClass(`milestone-${i}-name`)" @change="milestoneList.setName(milestone, $event.target.value)">
                  <option value="" disabled>Choose a milestone</option>
                  <option v-for="name in milestoneList.names" :key="name" :value="name">{{ name }}</option>
                  <option :value="CUSTOM">Custom…</option>
                </select>
                <input
                  v-if="milestoneList.nameChoice(milestone) === CUSTOM"
                  v-model="milestone.name"
                  maxlength="40"
                  :class="issueClass(`milestone-${i}-name`)"
                  placeholder="Eg: Our First Trip"
                />
                <FieldIssue :for="`milestone-${i}-name`" />
              </label>
              <label class="field">
                <span>Day</span>
                <input v-model.trim="milestone.day" inputmode="numeric" maxlength="2" :id="`milestone-${i}-day`" :class="issueClass(`milestone-${i}-day`)" placeholder="Eg: 14" />
                <FieldIssue :for="`milestone-${i}-day`" />
              </label>
              <label class="field">
                <span>Month</span>
                <select v-model="milestone.month">
                  <option value="">No month</option>
                  <option v-if="milestone.month && !SHORT_MONTHS.includes(milestone.month)" :value="milestone.month">{{ milestone.month }}</option>
                  <option v-for="m in SHORT_MONTHS" :key="m" :value="m">{{ m }}</option>
                </select>
              </label>
              <label class="field">
                <span>Year</span>
                <input v-model.trim="milestone.year" inputmode="numeric" maxlength="4" :id="`milestone-${i}-year`" :class="issueClass(`milestone-${i}-year`)" placeholder="Eg: 2025" />
                <FieldIssue :for="`milestone-${i}-year`" />
              </label>
              <label class="field span-2">
                <span>Note</span>
                <textarea v-model="milestone.note" rows="2" maxlength="300" placeholder="Eg: The day our paths crossed for the very first time."></textarea>
              </label>
              <div class="span-2 note-suggestions" role="group" :aria-label="`Note suggestions for ${milestone.name || 'this milestone'}`">
                <span>Suggestions</span>
                <button
                  v-for="text in storyNoteSuggestions(milestone.name)"
                  :key="text"
                  type="button"
                  class="note-suggestion"
                  :class="{ selected: milestone.note === text }"
                  :aria-pressed="milestone.note === text"
                  @click="milestone.note = text"
                >
                  {{ text }}
                </button>
              </div>
            </div>
          </div>
          <button class="btn-add" :disabled="wedding.storyPage.milestones.length >= limits.milestones" @click="wedding.storyPage.milestones.push(blankMilestone())">
            <i class="fa-solid fa-plus"></i> Add milestone ({{ wedding.storyPage.milestones.length }} / {{ limits.milestones }})
          </button>
        </div>

        <!-- Moments -->
        <div class="card" id="moments">
          <h2>Moments gallery</h2>
          <div class="grid">
            <label class="field">
              <span>Sub title</span>
              <select v-model="momentsSubTitleChoice">
                <option value="" disabled>Choose a sub title</option>
                <option v-for="text in momentsSubTitles" :key="text" :value="text">{{ text }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="momentsSubTitleChoice === CUSTOM"
                v-model="wedding.momentsPage.subTitle"
                maxlength="60"
                placeholder="Eg: Captured Moments"
              />
            </label>
            <label class="field">
              <span>Title</span>
              <select v-model="momentsTitleChoice">
                <option value="" disabled>Choose a title</option>
                <option v-for="text in momentsTitles" :key="text" :value="text">{{ text }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="momentsTitleChoice === CUSTOM"
                v-model="wedding.momentsPage.title"
                maxlength="60"
                placeholder="Eg: Our Gallery"
              />
            </label>
          </div>
          <ImageList :images="wedding.momentsPage.images" :max="limits.gallery" upload-key="gallery" />
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
              <input type="datetime-local" step="1" v-model="wedding.saveTheDate.expiresAt" id="std-expires" :class="issueClass('std-expires')" />
              <FieldIssue for="std-expires" />
              <button
                v-if="wedding.hero.countdown.target && wedding.saveTheDate.expiresAt !== wedding.hero.countdown.target"
                type="button"
                class="link-btn"
                @click="wedding.saveTheDate.expiresAt = wedding.hero.countdown.target"
              >
                Use wedding date
              </button>
            </label>
            <label class="field">
              <span>Slide every (seconds)</span>
              <input type="number" min="1" max="30" :value="wedding.saveTheDate.autoplayMs / 1000"
                @change="$event.target.value = wedding.saveTheDate.autoplayMs / 1000"
                @input="wedding.saveTheDate.autoplayMs = Math.min(30, Math.max(1, Number($event.target.value) || 1)) * 1000" />
            </label>
          </div>
          <div id="std-images">
            <ImageList :images="wedding.saveTheDate.images" :max="limits.saveTheDate" upload-key="save-the-date" />
            <FieldIssue for="std-images" />
          </div>
        </div>

        <!-- Site -->
        <div class="card" id="site">
          <h2>Site</h2>
          <div class="grid">
            <label class="field span-2">
              <span>Browser tab title</span>
              <select v-model="siteTitleChoice">
                <option value="" disabled>Choose a tab title</option>
                <option v-for="title in siteTitles" :key="title" :value="title">{{ title }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="siteTitleChoice === CUSTOM"
                v-model="wedding.site.title"
                maxlength="100"
                id="site-title"
                :class="issueClass('site-title')"
                placeholder="Eg: Arjun & Meera — Wedding Invitation"
              />
              <FieldIssue for="site-title" />
            </label>
            <label class="field">
              <span>Monogram</span>
              <select v-model="monogramChoice">
                <option value="" disabled>Choose a monogram</option>
                <option v-for="monogram in monograms" :key="monogram" :value="monogram">{{ monogram }}</option>
                <option :value="CUSTOM">Custom…</option>
              </select>
              <input
                v-if="monogramChoice === CUSTOM"
                v-model="wedding.site.monogram"
                maxlength="6"
                id="site-monogram"
                :class="issueClass('site-monogram')"
                placeholder="Eg: A&M"
              />
              <FieldIssue for="site-monogram" />
            </label>
            <label class="field span-2">
              <span>Share message</span>
              <textarea
                ref="shareMessageInput"
                v-model="wedding.site.shareMessage"
                rows="3"
                maxlength="500"
                id="site-shareMessage"
                :class="issueClass('site-shareMessage')"
                :placeholder="DEFAULT_SHARE_MESSAGE"
              ></textarea>
              <FieldIssue for="site-shareMessage" />
            </label>
            <div class="span-2 note-suggestions" role="group" aria-label="Insert a detail">
              <span>Insert</span>
              <button v-for="p in SHARE_PLACEHOLDERS" :key="p.key" type="button" class="template-pill" @click="insertSharePlaceholder(p.key)">
                <i class="fa-solid fa-plus"></i> {{ p.label }}
              </button>
            </div>
            <div class="span-2 note-suggestions" role="group" aria-label="Share message suggestions">
              <span>Suggestions</span>
              <button
                v-for="text in SHARE_MESSAGE_SUGGESTIONS"
                :key="text"
                type="button"
                class="note-suggestion"
                :class="{ selected: wedding.site.shareMessage === text }"
                :aria-pressed="wedding.site.shareMessage === text"
                @click="wedding.site.shareMessage = text"
              >
                {{ text }}
              </button>
            </div>
            <div class="span-2 share-preview">
              <span>What guests receive</span>
              <p>{{ shareMessagePreview }}</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="card" id="navigation">
          <h2>Navigation</h2>
          <p v-if="!limits.editNavigation" class="plan-note">
            <i class="fa-solid fa-crown"></i>
            <button type="button" class="upgrade-link inline" @click="showUpgrade('editNavigation')">Upgrade to Plus</button>
            to customise navigation labels and icons.
          </p>
          <fieldset class="nav-table" :disabled="!limits.editNavigation">
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
                <input v-model="item.label" maxlength="30" placeholder="Eg: The Couple" />
              </label>
              <label class="nav-field">
                <span class="nav-field-label">Mobile label</span>
                <input v-model="item.shortLabel" maxlength="20" placeholder="Eg: Couple" />
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
          </fieldset>
        </div>

      </fieldset>
      </template>

      <!-- Theme changed toast -->
      <Transition name="toast">
        <div v-if="themeToast && !showPreview" class="theme-toast" role="status">
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

    <!-- Live preview (desktop): the site in a frame, fed the unsaved config -->
    <div v-if="showPreview && !previewDocked" class="preview-backdrop" @click="previewOpen = false"></div>
    <aside v-if="showPreview" class="live-preview" :class="{ overlay: !previewDocked }" aria-label="Live preview">
      <div class="preview-bar">
        <div class="preview-pages" role="tablist" aria-label="Preview page">
          <button
            v-for="p in previewPages"
            :key="p.path"
            type="button"
            role="tab"
            :aria-selected="previewPath === p.path"
            :class="{ active: previewPath === p.path }"
            @click="previewPick = p.path"
          >{{ p.label }}</button>
        </div>
        <div class="preview-devices" role="radiogroup" aria-label="Preview size">
          <button
            v-for="d in previewDevices"
            :key="d.id"
            type="button"
            role="radio"
            :aria-checked="previewDevice === d.id"
            :class="{ active: previewDevice === d.id }"
            :title="d.label"
            @click="previewDevice = d.id"
          ><i class="fa-solid" :class="d.icon"></i></button>
          <button type="button" title="Hide preview" @click="previewOpen = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div ref="previewStage" class="preview-stage">
        <div
          class="preview-device"
          :class="previewDevice"
          :style="{ width: `${device.width * previewScale}px`, height: `${device.height * previewScale}px` }"
        >
          <iframe
            ref="previewFrame"
            :name="PREVIEW_FRAME_NAME"
            :src="previewSrc"
            title="Invitation preview"
            :style="{ width: `${device.width}px`, height: `${device.height}px`, transform: `scale(${previewScale})` }"
          ></iframe>
        </div>
      </div>
      <p class="preview-note">
        <template v-if="previewHasSample">Sample text and photos fill the empty fields here. Guests only see what you fill in.</template>
        <template v-else>Unsaved changes show here as you type. Guests see them after you save.</template>
      </p>
    </aside>

    <VersionHistory v-model:open="historyOpen" :wedding-id="weddingId" :keep="limits.history" :read-only="readOnly" @restore="restoreVersion" />
    <HeroSyncDialog :options="heroSync" @update="saveNow" @keep="saveNow()" @cancel="heroSync = null" />
  </Basic>
</template>

<script setup>
import { ref, reactive, computed, h, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import Basic from "@/views/Basic.vue";
import VersionHistory from "@/components/VersionHistory.vue";
import HeroSyncDialog from "@/components/HeroSyncDialog.vue";
import { useWeddingStore, weddingCode, weddingStatus, weddingMeta } from "@/stores/wedding";
import { recordUpload, setEditLocked, setHidden } from "@/services/weddings";
import { useMyPlan } from "@/composables/plan";
import { getPlan, overLimits } from "@/config/plans";
import { showUpgrade } from "@/composables/upgrade";
import { useAuthStore } from "@/stores/auth";
import { uploadImage as uploadToCloudinary } from "@/services/cloudinary";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { themes, fontsUrl, getTheme } from "@/config/themes";
import { PLACEHOLDER_PHOTO } from "@/config/blankWedding";
import { validateWedding, SHORT_MONTHS } from "@/utils/validation";
import { localTimeZone, setEventDate, setEventTime, timeZoneOptions } from "@/utils/calendar";
import { unsplashCredit } from "@/utils/unsplash";
import { storyNoteSuggestions } from "@/config/storyNotes";
import { eventSuggestions, heroSyncOptions, suggestionValues } from "@/utils/eventSuggestions";
import { SOCIAL_TYPES, useSocialLinks } from "@/composables/socialLinks";
import { parentsLineSuggestions, setParentName } from "@/utils/parentsLine";
import { bioSuggestions, INTERESTS, MAX_INTERESTS, PROFESSIONS } from "@/utils/bioSuggestions";
import InterestPills from "@/components/InterestPills.vue";
import { isPreviewMessage, PREVIEW_CONFIG, PREVIEW_FRAME_NAME, PREVIEW_NAVIGATE, PREVIEW_READY, withSampleContent } from "@/utils/preview";
import sampleWedding from "@/config/wedding.json";
import { shareMessage, DEFAULT_SHARE_MESSAGE, SHARE_MESSAGE_SUGGESTIONS, SHARE_PLACEHOLDERS } from "@/utils/shareMessage";

const wedding = useWeddingStore();
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const weddingId = route.params.id;

// Import / export JSON buttons, hidden for now
const showImportExport = false;

/* ── Plan limits ── */
const myPlan = useMyPlan();
const planId = computed(() => myPlan.value ?? "free");
const limits = computed(() => getPlan(planId.value));
const overList = computed(() => overLimits(wedding.$state, limits.value));
// Read-only when over the account's invitation limit, or locked by the owner
const planLocked = computed(() => weddingMeta.value.locked);
const editLocked = computed(() => weddingMeta.value.editLocked);
const readOnly = computed(() => planLocked.value || editLocked.value);
const uploadsLeft = computed(() => limits.value.uploads - weddingMeta.value.uploads);

const sections = [
  { id: "theme", label: "Theme" },
  { id: "groom", label: "Groom" },
  { id: "bride", label: "Bride" },
  { id: "couple-page", label: "Couple" },
  { id: "events", label: "Events" },
  { id: "hero", label: "Home" },
  { id: "story", label: "Story" },
  { id: "moments", label: "Moments" },
  { id: "save-the-date", label: "Save the date" },
  { id: "site", label: "Site" },
  { id: "navigation", label: "Navigation" },
];

/* ── Text fields: pick a suggestion or write your own ── */
const CUSTOM = "__custom";
// Select value for target()[key]; saved text that isn't a suggestion counts as custom
const suggestionChoice = (target, key, suggestions) => {
  const custom = ref(false);
  return computed({
    get: () => {
      const text = target()[key];
      if (suggestions.value.includes(text) && !custom.value) return text;
      return custom.value || text ? CUSTOM : "";
    },
    set: (choice) => {
      custom.value = choice === CUSTOM;
      if (!custom.value) target()[key] = choice;
    },
  });
};

const inviteLines = computed(() => [
  "You are invited to the wedding ceremony of",
  "Together with their families",
  "Please join us to celebrate the wedding of",
  "With the blessings of our elders",
  "Save the date for the wedding of",
  "We request the pleasure of your company at the marriage of",
]);
const inviteChoice = suggestionChoice(() => wedding.hero, "inviteLine", inviteLines);

const coupleSubTitles = computed(() => [
  "Meet the Couple",
  "The Happy Couple",
  "Bride & Groom",
  "Two Hearts, One Love",
  "Made for Each Other",
  "Together Forever",
]);
const coupleSubTitleChoice = suggestionChoice(() => wedding.couplePage, "subTitle", coupleSubTitles);

// Name-based titles follow the groom / bride short names
const coupleTitles = computed(() => {
  const groom = wedding.groom.shortName || wedding.groom.name;
  const bride = wedding.bride.shortName || wedding.bride.name;
  const named = groom && bride ? [`${groom} & ${bride}`, `${bride} & ${groom}`] : [];
  return [...named, "Our Love Story", "Happily Ever After", "Two Souls, One Heart", "The Beginning of Forever"];
});
const coupleTitleChoice = suggestionChoice(() => wedding.couplePage, "title", coupleTitles);

// Tab titles follow the groom / bride short names
const siteTitles = computed(() => {
  const groom = wedding.groom.shortName || wedding.groom.name;
  const bride = wedding.bride.shortName || wedding.bride.name;
  if (!groom || !bride) return ["Our Wedding Invitation", "Save the Date", "You're Invited!"];
  return [
    `${groom} & ${bride} — Wedding Invitation`,
    `${bride} & ${groom} — Wedding Invitation`,
    `${groom} weds ${bride}`,
    `${bride} weds ${groom}`,
    `${groom} & ${bride} — Save the Date`,
    `The Wedding of ${groom} & ${bride}`,
    `${groom} ❤ ${bride}`,
  ];
});
const siteTitleChoice = suggestionChoice(() => wedding.site, "title", siteTitles);

// Monograms are built from the groom / bride initials
const monograms = computed(() => {
  const initial = (person) => (person.shortName || person.name || "").trim().charAt(0).toUpperCase();
  const groom = initial(wedding.groom);
  const bride = initial(wedding.bride);
  if (!groom || !bride) return [];
  // Set drops repeats when both initials match (A&A)
  return [...new Set([
    `${groom}&${bride}`,
    `${bride}&${groom}`,
    `${groom}♥${bride}`,
    `${groom}+${bride}`,
    `${groom}·${bride}`,
    `${groom}${bride}`,
  ])];
});
const monogramChoice = suggestionChoice(() => wedding.site, "monogram", monograms);

const eventsSubTitles = computed(() => [
  "Join Our Celebrations",
  "Save the Dates",
  "Celebrate With Us",
  "The Big Days",
  "Wedding Events",
  "Be Our Guest",
]);
const eventsSubTitleChoice = suggestionChoice(() => wedding.eventsPage, "subTitle", eventsSubTitles);

const eventsTitles = computed(() => [
  "The Wedding Itinerary",
  "Wedding Schedule",
  "When & Where",
  "Order of Events",
  "Our Wedding Celebrations",
  "Events & Venues",
]);
const eventsTitleChoice = suggestionChoice(() => wedding.eventsPage, "title", eventsTitles);

const storySubTitles = computed(() => [
  "How We Got Here",
  "Our Journey",
  "How It All Began",
  "Once Upon a Time",
  "From Strangers to Soulmates",
  "Our Love Story",
]);
const storySubTitleChoice = suggestionChoice(() => wedding.storyPage, "subTitle", storySubTitles);

const storyTitles = computed(() => [
  "Our Sweet Journey",
  "Our Story",
  "A Love Story",
  "The Story of Us",
  "Two Paths, One Journey",
  "Moments That Made Us",
]);
const storyTitleChoice = suggestionChoice(() => wedding.storyPage, "title", storyTitles);

const momentsSubTitles = computed(() => [
  "Captured Moments",
  "Memories We Cherish",
  "Snapshots of Us",
  "Frozen in Time",
  "Glimpses of Love",
  "Moments to Remember",
]);
const momentsSubTitleChoice = suggestionChoice(() => wedding.momentsPage, "subTitle", momentsSubTitles);

const momentsTitles = computed(() => [
  "Our Gallery",
  "Picture Perfect",
  "Our Moments",
  "Through the Lens",
  "Love in Frames",
  "Memory Lane",
]);
const momentsTitleChoice = suggestionChoice(() => wedding.momentsPage, "title", momentsTitles);

// Lists whose items are named from suggestions: one pill per name toggles it in or out,
// "Custom" adds an item with its own name. Items switched to "Custom…" are tracked here.
const customNamed = reactive(new WeakSet());
const isFilled = (item) => Object.entries(item).some(([k, v]) => k !== "name" && v);
const namedList = (getList, names, getMax, blank) => {
  const has = (name) => getList().some((item) => item.name === name);
  const full = () => getList().length >= getMax();
  return {
    names,
    has,
    full,
    // New items go in suggestion order (Engagement before Marriage, etc.)
    toggle: (name) => {
      const list = getList();
      const i = list.findIndex((item) => item.name === name);
      if (i !== -1) {
        if (isFilled(list[i]) && !confirm(`Remove ${name} and the details entered for it?`)) return;
        list.splice(i, 1);
        return;
      }
      if (full()) return;
      const rank = names.indexOf(name);
      const next = list.findIndex((item) => names.indexOf(item.name) > rank);
      list.splice(next === -1 ? list.length : next, 0, blank(name));
    },
    addCustom: () => {
      if (full()) return;
      getList().push(blank());
      customNamed.add(getList().at(-1));
    },
    nameChoice: (item) => {
      if (names.includes(item.name) && !customNamed.has(item)) return item.name;
      return customNamed.has(item) || item.name ? CUSTOM : "";
    },
    setName: (item, choice) => {
      if (choice === CUSTOM) return customNamed.add(item);
      customNamed.delete(item);
      item.name = choice;
    },
  };
};

const blankEvent = (name = "") => ({ name, date: "", start: "", end: "", day: "", month: "", time: "", venue: "", location: "", mapUrl: "" });
// The first date picked also sets the time zone, to the couple's own
const pickEventDate = (event, date) => {
  setEventDate(event, date);
  if (date && !wedding.eventsPage.timezone) wedding.eventsPage.timezone = localTimeZone();
};
const timeZones = computed(() => timeZoneOptions(wedding.eventsPage.timezone));
const eventList = namedList(
  () => wedding.eventsPage.events,
  ["Engagement", "Haldi", "Mehendi", "Sangeet", "Marriage", "Reception"],
  () => limits.value.events,
  blankEvent,
);

const blankMilestone = (name = "") => ({ name, day: "", month: "", year: "", note: "" });
const milestoneList = namedList(
  () => wedding.storyPage.milestones,
  ["First Meet", "First Date", "Falling in Love", "The Proposal", "Families Meet", "Engagement", "Wedding"],
  () => limits.value.milestones,
  blankMilestone,
);

// Layouts for the home page hero (Home.vue renders each)
const heroTemplates = [
  { id: "classic", label: "Classic", icon: "fa-align-center", description: "Centered names over the full background", overlay: 80 },
  { id: "framed", label: "Framed", icon: "fa-square", description: "Details inside an ornate card", overlay: 36 },
  { id: "minimal", label: "Minimal", icon: "fa-minus", description: "Names on one line, details along the bottom", overlay: 48 },
];

// Darkness of the tint over the background image; unset follows the template's default
const overlayDefault = computed(
  () => (heroTemplates.find((t) => t.id === wedding.hero.template) || heroTemplates[0]).overlay,
);
const overlayValue = computed({
  get: () => (typeof wedding.hero.overlayOpacity === "number" ? wedding.hero.overlayOpacity : overlayDefault.value),
  set: (v) => (wedding.hero.overlayOpacity = Number(v)),
});
const resetOverlay = () => delete wedding.hero.overlayOpacity;

// Overlay and text colours: a role from the current theme (stays in sync if the theme changes)
// or a custom #hex. The first role is the theme default and clears the field.
const heroColorPickers = [
  {
    field: "overlayColor",
    label: "Overlay colour",
    hint: "Light colours can make the text harder to read",
    roles: [
      { id: "overlay", label: "Theme default" },
      { id: "dark", label: "Dark" },
      { id: "text", label: "Text" },
      { id: "shadow", label: "Shadow" },
      { id: "gold-dark", label: "Accent deep" },
      { id: "gold", label: "Accent" },
      { id: "sage", label: "Muted" },
      { id: "blush", label: "Blush" },
      { id: "cream", label: "Cream" },
    ],
  },
  {
    field: "textColor",
    label: "Text colour",
    hint: "Names, date, time, place and countdown on the home page",
    roles: [
      { id: "gold", label: "Theme default" },
      { id: "gold-light", label: "Accent light" },
      { id: "card", label: "White" },
      { id: "cream", label: "Cream" },
      { id: "blush", label: "Blush" },
      { id: "sage", label: "Muted" },
      { id: "gold-dark", label: "Accent deep" },
      { id: "text", label: "Text" },
      { id: "dark", label: "Dark" },
    ],
  },
];
const themeColors = computed(() => getTheme(wedding.theme).colors);
const isHexColor = (v) => /^#[0-9a-f]{6}$/i.test(v || "");
const pickedColor = (p) => wedding.hero[p.field] || p.roles[0].id;
const pickHeroColor = (p, id) => {
  if (id === p.roles[0].id) delete wedding.hero[p.field];
  else wedding.hero[p.field] = id;
};

// Countdown looks (Home.vue styles each); "off" hides it
const countdownStyles = [
  { id: "off", label: "Off", icon: "fa-eye-slash", description: "Don't show a countdown" },
  { id: "classic", label: "Classic", icon: "fa-hourglass-half", description: "Numbers with labels underneath" },
  { id: "boxes", label: "Boxes", icon: "fa-border-all", description: "Each unit in its own tile" },
  { id: "circles", label: "Circles", icon: "fa-circle-notch", description: "Each unit in a gold ring" },
  { id: "inline", label: "Inline", icon: "fa-grip-lines", description: "One line of text" },
];
const countdownChoice = computed({
  get: () => (wedding.hero.countdown.enabled ? wedding.hero.countdown.style || "classic" : "off"),
  set: (id) => {
    wedding.hero.countdown.enabled = id !== "off";
    if (id !== "off") wedding.hero.countdown.style = id;
  },
});


/* ── "Eg:" placeholders for empty fields ── */
const examples = {
  groom: {
    name: "Arjun Kumar",
    shortName: "Arjun",
    roleLabel: "The Groom",
    profession: "Software Engineer",
    interests: "Cricket, Road trips",
    father: "Ravi Kumar",
    mother: "Lakshmi Kumar",
    parents: "Son of Mr. Ravi Kumar & Mrs. Lakshmi Kumar",
    bio: "A software engineer who loves cricket, road trips and filter coffee.",
  },
  bride: {
    name: "Meera Nair",
    shortName: "Meera",
    roleLabel: "The Bride",
    profession: "Doctor",
    interests: "Classical dance, Books",
    father: "Suresh Nair",
    mother: "Anjali Nair",
    parents: "Daughter of Mr. Suresh Nair & Mrs. Anjali Nair",
    bio: "A doctor with a love for classical dance, books and long walks by the beach.",
  },
};
const parentsSuggestions = (key) => parentsLineSuggestions(key, wedding[key].father, wedding[key].mother);
const socialExamples = {
  instagram: "Eg: https://instagram.com/arjun",
  facebook: "Eg: https://facebook.com/arjun",
  whatsapp: "Eg: https://wa.me/919876543210",
};
// The countdown target is the wedding date; the save-the-date popup follows it
// until "Hide after" is set to something else
const weddingDate = computed({
  get: () => wedding.hero.countdown.target,
  set: (date) => {
    const popup = wedding.saveTheDate;
    if (!popup.expiresAt || popup.expiresAt === wedding.hero.countdown.target) popup.expiresAt = date;
    wedding.hero.countdown.target = date;
  },
});

// Home page date, time and place suggested from the events
const heroSuggestions = computed(() => eventSuggestions(wedding.eventsPage.events, wedding.hero.countdown.target));
const heroTargets = computed(() => heroSuggestions.value.filter((s) => s.target));
const heroDateTexts = computed(() => suggestionValues(heroSuggestions.value, (s) => s.dateTexts));
const heroTimeTexts = computed(() => suggestionValues(heroSuggestions.value, (s) => [s.timeText]));
const heroLocationTexts = computed(() => suggestionValues(heroSuggestions.value, (s) => [s.locationText]));
// Fills whatever the event has: countdown date & time, date text, time text, location
const fillHeroFrom = (s) => {
  if (s.target) weddingDate.value = s.target;
  if (s.dateTexts[0]) wedding.hero.dateText = s.dateTexts[0];
  if (s.timeText) wedding.hero.timeText = s.timeText;
  if (s.locationText) wedding.hero.locationText = s.locationText;
};
const isHeroFrom = (s) =>
  (!s.target || wedding.hero.countdown.target === s.target)
  && (!s.dateTexts.length || s.dateTexts.includes(wedding.hero.dateText))
  && (!s.timeText || wedding.hero.timeText === s.timeText)
  && (!s.locationText || wedding.hero.locationText === s.locationText);

const countdownExamples = { days: "Days", hours: "Hrs", minutes: "Min", seconds: "Sec" };

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

// Bride's and groom's links: each platform's box opens from its toggle
const socials = useSocialLinks(wedding, (id) => id && issueFor(id));

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

// Clears a single image (the upload still counts towards the plan)
const removeImage = (target, field, label) => {
  if (confirm(`Remove this ${label}?`)) target[field] = "";
};

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

// Uploaded images with thumbnails, capped at the plan's limit
const ImageList = (props) =>
  h("div", { class: "image-list" }, [
    ...props.images.map((src, i) =>
      h("div", { class: "image-row", key: i }, [
        h("img", { src, class: "thumb", alt: "" }),
        h("span", { class: "image-index" }, `Image ${i + 1}`),
        h(ItemControls, { list: props.images, index: i }),
      ])
    ),
    h("div", { class: "image-list-actions" }, [
      h(
        "button",
        {
          class: "btn-upload",
          disabled: uploading.value === props.uploadKey || props.images.length >= props.max || uploadsLeft.value <= 0,
          onClick: (e) => e.currentTarget.parentElement.querySelector("input[type=file]").click(),
        },
        uploading.value === props.uploadKey
          ? [h("i", { class: "fa-solid fa-spinner fa-spin" }), ` Uploading ${uploadProgress.value}…`]
          : [h("i", { class: "fa-solid fa-cloud-arrow-up" }), ` Upload images (${props.images.length} / ${props.max})`]
      ),
      props.images.length
        ? h(
            "button",
            {
              class: "btn-upload btn-clear",
              disabled: uploading.value === props.uploadKey,
              onClick: () => {
                if (confirm(`Remove all ${props.images.length} images?`)) props.images.splice(0);
              },
            },
            [h("i", { class: "fa-solid fa-trash" }), " Remove all"]
          )
        : null,
      h("input", {
        type: "file",
        accept: "image/jpeg,image/png,image/webp,image/gif,image/avif",
        multiple: true,
        hidden: true,
        onChange: (e) => uploadMany(props.uploadKey, props.images, props.max, e),
      }),
    ]),
  ]);
ImageList.props = ["images", "max", "uploadKey"];

/* ── Save / import / export ── */
// null until the user's wedding has loaded from Firestore
const lastSaved = ref(null);
const loadError = ref("");
const isDirty = computed(() => lastSaved.value !== null && JSON.stringify(wedding.snapshot()) !== lastSaved.value);

const loadSaved = async () => {
  loadError.value = "";
  try {
    await wedding.loadById(weddingId);
    if (weddingStatus.value === "not-found") {
      loadError.value = "This wedding doesn't exist or was deleted.";
      return;
    }
    lastSaved.value = JSON.stringify(wedding.snapshot());
  } catch (error) {
    loadError.value = `Could not load your wedding: ${error.message}`;
  }
};

// Set once the user has already agreed to drop unsaved changes
let leaveConfirmed = false;
const logout = async () => {
  if (isDirty.value && !confirm("You have unsaved changes. Sign out anyway?")) return;
  leaveConfirmed = true;
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

// Hide / show to guests (the owner can still open the guest link)
const hideBusy = ref(false);
const toggleHidden = async () => {
  const hidden = !weddingMeta.value.hidden;
  hideBusy.value = true;
  try {
    await setHidden(weddingId, hidden);
    weddingMeta.value = { ...weddingMeta.value, hidden };
    flash(hidden ? "Hidden from guests" : "Visible to guests", "ok");
  } catch (error) {
    flash(`Could not ${hidden ? "hide" : "show"} it: ${error.message}`, "error");
  } finally {
    hideBusy.value = false;
  }
};

// Lock / unlock editing (guests can still open a locked invitation)
const lockBusy = ref(false);
const toggleEditLock = async () => {
  const locked = !editLocked.value;
  lockBusy.value = true;
  try {
    await setEditLocked(weddingId, locked);
    weddingMeta.value = { ...weddingMeta.value, editLocked: locked };
    flash(locked ? "Invitation locked" : "Invitation unlocked", "ok");
  } catch (error) {
    flash(`Could not ${locked ? "lock" : "unlock"}: ${error.message}`, "error");
  } finally {
    lockBusy.value = false;
  }
};

/* ── Validation ── */
// Missing required fields are only flagged once the user has tried to save
const now = ref(Date.now());
const clock = setInterval(() => { now.value = Date.now(); }, 60 * 1000);
const triedSave = ref(false);
const issues = computed(() => validateWedding(wedding.$state, now.value));
const shownIssues = computed(() => issues.value.filter((i) => !i.required || triedSave.value));
const errorIssues = computed(() => issues.value.filter((i) => i.level === "error"));
const issueFor = (id) => shownIssues.value.find((i) => i.id === id && i.level === "error") || shownIssues.value.find((i) => i.id === id);
const issueClass = (id) => {
  const issue = issueFor(id);
  return issue && (issue.level === "error" ? "invalid" : "attention");
};
const FieldIssue = (props) => {
  const issue = issueFor(props.for);
  return issue && h("small", { class: ["field-issue", issue.level] }, issue.message);
};
FieldIssue.props = ["for"];

const jumpToIssue = (issue) => {
  const el = document.getElementById(issue.id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus?.({ preventScroll: true });
};

const save = async () => {
  triedSave.value = true;
  if (errorIssues.value.length) {
    const n = errorIssues.value.length;
    flash(`Fix ${n} problem${n === 1 ? "" : "s"} before saving`, "error");
    jumpToIssue(errorIssues.value[0]);
    return;
  }
  // An event changed but the home page didn't follow: ask first
  const options = heroSyncOptions(wedding.$state, lastSaved.value && JSON.parse(lastSaved.value));
  if (options.length) {
    heroSync.value = options;
    return;
  }
  await saveNow();
};

// Changed events the popup offers for the home page: [{ event, changes }] (null when closed)
const heroSync = ref(null);

// Saves, first copying the chosen event's details to the home page
const saveNow = async (changes = []) => {
  heroSync.value = null;
  for (const c of changes) {
    if (c.key === "target") weddingDate.value = c.to;
    else wedding.hero[c.key] = c.to;
  }
  saving.value = true;
  try {
    const body = JSON.stringify(wedding.snapshot());
    await wedding.saveById(weddingId, auth.user.uid, { keepVersions: limits.value.history });
    lastSaved.value = body;
    const left = issues.value.length;
    flash(left ? `Saved · ${left} thing${left === 1 ? "" : "s"} still need${left === 1 ? "s" : ""} attention` : "Saved", left ? "warn" : "ok");
  } catch (error) {
    flash(`Save failed: ${error.message}`, "error");
  } finally {
    saving.value = false;
  }
};

// What guests open: https://<site>/<code>
const shareLink = computed(() => weddingCode.value && `${window.location.origin}/${weddingCode.value}`);
const codeCopied = ref(false);
// The couple's share message with the link filled in
const shareMessagePreview = computed(() => shareMessage(wedding.$state, shareLink.value || `${window.location.origin}/YOURCODE`));
const shareMessageInput = ref(null);
// Puts {key} at the cursor in the share message
const insertSharePlaceholder = (key) => {
  const el = shareMessageInput.value;
  const text = wedding.site.shareMessage || "";
  const at = el ? el.selectionStart : text.length;
  const end = el ? el.selectionEnd : text.length;
  wedding.site.shareMessage = `${text.slice(0, at)}{${key}}${text.slice(end)}`;
  const cursor = at + key.length + 2;
  nextTick(() => { el?.focus(); el?.setSelectionRange(cursor, cursor); });
};
const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareMessage(wedding.$state, shareLink.value));
    codeCopied.value = true;
    setTimeout(() => { codeCopied.value = false; }, 1500);
  } catch {
    flash(`Could not copy, share this link: ${shareLink.value}`, "error");
  }
};

/* ── Version history (Plus) ── */
const historyOpen = ref(false);
const openHistory = () => (limits.value.history ? (historyOpen.value = true) : showUpgrade("history"));
const restoreVersion = ({ config, label }) => {
  if (isDirty.value && !confirm("Replace your unsaved changes with this version?")) return;
  wedding.restore(config);
  flash(`Restored the version from ${label}. Save to keep it.`, "warn");
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
// Every upload counts against the invitation's plan limit
const uploadFile = async (key, file) => {
  if (!file.type.startsWith("image/")) {
    flash(`${file.name} is not an image`, "error");
    return null;
  }
  if (uploadsLeft.value <= 0) {
    flash(`You've used all ${limits.value.uploads} image uploads for this invitation`, "error");
    return null;
  }

  try {
    const url = await uploadToCloudinary(file, { uid: auth.user.uid, key });
    await recordUpload(weddingId);
    weddingMeta.value = { ...weddingMeta.value, uploads: weddingMeta.value.uploads + 1 };
    return url;
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
const uploadMany = async (key, list, max, e) => {
  const picked = [...e.target.files];
  e.target.value = "";
  const files = picked.slice(0, Math.max(0, Math.min(max - list.length, uploadsLeft.value)));
  if (files.length < picked.length) flash(`Only ${files.length} of ${picked.length} images fit within your plan's limits`, "warn");
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

// Ready-made backgrounds: every image in public/images/bg-home (only the paths are used).
// The gallery shows the small copies in bg-home/thumbs.
// Unsplash ones carry a photographer credit
const backgroundCredit = computed(() => unsplashCredit(wedding.hero.backgroundImage));
const backgroundGallery = Object.keys(
  import.meta.glob("/public/images/bg-home/*.{jpg,jpeg,png,webp,avif}", { query: "?url" }),
).map((path) => path.replace(/^\/public/, ""));

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

const jumpTo = (id) => {
  setActiveSection(id);
  // Keep the scroll spy from stepping through every section on the way
  spyPausedUntil = Date.now() + 900;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* ── Section pills: highlight the section being edited, keep its pill in view ── */
const sectionNav = ref(null);
const activeSection = ref("");
const sectionIds = new Set(sections.map((s) => s.id));
const activeIndex = computed(() => sections.findIndex((s) => s.id === activeSection.value));
const setActiveSection = (id) => {
  if (!sectionIds.has(id) || activeSection.value === id) return;
  activeSection.value = id;
  const nav = sectionNav.value;
  const pill = nav?.querySelector(`[data-section="${id}"]`);
  if (!pill) return;
  // Scroll only the pill strip horizontally (scrollIntoView would also move the page)
  const navBox = nav.getBoundingClientRect();
  const pillBox = pill.getBoundingClientRect();
  if (pillBox.left < navBox.left || pillBox.right > navBox.right) {
    const left = nav.scrollLeft + pillBox.left - navBox.left - (navBox.width - pillBox.width) / 2;
    nav.scrollTo({ left, behavior: "smooth" });
  }
};
const trackSection = (e) => {
  const card = e.target.closest?.(".card[id]");
  if (card) setActiveSection(card.id);
};

// Scroll spy: the current step is the last section whose top has passed under the toolbar
let spyPausedUntil = 0;
let spyFrame = 0;
const spySections = () => {
  spyFrame = 0;
  if (Date.now() < spyPausedUntil) return;
  const offset = (sectionNav.value?.closest("header")?.offsetHeight ?? 0) + 40;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let current = "";
  for (const { id } of sections) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= offset) current = id;
  }
  if (atBottom) current = sections[sections.length - 1].id;
  if (current) setActiveSection(current);
};
const onScroll = () => {
  if (!spyFrame) spyFrame = requestAnimationFrame(spySections);
};

/* ── Live preview (desktop) ── */
// Wide screens dock it beside the editor (open by default, remembered);
// tablets slide it over the editor from the Preview button
const wideQuery = window.matchMedia("(min-width: 1200px)");
const tabletQuery = window.matchMedia("(min-width: 769px)");
const previewDocked = ref(wideQuery.matches);
const canPreview = ref(tabletQuery.matches);
const PREVIEW_OPEN_KEY = "settingsPreview";
const dockedPreviewPref = () => {
  try { return localStorage.getItem(PREVIEW_OPEN_KEY) !== "off"; } catch { return true; }
};
const previewOpen = ref(previewDocked.value && dockedPreviewPref());
const onWideChange = (e) => {
  previewDocked.value = e.matches;
  previewOpen.value = e.matches && dockedPreviewPref();
};
const onTabletChange = (e) => { canPreview.value = e.matches; };
watch(previewOpen, (open) => {
  if (!previewDocked.value) return;
  try { localStorage.setItem(PREVIEW_OPEN_KEY, open ? "on" : "off"); } catch { /* not remembered */ }
});
const showPreview = computed(() => canPreview.value && previewOpen.value && lastSaved.value !== null);

const previewPages = [
  { path: "/", label: "Home" },
  { path: "/couple", label: "Couple" },
  { path: "/events", label: "Events" },
  { path: "/story", label: "Story" },
  { path: "/moments", label: "Moments" },
];
// The page the section being edited shows up on
const SECTION_PAGES = { groom: "/couple", bride: "/couple", "couple-page": "/couple", events: "/events", story: "/story", moments: "/moments" };
// A page picked in the preview bar, until the editor moves to another section
const previewPick = ref(null);
watch(activeSection, () => { previewPick.value = null; });
const previewPath = computed(() => previewPick.value ?? SECTION_PAGES[activeSection.value] ?? "/");

const previewDevices = [
  { id: "phone", label: "Phone", icon: "fa-mobile-screen", width: 390, height: 844 },
  { id: "desktop", label: "Desktop", icon: "fa-desktop", width: 1280, height: 800 },
];
const previewDevice = ref("phone");
const device = computed(() => previewDevices.find((d) => d.id === previewDevice.value));

// Scale the device to fit the panel
const previewStage = ref(null);
const stageSize = reactive({ width: 0, height: 0 });
const previewScale = computed(() =>
  Math.min(1, stageSize.width / device.value.width, stageSize.height / device.value.height) || 0);
const stageObserver = new ResizeObserver(([entry]) => {
  stageSize.width = entry.contentRect.width;
  stageSize.height = entry.contentRect.height;
});
watch(previewStage, (el, old) => {
  if (old) stageObserver.unobserve(old);
  if (el) stageObserver.observe(el);
});

// The frame loads once; later page changes are sent to it
const previewFrame = ref(null);
const previewSrc = ref("/");
watch(showPreview, (shown) => { if (shown) previewSrc.value = previewPath.value; });
const postToPreview = (message) =>
  previewFrame.value?.contentWindow?.postMessage(message, window.location.origin);
// Empty fields show sample content in the preview, watermarked as such
const sendPreviewConfig = () => {
  const { config, filled } = withSampleContent(wedding.snapshot(), sampleWedding);
  previewHasSample.value = filled;
  postToPreview({ type: PREVIEW_CONFIG, config, plan: planId.value, sample: filled });
};
const previewHasSample = ref(false);
let previewFrameReq = 0;
watch(() => wedding.$state, () => {
  if (!showPreview.value || previewFrameReq) return;
  previewFrameReq = requestAnimationFrame(() => {
    previewFrameReq = 0;
    sendPreviewConfig();
  });
}, { deep: true });
watch(planId, () => { if (showPreview.value) sendPreviewConfig(); });
watch(previewPath, (path) => postToPreview({ type: PREVIEW_NAVIGATE, path }));
const onPreviewMessage = (event) => {
  if (!isPreviewMessage(event, previewFrame.value?.contentWindow)) return;
  if (event.data.type !== PREVIEW_READY) return;
  sendPreviewConfig();
  postToPreview({ type: PREVIEW_NAVIGATE, path: previewPath.value });
};

// Warn before leaving with unsaved changes
const beforeUnload = (e) => {
  if (isDirty.value) e.preventDefault();
};
onBeforeRouteLeave(() =>
  leaveConfirmed || !isDirty.value || confirm("You have unsaved changes. Leave anyway?"));
onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  loadSaved();
  window.addEventListener("beforeunload", beforeUnload);
  document.addEventListener("click", closeIconPicker);
  document.head.appendChild(previewFonts);
  window.addEventListener("message", onPreviewMessage);
  wideQuery.addEventListener("change", onWideChange);
  tabletQuery.addEventListener("change", onTabletChange);
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
  cancelAnimationFrame(spyFrame);
  clearInterval(clock);
  window.removeEventListener("beforeunload", beforeUnload);
  document.removeEventListener("click", closeIconPicker);
  previewFonts.remove();
  clearTimeout(toastTimer);
  window.removeEventListener("message", onPreviewMessage);
  wideQuery.removeEventListener("change", onWideChange);
  tabletQuery.removeEventListener("change", onTabletChange);
  stageObserver.disconnect();
  cancelAnimationFrame(previewFrameReq);
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

/* ── Live preview (desktop) ── */
$preview-width: 440px;

.full-screen.has-preview {
  width: calc(100vw - #{$preview-width});
}

.btn-ghost.active {
  background: var(--blush);
  border-color: var(--gold);
  color: var(--gold-dark);
}

.live-preview {
  --gold: #c9a96e;
  --gold-light: #e8d5a3;
  --gold-dark: #9a7a45;
  --cream: #fdf6ec;
  --dark: #1a1208;
  --text: #3d2c14;
  --blush: #f5e6d8;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: $preview-width;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px;
  background: #f3eadc;
  border-left: 1px solid color-mix(in srgb, var(--gold-light) 70%, transparent);
  font-family: 'Montserrat', sans-serif;
  color: var(--text);
}

/* Tablets: slides over the editor instead of sitting beside it */
.live-preview.overlay {
  z-index: 40;
  width: min(#{$preview-width}, calc(100vw - 80px));
  box-shadow: -12px 0 40px rgba(26, 18, 8, 0.25);
  animation: preview-in 0.25s ease;
}

.preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 39;
  background: rgba(26, 18, 8, 0.35);
}

@keyframes preview-in {
  from { transform: translateX(100%); }
}

.preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  button {
    border: 0;
    background: none;
    border-radius: 20px;
    padding: 4px 9px;
    font-size: 0.7rem;
    color: var(--text);
    opacity: 0.7;
    cursor: pointer;
    &:hover { opacity: 1; }
    &.active {
      opacity: 1;
      color: var(--dark);
      background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
    }
  }
}

.preview-pages,
.preview-devices {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 30px;
  background: #fff;
}

.preview-pages button {
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.preview-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-device {
  position: relative;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 0 0 6px var(--dark), 0 12px 32px rgba(61, 44, 20, 0.25);
  border-radius: 28px;

  &.desktop {
    border-radius: 8px;
    box-shadow: 0 0 0 4px var(--dark), 0 12px 32px rgba(61, 44, 20, 0.25);
  }

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    border: 0;
    transform-origin: top left;
  }
}

.preview-note {
  margin: 0;
  font-size: 0.7rem;
  text-align: center;
  color: var(--gold-dark);
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
    transition: background 0.2s, color 0.2s, opacity 0.2s;
    &:hover { opacity: 1; }
    &.active {
      opacity: 1;
      color: var(--dark);
      background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
    }
  }

  .step-num { display: none; }
}

/* Desktop: the pills become a wizard stepper */
@media (min-width: 641px) {
  .section-jump {
    gap: 0;
    padding: 4px 16px 12px;

    a {
      flex: 1 0 72px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      position: relative;
      padding: 0 4px;
      border-radius: 0;
      background: none;
      opacity: 1;
      font-size: 0.62rem;
      letter-spacing: 0.5px;
      line-height: 1.2;
      text-align: center;
      color: color-mix(in srgb, var(--text) 60%, transparent);

      // Connector line to the previous step
      &::before {
        content: "";
        position: absolute;
        top: 11px;
        left: -50%;
        right: 50%;
        height: 2px;
        background: var(--blush);
        transition: background 0.3s;
      }
      &:first-child::before { display: none; }

      &:hover { color: var(--gold-dark); }
      &:hover .step-num { border-color: var(--gold-dark); }

      &.done {
        color: var(--text);
        &::before { background: var(--gold-light); }
        .step-num { background: var(--gold-light); border-color: var(--gold-light); color: var(--dark); }
      }

      &.active {
        background: none;
        color: var(--gold-dark);
        font-weight: 600;
        &::before { background: var(--gold-light); }
        .step-num {
          background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%);
          border-color: var(--gold-dark);
          color: var(--dark);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--gold-light) 35%, transparent);
        }
      }
    }

    .step-num {
      display: grid;
      place-items: center;
      position: relative;
      z-index: 1;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid var(--blush);
      background: #fff;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0;
      transition: background 0.3s, border-color 0.3s, box-shadow 0.3s;
    }
  }
}

/* ── Body ── */
.settings-body {
  border: 0;
  min-width: 0;
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

.card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin-bottom: 16px;

  h2 { margin: 0; }
}

.card-subhead {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  margin: 22px 0 10px;

  h3 { margin: 0 !important; }
}

.template-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.share-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  > span { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
  p {
    margin: 0;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--blush);
    font-size: 0.85rem;
    white-space: pre-line;
    word-break: break-word;
  }
}

/* Ready-made story notes: tap one to fill the note */
.note-suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: -4px;
  > span {
    width: 100%;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.6;
  }
}

.event-fill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong { font-size: 0.8rem; font-weight: 600; }
  small { font-size: 0.72rem; opacity: 0.75; }
}

.date-suggestions { margin-top: -6px; }

.note-suggestion {
  padding: 5px 12px;
  font-size: 0.78rem;
  text-align: left;
  border: 1px dashed color-mix(in srgb, var(--gold-light) 80%, transparent);
  border-radius: 14px;
  background: #fffdf9;
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;

  &:hover:not(:disabled) { border-color: var(--gold); background: var(--blush); }

  &.selected {
    border-style: solid;
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold) 15%, #fff);
    color: var(--gold-dark);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.template-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 0.8rem;
  border: 1px solid color-mix(in srgb, var(--gold-light) 60%, transparent);
  border-radius: 999px;
  background: #fff;
  color: var(--gold-dark);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;

  i { font-size: 0.7rem; }

  &:hover:not(:disabled) { border-color: var(--gold); }

  &.selected {
    background: var(--gold);
    border-color: var(--gold);
    color: #fff;
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.span-2 { grid-column: span 2; }

.field-hint {
  margin-left: 6px;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.7rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  > span, > label {
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

/* ── Validation ── */
input.invalid,
textarea.invalid,
select.invalid { border-color: #b3261e !important; }
input.attention,
textarea.attention,
select.attention { border-color: var(--gold-dark) !important; }

.field-issue {
  font-size: 0.74rem;
  line-height: 1.3;
  &.error { color: #b3261e; }
  &.warn { color: var(--gold-dark); }
}

.list-row { flex-wrap: wrap; }
.row-issue { flex-basis: 100%; margin-left: 148px; margin-top: -4px; }

.issues-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--gold);
  border-radius: 999px;
  background: var(--blush);
  color: var(--gold-dark);
  font-size: 0.78rem;
  cursor: pointer;
  &.error {
    border-color: #b3261e;
    background: #fbeae8;
    color: #8c1d18;
  }
}

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

.photo-watermark {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 6px 3px;
  font-size: 0.55rem;
  line-height: 1.2;
  text-align: left;
  color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}
.background-preview .photo-watermark { font-size: 0.65rem; padding: 14px 10px 6px; }

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
  position: relative;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.background-gallery-label {
  font-size: 0.8rem;
  color: var(--sage);
  margin: 16px 0 8px;
}

.background-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}

.background-option {
  position: relative;
  aspect-ratio: 16 / 10;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 10px;
  overflow: hidden;
  background: var(--blush);
  cursor: pointer;
  transition: border-color 0.2s;

  img { width: 100%; height: 100%; object-fit: cover; display: block; }

  i {
    position: absolute;
    top: 6px;
    right: 6px;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  &:hover:not(:disabled) { border-color: var(--gold-light); }
  &.selected { border-color: var(--gold); }
  &:disabled { cursor: not-allowed; opacity: 0.6; }
}

.background-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  .field { width: 100%; }
}

.overlay-field {
  input[type="range"] { width: 100%; accent-color: var(--gold); }
  small { font-size: 0.7rem; color: var(--sage); }
}

.overlay-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.overlay-swatch {
  position: relative;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--text) 25%, transparent);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s;

  &.selected { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--gold); }
  &:disabled, &.disabled { cursor: not-allowed; opacity: 0.5; }
}

.overlay-custom {
  background: conic-gradient(#e66, #ec6, #6c6, #6ce, #66e, #c6e, #e66);
  i { font-size: 0.7rem; color: #fff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); }
  input { position: absolute; inset: 0; opacity: 0; cursor: inherit; width: 100%; height: 100%; }
}

.overlay-reset {
  margin-left: 8px;
  padding: 0;
  border: none;
  background: none;
  font-size: 0.75rem;
  color: var(--gold-dark);
  text-decoration: underline;
  cursor: pointer;
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

.btn-clear:hover:not(:disabled),
:deep(.image-list-actions .btn-clear:hover:not(:disabled)) {
  background: #fbe9e7;
  color: #b3261e;
  border-color: #f2b8b5;
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

/* Social links: a toggle per platform opens its link box */
.social-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.social-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border: 1px solid color-mix(in srgb, var(--gold-light) 70%, transparent);
  border-radius: 999px;
  background: #fff;
  color: var(--text);
  font-size: 0.82rem;
  text-transform: capitalize;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;

  .fa-brands { font-size: 0.95rem; color: var(--gold-dark); }
  .social-check { font-size: 0.65rem; color: var(--gold-dark); }

  &:hover:not(:disabled) { border-color: var(--gold); }
  &.filled { border-color: var(--gold); }
  &.open { background: var(--blush); border-color: var(--gold-dark); }
}

.social-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  text-transform: capitalize;
  i { color: var(--gold-dark); }
}

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

.plan-banners {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--blush);
  font-size: 0.8rem;
  i { margin-top: 2px; color: var(--gold-dark); }
  &.error {
    background: #fbeae8;
    color: #8c1d18;
    i { color: #b3261e; }
  }
  &.locked {
    align-items: center;
    background: #fdf3e1;
    color: #6b4e1f;
  }
}

.upgrade-link {
  margin-left: auto;
  flex-shrink: 0;
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
    text-decoration: underline;
    &:hover { background: none; color: var(--dark); }
  }
}

.plan-note {
  margin: -6px 0 14px;
  font-size: 0.78rem;
  color: var(--gold-dark);
}

.nav-table {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

.image-index {
  flex: 1;
  font-size: 0.78rem;
  color: var(--sage);
}

.btn-add:disabled,
:deep(.btn-add:disabled) {
  opacity: 0.45;
  cursor: not-allowed;
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

.link-btn {
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  color: var(--gold-dark);
  text-decoration: underline;
  cursor: pointer;
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
