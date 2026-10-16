import { nextTick, reactive } from 'vue'

// Bride's and groom's social links: one toggle per platform opens its link box.
// wedding[key].socials = [{ type, url }], at most one per platform; an empty link removes it.
export const SOCIAL_TYPES = ['instagram', 'facebook', 'whatsapp']

// hasIssue(id): whether validation flagged that link, so it opens on its own
export const useSocialLinks = (wedding, hasIssue = () => false) => {
  const opened = reactive(new Set())
  const slot = (key, type) => `${key}:${type}`

  const index = (key, type) => wedding[key].socials.findIndex((s) => s.type === type)
  // Validation ids follow the link's position in the list
  const id = (key, type) => {
    const i = index(key, type)
    return i === -1 ? undefined : `${key}-social-${i}`
  }
  const url = (key, type) => wedding[key].socials[index(key, type)]?.url || ''
  const set = (key, type, value) => {
    const list = wedding[key].socials
    const link = value.trim()
    const i = index(key, type)
    if (!link) {
      if (i !== -1) list.splice(i, 1)
    } else if (i === -1) list.push({ type, url: link })
    else list[i].url = link
  }

  const isOpen = (key, type) => opened.has(slot(key, type)) || !!hasIssue(id(key, type))
  const toggle = async (key, type) => {
    const s = slot(key, type)
    if (opened.has(s)) return opened.delete(s)
    opened.add(s)
    await nextTick()
    document.querySelector(`[data-social="${s}"]`)?.focus()
  }
  const remove = (key, type) => {
    set(key, type, '')
    opened.delete(slot(key, type))
  }

  return { id, url, set, isOpen, toggle, remove }
}
