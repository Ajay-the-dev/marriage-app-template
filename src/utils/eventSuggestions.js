// Home page suggestions built from the invitation's events: the countdown date & time,
// date text, time text and location text each event would give.
import { MONTHS } from "@/utils/validation";

const pad = (n) => String(n).padStart(2, "0");
const monthOf = (month) => {
  const m = String(month || "").trim().slice(0, 3).toLowerCase();
  return MONTHS.findIndex((name) => name.slice(0, 3).toLowerCase() === m);
};

// Events have no year: use the wedding's current year, else the next time that date comes round
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
export const eventSuggestions = (events, currentTarget) =>
  (events || []).flatMap((event, i) => {
    const day = Number(event.day);
    const month = monthOf(event.month);
    const hasDate = day >= 1 && day <= 31 && month !== -1;
    const year = hasDate ? yearFor(month, day, currentTarget) : null;
    const time = event.time?.trim() || "";
    const locationText = [event.venue, event.location].map((s) => s?.trim()).filter(Boolean).join(", ");
    if (!hasDate && !time && !locationText) return [];
    return [{
      label: event.name?.trim() || `Event ${i + 1}`,
      target: hasDate ? `${year}-${pad(month + 1)}-${pad(day)}T${startTime(time)}` : "",
      dateTexts: hasDate ? [`${pad(day)} · ${pad(month + 1)} · ${year}`, `${day} ${MONTHS[month]} ${year}`] : [],
      timeText: time,
      locationText,
    }];
  });

// Distinct, non-empty values for one field across all events
export const suggestionValues = (suggestions, pick) => [...new Set(suggestions.flatMap(pick).filter(Boolean))];
