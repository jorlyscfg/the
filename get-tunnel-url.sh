#!/bin/bash

# Script para obtener la URL actual del túnel de Cloudflare
# Útil si necesitas consultar la URL sin reiniciar el servidor

echo "🔍 Buscando URL del túnel de Cloudflare..."
echo ""

HTTPS_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cloudflare-tunnel.log 2>/dev/null | head -1)

if [ ! -z "$HTTPS_URL" ]; then
    echo "✅ Túnel activo:"
    echo ""
    echo "   🔒 $HTTPS_URL"
    echo ""
    echo "   📱 Copia esta URL para probar desde otros dispositivos"
else
    echo "❌ No se encontró un túnel activo"
    echo ""
    echo "   Asegúrate de que el servidor de desarrollo esté corriendo con:"
    echo "   ./start-dev.sh"
fi

echo ""
