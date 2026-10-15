# reservations-data Specification

## Purpose
Define el modelo de datos persistente y compartido de las reservas del spa, y la conexión a la
base de datos que lo respalda, como fundamento sobre el cual los endpoints de la API (backlog
#4, #6) leen y escriben sin riesgo de reservas dobles ni de datos perdidos.

## Requirements

### Requirement: Almacenamiento persistente y compartido de reservas
El sistema SHALL persistir cada reserva en una tabla `reservations` en una base de datos Postgres
compartida (Neon), de forma que sobreviva a refrescos de página, reinicios de la aplicación y sea
legible desde cualquier dispositivo o sesión que consulte la base de datos.

#### Scenario: Una reserva escrita es legible desde otra conexión
- **WHEN** se inserta una fila en `reservations` a través de una conexión a la base de datos
- **THEN** una consulta posterior usando una conexión distinta devuelve esa fila con todos sus
  campos intactos

### Requirement: Esquema denormalizado de `reservations`
El sistema SHALL definir la tabla `reservations` con las columnas: `id` (uuid, PK), `service_title`
(texto), `service_price_label` (texto), `extras` (arreglo de texto), `pet_name` (texto),
`pet_breed` (texto), `pet_size` (texto), `pet_notes` (texto, nullable), `date` (fecha), `time`
(texto), `contact_name` (texto), `contact_phone` (texto), `contact_email` (texto), `created_at`
(timestamp con zona horaria), sin tablas relacionadas separadas para clientes, mascotas o
servicios.

#### Scenario: pet_notes es opcional
- **WHEN** se inserta una reserva sin especificar `pet_notes`
- **THEN** la fila se guarda con `pet_notes` en null, sin error

#### Scenario: campos obligatorios se exigen
- **WHEN** se intenta insertar una reserva omitiendo un campo obligatorio (por ejemplo
  `contact_phone`)
- **THEN** la base de datos rechaza el insert

### Requirement: Un único horario por reserva confirmada
El sistema SHALL impedir, a nivel de base de datos, que existan dos filas de `reservations` con
la misma combinación de `date` y `time`, sin depender de una validación previa en la capa de
aplicación.

#### Scenario: Inserts concurrentes al mismo horario
- **WHEN** dos inserts que apuntan a la misma `date` y `time` se intentan de forma casi
  simultánea desde conexiones distintas
- **THEN** como máximo uno de los dos inserts tiene éxito; el otro es rechazado por la base de
  datos por violación de una restricción de unicidad

### Requirement: Clave de idempotencia única por intento de reserva
El sistema SHALL almacenar en cada reserva una `idempotency_key` (uuid) obligatoria y SHALL
impedir, a nivel de base de datos, que existan dos filas con la misma `idempotency_key`.

#### Scenario: Clave de idempotencia duplicada
- **WHEN** dos inserts usan el mismo valor de `idempotency_key`, aunque tengan `date`/`time`
  distintos
- **THEN** el segundo insert es rechazado por la base de datos por violación de una restricción
  de unicidad

### Requirement: Esquema reproducible vía migraciones versionadas
El sistema SHALL definir el esquema de `reservations` mediante migraciones versionadas que, al
aplicarse sobre una base de datos Neon vacía, produzcan un esquema idéntico y listo para aceptar
reservas.

#### Scenario: Bootstrap de una base de datos nueva
- **WHEN** se aplican las migraciones del proyecto sobre una base de datos Neon vacía
- **THEN** el esquema resultante contiene la tabla `reservations` con todas sus columnas y
  restricciones de unicidad, capaz de aceptar un insert válido

### Requirement: Conexión compatible con funciones serverless
El sistema SHALL exponer un cliente de base de datos que funcione correctamente dentro de
funciones serverless de Vercel, sin depender de un pool de conexiones TCP persistente entre
invocaciones.

#### Scenario: Consulta desde una invocación fría
- **WHEN** se ejecuta una consulta desde una invocación serverless nueva, sin estado de conexión
  previo
- **THEN** la consulta se completa correctamente sin agotar el límite de conexiones concurrentes
  de la base de datos
