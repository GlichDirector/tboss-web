# Tboss Photography website

The public website, client galleries and studio admin for Tboss Photography, Ibadan.

Built with Next.js. Hosted on Hostinger (Node.js web app), deployed from this GitHub repository.

## Build phases

1. **Public site** (done): Home, Work, Journal, Story pages, About, Contact form, gallery sign-in page, privacy page, sitemap and Google structured data.
2. **Client galleries** (done): Google sign-in, uploads to Cloudflare R2 with duplicate replace/skip, Unedited / Edited folders, cover photo, client selection with package limit, logged downloads, studio admin at /admin.
3. **Studio admin** (done): dashboard with to-dos, clients (type-in import, returning clients), website enquiries, orders with invoice (versions, resend), manual payments with receipts, session booking with client Confirm page, day-before reminders, calendar, orders board, payments list, settings (packages, bank details).
4. Page editor, email builder, AI Journal drafts from Instagram, team invites.

## Where to change things

- Studio details (phone, email, address, reply time): `lib/site.ts`
- Photos, services, FAQs, Journal stories: `lib/content.ts` (moves into the admin in Phase 3)
- Colours and spacing: `app/globals.css`

## Hostinger settings

- Framework: Next.js · Build command: `npm run build` · Start command: `npm start`
- Node.js: 20 or newer
- Environment variables: see `.env.example`. Add them in Hostinger, never in GitHub.

Without `RESEND_API_KEY` the contact form still works and records enquiries in the app log instead of emailing them.

## Phase 2 notes

- Studio admin: `/admin`. Only Google accounts listed in `ADMIN_EMAILS` can sign in.
- Database tables are created automatically on first use. Nothing to run by hand.
- Cloudflare R2 needs a CORS rule so browsers can upload: allowed origin = the site address, methods PUT and GET, header Content-Type.
- Local testing: `STORAGE_DRIVER=local` keeps photos on disk, and `DEV_LOGIN=1` allows test sign-in, but only when `SITE_URL` is a localhost address.

## Phase 3 notes

- Daily reminders: in hPanel → Advanced → Cron Jobs, run once a day (e.g. 9:00):
  `curl -s "https://tbossphotography.com/api/cron/daily?key=YOUR_CRON_SECRET"`
- Client pages: `/invoice/[token]` (invoice with bank details, print to PDF) and `/confirm/[token]` (confirm or request a change).
