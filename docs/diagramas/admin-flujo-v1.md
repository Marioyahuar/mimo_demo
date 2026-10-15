---
titulo: Diagrama de flujo — Panel de administración
version: 1.0.0
fecha: 2026-10-05
fuentes:
  - src/proxy.js
  - src/lib/admin-auth.js
  - src/app/admin/login/LoginForm.jsx
  - src/app/api/admin/login/route.js
  - src/app/admin/page.jsx
  - src/app/api/admin/reservations/route.js
  - src/lib/admin-reservations.js
adrs: [ADR-0008]
---

# Panel de administración — diagrama de flujo (v1.0.0)

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-10-05 | Versión inicial: login por clave única, cookie HMAC y listado de reservas |

```mermaid
flowchart TD
    A([Dueño abre /admin o /api/admin/*]) --> P{"Proxy<br/>(src/proxy.js)<br/>¿cookie admin_session válida?"}

    P -- "Sí" --> R{¿Qué ruta?}
    P -- "No, ruta /api/" --> E401[/"401 UNAUTHORIZED (JSON)"/]
    P -- "No, ruta de página" --> L

    subgraph LOGIN ["Login (/admin/login — pública)"]
        L[Formulario: clave de acceso] --> S["POST /api/admin/login"]
        S --> C1{"¿ADMIN_PASSWORD y<br/>ADMIN_SESSION_SECRET<br/>configurados?"}
        C1 -- "No" --> E500[/"500 SERVER_MISCONFIGURED"/]
        C1 -- "Sí" --> C2{"¿password es<br/>string no vacío?"}
        C2 -- "No" --> E422[/"422 VALIDATION_ERROR"/]
        C2 -- "Sí" --> C3{"¿HMAC(clave) ==<br/>HMAC(ADMIN_PASSWORD)?<br/>tiempo constante"}
        C3 -- "No" --> E401L[/"401 INVALID_PASSWORD"/]
        C3 -- "Sí" --> TOK["Crea token exp.firmaHex<br/>HMAC-SHA256, TTL 168 h por defecto"]
        TOK --> CK["Set-Cookie admin_session<br/>httpOnly, sameSite=lax,<br/>secure en producción"]
    end

    E500 --> ERR[Muestra error en el formulario]
    E422 --> ERR
    E401L --> ERR
    ERR --> L
    CK --> RD["router.replace('/admin')"]
    RD --> R

    R -- "/admin" --> V1{"AdminPage:<br/>hasValidAdminSession()<br/>(verificación autoritativa)"}
    V1 -- "No" --> L
    V1 -- "Sí" --> Q["listReservations()<br/>Prisma → Neon Postgres<br/>orden fecha ↑, hora ↑"]
    Q --> T{¿Hay reservas?}
    T -- "No" --> T0["'Aún no hay reservas.'"]
    T -- "Sí" --> T1["Tabla: Fecha · Hora · Servicio ·<br/>Extras · Mascota · Contacto"]

    R -- "GET /api/admin/reservations" --> V2{"hasValidAdminSession()"}
    V2 -- "No" --> E401
    V2 -- "Sí" --> Q2["listReservations()"] --> J[/"200 { reservations: [...] }"/]
```

## Notas

- **Doble barrera (ADR-0008):** el Proxy es una barrera optimista; cada página/handler vuelve a verificar la sesión.
- **Sin cuentas ni roles:** una sola clave compartida (`ADMIN_PASSWORD`); la sesión dura `ADMIN_SESSION_TTL_HOURS` (por defecto 168 h).
- **Pendiente respecto al PRD:** la vista actual solo lista reservas; el botón de reenvío por WhatsApp (`wa.me`) no aparece en `src/app/admin/page.jsx`.
