# NACOS MOUAU Digital Association Platform

NACOS MOUAU Digital Association Platform for the 2025/2026 academic session. React, TypeScript, Vite and Tailwind frontend with Cloudflare Pages Functions and D1 persistence.

## Cloudflare Pages setup

This project uses `wrangler.toml` as the Pages Functions configuration source of truth. Resource bindings must be declared there; the dashboard binding controls may be disabled while Wrangler configuration is enabled.

1. Create the D1 database if it does not exist: `npx wrangler d1 create nacos-mouau`.
2. Put the returned database UUID in `wrangler.toml` under the `DB` binding. The current repository is configured with the supplied database ID.
3. Apply migrations after authenticating Wrangler: `npx wrangler login`, then `npx wrangler d1 migrations apply nacos-mouau --remote`.
4. Configure the initial administrator secret in Cloudflare Pages → Settings → Variables and Secrets. Add `SETUP_TOKEN` as a secret for production and redeploy. Use a long random value; never put it in this repository. The `/setup` flow is available only while the D1 database has no users.
5. Apply new migrations before using features that depend on them: `npx wrangler d1 migrations apply nacos-mouau --remote`.
6. When uploads are implemented, create the R2 bucket with `npx wrangler r2 bucket create nacos-mouau-media`, add an `[[r2_buckets]]` binding named `MEDIA` to `wrangler.toml`, and deploy again.
5. Add production secrets only through Cloudflare secret bindings. Never put secrets in Vite variables.

## Manual initial administrator recovery

If Wrangler cannot be installed, `python3 scripts/generate_admin_sql.py` can generate SQL for the first super administrator. Run it locally in Termux; the password is entered without echo and only the PBKDF2 hash is printed. Paste the generated statements into the authenticated Cloudflare D1 Console for the database bound to production. This is for an empty `users` table only; then verify the row and sign in at `/login?role=admin`. Never share or commit the generated SQL.

Passwords use PBKDF2-HMAC-SHA256 with 100,000 iterations because Cloudflare Workers rejects higher PBKDF2 iteration counts. To reset a manually-created administrator hash, run `python3 scripts/generate_password_reset_sql.py` in Termux and paste its one `UPDATE` statement into the production D1 Console. Use the same new password at sign-in. This reset utility updates an existing account by email and does not print the password itself; treat its generated SQL as sensitive.

## Local development

- `npm install`
- `npm run dev` for the frontend.
- `npm run build` for the production frontend build.
- `npm run cf:dev` to run Pages Functions locally after configuring local D1/R2 bindings in Wrangler.

## Frontend architecture

- Public routes: home, national and chapter about pages, executives, news, events, achievements, gallery, documents and contact. Content is loaded through TanStack Query hooks with empty states when API records are not available.
- Member and administrator shells expose the association modules through responsive, role-gated routes.
- `src/lib/api.ts` centralizes cookie credentials, CSRF headers, JSON errors and optional 404/503 fallbacks.
- Forms use React Hook Form and Zod validation; notifications use Sonner.
- Theme preference persists in browser storage.
- The initial schema supports users, sessions, audits and site settings. Member registration records academic details through migration `0002_member_registration.sql`; migration `0003_super_admin_role.sql` enables the initial super-admin role. New registrations remain pending until an administrator approval flow is implemented.

Other domain APIs are typed in `src/types/` and the frontend is prepared to connect to those endpoints as they are implemented. See `AGENTS.md` for the remaining module plan.
