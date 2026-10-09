# CLAUDE.md — Hack Knights IA Challenge 2026

Repositorio de trabajo para el **Hack Knights IA Challenge 2026** (Ciudad Juárez, 8–10 de octubre de 2026).
Objetivo: en ~3 días, construir en equipo un **prototipo con IA** que resuelva un reto real y presentarlo ante un jurado.

> Misión oficial: *comprender el problema, construir una solución y demostrar cómo puede generar valor.*

Fuentes: `~/Downloads/manual-del-hacker.pdf` (manual oficial, la fuente más precisa), https://www.hackknights.com/evento y,
para nuestro reto, la **ficha técnica de Del Río** `~/Downloads/Fichas Técnicas Hack Knights 2026.pdf` (trae los criterios de evaluación; ver ADR 0008)
y el **material oficial del reto**: `~/Downloads/Manual_cajeros_Tienda_Escuela_Hack_Knights (1).pdf`, manual ficticio de la "Tienda Escuela" (ver ADR 0013).
Si algo choca entre ambas, manda el manual (la web dice "9 y 10 de octubre"; el manual incluye el jueves 8).

---

## Estado actual (actualizar conforme avance)

- **Reto elegido:** **Del Río — "Tu compañero Del Río": avatar de IA para la inducción de cajeros** (área usuaria: RH). Detalle completo y entregables en [ADR 0001](docs/adr/0001-reto-y-alcance.md); criterios de evaluación y orden de trabajo en [ADR 0008](docs/adr/0008-criterios-de-evaluacion.md).
- **Siguiente prioridad (ADR 0008):** módulo guiado por lecciones + test ≥5 + situaciones prácticas (criterio "Utilidad para la inducción", 25 %, el hueco más grande). En cuanto haya llaves: `npm run probar:cadena` y `npm run prueba` (criterio "Exactitud", 30 %).
- **Equipo / nombre del equipo:** _pendiente_
- **Problema:** la capacitación de cajeros nuevos consume tiempo operativo y hay mucha rotación; cada ingreso repite las mismas explicaciones.
- **Solución (desde el 9-oct, [ADR 0009](docs/adr/0009-plataforma-multiempresa.md)):** **"Compañero"**, plataforma **multiempresa y multisucursal** "en blanco" para inducción y refuerzos de personal con IA. Del Río es el primer cliente; **Superette** la segunda empresa de demo. Cada empresa sube su material desde la app; un asistente con avatar responde **citando documento y sección** (RAG, [ADR 0010](docs/adr/0010-rag-en-supabase.md)), arma módulos con test y práctica, es **gamificable** sin rankings entre personas y **canaliza en vivo** al supervisor o a RH ([ADR 0011](docs/adr/0011-aprendizaje-gamificacion-y-canalizaciones.md)).
- **Stack:** Next.js 16 + React 19 + Tailwind 4 + Vercel AI SDK 7 (Anthropic → Groq) + **Supabase (Postgres con RLS, Auth sin contraseñas, Storage, Realtime)** + Vercel ([ADR 0002](docs/adr/0002-stack.md)).
- **Hecho (9-oct, madrugada):** base multiempresa con RLS, login con Google/código/invitado, alta por QR, ingesta de PDF/Word/texto con Contextual Retrieval, búsqueda híbrida, chat con citas verificables, canalizaciones en vivo, **módulos generados con IA** (lecciones, test, práctica con cliente simulado) con revisión de RH, **gamificación** (puntos, niveles, insignias, racha, festejo; reto por sucursal sin rankings), métricas agregadas, equipo/roles/QR, identidad del asistente, demos sembradas con un módulo de ejemplo. Evidencia: `npm run validar` → `docs/validacion.md` (44 lógica · 25 SQL · 8/8 búsqueda · 23 punta a punta · prueba documentada 10/10 con Groq).
- **IA probada con Groq (9-oct):** prueba documentada 10/10 (8 correctas + 2 canalizadas), generación de módulo en ~20 s (6 lecciones, 6 preguntas, 3 prácticas, todo citado), simulador de práctica con retroalimentación citada.
- **Despliegue ([ADR 0012](docs/adr/0012-despliegue-supabase-propio-y-vercel.md), runbook [`docs/despliegue.md`](docs/despliegue.md)):** Compañero va en un proyecto de Supabase **propio, nuevo y vacío** (`us-east-1`) + Vercel. ⚠️ **NO usar `cncvxfjsyrntilcbbcfi`** ("asistenteIA_RH"): es la base de una app de repartos con datos reales (muy probablemente Donna Repartos). Antes de aplicar migraciones a cualquier proyecto, revisar con `list_tables` que esté vacío.
- **Llaves (9-oct):** `GROQ_API_KEY` ya está en `.env.local`; `ANTHROPIC_API_KEY` vacía.
- **Falta:** cargar el manual de Tienda Escuela y hacer los ajustes del ADR 0013; proyecto de Supabase nuevo (lo crea Wal) → migraciones por MCP → Vercel; llave de Anthropic (eslabón principal) y repetir la prueba documentada con ella; credenciales de Google (opcional); embeddings (opcional).
- **Material del reto (9-oct, 11:30) → [ADR 0013](docs/adr/0013-material-del-reto-tienda-escuela.md):** "Manual de procedimientos para cajeros — Tienda Escuela", **ficticio**, 15 secciones. Reemplaza nuestro contenido de ejemplo de Del Río. Implicaciones:
  - Citar como "**sección N, Subtítulo**".
  - Partir el PDF por títulos y subtítulos (19 pt y 12.5 pt).
  - Darle fecha y hora al asistente, porque hay promociones con horario del 8 al 10 de octubre.
  - Nueva prueba documentada contra el manual.
  - Decidido por Wal: la empresa demo pasa a ser **"Tienda Escuela"** y Superette se queda con una franja visible de contenido ficticio.
  - **Hecho (9-oct, tarde):**
    - El manual quedó en 96 secciones citables.
    - Citas como «sección N, Subtítulo».
    - Fecha y hora en el prompt.
    - Búsqueda 18/18 con reescritura de la consulta.
    - Red de seguridad de canalización.
    - Prueba documentada 10/10 dos veces.
    - Módulo de inducción generado con IA y revisado; la revisión encontró un cálculo equivocado de la IA, que ya se corrigió.
    - `npm run validar`: las 5 suites en verde.
  - **Pulsar para hablar en el chat:** Whisper en Groq; el audio no se guarda y se filtran las frases fantasma (ADR 0005).
