# 📜 Scripts de Desarrollo

Este documento explica cómo usar los scripts de desarrollo del proyecto.

## 🚀 Iniciar el Servidor de Desarrollo

### Opción 1: Usar el script automatizado (Recomendado)
```bash
./start-dev.sh
```

Este script:
- ✅ Verifica dependencias
- ✅ Limpia procesos antiguos **de forma segura y robusta**
- ✅ Libera el puerto 3004 usando múltiples métodos (`lsof`, `ss`, `fuser`)
- ✅ Detecta y mata solo procesos Next.js de este proyecto específico
- ✅ Inicia Next.js en modo desarrollo
- ✅ Verifica que el servidor esté corriendo correctamente
- ✅ Guarda logs en `/tmp/nextjs-dev.log` para diagnóstico
- ✅ **NO cierra procesos de VSCode ni otros servicios**

**Para detener:** Presiona `Ctrl+C` en la terminal donde está corriendo

### Opción 2: Usar npm directamente
```bash
npm run dev
```

Inicia el servidor directamente en el puerto 3004

## 🛑 Detener el Servidor de Desarrollo

### Método Seguro (Recomendado)
```bash
./stop-dev.sh
```

Este script:
- ✅ Solo termina procesos del puerto 3004
- ✅ Es específico y no afecta VSCode
- ✅ Limpia archivos temporales
- ✅ Verifica que el puerto quede libre

### Método Manual
```bash
# Ver qué está usando el puerto
lsof -i:3004

# Matar solo ese proceso específico
lsof -ti:3004 | xargs kill -9
```

## ⚠️ IMPORTANTE - Seguridad de Scripts

Los scripts han sido optimizados para **NO cerrar tu sesión de VSCode**:

### ❌ Lo que NO hace:
- ❌ No mata procesos genéricos de Node.js
- ❌ No mata procesos npm aleatorios
- ❌ No afecta otros puertos
- ❌ No cierra servicios del sistema

### ✅ Lo que SÍ hace:
- ✅ Solo mata procesos en el puerto 3004 (usando `lsof`, `ss` y `fuser`)
- ✅ Solo mata procesos específicos de "next dev -p 3004"
- ✅ Verifica que los procesos pertenezcan al directorio del proyecto antes de matarlos
- ✅ Respeta procesos de VSCode y otros servicios
- ✅ Respeta otros proyectos Next.js en diferentes puertos

## 📋 Otros Comandos Útiles

```bash
# Compilar para producción
npm run build

# Iniciar en modo producción
npm run start

# Verificar errores de lint
npm run lint
```

## 🔧 Solución de Problemas

### Problema: "Puerto 3004 ocupado"
```bash
# Ver qué lo está usando (método 1)
lsof -i:3004

# Ver qué lo está usando (método 2, más confiable)
ss -tulpn | grep :3004

# Detenerlo de forma segura
./stop-dev.sh

# O manualmente
lsof -ti:3004 | xargs kill -9

# Ver logs del servidor
cat /tmp/nextjs-dev.log
```

### Problema: "VSCode se cierra al ejecutar start-dev.sh"
**✅ SOLUCIONADO:** Los scripts ahora son seguros y no afectan VSCode.

Si aún tienes problemas:
1. Usa `npm run dev` en lugar del script
2. O usa `./stop-dev.sh` para detener antes de iniciar

### Problema: "El servidor no inicia"
```bash
# Limpiar todo y reinstalar
rm -rf node_modules .next
npm install
npm run dev
```

## 📊 Puertos Utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Next.js App | 3004 | http://localhost:3004 |

## 🔐 Credenciales de Prueba

- **Email:** admin@gmail.com
- **Password:** admin123

---

**Última actualización:** 2025-12-16
