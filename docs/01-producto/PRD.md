---
title: "Sistema de reservas — Mimo Pet Spa"
---

# PRD: Sistema de reservas — Mimo Pet Spa

## Problema

Hoy las reservas de citas se coordinan por WhatsApp, chat por chat. Eso genera que el dueño
del spa pierda tiempo revisando mensajes dispersos, se olvide de reservas, no tenga
visibilidad de un calendario único y termine cruzando citas (doble booking), lo cual le
genera problemas reales con clientes.

## Usuario objetivo

Dos perfiles:

- **Cliente que reserva**: dueño de una mascota, reserva desde su celular en un momento
  suelto (no tiene cuenta, no necesita login).
- **Admin (dueño del spa)**: la misma persona que hoy coordina todo por WhatsApp, necesita
  ver en un solo lugar todas las reservas próximas para evitar cruces de horario.

<!-- REVISAR: se asume que el dueño del spa es la única persona que administra (sin staff
adicional ni recepcionista); si en el futuro hay más personal, esta sección necesita roles
y permisos distintos. -->

## Objetivo / resultado esperado

Outcome híbrido — de tarea completada y de reducción de errores operativos:

- El cliente completa la reserva de principio a fin sin necesitar escribir por WhatsApp
  para coordinar horario.
- El dueño del spa ve todas las reservas en un único lugar (no dispersas en chats), lo que
  elimina los cruces de horario.

## Alcance (qué sí incluye esta versión)

- Flujo de reserva ya existente en la UI (`ReservarCita.jsx`) conectado a **persistencia
  real y compartida** (hoy la confirmación solo vive en memoria y se pierde al refrescar).
- Toda reserva confirmada queda guardada de forma permanente, accesible desde cualquier
  dispositivo o sesión — no solo en el navegador donde se hizo. Esto requiere que exista un
  backend/servidor con base de datos detrás del sitio; no es opcional ni un detalle de
  implementación, es un requisito funcional de esta versión.
  <!-- REVISAR: el PRD no elige tecnología a propósito (se mantiene funcional); la elección
  concreta de backend/DB queda para el diseño técnico. -->
- Validación de horario: no permitir confirmar una reserva en una fecha+hora que ya esté
  ocupada por otra reserva existente, sin importar desde qué dispositivo se hizo esa otra
  reserva.
- Vista de administración (nueva ruta, ej. `/admin`) que lista todas las reservas guardadas,
  ordenadas por fecha y hora, para que el dueño detecte cruces de un vistazo, viendo también
  las reservas hechas por clientes desde sus propios dispositivos.
- Esa vista de administración debe estar protegida: solo el dueño puede entrar a ver los
  datos de sus clientes, con la forma de protección más simple posible (por ejemplo, pedir
  una contraseña única antes de mostrar el contenido). No hace falta un sistema de cuentas
  ni de usuarios múltiples.
  <!-- REVISAR: el PRD no elige el mecanismo técnico exacto a propósito; "lo más simple
  posible" queda para el diseño técnico, siempre que cumpla que nadie sin la contraseña/clave
  pueda ver los datos de clientes. -->
- Botón/enlace para reenviar la reserva confirmada por WhatsApp (deep link `wa.me` con
  mensaje prellenado), como respaldo del canal que ya se usa hoy.

## No alcance (qué explícitamente no incluye esta versión)

- No incluye un sistema de cuentas ni de múltiples usuarios/roles para administración (solo
  una clave o contraseña única para el dueño).
- No incluye recuperación de contraseña ni gestión de credenciales (si se pierde, se
  restablece manualmente fuera del producto).
- No incluye notificaciones automáticas por email o SMS (solo el enlace manual a WhatsApp).
- No incluye pagos ni señas online.
- No incluye gestión de múltiples groomers/staff ni asignación de citas a personas
  específicas.
- No incluye recordatorios automáticos antes de la cita.

## Criterios de éxito

- El cliente completa el flujo (servicio → mascota → extras → fecha/hora → contacto →
  confirmación) sin salir de la página ni coordinar por WhatsApp.
- 0 reservas dobles en el mismo slot: el sistema bloquea u oculta horarios ya ocupados.
- Al recargar la página, cerrar el navegador o volver desde otro dispositivo, las reservas
  hechas antes siguen existiendo y son visibles en la vista admin (no se pierden nunca por
  un motivo que no sea una decisión explícita de borrarlas).
- El dueño del spa puede ver, en una sola pantalla, todas las reservas próximas ordenadas
  por fecha/hora, sin importar desde qué dispositivo las haya hecho cada cliente.
- Nadie puede ver los datos de los clientes en la vista admin sin conocer la clave de
  acceso.

## Casos borde a contemplar

- Dos clientes, desde dispositivos distintos, intentan reservar el mismo slot casi al mismo
  tiempo → solo una de las dos reservas debe quedar confirmada; la otra debe detectar el
  conflicto y pedir elegir otro horario.
- El cliente llena el formulario y cierra la pestaña antes de confirmar → no debe quedar
  ninguna reserva a medias guardada.
- El cliente deja la pestaña abierta mucho tiempo y confirma una fecha/hora que ya pasó →
  validar contra la hora actual al momento de confirmar, no solo al cargar el formulario.
- El cliente reserva desde un dispositivo y el dueño revisa desde otro → el dueño debe ver
  esa reserva igual, sin depender de qué dispositivo se usó para crearla.

## Supuestos y riesgos abiertos

**Supuestos:**

- La persistencia real (que las reservas no se pierdan y sean visibles desde cualquier
  dispositivo) es un requisito no negociable de esta versión, aunque el PRD no elija la
  tecnología concreta para lograrlo.
- El dueño del spa es la única persona que administra las reservas, sin roles ni permisos.
- No se requiere sincronización en tiempo real (ver una reserva nueva al instante); alcanza
  con que al recargar o volver a entrar la información esté actualizada.

**Riesgos:**

- Introducir un backend/base de datos agrega complejidad y tiempo de desarrollo que antes
  no existía en el proyecto (hoy es un sitio 100% frontend); hay que dimensionar ese
  esfuerzo en el diseño técnico.
- Al no haber notificaciones automáticas, el dueño puede no enterarse de una reserva nueva
  si no entra manualmente a la vista admin.
- Una protección "lo más simple posible" (ej. una sola clave compartida) es más débil que un
  sistema de cuentas real — aceptable para esta versión, pero a revisar si el spa crece o
  suma personal.
