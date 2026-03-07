

## Plan: Auto-Fallback to Firecrawl for JS-Only Shell Sites

### Problem
When the analyzer detects a JS-only shell (like `mycpamichael.com` which is a React SPA), it returns NOT SCORABLE. The manual HTML paste feature exists but is unreliable — the user pasted rendered HTML but only 1,425 bytes reached the server. Meanwhile, Firecrawl successfully renders and returns full HTML for this site.

### Solution
Automatically retry with Firecrawl when the initial fetch returns a JS-only shell, before returning NOT SCORABLE.

### Changes

**1. Edge function: `supabase/functions/analyze-website/index.ts`**

After `checkContentSufficiency` detects `js_only_shell` (line ~1586), instead of immediately returning NOT SCORABLE, attempt a Firecrawl re-fetch with JS rendering:

- If `contentCheck.reason === 'js_only_shell'` AND this was NOT already a manual HTML submission AND Firecrawl API key is available:
  - Call Firecrawl with `waitFor: 7000` and `formats: ['html']`
  - If Firecrawl returns sufficient HTML, replace `html` and re-run `checkContentSufficiency`
  - If the re-fetched HTML passes, continue to analysis
  - If it still fails, return the original NOT SCORABLE result
- This reuses the existing Firecrawl pattern already in the codebase (lines 1494-1536)

**2. Edge function: improve manual HTML flow**

Also skip the `checkContentSufficiency` check for `js_only_shell` when `manualHtml` is provided, since rendered outerHTML from SPAs may have lots of inline styles/CSS but the text extraction strips them — the user explicitly provided this content and it should be analyzed regardless.

### What stays the same
- All other NOT SCORABLE reasons (auth_gate, blocked_fetch, etc.) remain unchanged
- The Paste HTML feature continues to work as a manual override
- No frontend changes needed — this is entirely a backend improvement

