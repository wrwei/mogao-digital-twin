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
if [ -d "generated/mongoose" ]; then
    rm -rf "generated/mongoose"
    echo "  Removed generated mongoose directory"
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
mvn exec:java@codegen

if [ $? -ne 0 ]; then
    echo "Code generation failed!"
    exit 1
fi

echo ""
echo "Installing Mongoose backend dependencies..."
cd generated/mongoose && npm install && cd ../..

echo ""
echo "============================================"
echo "Code generation complete!"
echo ""
echo "Generated Java Backend Code:"
echo "  - DTOs:        src/main/java/digital/twin/mogao/dto"
echo "  - Services:    src/main/java/digital/twin/mogao/service"
echo "  - Controllers: src/main/java/digital/twin/mogao/controller"
echo ""
echo "Generated Node.js Backend (MongoDB):"
echo "  - Models:      generated/mongoose/models"
echo "  - Services:    generated/mongoose/services"
echo "  - Controllers: generated/mongoose/controllers"
echo "  - Routers:     generated/mongoose/routers"
echo "  - Start with:  cd generated/mongoose && npm start"
echo "============================================"
