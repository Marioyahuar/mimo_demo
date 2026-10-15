# ADR 0011: Idempotencia en la creación de reserva — clave de idempotencia por intento

## Estado

Aceptado — enmienda [[0007]] (traducción del error de constraint a respuesta HTTP) y
[[0009]] (reintento manual del cliente). No reemplaza a ninguno de los dos.

## Contexto

[[0009]] descarta el retry automático con un argumento correcto: *"una cola mal hecha
reintentando un `POST` no idempotente es peor que no tener cola"*. Y acto seguido prescribe
exactamente el mismo reintento, en forma manual: *"si el `POST` falla por red, el usuario ve
un error y puede volver a tocar Confirmar reserva"*. El `POST` sigue sin ser idempotente, así
que el problema no desapareció: se le delegó al usuario.

Secuencia concreta, con el perfil móvil que describe el PRD ("reserva desde su celular en un
momento suelto"):

1. El cliente toca "Confirmar reserva" en una red 4G inestable.
2. El `INSERT` **tiene éxito** en Neon. La reserva existe.
3. La respuesta se pierde de vuelta. El frontend muestra error de red.
4. El cliente vuelve a tocar "Confirmar reserva", tal como [[0009]] indica.
5. Segundo `INSERT` con la misma fecha/hora → violación del `UNIQUE (date, time)` de [[0007]].
6. La API responde `409 SLOT_TAKEN` y, según los criterios de aceptación del TDD v1, el
   frontend *"vuelve al paso de fecha/hora mostrando el conflicto"*.

Resultado: **al cliente se le dice que otro le ganó el horario, cuando el horario es suyo y
su reserva ya está confirmada.** O se va creyendo que no reservó, o reserva un segundo slot
que no necesita y el dueño termina con una cita fantasma — el problema operativo que el PRD
quería eliminar.

El mismo síntoma se produce sin falla de red, con un doble tap sobre el botón: hoy
`ReservarCita.jsx` no deshabilita "Confirmar reserva" mientras hay un request en vuelo.

Vale notar que [[0007]] anticipó la mitad del problema en su propio trade-off: *"si en el
futuro se agregan otras constraints únicas a la tabla, hay que distinguirlas explícitamente
para no confundir un conflicto de horario con otro tipo de violación"*. Este ADR agrega
precisamente esa segunda constraint, y con ella la obligación de distinguir.

## Decisión

- **Nueva columna** en `reservations` ([[0005]]): `idempotency_key uuid NOT NULL UNIQUE`.

- **El cliente genera la clave una sola vez por intento de reserva**, con
  `crypto.randomUUID()`, en `emptyState()` de `ReservarCita.jsx`. La clave **no** se
  regenera entre reintentos del mismo `POST`; sólo se regenera en `resetFlow()` (es decir,
  cuando el usuario toca "Reservar otra cita" y empieza una reserva genuinamente nueva). Se
  envía en el body de `POST /api/reservations`.

- **El servidor intenta el `INSERT` directamente**, conservando la filosofía de [[0007]] (sin
  chequeo previo). Ante un error de constraint única (`P2002` en Prisma, [[0004]]), en vez de
  inferir la causa por el nombre del índice, resuelve así:

  1. `SELECT` por `idempotency_key`.
  2. **Si existe** → esa fila es la reserva del propio usuario: responder `200 OK` con la
     reserva almacenada (replay idempotente). No es un error.
  3. **Si no existe** → el conflicto es de horario: responder `409 { error: "SLOT_TAKEN" }`,
     igual que en v1.

  El orden importa: consultar la clave primero es lo que hace el resultado determinista.
  Decidir por el nombre del índice violado sería frágil, porque cuando ambas constraints
  chocan a la vez Postgres reporta sólo una, y no necesariamente la que corresponde.

- **El contrato de `POST /api/reservations` pasa a tener dos respuestas de éxito**: `201` si
  la reserva se creó en esta llamada, `200` si es el replay de una llamada anterior. El
  frontend trata ambas igual: pantalla de confirmación.

- **El botón "Confirmar reserva" se deshabilita mientras hay un request en vuelo**, y se
  rehabilita al recibir respuesta o error. Esto no reemplaza la clave de idempotencia (no
  protege contra la falla de red, que ocurre entre requests distintos), la complementa para
  el caso del doble tap.

## Alternativas consideradas

- **Que el frontend, ante `409 SLOT_TAKEN`, consulte si la reserva es suya** (por ejemplo
  buscando por teléfono + fecha + hora antes de mostrar el conflicto) — evitaría la columna
  nueva, pero requiere un endpoint público de consulta por datos de contacto, que expondría
  información de clientes a cualquiera que adivine un teléfono. Descartada: agrega una fuga
  de datos para resolver algo que una columna resuelve sin exponer nada.

- **Usar un hash del payload como clave de idempotencia** en lugar de un UUID del cliente —
  no necesita que el cliente genere ni conserve nada. Descartada porque colisiona con un caso
  legítimo: dos mascotas de la misma familia, mismos datos de contacto, reservadas para el
  mismo servicio en días distintos, pueden producir payloads que difieren poco, y cualquier
  cambio de un campo irrelevante (una coma en las notas) rompe el reintento. Un UUID
  explícito expresa "este es el mismo intento" sin depender del contenido.

- **No hacer nada y aceptar el falso `SLOT_TAKEN`** — defendible para una POC si el costo
  fuera alto. No lo es: una columna, un `SELECT` en el camino de error, y `crypto.randomUUID()`
  en el cliente. El costo de no hacerlo lo paga el dueño del spa en citas fantasma, que es
  justo el problema que el PRD quiere eliminar.

## Consecuencias

- El reintento manual que [[0009]] prescribe pasa a ser seguro: repetir el `POST` no crea una
  segunda reserva ni reporta un conflicto falso.
- `409 SLOT_TAKEN` recupera su significado real — a partir de acá siempre quiere decir "otra
  persona tomó ese horario", nunca "vos ya lo tomaste".
- Trade-off: el replay devuelve **la reserva almacenada, no el payload de la segunda
  llamada**. Si el usuario reintentara con datos distintos bajo la misma clave, los cambios
  se ignoran en silencio. Es el comportamiento correcto para un replay, pero significa que la
  clave debe regenerarse en `resetFlow()` sin falta; si eso se olvida, el segundo "Reservar
  otra cita" de la misma sesión devolvería la reserva vieja en vez de crear una nueva, y el
  usuario vería una confirmación con datos que no cargó. Es un fallo silencioso, no un error
  visible.
- Trade-off: la tabla queda con dos constraints únicas, así que todo manejo futuro de `P2002`
  en este endpoint tiene que pasar por la desambiguación descrita, no por un `catch` genérico.
- Trade-off menor: se agrega un `SELECT` extra, pero sólo en el camino de error (conflicto de
  constraint), nunca en el camino feliz.
