import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, increment, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '@/services/firebase'

// weddings/{id}  = { ownerId, code, config, createdAt, updatedAt, uploads, locked, editLocked, hidden, agreement }
//                  (an account can own many; uploads counts images uploaded to it;
//                   locked = over the account's invitation limit;
//                   editLocked = locked by the owner so it can't be edited by mistake;
//                   hidden = hidden from guests by the owner (only the owner can read it);
//                   agreement = { version, name, signedAt }, signed when it was created)
// codes/{code}   = { uid, weddingId, createdAt }   (reserves the code so it stays unique)
// views/{id}     = { count }                       (unique guest visitors)
// weddings/{id}/versions/{versionId} = { config, savedAt }
//                  (Plus: the config as it was before each save, newest few kept)
// weddings/{id}/cards/{cardId} = { name, html, version, versions, paper, border, motif, motifSize, theme, createdAt, updatedAt }
//                  (printed invitation cards, kept as HTML; only the owner can read them.
//                   versions = { [versionId]: html } for each edited wording version, html = the one shown)
// plans/{uid}    = { plan: 'plus', since, source } (set by the Ko-fi webhook or by hand; missing means Free)
// Weddings saved before multi-wedding support use the owner's uid as their id,
// and their codes have no weddingId.
const weddingRef = (id) => doc(db, 'weddings', id)
const codeRef = (code) => doc(db, 'codes', code)
const viewsRef = (id) => doc(db, 'views', id)
const planRef = (uid) => doc(db, 'plans', uid)
const versionsRef = (id) => collection(db, 'weddings', id, 'versions')
const cardsRef = (id) => collection(db, 'weddings', id, 'cards')

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
  editLocked: !!data.editLocked,
  hidden: !!data.hidden,
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

// The owner's own lock: the invitation stays live for guests but can't be edited
export const setEditLocked = (id, editLocked) => {
  requireDb()
  return updateDoc(weddingRef(id), { editLocked })
}

// Replaces the printed invitation guests see on the home page (config.hero.printCard); null removes it
export const setPrintCard = (id, printCard) => {
  requireDb()
  return updateDoc(weddingRef(id), { 'config.hero.printCard': printCard ?? deleteField(), updatedAt: serverTimestamp() })
}

// Hidden invitations show guests a "hidden" page instead of the invitation
export const setHidden = (id, hidden) => {
  requireDb()
  return updateDoc(weddingRef(id), { hidden })
}

// Creates a wedding from the given config and returns its id.
// agreement = { version, name } the owner signed for this wedding.
export const createWedding = async (uid, config, agreement) => {
  requireDb()
  if (!agreement?.version || !agreement?.name) throw new Error('Please sign the agreement first')
  const id = doc(collection(db, 'weddings')).id
  await saveWedding(id, uid, config, agreement)
  return id
}

export const deleteWedding = async (id) => {
  requireDb()
  // Versions and cards first: the rules check ownership through the wedding itself
  const [versions, cards] = await Promise.all([getDocs(versionsRef(id)), getDocs(cardsRef(id))])
  await Promise.all([...versions.docs, ...cards.docs].map((d) => deleteDoc(d.ref)))
  await deleteDoc(weddingRef(id))
}

// Earlier saved versions of a wedding, newest first: [{ id, config, savedAt }]
export const listVersions = async (id) => {
  requireDb()
  const snap = await getDocs(query(versionsRef(id), orderBy('savedAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, config: d.data().config, savedAt: d.data().savedAt?.toDate() ?? null }))
}

// Deletes all but the newest `keep` versions
const pruneVersions = async (id, keep) => {
  const versions = await listVersions(id)
  await Promise.all(versions.slice(keep).map((v) => deleteDoc(doc(versionsRef(id), v.id))))
}

// Printed invitation cards of a wedding, last saved first
export const listCards = async (weddingId) => {
  requireDb()
  const snap = await getDocs(query(cardsRef(weddingId), orderBy('updatedAt', 'desc')))
  return snap.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: d.data().createdAt?.toDate() ?? null, updatedAt: d.data().updatedAt?.toDate() ?? null }))
}

const CARD_FIELDS = ['name', 'html', 'version', 'paper', 'border', 'motif', 'motifSize', 'theme']

// New cards take the first free id of these; the plan allows the first `cards` of them
// (Firestore rules can't count documents, so the ids are the limit). Keep in sync with firestore.rules
export const CARD_SLOTS = ['c1', 'c2', 'c3', 'c4', 'c5']

// Saves a card and returns its id: updates cardId, else creates newId (a free slot)
export const saveCard = async (weddingId, cardId, card, newId) => {
  requireDb()
  const fields = Object.fromEntries(CARD_FIELDS.map((key) => [key, String(card[key] ?? '')]))
  fields.versions = Object.fromEntries(Object.entries(card.versions || {}).map(([id, html]) => [id, String(html)]))
  if (cardId) {
    await updateDoc(doc(cardsRef(weddingId), cardId), { ...fields, updatedAt: serverTimestamp() })
    return cardId
  }
  const ref = doc(cardsRef(weddingId), newId)
  await setDoc(ref, { ...fields, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return ref.id
}

export const deleteCard = (weddingId, cardId) => {
  requireDb()
  return deleteDoc(doc(cardsRef(weddingId), cardId))
}

// Looks up a shared wedding by its code. Returns { id, ownerId, config, code },
// { hidden: true } when its owner has hidden it from guests, or null.
export const fetchWeddingByCode = async (code) => {
  requireDb()
  const reserved = await getDoc(codeRef(code))
  if (!reserved.exists()) return null
  const { weddingId, uid } = reserved.data()
  let wedding
  try {
    wedding = await fetchWedding(weddingId ?? uid)
  } catch (error) {
    // The rules only refuse to show a wedding to guests when it's hidden
    if (error.code === 'permission-denied') return { hidden: true }
    throw error
  }
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

// Saves the config; on the first save also reserves a unique code and
// records the signed agreement. With keepVersions > 0 (Plus), the config being
// replaced is kept as a version, up to that many. Returns the wedding's code.
export const saveWedding = async (id, uid, config, agreement = null, { keepVersions = 0 } = {}) => {
  requireDb()
  const code = await runTransaction(db, async (tx) => {
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
      const previous = existing.data()
      if (keepVersions > 0 && previous.config) {
        tx.set(doc(versionsRef(id)), { config: previous.config, savedAt: previous.updatedAt ?? serverTimestamp() })
      }
      // Leave createdAt, uploads, locked, editLocked, hidden and agreement as they are
      tx.set(weddingRef(id), fields, { mergeFields: Object.keys(fields) })
    } else {
      if (!agreement) throw new Error('Please sign the agreement first')
      tx.set(weddingRef(id), {
        ...fields,
        createdAt: serverTimestamp(),
        uploads: 0,
        locked: false,
        agreement: { version: agreement.version, name: agreement.name, signedAt: serverTimestamp() },
      })
    }
    return code
  })
  // Trimming is housekeeping; the save already succeeded
  if (keepVersions > 0) {
    await pruneVersions(id, keepVersions).catch((error) => console.warn('Could not trim old versions:', error))
  }
  return code
}
