# Google Search Checklist

Use this checklist before expecting sustained Google traffic for JobAdvice.

## 1. Use One Canonical Domain

- Buy or connect a custom domain in Netlify.
- Set that domain as the primary domain in Netlify.
- Redirect `jobadvice.netlify.app` to the custom domain.
- Set `NEXT_PUBLIC_SITE_URL` to the final canonical domain.

Example:

```bash
NEXT_PUBLIC_SITE_URL=https://www.jobadvice.in
```

## 2. Verify Google Search Console

- Create a Search Console property for the final domain.
- Preferred: verify a `Domain` property using DNS.
- Submit the sitemap:

```text
https://your-domain.com/sitemap.xml
```

- Check:
  - Indexing
  - Pages
  - Sitemaps
  - Core Web Vitals
  - Search results

## 3. Enable the Google Indexing API for Job URLs

This repo now supports automatic Indexing API notifications after content pushes.

Set these environment variables where you run content publishing:

```bash
GOOGLE_INDEXING_API_ENABLED=true
GOOGLE_INDEXING_SERVICE_ACCOUNT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_INDEXING_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Optional:

```bash
GOOGLE_INDEXING_API_DRY_RUN=true
```

Notes:

- Enable the Google Indexing API in the Google Cloud project tied to the service account.
- Add the service account email as an owner of the Search Console property.
- The content publish scripts will notify Google for:
  - new job URLs
  - updated job URLs
  - deleted or expired job URLs that disappear on the next deploy

## 4. Keep Job Pages Search-Safe

Each job should have:

- `title`
- `date`
- `company`
- `location`
- `applyLink`
- `applicationStartDate`
- `applicationEndDate` when available
- clean `skills`, `education`, and `responsibilities`

Do not publish:

- junk AI tokens
- duplicate jobs
- empty apply links
- fake salary data
- expired jobs with active structured data

## 5. Validate Structured Data

After deployment, test:

- homepage organization metadata
- one live job page
- one live blog page

Use:

- Rich Results Test
- URL Inspection in Search Console

## 6. Monitor After Every Change

After content pushes or SEO changes:

1. confirm the GitHub push completed
2. confirm Netlify deployed the latest commit
3. inspect one job URL live
4. inspect `sitemap.xml`
5. inspect Search Console coverage after recrawl

## 7. Recommended Operating Rule

- Use local admin for drafting and review
- Push content through GitHub
- Let Netlify deploy
- Use the Indexing API to accelerate recrawls of changed job URLs
