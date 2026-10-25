# record.devotedemocracy.com

The Devote Public Record: every vote on Devote, checkable by anyone. A static site. Every check runs in
the visitor's browser against the public log, using the open-source
[record-verifier](https://github.com/Devote-Democracy/record-verifier). The site holds no data of its own.

## Pages

- **Record** (`/`): verifies the signed checkpoint and every entry, and lists the votes.
- **A vote** (`/stage/:entry`): result, breakdowns, "Recount it yourself" in the browser, and how the
  vote is protected.
- **All entries** (`/entries`): the log, filterable by type; each entry with its leaf hash and JSON.
- **How it works** (`/how-it-works`): the guarantees in plain English, what isn't proven yet, and the
  command-line verifier.

## Develop

```bash
npm install
npm run demo        # writes a synthetic DEMO log to public/demo/ and starts the site against it
npm run build       # typecheck + bundle to dist/
```

Against the real log, set `VITE_LOG_BASE_URL` (where the tiles are served) and `VITE_LOG_KEY` (the log's
verifier key). See `.env.example`.

## Deploy

Cloudflare Workers static assets (`wrangler.jsonc`), on `record.devotedemocracy.com`. **Not deployed
yet:** it needs the log's public bucket and key from the vote_ledger service first.

## Licence

Apache-2.0.