- **Repo:** https://github.com/walfro90-gorilla/companero (privado, cuenta `walfro90-gorilla`) · **Demo:** _pendiente (Vercel)_
- **Pendiente de Del Río:** la identidad visual del avatar y quién es su **enlace de RH u Operación**. El material ya llegó: es el manual de Tienda Escuela, y el permiso para usarlo con IA lo da la organización (ADR 0013).

---

## Reto Del Río (el nuestro)

> ¿Cómo desarrollar un avatar con IA que guíe la inducción de cajeros de nuevo ingreso y responda preguntas concretas sobre su trabajo, utilizando los materiales internos que Del Río ya tiene?

**Entregables (lo que se evalúa):**
- [ ] App funcional con avatar, conversación por texto y **un módulo de inducción completo**.
- [ ] Base de conocimiento con materiales autorizados y **respuestas con referencias verificables**.
- [ ] **Test de comprensión ≥5 preguntas** con explicación de las respuestas.
- [ ] **Prueba documentada ≥10 consultas**: 8 cubiertas por los materiales y 2 sin respuesta. Mostrar correctas, errores y canalizaciones.
- [ ] Presentación breve: funcionamiento, requisitos de uso, limitaciones y propuesta de prueba inicial con cajeros.

**Criterios de evaluación propuestos en la ficha técnica** (detalle, estado y orden de trabajo en [ADR 0008](docs/adr/0008-criterios-de-evaluacion.md)):

| Criterio | Peso | Qué evalúan |
|---|---|---|
| Exactitud y respaldo | **30 %** | Respuestas fieles a los materiales y fuentes verificables |
| Utilidad para la inducción | **25 %** | Guía clara, dudas concretas y ejercicios pertinentes |
| Uso efectivo de IA | **20 %** | Consulta de documentos y respuestas contextualizadas |
| Experiencia de uso | **15 %** | Interacción sencilla, legible y comprensible |
| Viabilidad de prueba piloto | **10 %** | Requisitos claros y facilidad para actualizar contenidos |

Todo cambio se justifica contra una fila de esta tabla. Voz, animación, cápsulas narradas y varios módulos son **mejoras opcionales** según la ficha.

**Funciones del avatar:** (1) bienvenida + siguiente paso; (2) explicar procedimientos paso a paso y reformular; (3) responder citando documento y sección; (4) situaciones prácticas y test; (5) reconocer información ausente o ambigua y canalizar a RH o al supervisor.

