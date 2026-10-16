// Suggestions for the groom's and bride's profile: professions, interests,
// and bios written from what the couple has filled in.

export const PROFESSIONS = [
  'Software Engineer', 'Data Scientist', 'Product Manager', 'UI/UX Designer', 'Web Developer',
  'Doctor', 'Surgeon', 'Dentist', 'Nurse', 'Pharmacist', 'Physiotherapist', 'Psychologist', 'Veterinarian',
  'Teacher', 'Professor', 'Lecturer', 'Researcher', 'Scientist',
  'Chartered Accountant', 'Accountant', 'Banker', 'Financial Analyst', 'Investment Banker', 'Auditor',
  'Lawyer', 'Advocate', 'Judge',
  'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Electronics Engineer', 'Architect', 'Interior Designer',
  'Entrepreneur', 'Business Owner', 'Consultant', 'Marketing Manager', 'Sales Manager', 'HR Manager', 'Project Manager',
  'Civil Servant', 'IAS Officer', 'IPS Officer', 'Police Officer', 'Army Officer', 'Navy Officer', 'Air Force Officer',
  'Pilot', 'Cabin Crew', 'Merchant Navy Officer',
  'Journalist', 'Writer', 'Content Creator', 'Photographer', 'Filmmaker', 'Graphic Designer', 'Fashion Designer',
  'Artist', 'Musician', 'Singer', 'Dancer', 'Actor',
  'Chef', 'Hotel Manager', 'Fitness Trainer', 'Yoga Instructor', 'Athlete',
  'Farmer', 'Social Worker', 'Student',
]

export const INTERESTS = [
  'Travel', 'Road trips', 'Trekking', 'Beaches', 'Photography', 'Cooking', 'Baking', 'Food',
  'Filter coffee', 'Reading', 'Writing', 'Poetry', 'Music', 'Singing', 'Classical dance', 'Dancing',
  'Movies', 'Web series', 'Cricket', 'Football', 'Badminton', 'Fitness', 'Yoga', 'Running', 'Cycling',
  'Swimming', 'Gaming', 'Painting', 'Gardening', 'Pets', 'Volunteering', 'Fashion', 'Technology',
]

export const MAX_INTERESTS = 8

const lower = (text, list) => (list.some((item) => item.toLowerCase() === text.toLowerCase()) ? text.toLowerCase() : text)
const article = (word) => (/^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`)
const listOf = (items) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1)

// A few bios from the name, profession and interests; [] when there's nothing to go on
export const bioSuggestions = (person) => {
  const name = (person.shortName || person.name || '').trim()
  const profession = lower((person.profession || '').trim(), PROFESSIONS)
  const interests = (person.interests || []).map((i) => lower(i.trim(), INTERESTS)).filter(Boolean)
  const loves = listOf(interests)
  const who = name || 'Someone'
  const bios = []

  if (profession && interests.length) {
    bios.push(
      `${who} is ${article(profession)} who loves ${loves}.`,
      `${capitalize(article(profession))} by day, and at heart a lover of ${loves}.`,
      `${who} works as ${article(profession)} and spends every free moment on ${loves}.`,
      `${capitalize(article(profession))} with a passion for ${loves}, and a big smile for everyone.`,
    )
  } else if (profession) {
    bios.push(
      `${who} is ${article(profession)} who brings warmth and laughter to every room.`,
      `${capitalize(article(profession))} with a kind heart, ready for the most beautiful journey yet.`,
    )
  } else if (interests.length) {
    bios.push(
      `${who} loves ${loves}.`,
      `Happiest with ${loves}, and now ready to share it all for a lifetime.`,
    )
  }
  return bios
}
