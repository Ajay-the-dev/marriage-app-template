// Checks for an invitation's config, shared by the editor and the guest pages.
// Each issue: { id, message, level, required? }
//   id       – the editor input's element id, so the editor can jump to it
//   level    – "error" blocks saving; "warn" is shown but doesn't
//   required – a missing field (the editor only flags these after a save attempt)

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const SHORT_MONTHS = MONTHS.map((m) => m.slice(0, 3));

// Only plain web links may become an href; anything else (javascript:, data:, …) is dropped
export const isWebUrl = (url) => {
  try {
    return ["https:", "http:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};
export const safeUrl = (url) => (isWebUrl(url) ? url : "");

const SOCIAL_HOSTS = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.com", "fb.me"],
  whatsapp: ["wa.me", "whatsapp.com"],
};
const SOCIAL_NAMES = { instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp" };
const matchesSocial = (type, url) => {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return SOCIAL_HOSTS[type]?.some((h) => host === h || host.endsWith(`.${h}`)) ?? true;
};

// Longest text the editor accepts for fixed fields; keep in sync with firestore.rules
export const MAX_LENGTH = {
  name: 60,
  shortName: 30,
  profession: 60,
  bio: 600,
  inviteLine: 120,
  siteTitle: 100,
  monogram: 6,
  shareMessage: 500,
};

// Days in a month (February allows 29: the year isn't always known)
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const monthIndex = (month) => {
  const m = String(month || "").trim().slice(0, 3).toLowerCase();
  return SHORT_MONTHS.findIndex((s) => s.toLowerCase() === m);
};

const checkDay = (issues, id, day, month) => {
  if (!String(day ?? "").trim()) return;
  const n = Number(day);
  if (!/^\d{1,2}$/.test(String(day).trim()) || n < 1 || n > 31) {
    issues.push({ id, message: "Day must be a number from 1 to 31", level: "error" });
    return;
  }
  const m = monthIndex(month);
  if (m !== -1 && n > DAYS_IN_MONTH[m]) {
    issues.push({ id, message: `${MONTHS[m]} has only ${DAYS_IN_MONTH[m]} days`, level: "error" });
  }
};

const checkDuplicates = (issues, items, prefix, label) => {
  const seen = new Set();
  items.forEach((item, i) => {
    const name = String(item.name || "").trim().toLowerCase();
    if (!name) return;
    if (seen.has(name)) issues.push({ id: `${prefix}-${i}-name`, message: `Another ${label} already has this name`, level: "error" });
    seen.add(name);
  });
};

const checkLength = (issues, id, text, max, label) => {
  if (String(text || "").length > max) issues.push({ id, message: `${label} can be at most ${max} characters`, level: "error" });
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const validateWedding = (config, now = Date.now()) => {
  const issues = [];
  const required = (id, value, message) => {
    if (!String(value ?? "").trim()) issues.push({ id, message, level: "warn", required: true });
  };

  // Groom & bride
  for (const key of ["groom", "bride"]) {
    const person = config[key] || {};
    const who = key === "groom" ? "Groom" : "Bride";
    required(`${key}-name`, person.name, `${who}'s name is missing`);
    checkLength(issues, `${key}-name`, person.name, MAX_LENGTH.name, "Name");
    checkLength(issues, `${key}-shortName`, person.shortName, MAX_LENGTH.shortName, "Short name");
    checkLength(issues, `${key}-profession`, person.profession, MAX_LENGTH.profession, "Profession");
    checkLength(issues, `${key}-bio`, person.bio, MAX_LENGTH.bio, "Bio");

    (person.socials || []).forEach((social, i) => {
      const id = `${key}-social-${i}`;
      const url = String(social.url || "").trim();
      const platform = SOCIAL_NAMES[social.type] || social.type;
      if (!url) issues.push({ id, message: `Add the ${platform} link or remove this row`, level: "warn", required: true });
      else if (!isWebUrl(url)) issues.push({ id, message: "Link must start with https://", level: "error" });
      else if (!matchesSocial(social.type, url)) issues.push({ id, message: `This isn't a ${platform} link`, level: "error" });
    });
  }

  // Home page
  const hero = config.hero || {};
  checkLength(issues, "hero-inviteLine", hero.inviteLine, MAX_LENGTH.inviteLine, "Invite line");
  const weddingDate = hero.countdown?.enabled && hero.countdown.target ? new Date(hero.countdown.target).getTime() : NaN;
  if (weddingDate < now) issues.push({ id: "wedding-date", message: "The wedding date is in the past", level: "warn" });

  // Events
  const events = config.eventsPage?.events || [];
  events.forEach((event, i) => {
    const id = `event-${i}`;
    const label = `Event ${i + 1}`;
    required(`${id}-name`, event.name, `${label} needs a name`);
    required(`${id}-date`, event.date, `${label} needs a date`);
    const date = String(event.date || "").trim();
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime()))) {
      issues.push({ id: `${id}-date`, message: "Pick the date from the calendar", level: "error" });
    }
    if (String(event.end || "").trim() && !String(event.start || "").trim()) {
      issues.push({ id: `${id}-start`, message: "Add a start time, or clear the end time", level: "warn" });
    }
    if (!String(event.venue || "").trim() && !String(event.mapUrl || "").trim()) {
      issues.push({ id: `${id}-venue`, message: `${label} needs a venue or a map link`, level: "warn", required: true });
    }
    if (String(event.mapUrl || "").trim() && !isWebUrl(event.mapUrl.trim())) {
      issues.push({ id: `${id}-mapUrl`, message: "Map link must start with https://", level: "error" });
    }
  });
  checkDuplicates(issues, events, "event", "event");

  // Story
  const milestones = config.storyPage?.milestones || [];
  milestones.forEach((milestone, i) => {
    const id = `milestone-${i}`;
    required(`${id}-name`, milestone.name, `Milestone ${i + 1} needs a name`);
    checkDay(issues, `${id}-day`, milestone.day, milestone.month);
    const year = String(milestone.year ?? "").trim();
    if (year && (!/^\d{4}$/.test(year) || year < "1900" || year > "2100")) {
      issues.push({ id: `${id}-year`, message: "Year must be 4 digits, like 2024", level: "error" });
    }
  });
  checkDuplicates(issues, milestones, "milestone", "milestone");

  // Save the date
  const popup = config.saveTheDate || {};
  if (popup.enabled) {
    if (!popup.images?.length) issues.push({ id: "std-images", message: "Add at least one image, or turn the popup off", level: "warn", required: true });
    const expires = popup.expiresAt ? new Date(popup.expiresAt).getTime() : NaN;
    if (expires < now) issues.push({ id: "std-expires", message: "This is in the past, so the popup won't show", level: "warn" });
    else if (expires > weddingDate + DAY_MS) issues.push({ id: "std-expires", message: "This is after the wedding date", level: "warn" });
  }

  // Site
  checkLength(issues, "site-title", config.site?.title, MAX_LENGTH.siteTitle, "Site title");
  checkLength(issues, "site-monogram", config.site?.monogram, MAX_LENGTH.monogram, "Monogram");
  checkLength(issues, "site-shareMessage", config.site?.shareMessage, MAX_LENGTH.shareMessage, "Share message");

  return issues;
};
