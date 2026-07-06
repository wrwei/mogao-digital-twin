# _archive — set-aside intermediates (2026-07-06)

Intermediate / abandoned artifacts from the pigment-ΔE analysis session, parked here
to keep `experiments/` tidy. Nothing here is needed by the final pipeline; kept for
provenance only.

**Abandoned interpolation branch** — superseded once the real gap-day measurements
were recovered (`mogao_data_measured_recovered.xlsx`):
`_interpolate_measured.py`, `_plot_interpolated.py`,
`mogao_data_measured_interpolated.xlsx`, `deltaE_trajectories_measured_interpolated.png`

**Set-aside model branch** — the model-generated ("faithful") dataset explored, then
dropped in favour of the real measured data for the paper:
`_make_model_faithful{,_v2}.py`, `_make_model_derived.py`, `_consolidate_data.py`,
`_plot_model_faithful.py`, `_plot_consolidated.py`, `_plot_trends.py`,
`mogao_data_consolidated.xlsx`, `mogao_data_model_faithful.xlsx`,
`_interp_days.json`, `_pred_band.json`, and their figures.

**Superseded measured figures / early plotters** — replaced by the recovered dataset
and `fig_pigment_deltaE_pedestal.*`:
`deltaE_trajectories_{mogao_data,mogao_data_filtered,measured_raw,measured_corrected}.png`,
`_plot_mogao_data.py`, `_plot_measured.py`

## Final pipeline (in `experiments/`, not here)
raw `mogao_data.xlsx` → `_consolidate_measured.py` → corrected
`mogao_data_measured_consolidated.xlsx` → recovered
`mogao_data_measured_recovered.xlsx` → `_fig_paper.py` →
`fig_pigment_deltaE_pedestal.pdf/.png`.
