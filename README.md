# JobAdvice

JobAdvice is a production-ready job update website built with:

- Next.js 14 (App Router in `src/app`)
- Tailwind CSS
- Markdown-based job content in `content/jobs`
- Netlify CMS admin panel at `/admin`
- Optional static export mode for Netlify deployment

## Features

- Homepage with latest job cards
- All jobs page (`/jobs`) with search, filters, and sorting
- Blog hub (`/blog`) with search, trending topics, and trending posts
- SEO-friendly dynamic job pages (`/jobs/[slug]`)
- SEO-friendly dynamic blog pages (`/blog/[slug]`)
- Static pages: `/about`, `/contact`, `/privacy-policy`
- Dynamic metadata for each job
- `JobPosting` structured data on job detail pages
- Auto-generated `sitemap.xml` and `robots.txt`
- CMS workflow so admin can add/edit/delete jobs without code changes
- Admin access protected with Google authentication + email allowlist
- Secure apply-link redirect endpoint with UTM tracking (`/api/apply/[slug]`)
- Mobile responsive UI and static generation for fast indexing

## Project Structure

```text
content/jobs/               # Markdown job posts
content/blogs/              # Markdown blog posts
public/admin/               # Netlify CMS files
src/app/                    # App Router pages
src/lib/jobs.ts             # Markdown loader + sorting + formatting
src/lib/blogs.ts            # Blog loader + trending + search helpers
src/lib/markdown.ts         # Lightweight markdown block parser
netlify.toml                # Netlify build config
```

## Run Locally

```bash
npm install
npm run dev
npm run cms:proxy
```

Visit:

- Site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
  If your browser caches old assets, use `http://localhost:3000/admin/index.html`.

## Netlify CMS Setup

1. Deploy the repository to Netlify.
2. In Netlify dashboard, enable `Identity`.
3. Under `Identity > Services`, enable `Git Gateway`.
4. Invite your admin user from Netlify Identity.
5. Open `/admin` and log in.

Admin can then create/update/delete markdown files in `content/jobs/` and each save triggers a Git commit, which triggers Netlify auto-deploy.

## Job Post Frontmatter

Each markdown file in `content/jobs` should include:

```md
---
title: Software Engineer
slug: software-engineer-infosys
company: Infosys
location: Bengaluru, India
employmentType: Full-time
experience: 0-2 years
salary: INR 12 LPA - 18 LPA
summary: Build and maintain backend services for customer-facing products.
skills:
  - React
  - Node.js
responsibilities:
  - Build and maintain scalable backend APIs.
  - Collaborate with product and frontend teams.
education:
  - Bachelor's degree in CS or related field.
applyLink: https://example.com/apply
date: 2026-02-21
applicationStartDate: 2026-02-21
applicationEndDate: 2026-03-21
---
## Responsibilities
- Build and maintain scalable backend APIs.
## Education
- Bachelor's degree in CS or related field.
```

The filename becomes the SEO slug, for example:

- `content/jobs/software-engineer-infosys.md`
- URL: `/jobs/software-engineer-infosys`

## Deployment

Default mode:

- Build command: `npm run build`
- Start command: `npm run start`

Optional static export mode:

```bash
NEXT_OUTPUT_EXPORT=true npm run build
```

Use this for static hosting setups.

## Environment Variables

Set these environment variables:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
AUTH_SECRET=replace-with-long-random-secret
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALLOWED_ADMIN_EMAILS=admin1@example.com,admin2@example.com
NO_EXPIRY_JOB_RETENTION_DAYS=30
ADMIN_CONTENTS_TOKEN=your-github-fine-grained-token
```

`ADMIN_CONTENTS_TOKEN` is required in production if you want the custom `/admin` app to save posts, upload images, or delete entries.
