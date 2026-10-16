<template>
  <Basic>
    <section class="m-settings">
      <!-- Top bar -->
      <header class="m-top">
        <router-link :to="{ name: 'settings-mobile' }" class="m-icon" aria-label="Back to my invitations">
          <i class="fa-solid fa-arrow-left"></i>
        </router-link>
        <div class="m-title">
          <h1>Edit invitation</h1>
          <span class="m-status" :class="statusType"><i class="m-dot"></i>{{ statusText }}</span>
        </div>
        <button v-if="isDirty && !readOnly" type="button" class="m-icon" aria-label="Discard changes" @click="discard">
          <i class="fa-solid fa-rotate-left"></i>
        </button>
        <button
          v-if="lastSaved !== null && !planLocked && (editLocked || !isDirty)"
          type="button"
          class="m-icon"
          :aria-label="editLocked ? 'Unlock editing' : 'Lock editing'"
          :disabled="lockBusy"
          @click="toggleEditLock"
        >
          <i class="fa-solid" :class="lockBusy ? 'fa-spinner fa-spin' : editLocked ? 'fa-lock' : 'fa-lock-open'"></i>
        </button>
        <button v-if="lastSaved !== null" type="button" class="m-icon" aria-label="Version history" @click="openHistory">
          <i class="fa-solid" :class="limits.history ? 'fa-clock-rotate-left' : 'fa-lock'"></i>
        </button>
        <router-link v-if="lastSaved !== null" :to="{ name: 'traditional-mobile', query: { id: weddingId } }" class="m-icon" aria-label="Printed card">
          <i class="fa-solid fa-file-pdf"></i>
        </router-link>
        <button v-if="shareLink" type="button" class="m-icon" aria-label="Share guest link" @click="share">
          <i class="fa-solid" :class="codeCopied ? 'fa-check' : 'fa-share-nodes'"></i>
        </button>
      </header>

      <div v-if="lastSaved === null" class="m-loading">
        <template v-if="loadError">
          <p>{{ loadError }}</p>
          <button class="m-btn primary" @click="loadSaved"><i class="fa-solid fa-rotate-right"></i> Retry</button>
        </template>
        <p v-else><i class="fa-solid fa-spinner fa-spin"></i> Loading your wedding…</p>
      </div>

      <template v-else>
        <!-- Plan status (outside the fieldset so Upgrade works when read-only) -->
        <div v-if="myPlan !== null" class="m-banners">
          <div v-if="planLocked" class="m-banner error">
            <i class="fa-solid fa-lock"></i>
            <span>Over your {{ limits.label }} plan's invitation limit, so this one is read-only and its guest link is off.</span>
            <button v-if="planId === 'free'" type="button" class="m-link" @click="showUpgrade('invitations')">Upgrade</button>
          </div>
          <div v-else-if="overList.length" class="m-banner error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Over your plan's limits: {{ overList.join(', ') }}. Remove the extras to save.</span>
            <button v-if="planId === 'free'" type="button" class="m-link" @click="showUpgrade()">Upgrade</button>
          </div>
          <div v-if="weddingMeta.hidden" class="m-banner locked">
            <i class="fa-solid fa-eye-slash"></i>
            <span>Hidden from guests. You can still preview it while signed in.</span>
            <button type="button" class="m-link" :disabled="hideBusy" @click="toggleHidden">Show</button>
          </div>
          <div v-if="editLocked && !planLocked" class="m-banner locked">
            <i class="fa-solid fa-lock"></i>
            <span>Locked, so it can't be edited. Guests can still open it.</span>
            <button type="button" class="m-link" :disabled="lockBusy" @click="toggleEditLock">Unlock</button>
          </div>
          <div class="m-banner">
            <i class="fa-solid fa-crown"></i>
            <span>{{ limits.label }} · {{ weddingMeta.uploads }} / {{ limits.uploads }} uploads</span>
            <button v-if="planId === 'free'" type="button" class="m-link" @click="showUpgrade(uploadsLeft <= 0 ? 'uploads' : '')">Upgrade</button>
          </div>
        </div>

        <fieldset class="m-body" :disabled="readOnly">
          <template v-for="g in groups" :key="g.label">
          <p class="m-group">{{ g.label }}</p>
          <div class="m-list">
          <div v-for="s in g.sections" :key="s.id" class="m-section" :class="{ open: openSection === s.id }">
            <button type="button" class="m-section-head" :aria-expanded="openSection === s.id" @click="toggle(s.id)">
              <i class="fa-solid m-section-icon" :class="s.icon"></i>
              <span class="m-section-text">
                <strong>{{ s.label }}</strong>
                <small>{{ summaries[s.id] }}</small>
              </span>
              <span v-if="issueCount(s.id)" class="m-badge" :class="{ error: sectionHasError(s.id) }">{{ issueCount(s.id) }}</span>
              <i class="fa-solid fa-chevron-down m-caret"></i>
            </button>

            <div v-if="openSection === s.id" class="m-section-body">
              <!-- Theme -->
              <template v-if="s.id === 'theme'">
                <div class="m-scroller">
                  <button
                    v-for="theme in themes"
                    :key="theme.id"
                    type="button"
                    class="m-theme"
                    :class="{ selected: wedding.theme === theme.id }"
                    @click="pickTheme(theme)"
                  >
                    <span class="m-theme-swatch" :style="{ background: theme.colors.cream }">
                      <span v-for="c in ['gold-light', 'gold', 'gold-dark', 'dark']" :key="c" :style="{ background: theme.colors[c] }"></span>
                    </span>
                    <span class="m-theme-name">
                      {{ theme.name }}
                      <i v-if="wedding.theme === theme.id" class="fa-solid fa-circle-check"></i>
                    </span>
                  </button>
                </div>
              </template>

              <!-- Couple -->
              <template v-else-if="s.id === 'couple'">
                <div v-for="key in ['groom', 'bride']" :key="key" class="m-person">
                  <h3>{{ key === 'groom' ? 'Groom' : 'Bride' }}</h3>
                  <div class="m-person-top">
                    <div class="m-removable">
                      <button type="button" class="m-avatar" :disabled="uploading === key" @click="pick(key)">
                        <img :src="wedding[key].photo || PLACEHOLDER_PHOTO" alt="" />
                        <span><i class="fa-solid" :class="uploading === key ? 'fa-spinner fa-spin' : 'fa-camera'"></i></span>
                      </button>
                      <button
                        v-if="wedding[key].photo && uploading !== key"
                        type="button"
                        class="m-image-remove"
                        aria-label="Remove photo"
                        @click="removeImage(wedding[key], 'photo', 'photo')"
                      ><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="m-person-names">
                      <label class="m-field">
                        <span>Full name</span>
                        <input v-model="wedding[key].name" maxlength="60" :id="`${key}-name`" :class="issueClass(`${key}-name`)" :placeholder="examples[key].name" autocomplete="off" />
                        <FieldIssue :for="`${key}-name`" />
                      </label>
                      <label class="m-field">
                        <span>Short name</span>
                        <input v-model="wedding[key].shortName" maxlength="30" :id="`${key}-shortName`" :class="issueClass(`${key}-shortName`)" :placeholder="examples[key].shortName" autocomplete="off" />
                      </label>
                    </div>
                  </div>
                  <label class="m-field">
                    <span>Profession / passion</span>
                    <input v-model="wedding[key].profession" maxlength="60" :list="`${key}-professions`" autocomplete="off" :placeholder="examples[key].profession" />
                    <datalist :id="`${key}-professions`">
                      <option v-for="job in PROFESSIONS" :key="job" :value="job" />
                    </datalist>
                  </label>
                  <label class="m-field">
                    <span>Father's name</span>
                    <input :value="wedding[key].father" @input="setParentName(key, wedding[key], 'father', $event.target.value)" maxlength="60" :placeholder="examples[key].father" autocomplete="off" />
                  </label>
                  <label class="m-field">
                    <span>Mother's name</span>
                    <input :value="wedding[key].mother" @input="setParentName(key, wedding[key], 'mother', $event.target.value)" maxlength="60" :placeholder="examples[key].mother" autocomplete="off" />
                  </label>
                  <div v-if="parentsSuggestions(key).length" class="m-note-suggestions" role="group" :aria-label="`Parents line suggestions for the ${key}`">
                    <span>Suggestions</span>
                    <button
                      v-for="text in parentsSuggestions(key)"
                      :key="text"
                      type="button"
                      class="m-note-suggestion"
                      :class="{ selected: wedding[key].parents === text }"
                      :aria-pressed="wedding[key].parents === text"
                      @click="wedding[key].parents = text"
                    >{{ text }}</button>
                  </div>
                  <label class="m-field">
                    <span>Parents line</span>
                    <input v-model="wedding[key].parents" maxlength="150" :placeholder="examples[key].parents" />
                    <small class="m-hint">Pick a suggestion or write your own.</small>
                  </label>
                  <div class="m-field">
                    <label :for="`${key}-interests`">Interests</label>
                    <InterestPills v-model="wedding[key].interests" :id="`${key}-interests`" :suggestions="INTERESTS" :max="MAX_INTERESTS" :placeholder="examples[key].interests" compact />
                  </div>
                  <div v-if="bioSuggestions(wedding[key]).length" class="m-note-suggestions" role="group" :aria-label="`Bio suggestions for the ${key}`">
                    <span>About suggestions</span>
                    <button
                      v-for="text in bioSuggestions(wedding[key])"
                      :key="text"
                      type="button"
                      class="m-note-suggestion"
                      :class="{ selected: wedding[key].bio === text }"
                      :aria-pressed="wedding[key].bio === text"
                      @click="wedding[key].bio = text"
                    >{{ text }}</button>
                  </div>
                  <label class="m-field">
                    <span>About</span>
                    <textarea v-model="wedding[key].bio" rows="3" maxlength="600" :id="`${key}-bio`" :class="issueClass(`${key}-bio`)" :placeholder="examples[key].bio"></textarea>
                    <FieldIssue :for="`${key}-bio`" />
                  </label>
                  <div class="m-field">
                    <span>Social links</span>
                    <div class="m-social-toggles" role="group" :aria-label="`${key} social links`">
                      <button
                        v-for="t in SOCIAL_TYPES"
                        :key="t"
                        type="button"
                        class="m-social-toggle"
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
                  </div>
                  <template v-for="t in SOCIAL_TYPES" :key="t">
                  <div v-if="socials.isOpen(key, t)" class="m-field m-social">
                    <i class="fa-brands" :class="`fa-${t}`"></i>
                    <input
                      type="url"
                      inputmode="url"
                      maxlength="300"
                      :aria-label="`${t} link`"
                      :data-social="`${key}:${t}`"
                      :id="socials.id(key, t)"
                      :class="issueClass(socials.id(key, t))"
                      :value="socials.url(key, t)"
                      :placeholder="socialExamples[t]"
                      @input="socials.set(key, t, $event.target.value)"
                    />
                    <button type="button" class="m-icon m-social-remove" :aria-label="`Remove ${t} link`" @click="socials.remove(key, t)">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                    <FieldIssue :for="socials.id(key, t)" />
                  </div>
                  </template>
                </div>
                <h3>Couple page heading</h3>
                <div class="m-row">
                  <SuggestInput v-model="wedding.couplePage.subTitle" :options="coupleSubTitles" label="Sub title" />
                  <SuggestInput v-model="wedding.couplePage.title" :options="coupleTitles" label="Title" />
                </div>
              </template>

              <!-- Home -->
              <template v-else-if="s.id === 'home'">
                <div class="m-field">
                  <span>Layout</span>
                  <div class="m-segment" role="radiogroup" aria-label="Home page layout">
                    <button
                      v-for="t in heroTemplates"
                      :key="t.id"
                      type="button"
                      role="radio"
                      :aria-checked="(wedding.hero.template || 'classic') === t.id"
                      :class="{ selected: (wedding.hero.template || 'classic') === t.id }"
                      @click="wedding.hero.template = t.id"
                    >{{ t.label }}</button>
                  </div>
                </div>
                <SuggestInput v-model="wedding.hero.inviteLine" :options="inviteLines" label="Invite line" id="hero-inviteLine" :maxlength="120" />
                <div v-if="heroSuggestions.length" class="m-note-suggestions" role="group" aria-label="Fill from an event">
                  <span>Fill from an event</span>
                  <button
                    v-for="(s, i) in heroSuggestions"
                    :key="i"
                    type="button"
                    class="m-note-suggestion m-event-fill"
                    :class="{ selected: isHeroFrom(s) }"
                    @click="fillHeroFrom(s)"
                  >
                    <strong>{{ s.label }}</strong>
                    <small>{{ [s.dateTexts[1], s.timeText, s.locationText].filter(Boolean).join(' · ') }}</small>
                  </button>
                </div>
                <label class="m-field">
                  <span>Wedding date & time</span>
                  <input type="datetime-local" v-model="weddingDate" id="wedding-date" :class="issueClass('wedding-date')" />
                  <FieldIssue for="wedding-date" />
                </label>
                <div class="m-row">
                  <SuggestInput v-model="wedding.hero.dateText" :options="heroDateTexts" label="Date text" :maxlength="40" placeholder="12 · 06 · 2027" />
                  <SuggestInput v-model="wedding.hero.timeText" :options="heroTimeTexts" label="Time text" :maxlength="40" placeholder="10 AM - 12 PM" />
                </div>
                <SuggestInput v-model="wedding.hero.locationText" :options="heroLocationTexts" label="Location" :maxlength="100" placeholder="Sri Krishna Mahal, Chennai" />
                <label class="m-field">
                  <span>Countdown</span>
                  <select v-model="countdownChoice">
                    <option v-for="t in countdownStyles" :key="t.id" :value="t.id">{{ t.label }}</option>
                  </select>
                </label>

                <h3>Background</h3>
                <div class="m-scroller">
                  <button type="button" class="m-bg m-bg-upload" :disabled="uploading === 'background'" @click="pick('background')">
                    <i class="fa-solid" :class="uploading === 'background' ? 'fa-spinner fa-spin' : 'fa-plus'"></i>
                    <span>Upload</span>
                  </button>
                  <div
                    v-if="wedding.hero.backgroundImage && !backgroundGallery.includes(wedding.hero.backgroundImage)"
                    class="m-removable"
                  >
                    <button type="button" class="m-bg selected">
                      <img :src="wedding.hero.backgroundImage" alt="" />
                    </button>
                    <button
                      type="button"
                      class="m-image-remove"
                      aria-label="Remove background"
                      @click="removeImage(wedding.hero, 'backgroundImage', 'background image')"
                    ><i class="fa-solid fa-xmark"></i></button>
                  </div>
                  <button
                    v-for="src in backgroundGallery"
                    :key="src"
                    type="button"
                    class="m-bg"
                    :class="{ selected: wedding.hero.backgroundImage === src }"
                    @click="wedding.hero.backgroundImage = src"
                  >
                    <img :src="src.replace('/bg-home/', '/bg-home/thumbs/')" alt="" loading="lazy" />
                  </button>
                </div>
              </template>

              <!-- Events -->
              <template v-else-if="s.id === 'events'">
                <div class="m-row">
                  <SuggestInput v-model="wedding.eventsPage.subTitle" :options="eventsSubTitles" label="Sub title" />
                  <SuggestInput v-model="wedding.eventsPage.title" :options="eventsTitles" label="Title" />
                </div>
                <label class="m-field">
                  <span>Time zone (for guests' calendars)</span>
                  <select v-model="wedding.eventsPage.timezone">
                    <option value="">Guest's own time zone</option>
                    <option v-for="tz in timeZones" :key="tz" :value="tz">{{ tz.replace(/_/g, ' ') }}</option>
                  </select>
                </label>
                <div class="m-item" v-for="(event, i) in wedding.eventsPage.events" :key="i">
                  <div class="m-item-head">
                    <strong>{{ event.name || `Event ${i + 1}` }}</strong>
                    <ItemControls :list="wedding.eventsPage.events" :index="i" />
                  </div>
                  <SuggestInput v-model="event.name" :options="eventNames" label="Name" :id="`event-${i}-name`" :maxlength="40" />
                  <label class="m-field">
                    <span>Date</span>
                    <input type="date" :value="event.date" :id="`event-${i}-date`" :class="issueClass(`event-${i}-date`)" @change="pickEventDate(event, $event.target.value)" />
                    <FieldIssue :for="`event-${i}-date`" />
                  </label>
                  <div class="m-row">
                    <label class="m-field">
                      <span>Starts</span>
                      <input type="time" :value="event.start" :id="`event-${i}-start`" :class="issueClass(`event-${i}-start`)" @change="setEventTime(event, 'start', $event.target.value)" />
                    </label>
                    <label class="m-field">
                      <span>Ends</span>
                      <input type="time" :value="event.end" @change="setEventTime(event, 'end', $event.target.value)" />
                    </label>
                  </div>
                  <FieldIssue :for="`event-${i}-start`" />
                  <label class="m-field">
                    <span>Time shown to guests</span>
                    <input v-model="event.time" maxlength="40" placeholder="10:00 AM – 12:00 PM" />
                  </label>
                  <div class="m-row">
                    <label class="m-field">
                      <span>Venue</span>
                      <input v-model="event.venue" maxlength="80" :id="`event-${i}-venue`" :class="issueClass(`event-${i}-venue`)" placeholder="Sri Krishna Mahal" />
                    </label>
                    <label class="m-field">
                      <span>City</span>
                      <input v-model="event.location" maxlength="80" placeholder="Chennai" />
                    </label>
                  </div>
                  <FieldIssue :for="`event-${i}-venue`" />
                  <label class="m-field">
                    <span>Map link (optional)</span>
                    <input v-model.trim="event.mapUrl" type="url" inputmode="url" maxlength="500" :id="`event-${i}-mapUrl`" :class="issueClass(`event-${i}-mapUrl`)" placeholder="https://maps.app.goo.gl/…" />
                    <FieldIssue :for="`event-${i}-mapUrl`" />
                  </label>
                </div>
                <AddChips :list="wedding.eventsPage.events" :names="eventNames" :max="limits.events" :blank="blankEvent" noun="event" />
              </template>

              <!-- Story -->
              <template v-else-if="s.id === 'story'">
                <div class="m-row">
                  <SuggestInput v-model="wedding.storyPage.subTitle" :options="storySubTitles" label="Sub title" />
                  <SuggestInput v-model="wedding.storyPage.title" :options="storyTitles" label="Title" />
                </div>
                <div class="m-item" v-for="(milestone, i) in wedding.storyPage.milestones" :key="i">
                  <div class="m-item-head">
                    <strong>{{ milestone.name || `Milestone ${i + 1}` }}</strong>
                    <ItemControls :list="wedding.storyPage.milestones" :index="i" />
                  </div>
                  <SuggestInput v-model="milestone.name" :options="milestoneNames" label="Name" :id="`milestone-${i}-name`" :maxlength="40" />
                  <div class="m-row three">
                    <label class="m-field">
                      <span>Day</span>
                      <input v-model.trim="milestone.day" inputmode="numeric" maxlength="2" :id="`milestone-${i}-day`" :class="issueClass(`milestone-${i}-day`)" placeholder="14" />
                    </label>
                    <label class="m-field">
                      <span>Month</span>
                      <select v-model="milestone.month">
                        <option value="">–</option>
                        <option v-if="milestone.month && !SHORT_MONTHS.includes(milestone.month)" :value="milestone.month">{{ milestone.month }}</option>
                        <option v-for="m in SHORT_MONTHS" :key="m" :value="m">{{ m }}</option>
                      </select>
                    </label>
                    <label class="m-field">
                      <span>Year</span>
                      <input v-model.trim="milestone.year" inputmode="numeric" maxlength="4" :id="`milestone-${i}-year`" :class="issueClass(`milestone-${i}-year`)" placeholder="2025" />
                    </label>
                  </div>
                  <FieldIssue :for="`milestone-${i}-day`" />
                  <FieldIssue :for="`milestone-${i}-year`" />
                  <label class="m-field">
                    <span>Note</span>
                    <textarea v-model="milestone.note" rows="2" maxlength="300" placeholder="The day our paths crossed."></textarea>
                  </label>
                  <div class="m-note-suggestions" role="group" :aria-label="`Note suggestions for ${milestone.name || 'this milestone'}`">
                    <span>Suggestions</span>
                    <button
                      v-for="text in storyNoteSuggestions(milestone.name)"
                      :key="text"
                      type="button"
                      class="m-note-suggestion"
                      :class="{ selected: milestone.note === text }"
                      :aria-pressed="milestone.note === text"
                      @click="milestone.note = text"
                    >
                      {{ text }}
                    </button>
                  </div>
                </div>
                <AddChips :list="wedding.storyPage.milestones" :names="milestoneNames" :max="limits.milestones" :blank="blankMilestone" noun="milestone" />
              </template>

              <!-- Gallery -->
              <template v-else-if="s.id === 'gallery'">
                <div class="m-row">
                  <SuggestInput v-model="wedding.momentsPage.subTitle" :options="momentsSubTitles" label="Sub title" />
                  <SuggestInput v-model="wedding.momentsPage.title" :options="momentsTitles" label="Title" />
                </div>
                <ImageGrid :images="wedding.momentsPage.images" :max="limits.gallery" upload-key="gallery" />
              </template>

              <!-- Save the date -->
              <template v-else-if="s.id === 'popup'">
                <label class="m-switch">
                  <span>Show popup when guests open the invite</span>
                  <input type="checkbox" v-model="wedding.saveTheDate.enabled" />
                </label>
                <template v-if="wedding.saveTheDate.enabled">
                  <label class="m-field">
                    <span>Hide after (empty = never)</span>
                    <input type="datetime-local" v-model="wedding.saveTheDate.expiresAt" id="std-expires" :class="issueClass('std-expires')" />
                    <FieldIssue for="std-expires" />
                  </label>
                  <div id="std-images">
                    <ImageGrid :images="wedding.saveTheDate.images" :max="limits.saveTheDate" upload-key="save-the-date" />
                    <FieldIssue for="std-images" />
                  </div>
                </template>
              </template>

              <!-- Site -->
              <template v-else-if="s.id === 'site'">
                <label class="m-field">
                  <span>Browser tab title</span>
                  <input v-model="wedding.site.title" maxlength="100" id="site-title" :class="issueClass('site-title')" placeholder="Arjun & Meera — Wedding Invitation" />
                  <FieldIssue for="site-title" />
                </label>
                <label class="m-field">
                  <span>Monogram</span>
                  <input v-model="wedding.site.monogram" maxlength="6" id="site-monogram" :class="issueClass('site-monogram')" placeholder="A&M" />
                  <FieldIssue for="site-monogram" />
                </label>
                <label class="m-field">
                  <span>Share message</span>
                  <textarea v-model="wedding.site.shareMessage" rows="4" maxlength="500" id="site-shareMessage" :class="issueClass('site-shareMessage')" :placeholder="DEFAULT_SHARE_MESSAGE"></textarea>
                  <small class="m-hint">Use {groom}, {bride}, {date}, {venue} and {link}. The link is added at the end if you leave it out.</small>
                  <FieldIssue for="site-shareMessage" />
                </label>
                <div class="m-note-suggestions" role="group" aria-label="Share message suggestions">
                  <span>Suggestions</span>
                  <button
                    v-for="text in SHARE_MESSAGE_SUGGESTIONS"
                    :key="text"
                    type="button"
                    class="m-note-suggestion"
                    :class="{ selected: wedding.site.shareMessage === text }"
                    :aria-pressed="wedding.site.shareMessage === text"
                    @click="wedding.site.shareMessage = text"
                  >
                    {{ text }}
                  </button>
                </div>
                <router-link :to="{ name: 'edit-wedding', params: { id: weddingId }, query: { view: 'desktop' } }" class="m-link-row">
                  <i class="fa-solid fa-sliders"></i> More options in the full editor
                </router-link>
              </template>
            </div>
          </div>
          </div>
          </template>
        </fieldset>
      </template>

      <!-- Hidden pickers for the single-image uploads -->
      <input
        v-for="key in ['groom', 'bride', 'background']"
        :key="key"
        :ref="(el) => (photoInputs[key] = el)"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        hidden
        @change="uploadSingle(key, $event)"
      />

      <!-- Messages -->
      <Transition name="m-toast">
        <div v-if="message" class="m-toast" :class="messageType" role="status">{{ message }}</div>
      </Transition>

      <!-- Bottom bar -->
      <footer v-if="lastSaved !== null" class="m-bottom">
        <button
          v-if="shownIssues.length"
          type="button"
          class="m-issues"
          :class="{ error: errorIssues.length }"
          @click="jumpToIssue(shownIssues[0])"
        >
          <i class="fa-solid" :class="errorIssues.length ? 'fa-circle-exclamation' : 'fa-triangle-exclamation'"></i>
          {{ shownIssues.length }}
        </button>
        <button
          class="m-btn primary m-save"
          @click="save"
          :disabled="(!isDirty && weddingCode) || saving || readOnly || overList.length > 0"
        >
          <i class="fa-solid" :class="saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          {{ saving ? 'Saving…' : isDirty || !weddingCode ? 'Save' : 'Saved' }}
        </button>
      </footer>
    </section>
    <VersionHistory v-model:open="historyOpen" :wedding-id="weddingId" :keep="limits.history" :read-only="readOnly" @restore="restoreVersion" />
    <HeroSyncDialog :options="heroSync" @update="saveNow" @keep="saveNow()" @cancel="heroSync = null" />
  </Basic>
</template>

<script setup>
import { ref, computed, h, nextTick, onMounted, onBeforeUnmount } from "vue";
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
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { themes, getTheme } from "@/config/themes";
import { PLACEHOLDER_PHOTO } from "@/config/blankWedding";
import { validateWedding, SHORT_MONTHS } from "@/utils/validation";
import { localTimeZone, setEventDate, setEventTime, timeZoneOptions } from "@/utils/calendar";
import { storyNoteSuggestions } from "@/config/storyNotes";
import { eventSuggestions, heroSyncOptions, suggestionValues } from "@/utils/eventSuggestions";
import { SOCIAL_TYPES, useSocialLinks } from "@/composables/socialLinks";
import { parentsLineSuggestions, setParentName } from "@/utils/parentsLine";
import { bioSuggestions, INTERESTS, MAX_INTERESTS, PROFESSIONS } from "@/utils/bioSuggestions";
import InterestPills from "@/components/InterestPills.vue";
import { shareMessage, DEFAULT_SHARE_MESSAGE, SHARE_MESSAGE_SUGGESTIONS } from "@/utils/shareMessage";

// Phone-first editor: one section open at a time, save bar pinned to the bottom.
// Covers the everyday fields; rarer ones (navigation, labels) stay in Settings.vue.
const wedding = useWeddingStore();
const auth = useAuthStore();
const route = useRoute();
const weddingId = route.params.id;

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

/* ── Sections ── */
const groups = [
  {
    label: "Appearance",
    sections: [
      { id: "theme", label: "Theme", icon: "fa-palette" },
    ],
  },
  {
    label: "Content",
    sections: [
      { id: "couple", label: "Couple", icon: "fa-user-group" },
      { id: "events", label: "Events", icon: "fa-calendar-days" },
      { id: "home", label: "Home page", icon: "fa-house" },
      { id: "story", label: "Story", icon: "fa-book-open" },
      { id: "gallery", label: "Gallery", icon: "fa-images" },
    ],
  },
  {
    label: "Sharing",
    sections: [
      { id: "popup", label: "Save the date", icon: "fa-envelope-open-text" },
      { id: "site", label: "Site", icon: "fa-globe" },
    ],
  },
];
const openSection = ref("couple");
const toggle = (id) => {
  openSection.value = openSection.value === id ? "" : id;
  if (openSection.value) nextTick(() => document.querySelector(".m-section.open")?.scrollIntoView({ behavior: "smooth", block: "start" }));
};

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const summaries = computed(() => {
  const groom = wedding.groom.shortName || wedding.groom.name;
  const bride = wedding.bride.shortName || wedding.bride.name;
  return {
    theme: getTheme(wedding.theme).name,
    couple: groom || bride ? `${groom || "Groom"} & ${bride || "Bride"}` : "Add your names",
    home: wedding.hero.dateText || wedding.hero.locationText || "Date, place & background",
    events: plural(wedding.eventsPage.events.length, "event"),
    story: plural(wedding.storyPage.milestones.length, "milestone"),
    gallery: `${wedding.momentsPage.images.length} / ${limits.value.gallery} photos`,
    popup: wedding.saveTheDate.enabled ? plural(wedding.saveTheDate.images.length, "image") : "Off",
    site: wedding.site.monogram || "Title & monogram",
  };
});

/* ── Suggestions (typed freely or picked from the list) ── */
const inviteLines = [
  "You are invited to the wedding ceremony of",
  "Together with their families",
  "Please join us to celebrate the wedding of",
  "With the blessings of our elders",
  "Save the date for the wedding of",
  "We request the pleasure of your company at the marriage of",
];
const coupleSubTitles = ["Meet the Couple", "The Happy Couple", "Bride & Groom", "Two Hearts, One Love", "Made for Each Other", "Together Forever"];
const coupleTitles = computed(() => {
  const groom = wedding.groom.shortName || wedding.groom.name;
  const bride = wedding.bride.shortName || wedding.bride.name;
  const named = groom && bride ? [`${groom} & ${bride}`, `${bride} & ${groom}`] : [];
  return [...named, "Our Love Story", "Happily Ever After", "Two Souls, One Heart", "The Beginning of Forever"];
});
const eventsSubTitles = ["Join Our Celebrations", "Save the Dates", "Celebrate With Us", "The Big Days", "Wedding Events", "Be Our Guest"];
const eventsTitles = ["The Wedding Itinerary", "Wedding Schedule", "When & Where", "Order of Events", "Our Wedding Celebrations", "Events & Venues"];
const storySubTitles = ["How We Got Here", "Our Journey", "How It All Began", "Once Upon a Time", "From Strangers to Soulmates", "Our Love Story"];
const storyTitles = ["Our Sweet Journey", "Our Story", "A Love Story", "The Story of Us", "Two Paths, One Journey", "Moments That Made Us"];
const momentsSubTitles = ["Captured Moments", "Memories We Cherish", "Snapshots of Us", "Frozen in Time", "Glimpses of Love", "Moments to Remember"];
const momentsTitles = ["Our Gallery", "Picture Perfect", "Our Moments", "Through the Lens", "Love in Frames", "Memory Lane"];
const eventNames = ["Engagement", "Haldi", "Mehendi", "Sangeet", "Marriage", "Reception"];
const milestoneNames = ["First Meet", "First Date", "Falling in Love", "The Proposal", "Families Meet", "Engagement", "Wedding"];

// Text input with a native suggestion dropdown (datalist), so no "Custom…" step is needed
// (only one section is open at a time, so labels are unique enough for the list id)
const SuggestInput = (props, { emit }) => {
  const listId = `${props.id || props.label.toLowerCase().replace(/\W+/g, "-")}-list`;
  const options = props.options;
  return h("label", { class: "m-field" }, [
    h("span", props.label),
    h("input", {
      value: props.modelValue,
      list: listId,
      id: props.id,
      maxlength: props.maxlength || 60,
      class: props.id && issueClass(props.id),
      autocomplete: "off",
      placeholder: props.placeholder || options[0],
      onInput: (e) => emit("update:modelValue", e.target.value),
    }),
    h("datalist", { id: listId }, options.map((o) => h("option", { value: o }))),
    props.id && h(FieldIssue, { for: props.id }),
  ]);
};
SuggestInput.props = ["modelValue", "options", "label", "id", "maxlength", "placeholder"];
SuggestInput.emits = ["update:modelValue"];

/* ── Lists ── */
const blankEvent = (name = "") => ({ name, date: "", start: "", end: "", day: "", month: "", time: "", venue: "", location: "", mapUrl: "" });
// The first date picked also sets the time zone, to the couple's own
const pickEventDate = (event, date) => {
  setEventDate(event, date);
  if (date && !wedding.eventsPage.timezone) wedding.eventsPage.timezone = localTimeZone();
};
const timeZones = computed(() => timeZoneOptions(wedding.eventsPage.timezone));
const blankMilestone = (name = "") => ({ name, day: "", month: "", year: "", note: "" });

const remove = (list, i) => {
  const item = list[i];
  const filled = typeof item === "object" && Object.entries(item).some(([k, v]) => k !== "name" && v);
  if (filled && !confirm(`Remove ${item.name || "this item"} and its details?`)) return;
  list.splice(i, 1);
};
const move = (list, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
};

const ItemControls = (props) =>
  h("div", { class: "m-controls" }, [
    h("button", { type: "button", class: "m-icon small", "aria-label": "Move up", disabled: props.index === 0, onClick: () => move(props.list, props.index, -1) }, [h("i", { class: "fa-solid fa-arrow-up" })]),
    h("button", { type: "button", class: "m-icon small danger", "aria-label": "Remove", onClick: () => remove(props.list, props.index) }, [h("i", { class: "fa-solid fa-trash" })]),
  ]);
ItemControls.props = ["list", "index"];

// One-tap chips for suggested names not used yet, plus a blank one
const AddChips = (props) => {
  const full = props.list.length >= props.max;
  const unused = props.names.filter((n) => !props.list.some((item) => item.name === n));
  return h("div", { class: "m-add" }, [
    h("small", `${props.list.length} / ${props.max} ${props.noun}s`),
    h("div", { class: "m-chips" }, [
      ...unused.map((name) =>
        h("button", { type: "button", class: "m-chip", disabled: full, onClick: () => props.list.push(props.blank(name)) }, [h("i", { class: "fa-solid fa-plus" }), ` ${name}`])
      ),
      h("button", { type: "button", class: "m-chip", disabled: full, onClick: () => props.list.push(props.blank()) }, [h("i", { class: "fa-solid fa-pen" }), " Other"]),
    ]),
  ]);
};
AddChips.props = ["list", "names", "max", "blank", "noun"];

// Clears a single image (the upload still counts towards the plan)
const removeImage = (target, field, label) => {
  if (confirm(`Remove this ${label}?`)) target[field] = "";
};

// Thumbnails in a grid, tap × to remove, last tile uploads more
const ImageGrid = (props) => {
  const busy = uploading.value === props.uploadKey;
  const canAdd = props.images.length < props.max && uploadsLeft.value > 0;
  return h("div", { class: "m-images" }, [
    ...props.images.map((src, i) =>
      h("div", { class: "m-image", key: src + i }, [
        h("img", { src, alt: "", loading: "lazy" }),
        h("button", { type: "button", class: "m-image-remove", "aria-label": "Remove image", onClick: () => props.images.splice(i, 1) }, [h("i", { class: "fa-solid fa-xmark" })]),
      ])
    ),
    (canAdd || busy) &&
      h("label", { class: ["m-image", "m-image-add", { busy }] }, [
        h("i", { class: busy ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-plus" }),
        h("span", busy ? uploadProgress.value : `${props.images.length}/${props.max}`),
        h("input", {
          type: "file",
          accept: "image/jpeg,image/png,image/webp,image/gif,image/avif",
          multiple: true,
          hidden: true,
          disabled: busy,
          onChange: (e) => uploadMany(props.uploadKey, props.images, props.max, e),
        }),
      ]),
  ]);
};
ImageGrid.props = ["images", "max", "uploadKey"];

/* ── Home page options ── */
const heroTemplates = [
  { id: "classic", label: "Classic" },
  { id: "framed", label: "Framed" },
  { id: "minimal", label: "Minimal" },
];
const countdownStyles = [
  { id: "off", label: "Off" },
  { id: "classic", label: "Classic" },
  { id: "boxes", label: "Boxes" },
  { id: "circles", label: "Circles" },
  { id: "inline", label: "Inline" },
];
const countdownChoice = computed({
  get: () => (wedding.hero.countdown.enabled ? wedding.hero.countdown.style || "classic" : "off"),
  set: (id) => {
    wedding.hero.countdown.enabled = id !== "off";
    if (id !== "off") wedding.hero.countdown.style = id;
  },
});
// The save-the-date popup follows the wedding date until "Hide after" is set to something else
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

const backgroundGallery = Object.keys(
  import.meta.glob("/public/images/bg-home/*.{jpg,jpeg,png,webp,avif}", { query: "?url" }),
).map((path) => path.replace(/^\/public/, ""));

const pickTheme = (theme) => {
  wedding.theme = theme.id;
  flash(`${theme.name} theme applied`, "ok");
};

/* ── Socials: each platform's link box opens from its toggle ── */
const socialExamples = {
  instagram: "https://instagram.com/…",
  facebook: "https://facebook.com/…",
  whatsapp: "https://wa.me/91…",
};
const socials = useSocialLinks(wedding, (id) => issueFor(id));

const parentsSuggestions = (key) => parentsLineSuggestions(key, wedding[key].father, wedding[key].mother);

const examples = {
  groom: {
    name: "Arjun Kumar",
    shortName: "Arjun",
    profession: "Software Engineer",
    interests: "Cricket, Road trips",
    father: "Ravi Kumar",
    mother: "Lakshmi Kumar",
    parents: "Son of Mr. Ravi Kumar & Mrs. Lakshmi Kumar",
    bio: "Loves cricket, road trips and filter coffee.",
  },
  bride: {
    name: "Meera Nair",
    shortName: "Meera",
    profession: "Doctor",
    interests: "Classical dance, Books",
    father: "Suresh Nair",
    mother: "Anjali Nair",
    parents: "Daughter of Mr. Suresh Nair & Mrs. Anjali Nair",
    bio: "Loves classical dance, books and the beach.",
  },
};

/* ── Load / save ── */
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

const saving = ref(false);
const message = ref("");
const messageType = ref("");
let flashTimer = null;
const flash = (text, type) => {
  message.value = text;
  messageType.value = type;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { message.value = ""; }, 3500);
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

const statusText = computed(() =>
  loadError.value || (lastSaved.value === null ? "Loading…" : isDirty.value ? "Unsaved changes" : "All changes saved"));
const statusType = computed(() => (loadError.value ? "error" : isDirty.value || lastSaved.value === null ? "warn" : "ok"));

/* ── Validation ── */
const now = ref(Date.now());
const clock = setInterval(() => { now.value = Date.now(); }, 60 * 1000);
const triedSave = ref(false);
const issues = computed(() => validateWedding(wedding.$state, now.value));
const shownIssues = computed(() => issues.value.filter((i) => !i.required || triedSave.value));
const errorIssues = computed(() => issues.value.filter((i) => i.level === "error"));
const issueFor = (id) => id && (shownIssues.value.find((i) => i.id === id && i.level === "error") || shownIssues.value.find((i) => i.id === id));
const issueClass = (id) => {
  const issue = issueFor(id);
  return issue && (issue.level === "error" ? "invalid" : "attention");
};
const FieldIssue = (props) => {
  const issue = issueFor(props.for);
  return issue && h("small", { class: ["m-issue", issue.level] }, issue.message);
};
FieldIssue.props = ["for"];

// Which section holds a field, so a jump can open it first
const sectionOf = (id) =>
  /^(groom|bride)-/.test(id) ? "couple"
    : id.startsWith("event-") ? "events"
    : id.startsWith("milestone-") ? "story"
    : id.startsWith("std-") ? "popup"
    : id.startsWith("site-") ? "site"
    : "home";
const issueCount = (section) => shownIssues.value.filter((i) => sectionOf(i.id) === section).length;
const sectionHasError = (section) => shownIssues.value.some((i) => sectionOf(i.id) === section && i.level === "error");

const jumpToIssue = async (issue) => {
  openSection.value = sectionOf(issue.id);
  await nextTick();
  const el = document.getElementById(issue.id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus?.({ preventScroll: true });
};

const save = async () => {
  triedSave.value = true;
  if (errorIssues.value.length) {
    flash(`Fix ${plural(errorIssues.value.length, "problem")} before saving`, "error");
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
    flash("Saved", "ok");
  } catch (error) {
    flash(`Save failed: ${error.message}`, "error");
  } finally {
    saving.value = false;
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

/* ── Share ── */
const shareLink = computed(() => weddingCode.value && `${window.location.origin}/${weddingCode.value}`);
const codeCopied = ref(false);
// Native share sheet on phones, clipboard otherwise
const share = async () => {
  if (navigator.share) {
    try {
      await navigator.share({ title: wedding.site.title || "Wedding invitation", text: shareMessage(wedding.$state, shareLink.value) });
    } catch { /* closed the sheet */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(shareMessage(wedding.$state, shareLink.value));
    codeCopied.value = true;
    flash("Invitation message copied", "ok");
    setTimeout(() => { codeCopied.value = false; }, 1500);
  } catch {
    flash(`Share this link: ${shareLink.value}`, "warn");
  }
};

/* ── Uploads ── */
const photoInputs = {};
const pick = (key) => photoInputs[key]?.click();
const uploading = ref("");
const uploadProgress = ref("");

// Every upload counts against the invitation's plan limit
const uploadFile = async (key, file) => {
  if (!file.type.startsWith("image/")) {
    flash(`${file.name} is not an image`, "error");
    return null;
  }
  if (uploadsLeft.value <= 0) {
    flash(`You've used all ${limits.value.uploads} uploads`, "error");
    return null;
  }
  try {
    const url = await uploadToCloudinary(file, { uid: auth.user.uid, key });
    await recordUpload(weddingId);
    weddingMeta.value = { ...weddingMeta.value, uploads: weddingMeta.value.uploads + 1 };
    return url;
  } catch (error) {
    flash(`Upload failed: ${error.message}`, "error");
    return null;
  }
};

const uploadSingle = async (key, e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  uploading.value = key;
  try {
    const url = await uploadFile(key, file);
    if (!url) return;
    if (key === "background") wedding.hero.backgroundImage = url;
    else wedding[key].photo = url;
    flash("Photo added, tap Save to keep it", "warn");
  } finally {
    uploading.value = "";
  }
};

const uploadMany = async (key, list, max, e) => {
  const picked = [...e.target.files];
  e.target.value = "";
  const files = picked.slice(0, Math.max(0, Math.min(max - list.length, uploadsLeft.value)));
  if (files.length < picked.length) flash(`Only ${files.length} of ${picked.length} fit your plan`, "warn");
  if (!files.length) return;
  uploading.value = key;
  let added = 0;
  try {
    for (const [i, file] of files.entries()) {
      uploadProgress.value = `${i + 1}/${files.length}`;
      const url = await uploadFile(key, file);
      if (url) {
        list.push(url);
        added++;
      }
    }
  } finally {
    uploading.value = "";
    uploadProgress.value = "";
  }
  if (added) flash(`${plural(added, "image")} added, tap Save to keep them`, "warn");
};

/* ── Leaving ── */
const beforeUnload = (e) => {
  if (isDirty.value) e.preventDefault();
};
onBeforeRouteLeave(() => !isDirty.value || confirm("You have unsaved changes. Leave anyway?"));
onMounted(() => {
  loadSaved();
  window.addEventListener("beforeunload", beforeUnload);
});
onBeforeUnmount(() => {
  clearInterval(clock);
  clearTimeout(flashTimer);
  window.removeEventListener("beforeunload", beforeUnload);
});
</script>

<style lang="scss" scoped>
/* Same gold & cream look as Settings.vue */
.m-settings {
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
  gap: 2px;
  padding: 6px 6px;
  padding-top: calc(6px + env(safe-area-inset-top));
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
}

.m-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0 4px;
  h1 { margin: 0; font-family: 'Cinzel Decorative', cursive; font-size: 1.05rem; font-weight: 700; color: var(--dark); }
}

.m-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--muted);
  .m-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); }
  &.ok .m-dot { background: var(--green); }
  &.warn .m-dot { background: var(--amber); }
  &.error { color: var(--red); .m-dot { background: var(--red); } }
}

.m-icon,
:deep(.m-icon) {
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
  &:disabled { opacity: 0.35; background: none; }
}

:deep(.m-icon.small) { width: 32px; height: 32px; font-size: 0.8rem; }
:deep(.m-icon.danger:hover), :deep(.m-icon.danger:active) { background: var(--red-soft); color: var(--red); }

.m-loading {
  padding: 96px 16px;
  text-align: center;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* ── Banners ── */
.m-banners {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px 0;
}

.m-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-size: 0.82rem;
  color: var(--muted);
  span { flex: 1; }
  i { color: var(--accent); }
  &.error { border-color: #f2b8b5; background: var(--red-soft); color: #8c1d18; i { color: var(--red); } }
  &.locked { border-color: #ecd3a6; background: var(--amber-soft); color: #6b4e1f; }
}

.m-link {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--subtle); }
}

/* ── Grouped list ── */
.m-body {
  border: 0;
  margin: 0;
  min-width: 0;
  padding: 0 16px;
}

.m-group {
  margin: 24px 4px 8px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--sage);
}

.m-list {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 1px 2px rgba(61, 44, 20, 0.04);
  overflow: hidden;
}

.m-section {
  scroll-margin-top: 64px;
  & + & { border-top: 1px solid var(--border); }
}

.m-section-head {
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 0;
  background: none;
  text-align: left;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: background 0.15s;
  &:active { background: var(--subtle); }
  .open & { border-bottom: 1px solid var(--border); }
}

.m-section-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--subtle);
  color: var(--text);
  font-size: 0.82rem;
  .open & { background: var(--accent-soft); color: var(--accent); }
}

