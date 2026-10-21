---
titulo: Diagrama de secuencia — Reserva de citas
version: 1.0.0
fecha: 2026-10-05
fuentes:
  - src/components/booking/ReservarCita.jsx
  - src/app/api/reservations/route.js
  - src/app/api/reservations/availability/route.js
  - src/lib/reservations.js
adrs: [ADR-0006, ADR-0007, ADR-0009, ADR-0010, ADR-0011]
---

# Reserva de citas — diagrama de secuencia (v1.0.0)

## Historial

| Versión | Fecha      | Cambio                                   |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-10-05 | Versión inicial, generada desde el código |

## Diagrama

```mermaid
sequenceDiagram
    actor C as Cliente
    participant UI as ReservarCita.jsx
    participant AV as GET /api/reservations/availability
    participant API as POST /api/reservations
    participant V as lib/reservations.js<br/>(parseReservationBody)
    participant DB as Prisma / Postgres<br/>(Reservation)

    Note over UI: emptyState() genera idempotencyKey (UUID)<br/>una vez por intento (ADR-0011)

    C->>UI: Pasos 0-2: servicio, mascota, extras
    C->>UI: Paso 3: elige fecha
    UI->>AV: GET ?date=YYYY-MM-DD
    AV->>AV: isValidDate(date)
    alt fecha inválida
        AV-->>UI: 422 VALIDATION_ERROR
    else fecha válida
        AV->>DB: findMany(date) select time
        DB-->>AV: horas ocupadas
        AV-->>UI: 200 { date, occupied[] }
        UI->>UI: deshabilita horas ocupadas<br/>y limpia time si estaba ocupada
    end
    C->>UI: elige hora
    C->>UI: Paso 4: nombre, teléfono, email
    C->>UI: Confirmar reserva

    UI->>UI: submittingRef bloquea doble toque
    UI->>API: POST JSON (servicio, mascota, fecha, hora,<br/>contacto, idempotencyKey)
    API->>V: parseReservationBody(body)
    alt body inválido
        API-->>UI: 422 VALIDATION_ERROR + fields
    else válido
        API->>API: slotToInstant(date,time) <= ahora?
        alt fecha/hora en el pasado
            API-->>UI: 422 DATE_IN_PAST
        else futura
            API->>DB: reservation.create(...)
            alt creada
                DB-->>API: row
                API-->>UI: 201 reserva serializada
            else P2002 (unique violada)
                API->>DB: findUnique(idempotencyKey)
                alt existe (reintento)
                    DB-->>API: row
                    API-->>UI: 200 reserva existente
                else no existe (otro cliente tomó el horario)
                    API-->>UI: 409 SLOT_TAKEN
                end
            else otro error
                API-->>UI: 500 INTERNAL_ERROR
            end
        end
    end

    alt 201 o 200
        UI->>C: Pantalla de confirmación<br/>+ botón WhatsApp (wa.me) si hay número
    else SLOT_TAKEN
        UI->>UI: availabilityTick++ y vuelve al paso 3
        UI->>AV: refresca horarios ocupados
        UI->>C: Mensaje de error, elegir otra hora
    else DATE_IN_PAST
        UI->>C: Error y vuelve al paso 3
    else falla de red
        UI->>C: Error NETWORK (la idempotencyKey se conserva,<br/>reintentar es seguro)
    end
```

## Notas

- **Doble booking:** lo evita una constraint única en la base de datos. La disponibilidad en UI es solo ayuda visual; el servidor decide (`409 SLOT_TAKEN`).
- **Idempotencia:** ante `P2002`, si existe una reserva con la misma `idempotencyKey` es un reintento (`200`); si no, el horario fue tomado (`409`).
- **Fuera del diagrama:** `GET /api/admin/reservations` (requiere sesión admin).
