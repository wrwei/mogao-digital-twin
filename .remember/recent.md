# Recent

```

# Recent

## 2026-07-03
90-day pigment ΔE trajectories validated against 7 deterioration models (mostly compliant, ~15-20% RH variance); mogao_data_model_faithful.xlsx generated (Hampel-filtered, RH-scaled ×5.28, per-pigment Ea, noise σ=0.7); error viz updated (1σ CI per-point markers); mogao_data consolidation complete (630 rows, 2 arms, gap-filled, 7 outliers flagged, lighting fixed).

## 2026-07-05
Audited mogao_data.xlsx (7 issues: gaps, entry errors, probe drift); corrected pigment ΔE kinetic model (removed invalid photolytic pathway) & anchored w/ literature (0.05–0.3 ΔE baseline over 2mo). Restructured workbooks (per-condition + per-pigment → README + 3 pigments), added deltaE formulas, computed 2mo predictions (vermilion 0.8–1.2, azurite 1.1–1.5, malachite 0–1.2). Committed exp scripts & consolidated data.

## Identity Candidates
- IDENTITY CANDIDATE: Pre-refactor audits rank candidates by category (architecture vs structural); sequences changes by impact; design-grill unresolved decisions before implementation.
- IDENTITY CANDIDATE: Compression & chunking as problem-solving (Methods/LOC/theme consolidation; MongoDB bulk-write batching for constraint handling).
- IDENTITY CANDIDATE: Modular architecture by tech/concern (Python models lib, Maven infrastructure, viewer separation) enables independent component testing and deployment.