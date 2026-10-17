// Help topics, shared by Help.vue (desktop and tablet) and Help2.vue (phones).
// Steps name buttons as they read on screen; keep them in step when the screens change.
import { PLANS } from '@/config/plans'

const free = PLANS.free
const plus = PLANS.plus

export const HELP_TOPICS = [
  {
    id: 'invite',
    title: 'Create & share your invitation',
    short: 'Invitation',
    icon: 'fa-envelope-open-text',
    intro: 'From signing in to sending the link: your online invitation, with its home page, events, couple, story and photos, ready for guests in a few steps.',
    steps: [
      {
        title: 'Sign in',
        icon: 'fa-right-to-bracket',
        body: [
          'Sign in with your email or with Google. New here? Create an account with your name, email and a password, then confirm the email we send you.',
        ],
        action: { label: 'Sign in', to: { name: 'login' } },
      },
      {
        title: 'Create an invitation',
        icon: 'fa-plus',
        body: [
          'Open My invitations and click "New invitation". Read the agreement and sign it with your name to create it.',
          `The ${free.label} plan has ${free.invitations} invitation; ${plus.label} has up to ${plus.invitations}.`,
        ],
        action: { label: 'My invitations', to: { name: 'settings' } },
      },
      {
        title: 'Fill in your details',
        icon: 'fa-pen-to-square',
        body: [
          'The editor opens on your new invitation. Work through its sections: Theme, Groom and Bride (names, parents, photos, bio), Couple, Events (date, time, venue and map), Home page (invite line, background, countdown), Story, Moments, Save the date and Site.',
          'On wide screens the live preview sits beside the editor; on tablets open it with "Preview". Empty fields show sample text in the preview only, guests never see it.',
        ],
        tips: [
          'Pick an event under "Fill from an event" in Home page to copy its date, time and place.',
          `Every photo upload counts towards the plan: ${free.uploads} per invitation on ${free.label}, ${plus.uploads} on ${plus.label}.`,
        ],
      },
      {
        title: 'Save to get your guest link',
        icon: 'fa-floppy-disk',
        body: [
          'Click "Save". The first save gives the invitation its guest link, a 12-character code that never changes.',
          'Guests only see what you have saved, so save again after each round of changes.',
        ],
      },
      {
        title: 'Check what guests see',
        icon: 'fa-arrow-up-right-from-square',
        body: [
          'Open the guest view from the arrow on the invitation in My invitations, or next to the code in the editor. Visit each page: Home, Events, Couple, Story and Moments.',
        ],
      },
      {
        title: 'Write the message',
        icon: 'fa-comment-dots',
        body: [
          'In the editor\'s Site section, choose or write the share message. "Insert" adds details such as the names, the date and the link; "What guests receive" shows the result.',
        ],
      },
      {
        title: 'Send it',
        icon: 'fa-paper-plane',
        body: [
          'Click "Copy invite" next to the code in the editor, or the link button on the invitation in My invitations. This copies the message with the guest link: paste it into WhatsApp, SMS or email.',
          'On a phone, "Share invitation" opens the phone\'s own share menu.',
        ],
        tips: [
          `The ${free.label} plan allows ${free.visitors} visitors per invitation; ${plus.label} has no limit. My invitations shows the count.`,
        ],
      },
      {
        title: 'Keep it safe',
        icon: 'fa-shield-halved',
        body: [
          'In My invitations, the lock button stops accidental edits while guests can still open it, and the eye button hides it from guests until you show it again.',
        ],
      },
    ],
  },
  {
    id: 'traditional',
    title: 'Make the traditional PDF',
    short: 'Traditional PDF',
    icon: 'fa-scroll',
    intro: 'A printed invitation card made from your invitation\'s details: pick its wording and design, download it as a print-ready PDF, and show it to guests on the home page.',
    steps: [
      {
        title: 'Open the card editor',
        icon: 'fa-file-pdf',
        body: [
          'Click the PDF button on the invitation in My invitations, or "Print card" in the editor. Save the invitation first: the card starts from its saved names, parents and events.',
        ],
        action: { label: 'My invitations', to: { name: 'settings' } },
      },
      {
        title: 'Choose the wording',
        icon: 'fa-language',
        body: [
          'The version pills at the top switch the card\'s text: Classic, Traditional Hindu, Festive, Romantic and more. Each version keeps its own edits (marked with a dot).',
          '"Reset text" starts the version shown again from the invitation\'s details.',
        ],
      },
      {
        title: 'Edit the text',
        icon: 'fa-pen-nib',
        body: [
          'Click on the card and type. The toolbar sets the style (Names, Heading, Label, Text, Small), the font (including Malayalam, Tamil, Hindi, Telugu and Kannada), bold, italic, alignment and colour, and adds an ornament divider.',
        ],
        tips: ['A warning appears when the text runs past the border: shorten it, use smaller styles or pick a larger paper.'],
      },
      {
        title: 'Design the card',
        icon: 'fa-swatchbook',
        body: [
          'Choose the paper (A5, 5 × 7 in, A4 or Square), a border, a motif above the text and its size, and the colours and fonts. On a phone these are under "Design".',
        ],
      },
      {
        title: 'Save the card',
        icon: 'fa-floppy-disk',
        body: [
          'Click "Save" (or Ctrl+S). "Save as copy" keeps another card, eg. one per language.',
          `Each invitation holds ${free.cards} cards on ${free.label} and ${plus.cards} on ${plus.label}; delete one to make room.`,
        ],
      },
      {
        title: 'Download the PDF',
        icon: 'fa-download',
        body: ['Click "Download PDF" for a print-ready file at the chosen paper size, ready for your printer or to send.'],
      },
      {
        title: 'Or upload your own PDF',
        icon: 'fa-file-arrow-up',
        body: [
          'Already have an invitation designed? In the card editor, "Upload PDF" under "Your own PDF" (up to 10 MB, one upload) shows it to guests straight away, in place of a designed card.',
          '"Replace PDF" swaps it and "Remove PDF" takes it off the home page.',
        ],
      },
      {
        title: 'Show it to guests',
        icon: 'fa-house',
        body: [
          'In the editor\'s Home page section, pick the card under "Printed invitation" and save. Guests get an "Invitation card" button on the home page to view and download it.',
          'Saving the card again in the card editor updates what guests see.',
        ],
        tips: ['Turn on "Auto download" in the Site section to download it for each guest the first time they open the home page.'],
      },
    ],
  },
  {
    id: 'sitemap',
    title: 'Site map',
    short: 'Site map',
    icon: 'fa-sitemap',
    intro: 'Every page of the app, what it is for and how to get there.',
    map: [
      {
        title: 'Guest site',
        icon: 'fa-users',
        desc: 'What guests open from your link, /<code>',
        children: [
          { title: 'Home', path: '/<code>', icon: 'fa-house', desc: 'Names, date, time, place, countdown; "Invitation card" when one is picked; save-the-date popup on first open' },
          { title: 'Events', path: '/<code>/events', icon: 'fa-calendar-days', desc: 'Each event with its time, venue and map' },
          { title: 'Couple', path: '/<code>/couple', icon: 'fa-user-group', desc: 'Photos, parents, bios, interests and social links' },
          { title: 'Story', path: '/<code>/story', icon: 'fa-book-open', desc: 'Your milestones as a timeline' },
          { title: 'Moments', path: '/<code>/moments', icon: 'fa-images', desc: 'Photo gallery' },
        ],
      },
      {
        title: 'Your account',
        icon: 'fa-circle-user',
        desc: 'Where you make and manage invitations',
        children: [
          { title: 'Sign in', path: '/login', icon: 'fa-right-to-bracket', desc: 'Email or Google; create an account or reset the password', to: { name: 'login' } },
          {
            title: 'My invitations',
            path: '/settings',
            icon: 'fa-layer-group',
            desc: 'Your plan, visitors and every invitation',
            to: { name: 'settings' },
            children: [
              { title: 'New invitation', icon: 'fa-plus', desc: 'Sign the agreement to create one' },
              { title: 'Edit, guest view, PDF, copy link', icon: 'fa-pen', desc: 'Buttons on each invitation' },
              { title: 'Lock, hide, delete', icon: 'fa-lock', desc: 'Stop edits, hide from guests, or remove it' },
            ],
          },
        ],
      },
      {
        title: 'Invitation editor',
        icon: 'fa-sliders',
        desc: '/settings/<invitation>, from Edit in My invitations',
        children: [
          { title: 'Theme', icon: 'fa-palette', desc: 'Colours and fonts' },
          { title: 'Groom, Bride & Couple', icon: 'fa-user-group', desc: 'Names, parents, photos, bios, socials' },
          { title: 'Events', icon: 'fa-calendar-days', desc: 'Date, time, venue, map' },
          { title: 'Home page', icon: 'fa-house', desc: 'Invite line, background, printed invitation, countdown' },
          { title: 'Story & Moments', icon: 'fa-book-open', desc: 'Milestones and the photo gallery' },
          { title: 'Save the date', icon: 'fa-envelope-open-text', desc: 'Popup with images on first open' },
          { title: 'Site & Navigation', icon: 'fa-globe', desc: 'Tab title, monogram, share message, auto download, menu labels' },
          { title: 'History, Import, Export', icon: 'fa-clock-rotate-left', desc: 'Earlier versions (Plus) and JSON files' },
        ],
      },
      {
        title: 'Printed invitation',
        icon: 'fa-scroll',
        desc: '/traditional, from the PDF button or "Print card"',
        children: [
          { title: 'Saved cards', icon: 'fa-layer-group', desc: `${free.cards} per invitation on ${free.label}, ${plus.cards} on ${plus.label}` },
          { title: 'Your own PDF', icon: 'fa-file-arrow-up', desc: 'Upload, preview, replace or remove' },
          { title: 'Paper, Border, Motif, Colours', icon: 'fa-swatchbook', desc: 'The card\'s design' },
          { title: 'Download PDF', icon: 'fa-download', desc: 'Print-ready at the paper size' },
        ],
      },
      {
        title: 'Help',
        icon: 'fa-circle-question',
        desc: '/help, this page',
        children: [
          { title: 'Create & share your invitation', icon: 'fa-envelope-open-text', desc: 'Sign in to sending the link', topic: 'invite' },
          { title: 'Make the traditional PDF', icon: 'fa-scroll', desc: 'Card editor to guests\' home page', topic: 'traditional' },
        ],
      },
    ],
  },
]

export const getHelpTopic = (id) => HELP_TOPICS.find((t) => t.id === id) || HELP_TOPICS[0]
