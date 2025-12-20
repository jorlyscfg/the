#!/bin/bash

# Script seguro para detener solo el servidor de desarrollo
# Sin afectar procesos de VSCode o Node.js del sistema

echo "🛑 Deteniendo servidor de desarrollo (puerto 3004)..."

# Contador de procesos terminados
count=0

# 1. Matar procesos en el puerto 3004 específicamente
echo "   🔍 Buscando procesos en puerto 3004..."
PIDS=$(lsof -ti:3004 2>/dev/null)
if [ ! -z "$PIDS" ]; then
    echo "   ⚡ Terminando PIDs: $PIDS"
    for pid in $PIDS; do
        kill -15 $pid 2>/dev/null || kill -9 $pid 2>/dev/null
        ((count++))
    done
fi

# 2. Buscar procesos Next.js específicos del puerto 3004
echo "   🔍 Buscando procesos Next.js específicos..."

# Usar pkill con patrón MUY específico
pkill -15 -f "next dev -p 3004 -H 0.0.0.0" 2>/dev/null && ((count++))
sleep 1
pkill -9 -f "next dev -p 3004 -H 0.0.0.0" 2>/dev/null && ((count++))

# 3. Limpiar archivos de PID si existen
if [ -f /tmp/nextjs-dev.pid ]; then
    PID=$(cat /tmp/nextjs-dev.pid 2>/dev/null)
    if [ ! -z "$PID" ]; then
        echo "   ⚡ Terminando PID guardado: $PID"
        kill -15 $PID 2>/dev/null || kill -9 $PID 2>/dev/null
        ((count++))
    fi
    rm -f /tmp/nextjs-dev.pid
fi

# Esperar un momento
sleep 1

# Verificar que el puerto esté libre
if lsof -i:3004 >/dev/null 2>&1; then
    echo "   ⚠️ Puerto 3004 aún ocupado. Intentando forzar..."
    lsof -ti:3004 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Verificación final
if ! lsof -i:3004 >/dev/null 2>&1; then
    echo "✅ Servidor detenido correctamente ($count procesos terminados)"
    echo "✅ Puerto 3004 libre"
else
    echo "❌ Advertencia: Puerto 3004 aún puede estar ocupado"
    echo "   Ejecuta: lsof -i:3004 para ver qué lo está usando"
fi
