# Aprendizaje (Repasos): project guidance for coding agents

## Application
- Public repository: `almova90/repasos`; branch `main`; PWA hosted with GitHub Pages, installed on Android.
- Main application: large single-file `index.html` (HTML, CSS, JavaScript); `sw.js` service worker; `version.json`; `music-catalog.json`; `music/` audio; `demo-data.js`.
- The user's personal database is stored in browser IndexedDB and exchanged via JSON export/import. Do **not** commit users' personal JSON exports, review histories, or other sensitive browsing data to this public repository.
- The version currently intended for release is 0.34.2, but always inspect `version.json` and Git history before changes.

## User-facing behavior to preserve
- All cards retain their stable IDs and review histories, including forward and reverse spaced-repetition state. New cards default to bidirectional unless explicitly requested otherwise.
- Four decks: `Música`, `Literatura`, `Miscelánea`, and `Sistemas de escritura`.
- Literatura: works with title/author cards, not author biographies. Música: bidirectional text/audio cards from catalog; audio paths and playback must work.
- The deck picker supports selecting several decks, requires a confirmation click, and remembers the last chosen subset.
- Writing-system cards cover hiragana, katakana, Russian, Ukrainian and Hebrew, with transliterations, Hebrew names, and language direction markers on a second line. Japanese and Hebrew scripts have no uppercase.
- Language display preference: `Banderas` (default) or `Texto`; use compact language markers and direction `source → target`; retain existing literal text and inline formatting in cards.
- Existing text cards can contain `<small>(sin.)</small>`, `<small>(ant.)</small>`, `<i>...</i>` and Greek characters. For a synonyms card put the small `(sin.)` tag on **both** faces, but not on prose definitions.
- UI language: European Spanish. Prefer compact, uncluttered controls, avoiding unnecessary descriptive text.

## Release and testing policy
1. Before editing, inspect the current repository; identify the smallest safe change. Avoid rewriting the whole single-file app for small features.
2. Check HTML/JS syntax and run browser-based **smoke tests on actual rendered pages** for launch, deck picker, multiple deck filtering, app settings, flipping cards, music playback and offline/update path. A syntax check alone is insufficient.
3. Test with normal and Arcade theme; existing IndexedDB data must not be reset. Test exported/imported personal data using **local/private fixtures**, not public commits.
4. Update `index.html`, `sw.js` cache version, and `version.json` consistently. Keep navigation caching isolated to the active cache, preferring fresh HTML when online; offline fallback must work.
5. Prefer a branch and pull request with a clear summary and test evidence; merge/publish only after smoke tests. Keep a quick rollback path.
6. If startup fails, show an intelligible error or recovery screen instead of a blank viewport. Do not clear local storage or IndexedDB as an improvised fix.
7. Avoid accidentally overwriting newer review progress when importing or synchronizing databases; inspect merge semantics.

## Continuity
- Codex or another agent should read this document and `README.md` first. This document records engineering invariants, not a transcript of the user's prior ChatGPT conversations.
- The user can provide separate current JSON exports and individual feature requests. Treat the newest supplied JSON as the basis and never infer that it is publicly hosted.
