import { APP_URL } from '../constants'

export function abrirWhatsApp(telefono: string, numeroOrden: number, nombreCliente?: string) {
  const mensaje = encodeURIComponent(
    `Hola${nombreCliente ? ` ${nombreCliente}` : ''}, tu equipo ha sido recibido con el número de orden: ${numeroOrden}.\n\n` +
    `Puedes consultar el estado de tu reparación en cualquier momento aquí:\n${APP_URL}/consulta/${numeroOrden}\n\n` +
    `Gracias por confiar en nosotros.`
  )

  const phoneClean = telefono.replace(/\D/g, '')
  const url = `https://wa.me/52${phoneClean}?text=${mensaje}`

  window.open(url, '_blank')
}

export function abrirWhatsAppDiagnostico(
  telefono: string,
  numeroOrden: number,
  costoReparacion: number,
  nombreCliente?: string
) {
  const mensaje = encodeURIComponent(
    `Hola${nombreCliente ? ` ${nombreCliente}` : ''}, te informamos sobre tu orden ${numeroOrden}.\n\n` +
    `El diagnóstico de tu equipo ha sido completado.\n` +
    `Costo de reparación: $${costoReparacion.toFixed(2)} MXN\n\n` +
    `¿Deseas autorizar la reparación?\n\n` +
    `Puedes consultar más detalles aquí:\n${APP_URL}/consulta/${numeroOrden}`
  )

  const phoneClean = telefono.replace(/\D/g, '')
  const url = `https://wa.me/52${phoneClean}?text=${mensaje}`

  window.open(url, '_blank')
}

export function abrirWhatsAppListo(
  telefono: string,
  numeroOrden: number,
  nombreCliente?: string
) {
  const mensaje = encodeURIComponent(
    `Hola${nombreCliente ? ` ${nombreCliente}` : ''}, ¡buenas noticias! 🎉\n\n` +
    `Tu equipo de la orden ${numeroOrden} ya está listo para ser retirado.\n\n` +
    `Puedes pasar a recogerlo en nuestro horario de atención.\n\n` +
    `Gracias por tu preferencia.`
  )

  const phoneClean = telefono.replace(/\D/g, '')
  const url = `https://wa.me/52${phoneClean}?text=${mensaje}`

  window.open(url, '_blank')
}
