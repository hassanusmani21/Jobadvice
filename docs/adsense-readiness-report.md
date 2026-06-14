# AdSense Readiness Cleanup Report

Date: 2026-06-13

## Cleanup Completed

- Added a publish-time admin quality gate for future jobs and blogs.
- Drafted weak existing content so low-value pages are no longer exposed as live inventory.
- Drafted unresolved citation-placeholder blog posts that contained import artifacts.
- Cleaned escaped markdown artifacts from the remaining live computer-science article.
- Normalized short or overlong summaries on key live articles.
- Confirmed required trust pages exist:
  - About
  - Contact
  - Privacy Policy
  - Terms
  - Editorial Policy
- Confirmed `public/ads.txt` exists.

## Current Live Content

- Live blogs: 12
- Draft blogs: 21
- Live jobs: 57
- Draft jobs: 118

The remaining live blogs pass the local quality checks for:

- 700+ words
- At least 3 useful sections
- Summary between 90 and 220 characters
- No visible citation placeholders
- No escaped markdown heading/bold artifacts

## Before Applying

- Confirm the `ads.txt` publisher ID belongs to your AdSense account:
  `pub-9949097899491859`
- Review the 12 live blog posts manually for factual accuracy and source quality.
- Keep weak drafts unpublished until they are expanded and pass the admin quality gate.
- Deploy the cleaned site and wait for Google to crawl the updated sitemap before applying.

## Verification Run

- `npm run validate:jobs`
- `npm run validate:content`
- `npm run lint`
