// Phones get the mobile invitation list and editor, unless they've asked for the desktop ones
const MOBILE_QUERY = '(max-width: 768px)'
const STORAGE_KEY = 'settingsView'

export const isMobileDevice = () =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches

// "desktop" once a phone user picks the desktop view, so it sticks for the session
export const preferredSettingsView = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export const setPreferredSettingsView = (view) => {
  try {
    if (view) sessionStorage.setItem(STORAGE_KEY, view)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked: the choice just won't persist
  }
}
