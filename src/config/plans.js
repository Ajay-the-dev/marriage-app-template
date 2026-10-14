// Limits per plan. An account is Free unless plans/{uid} says { plan: 'plus' }
// (set by hand in the Firebase console for now).
export const PLANS = {
  free: {
    label: 'Free',
    invitations: 1,
    visitors: 500,
    visitorWarning: 400,
    uploads: 25, // per invitation, every image upload counts
    events: 3,
    milestones: 10,
    gallery: 4,
    saveTheDate: 2,
    editNavigation: false,
    hideBadge: false,
  },
  plus: {
    label: 'Plus',
    invitations: 5,
    visitors: Infinity,
    visitorWarning: Infinity,
    uploads: 100,
    events: 10,
    milestones: 25,
    gallery: 25,
    saveTheDate: 5,
    editNavigation: true,
    hideBadge: true,
  },
}

// Plus is unlocked by a Ko-fi donation (see functions/index.js)
export const KOFI_URL = import.meta.env.VITE_KOFI_URL || ''
// Shown to users, e.g. "$5"; keep in line with the function's KOFI_MIN_AMOUNT
export const PLUS_PRICE = import.meta.env.VITE_PLUS_PRICE || ''
// The code users paste into their Ko-fi message so the payment finds their account
export const plusCode = (uid) => `PLUS-${uid}`

export const getPlan = (id) => PLANS[id] ?? PLANS.free

// Lists of items capped per invitation
const LISTS = [
  { key: 'events', label: 'events', get: (c) => c.eventsPage?.events },
  { key: 'milestones', label: 'story milestones', get: (c) => c.storyPage?.milestones },
  { key: 'gallery', label: 'gallery images', get: (c) => c.momentsPage?.images },
  { key: 'saveTheDate', label: 'save-the-date images', get: (c) => c.saveTheDate?.images },
]

// Trims each list down to the plan's limit (mutates and returns config)
export const fitToPlan = (config, plan) => {
  for (const { key, get } of LISTS) get(config)?.splice(plan[key])
  return config
}

// What in this invitation is over the plan's limits, e.g. ["5 events (limit 3)"]
export const overLimits = (config, plan) =>
  LISTS.flatMap(({ key, label, get }) => {
    const count = get(config)?.length ?? 0
    return count > plan[key] ? [`${count} ${label} (limit ${plan[key]})`] : []
  })
