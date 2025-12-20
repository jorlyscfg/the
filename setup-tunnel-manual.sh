#!/bin/bash

# Script para configurar túnel de Cloudflare SIN autenticación de navegador
# Usa el método de túnel simple que no requiere zona

echo "🔧 Configuración Automática de Túnel Cloudflare"
echo "=================================================="
echo ""
echo "Este método crea un túnel con URL fija SIN necesidad de:"
echo "  ❌ Agregar dominios a Cloudflare"
echo "  ❌ Autorización por navegador"
echo "  ❌ Configuración DNS"
echo ""
echo "Solo obtendrás una URL fija tipo: tu-nombre.cfargotunnel.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar que cloudflared está instalado
if ! command -v cloudflared &> /dev/null; then
    echo "📥 Instalando cloudflared..."
    curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
    chmod +x /usr/local/bin/cloudflared
fi

echo "📝 Ingresa el nombre para tu túnel (solo letras, números y guiones)"
read -p "Nombre del túnel (ej: the-dev): " TUNNEL_NAME

if [ -z "$TUNNEL_NAME" ]; then
    echo "❌ Debes proporcionar un nombre"
    exit 1
fi

# Validar nombre
if [[ ! "$TUNNEL_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo "❌ El nombre solo puede contener letras minúsculas, números y guiones"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANTE: Necesitas obtener un token de Cloudflare"
echo ""
echo "1. Ve a: https://dash.cloudflare.com/profile/api-tokens"
echo "2. Haz clic en 'Create Token'"
echo "3. Usa la plantilla 'Create Additional Tokens' → 'API token'"
echo "4. O usa este token de ejemplo (si tienes acceso):"
echo ""
echo "   Permisos necesarios:"
echo "   - Account | Cloudflare Tunnel | Edit"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "¿Ya tienes el token? (s/n): " TIENE_TOKEN

if [ "$TIENE_TOKEN" != "s" ]; then
    echo ""
    echo "Por favor, obtén el token primero y vuelve a ejecutar este script"
    exit 1
fi

echo ""
read -p "Pega tu Cloudflare API Token aquí: " CF_TOKEN

if [ -z "$CF_TOKEN" ]; then
    echo "❌ Token requerido"
    exit 1
fi

# Exportar token
export TUNNEL_TOKEN="$CF_TOKEN"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Creando túnel '$TUNNEL_NAME'..."
echo ""

# Crear túnel con el token
CLOUDFLARED_TOKEN="$CF_TOKEN" cloudflared tunnel create "$TUNNEL_NAME"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al crear túnel"
    echo "   Verifica que el token tenga los permisos correctos"
    exit 1
fi

# Obtener UUID del túnel
TUNNEL_UUID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')

if [ -z "$TUNNEL_UUID" ]; then
    echo "❌ No se pudo obtener el UUID del túnel"
    exit 1
fi

echo ""
echo "✅ Túnel creado exitosamente"
echo "   UUID: $TUNNEL_UUID"
echo ""

# Buscar archivo de credenciales
mkdir -p ~/.cloudflared
CRED_FILE=$(find ~/.cloudflared -name "$TUNNEL_UUID.json" 2>/dev/null | head -1)

if [ -z "$CRED_FILE" ]; then
    echo "⚠️  Archivo de credenciales no encontrado en ~/.cloudflared/"
    CRED_FILE="$HOME/.cloudflared/$TUNNEL_UUID.json"
fi

# Crear archivo de configuración
cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_UUID
credentials-file: $CRED_FILE

ingress:
  - hostname: $TUNNEL_NAME.cfargotunnel.com
    service: http://localhost:3004
  - service: http_status:404
EOF

echo "✅ Configuración guardada en ~/.cloudflared/config.yml"
echo ""

# Guardar nombre del túnel
echo "$TUNNEL_NAME" > /root/development/the/.cloudflared-tunnel-name

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 ¡Todo listo!"
echo ""
echo "📋 Tu URL permanente es:"
echo ""
echo "   🔒 https://$TUNNEL_NAME.cfargotunnel.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Ahora ejecuta: ./start-dev.sh"
echo ""
