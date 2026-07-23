# BCM116 course site

Static site, no build step. Two content types, same rendering pattern:

- **`workshops/*.html`** — week-by-week session pages (brief, terse, session-specific).
- **`resources/*.html`** — general-purpose technique guides, reusable across weeks/Investigations.

Both are an HTML shell (banner + optional `ref-strip` figure) wrapping a
`<script type="text/markdown" id="content">` block, rendered client-side by
`assets/content.js` into `#rendered`. Edit the markdown inside that script tag,
not raw HTML. `assets/content.css` / `assets/hub.css` hold the styling; index
pages (`workshops/index.html`, `resources/index.html`) list rows linking to
each page and need a new row whenever a page is added.

`prompts.html` (assessment prompts, Investigations 1–4) is a single self-contained
page with its own inline `DATA` object in `<script>` — each prompt can carry a
`resources: [{ title, url, note }]` array rendered into its "Additional resources"
box by `renderResources()`. Don't leave that box as "None added yet." if real
material exists for a prompt — annotate, don't just paste bare links.

## Incorporation workflow: `forincorporation/`

The user drops raw material here — PDFs, scratch notes, pasted links — to be
folded into the site. The folder is gitignored; nothing in it should be
committed as-is.

When asked to incorporate something from this folder:

1. **Read the whole source first.** PDFs may include instructor-only scaffolding
   (materials lists, timed schedules, learning objectives) mixed in with
   reusable technique content — don't port it all verbatim.
2. **Triage each piece of content:**
   - Reusable technique/method → a `resources/` page (new or amend existing),
     written as a technique menu ("no fixed pipeline"), not a lesson plan.
   - Session-specific detail (schedule, station description) → the relevant
     `workshops/*.html`, kept as terse as the other stations/weeks on that page.
     Link out to a `resources/` page for depth rather than inlining it — workshop
     pages should stay balanced across stations, not lopsided because one station
     had a richer source document.
   - Reference links/videos → fetch each one (WebFetch/WebSearch) for a real
     title and one-line annotation before adding it. If a fetch is blocked
     (Vimeo's CAPTCHA wall is common), don't invent a description — use a plain
     factual label instead.
   - Anything that changes assessment content (adds/drops a prompt, adds
     homework, contradicts what's already published) — ask before acting. This
     content is live curriculum, not a draft.
3. **Once incorporated**, delete the source file from `forincorporation/` (matches
   how prior scratch `.md` drops in `resources/` were removed after porting to
   proper HTML pages) — unless the user says to keep it.

## Git

Commit and push only when explicitly asked.
