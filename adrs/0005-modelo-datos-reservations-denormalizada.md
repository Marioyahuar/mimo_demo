# ADR 0005: Modelo de datos — tabla `reservations` denormalizada

## Estado

Aceptado

## Contexto

El flujo actual (`ReservarCita.jsx`) captura, en un solo formulario sin cuentas ni login:
servicio elegido, datos de la mascota (nombre, raza, tamaño, notas), extras seleccionados,
fecha/hora, y datos de contacto (nombre, teléfono, email). No hay Design.md disponible para
este proyecto; el modelo se deriva del PRD y de los campos ya existentes en la UI. El
catálogo de servicios/extras (`src/data/content.js`) sigue siendo configuración estática del
frontend — no hay requisito de administrarlo dinámicamente, y el skill
`agregar-servicio-spa` ya cubre agregar servicios ahí — por lo que no se modela como tabla.

## Decisión

Una sola tabla `reservations` denormalizada, sin entidades `clients` / `pets` /
`services` separadas:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid (PK, default gen_random_uuid()) | |
| `service_title` | text | snapshot del título del servicio elegido |
| `service_price_label` | text | snapshot del precio mostrado al reservar (ej. "Desde $42") |
| `extras` | text[] | snapshot de títulos de extras elegidos |
| `pet_name` | text | |
| `pet_breed` | text | |
| `pet_size` | text | |
| `pet_notes` | text, nullable | |
| `date` | date | |
| `time` | text | uno de los slots fijos definidos en `content.js` |
| `contact_name` | text | |
| `contact_phone` | text | |
| `contact_email` | text | |
| `created_at` | timestamptz, default now() | |

Constraint `UNIQUE (date, time)` — ver [[0007]].

## Alternativas consideradas

- **Tablas normalizadas `clients`, `pets`, `services`, `reservations`** — más "correcto"
  relacionalmente y preparado para reconocer clientes/mascotas recurrentes o reportar
  histórico por mascota. Descartado por sobre-ingeniería: no hay cuentas ni login (el PRD
  lo excluye explícitamente de "No alcance"), no se pidió histórico por cliente, y cada
  reserva es un evento autocontenido sin necesidad de reutilizar datos entre reservas.

## Consecuencias

- Modelo simple de razonar, sin joins, alineado 1:1 con el formulario existente — el mapeo
  entre el estado de `ReservarCita.jsx` y la fila de `reservations` es directo.
- Trade-off: si en el futuro se quisiera reconocer clientes recurrentes, ver historial por
  mascota, o administrar el catálogo de servicios dinámicamente, habría que migrar estos
  datos denormalizados a tablas relacionadas — hoy no es un requisito, pero es el costo
  aceptado de esta simplicidad.
