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
