// Live preview: the desktop editor shows the invitation site in an iframe and
// sends it the unsaved config as it changes. The frame's window.name marks it,
// and survives navigation inside the frame.
export const PREVIEW_FRAME_NAME = 'wedding-preview'

export const isPreviewFrame =
  typeof window !== 'undefined' && window.parent !== window && window.name === PREVIEW_FRAME_NAME

// Messages between the editor and the frame
export const PREVIEW_READY = 'preview:ready' // frame → editor: send me the config
export const PREVIEW_CONFIG = 'preview:config' // editor → frame: { config, plan, sample }
export const PREVIEW_NAVIGATE = 'preview:navigate' // editor → frame: { path }

export const isPreviewMessage = (event, source) =>
  event.origin === window.location.origin && event.source === source && typeof event.data?.type === 'string'

// Sections the preview leaves as they are: settings rather than content, or not shown in the preview
const KEEP_AS_IS = new Set(['theme', 'navigation', 'site', 'saveTheDate', 'socials'])

// Fills empty text and empty lists from the sample template, so a new invitation
// previews as a finished page. Lists with items are kept whole (items aren't matched up).
// Returns the filled config and whether anything was filled.
export const withSampleContent = (config, sample) => {
  let filled = false
  const fill = (value, fallback, key) => {
    if (KEEP_AS_IS.has(key) || fallback === undefined || fallback === null) return value
    if (typeof fallback === 'string') {
      if (typeof value === 'string' && value.trim()) return value
      if (!fallback) return value
      filled = true
      return fallback
    }
    if (Array.isArray(fallback)) {
      if (Array.isArray(value) && value.length) return value
      if (!fallback.length) return value
      filled = true
      return fallback
    }
    if (typeof fallback === 'object') {
      const base = value && typeof value === 'object' ? value : {}
      const out = { ...base }
      for (const k of Object.keys(fallback)) out[k] = fill(base[k], fallback[k], k)
      return out
    }
    return value ?? fallback
  }
  return { config: fill(config, sample, ''), filled }
}