**Condiciones (no negociables):** solo materiales autorizados; sin datos personales, contraseñas ni credenciales; **no inventar políticas** ni ejecutar operaciones de caja; la evaluación es de aprendizaje, sin decisiones automatizadas sobre personas. Ver [ADR 0006](docs/adr/0006-guardarrailes-y-condiciones.md).

**Preguntas de la demo:** "¿Cómo hago una cancelación?", "¿Qué hago si un producto no tiene precio?", "¿Cómo aplico una promoción?", "¿Qué debo revisar al cerrar caja?", "¿Cuándo debo llamar al supervisor?" (esta última debe canalizar).

El otro reto (**Mechatronics AI**: detección de objetos en tiempo real, patrocinador BLAK) también lo hace el equipo, en el proyecto hermano **`../hackKnights-vision`** (Python + YOLO, independiente: no compartir código ni dependencias).

**Investigación** (Del Río/Grupo de la Vega, avatares, TTS es-MX, citas, ideas WOW con horas y riesgo): [`docs/investigacion.md`](docs/investigacion.md).

## Arquitectura

```
RH sube PDF/Word/texto ─► Storage ─► lib/ingesta (secciones D{n}-{orden} + contexto con IA) ─► secciones (borrador → publicado)
                                                                                                  │
pregunta ─► app/api/chat ─► buscar_secciones (Postgres: texto + aproximada + vectores, RLS) ─► 8 secciones
                                 └► lib/ia/cadena: Anthropic claude-opus-5-5 ──(falla/vacío)──► Groq gpt-oss-120b
respuesta en streaming con [D1-3] y [CANALIZAR:…] ─► UI valida contra lo consultado · consultas + canalizaciones (Realtime)
```

- **Decisiones:** `docs/adr/` (0001 reto · 0002 stack · 0003 proveedores IA · 0004 citas · 0005 avatar · 0006 guardarraíles · 0007 test y prueba documentada · 0008 criterios · **0009 multiempresa · 0010 RAG · 0011 módulos, gamificación y canalizaciones · 0012 despliegue · 0013 material del reto (Tienda Escuela)**). Una decisión nueva o un cambio de rumbo se registra como ADR nuevo.
- **Datos y permisos:** `supabase/migrations/` (Postgres con RLS en TODAS las tablas; helpers `mis_empresas()`, `gestiono()`, `superviso()`, `atiendo()`). La autorización la decide la base, no el código. `lib/sesion.ts` = capa de acceso (`contextoEmpresa(slug)`, `requerirGestion`). Tipos: `npm run tipos`.
- **Rutas:** `/` landing · `/entrar` · `/inicio` (mis empresas, crear, unirse) · `/unirse/{codigo}` (QR) · `/e/{slug}` (inicio con nivel e insignias) · `/e/{slug}/asistente` · `/e/{slug}/modulos/{id}` (lecciones → test → práctica) · `/e/{slug}/canalizaciones` · `/e/{slug}/admin/{contenido,modulos,equipo,metricas,ajustes}` · APIs `/api/chat`, `/api/practica` y `/api/transcribir` (voz).
- **Contenido:** `conocimiento/tienda-escuela/` tiene el manual OFICIAL del reto (PDF, ficticio) y su módulo revisado; `conocimiento/superette/` tiene contenido de ejemplo escrito por el equipo. `npm run sembrar` los carga; la UI pone una franja de contenido ficticio en ambas empresas.
- **IA:** `lib/ia/` reutiliza la cadena de brotes (Anthropic → Groq, espera el primer fragmento antes de comprometerse con un proveedor). Los modelos se cambian con `IA_MODELO_ANTHROPIC` e `IA_MODELO_GROQ`, sin tocar código.

## Comandos

```bash
supabase start -x edge-runtime,logflare,vector,imgproxy,supavisor   # Supabase local (Docker); Mailpit en :54324
supabase db reset      # reaplica migraciones (borra datos locales)
npm run sembrar        # demos del-rio y superette (SEMBRAR_ADMIN_EMAIL=correo para quedar como admin; -- --reiniciar)
npm run sembrar:nube   # lo mismo contra la nube, con .env.nube (lo corre Wal; docs/despliegue.md)
npm run dev            # http://localhost:3000
npm test               # pruebas de lógica pura (node --test)
npm run test:sql       # aislamiento multiempresa y búsqueda (Supabase local)
npm run humo           # punta a punta con login por código (HUMO_EMAIL=correo; requiere dev + sembrar)
npm run lint
npm run build
npm run tipos          # regenera lib/supabase/tipos.ts desde el esquema local
npm run probar:cadena  # ping a cada proveedor de IA (requiere llaves en .env.local)
npm run prueba         # prueba documentada → docs/prueba-documentada.md (-- --empresa del-rio)
npm run validar        # corre TODO y escribe docs/validacion.md (evidencia para el jurado; HUMO_EMAIL=correo)
npm run medir:busqueda # banco de 18 preguntas: recall de la búsqueda con y sin reescritura
npm run generar:modulo # genera con IA el módulo desde el material → conocimiento/<empresa>/modulo-induccion.json (se REVISA antes de sembrar)
```

