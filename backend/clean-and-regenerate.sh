#!/bin/bash

echo "============================================"
echo "Mogao Digital Twin - Clean and Regenerate"
echo "============================================"
echo

# Kill any processes using port 8080
echo "Checking for processes on port 8080..."
PID=$(netstat -ano | grep :8080 | grep LISTENING | awk '{print $NF}' | head -1)
if [ ! -z "$PID" ]; then
    echo "Killing process $PID on port 8080..."
    taskkill //F //PID $PID 2>/dev/null || true
fi

echo
echo "Cleaning generated code..."

# Remove generated backend code
rm -rf src/main/java/digital/twin/mogao/dto && echo "  Removed dto directory"
rm -rf src/main/java/digital/twin/mogao/service && echo "  Removed service directory"
rm -rf src/main/java/digital/twin/mogao/controller && echo "  Removed controller directory"

# Remove generated frontend code
rm -rf ../frontend/components && echo "  Removed frontend components directory"
rm -rf ../frontend/composables && echo "  Removed frontend composables directory"
rm -f ../frontend/app.js && echo "  Removed app.js"
rm -f ../frontend/i18n.js && echo "  Removed i18n.js"
rm -f ../frontend/index.html && echo "  Removed index.html"

# Clean Maven target (optional - uncomment if needed)
# rm -rf target && echo "  Removed target directory"

echo
echo "Compiling project..."
mvn compile -q

if [ $? -ne 0 ]; then
    echo
    echo "============================================"
    echo "ERROR: Compilation failed!"
    echo "============================================"
    exit 1
fi

echo
echo "Running code generator..."
mvn exec:java@codegen -q

if [ $? -ne 0 ]; then
    echo
    echo "============================================"
    echo "ERROR: Code generation failed!"
    echo "============================================"
    exit 1
fi

echo
echo "============================================"
echo "Clean and Regenerate Complete!"
echo
echo "Generated Backend Code:"
echo "  - DTOs:        src/main/java/digital/twin/mogao/dto"
echo "  - Services:    src/main/java/digital/twin/mogao/service"
echo "  - Controllers: src/main/java/digital/twin/mogao/controller"
echo
echo "Generated Frontend Code:"
echo "  - Components:  ../frontend/components"
echo "  - Composables: ../frontend/composables"
echo "  - App.js:      ../frontend/app.js"
echo "  - i18n.js:     ../frontend/i18n.js"
echo "  - index.html:  ../frontend/index.html"
echo
echo "Generated EOL Scripts:"
echo "  - Scripts:     src/main/resources/eol-scripts"
echo "============================================"
echo
echo "You can now run: mvn mn:run"
echo
