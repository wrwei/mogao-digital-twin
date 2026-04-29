#!/bin/bash
# ============================================
# Mogao Digital Twin - Code Generator (Phase 1 stub)
# ============================================
#
# The Java/Micronaut runtime backend has been retired. The runtime
# backend is now Node.js + Express + Mongoose at backend/generated/
# mongoose/ and is not built by Maven.
#
# The Mongoose regeneration pipeline is being redesigned (Phase 2)
# to preserve hand-extended business logic via fenced extension
# regions; auto-generation is therefore disabled until that lands.
#
# Running the codegen entry point today prints a no-op informational
# message — see backend/src/main/java/digital/twin/mogao/codegen/
# CodeGenerator.java.
#
# For ad-hoc EGL invocations against the metamodel, see
# backend/src/main/resources/transformation/RUN_TRANSFORMATIONS.md.

echo "============================================"
echo "Mogao Digital Twin - Code Generator"
echo "============================================"
echo ""

mvn exec:java@codegen
RC=$?
if [ $RC -ne 0 ]; then
    echo "Code generator entry point failed."
    exit $RC
fi

echo ""
echo "Done."
