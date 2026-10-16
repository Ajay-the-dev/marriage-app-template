// The message copied or shared with the guest link, from the invitation's
// site.shareMessage template. Placeholders are filled in from the invitation.

export const SHARE_PLACEHOLDERS = [
  { key: 'groom', label: "Groom's name" },
  { key: 'bride', label: "Bride's name" },
  { key: 'date', label: 'Wedding date' },
  { key: 'venue', label: 'Venue' },
  { key: 'link', label: 'Guest link' },
]

export const SHARE_MESSAGE_SUGGESTIONS = [
  "With joy in our hearts, we invite you to celebrate the wedding of {groom} & {bride} on {date} at {venue}.\nView the invitation: {link}",
  "{groom} & {bride} are getting married! 💍\nSave the date: {date}\nAll the details are here: {link}",
  "Your presence would make our day complete. Please join us for the wedding of {groom} & {bride}.\n{link}",
  "Dear family and friends, we're tying the knot on {date}! Find the events, venue and our story here: {link}",
]

export const DEFAULT_SHARE_MESSAGE = SHARE_MESSAGE_SUGGESTIONS[0]

const nameOf = (person, fallback) => person?.shortName?.trim() || person?.name?.trim() || fallback

// Fills in the template; the link is added at the end if the template leaves it out
export const shareMessage = (config, link) => {
  const template = config?.site?.shareMessage?.trim() || DEFAULT_SHARE_MESSAGE
  const values = {
    groom: nameOf(config?.groom, 'the groom'),
    bride: nameOf(config?.bride, 'the bride'),
    date: config?.hero?.dateText?.trim() || 'our big day',
    venue: config?.hero?.locationText?.trim() || 'the venue',
    link,
  }
  const text = template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)
  return template.includes('{link}') ? text : `${text}\n${link}`
}
