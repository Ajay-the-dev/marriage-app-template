import weddingConfig from '@/config/wedding.json'

// What a new invitation starts with: every field the couple fills in is empty,
// with no images. Settings shows "Eg:" placeholders instead.
// The template (wedding.json) stays as is for the signed-out preview.
// Kept: theme, navigation and the small UI labels (countdown units, map button,
// year label), which the site needs to render properly.
const person = (roleLabel) => ({ name: '', shortName: '', roleLabel, photo: '', profession: '', interests: [], father: '', mother: '', parents: '', bio: '', socials: [] })

export const blankWedding = () => {
  const t = JSON.parse(JSON.stringify(weddingConfig))
  return {
    ...t,
    site: { title: '', monogram: '' },
    groom: person('The Groom'),
    bride: person('The Bride'),
    hero: {
      ...t.hero,
      inviteLine: '',
      backgroundImage: '',
      dateText: '',
      timeText: '',
      locationText: '',
      countdown: { ...t.hero.countdown, target: '' },
    },
    couplePage: { subTitle: '', title: '' },
    eventsPage: { ...t.eventsPage, subTitle: '', title: '', timezone: '', events: [] },
    storyPage: { ...t.storyPage, subTitle: '', title: '', milestones: [] },
    momentsPage: { subTitle: '', title: '', images: [] },
    saveTheDate: { ...t.saveTheDate, expiresAt: '', images: [] },
  }
}

// Shown wherever a photo hasn't been uploaded yet
export const PLACEHOLDER_PHOTO = '/images/placeholder-person.svg'
export const PLACEHOLDER_BACKGROUND = '/images/placeholder-background.svg'