.m-section-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  strong { font-size: 0.94rem; font-weight: 600; color: var(--text); }
  small { font-size: 0.8rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

.m-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--amber-soft);
  color: var(--amber);
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  &.error { background: var(--red-soft); color: var(--red); }
}

.m-caret {
  font-size: 0.7rem;
  color: var(--faint);
  transition: transform 0.2s;
  .open & { transform: rotate(180deg); }
}

.m-section-body {
  padding: 16px 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--surface);

  h3 {
    margin: 6px 0 -4px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--sage);
  }
}

/* ── Fields ── */
.m-field,
:deep(.m-field) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  > span, > label { font-size: 0.8rem; font-weight: 500; color: var(--text); }
}

.m-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  &.three { grid-template-columns: 1fr 1.2fr 1fr; }
}

// 16px stops iOS zooming into focused fields
:deep(input:not([type="checkbox"])),
textarea,
select {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  font-size: 16px;
  font-family: inherit;
  color: var(--dark);
  background: var(--field);
  box-shadow: 0 1px 2px rgba(61, 44, 20, 0.04);
  appearance: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  &::placeholder { color: var(--faint); }
}

:deep(input:focus),
textarea:focus,
select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--ring); }
:deep(input.invalid),
textarea.invalid,
select.invalid { border-color: var(--red); }
:deep(input.invalid:focus) { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15); }
:deep(input.attention),
textarea.attention,
select.attention { border-color: var(--amber); }

