// Event dates & times, and "Add to calendar" for guests.
// An event's exact time lives in: date "2027-06-12", start "10:00", end "12:00" (end optional),
// read in the invitation's eventsPage.timezone (an IANA name like "Asia/Kolkata").
// day, month and time are the text shown on the site; the editor fills them from these.
import { MONTHS } from "@/utils/validation";

const DAY_MS = 24 * 60 * 60 * 1000;
// Length of an event with a start time but no end time
const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, "0");

/* ── Parsing ── */

// "2027-06-12" → { year, month (1-12), day }, or null
export const parseDate = (date) => {
  const match = String(date || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCMonth() === month - 1 && check.getUTCDate() === day ? { year, month, day } : null;
};

// "18:30" → minutes after midnight, or null
const parseTime = (time) => {
  const match = String(time || "").match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
};

/* ── Editor helpers ── */

export const localTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

// Every time zone the browser knows, plus the current one if it isn't listed
export const timeZoneOptions = (current) => {
  let zones = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [localTimeZone()].filter(Boolean);
  }
  return current && !zones.includes(current) ? [current, ...zones] : zones;
};

// "18:30" → "6:30 PM"
const formatTime = (time) => {
  const minutes = parseTime(time);
  if (minutes === null) return "";
  const hours = Math.floor(minutes / 60);
  return `${hours % 12 || 12}:${pad(minutes % 60)} ${hours < 12 ? "AM" : "PM"}`;
};

// "10:00", "12:00" → "10:00 AM – 12:00 PM"
export const formatTimeRange = (start, end) => [formatTime(start), formatTime(end)].filter(Boolean).join(" – ");

// Sets the date and the day & month shown on the site
export const setEventDate = (event, date) => {
  event.date = date;
  const parsed = parseDate(date);
  event.day = parsed ? String(parsed.day) : "";
  event.month = parsed ? MONTHS[parsed.month - 1] : "";
};

// Sets the start or end time; the time text follows unless the couple has written their own
export const setEventTime = (event, key, time) => {
  const followsTimes = !String(event.time || "").trim() || event.time === formatTimeRange(event.start, event.end);
  event[key] = time;
  if (followsTimes) event.time = formatTimeRange(event.start, event.end);
};

/* ── Calendar entries ── */

// When an event happens, as wall-clock times written as if they were UTC:
// { allDay, start, end } in ms, or null without a valid date.
// No start time → all day. An end at or before the start → it ends the next day.
export const eventSpan = (event) => {
  const date = parseDate(event?.date);
  if (!date) return null;
  const midnight = Date.UTC(date.year, date.month - 1, date.day);
  const start = parseTime(event.start);
  if (start === null) return { allDay: true, start: midnight, end: midnight + DAY_MS };
  const startMs = midnight + start * 60000;
  const end = parseTime(event.end);
  let endMs = end === null ? startMs + DEFAULT_LENGTH_MS : midnight + end * 60000;
  if (endMs <= startMs) endMs += DAY_MS;
  return { allDay: false, start: startMs, end: endMs };
};

const isTimeZone = (tz) => {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// How far ahead of UTC the zone's clocks are at a moment, in ms
const zoneOffset = (utcMs, tz) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(utcMs)).map((p) => [p.type, Number(p.value)])
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - utcMs;
};

// A wall-clock time in a zone → the real UTC moment (second pass settles DST changes)
const zonedToUtc = (wallMs, tz) => {
  const guess = wallMs - zoneOffset(wallMs, tz);
  return wallMs - zoneOffset(guess, tz);
};

// ms → "20270612T100000" (no Z: the caller decides what it means)
const compact = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").slice(0, 15);
const compactDate = (ms) => compact(ms).slice(0, 8);
const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);
const isoLocal = (ms) => new Date(ms).toISOString().slice(0, 19);

