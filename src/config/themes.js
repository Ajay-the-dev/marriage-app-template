// Theme presets. Each one sets the full palette plus its own font pairing.
//
// Color roles (names kept from the original gold theme):
//   gold / gold-light / gold-dark  accent colour, its soft tint and its deep shade
//   cream      page background          card       card / panel surface
//   dark       headings & strong text   text       body text
//   blush      soft fills (badges)      sage       sub-titles / muted text
//   overlay    hero & lightbox backdrop  shadow     shadow tint
//   on-accent  text placed on the accent colour
//
// fonts.display: names & headings, fonts.serif: body copy, fonts.sans: small UI text
// googleFonts:   the Google Fonts "family=" specs to load for this theme

export const themes = [
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'Classic gold on warm ivory with regal capitals',
    colors: {
      gold: '#c9a96e', 'gold-light': '#e8d5a3', 'gold-dark': '#9a7a45',
      cream: '#fdf6ec', card: '#ffffff', dark: '#1a1208', text: '#3d2c14',
      blush: '#f5e6d8', sage: '#8a9e8c',
      overlay: '#1a1208', shadow: '#3d2c14', 'on-accent': '#1a1208',
    },
    fonts: { display: "'Cinzel Decorative', cursive", serif: "'Cormorant Garamond', serif", sans: "'Montserrat', sans-serif" },
    googleFonts: ['Cinzel+Decorative:wght@400;700', 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400', 'Montserrat:wght@300;400;500'],
  },
  {
    id: 'blush-romance',
    name: 'Blush Romance',
    description: 'Dusty rose and soft pink with elegant italics',
    colors: {
      gold: '#c98b8f', 'gold-light': '#efc9c7', 'gold-dark': '#9c5a62',
      cream: '#fdf4f3', card: '#ffffff', dark: '#3a1f26', text: '#5a3a40',
      blush: '#f8e1df', sage: '#a7838a',
      overlay: '#2e1820', shadow: '#5a3a40', 'on-accent': '#3a1f26',
    },
    fonts: { display: "'Playfair Display', serif", serif: "'Lora', serif", sans: "'Poppins', sans-serif" },
    googleFonts: ['Playfair+Display:ital,wght@0,400;0,700;1,400', 'Lora:ital,wght@0,400;0,500;0,600;1,400', 'Poppins:wght@300;400;500'],
  },
  {
    id: 'emerald-garden',
    name: 'Emerald Garden',
    description: 'Deep greens and ivory for a botanical feel',
    colors: {
      gold: '#6f9a7c', 'gold-light': '#c7dcc9', 'gold-dark': '#3f6b4f',
      cream: '#f6f8f1', card: '#ffffff', dark: '#14261b', text: '#2f4636',
      blush: '#e3ece0', sage: '#8c9b6e',
      overlay: '#102018', shadow: '#2f4636', 'on-accent': '#14261b',
    },
    fonts: { display: "'Marcellus', serif", serif: "'EB Garamond', serif", sans: "'Jost', sans-serif" },
    googleFonts: ['Marcellus', 'EB+Garamond:ital,wght@0,400;0,500;0,600;1,400', 'Jost:wght@300;400;500'],
  },
  {
    id: 'midnight-luxe',
    name: 'Midnight Luxe',
    description: 'Dark navy with champagne gold, made for evening events',
    colors: {
      gold: '#d4b26a', 'gold-light': '#c2a668', 'gold-dark': '#e6c98a',
      cream: '#0e1525', card: '#16203a', dark: '#f4ead2', text: '#c9d0e0',
      blush: '#1f2b48', sage: '#8e9bb8',
      overlay: '#070b16', shadow: '#000000', 'on-accent': '#0e1525',
    },
    fonts: { display: "'Cinzel', serif", serif: "'Cormorant', serif", sans: "'Raleway', sans-serif" },
    googleFonts: ['Cinzel:wght@400;600;700', 'Cormorant:ital,wght@0,400;0,500;0,600;1,400', 'Raleway:wght@300;400;500'],
  },
  {
    id: 'terracotta-boho',
    name: 'Terracotta Boho',
    description: 'Earthy terracotta and olive with bold serifs',
    colors: {
      gold: '#c0704f', 'gold-light': '#ecc3a8', 'gold-dark': '#8a4a30',
      cream: '#faf3ec', card: '#fffaf5', dark: '#2e1c14', text: '#4a3328',
      blush: '#f3ddd0', sage: '#8a8a5c',
      overlay: '#2a1810', shadow: '#4a3328', 'on-accent': '#2e1c14',
    },
    fonts: { display: "'DM Serif Display', serif", serif: "'Libre Baskerville', serif", sans: "'Nunito Sans', sans-serif" },
    googleFonts: ['DM+Serif+Display:ital@0;1', 'Libre+Baskerville:ital,wght@0,400;0,700;1,400', 'Nunito+Sans:wght@300;400;600'],
  },
  {
    id: 'ivory-minimal',
    name: 'Ivory Minimal',
    description: 'Monochrome, airy and modern with high-contrast type',
    colors: {
      gold: '#8a8580', 'gold-light': '#d9d5cf', 'gold-dark': '#5c5853',
      cream: '#fbfaf8', card: '#ffffff', dark: '#111111', text: '#3a3a3a',
      blush: '#efece7', sage: '#7d7a75',
      overlay: '#111111', shadow: '#222222', 'on-accent': '#111111',
    },
    fonts: { display: "'Bodoni Moda', serif", serif: "'Cormorant Garamond', serif", sans: "'Inter', sans-serif" },
    googleFonts: ['Bodoni+Moda:ital,wght@0,400;0,700;1,400', 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400', 'Inter:wght@300;400;500'],
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    description: 'Soft lilac and violet with airy, fashion-style lettering',
    colors: {
      gold: '#a48bc4', 'gold-light': '#dccff0', 'gold-dark': '#6b4f96',
      cream: '#f9f6fd', card: '#ffffff', dark: '#2a1f3d', text: '#4a3e5e',
      blush: '#ece4f7', sage: '#8e86a6',
      overlay: '#221836', shadow: '#4a3e5e', 'on-accent': '#2a1f3d',
    },
    fonts: { display: "'Italiana', serif", serif: "'Crimson Pro', serif", sans: "'Quicksand', sans-serif" },
    googleFonts: ['Italiana', 'Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,400', 'Quicksand:wght@300;400;500'],
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Teal waters and warm sand, perfect for a beach wedding',
    colors: {
      gold: '#4fa3a5', 'gold-light': '#bfe3e0', 'gold-dark': '#2a6f73',
      cream: '#f5faf9', card: '#ffffff', dark: '#0f2e33', text: '#2e4a4e',
      blush: '#f1e9dc', sage: '#7d9c9a',
      overlay: '#0c2629', shadow: '#2e4a4e', 'on-accent': '#0f2e33',
    },
    fonts: { display: "'Gilda Display', serif", serif: "'Spectral', serif", sans: "'Mulish', sans-serif" },
    googleFonts: ['Gilda+Display', 'Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400', 'Mulish:wght@300;400;500'],
  },
  {
    id: 'royal-maroon',
    name: 'Royal Maroon',
    description: 'Rich maroon and temple gold for a traditional celebration',
    colors: {
      gold: '#d9a441', 'gold-light': '#e9c77f', 'gold-dark': '#f0cf7a',
      cream: '#2b0a10', card: '#3a1018', dark: '#fbecd0', text: '#e8d3c4',
      blush: '#4a1620', sage: '#c79a8e',
      overlay: '#1a0509', shadow: '#000000', 'on-accent': '#2b0a10',
    },
    fonts: { display: "'Yeseva One', serif", serif: "'Alegreya', serif", sans: "'Karla', sans-serif" },
    googleFonts: ['Yeseva+One', 'Alegreya:ital,wght@0,400;0,500;0,700;1,400', 'Karla:wght@300;400;500'],
  },
  {
    id: 'peach-sunset',
    name: 'Peach Sunset',
    description: 'Warm peach and coral with a bold, joyful headline face',
    colors: {
      gold: '#e8946f', 'gold-light': '#f8d3bf', 'gold-dark': '#a9502f',
      cream: '#fff7f2', card: '#ffffff', dark: '#3b1d12', text: '#5b3a2e',
      blush: '#fde6da', sage: '#c08f7a',
      overlay: '#2e150c', shadow: '#5b3a2e', 'on-accent': '#3b1d12',
    },
    fonts: { display: "'Abril Fatface', serif", serif: "'Merriweather', serif", sans: "'Work Sans', sans-serif" },
    googleFonts: ['Abril+Fatface', 'Merriweather:ital,wght@0,300;0,400;0,700;1,400', 'Work+Sans:wght@300;400;500'],
  },
  {
    id: 'sage-linen',
    name: 'Sage & Linen',
    description: 'Muted sage and natural linen, calm and understated',
    colors: {
      gold: '#9caf88', 'gold-light': '#d8e2cc', 'gold-dark': '#5f7350',
      cream: '#f7f5ef', card: '#fffefa', dark: '#262b20', text: '#4a4f42',
      blush: '#ebe6da', sage: '#a39e8a',
      overlay: '#1f241a', shadow: '#4a4f42', 'on-accent': '#262b20',
    },
    fonts: { display: "'Tenor Sans', sans-serif", serif: "'Cardo', serif", sans: "'Outfit', sans-serif" },
    googleFonts: ['Tenor+Sans', 'Cardo:ital,wght@0,400;0,700;1,400', 'Outfit:wght@300;400;500'],
  },
  {
    id: 'marigold-festive',
    name: 'Marigold Festive',
    description: 'Marigold yellow and deep maroon, bright and festive',
    colors: {
      gold: '#e9a21b', 'gold-light': '#f7d98a', 'gold-dark': '#a8540f',
      cream: '#fffaf0', card: '#ffffff', dark: '#5a0f1d', text: '#4d2a1e',
      blush: '#fdebc8', sage: '#b5673a',
      overlay: '#3d0a14', shadow: '#4d2a1e', 'on-accent': '#3d0a14',
    },
    fonts: { display: "'Rozha One', serif", serif: "'Vollkorn', serif", sans: "'Hind', sans-serif" },
    googleFonts: ['Rozha+One', 'Vollkorn:ital,wght@0,400;0,500;0,600;1,400', 'Hind:wght@300;400;500'],
  },
  {
    id: 'vintage-sepia',
    name: 'Vintage Sepia',
    description: 'Old-paper sepia and cocoa with letterpress small caps',
    colors: {
      gold: '#a68a64', 'gold-light': '#dccbb0', 'gold-dark': '#6e5536',
      cream: '#f4ecdf', card: '#fbf6ee', dark: '#2c2016', text: '#4b3a2a',
      blush: '#e9dcc8', sage: '#8c7d68',
      overlay: '#241a10', shadow: '#4b3a2a', 'on-accent': '#2c2016',
    },
    fonts: { display: "'Playfair Display SC', serif", serif: "'Old Standard TT', serif", sans: "'Lato', sans-serif" },
    googleFonts: ['Playfair+Display+SC:wght@400;700', 'Old+Standard+TT:ital,wght@0,400;0,700;1,400', 'Lato:wght@300;400;700'],
  },
  {
    id: 'rose-gold-glam',
    name: 'Rose Gold Glam',
    description: 'Rose gold and blush with flowing calligraphy',
    colors: {
      gold: '#c99a8a', 'gold-light': '#f0d5cc', 'gold-dark': '#a0645a',
      cream: '#fdf8f6', card: '#ffffff', dark: '#33201d', text: '#5c4440',
      blush: '#f7e6e1', sage: '#b39189',
      overlay: '#2b1a18', shadow: '#5c4440', 'on-accent': '#33201d',
    },
    fonts: { display: "'Great Vibes', cursive", serif: "'Cormorant', serif", sans: "'Montserrat', sans-serif" },
    googleFonts: ['Great+Vibes', 'Cormorant:ital,wght@0,400;0,500;0,600;1,400', 'Montserrat:wght@300;400;500'],
  },
  {
    id: 'sapphire-night',
    name: 'Sapphire Night',
    description: 'Deep sapphire blue with silver, cool and elegant',
    colors: {
      gold: '#9fb7e0', 'gold-light': '#b8c9e8', 'gold-dark': '#d6e2f7',
      cream: '#0b1a3a', card: '#132654', dark: '#eef3fc', text: '#c3cfe6',
      blush: '#1c3166', sage: '#8ea3c9',
      overlay: '#060f24', shadow: '#000000', 'on-accent': '#0b1a3a',
    },
    fonts: { display: "'Forum', serif", serif: "'Libre Caslon Text', serif", sans: "'Manrope', sans-serif" },
    googleFonts: ['Forum', 'Libre+Caslon+Text:ital,wght@0,400;0,700;1,400', 'Manrope:wght@300;400;500'],
  },
  {
    id: 'burgundy-wine',
    name: 'Burgundy Wine',
    description: 'Burgundy and dusty pink, romantic with a classic serif',
    colors: {
      gold: '#b5838d', 'gold-light': '#e6c7cc', 'gold-dark': '#7a2638',
      cream: '#fbf6f4', card: '#ffffff', dark: '#2e0c15', text: '#4d2a33',
      blush: '#f3e3e4', sage: '#9c7b80',
      overlay: '#2a0a12', shadow: '#4d2a33', 'on-accent': '#2e0c15',
    },
    fonts: { display: "'Prata', serif", serif: "'PT Serif', serif", sans: "'Source Sans 3', sans-serif" },
    googleFonts: ['Prata', 'PT+Serif:ital,wght@0,400;0,700;1,400', 'Source+Sans+3:wght@300;400;500'],
  },
]

export const defaultThemeId = themes[0].id

export const getTheme = (id) => themes.find((theme) => theme.id === id) || themes[0]

// Applies a theme's colours and fonts to the page
export function applyTheme(id) {
  const theme = getTheme(id)
  const root = document.documentElement

  Object.entries(theme.colors).forEach(([name, value]) => root.style.setProperty(`--${name}`, value))
  Object.entries(theme.fonts).forEach(([name, value]) => root.style.setProperty(`--font-${name}`, value))

  let link = document.getElementById('theme-fonts')
  if (!link) {
    link = document.createElement('link')
    link.id = 'theme-fonts'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  link.href = fontsUrl(theme.googleFonts)
}

export const fontsUrl = (families) =>
  `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`
