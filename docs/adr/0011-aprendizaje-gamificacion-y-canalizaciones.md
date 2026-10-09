# ADR 0011 — Módulos, gamificación y canalizaciones

- Estado: **aceptado (2026-10-09)**. Construido: generación con IA (`lib/modulos/generar.ts`, valida cada cita y
  descarta lo inventado), revisión y publicación (`/admin/modulos`), recorrido lecciones → test → práctica
  (`/e/{slug}/modulos/{id}`), simulador con cliente (`/api/practica`), gamificación (`lib/juego.ts`) y métricas.

## Módulos (inducción y refuerzo)
- `modulos` (por puesto; `tipo` `induccion` | `refuerzo`) con `lecciones` (texto con citas), `preguntas`
  (test con explicación y cita) y `escenarios` (situaciones prácticas: la IA interpreta a un cliente).
- **"Genera la inducción con IA"**: a partir del material publicado, la IA propone el módulo con todo citado;
  RH revisa y publica (la ficha lo permite: "la IA podrá generar ejercicios a partir del módulo"). Nada
  generado llega al personal sin aprobación humana.
- **Refuerzos para personal activo**: módulos cortos cuando cambia un procedimiento, asignados por puesto.

## Gamificación (decisión de Wal: "que sea divertido y se vea en qué status está")
- **Personal**: puntos por lección, test y práctica; niveles; insignias; racha; mapa de la ruta; festejo al
  terminar un módulo. Se calcula de lo que ya registra la base (avances, intentos, prácticas).
- **Por sucursal, en agregado**: "% del equipo listo". Reto de equipo, no comparación entre personas.
- **Sin tabla pública de posiciones entre personas**: la ficha pide "evaluación de aprendizaje, sin decisiones
  automatizadas de contratación o desempeño"; un ranking individual se leería como evaluación de desempeño.

## Privacidad de la evaluación (lo hace cumplir la RLS)
- El resultado del test (`intentos`) solo lo ve quien lo hizo.
- RH/supervisores ven **avance** (quién terminó qué lección) y **agregados**: dificultad por pregunta
  (`dificultad_del_test`), huecos del material (`huecos_del_material`) y exactitud del asistente
  (`metricas_asistente`). Nunca consultas una por una con el nombre de quien preguntó.

## Canalizaciones
Cuando el asistente marca `[CANALIZAR:supervisor|rh]`, se crea una canalización que llega **en vivo** a la
bandeja "Dudas del equipo" (Supabase Realtime con RLS: un supervisor ve su sucursal). La respuesta le aparece
a quien preguntó en su Inicio. Las preguntas que se repiten sin respuesta son **huecos del material**: el
panel de RH dice qué falta documentar.

## Límites conocidos
- El test se califica en el servidor y la página no trae las respuestas, pero la API de datos sí deja leer
  `preguntas.correcta` a un miembro con sesión. Para una evaluación de aprendizaje sin consecuencias es
  aceptable; si un día cuenta para algo, se mueve la calificación a una función `security definer`.
- El módulo sembrado de Del Río (`conocimiento/del-rio/modulo-induccion.json`) es de ejemplo y sirve de
  respaldo de la demo; con el material real se genera con IA desde la app.
