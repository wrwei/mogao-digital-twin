#!/bin/bash

echo "============================================"
echo "Mogao Digital Twin - Backend Server"
echo "============================================"
echo ""
echo "Starting Micronaut server on port 8080..."
echo ""

mvn compile exec:java

if [ $? -ne 0 ]; then
    echo ""
    echo "Backend server failed to start!"
    exit 1
fi
