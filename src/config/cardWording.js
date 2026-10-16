// The printed card's wording versions, switched between in the editor.
// Each builds the card's HTML from the invitation: names, parents lines and events.
// Tags: h1 names · h2 heading · h3 label · p text · h6 fine print · hr ornament divider

const escape = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const join = (parts, sep = ' ') => parts.map((p) => String(p ?? '').trim()).filter(Boolean).join(sep)

// The invitation's details, escaped and ready to drop into HTML
const details = (config) => {
  const groom = config.groom || {}
  const bride = config.bride || {}
  const hero = config.hero || {}
  const events = (config.eventsPage?.events || []).map((e) => ({
    name: escape(e.name),
    when: escape(join([join([e.day, e.month]), e.time && `· ${e.time}`])),
    where: escape(join([e.venue, e.location], ', ')),
  }))
  // The ceremony itself, for wordings that name a single occasion
  const mainIndex = (config.eventsPage?.events || []).findIndex((e) => /wedding|muhurt|marriage|vivah|kalyan|nikah/i.test(e.name || ''))
  const fallback = { name: 'Wedding', when: escape(join([hero.dateText, hero.timeText], ' · ')), where: escape(hero.locationText) }
  return {
    groom: escape(groom.name || 'Groom Name'),
    bride: escape(bride.name || 'Bride Name'),
    groomParents: escape(groom.parents),
    brideParents: escape(bride.parents),
    events,
    main: events[mainIndex] || events[0] || fallback,
    date: escape(hero.dateText),
    time: escape(hero.timeText),
    location: escape(hero.locationText),
  }
}

// ── Building blocks ──
const fine = (text) => (text ? `<h6>${text}</h6>` : '')
const couple = (d, { between = 'with', parents = true } = {}) => [
  `<h1>${d.groom}</h1>`,
  parents ? fine(d.groomParents) : '',
  `<h2>${between}</h2>`,
  `<h1>${d.bride}</h1>`,
  parents ? fine(d.brideParents) : '',
].join('')
const whenWhere = (e) => `<p>${e.when}${e.where ? `<br>${e.where}` : ''}</p>`
// Every event: label, then date/time and venue
const eventList = (d) => d.events.map((e) => `<h3>${e.name}</h3>${whenWhere(e)}`).join('')
// Every event on one line each: "Engagement · 10 June · 6 PM, Venue"
const eventLines = (d) => d.events.map((e) => `<p><strong>${e.name}</strong> · ${e.when}${e.where ? `<br>${e.where}` : ''}</p>`).join('')
const mainEvent = (d, label) => `<h3>${label || d.main.name}</h3>${whenWhere(d.main)}`

