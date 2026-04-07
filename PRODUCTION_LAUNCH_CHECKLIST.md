# Production Launch Checklist (Vercel) - JobAdvice

Created: February 26, 2026

Use this checklist in order. Do not skip steps.

## 1) Local Pre-Launch (must pass first)

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `.env.local` is not committed
- [ ] `NEXT_OUTPUT_EXPORT` is **not** set to `true` in production

## 2) Vercel Project Setup

- [ ] Vercel -> Add New Project -> Import from GitHub
- [ ] Select repo: `hassanusmani21/Jobadvice`
- [ ] Branch: `main`
- [ ] Build command: `rm -rf .next out && npm run build`
- [ ] Output settings: default Next.js runtime (no static export mode)

## 3) Environment Variables (Vercel)

Add these in Vercel -> Project settings -> Environment Variables:

- [ ] `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?schema=public`
- [ ] `AUTH_SECRET=<long-random-secret>`
- [ ] `NEXTAUTH_URL=https://your-domain.com`
- [ ] `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
- [ ] `GOOGLE_CLIENT_ID=<google-client-id>`
- [ ] `GOOGLE_CLIENT_SECRET=<google-client-secret>`
- [ ] `ALLOWED_ADMIN_EMAILS=<your-admin-email>`
- [ ] `ADMIN_CONTENTS_TOKEN=<github-fine-grained-token-with-repo-contents-write>`
- [ ] `NO_EXPIRY_JOB_RETENTION_DAYS=30` (optional)

## 4) Google OAuth Setup

In Google Cloud Console (same OAuth client used by app):

- [ ] Authorized JavaScript origin: `https://your-domain.com`
- [ ] Authorized redirect URI: `https://your-domain.com/api/auth/callback/google`

## 5) Admin App Setup

- [ ] `ALLOWED_ADMIN_EMAILS` includes your admin email
- [ ] `ADMIN_CONTENTS_TOKEN` is set in Vercel
- [ ] `/admin/login` works with your Google account
- [ ] `/admin` opens after login and content saves create Git commits

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

- Auto-extract using local Ollama (`127.0.0.1`) will not run on Vercel.
- If Ollama is not hosted remotely, extractor will use fallback parsing mode.
- CMS changes appear on the public site after the Vercel deployment finishes.
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

- Admin login works but publish fails
  - Ensure `ADMIN_CONTENTS_TOKEN` is valid and has repository `Contents: Read and write`.

- Mobile admin shows `ADMIN_CONTENTS_TOKEN is required for production admin saves`
  - Add `ADMIN_CONTENTS_TOKEN` in production environment variables.
  - Use a GitHub fine-grained token with repository `Contents: Read and write`.
  - Redeploy, then retry `/admin-mobile`.

## 9) Domain Switch Later

After custom domain is connected:

- [ ] Update `NEXTAUTH_URL` to custom domain
- [ ] Update `NEXT_PUBLIC_SITE_URL` to custom domain
- [ ] Update Google OAuth origin + redirect URI to custom domain
- [ ] Redeploy and rerun smoke test
