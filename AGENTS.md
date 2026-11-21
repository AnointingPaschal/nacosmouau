# NACOS MOUAU Platform Implementation Plan

## Phases
1. Foundation: Vite + React + TypeScript, design tokens, Cloudflare Pages Functions, additive D1 schema, D1-backed cookie sessions and role/permission seeds. (Frontend foundation exists; review runtime secrets and deployment bindings.)
2. Public site and CMS: editable pages, navigation, R2 media, news, events, documents, hero slides and site settings. (Core CMS APIs and file flow exist; remaining content workflows continue in this phase.)
3. Membership: registration, approval, profiles, member IDs, verification, QR cards and renewals.
4. Payments and finance: verified Paystack flows, invoices, receipts, dues, levies, expenses, approvals and reports.
5. Elections and executives: administration, nominations, secret ballots, eligibility, results, tenure and handover records.
6. Events and communications: registration, ticketing, attendance, announcements, notifications and galleries.
7. Welfare and extended modules: requests, alumni, sponsors, merchandise and archives.
8. Hardening: complete module coverage, rate limiting, Turnstile/email provider integrations, permission review, audit trails, accessibility, operational configuration, end-to-end verification and deployment.

## Architecture rules
- React/TypeScript/Vite frontend; Cloudflare Pages Functions APIs; D1 as the system of record; R2 for uploads.
- All stateful and sensitive operations belong in validated server endpoints. Secrets live only in Cloudflare bindings.
- Database changes are additive SQL migrations. Never seed fabricated association statistics or transaction records.
- Public-facing site content is persisted in the CMS and editable by authorized administrators.
- Protect ballots by separating voter participation from encrypted/opaque ballot selections.

- Media storage: public images are committed to GitHub (`media/uploads/...`) via `functions/api/_storage.ts` and served by `/api/files/*`; private files (profile photos, documents) stay in R2. Needs the `GITHUB_TOKEN` Pages secret.

## Standing instructions from the owner
- After every change that touches project code, commit and push to `main`.
- Always apply new D1 migrations to the remote `nacos-mouau` database (`wrangler d1 migrations apply nacos-mouau --remote`, credentials from `.env`). List pending migrations first and report what was applied.
- Course catalogue: seeded by `migrations/0014_academic_records.sql`; managed in Admin → Course catalogue.
- Course reps: elected per level and session (tables in `0015_class_representatives.sql`). Admins only approve contestants and start voting; voting ends at its set time and winners get the Course Rep / Assistant badge automatically. Never add a manual "assign rep" path.
- Lecture attendance (`0016_lecture_attendance.sql`): rep/assistant opens a session (course from the weekly timetable, date automatic, Africa/Lagos). Rules (window max 30 min, flag distance) are set in Admin → Lecture attendance. Browsers cannot read MAC addresses, so there is no live code and location is only a soft flag; the device check uses a stored device ID, a device cookie, a fingerprint and the IP; one phone can mark one student, and the rep can sign for students without smartphones.