select {
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 16px) 50%, calc(100% - 11px) 50%;
  background-size: 5px 5px;
  background-repeat: no-repeat;
  padding-right: 30px;
}

textarea { resize: vertical; line-height: 1.5; }

:deep(.m-issue) {
  font-size: 0.78rem;
  line-height: 1.35;
  &.error { color: var(--red); }
  &.warn { color: var(--amber); }
}

.m-social-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.m-social-toggle {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.85rem;
  text-transform: capitalize;
  cursor: pointer;

  .fa-brands { font-size: 1rem; color: var(--muted); }
  .social-check { font-size: 0.65rem; color: var(--accent); }

  &.filled { border-color: var(--border-strong); .fa-brands { color: var(--accent); } }
  &.open { background: var(--subtle); border-color: var(--accent); }
}

.m-social {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  align-items: center;
  column-gap: 8px;
  > i {
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--subtle);
    color: var(--muted);
    font-size: 1.05rem;
  }
  :deep(.m-issue) { grid-column: 2 / -1; }
}

.m-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  font-size: 0.9rem;
  font-weight: 500;
  input {
    appearance: none;
    flex-shrink: 0;
    width: 44px;
    height: 26px;
    margin: 0;
    border-radius: 13px;
    background: var(--border-strong);
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
    &::after {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s;
    }
    &:checked { background: var(--accent); &::after { transform: translateX(18px); } }
    &:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--ring); }
  }
}

