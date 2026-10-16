import { defineStore } from 'pinia'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/services/firebase'

// Add more OAuth providers here (GithubAuthProvider, FacebookAuthProvider, …)
// after enabling them in Firebase console → Authentication → Sign-in method.
const providers = {
  google: () => new GoogleAuthProvider(),
}

// Resolves once Firebase has restored (or not) the previous session.
let resolveReady
const ready = new Promise((resolve) => { resolveReady = resolve })

const messages = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/missing-password': 'Please enter your password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-blocked': 'The sign-in popup was blocked. Please allow popups and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/account-exists-with-different-credential': 'This email is already registered with a different sign-in method.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'app/not-configured': 'Sign-in is not set up yet (Firebase config missing).',
}

const notConfigured = () => {
  if (!auth) throw Object.assign(new Error(), { code: 'app/not-configured' })
}

export const authErrorMessage = (error) =>
  messages[error?.code] || error?.message || 'Something went wrong. Please try again.'

const toUser = (user) =>
  user
    ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, emailVerified: user.emailVerified }
    : null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    initialized: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
  },
  actions: {
    // Call once at startup; keeps `user` in sync with Firebase.
    init() {
      if (!auth) {
        this.initialized = true
        resolveReady()
        return ready
      }
      onAuthStateChanged(auth, (user) => {
        this.user = toUser(user)
        this.initialized = true
        resolveReady()
      })
      return ready
    },
    waitUntilReady() {
      return ready
    },
    async register({ name, email, password }) {
      notConfigured()
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      if (name) await updateProfile(user, { displayName: name })
      this.user = toUser(user)
      await sendEmailVerification(user).catch(() => {})
    },
    async login({ email, password }) {
      notConfigured()
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      this.user = toUser(user)
    },
    async loginWith(providerId) {
      notConfigured()
      const { user } = await signInWithPopup(auth, providers[providerId]())
      this.user = toUser(user)
    },
    resetPassword(email) {
      notConfigured()
      return sendPasswordResetEmail(auth, email)
    },
    logout() {
      return auth ? signOut(auth) : Promise.resolve()
    },
  },
})
