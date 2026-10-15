# business-time Specification

## Purpose
Define la zona horaria fija del negocio y las únicas operaciones permitidas para obtener el día actual del negocio y convertir una hora de pared de un slot en un instante real.

## Requirements

### Requirement: Zona horaria del negocio única y compartida
El sistema SHALL definir una única constante de zona horaria del negocio, con valor `America/Lima`, importable tanto desde código de cliente como de servidor.

#### Scenario: Valor de la constante
- **WHEN** se consulta la zona horaria del negocio
- **THEN** su valor es `America/Lima`

### Requirement: Día actual del negocio
El sistema SHALL proveer una operación que devuelva la fecha actual en la zona del negocio con formato `YYYY-MM-DD`, independiente de la zona del entorno de ejecución.

#### Scenario: Cerca de medianoche UTC
- **WHEN** el instante actual es 2026-03-11T02:00:00Z (21:00 del 10 de marzo en Lima)
- **THEN** la operación devuelve `2026-03-10`

#### Scenario: Entorno en otra zona
- **WHEN** el proceso corre con otra zona horaria (por ejemplo `TZ=Asia/Tokyo`)
- **THEN** el resultado sigue siendo la fecha de Lima

### Requirement: Conversión de slot a instante
El sistema SHALL proveer una operación que, dados `date` (`YYYY-MM-DD`) y `time` (`HH:mm`, 24h), devuelva el instante UTC real correspondiente a esa hora de pared en la zona del negocio, resolviendo el offset del día concreto.

#### Scenario: Slot en Lima
- **WHEN** se convierte `2026-03-10` y `16:30`
- **THEN** el instante es 2026-03-10T21:30:00.000Z

#### Scenario: Slot de hoy más tarde no se considera pasado
- **WHEN** son las 14:00 en Lima (19:00 UTC) y se convierte el slot de hoy `16:30`
- **THEN** el instante resultante es posterior al instante actual

#### Scenario: Zona con horario de verano
- **WHEN** la lógica de offset se evalúa para una zona con DST
- **THEN** el offset aplicado corresponde al día concreto, no a uno fijo

### Requirement: Entrada inválida se rechaza
La operación de conversión SHALL lanzar un error cuando `date` o `time` no tengan el formato esperado, en lugar de devolver un instante incorrecto.

#### Scenario: Formato inválido
- **WHEN** se convierte `2026-3-10` o `25:00`
- **THEN** se lanza un error

### Requirement: Date picker usa el día del negocio
El date picker del flujo de reserva SHALL usar el día actual del negocio como fecha mínima seleccionable.

#### Scenario: Navegador en otra zona
- **WHEN** el cliente abre el flujo en una zona distinta a Lima
- **THEN** el primer día seleccionable es la fecha actual de Lima