/* ── Segmented control ── */
.m-segment {
  display: flex;
  padding: 3px;
  gap: 2px;
  border-radius: 10px;
  background: var(--subtle);
  border: 1px solid var(--border);
  button {
    flex: 1;
    min-height: 36px;
    border: 0;
    border-radius: 7px;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    &.selected { background: var(--surface); color: var(--gold-dark); box-shadow: 0 1px 3px rgba(61, 44, 20, 0.12); }
  }
}

/* ── Chips & scrollers ── */
.m-hint { font-size: 0.75rem; color: var(--muted); line-height: 1.4; }

/* Ready-made story notes: tap one to fill the note */
.m-note-suggestions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  > span { font-size: 0.75rem; color: var(--muted); }
}

.m-event-fill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong { font-weight: 600; }
  small { font-size: 0.75rem; color: var(--muted); }
}

.m-note-suggestion {
  min-height: 36px;
  padding: 8px 12px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;

  &.selected {
    border-style: solid;
    border-color: var(--accent);
    background: var(--subtle);
  }

  &:disabled { opacity: 0.5; }
}

.m-chips,
:deep(.m-chips) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

:deep(.m-chip) {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  i { font-size: 0.7rem; color: var(--muted); }
  &:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-soft); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

:deep(.m-add) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  small { font-size: 0.78rem; color: var(--muted); }
}

