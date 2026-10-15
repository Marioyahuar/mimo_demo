# ADR 0008: Autenticación de `/admin` — password + cookie de sesión firmada

## Estado

Aceptado

## Contexto

El PRD pide la protección "más simple posible" para `/admin` (una sola clave, sin sistema de
cuentas), pero exige que "nadie pueda ver los datos de los clientes en la vista admin sin
conocer la clave de acceso" — esto exige que la protección se aplique del lado del
servidor (en las API routes que devuelven datos), no solo ocultar la ruta en el cliente, que
sería trivialmente evitable golpeando el endpoint directamente.

## Decisión

- Clave única del dueño guardada como variable de entorno en Vercel (no en base de datos, no
  hay gestión de credenciales — consistente con "No alcance": sin recuperación de
  contraseña).
- `POST /api/admin/login` recibe la clave; si coincide con la env var, responde con una
  cookie `HttpOnly`, `Secure`, firmada (JWT simple o HMAC con secreto propio también en env
  var) y con expiración.
- Toda ruta bajo `/admin` (UI) y `/api/admin/*` (datos) verifica esa cookie en el servidor
  antes de renderizar o devolver datos; sin cookie válida, `401`/redirect al login — incluso
  si se golpea `GET /api/admin/reservations` directamente sin pasar por la UI.

## Alternativas consideradas

- **HTTP Basic Auth nativo** — cero UI de login a construir (prompt nativo del navegador),
  verificado en servidor contra la misma env var en cada request. Descartado por UX más
  tosca (prompt genérico sin marca) y porque cerrar sesión no tiene un mecanismo estándar
  (depende de cerrar el navegador).

## Consecuencias

- Protección real del lado del servidor que cumple el criterio de éxito del PRD (nadie ve
  datos de clientes sin la clave), con UX de "login" normal y sesión recordada entre
  visitas.
- Trade-off: agrega un secreto más a gestionar (la clave de firma del token, además de la
  clave de acceso en sí) y lógica de verificación de cookie que debe aplicarse
  consistentemente en cada ruta nueva bajo `/admin` — un endpoint nuevo que olvide la
  verificación quedaría expuesto sin protección.
