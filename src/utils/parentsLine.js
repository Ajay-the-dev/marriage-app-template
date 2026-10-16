// Parents line suggestions built from the father's and mother's names.
// Titles (Mr. / Mrs.) are added only where the name doesn't already start with one.
const TITLE = /^(mr|mrs|ms|miss|dr|late|prof|shri|smt|sri)\b\.?/i

const withTitle = (name, title) => (TITLE.test(name) ? name : `${title} ${name}`)

const formats = [
  (rel, f, m) => `${rel} of ${[f && withTitle(f, 'Mr.'), m && withTitle(m, 'Mrs.')].filter(Boolean).join(' & ')}`,
  (rel, f, m) => `${rel} of ${[f, m].filter(Boolean).join(' & ')}`,
  (rel, f, m) => `Beloved ${rel.toLowerCase()} of ${[f && withTitle(f, 'Mr.'), m && withTitle(m, 'Mrs.')].filter(Boolean).join(' & ')}`,
  (rel, f, m) => `${rel === 'Son' ? 'S/o' : 'D/o'} ${[f, m].filter(Boolean).join(' & ')}`,
]

// One line per format (so a picked format can follow name changes); [] until a name is filled in
const linesFor = (key, father = '', mother = '') => {
  const f = father.trim()
  const m = mother.trim()
  if (!f && !m) return []
  const rel = key === 'bride' ? 'Daughter' : 'Son'
  return formats.map((format) => format(rel, f, m))
}

// key: 'groom' | 'bride'
export const parentsLineSuggestions = (key, father, mother) => [...new Set(linesFor(key, father, mother))]

// Sets person.father or person.mother. A parents line that is empty or still one of the
// suggestions follows the new names; a custom line is left alone.
export const setParentName = (key, person, field, value) => {
  const before = linesFor(key, person.father, person.mother)
  const picked = person.parents ? before.indexOf(person.parents) : 0
  person[field] = value
  if (picked === -1) return
  person.parents = linesFor(key, person.father, person.mother)[picked] ?? ''
}
