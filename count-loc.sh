#!/bin/bash

# Line of Code Counter for Mogao Digital Twin Project

echo "=============================================="
echo "  Lines of Code Counter"
echo "  Mogao Digital Twin Project"
echo "=============================================="
echo ""
echo "Lines of Code by File Type:"
echo "----------------------------------------------"

# Count Java files
java_lines=0
for file in $(find . -type f -name "*.java" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    java_lines=$((java_lines + lines))
done
printf "%-20s %10s\n" "Java:" "$java_lines"

# Count JavaScript files
js_lines=0
for file in $(find . -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    js_lines=$((js_lines + lines))
done
printf "%-20s %10s\n" "JavaScript:" "$js_lines"

# Count HTML files
html_lines=0
for file in $(find . -type f -name "*.html" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    html_lines=$((html_lines + lines))
done
printf "%-20s %10s\n" "HTML:" "$html_lines"

# Count CSS files
css_lines=0
for file in $(find . -type f -name "*.css" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    css_lines=$((css_lines + lines))
done
printf "%-20s %10s\n" "CSS:" "$css_lines"

# Count XML files
xml_lines=0
for file in $(find . -type f -name "*.xml" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    xml_lines=$((xml_lines + lines))
done
printf "%-20s %10s\n" "XML:" "$xml_lines"

# Count JSON files
json_lines=0
for file in $(find . -type f -name "*.json" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    json_lines=$((json_lines + lines))
done
printf "%-20s %10s\n" "JSON:" "$json_lines"

# Count Markdown files
md_lines=0
for file in $(find . -type f -name "*.md" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    md_lines=$((md_lines + lines))
done
printf "%-20s %10s\n" "Markdown:" "$md_lines"

# Count Flexmi files
flexmi_lines=0
for file in $(find . -type f -name "*.flexmi" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    flexmi_lines=$((flexmi_lines + lines))
done
printf "%-20s %10s\n" "Flexmi Models:" "$flexmi_lines"

# Count Properties files
properties_lines=0
for file in $(find . -type f -name "*.properties" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*"); do
    lines=$(wc -l < "$file" 2>/dev/null)
    properties_lines=$((properties_lines + lines))
done
printf "%-20s %10s\n" "Properties:" "$properties_lines"

echo ""
echo "=============================================="

# Calculate total
total=$((java_lines + js_lines + html_lines + css_lines + xml_lines + json_lines + md_lines + flexmi_lines + properties_lines))
printf "TOTAL LINES:         %10s\n" "$total"
echo "=============================================="
echo ""

# Show file counts
echo "File Counts:"
echo "----------------------------------------------"
java_count=$(find . -type f -name "*.java" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*" 2>/dev/null | wc -l)
js_count=$(find . -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*" 2>/dev/null | wc -l)
html_count=$(find . -type f -name "*.html" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*" 2>/dev/null | wc -l)
css_count=$(find . -type f -name "*.css" ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/.git/*" ! -path "*/.claude/*" 2>/dev/null | wc -l)

printf "%-20s %10s\n" "Java files:" "$java_count"
printf "%-20s %10s\n" "JavaScript files:" "$js_count"
printf "%-20s %10s\n" "HTML files:" "$html_count"
printf "%-20s %10s\n" "CSS files:" "$css_count"
echo ""
