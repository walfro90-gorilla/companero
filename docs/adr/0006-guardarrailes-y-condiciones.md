# ADR 0006 — Guardarraíles y condiciones de uso

- Estado: **aceptado (2026-10-08)**. Traduce las condiciones de uso de Del Río a reglas del sistema.

## Condiciones de Del Río → cómo se cumplen
| Condición | Regla en el prototipo |
|---|---|
| Usar solo materiales autorizados | El avatar responde **solo** con el corpus de `conocimiento/` (ADR 0004). Toda afirmación sobre un procedimiento lleva cita `[Dn-m]`; sin cita válida no se presenta como procedimiento. |
| Sin datos personales, contraseñas ni credenciales | No hay login ni campos de nombre. Si el usuario escribe una contraseña, un número de tarjeta o datos de un cliente, el avatar no los repite, pide no compartirlos y no se guardan. Lo que se guarda en Supabase es anónimo (sin nombre, sin IP). |
| No inventar políticas | Instrucción del sistema + validación de citas + canalización. Ante falta de información o ambigüedad: "Eso no viene en tu material de inducción" y `[CANALIZAR:…]`. Nunca rellenar con "lo usual en tiendas". |
| No ejecutar operaciones de caja | El avatar explica; no ejecuta, no autoriza ni "aprueba" cancelaciones, devoluciones ni descuentos. No tiene herramientas que toquen sistemas. |
| Evaluación de aprendizaje, sin decisiones automatizadas | El test da retroalimentación y explica cada respuesta; no hay calificación aprobatoria/reprobatoria por persona, ranking ni reporte individual a RH. Las métricas del piloto son agregadas y anónimas. |

## Cuándo canalizar (lista inicial; se ajusta con el material real)
- **Supervisor**: lo que el material diga que requiere autorización; diferencias de efectivo; situaciones con
  clientes que escalan; cualquier cosa que implique dinero, seguridad o una excepción a la regla.
- **RH**: horarios, pagos, permisos, prestaciones, contratos y cualquier tema laboral fuera del módulo.
- **Cualquier pregunta sin sustento** en el corpus, aunque parezca fácil.

## Proveedores y privacidad
- Los materiales viajan a **Anthropic** y **Groq**: ninguno entrena con datos de API; en Groq conviene activar
  Zero Data Retention en Data Controls (acción de Wal en la consola).
- **Pendiente**: confirmar con Del Río/organización que sus materiales pueden enviarse a estos proveedores
  (el manual del hacker lo pide explícitamente). Hasta confirmar, solo se envía el contenido de ejemplo.
