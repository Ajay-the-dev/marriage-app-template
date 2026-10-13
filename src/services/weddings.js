import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '@/services/firebase'

// weddings/{uid} = { ownerId, code, config, updatedAt }
// codes/{code}   = { uid, createdAt }   (reserves the code so it stays unique)
const weddingRef = (uid) => doc(db, 'weddings', uid)
const codeRef = (code) => doc(db, 'codes', code)

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

// Returns { config, code } (either may be null if the user hasn't saved yet)
export const fetchWedding = async (uid) => {
  requireDb()
  const snap = await getDoc(weddingRef(uid))
  const data = snap.exists() ? snap.data() : {}
  return { config: data.config ?? null, code: data.code ?? null }
}

// Looks up a shared wedding by its code. Returns { config, code } or null.
export const fetchWeddingByCode = async (code) => {
  requireDb()
  const reserved = await getDoc(codeRef(code))
  if (!reserved.exists()) return null
  const wedding = await fetchWedding(reserved.data().uid)
  return wedding.config ? wedding : null
}

// Saves the config; on the first save also reserves a unique code.
// Returns the user's code.
export const saveWedding = (uid, config) => {
  requireDb()
  return runTransaction(db, async (tx) => {
    const existing = await tx.get(weddingRef(uid))
    let code = existing.exists() ? existing.data().code : null

    if (!code) {
      for (let attempt = 0; attempt < 5 && !code; attempt++) {
        const candidate = generateCode()
        if (!(await tx.get(codeRef(candidate))).exists()) code = candidate
      }
      if (!code) throw new Error('Could not generate a unique code, please try again')
      tx.set(codeRef(code), { uid, createdAt: serverTimestamp() })
    }

    tx.set(weddingRef(uid), { ownerId: uid, code, config, updatedAt: serverTimestamp() })
    return code
  })
}
