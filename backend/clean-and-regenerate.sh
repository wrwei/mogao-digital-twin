#!/bin/bash
# ============================================
# Mogao Digital Twin - Clean and Regenerate (Phase 1 stub)
# ============================================
#
# Disabled in Phase 1. The previous version of this script wiped
# directories that are now load-bearing (most importantly the live
# backend at backend/runtime/, plus the hand-extended
# Vue 3 frontend). Running it as-is would have destroyed work.
#
# Phase 2 will restore a safe regenerate-with-fences flow.
#
# Until then, see generate-code.sh (the codegen entry point is a
# no-op) and backend/src/main/resources/transformation/
# RUN_TRANSFORMATIONS.md.

echo "This command is disabled. See backend/generate-code.sh."
exit 1
