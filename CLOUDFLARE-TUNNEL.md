# 🔒 Configuración de Túnel HTTPS Permanente con Cloudflare

## ¿Qué es esto?

Actualmente el túnel de Cloudflare genera una URL aleatoria cada vez que inicias el servidor (ej: `https://random-xyz-123.trycloudflare.com`).

Con un **túnel con nombre**, tendrás una **URL fija permanente** como:
```
https://the-dev.cfargotunnel.com
```

## ✨ Ventajas

- ✅ **URL fija** que nunca cambia
- ✅ **HTTPS automático** (certificado SSL gratis)
- ✅ **No requiere mover tu dominio** de Hostinger
- ✅ **Gratis** - no cuesta nada
- ✅ **Funciona desde cualquier dispositivo** (móvil, tablet, etc.)
- ✅ **Acceso a APIs que requieren HTTPS** (cámara, geolocalización, etc.)

## 📋 Requisitos

1. Cuenta gratuita de Cloudflare: https://dash.cloudflare.com/sign-up
2. Acceso SSH al servidor

## 🚀 Configuración (Solo una vez)

### Paso 1: Ejecutar el script de configuración

```bash
./setup-cloudflare-tunnel.sh
```

### Paso 2: Seguir las instrucciones

El script te pedirá:

1. **Autenticar con Cloudflare**
   - Se abrirá una URL en tu navegador
   - Inicia sesión con tu cuenta de Cloudflare
   - Autoriza cloudflared

2. **Elegir un nombre para el túnel**
   - Ejemplo: `the-dev`
   - Este será parte de tu URL: `https://the-dev.cfargotunnel.com`

3. **Esperar confirmación**
   - El script creará el túnel
   - Guardará la configuración automáticamente

### Paso 3: ¡Listo!

Ahora cuando ejecutes `./start-dev.sh`, el túnel usará automáticamente tu URL fija.

## 🌐 Uso

### URL Temporal (por defecto)
```bash
./start-dev.sh
# Obtendrás: https://random-xyz-123.trycloudflare.com
```

### URL Fija (después de configurar)
```bash
./start-dev.sh
# Obtendrás siempre: https://the-dev.cfargotunnel.com
```

## 🔧 Comandos Útiles

### Ver túneles existentes
```bash
cloudflared tunnel list
```

### Probar el túnel manualmente
```bash
cloudflared tunnel run the-dev
```

### Eliminar un túnel
```bash
cloudflared tunnel delete the-dev
```

## ❓ Preguntas Frecuentes

### ¿Necesito mover mi dominio a Cloudflare?
**No.** Tu dominio puede quedarse en Hostinger. La URL del túnel será `*.cfargotunnel.com`.

### ¿Puedo usar mi propio dominio (the-test.jegdev.com)?
Sí, pero para eso necesitarías mover **solo ese subdominio** a Cloudflare usando nameservers. Es más complejo y requiere cambios en DNS.

### ¿El túnel consume muchos recursos?
No. Es muy ligero, apenas usa CPU/RAM.

### ¿Es seguro?
Sí. Cloudflare maneja el cifrado SSL automáticamente. Todo el tráfico está encriptado.

### ¿Funciona en producción?
Este setup está diseñado para **desarrollo**. Para producción, usa el deployment normal de Next.js.

## 🐛 Solución de Problemas

### Error: "tunnel credentials file doesn't exist"
Ejecuta de nuevo:
```bash
./setup-cloudflare-tunnel.sh
```

### El túnel no inicia
Verifica los logs:
```bash
tail -f /tmp/cloudflare-tunnel.log
```

### La URL no funciona
1. Verifica que el túnel esté corriendo: `ps aux | grep cloudflared`
2. Verifica el estado: `cloudflared tunnel info the-dev`

## 📝 Archivos Importantes

- `~/.cloudflared/config.yml` - Configuración del túnel
- `~/.cloudflared/[UUID].json` - Credenciales del túnel
- `.cloudflared-tunnel-name` - Nombre del túnel (en el proyecto)

## 🔗 Más Información

- Documentación oficial: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Dashboard de túneles: https://dash.cloudflare.com/

---

💡 **Tip:** Una vez configurado, funciona automáticamente. No necesitas hacer nada más, solo ejecutar `./start-dev.sh` como siempre.
