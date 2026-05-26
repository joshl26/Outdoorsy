# Outdoorsy Deployment Notes

## Immediate To-Do

- Confirm the production `DB_URL` for Outdoorsy.
  - Repo fallback is local Mongo: `mongodb://localhost:27017/outdoorsy`
  - Repo also contains an Atlas URI in `scripts/add-slugs.js`, but confirm whether production should use that or the VPS-hosted database.

- Add missing Render environment variables:
  - `DB_URL`
  - `SESSION_SECRET`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_KEY`
  - `CLOUDINARY_SECRET`
  - `MAPBOX_TOKEN`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

- Manual Render setup:
  - Service type: `Web Service`
  - Build command: `npm ci`
  - Start command: `npm start`
  - Health check path: `/healthz`
  - Required now: `NODE_ENV=production`
  - Required now: `SITE_ROOT_URL=https://outdoorsy.joshlehman.ca`

- Cloudflare DNS setup:
  - Add `CNAME` record for `outdoorsy` -> Render hostname
  - Keep it `DNS only` until Render verifies the domain and issues TLS
  - After verification, optionally switch to `Proxied`

## Current Behavior Without Secrets

- App can boot on Render without the optional third-party env vars.
- Home page shows setup-status cards for missing integrations.
- Campground pages fall back to placeholder/empty states until the database is connected.
