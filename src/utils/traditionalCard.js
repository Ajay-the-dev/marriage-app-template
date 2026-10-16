// The printed (traditional) invitation card: its design options and its
// starting text built from an invitation.

import { themes } from '@/config/themes'
import { versionForTheme, versionHtml } from '@/config/cardWording'

export const PAPERS = [
  { id: 'a5', label: 'A5', width: 148, height: 210 },
  { id: '5x7', label: '5 × 7 in', width: 127, height: 178 },
  { id: 'a4', label: 'A4', width: 210, height: 297 },
  { id: 'square', label: 'Square', width: 160, height: 160 },
]

export const BORDERS = [
  { id: 'temple', label: 'Temple' },
  { id: 'double', label: 'Double rule' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'none', label: 'None' },
]

export const MOTIFS = [
  { id: 'lotus', label: 'Lotus' },
  { id: 'mandala', label: 'Mandala' },
  { id: 'none', label: 'None' },
]

// Fonts the editor offers for selected text (google: the Google Fonts "family=" spec)
export const FONTS = [
  { group: 'Script', name: 'Great Vibes', google: 'Great+Vibes' },
  { group: 'Script', name: 'Parisienne', google: 'Parisienne' },
  { group: 'Script', name: 'Alex Brush', google: 'Alex+Brush' },
  { group: 'Script', name: 'Pinyon Script', google: 'Pinyon+Script' },
  { group: 'Script', name: 'Tangerine', google: 'Tangerine:wght@400;700' },
  { group: 'Classic', name: 'Cinzel', google: 'Cinzel:wght@400;600;700' },
  { group: 'Classic', name: 'Cinzel Decorative', google: 'Cinzel+Decorative:wght@400;700' },
  { group: 'Classic', name: 'Playfair Display', google: 'Playfair+Display:ital,wght@0,400;0,700;1,400' },
  { group: 'Classic', name: 'Cormorant Garamond', google: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400' },
  { group: 'Classic', name: 'EB Garamond', google: 'EB+Garamond:ital,wght@0,400;0,600;1,400' },
  { group: 'Classic', name: 'Marcellus', google: 'Marcellus' },
  { group: 'Classic', name: 'Libre Baskerville', google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400' },
  { group: 'Classic', name: 'Lora', google: 'Lora:ital,wght@0,400;0,600;1,400' },
  { group: 'Modern', name: 'Montserrat', google: 'Montserrat:wght@300;400;500;600' },
  { group: 'Modern', name: 'Josefin Sans', google: 'Josefin+Sans:wght@300;400;600' },
  { group: 'Modern', name: 'Raleway', google: 'Raleway:wght@300;400;600' },
  { group: 'Indian languages', name: 'Noto Serif Malayalam', label: 'Malayalam', google: 'Noto+Serif+Malayalam:wght@400;600' },
  { group: 'Indian languages', name: 'Noto Serif Tamil', label: 'Tamil', google: 'Noto+Serif+Tamil:wght@400;600' },
  { group: 'Indian languages', name: 'Noto Serif Devanagari', label: 'Hindi / Marathi', google: 'Noto+Serif+Devanagari:wght@400;600' },
  { group: 'Indian languages', name: 'Noto Serif Telugu', label: 'Telugu', google: 'Noto+Serif+Telugu:wght@400;600' },
  { group: 'Indian languages', name: 'Noto Serif Kannada', label: 'Kannada', google: 'Noto+Serif+Kannada:wght@400;600' },
].map((font) => ({ ...font, css: `'${font.name}', serif` }))

// The family name in a font-family value ("'Great Vibes', serif" → "great vibes")
export const fontFamilyName = (value) => String(value || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase()

// Google Fonts specs by family name: the editor's fonts plus every theme's
const FONT_SPECS = new Map([
  ...themes.flatMap((t) => t.googleFonts),
  ...FONTS.map((f) => f.google),
].map((spec) => [spec.split(':')[0].replace(/\+/g, ' ').toLowerCase(), spec]))

export const isKnownFont = (value) => FONT_SPECS.has(fontFamilyName(value))

// Specs for the fonts the card's text uses
export const usedFontSpecs = (html) =>
  [...String(html).matchAll(/(?:face="|font-family:\s*)([^";]+)/gi)]
    .map(([, value]) => FONT_SPECS.get(fontFamilyName(value.replace(/&quot;|&#39;/g, ''))))
    .filter(Boolean)

export const getPaper = (id) => PAPERS.find((p) => p.id === id) || PAPERS[0]

// A new card: the version made for the invitation's theme, filled from the invitation.
// versions holds the edited text of each version that was changed ({ [versionId]: html });
// html is the version on screen.
export const defaultCard = (config) => ({
  name: '',
  version: versionForTheme(config.theme),
  versions: {},
  html: versionHtml(config, versionForTheme(config.theme)),
  paper: 'a5',
  border: 'temple',
  motif: 'lotus',
  theme: config.theme || '',
})

// Keeps only the tags and styles the editor produces, so pasted or stored
// markup can't carry scripts or stray styling onto the card
const ALLOWED = new Set(['H1', 'H2', 'H3', 'H6', 'P', 'DIV', 'BR', 'HR', 'B', 'STRONG', 'I', 'EM', 'U', 'SPAN', 'FONT'])
const DROPPED = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'svg', 'math'])
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i
const keepStyle = (style) =>
  style
    .split(';')
    .map((rule) => rule.split(':').map((s) => s.trim().toLowerCase()))
    .filter(([name, value]) =>
      (name === 'text-align' && ['left', 'center', 'right', 'justify'].includes(value)) ||
      (name === 'color' && COLOR.test(value)) ||
      (name === 'font-family' && isKnownFont(value)))
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ')

const cleanChildren = (parent) => [...parent.children].forEach((el) => {
  if (DROPPED.has(el.tagName)) return el.remove()
  cleanChildren(el)
  if (!ALLOWED.has(el.tagName)) return el.replaceWith(...el.childNodes)
  const style = keepStyle(el.getAttribute('style') || '')
  const color = el.tagName === 'FONT' && COLOR.test(el.getAttribute('color') || '') ? el.getAttribute('color') : ''
  const face = el.tagName === 'FONT' && isKnownFont(el.getAttribute('face')) ? el.getAttribute('face') : ''
  ;[...el.attributes].forEach((attr) => el.removeAttribute(attr.name))
  if (style) el.setAttribute('style', style)
  if (color) el.setAttribute('color', color)
  if (face) el.setAttribute('face', face)
})

export const sanitizeCardHtml = (html) => {
  const root = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstChild
  cleanChildren(root)
  return root.innerHTML
}

export const pdfFileName = (config) => {
  const names = [config.groom?.shortName, config.bride?.shortName].filter(Boolean).join('-')
  return `${(names || 'wedding').replace(/[^\w-]+/g, '-')}-invitation.pdf`
}