.m-scroller {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  margin: 0 -14px;
  padding: 2px 14px 6px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  > * { scroll-snap-align: start; flex-shrink: 0; }
}

.m-theme {
  width: 116px;
  padding: 6px 6px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  &.selected { border-color: var(--accent); box-shadow: 0 0 0 3px var(--ring); }
}

.m-theme-swatch {
  height: 60px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: flex-end;
  padding: 6px;
  gap: 3px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  span { flex: 1; height: 16px; border-radius: 3px; }
}

.m-theme-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 0 2px;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text);
  text-align: left;
  line-height: 1.25;
  i { color: var(--accent); font-size: 0.8rem; }
}

.m-bg {
  width: 96px;
  aspect-ratio: 3 / 4;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--subtle);
  cursor: pointer;
  transition: box-shadow 0.15s;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  &.selected { border-color: var(--accent); box-shadow: 0 0 0 3px var(--ring); }
}

.m-bg-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px dashed var(--border-strong);
  background: var(--surface);
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 500;
  font-family: inherit;
}

/* ── Couple ── */
.m-person {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.m-person-top {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 14px;
  align-items: start;
}

.m-person-names {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.m-removable {
  position: relative;
  flex-shrink: 0;
}

.m-avatar {
  position: relative;
  width: 84px;
  aspect-ratio: 4 / 5;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--subtle);
  cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  span {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 1px 3px rgba(61, 44, 20, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }
}

/* ── Items (events, milestones) ── */
.m-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field);
}

