#!/bin/bash

echo "============================================"
echo "Mogao Digital Twin - Code Remover"
echo "============================================"
echo ""

echo "Removing generated code..."

if [ -d "src/main/java/digital/twin/mogao/dto" ]; then
    rm -rf "src/main/java/digital/twin/mogao/dto"
    echo "  Removed dto directory"
else
    echo "  No dto directory found"
fi

if [ -d "src/main/java/digital/twin/mogao/service" ]; then
    rm -rf "src/main/java/digital/twin/mogao/service"
    echo "  Removed service directory"
else
    echo "  No service directory found"
fi

if [ -d "src/main/java/digital/twin/mogao/controller" ]; then
    rm -rf "src/main/java/digital/twin/mogao/controller"
    echo "  Removed controller directory"
else
    echo "  No controller directory found"
fi

if [ -d "../frontend/components" ]; then
    rm -rf "../frontend/components"
    echo "  Removed frontend components directory"
else
    echo "  No frontend components directory found"
fi

if [ -d "../frontend/composables" ]; then
    rm -rf "../frontend/composables"
    echo "  Removed frontend composables directory"
else
    echo "  No frontend composables directory found"
fi

echo ""
echo "============================================"
echo "Generated code removed successfully!"
echo "============================================"
