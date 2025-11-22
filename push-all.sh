#!/bin/bash
# Script para hacer push a todos los repositorios remotos

echo "🚀 Pushing to all remotes..."
echo ""

# Push to origin
echo "📤 Pushing to origin (CamiloEspinoza/PlanEat.git)..."
git push origin main
if [ $? -eq 0 ]; then
    echo "✅ Origin push successful"
else
    echo "❌ Origin push failed"
    exit 1
fi

echo ""

# Push to mirror
echo "📤 Pushing to mirror (platanus-hack)..."
git push mirror main
if [ $? -eq 0 ]; then
    echo "✅ Mirror push successful"
else
    echo "❌ Mirror push failed"
    exit 1
fi

echo ""
echo "🎉 All pushes completed successfully!"