**Para el jurado:** `docs/validacion.md` se genera, no se escribe a mano. Toda prueba nueva entra a una de sus suites y se vuelve a correr `npm run validar` antes de entregar.

**Llaves:** `ANTHROPIC_API_KEY` y `GROQ_API_KEY` van en `.env.local` (y en Vercel como secretas). Las captura Wal. **Nunca** imprimirlas, pasarlas como argumento de línea de comandos ni ponerlas en mensajes de error. La plantilla es `.env.example`.

---

## Retos del evento

| Reto | Taller de introducción | Canal Discord |
|---|---|---|
| Mechatronics AI | Jue 8, 18:00–20:00, en línea (Discord), con Pablo López | `#reto-mechatronics` |
| **Del Río – Superette** ← el nuestro | Vie 9, 10:00–11:00, Rodateca, con Ramsés Salinas | `#reto-del-rio` |

Contexto del programa "IA Challenge": IA aplicada a problemas de la industria **maquiladora, agrícola y de servicios** de la región.

Patrocinadores (pie de la ficha técnica): FICOSEC, Gobierno Municipal de Ciudad Juárez, **Microsoft**, Desarrollo Económico, Frente Norte, BLAK, UTCJ, Del Río, Superette y Mechatronics AI. Si se hace voz, Azure Speech (visemas es-MX, ya investigado) además es de un patrocinador.

---

## Agenda (hora local de Ciudad Juárez, `America/Ciudad_Juarez`; en octubre es UTC−6, horario de verano de EE. UU.)

**Día 1 — jueves 8 oct** · Objetivo: conocer el reto, formar equipo y salir con una solución planteada.
- 14:00–14:30 Registro y bienvenida — La Rodadora · Sala de Cine
- 14:30–15:00 Inauguración — Sala de Cine
- 15:00–16:00 Presentación de retos y formación de equipos — Rodateca (se registran integrantes, reto y nombre del equipo)
- 16:00–16:45 Ideación y definición de solución · Parte 1 — Rodateca
- 18:00–20:00 Taller prototipado IA + intro reto Mechatronics AI (Pablo López) — en línea, Discord

**Día 2 — viernes 9 oct** · Objetivo: primer prototipo, resolver dudas con mentores, preparar cómo comunicar la propuesta.
- 09:00–10:00 Ideación y definición · Parte 2
- 10:00–11:00 Taller prototipado IA + intro reto Del Río–Superette (Ramsés Salinas)
- 11:00–13:00 Desarrollo y mentorías · Parte 1
- 13:00–14:00 Comida
- 14:00–16:00 Desarrollo y mentorías · Parte 2
- 16:00–16:45 Taller: pitch
- 16:45–17:00 Cierre del día
- 17:30–22:00 Mentorías en línea (Discord)

**Día 3 — sábado 10 oct** · Objetivo: terminar funcionalidades prioritarias, validar demo, entregar y presentar.
- 09:00–12:00 Desarrollo y mentorías · Parte 3
- 12:00–13:30 **Desarrollo final**
- 13:30–14:00 Comida
- 14:00–16:00 Mentorías finales y ensayo
- **16:00–16:30 ENTREGA Y VALIDACIÓN DE PROYECTOS** ← deadline duro
- 16:30–18:30 Pitches, deliberación y premiación
- 19:00–19:30 Traslado a IA Center
- 20:00–21:00 Networking y cierre — IA Center

**Code freeze práctico: sábado 13:30.** Después de eso solo se arreglan bugs críticos y se ensaya.

Al cierre de cada bloque de desarrollo, cada equipo reporta: **problema, solución, avance, bloqueo y siguiente paso**.

## Sedes

- **La Rodadora** (actividades presenciales; Sala de Cine y Rodateca): Blvd. Teófilo Borunda 6632-Norte, Comunitario Jarudo, Cd. Juárez.
- **IA Center** — Centro de Inteligencia Artificial (networking y cierre del sábado): Av. Vicente Guerrero 8830, Hipódromo, Cd. Juárez.
- **Discord** (avisos, talleres y mentorías en línea): https://discord.com/invite/BtcffW32f
  - `#anuncios-hackknights` = canal oficial (horarios, enlaces, materiales). Revisar primero ahí.
  - `#general` = dudas generales / cuando no sabes dónde preguntar.
  - Mentores con canal de voz: Pablo López, Ramsés Salinas, Joe Galicia, Javier Flores, Sergio Ramírez, Adriana Guadalupe, David Hernández, Xavier Piñón.