// What every calendar entry needs: { title, location, description, url, uid, span, tz }.
// tz is "" when the invitation has none set; times are then read in the guest's own zone.
// `wedding` is the store (or a config); `inviteUrl` is the guest link.
export const calendarEntry = (event, wedding, inviteUrl = "") => {
  const span = eventSpan(event);
  if (!span) return null;
  const nameOf = (person) => String(person?.shortName || person?.name || "").trim();
  const couple = [nameOf(wedding.groom), nameOf(wedding.bride)].filter(Boolean).join(" & ");
  const name = String(event.name || "").trim() || "Wedding event";
  const location = [event.venue, event.location].map((s) => String(s || "").trim()).filter(Boolean).join(", ");
  const mapUrl = String(event.mapUrl || "").trim();
  const tz = isTimeZone(wedding.eventsPage?.timezone) ? wedding.eventsPage.timezone : "";
  // Stable per invitation & event, so importing the same event again updates it instead of duplicating
  const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    title: couple ? `${name} · ${couple}` : name,
    location,
    description: [
      couple && `${name} of ${couple}`,
      String(event.time || "").trim(),
      /^https?:\/\//i.test(mapUrl) && `Map: ${mapUrl}`,
      inviteUrl && `Invitation: ${inviteUrl}`,
    ].filter(Boolean).join("\n"),
    url: inviteUrl,
    uid: [inviteUrl && slug(inviteUrl.replace(/^https?:\/\//, "")), slug(name)].filter(Boolean).join("-"),
    span,
    tz,
  };
};

export const googleCalendarUrl = (entry) => {
  const { span, tz } = entry;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: entry.title,
    dates: span.allDay
      ? `${compactDate(span.start)}/${compactDate(span.end)}`
      : `${compact(span.start)}/${compact(span.end)}`,
    details: entry.description,
    location: entry.location,
  });
  if (tz && !span.allDay) params.set("ctz", tz);
  return `https://calendar.google.com/calendar/render?${params}`;
};

export const outlookCalendarUrl = (entry) => {
  const { span, tz } = entry;
  // With a zone, send the real moment in UTC; without one, Outlook reads the time in the guest's zone
  const when = (ms) => (span.allDay ? isoDate(ms) : tz ? new Date(zonedToUtc(ms, tz)).toISOString() : isoLocal(ms));
  const params = new URLSearchParams({
    rru: "addevent",
    subject: entry.title,
    startdt: when(span.start),
    enddt: when(span.end),
    location: entry.location,
    body: entry.description,
    allday: String(span.allDay),
  });
  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
};

/* ── .ics files (Apple Calendar and everything else) ── */

const escapeText = (text) => String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Lines may be at most 75 bytes; longer ones continue on the next line after a space
const encoder = new TextEncoder();
const fold = (line) => {
  const out = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
};

const veventLines = (entry, stamp, host) => {
  const { span, tz } = entry;
  const when = (key, ms) => {
    if (span.allDay) return `${key};VALUE=DATE:${compactDate(ms)}`;
    // With a zone, write UTC (no VTIMEZONE needed); without one, a "floating" local time
    return tz ? `${key}:${compact(zonedToUtc(ms, tz))}Z` : `${key}:${compact(ms)}`;
  };
  return [
    "BEGIN:VEVENT",
    `UID:${entry.uid}@${host}`,
    `DTSTAMP:${stamp}`,
    when("DTSTART", span.start),
    when("DTEND", span.end),
    `SUMMARY:${escapeText(entry.title)}`,
    entry.location && `LOCATION:${escapeText(entry.location)}`,
    entry.description && `DESCRIPTION:${escapeText(entry.description)}`,
    entry.url && `URL:${entry.url}`,
    // A reminder the day before
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(entry.title)}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
  ].filter(Boolean);
};

export const icsFile = (entries, host = window.location.hostname || "invitation") => {
  const stamp = `${compact(Date.now())}Z`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Invitation//Add to calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...entries.flatMap((entry) => veventLines(entry, stamp, host)),
    "END:VCALENDAR",
  ].map(fold).join("\r\n") + "\r\n";
};

export const downloadIcs = (entries, filename) => {
  const blob = new Blob([icsFile(entries)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/[^\w\- ]+/g, "").trim() || "event"}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
