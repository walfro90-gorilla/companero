# Prueba de estrés en producción

**Cuándo:** sábado 10-oct-2026, 12:55 (hora de Cd. Juárez), contra **https://companero-ten.vercel.app**, con el commit
`5967920`.
**Quién:** la sesión de despliegue y verificación ("Bart"), por pedido de Wal: «ya no cambiaremos nada, solo asegurar
que todo funcione».
**Para qué:** confirmar que la demo aguanta a varios jueces usando la app al mismo tiempo. Le sirve al criterio de
**Viabilidad de prueba piloto (10 %)** y respalda los de Experiencia de uso y Exactitud.

## Resultado: 226/226 operaciones sin fallas

Simula unos 40 jueces durante 116 s. Los tiempos son en segundos: la mediana (p50), el percentil 95 (p95) y el máximo.

| Fase | Correctas | p50 | p95 | Máx. |
|---|---|---|---|---|
| 1. Entrar con número de reloj, **40 a la vez** (25 como 0001, el estudiante que comparten los jueces) | 40/40 | 4.86 | 5.14 | 5.23 |
| 2. Páginas, **120 a la vez** (portada, entrada, lista de empresas, acceso, QR, inicio, asistente, módulo) | 120/120 | 1.51 | 5.17 | 5.70 |
| 3. Chat, **10 preguntas a la vez** | 10/10 | 5.08 | 6.79 | 6.79 |
| 4. Chat, **20 preguntas a la vez** (el techo de Groq por minuto) | 20/20 | 5.37 | 6.91 | 6.91 |
| 5. Voz de Azure, **12 a la vez** (6 resúmenes de Rio, 3 del cliente y 3 de la clienta) | 12/12 | 3.40 | 4.06 | 4.06 |
| 6. **La misma voz, 10 a la vez** («Escúchala» en la misma lección; sale del caché) | 11/11 | 0.98 | 1.33 | 1.33 |
| 7. Micrófono (Whisper), **6 a la vez** (un tono sin voz, que debe dar «no te escuché») | 6/6 | 1.27 | 1.30 | 1.30 |
| 8. Práctica evaluada por la IA, **6 a la vez** | 6/6 | 2.89 | 3.15 | 3.15 |
| 9. Una pregunta normal **después** de todo | 1/1 | 2.23 | 2.23 | 2.23 |

Una respuesta del chat cuenta como correcta si responde 200, sin el error «No pude responder», y trae citas o una
canalización.

## La calidad no bajó con la carga
Lo registró la base de datos en cada consulta (`consultas.citas` y `consultas.invalidas`):
- **31 respuestas bajo carga, 0 citas inválidas.** Las cubiertas traen entre 1 y 19 citas válidas.
- **El cálculo con DESC10** («Son las 9 de la mañana… ¿Cuánto le cobro?») dio **$160.50** las 3 veces.
- **Lo que el manual no define se canalizó bien:**
  - vacaciones → **RH**, las 3 veces;
  - vales de despensa → **supervisor**, las 3 veces.
- «¿Cómo hago una cancelación?» canalizó al supervisor en una de 5. Es aceptable: en `pruebas/consultas.json` está
  marcada como opcional, y la respuesta siempre dice que se pide autorización al supervisor.

## Límites que conviene conocer
- **Groq** (cadena del chat): 500 000 peticiones al día y 250 000 tokens por minuto, según las cabeceras de la API el
  10-oct. Una pregunta usa unos 10 000 tokens, así que caben unas 25 preguntas por minuto entre todos. En la ola de 20
  a la vez no hubo ningún rechazo.
- **Entrar con 40 personas en el mismo segundo** tarda unos 5 s por persona: cada entrada abre una sesión de Supabase
  Auth desde el servidor. Con entradas escalonadas, menos de 1 s. Los límites de Auth del panel están en 300 cada
  5 minutos por IP (§3 de `despliegue.md`) y no se alcanzaron.
- **Azure F0** (voz): 500 000 caracteres al mes. Un resumen hablado mide unos 250, y el caché evita repetir la misma
  frase. Si Azure no responde, la app dice el resumen con la voz del navegador o muestra «▶ Escuchar».

## Cómo se hizo y cómo repetirla
- Script: [`pruebas/estres-produccion.py`](../pruebas/estres-produccion.py). Es Python sin dependencias y usa la app
  igual que un navegador: entra con número de reloj, pide páginas, pregunta, pide voz, manda audio y evalúa prácticas.
  Al final cierra las 40 sesiones.
- Corre **contra producción**: crea consultas, canalizaciones, prácticas y registros de acceso reales. Después de
  correrla se borraron por SQL, solo los de la prueba: las preguntas del script, de los estudiantes 0001–0004, desde la
  hora de inicio. Esta vez fueron 31 consultas, 7 canalizaciones, 6 prácticas y 40 accesos. Una consulta de otra persona
  que usaba la app en ese momento **no** se tocó.
- No se cambió código ni configuración para la prueba.
