// Ready-made notes for story milestones, keyed by milestone name.
// Custom milestones (any other name) get the general ones.
const NOTES = {
  'First Meet': [
    'The day our paths crossed for the very first time.',
    'A chance meeting that quietly changed everything.',
    'Two strangers, one conversation, and a feeling we couldn\'t explain.',
    'We didn\'t know it then, but this was where our story began.',
  ],
  'First Date': [
    'Nervous smiles, endless conversation, and the start of something special.',
    'One coffee turned into hours, and we never wanted it to end.',
    'Our first date, and the first of many favourite days together.',
    'We said goodbye that evening already planning the next one.',
  ],
  'Falling in Love': [
    'Somewhere between the laughter and the late-night talks, we fell in love.',
    'Slowly, then all at once, we knew this was forever.',
    'The moment we realised home was each other.',
    'Every day together made the feeling a little stronger.',
  ],
  'The Proposal': [
    'One question, one answer, and a lifetime of promises.',
    'On one knee with a nervous heart, and the easiest "yes" ever said.',
    'The day forever became a promise.',
    'A ring, a few happy tears, and a very big yes.',
  ],
  'Families Meet': [
    'Two families came together and became one.',
    'Our families met, shared a meal, and gave us their blessings.',
    'Laughter, stories and blessings as our families became one.',
    'The day our loved ones welcomed each other with open hearts.',
  ],
  'Engagement': [
    'Surrounded by family and friends, we made it official.',
    'Rings exchanged and blessings received, our journey to forever began.',
    'With the blessings of our elders, we took our first step together.',
    'A day of joy, celebration and new beginnings.',
  ],
  'Wedding': [
    'The day we begin our forever, and we\'d love for you to be there.',
    'Two hearts, one promise, and a lifetime together.',
    'With joy in our hearts, we say "I do".',
    'The next chapter of our story starts here.',
  ],
}

const GENERAL = [
  'A moment we\'ll always hold close to our hearts.',
  'One of our favourite memories together.',
  'Another beautiful chapter in our story.',
  'A day that brought us even closer.',
]

export const storyNoteSuggestions = (name) => NOTES[name] ?? GENERAL
