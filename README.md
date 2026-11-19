# NACOS MOUAU Digital Association Platform

React, TypeScript and Vite frontend with Cloudflare Pages Functions and D1 foundations. R2 will be bound when file uploads are implemented.

## Cloudflare Pages setup

This project uses `wrangler.toml` as the Pages Functions configuration source of truth. Resource bindings must be declared there; the dashboard binding controls may be disabled while Wrangler configuration is enabled.

1. Create the D1 database if it does not exist: `npx wrangler d1 create nacos-mouau`.
2. Put the returned database UUID in `wrangler.toml` under the `DB` binding. The current repository is configured with the supplied database ID.
3. Apply migrations after authenticating Wrangler: `npx wrangler login`, then `npx wrangler d1 migrations apply nacos-mouau --remote`.
4. When uploads are implemented, create the R2 bucket with `npx wrangler r2 bucket create nacos-mouau-media`, add an `[[r2_buckets]]` binding named `MEDIA` to `wrangler.toml`, and deploy again.
5. Add production secrets only through Cloudflare secret bindings. Never put secrets in Vite variables.

## Local development

- `npm install`
- `npm run dev` for the frontend.
- `npm run build` for the production frontend build.
- `npm run cf:dev` to run Pages Functions locally after configuring local D1/R2 bindings in Wrangler.

## Current scope

The initial milestone provides the public visual foundation, database schema for users/sessions/audit/settings, and server-side registration, login, logout and session lookup. New registrations remain pending until an administrator approval flow is implemented. Remaining association modules and CMS authoring are tracked in `AGENTS.md`.
