# ADR 0010: Zona horaria — hora de pared del negocio con zona fija

## Estado

Aceptado — enmienda [[0005]] (semántica de `date` / `time`) y [[0009]] (validación
`DATE_IN_PAST`). No reemplaza a ninguno de los dos; ambos siguen vigentes en todo lo demás.

## Contexto

El diseño original ([[0009]]) exige re-validar en el servidor que la fecha+hora no haya
pasado, "comparada contra la hora del servidor". Pero ni [[0005]] ni [[0009]] definen en qué
zona horaria se interpretan las columnas `date` y `time`.

Las funciones serverless de Vercel ([[0002]]) corren en **UTC**, y Neon ([[0001]]) también.
El spa opera en hora local. Sin una zona definida, la comparación `date + time` contra
`now()` se hace mezclando hora local de pared con un instante UTC, y el error es exactamente
el offset de la zona.

Falla concreta observada en el diseño v1: son las 14:00 locales (19:00 UTC) y el cliente
confirma el slot de las 16:30 de hoy — 2.5 h en el futuro. El servidor compara `16:30`
contra `19:00` y responde `DATE_IN_PAST`. **Se rechazan reservas válidas durante las últimas
horas de cada día**, justo la franja en que alguien reserva "para hoy más tarde". Con offsets
positivos el error se invierte y se aceptan slots ya pasados.

El mismo defecto ya existe en el frontend: `ReservarCita.jsx` calcula el `min` del date
picker con `new Date().toISOString().split('T')[0]`, que devuelve la fecha **UTC**, no la
local. El TDD v1 decía "ya implementado en la UI actual, se conserva" — conservaba el bug.

## Decisión

- **Una única constante de zona horaria del negocio**, `BUSINESS_TIMEZONE`, definida en un
  módulo compartido (`src/lib/time.js`) importado tanto por el frontend como por las API
  routes. Valor inicial: `'America/Lima'`.
  Confirmado con el dueño del spa (2026-10-04): Lima, Perú.

- **`date` y `time` siguen almacenando hora de pared del negocio**, sin cambio de tipos
  respecto de [[0005]] (`date date`, `time text` con formato `HH:mm` 24h, el mismo que
  produce `booking.slots` en `content.js`). No se almacena un instante UTC.

- **La conversión a instante ocurre sólo al comparar**, nunca al guardar. El módulo
  compartido expone dos helpers, única vía permitida para razonar sobre tiempo:
  - `todayInBusinessTz()` → `'YYYY-MM-DD'` del día actual en la zona del negocio. Lo usa el
    date picker para su `min`, reemplazando el cálculo en UTC actual.
  - `slotToInstant(date, time)` → el `Date` (instante UTC real) que corresponde a esa hora de
    pared en la zona del negocio, resolviendo el offset del día concreto vía
    `Intl.DateTimeFormat` (con lo cual queda correcto también en zonas con horario de verano,
    aunque `America/Lima` hoy no lo tenga).

- **`POST /api/reservations` valida** `slotToInstant(date, time) <= Date.now()` →
  `422 { error: "DATE_IN_PAST" }`. La hora de referencia es la del servidor, como en
  [[0009]]; lo que cambia es que el otro lado de la comparación ahora es un instante real y
  no un string de hora de pared.

## Alternativas consideradas

- **Almacenar un único `timestamptz` en vez de `date` + `time`** — es la representación
  canónica y elimina la conversión por completo. Descartada porque cambia la semántica del
  dato de forma indeseada: el slot de un spa es una **hora de pared** ("las 10:00 del
  martes"), no un instante. Si la zona legal del país cambiara de offset, una reserva futura
  guardada como instante se correría de hora sola, mientras que el cliente y el dueño
  esperan que siga siendo "las 10:00". Además rompería el `UNIQUE (date, time)` de [[0007]]
  y la ordenación del listado de admin, que hoy funcionan sobre hora de pared.

- **Zona horaria por reserva (columna `timezone` en la tabla)** — necesaria si el spa tuviera
  sucursales en zonas distintas. Sobre-ingeniería acá: hay un solo local y el PRD excluye
  explícitamente la gestión de múltiples groomers o sedes.

- **Fijar `TZ=America/Lima` como variable de entorno del runtime de Vercel** — haría que
  `new Date()` en el servidor ya devolviera hora local, sin helpers. Descartada porque no
  alcanza al frontend (corre en el navegador del cliente, con la zona que el cliente tenga),
  con lo cual el `min` del date picker seguiría roto y habría dos fuentes de verdad sobre la
  zona. Una constante compartida cubre ambos lados con una sola definición.

## Consecuencias

- El cálculo de "ya pasó" queda correcto en ambos lados, y el date picker deja de correr el
  día para los clientes que reservan de noche.
- `date`/`time` conservan su significado de hora de pared, con lo cual `UNIQUE (date, time)`
  ([[0007]]) y el `ORDER BY date, time` del admin siguen válidos sin cambios.
- Trade-off: la corrección depende de que **nadie construya un `Date` a partir de `date`
  y `time` fuera de los helpers**. Un `Date` armado a mano en cualquier archivo vuelve a
  introducir el bug silenciosamente, sin fallar ni en build ni en tests. Es una convención
  sostenida por disciplina, no por el tipo de dato — que es exactamente el costo que se
  paga por no migrar a `timestamptz`.
- Trade-off heredado: los helpers asumen que `time` viene en `HH:mm` bien formado. Esa
  suposición ya estaba en [[0005]] y no se refuerza acá (sigue sin `CHECK` ni validación de
  pertenencia al catálogo de slots); este ADR no la corrige, sólo la hereda.
