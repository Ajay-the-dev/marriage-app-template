## Features

Everything the app does today, grouped by area. The **Tier** column is left
blank for planning which features stay free and which need Plus.

## Account

| Feature | Details | Tier |
|---|---|---|
| Email sign-up | Name, email, password + confirm; sends a verification email | FREE|
| Email sign-in | |FREE |
| Google sign-in | One-click OAuth popup | FREE|
| Password reset | "Forgot?" sends a reset email | FREE|
| Sign out | From the invitations list and the editor |FREE |

## My invitations (`/settings`)

| Feature | Details | Tier |
|---|---|---|
| Multiple invitations per account | No limit today | FREE:1,PAID:5|
| Create invitation | Starts from the default template | FREE|
| Delete invitation | Guest link stops working; the code stays reserved |FREE |
| Unique visitor count | Per invitation, once per browser; owner's own previews excluded | FREE:500,PAID:UNLIMITED|
| Copy guest link | | FREE|
| Open guest view | | FREE|

## Sharing

| Feature | Details | Tier |
|---|---|---|
| Guest link | `/<12-character code>`, assigned on first save, never changes | FREE|
| Guest view of every page | Home, Events, Couple, Moments, Story under the code | FREE|

## Editor (`/settings/:id`)

### General

| Feature | Details | Tier |
|---|---|---|
| Save | Saves to the cloud | FREE|
| Discard changes | Back to the last saved version | FREE|
| Import JSON | Load a whole invitation from a file | FREE|
| Export JSON | Download the invitation as a file | FREE|
| Unsaved-changes warnings | On leaving, closing the tab and signing out | FREE|
| Section jump bar | Quick links to each section | FREE|
| Live preview | The invitation site beside the editor on wide screens (1200px+), or slid over it from the Preview button on tablets; updates as you type, before saving. Follows the section being edited; page tabs and phone/desktop size switch | |
| Sample content in preview | Empty fields show the template's dummy text, photos, events and so on, under a "Sample" watermark and badge; never saved or shown to guests | |

### Site

| Feature | Details | Tier |
|---|---|---|
| Browser tab title | | FREE|
| Monogram | Shown in the nav bar and mobile centre button; falls back to the couple's initials (eg. G&B) when empty | FREE|

### Theme

| Feature | Details | Tier |
|---|---|---|
| Theme picker | 16 themes (colours + fonts), with live preview cards | FREE|

### Groom & bride

| Feature | Details | Tier |
|---|---|---|
| Full name, short name, role label | Role label defaults to "The Groom" / "The Bride" | FREE|
| Father's and mother's names | Used to build the parents line; not shown to guests | |
| Parents line | Suggestions from the parents' names ("Son of Mr. … & Mrs. …", "S/o …" and more), or write your own; a picked suggestion follows name changes | FREE|
| Profession / passion | Suggests from ~70 jobs while typing, or anything custom | |
| Interests | Pills: type and press Enter, or tap suggested interests; up to 8 | |
| Bio | Suggestions written from the name, profession and interests, or write your own | FREE|
| Photo upload | Compressed to WebP and uploaded to Cloudinary; or paste a path | FREE:25 updates,PAID: 100 updates|
| Remove photo | Clears the photo (the upload still counts towards the plan) | |
| Social links | Instagram, Facebook, WhatsApp | FREE|

### Home page

| Feature | Details | Tier |
|---|---|---|
| Invite line, date, time, location text | | FREE|
| Background image upload | Or paste a path | FREE|
| Remove background | Clears an uploaded background (the upload still counts towards the plan) | |
| Countdown timer | On/off, target date-time, custom unit labels | FREE|

### Navigation

| Feature | Details | Tier |
|---|---|---|
| Per-page labels | Separate desktop and mobile labels | FREE:No edit,paid:edit|
| Per-page icons | Picker with ~60 icons | FREE:No edit,paid:edit|

### Page content

| Feature | Details | Tier |
|---|---|---|
| Couple page titles | | FREE|
| Events | Unlimited events: name, day, month, time, venue, location, map URL; reorder/remove | FREE:3,PAID : 10|
| Events map button | Custom label; falls back to a map search of venue + location | FREE|
| Story | Unlimited milestones: name, day, month, year, note; reorder/remove | FREE:10,PAID:25|
| Moments gallery | Unlimited images; multi-file upload or paths; reorder/remove | FREE:4,PAID:25|

### Save the date popup

| Feature | Details | Tier |
|---|---|---|
| Popup on open | On/off | FREE|
| Expiry | Hide after a date-time, or never | FREE|
| Slide interval | Seconds between images | FREE|
| Images | Multi-file upload or paths; reorder/remove | FREE:2,PAID:5|

## Printed invitation (`/traditional`)

Opened from the invitations list (PDF button / "Printed invitation" on mobile) or the editor's
"Print card" button (PDF icon in the mobile editor), as `/traditional?id=<invitation>`
(`&card=<card>` opens a saved card). Phones get `/traditional/mobile` like the other editors.

| Feature | Details | Tier |
|---|---|---|
| Traditional card layout | Starts from the invitation's names, parents lines and events | |
| Wording versions | 16 pills at the top of the editor's toolbar (Classic, Traditional Hindu, Festive, Minimal, Romantic, Elegant, Old-world, Black-tie, Garden, Dreamy, Coastal, Cheerful, Rustic, Relaxed, Glam, Starlit) switch the card's text. Each version keeps its own edits (marked with a dot) and all are saved with the card; the PDF uses the version shown. New cards start on the version that suits the invitation's theme | |
| Text editor | Edit directly on the card: Names / Heading / Label / Text / Small styles, font picker (theme fonts, script, classic, modern and Malayalam / Tamil / Hindi / Telugu / Kannada fonts; applies to the selection or the current line), bold, italic, underline, alignment, theme colours, ornament divider, undo/redo; pasted text comes in plain | |
| Paper sizes | A5, 5 × 7 in, A4, Square | |
| Borders | Temple (double frame with corner flourishes), double rule, minimal, none | |
| Motifs | Lotus, mandala or none above the text | |
| Colours & fonts | Any of the site themes, independent of the online invitation's theme | |
| Fit warning | Shown when the text runs past the border | |
| Download PDF | Print-ready at 300 dpi, at the chosen paper size | |
| Phone editor | Version chips under the top bar, the card fitted to the screen; while typing, a formatting bar sits above the keyboard (style, font and colour open as chip rows); otherwise Design / Save / PDF along the bottom, with design (paper, border, motif, colours) and saved cards in bottom sheets | |
| Saved cards | Saved with the invitation (as HTML, owner-only) and listed to reopen, rename or delete; several per invitation (eg. one per language), "Save as copy", Ctrl+S, unsaved-changes warnings; not while the invitation is locked by the plan | |
| Reset text | Starts the version shown again from the invitation's details | |

## Guest-facing site

| Feature | Details | Tier |
|---|---|---|
| Home | Names, date/time/location, countdown, animated background | FREE|
| Events | Event cards with map links | FREE|
| Couple | Photos, profession, parents, bios, interest pills, social links | FREE|
| Story | Milestone timeline | FREE|
| Moments | Photo gallery with lightbox | FREE|
| Save the date | Image slider popup on first open | FREE|
| Navigation | Desktop top bar; mobile floating menu with monogram button | FREE|
| Theme applied | Colours and fonts from the chosen theme | FREE|
| "Crafted by bytespeaks" badge | WhatsApp contact link; candidate for removal in Plus | FREE:SHOW,PAID:HIDE|

