# NACOS MOUAU Digital Association Platform

React, TypeScript and Vite frontend with Cloudflare Pages Functions, D1 and R2 foundations.

## Cloudflare Pages setup

1. Create a D1 database named `nacos-mouau` and bind it in Pages under **Settings → Functions → D1 database bindings** with variable name `DB`.
2. Apply migrations from this repository using Wrangler after linking your Cloudflare account:
   `npx wrangler d1 migrations apply nacos-mouau --remote`
3. R2 is not currently used by the Functions and is not bound in the deploy config. When file uploads are implemented, create the bucket with `npx wrangler r2 bucket create nacos-mouau-media`, add its `[[r2_buckets]]` binding named `MEDIA` to `wrangler.toml`, and deploy again. This project uses Wrangler configuration as the binding source of truth.
4. Add production secrets only through Cloudflare settings/secret bindings when their integrations are implemented. Never put secrets in Vite variables.

The Pages build can publish static assets and Functions without a D1 database UUID in source control. Authentication endpoints require the `DB` binding at runtime.

## Local development

- `npm install`
- `npm run dev` for the frontend.
- `npm run build` for the production frontend build.
- `npm run cf:dev` to run Pages Functions locally after configuring local D1/R2 bindings in Wrangler.

## Current scope

The initial milestone provides the public visual foundation, database schema for users/sessions/audit/settings, and server-side registration, login, logout and session lookup. New registrations remain pending until an administrator approval flow is implemented. Remaining association modules and CMS authoring are tracked in `AGENTS.md`.
