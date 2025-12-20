#!/bin/bash

# Script SIMPLIFICADO para configurar túnel de Cloudflare
# Usa método manual sin autenticación de navegador

echo "🔧 Configuración Simplificada de Túnel Cloudflare"
echo "=================================================="
echo ""
echo "⚠️  IMPORTANTE: En la página de autorización que abriste,"
echo "   NO necesitas seleccionar ningún dominio."
echo ""
echo "   Solo haz clic en 'Authorize' o cierra la ventana."
echo "   El túnel NO requiere que tengas dominios en Cloudflare."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "¿Ya autorizaste cloudflared? (s/n): " AUTORIZADO

if [ "$AUTORIZADO" != "s" ]; then
    echo ""
    echo "Por favor, completa la autorización primero:"
    echo "1. Abre esta URL en tu navegador:"
    echo ""
    cloudflared tunnel login 2>&1 | grep "https://dash.cloudflare.com" || echo "   (ejecuta: cloudflared tunnel login)"
    echo ""
    echo "2. Inicia sesión en Cloudflare"
    echo "3. Haz clic en 'Authorize' (NO necesitas seleccionar dominio)"
    echo "4. Vuelve aquí y ejecuta de nuevo este script"
    exit 1
fi

# Verificar que el archivo de credenciales existe
if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
    echo "❌ No se encontró el archivo de autenticación"
    echo "   Ejecuta primero: cloudflared tunnel login"
    exit 1
fi

echo ""
echo "✅ Autenticación detectada"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 PASO 2: Crear túnel con nombre"
echo ""

# Pedir nombre del túnel
read -p "Nombre del túnel (ej: the-dev): " TUNNEL_NAME

if [ -z "$TUNNEL_NAME" ]; then
    echo "❌ Debes proporcionar un nombre"
    exit 1
fi

echo ""
echo "Creando túnel '$TUNNEL_NAME'..."

cloudflared tunnel create $TUNNEL_NAME

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  El túnel puede ya existir. Listando túneles:"
    echo ""
    cloudflared tunnel list
    echo ""
    read -p "¿Usar túnel existente '$TUNNEL_NAME'? (s/n): " USAR_EXISTENTE

    if [ "$USAR_EXISTENTE" != "s" ]; then
        exit 1
    fi
fi

echo ""
echo "✅ Túnel listo"
echo ""

# Obtener el UUID del túnel
TUNNEL_UUID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')

if [ -z "$TUNNEL_UUID" ]; then
    echo "❌ No se pudo obtener el UUID del túnel"
    exit 1
fi

echo "   UUID del túnel: $TUNNEL_UUID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚙️  PASO 3: Configurar archivo de configuración"
echo ""

# Crear directorio de configuración
mkdir -p ~/.cloudflared

# Buscar el archivo de credenciales del túnel
CRED_FILE=$(find ~/.cloudflared -name "$TUNNEL_UUID.json" 2>/dev/null | head -1)

if [ -z "$CRED_FILE" ]; then
    echo "⚠️  Archivo de credenciales no encontrado automáticamente"
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

echo "✅ Archivo de configuración creado en ~/.cloudflared/config.yml"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Información del túnel:"
echo "   Nombre:    $TUNNEL_NAME"
echo "   UUID:      $TUNNEL_UUID"
echo "   URL fija:  https://$TUNNEL_NAME.cfargotunnel.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Próximos pasos:"
echo ""
echo "1. Guardar nombre del túnel para uso automático..."

# Guardar configuración para start-dev.sh
echo "$TUNNEL_NAME" > /root/development/the/.cloudflared-tunnel-name

echo ""
echo "✅ Todo listo. Ahora ejecuta ./start-dev.sh"
echo ""
echo "💡 Tu URL permanente será: https://$TUNNEL_NAME.cfargotunnel.com"
echo ""