// The wording versions, in the order the editor shows them.
// theme: the theme a new card starts this version with (and the other way round)
export const CARD_VERSIONS = [
  {
    id: 'classic',
    label: 'Classic',
    theme: 'royal-gold',
    html: (d) => [
      fine('With the blessings of the Almighty and our elders'),
      '<p>We solicit your gracious presence with family and friends on the auspicious occasion of the marriage of</p>',
      couple(d),
      '<hr>', eventList(d), '<hr>',
      '<p><em>Your presence and blessings are the greatest gift</em></p>',
      fine('With best compliments from<br>Relatives &amp; Friends'),
    ],
  },
  {
    id: 'hindu',
    label: 'Traditional Hindu',
    theme: 'royal-maroon',
    html: (d) => [
      fine('|| Shree Ganeshaya Namah ||'),
      '<h2>Shubh Vivah</h2>',
      '<p>With the divine blessings of the Almighty, we cordially invite you and your family to the auspicious marriage ceremony of</p>',
      couple(d),
      '<hr>', mainEvent(d, 'Muhurtham'), '<hr>',
      '<p><em>Your gracious presence and blessings are solicited</em></p>',
      fine('With warm regards<br>Family &amp; Friends'),
    ],
  },
  {
    id: 'festive',
    label: 'Festive',
    theme: 'marigold-festive',
    html: (d) => [
      fine('|| Shubh Vivah ||'),
      '<h2>Let the celebrations begin!</h2>',
      '<p>With joy in our hearts and marigolds at the door, we invite you to the wedding festivities of</p>',
      couple(d),
      '<hr>', eventList(d), '<hr>',
      '<p><em>Come for the rituals, stay for the music, food and dance</em></p>',
      fine('Awaiting your arrival<br>Relatives &amp; Friends'),
    ],
  },
  {
    id: 'minimal',
    label: 'Minimal',
    theme: 'ivory-minimal',
    html: (d) => [
      couple(d, { between: '&amp;', parents: false }),
      '<hr>',
      `<p>${d.main.when}</p>`,
      d.main.where ? `<p>${d.main.where}</p>` : '',
      '<hr>',
      fine('Kindly join us and bless the couple'),
    ],
  },
  {
    id: 'romantic',
    label: 'Romantic',
    theme: 'blush-romance',
    html: (d) => [
      fine('Together with their families'),
      couple(d, { between: '&amp;', parents: false }),
      '<p>joyfully invite you to celebrate their love as they begin their forever, together</p>',
      '<hr>', eventList(d), '<hr>',
      '<p><em>Love, laughter and a happily ever after</em></p>',
      fine(join([d.groomParents, d.brideParents], '<br>')),
    ],
  },
  {
    id: 'elegant',
    label: 'Elegant',
    theme: 'burgundy-wine',
    html: (d) => [
      fine('Together with their families'),
      couple(d, { between: 'and' }),
      '<p>request the pleasure of your company at a celebration of their marriage</p>',
      '<hr>', eventList(d), '<hr>',
      '<p><em>A toast to love, followed by dinner</em></p>',
      fine('With best compliments<br>Relatives &amp; Friends'),
    ],
  },
  {
    id: 'old-world',
    label: 'Old-world',
    theme: 'vintage-sepia',
    html: (d) => [
      fine('Request the honour of your presence'),
      '<p>at the marriage of</p>',
      couple(d, { between: 'to' }),
      '<hr>', mainEvent(d), '<hr>',
      '<p><em>Reception to follow</em></p>',
      fine('R.S.V.P.'),
    ],
  },
  {
    id: 'black-tie',
    label: 'Black-tie',
    theme: 'midnight-luxe',
    html: (d) => [
      fine('The pleasure of your company is requested'),
      '<p>at the celebration of the marriage of</p>',
      couple(d, { between: 'and' }),
      '<hr>', eventList(d), '<hr>',
      '<p><em>An evening of dinner, music and dancing</em></p>',
      fine('Kindly respond at your earliest convenience'),
    ],
  },
  {
    id: 'garden',
    label: 'Garden',
    theme: 'emerald-garden',
    html: (d) => [
      '<h2>Two hearts bloom as one</h2>',
      '<p>Amid green leaves and open skies, our families invite you to the wedding of</p>',
      couple(d, { between: 'and' }),
      '<hr>', eventList(d), '<hr>',
      '<p><em>Come grow this new beginning with us</em></p>',
      fine('With love from both families'),
    ],
  },
  {
    id: 'dreamy',
    label: 'Dreamy',
    theme: 'lavender-dream',
    html: (d) => [
      fine('A dream we’ve waited for is coming true'),
      '<p>With hearts full of joy, we invite you to the wedding of</p>',
      couple(d),
      '<hr>', eventList(d), '<hr>',
      '<p><em>Your presence will make our day complete</em></p>',
      fine('With love, from both families'),
    ],
  },
  {
    id: 'coastal',
    label: 'Coastal',
    theme: 'ocean-breeze',
    html: (d) => [
      '<h2>Two souls, one tide</h2>',
      '<p>Join us by the sea breeze as we tie the knot</p>',
      couple(d, { between: '&amp;', parents: false }),
      '<hr>', eventList(d), '<hr>',
      '<p><em>Sun, sand and a lifetime of love</em></p>',
      fine(join([d.groomParents, d.brideParents], '<br>')),
    ],
  },
  {
    id: 'cheerful',
    label: 'Cheerful',
    theme: 'peach-sunset',
    html: (d) => [
      fine('As the sun sets on one chapter, a new one begins'),
      couple(d, { between: 'and', parents: false }),
      '<p>would love for you to share in their happiness on their wedding day</p>',
      '<hr>', eventList(d), '<hr>',
      '<p><em>Golden hours, glowing hearts</em></p>',
      fine(join([d.groomParents, d.brideParents], '<br>')),
    ],
  },
  {
    id: 'rustic',
    label: 'Rustic',
    theme: 'sage-linen',
    html: (d) => [
      fine('Simply put, we’re in love'),
      couple(d, { between: 'and' }),
      '<p>invite you to a simple celebration of their marriage</p>',
      '<hr>', eventLines(d), '<hr>',
      fine('With gratitude, from both our families'),
    ],
  },
  {
    id: 'relaxed',
    label: 'Relaxed',
    theme: 'terracotta-boho',
    html: (d) => [
      '<h2>We’re getting married!</h2>',
      couple(d, { between: '+', parents: false }),
      '<p>Come celebrate with good food, great company and lots of love</p>',
      '<hr>', eventLines(d), '<hr>',
      '<p><em>Bring your dancing shoes and your best smile</em></p>',
      fine(join([d.groomParents, d.brideParents], '<br>')),
    ],
  },
  {
    id: 'glam',
    label: 'Glam',
    theme: 'rose-gold-glam',
    html: (d) => [
      '<h2>Save the night</h2>',
      '<p>You are invited to a glamorous celebration of love as</p>',
      couple(d, { between: '&amp;', parents: false }),
      '<p>say “I do”</p>',
      '<hr>', eventList(d), '<hr>',
      '<p><em>Dress to impress, come ready to dance</em></p>',
      fine(join([d.groomParents, d.brideParents], '<br>')),
    ],
  },
  {
    id: 'starlit',
    label: 'Starlit',
    theme: 'sapphire-night',
    html: (d) => [
      fine('Under a sky full of stars'),
      '<p>we invite you to witness the beginning of forever for</p>',
      couple(d, { between: 'and' }),
      '<hr>', eventList(d), '<hr>',
      '<p><em>Written in the stars, celebrated with you</em></p>',
      fine('With love from both families'),
    ],
  },
]

// The version a new card starts with: the one made for the invitation's theme
export const versionForTheme = (themeId) => (CARD_VERSIONS.find((v) => v.theme === themeId) || CARD_VERSIONS[0]).id

export const getVersion = (id) => CARD_VERSIONS.find((v) => v.id === id) || CARD_VERSIONS[0]

// A version's starting HTML, filled from the invitation
export const versionHtml = (config, versionId) => getVersion(versionId).html(details(config)).join('')
