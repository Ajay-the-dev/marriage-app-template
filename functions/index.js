import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret, defineString } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

initializeApp()
const db = getFirestore()

// Ko-fi → Settings → API → Webhooks → "Verification Token"
const KOFI_TOKEN = defineSecret('KOFI_VERIFICATION_TOKEN')
// Smallest donation that unlocks Plus (in whatever currency the donor pays)
const MIN_AMOUNT = defineString('KOFI_MIN_AMOUNT', { default: '0' })

// Users paste "PLUS-<uid>" into their Ko-fi message (shown in the upgrade dialog)
const CODE_PATTERN = /PLUS-([A-Za-z0-9]{20,128})/

// Finds the app account a donation is for: the code in the message first,
// then the donor's Ko-fi email.
const findUser = async ({ message, email }) => {
  const uid = message?.match(CODE_PATTERN)?.[1]
  if (uid) {
    try {
      return await getAuth().getUser(uid)
    } catch {
      logger.warn('Ko-fi code does not match an account', { uid })
    }
  }
  if (email) {
    try {
      return await getAuth().getUserByEmail(email)
    } catch {
      logger.warn('Ko-fi email does not match an account', { email })
    }
  }
  return null
}

// Ko-fi webhook: every donation is logged in payments/{transactionId};
// a qualifying one marks the matching account Plus in plans/{uid}.
export const kofiWebhook = onRequest({ secrets: [KOFI_TOKEN] }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed')
    return
  }

  let data
  try {
    data = JSON.parse(req.body?.data ?? '')
  } catch {
    res.status(400).send('Bad payload')
    return
  }
  if (data.verification_token !== KOFI_TOKEN.value()) {
    logger.warn('Ko-fi webhook with a wrong verification token')
    res.status(401).send('Unauthorized')
    return
  }

  const paymentId = data.kofi_transaction_id || data.message_id
  const paymentRef = db.collection('payments').doc(paymentId)
  // Ko-fi retries on failure; only handle each payment once
  if ((await paymentRef.get()).exists) {
    res.status(200).send('Already processed')
    return
  }

  const amount = Number(data.amount)
  const user = await findUser(data)
  const qualifies = data.type === 'Donation' && amount >= Number(MIN_AMOUNT.value())

  if (user && qualifies) {
    await db.collection('plans').doc(user.uid).set({
      plan: 'plus',
      since: FieldValue.serverTimestamp(),
      source: 'kofi',
    }, { merge: true })
    logger.info('Plus activated', { uid: user.uid, paymentId })
  } else {
    logger.warn('Ko-fi payment not applied', { paymentId, matched: !!user, qualifies })
  }

  await paymentRef.set({
    uid: user?.uid ?? null,
    applied: !!(user && qualifies),
    type: data.type,
    amount: data.amount,
    currency: data.currency,
    email: data.email ?? null,
    fromName: data.from_name ?? null,
    message: data.message ?? null,
    kofiTimestamp: data.timestamp ?? null,
    receivedAt: FieldValue.serverTimestamp(),
  })

  res.status(200).send('OK')
})
