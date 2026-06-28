# Handoff

## State
Heritage-Sciences paper (pushed, main @ 6d56092): fig:replicas now real — 12-panel 3x4 montage figures/replica_fabrication.png from Yuan Tian's workshop photos (gen: figures/_make_replica_figure.py; 48MB raw sources in figures/process/ are gitignored). Case study = Kneeling Attendant Bodhisattva (Mogao Cave 328, Harvard 1924.70). Removed ALL Chinese Hanzi from rendered body text (paper is pdfLaTeX, no CJK package → Hanzi render blank); pinyin+formulae kept.
Companion repo c:/Users/willr/Git/mogao-digital-twin-public: built + verified (models 29 tests, mde mvn, viewer demo renders offline), 22 commits, NOT pushed to GitHub (gated on user review).

## Next
1. Asked user: translate Hanzi in .tex %-comments (% 摘要 etc.) to English too, or leave as scaffolding? Awaiting answer.
2. Companion-repo viewer asset swap: user to drop real bodhisattva model.obj+texture.jpg into viewer/assets/demo/ (replacing placeholder sphere), then I wire in + update SOURCE.md.
3. Publish companion repo to GitHub when user approves (repo name TBD).

## Context
- Paper compiles only on Overleaf via GitHub sync (no local pdflatex). Commit+push to sync.
- Pasted images NOT accessible to my tools; user must save files to disk (figures/process/ worked).
- Diacritics in .tex use LaTeX commands (\v{c}, \~n), not literal Unicode.
