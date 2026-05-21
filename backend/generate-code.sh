#!/bin/bash
# ============================================
# Mogao Digital Twin - Code Generator
# ============================================
#
# Regenerates the Mongoose data layer from the Ecore metamodel:
#   - one Mongoose model per EClass (concrete + abstract)
#   - models/index.js
#   - one Service / Controller / Router per concrete entity in the
#     CodeGenerator entityClasses array
#
# Does NOT touch app.js, server.js, package.json, the four
# services/controllers/routers index.js files, or any of the
# hand-written services (auth, telemetry, anomaly, maintenance,
# deterioration, replay, exhibit, validation). Those are
# hand-written infrastructure outside the metamodel's remit.
#
# See backend/src/main/java/digital/twin/mogao/codegen/CodeGenerator.java
# for the entity list and Javadoc.

set -e

echo "============================================"
echo "Mogao Digital Twin - Code Generator"
echo "============================================"
echo ""

mvn -q compile
mvn -q exec:java@codegen

echo ""
echo "Done. Run 'git status backend/runtime/' to inspect changes."
