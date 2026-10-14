import { collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '@/services/firebase'

// weddings/{id}  = { ownerId, code, config, createdAt, updatedAt, uploads, locked }
//                  (an account can own many; uploads counts images uploaded to it;
//                   locked = over the account's invitation limit)
// codes/{code}   = { uid, weddingId, createdAt }   (reserves the code so it stays unique)
// views/{id}     = { count }                       (unique guest visitors)
// plans/{uid}    = { plan: 'plus', since, source } (set by the Ko-fi webhook or by hand; missing means Free)
// Weddings saved before multi-wedding support use the owner's uid as their id,
// and their codes have no weddingId.
const weddingRef = (id) => doc(db, 'weddings', id)
const codeRef = (code) => doc(db, 'codes', code)
const viewsRef = (id) => doc(db, 'views', id)
const planRef = (uid) => doc(db, 'plans', uid)

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 12

// Cryptographically random, without modulo bias
export const generateCode = () => {
  const limit = 256 - (256 % CODE_CHARS.length)
  let code = ''
  while (code.length < CODE_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(CODE_LENGTH))) {
      if (byte < limit && code.length < CODE_LENGTH) code += CODE_CHARS[byte % CODE_CHARS.length]
    }
  }
  return code
}

const requireDb = () => {
  if (!db) throw new Error('Firebase is not configured (see .env.example)')
}

const toWedding = (id, data) => ({
  id,
  ownerId: data.ownerId,
  code: data.code ?? null,
  config: data.config ?? null,
  // Older weddings have no createdAt; treat them as the oldest
  createdAt: data.createdAt?.toDate() ?? new Date(0),
  updatedAt: data.updatedAt?.toDate() ?? null,
  uploads: data.uploads ?? 0,
  locked: !!data.locked,
})

// Returns the wedding, or null if there is no such wedding
export const fetchWedding = async (id) => {
  requireDb()
  const snap = await getDoc(weddingRef(id))
  return snap.exists() ? toWedding(id, snap.data()) : null
}

// All weddings owned by this account, oldest first (the order plan limits keep)
export const listWeddings = async (uid) => {
  requireDb()
  const snap = await getDocs(query(collection(db, 'weddings'), where('ownerId', '==', uid)))
  return snap.docs.map((d) => toWedding(d.id, d.data())).sort((a, b) => a.createdAt - b.createdAt)
}

// 'plus' or 'free'
export const fetchPlan = async (uid) => {
  requireDb()
  const snap = await getDoc(planRef(uid))
  return snap.data()?.plan === 'plus' ? 'plus' : 'free'
}

// Calls onChange with 'plus' or 'free' now and whenever it changes; returns unsubscribe
export const watchPlan = (uid, onChange, onError) => {
  requireDb()
  return onSnapshot(planRef(uid), (snap) => onChange(snap.data()?.plan === 'plus' ? 'plus' : 'free'), onError)
}

// Counts one image upload against the invitation's limit
export const recordUpload = (id) => {
  requireDb()
  return updateDoc(weddingRef(id), { uploads: increment(1) })
}

export const setLocked = (id, locked) => {
  requireDb()
  return updateDoc(weddingRef(id), { locked })
}

// Creates a wedding from the given config and returns its id
export const createWedding = async (uid, config) => {
  requireDb()
  const id = doc(collection(db, 'weddings')).id
  await saveWedding(id, uid, config)
  return id
}

export const deleteWedding = (id) => {
  requireDb()
  return deleteDoc(weddingRef(id))
}

// Looks up a shared wedding by its code. Returns { id, ownerId, config, code } or null.
export const fetchWeddingByCode = async (code) => {
  requireDb()
  const reserved = await getDoc(codeRef(code))
  if (!reserved.exists()) return null
  const { weddingId, uid } = reserved.data()
  const wedding = await fetchWedding(weddingId ?? uid)
  return wedding?.config ? wedding : null
}

// Counts this browser as a visitor of the wedding, once ever.
// Guests aren't signed in, so "unique" means once per browser.
export const recordVisit = async (id) => {
  requireDb()
  const key = `visited:${id}`
  try {
    if (localStorage.getItem(key)) return
  } catch {
    return // storage blocked: can't tell repeat visits apart, so don't count
  }
  await setDoc(viewsRef(id), { count: increment(1) }, { merge: true })
  try { localStorage.setItem(key, '1') } catch { /* counted; may count again */ }
}

export const fetchViewCount = async (id) => {
  requireDb()
  return (await getDoc(viewsRef(id))).data()?.count ?? 0
}

// Unique visitor counts for the given weddings, as { [id]: count }
export const fetchViewCounts = async (ids) => {
  requireDb()
  const snaps = await Promise.all(ids.map((id) => getDoc(viewsRef(id))))
  return Object.fromEntries(snaps.map((snap, i) => [ids[i], snap.data()?.count ?? 0]))
}

// Saves the config; on the first save also reserves a unique code.
// Returns the wedding's code.
export const saveWedding = (id, uid, config) => {
  requireDb()
  return runTransaction(db, async (tx) => {
    const existing = await tx.get(weddingRef(id))
    let code = existing.exists() ? existing.data().code : null

    if (!code) {
      for (let attempt = 0; attempt < 5 && !code; attempt++) {
        const candidate = generateCode()
        if (!(await tx.get(codeRef(candidate))).exists()) code = candidate
      }
      if (!code) throw new Error('Could not generate a unique code, please try again')
      tx.set(codeRef(code), { uid, weddingId: id, createdAt: serverTimestamp() })
    }

    const fields = { ownerId: uid, code, config, updatedAt: serverTimestamp() }
    if (existing.exists()) {
      // Leave createdAt, uploads and locked as they are
      tx.set(weddingRef(id), fields, { mergeFields: Object.keys(fields) })
    } else {
      tx.set(weddingRef(id), { ...fields, createdAt: serverTimestamp(), uploads: 0, locked: false })
    }
    return code
  })
}
