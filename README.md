# Tboss Photography website

The public website, client galleries and studio admin for Tboss Photography, Ibadan.

Built with Next.js. Hosted on Hostinger (Node.js web app), deployed from this GitHub repository.

## Build phases

1. **Public site** (this version): Home, Work, Journal, Story pages, About, Contact form, gallery sign-in page, privacy page, sitemap and Google structured data.
2. Client galleries: Google sign-in, uploads to Cloudflare R2, Unedited / Edited folders, selection, download tracking.
3. Studio admin: clients, orders, invoices, payments, bookings, calendar, automatic emails.
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
