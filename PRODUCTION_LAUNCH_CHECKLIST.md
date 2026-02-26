# Production Launch Checklist (Netlify) - JobAdvice

Created: February 26, 2026

Use this checklist in order. Do not skip steps.

## 1) Local Pre-Launch (must pass first)

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `.env.local` is not committed
- [ ] `NEXT_OUTPUT_EXPORT` is **not** set to `true` in production

## 2) Netlify Project Setup

- [ ] Netlify -> Add new site -> Import from GitHub
- [ ] Select repo: `hassanusmani21/Job-Portal`
- [ ] Branch: `main`
- [ ] Build command: `rm -rf .next out && npm run build`
- [ ] Publish settings: default Next.js runtime (no static export mode)

## 3) Environment Variables (Netlify)

Add these in Netlify -> Site settings -> Environment variables:

- [ ] `AUTH_SECRET=<long-random-secret>`
- [ ] `NEXTAUTH_URL=https://<your-netlify-site>.netlify.app`
- [ ] `NEXT_PUBLIC_SITE_URL=https://<your-netlify-site>.netlify.app`
- [ ] `GOOGLE_CLIENT_ID=<google-client-id>`
- [ ] `GOOGLE_CLIENT_SECRET=<google-client-secret>`
- [ ] `ALLOWED_ADMIN_EMAILS=<your-admin-email>`
- [ ] `NO_EXPIRY_JOB_RETENTION_DAYS=30` (optional)

## 4) Google OAuth Setup

In Google Cloud Console (same OAuth client used by app):

- [ ] Authorized JavaScript origin: `https://<your-netlify-site>.netlify.app`
- [ ] Authorized redirect URI: `https://<your-netlify-site>.netlify.app/api/auth/callback/google`

## 5) CMS Setup (Decap on Netlify)

In Netlify:

- [ ] Identity -> Enable
- [ ] Identity -> Registration -> `Invite only` (recommended)
- [ ] Identity -> Services -> Enable `Git Gateway`
- [ ] Identity -> Invite your admin email

## 6) Smoke Test (10 Minutes)

- [ ] `/` loads
- [ ] `/jobs` loads and cards render
- [ ] `/blog` loads
- [ ] Open a job page and confirm Skills, Education, Responsibilities are visible
- [ ] Click `Apply Now` and confirm redirect works
- [ ] `/admin` login works with allowed Google account
- [ ] Auto Extract runs without `401`
- [ ] Publish 1 job from admin, wait for deploy, verify it on public page
- [ ] `/sitemap.xml` loads
- [ ] `/robots.txt` loads

## 7) Known Production Behavior

- Auto-extract using local Ollama (`127.0.0.1`) will not run on Netlify.
- If Ollama is not hosted remotely, extractor will use fallback parsing mode.
- CMS changes appear on public site after Netlify build/deploy finishes.
- First API request can be slower due to serverless cold start.

## 8) Quick Troubleshooting

- `POST /api/admin/auto-extract 401`
  - Check admin session is active.
  - Check `NEXTAUTH_URL` is correct.
  - Check Google callback URI exactly matches production URL.

- `AccessDenied` after Google sign-in
  - Check `ALLOWED_ADMIN_EMAILS` includes your exact email.

- OAuth callback/sign-in error
  - Recheck origin + redirect URI in Google Cloud.

- Admin CMS login works but publish fails
  - Ensure Netlify Identity + Git Gateway are enabled.

## 9) Domain Switch Later (when you buy custom domain)

After custom domain is connected:

- [ ] Update `NEXTAUTH_URL` to custom domain
- [ ] Update `NEXT_PUBLIC_SITE_URL` to custom domain
- [ ] Update Google OAuth origin + redirect URI to custom domain
- [ ] Redeploy and rerun smoke test