---

## Entrega y pitch

Los criterios de **nuestro reto** ya están en la ficha técnica (tabla de arriba y ADR 0008). Las **instrucciones oficiales de entrega** y cualquier rúbrica general del evento se comparten durante el evento. Cuando se publiquen, se agregan aquí y, si contradicen la ficha, manda lo publicado.

Estructura del pitch (según el manual):
1. **Problema** — qué necesidad y a quién afecta.
2. **Solución** — qué construimos y cómo funciona.
3. **Uso de IA** — qué función cumple la IA dentro de la propuesta (debe ser central, no decorativa).
4. **Validación** — qué probamos y qué resultados observamos.
5. **Impacto** — qué valor podría generar.
6. **Implementación** — qué haría falta para llevarlo a un entorno real.
7. **Siguiente paso** — cómo continuaría el proyecto.

Checklist antes de entregar:
- [ ] Revisamos los requisitos oficiales / rúbrica.
- [ ] El prototipo se puede demostrar de punta a punta.
- [ ] Archivos, permisos y enlaces funcionan (probar en ventana de incógnito / otro dispositivo).
- [ ] Respaldo de la demo: capturas y/o video corto.
- [ ] Pitch ensayado; queda claro qué funciona y qué sigue en desarrollo.

Premios del programa: tres equipos premiados; becas de aceleración y viajes a Talent Land e INC Monterrey. Seguimiento posterior: preincubación en ARTEA (UACJ), Machaca LAB y Demo Day.

---

## Cómo trabajar en este repo (modo hackatón)

- **Demo primero.** Priorizar una sola funcionalidad que muestre el valor de la propuesta y que funcione de punta a punta. Todo lo demás es "mejora futura" y va a la sección de siguiente paso del pitch, no al código.
- **La IA tiene que ser el corazón** de la solución y demostrable en vivo; hay que poder explicar en una frase qué hace la IA y por qué no se resolvería igual sin ella.
- **Decisiones rápidas y reversibles.** Preferir stacks y servicios conocidos, con setup mínimo y deploy en minutos. Desplegar temprano (viernes) para no descubrir problemas el sábado.
- **No sobre-ingeniería:** sin auth, tests exhaustivos ni abstracciones que no se vean en la demo, salvo que el reto o la rúbrica lo pidan. Datos mock/semilla están bien si se dice claramente en el pitch.
- **Cuidar la información del reto:** usar los materiales y datos de la empresa solo según sus indicaciones. **Antes de mandar datos del reto a una API/herramienta externa de IA, confirmar que esté permitido.** No commitear secretos ni datos sensibles; usar `.env` (y `.env.example` sin valores).
- **Límites de uso:** revisar cuotas/rate limits de las APIs de IA elegidas antes de la demo; tener un fallback (respuestas cacheadas o grabación) por si falla la red o la API en el escenario.
- Mantener un `README.md` corto con: problema, solución, cómo correrlo, y arquitectura en 3–5 líneas (sirve para la entrega y para el jurado).
- Commits pequeños y frecuentes; la rama principal siempre debe tener algo demostrable.
- Comunicarse en español; identificadores y términos técnicos en su forma original.
- **Next 16 y AI SDK 7 no son los que conoce el modelo**: antes de escribir código de Next leer `AGENTS.md` y `node_modules/next/dist/docs/`; para la IA, `node_modules/ai/docs/` y `node_modules/@ai-sdk/*/docs/`.
- `claude-opus-5-5` responde 400 si recibe `temperature`/`top_p`/`top_k`: no mandarlos. El thinking no se apaga; la latencia se controla con `effort`.
- Antes de cerrar un cambio: `npm test && npm run lint && npm run build`; si tocaste migraciones, `npm run test:sql`; si tocaste flujos, `npm run humo`. Si cambian las instrucciones del asistente o el material, también `npm run prueba`.
- **Migraciones:** nunca editar una ya aplicada en la nube; se agrega una nueva. Toda tabla nueva lleva `empresa_id`, RLS y su prueba en `supabase/tests/`.
- **Superette** en la demo usa identidad provisional (nombre "Sofi", colores propios): sin logotipo ni marca de Del Río/Superette hasta que lo autoricen.
