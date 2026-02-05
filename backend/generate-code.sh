#!/bin/bash

echo "============================================"
echo "Mogao Digital Twin - Code Generator"
echo "============================================"
echo ""

echo "Cleaning previous generated code..."
if [ -d "src/main/java/digital/twin/mogao/dto" ]; then
    rm -rf "src/main/java/digital/twin/mogao/dto"
    echo "  Removed dto directory"
fi
if [ -d "src/main/java/digital/twin/mogao/service" ]; then
    rm -rf "src/main/java/digital/twin/mogao/service"
    echo "  Removed service directory"
fi
if [ -d "src/main/java/digital/twin/mogao/controller" ]; then
    rm -rf "src/main/java/digital/twin/mogao/controller"
    echo "  Removed controller directory"
fi
if [ -d "../frontend/components" ]; then
    rm -rf "../frontend/components"
    echo "  Removed frontend components directory"
fi
if [ -d "../frontend/composables" ]; then
    rm -rf "../frontend/composables"
    echo "  Removed frontend composables directory"
fi
if [ -f "../frontend/app.js" ]; then
    cp "../frontend/app.js" "../frontend/app.js.backup"
    echo "  Backed up app.js to app.js.backup"
fi

echo ""
echo "Compiling project..."
mvn clean compile

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo ""
echo "Running code generator..."
mvn exec:java

if [ $? -ne 0 ]; then
    echo "Code generation failed!"
    exit 1
fi

echo ""
echo "============================================"
echo "Code generation complete!"
echo ""
echo "Generated Backend Code:"
echo "  - DTOs:        src/main/java/digital/twin/mogao/dto"
echo "  - Services:    src/main/java/digital/twin/mogao/service"
echo "  - Controllers: src/main/java/digital/twin/mogao/controller"
echo ""
echo "Generated Frontend Code:"
echo "  - Components:  ../frontend/components"
echo "  - Composables: ../frontend/composables"
echo "  - App.js:      ../frontend/app.js"
echo ""
echo "Note: Previous app.js backed up to app.js.backup"
echo "============================================"