.m-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-right: -6px;
  strong { font-size: 0.9rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

:deep(.m-controls) { display: flex; flex-shrink: 0; gap: 2px; }

/* ── Image grid ── */
:deep(.m-images) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

:deep(.m-image) {
  position: relative;
  aspect-ratio: 1;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--subtle);
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
}

:deep(.m-image-remove) {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: rgba(61, 44, 20, 0.7);
  color: #fff;
  font-size: 0.75rem;
  cursor: pointer;
}

:deep(.m-image-add) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px dashed var(--border-strong);
  background: var(--surface);
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  i { font-size: 1rem; }
  &:hover { border-color: var(--accent); color: var(--accent); }
  &.busy { cursor: wait; }
}

.m-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  color: var(--accent);
  font-size: 0.85rem;
  font-weight: 500;
  text-decoration: none;
}

/* ── Bottom bar ── */
.m-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: rgba(253, 246, 236, 0.94);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-top: 1px solid var(--border);
}

.m-btn {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  border: 0;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  &.primary { border: 0; background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold-dark) 100%); color: var(--dark); }
  &.primary:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(154, 122, 69, 0.35); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

.m-save { flex: 1; }

.m-issues {
  min-width: 60px;
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--gold-light);
  border-radius: 10px;
  background: var(--amber-soft);
  color: var(--amber);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  &.error { border-color: #f2b8b5; background: var(--red-soft); color: var(--red); }
}

/* ── Toast ── */
.m-toast {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(84px + env(safe-area-inset-bottom));
  z-index: 11;
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
  .m-top > *,
  .m-banners,
  .m-body { max-width: 560px; }
  .m-top { justify-content: center; }
  .m-title { max-width: 440px; }
  .m-banners,
  .m-body { margin-left: auto; margin-right: auto; }
  .m-bottom { padding-left: calc(50% - 264px); padding-right: calc(50% - 264px); }
  .m-toast { max-width: 528px; margin: 0 auto; }
}
</style>
