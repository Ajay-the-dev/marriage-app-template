// Choices shared by the desktop (Settings.vue) and phone (Settings2.vue) editors

// Home page overlay tint (0-100) each layout starts with (Home.vue's own defaults)
export const HERO_OVERLAY_DEFAULTS = { classic: 80, framed: 36, minimal: 48 }

// Overlay and text colours: a role from the current theme (stays in sync if the theme changes)
// or a custom #hex. The first role is the theme default and clears the field.
export const HERO_COLOR_PICKERS = [
  {
    field: 'overlayColor',
    label: 'Overlay colour',
    hint: 'Light colours can make the text harder to read',
    roles: [
      { id: 'overlay', label: 'Theme default' },
      { id: 'dark', label: 'Dark' },
      { id: 'text', label: 'Text' },
      { id: 'shadow', label: 'Shadow' },
      { id: 'gold-dark', label: 'Accent deep' },
      { id: 'gold', label: 'Accent' },
      { id: 'sage', label: 'Muted' },
      { id: 'blush', label: 'Blush' },
      { id: 'cream', label: 'Cream' },
    ],
  },
  {
    field: 'textColor',
    label: 'Text colour',
    hint: 'Names, date, time, place and countdown on the home page',
    roles: [
      { id: 'gold', label: 'Theme default' },
      { id: 'gold-light', label: 'Accent light' },
      { id: 'card', label: 'White' },
      { id: 'cream', label: 'Cream' },
      { id: 'blush', label: 'Blush' },
      { id: 'sage', label: 'Muted' },
      { id: 'gold-dark', label: 'Accent deep' },
      { id: 'text', label: 'Text' },
      { id: 'dark', label: 'Dark' },
    ],
  },
]

export const COUNTDOWN_EXAMPLES = { days: 'Days', hours: 'Hrs', minutes: 'Min', seconds: 'Sec' }

// Icons offered for the navigation menu
export const NAV_ICONS = [
  'fa-house', 'fa-house-chimney', 'fa-heart', 'fa-heart-circle-check', 'fa-hand-holding-heart',
  'fa-ring', 'fa-gem', 'fa-crown', 'fa-infinity', 'fa-dove',
  'fa-calendar', 'fa-calendar-check', 'fa-calendar-days', 'fa-calendar-day', 'fa-clock',
  'fa-list-check', 'fa-clipboard-list', 'fa-timeline', 'fa-route', 'fa-compass',
  'fa-user-friends', 'fa-users', 'fa-people-group', 'fa-person-dress', 'fa-hands-holding',
  'fa-handshake', 'fa-face-smile', 'fa-images', 'fa-image', 'fa-camera',
  'fa-camera-retro', 'fa-photo-film', 'fa-video', 'fa-book-open', 'fa-book',
  'fa-feather', 'fa-pen-fancy', 'fa-scroll', 'fa-envelope', 'fa-envelope-open-text',
  'fa-location-dot', 'fa-map-location-dot', 'fa-church', 'fa-place-of-worship', 'fa-om',
  'fa-champagne-glasses', 'fa-wine-glass', 'fa-cake-candles', 'fa-gift', 'fa-gifts',
  'fa-utensils', 'fa-music', 'fa-star', 'fa-sun', 'fa-moon',
  'fa-seedling', 'fa-leaf', 'fa-spa', 'fa-wand-magic-sparkles', 'fa-hotel',
]
