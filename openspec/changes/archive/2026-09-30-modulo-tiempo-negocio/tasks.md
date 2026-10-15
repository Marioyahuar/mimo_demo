## 1. Módulo de tiempo

- [x] 1.1 Crear `src/lib/time.js` con `BUSINESS_TIMEZONE`, `todayInBusinessTz()` y `slotToInstant()` (con validación de formato)
- [x] 1.2 Verificar con script de Node los escenarios del spec (Lima, medianoche UTC, TZ distinta, DST con zona de prueba, formato inválido)

## 2. Integración en el frontend

- [x] 2.1 Reemplazar el cálculo inline de `today` en `ReservarCita.jsx` por `todayInBusinessTz()`

## 3. Verificación

- [x] 3.1 `npm run build` exitoso
