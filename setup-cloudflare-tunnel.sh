#!/bin/bash

# Script para configurar un túnel de Cloudflare con nombre permanente
# Esto te dará una URL fija sin necesidad de mover tu dominio

echo "🔧 Configuración de Túnel Permanente de Cloudflare"
echo "=================================================="
echo ""
echo "Este script te ayudará a crear un túnel con URL fija."
echo "La URL será algo como: the-dev.cfargotunnel.com"
echo ""
echo "📋 Requisitos:"
echo "   1. Cuenta gratuita de Cloudflare (https://dash.cloudflare.com/sign-up)"
echo "   2. cloudflared instalado (se descargará automáticamente)"
echo ""

# Descargar cloudflared si no existe
if [ ! -f "/usr/local/bin/cloudflared" ]; then
    echo "📥 Descargando cloudflared..."
    curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
    chmod +x /tmp/cloudflared
    mv /tmp/cloudflared /usr/local/bin/cloudflared
    echo "✅ cloudflared instalado en /usr/local/bin/cloudflared"
else
    echo "✅ cloudflared ya está instalado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 PASO 1: Autenticar con Cloudflare"
echo ""
echo "Se abrirá tu navegador para que autorices cloudflared."
echo "Si estás en SSH, copia el enlace que aparecerá y ábrelo en tu navegador."
echo ""
read -p "Presiona ENTER para continuar..."

cloudflared tunnel login

if [ $? -ne 0 ]; then
    echo "❌ Error al autenticar. Intenta de nuevo."
    exit 1
fi

echo ""
echo "✅ Autenticación exitosa"
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
    echo "❌ Error al crear túnel. Puede que ya exista."
    echo "Listando túneles existentes:"
    cloudflared tunnel list
    exit 1
fi

echo ""
echo "✅ Túnel creado exitosamente"
echo ""

# Obtener el UUID del túnel
TUNNEL_UUID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')

echo "   UUID del túnel: $TUNNEL_UUID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚙️  PASO 3: Configurar archivo de configuración"
echo ""

# Crear directorio de configuración
mkdir -p ~/.cloudflared

# Crear archivo de configuración
cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_UUID
credentials-file: /root/.cloudflared/$TUNNEL_UUID.json

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
echo "1. El túnel se iniciará automáticamente con ./start-dev.sh"
echo "2. Tu URL fija será: https://$TUNNEL_NAME.cfargotunnel.com"
echo "3. Puedes probar el túnel ahora con:"
echo ""
echo "   cloudflared tunnel run $TUNNEL_NAME"
echo ""
echo "4. Guardaremos el nombre del túnel para uso automático..."

# Guardar configuración para start-dev.sh
echo "$TUNNEL_NAME" > /root/development/the/.cloudflared-tunnel-name

echo ""
echo "✅ Todo listo. Ahora ejecuta ./start-dev.sh"
echo ""
