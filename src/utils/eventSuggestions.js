// Home page suggestions built from the invitation's events: the countdown date & time,
// date text, time text and location text each event would give.
import { MONTHS } from "@/utils/validation";
import { parseDate } from "@/utils/calendar";

const pad = (n) => String(n).padStart(2, "0");
const monthOf = (month) => {
  const m = String(month || "").trim().slice(0, 3).toLowerCase();
  return MONTHS.findIndex((name) => name.slice(0, 3).toLowerCase() === m);
};

// Older events have no year: use the wedding's current year, else the next time that date comes round
const yearFor = (month, day, target) => {
  const set = Number(String(target || "").slice(0, 4));
  if (set) return set;
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), month, day);
  return thisYear >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? now.getFullYear() : now.getFullYear() + 1;
};

// Start of a time range like "10:00 AM – 12:00 PM" as "10:00:00" (midnight when there's none)
const startTime = (time) => {
  const match = String(time || "").match(/(\d{1,2})(?:\s*[:.]\s*(\d{2}))?\s*(am|pm)?/i);
  if (!match) return "00:00:00";
  let hours = Number(match[1]) % 24;
  const minutes = Number(match[2] || 0) % 60;
  const half = match[3]?.toLowerCase();
  if (half === "pm" && hours < 12) hours += 12;
  if (half === "am" && hours === 12) hours = 0;
  return `${pad(hours)}:${pad(minutes)}:00`;
};

// One suggestion per event with something to offer:
// { label, target, dateTexts: [..], timeText, locationText }
// Uses the event's exact date and start time when it has them, else its day, month and time text
export const eventSuggestions = (events, currentTarget) =>
  (events || []).flatMap((event, i) => {
    const exact = parseDate(event.date);
    const day = exact ? exact.day : Number(event.day);
    const month = exact ? exact.month - 1 : monthOf(event.month);
    const hasDate = day >= 1 && day <= 31 && month !== -1;
    const year = exact ? exact.year : hasDate ? yearFor(month, day, currentTarget) : null;
    const time = event.time?.trim() || "";
    const start = /^\d{2}:\d{2}$/.test(event.start || "") ? `${event.start}:00` : startTime(time);
    const locationText = [event.venue, event.location].map((s) => s?.trim()).filter(Boolean).join(", ");
    if (!hasDate && !time && !locationText) return [];
    return [{
      label: event.name?.trim() || `Event ${i + 1}`,
      target: hasDate ? `${year}-${pad(month + 1)}-${pad(day)}T${start}` : "",
      dateTexts: hasDate ? [`${pad(day)} · ${pad(month + 1)} · ${year}`, `${day} ${MONTHS[month]} ${year}`] : [],
      timeText: time,
      locationText,
    }];
  });

// Distinct, non-empty values for one field across all events
export const suggestionValues = (suggestions, pick) => [...new Set(suggestions.flatMap(pick).filter(Boolean))];

/* ── Keeping the home page in step with the events ── */

const nameOf = (event) => String(event?.name || "").trim().toLowerCase();
const sameEvent = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].every((k) => (a[k] || "") === (b[k] || ""));

// The home page fields that would change to follow one event: [{ key, label, from, to }].
// key is "target" (countdown) or a hero text field.
const heroChangesFor = (event, before, config, saved) => {
  const [next] = eventSuggestions([event], config.hero?.countdown?.target);
  if (!next) return [];
  const hero = config.hero || {};
  // Keep the date text in the style the couple picked ("12 · 06 · 2027" or "12 June 2027")
  const [prev] = before ? eventSuggestions([before], saved?.hero?.countdown?.target) : [];
  const style = Math.max(0, prev?.dateTexts.indexOf(hero.dateText) ?? -1, next.dateTexts.indexOf(hero.dateText));
  return [
    { key: "target", label: "Wedding date & countdown", from: hero.countdown?.target || "", to: next.target },
    { key: "dateText", label: "Date", from: hero.dateText || "", to: next.dateTexts[style] || "" },
    { key: "timeText", label: "Time", from: hero.timeText || "", to: next.timeText },
    { key: "locationText", label: "Place", from: hero.locationText || "", to: next.locationText },
  // "…T10:00" (no seconds) and "…T10:00:00" are the same countdown
  ].filter((c) => c.to && c.to !== c.from && !(c.key === "target" && `${c.from}:00` === c.to));
};

// Every event added or edited since the last save that the home page could follow:
// [{ event: its name, changes }]. Empty when no event changed, or the home page already
// shows what changed. Events are matched to the last save by name, else by position.
export const heroSyncOptions = (config, saved) => {
  const savedEvents = saved?.eventsPage?.events || [];
  return (config.eventsPage?.events || []).flatMap((event, i) => {
    const before = savedEvents.find((e) => nameOf(e) && nameOf(e) === nameOf(event)) ?? savedEvents[i];
    if (before && sameEvent(before, event)) return [];
    const changes = heroChangesFor(event, before, config, saved);
    return changes.length ? [{ event: String(event.name || "").trim() || `Event ${i + 1}`, changes }] : [];
  });
};
