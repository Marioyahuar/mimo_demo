## ADDED Requirements

### Requirement: Login emite una cookie de sesión firmada
`POST /api/admin/login` SHALL comparar la clave recibida con `ADMIN_PASSWORD` y, si coincide, responder `200` con una cookie `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` en producción, firmada con HMAC usando `ADMIN_SESSION_SECRET` y con expiración (`ADMIN_SESSION_TTL_HOURS`, default 168).

#### Scenario: Clave correcta
- **WHEN** se envía `POST /api/admin/login` con la clave correcta
- **THEN** responde `200` y un `Set-Cookie` con los atributos `HttpOnly` y `SameSite=Lax` (y `Secure` en producción)

#### Scenario: Clave incorrecta
- **WHEN** se envía una clave incorrecta
- **THEN** responde `401` `{ "error": "INVALID_PASSWORD" }` sin `Set-Cookie`

#### Scenario: Falta la clave en el body
- **WHEN** el body no trae `password` como string no vacío
- **THEN** responde `422` `{ "error": "VALIDATION_ERROR" }` sin cookie

#### Scenario: Servidor sin configurar
- **WHEN** `ADMIN_PASSWORD` o `ADMIN_SESSION_SECRET` no están definidas
- **THEN** el login responde `500` y no emite cookie

### Requirement: Las cookies inválidas o vencidas no otorgan acceso
El sistema SHALL rechazar cookies con firma incorrecta, mal formadas o expiradas.

#### Scenario: Cookie manipulada
- **WHEN** se presenta una cookie con firma alterada o expiración modificada
- **THEN** se trata como sin sesión

#### Scenario: Cookie expirada
- **WHEN** la expiración firmada es anterior al instante actual
- **THEN** se trata como sin sesión

### Requirement: API de admin protegida en el servidor
Toda ruta bajo `/api/admin/*` salvo `/api/admin/login` SHALL responder `401` sin datos cuando no hay cookie de sesión válida, incluso al golpear el endpoint directamente.

#### Scenario: Listado sin cookie
- **WHEN** `GET /api/admin/reservations` se llama sin cookie
- **THEN** responde `401` y el cuerpo no contiene datos de clientes

#### Scenario: Listado con cookie manipulada
- **WHEN** se llama con una cookie de firma inválida
- **THEN** responde `401`

### Requirement: Listado de reservas ordenado
`GET /api/admin/reservations` con sesión válida SHALL responder `200` con todas las reservas guardadas ordenadas por fecha ascendente y, dentro de la misma fecha, por hora ascendente.

#### Scenario: Orden
- **WHEN** existen reservas insertadas en desorden y se llama con sesión válida
- **THEN** la lista llega ordenada por `date` y luego `time` ascendente

### Requirement: UI de admin protegida
`/admin` SHALL mostrar el listado solo con sesión válida; sin ella SHALL redirigir a `/admin/login` sin renderizar datos. `/admin/login` SHALL ofrecer un formulario de clave que, al autenticar, lleva a `/admin`.

#### Scenario: Visita sin sesión
- **WHEN** se navega a `/admin` sin cookie válida
- **THEN** la respuesta redirige a `/admin/login` y no incluye datos de clientes

#### Scenario: Visita con sesión
- **WHEN** se navega a `/admin` con cookie válida
- **THEN** se renderiza la tabla de reservas (o un estado vacío si no hay ninguna)

#### Scenario: Clave incorrecta en el formulario
- **WHEN** se envía una clave incorrecta en `/admin/login`
- **THEN** se muestra un mensaje de error y no se navega a `/admin`
