#!/bin/bash

# Script para limpiar completamente el cache de desarrollo
# Uso: ./scripts/clean-dev.sh

echo "🧹 Limpiando caché de Next.js..."
rm -rf .next

echo "🧹 Limpiando caché de node_modules..."
rm -rf node_modules/.cache

echo "✅ Limpieza completa!"
echo ""
echo "Ahora puedes ejecutar: npm run dev"
