# Local Publishing Workflow

Use this workflow when you want Ollama locally, but the public site on Netlify.

## Start local admin

```bash
npm run local:admin
```

If you want AI autofill:

```bash
ollama serve
```

Open:

- `http://localhost:3000/admin/`

## Start local admin with auto publish

```bash
npm run local:admin:auto
```

This mode:

1. starts the local Next.js app
2. starts the Decap CMS proxy
3. watches `content/` and `public/uploads/`
4. automatically commits and pushes content after a 10-minute quiet period by default

Use this only when:

- you are synced with `origin/main`
- you are publishing content only
- you do not have staged non-content files

You can override the default quiet period if needed:

```bash
AUTO_PUBLISH_QUIET_PERIOD_SECONDS=300 npm run local:admin:auto
```

## Publish reviewed content

After you review the generated post locally:

```bash
npm run publish:content -- "Add new jobs"
```

This command:

1. runs lint
2. runs production build
3. stages only `content/` and `public/uploads/`
4. creates a commit
5. pushes to `main`

Netlify then redeploys the public site from GitHub.

## Notes

- This workflow is best for content publishing, not code deployment.
- Code changes should still be reviewed and committed separately.
- Do not use this command if you have not reviewed the content first.
- Auto publish will refuse to run if your branch already has unpushed commits or if non-content files are staged.
