// The agreement every user signs before creating an invitation.
// Bump AGREEMENT_VERSION whenever the terms change, and keep it in sync with
// firestore.rules (validAgreement), which rejects invitations signed on any other version.
export const AGREEMENT_VERSION = '2026-10-15.2'

// The full text, shown in the dialog
export const AGREEMENT_SECTIONS = [
  {
    title: 'Your invitation is shared by link',
    body: 'Anyone who has your guest link can open your invitation without signing in. Only share it with people you trust, and do not post it publicly if you want it to stay private. Links cannot be changed once created; delete the invitation to stop it working.',
  },
  {
    title: 'Consent of the people shown',
    body: 'You will add names, photos, dates, venues and stories about real people. You confirm that everyone named or pictured (including the couple, family members and children) has agreed to appear, and that a parent or guardian has agreed for any child.',
  },
  {
    title: 'Content you upload',
    body: 'You own, or have permission to use, every photo and piece of text you add. You will not upload anything unlawful, hateful, sexually explicit, or that impersonates someone else or misleads guests. We may remove content and disable invitations that break these rules.',
  },
  {
    title: 'Sensitive details',
    body: 'Avoid adding information you would not want strangers to see, such as home addresses, phone numbers, ID documents or travel plans for an empty house. You are responsible for what you choose to publish.',
  },
  {
    title: 'What we store and count',
    body: 'Your invitation, its photos and your account email are stored with our hosting providers (Firebase and Cloudinary). We count unique visitors to each guest link, using the visitor’s browser storage, to apply plan limits.',
  },
  {
    title: 'Research and partners',
    body: 'Data from your invitation and account, including names, photos, event details and visitor statistics, may be used for research purposes and may be shared with our partners.',
  },
  {
    title: 'Deleting your data',
    body: 'You can delete an invitation at any time from “My invitations”; its guest link stops working immediately. Uploaded images may take a short time to be removed from our image host.',
  },
]

// Each must be ticked before signing
export const AGREEMENT_CONSENTS = [
  'Everyone named or pictured in this invitation has agreed to be included.',
  'I own or have permission to use every photo and text I add.',
  'I understand anyone with the guest link can view this invitation.',
  'I agree that my data may be used for research and shared with partners.',
  'I have read and agree to the terms above.',
]
