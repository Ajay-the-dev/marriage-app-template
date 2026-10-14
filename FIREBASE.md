# Firebase

How this app uses Firebase, and how to set it up, deploy, and maintain it.

- **Project:** `ajay-the-dev-hobbies`
- **Services:** Authentication, Cloud Firestore, Cloud Functions (2nd gen)
- **Billing:** Cloud Functions and Secret Manager need the **Blaze** (pay-as-you-go) plan

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 22 (matches `functions/package.json`) | `nvm install 22 && nvm alias default 22` |
| Firebase CLI | latest | `npm install -g firebase-tools` |

```bash
firebase login
firebase use ajay-the-dev-hobbies   # writes .firebaserc
```

## Web app config

The frontend reads its Firebase config from `.env` / `.env.local`; see [.env.example](.env.example).
Values come from Firebase console → Project settings → General → Your apps → Web app.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

These values are public by design. Access is controlled by Auth and [firestore.rules](firestore.rules).
If they are missing, [src/services/firebase.js](src/services/firebase.js) leaves Firebase unset and the public site still renders.

## Authentication

Enabled in console → Authentication → Sign-in method:

- Email / password
- Google

To add another provider (GitHub, Facebook, …), enable it in the console and register it in [src/stores/auth.js](src/stores/auth.js).

## Firestore

### Collections

| Collection | Doc ID | Contents | Written by |
|---|---|---|---|
| `weddings` | auto ID (older docs: owner's uid) | `ownerId`, `code`, `config`, `uploads`, `locked`, `createdAt`, `updatedAt` | Owner (client) |
| `codes` | 12-char code `[A-Z0-9]` | `uid`, `weddingId`, `createdAt`. Reserves a share code for one wedding, forever | Owner (client) |
| `plans` | user uid | `plan: 'plus'`, `since`, `source`. Missing doc = Free | `kofiWebhook` function, or by hand in the console |
| `views` | wedding ID | `count`, unique guest visitors | Guests (client, +1 at a time) |
| `payments` | Ko-fi transaction ID | Log of every Ko-fi payment and whether it was applied | `kofiWebhook` function only |

### Security rules

Rules live in [firestore.rules](firestore.rules). Key points:

- Anyone can `get` a single wedding, code, plan, or view count, so guest links work without sign-in.
- Owners can only list, update, or delete their own weddings.
- Wedding content must fit the owner's plan limits, which are read from `plans/{uid}`.
- `payments` has no client rules, so only the Admin SDK (Cloud Functions) can read or write it.

Plan limits are defined in **two places that must stay in sync**:
`planLimits()` in [firestore.rules](firestore.rules) and [src/config/plans.js](src/config/plans.js).

| Limit | Free | Plus |
|---|---|---|
| Photo uploads | 25 | 100 |
| Events | 3 | 10 |
| Story milestones | 10 | 25 |
| Gallery images | 4 | 25 |
| Save-the-date images | 2 | 5 |

## Cloud Functions

Source: [functions/index.js](functions/index.js) (ES modules, Node 22, `firebase-functions` v7).

### `kofiWebhook` (HTTPS)

Receives Ko-fi payment webhooks and upgrades the payer to Plus.

1. Rejects anything other than `POST`, and any request whose `verification_token` is wrong.
2. Skips payments already in `payments/{transactionId}`, because Ko-fi retries.
3. Finds the user from the `PLUS-<uid>` code in the Ko-fi message, or else from the donor's email.
4. If the payment is a `Donation` of at least `KOFI_MIN_AMOUNT`, sets `plans/{uid}` to `{ plan: 'plus' }`.
5. Logs the payment in `payments/{transactionId}` either way.

The app listens to `plans/{uid}` live ([src/composables/plan.js](src/composables/plan.js)), so Plus unlocks without a reload.

### Configuration

| Name | Kind | Set with |
|---|---|---|
| `KOFI_VERIFICATION_TOKEN` | Secret | `firebase functions:secrets:set KOFI_VERIFICATION_TOKEN` (from Ko-fi → Settings → API → Webhooks) |
| `KOFI_MIN_AMOUNT` | Param (default `0`) | Prompted on first deploy; stored in `functions/.env.<project-id>` |

Keep `KOFI_MIN_AMOUNT` in line with `VITE_PLUS_PRICE` in `.env`.

## Deploy

```bash
cd functions && npm install && cd ..

firebase deploy --only firestore:rules          # rules only
firebase deploy --only functions                # functions only
firebase deploy --only functions,firestore:rules
```

After the first functions deploy:

1. Copy the `kofiWebhook` URL from the deploy output (or `firebase functions:list`).
2. Paste it into Ko-fi → Settings → API → **Webhook URL**.
3. Click **Send test** and check that a doc appears in `payments`.

## Common tasks

**Check what's deployed**
```bash
firebase functions:list
```

**Read function logs**
```bash
firebase functions:log --only kofiWebhook
```

**Grant or revoke Plus by hand** (offline payment, refund, testing)
In console → Firestore → `plans`, create or edit the doc with ID = the user's uid:
`{ plan: "plus" }` to grant; delete the doc to revoke.

**Run locally with emulators**
```bash
firebase emulators:start --only functions,firestore
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `firebase: command not found` | `npm install -g firebase-tools`, then open a new terminal |
| `No currently active project` | `firebase use ajay-the-dev-hobbies`, or add `--project ajay-the-dev-hobbies` |
| Deploy fails with a billing error | Upgrade the project to the Blaze plan |
| Ko-fi payment didn't unlock Plus | Check the `payments` doc: `uid: null` means no user matched (missing `PLUS-` code and unknown email); `applied: false` with a uid means wrong type or amount below `KOFI_MIN_AMOUNT` |
| Owner edits rejected after a limit change | Update both `firestore.rules` and `src/config/plans.js`, then redeploy rules |
