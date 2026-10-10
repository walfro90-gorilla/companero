# CLAUDE.md — Hack Knights IA Challenge 2026

Repositorio de trabajo para el **Hack Knights IA Challenge 2026** (Ciudad Juárez, 8–10 de octubre de 2026).
Objetivo: en ~3 días, construir en equipo un **prototipo con IA** que resuelva un reto real y presentarlo ante un jurado.

> Misión oficial: *comprender el problema, construir una solución y demostrar cómo puede generar valor.*

Fuentes: `~/Downloads/manual-del-hacker.pdf` (manual oficial, la fuente más precisa), https://www.hackknights.com/evento y,
para nuestro reto, la **ficha técnica de Del Río** `~/Downloads/Fichas Técnicas Hack Knights 2026.pdf` (trae los criterios de evaluación; ver ADR 0008)
y el **material oficial del reto**: `~/Downloads/Manual_cajeros_Tienda_Escuela_Hack_Knights (1).pdf`, manual ficticio de la "Tienda Escuela" (ver ADR 0013).
Si algo choca entre ambas, manda el manual (la web dice "9 y 10 de octubre"; el manual incluye el jueves 8).

---

## Estado actual (actualizar conforme avance) — sábado 10-oct, mediodía

- **Reto elegido:** **Del Río — "Tu compañero Del Río": avatar de IA para la inducción de cajeros** (área usuaria: RH).
  - Detalle completo y entregables: [ADR 0001](docs/adr/0001-reto-y-alcance.md).
  - Criterios de evaluación (30/25/20/15/10): [ADR 0008](docs/adr/0008-criterios-de-evaluacion.md).
- **En línea: https://companero-ten.vercel.app**
  - **Vercel:** proyecto `companero`; **cada push a `main` despliega a producción**.
  - **Supabase:** `del_rio_hackathon`, ref `bavkhusmzyyswtfksosk`, `us-east-1`. Migraciones aplicadas hasta la `121000`, con el historial alineado con los archivos (revisado por MCP el 10-oct). La siguiente nueva es `121100` o mayor y va en la nube **antes** de empujar el código que la usa. El aislamiento dio 25/25 también en la nube (con las pruebas de entonces).
  - **Repo:** https://github.com/walfro90-gorilla/companero (privado, cuenta `walfro90-gorilla`). Si `git push` por SSH se cuelga (por `gcr-ssh-agent`), usar HTTPS con `gh`; el comando está al final de `docs/despliegue.md`.
  - **Detalle:** [ADR 0012](docs/adr/0012-despliegue-supabase-propio-y-vercel.md) y [`docs/despliegue.md`](docs/despliegue.md).
  - ⚠️ **NO usar `cncvxfjsyrntilcbbcfi`** ("asistenteIA_RH"): es la base de una app de repartos con datos reales (muy probablemente Donna Repartos). Antes de aplicar migraciones a cualquier proyecto, revisar con `list_tables` que sea el correcto.
- **Pendiente de Wal para que producción funcione de punta a punta** (`docs/despliegue.md`):
  - Login en el panel de Supabase (§3): Site URL y Redirect URLs, **Anonymous OFF y Google OFF**, contraseña mínima de 8, **subir el rate limit de *token verifications*** (la sesión del empleado la abre el servidor) y la plantilla del código de 6 dígitos.
  - Ya hecho (9-oct): `GROQ_API_KEY` y `SUPABASE_SECRET_KEY` en Vercel; nube sembrada (Del Río con 96 secciones, el módulo, 0001–0004 y Wal como admin; Superette).
  - Prueba de punta a punta en producción (10-oct, 12:00–12:30, Chrome por MCP, estudiantes 0004 y 0002): entrada de empleado, citas con PDF, canalización a supervisor y a RH, voz de Azure, lección, test y práctica. Detalle en `docs/despliegue.md` §6. Falta que un admin califique una práctica, el QR desde otro teléfono y la prueba en incógnito y en el celular. *Leaked password protection* es opcional.
- **Equipo / nombre del equipo:** _pendiente_
- **Problema:** la capacitación de cajeros nuevos consume tiempo operativo y hay mucha rotación; cada ingreso repite las mismas explicaciones.
- **Solución ([ADR 0009](docs/adr/0009-plataforma-multiempresa.md)):** **"Compañero"**, plataforma **multiempresa y multisucursal** "en blanco" para inducción y refuerzos de personal con IA.
  - **Empresas de la demo:**
    - **Del Río** (`/e/del-rio`), con el manual oficial del reto ([ADR 0013](docs/adr/0013-material-del-reto-tienda-escuela.md)). Wal decidió el nombre; el manual es de "Tienda Escuela", ficticio, y por eso la franja dice que no describe políticas reales de Del Río.
    - **Superette (demo)**, con contenido de ejemplo nuestro.

    Las dos llevan una franja de contenido ficticio.
  - **Asistente con avatar:** responde **citando como pide el manual («sección N, Subtítulo»)** (RAG, [ADR 0010](docs/adr/0010-rag-en-supabase.md)).
  - **Aprendizaje:** arma módulos con test y práctica; es **gamificable** sin rankings entre personas; **canaliza en vivo** al supervisor o a RH ([ADR 0011](docs/adr/0011-aprendizaje-gamificacion-y-canalizaciones.md)).
  - **Voz:** se le puede preguntar **pulsando para hablar** ([ADR 0005](docs/adr/0005-avatar.md)), y responde con un **resumen hablado** en voz neural de México ([ADR 0016](docs/adr/0016-voz-natural.md)):
    - **En producción: Azure Speech.** Es el recurso F0 de Wal, en la región `northcentralus`. Las voces son Rio `es-MX-DaliaMultilingualNeural`, el cliente Jorge y la clienta Beatriz.
    - ElevenLabs queda como opción sin configurar: con la cuenta gratis, las voces mexicanas dan 402.
    - Respaldo: una voz femenina del navegador; en Edge, «Dalia Online (Natural)».
    - Hay caché para no sintetizar dos veces la misma frase.
    - Si el navegador bloquea el audio (Brave, Safari), aparece **«▶ Escuchar a Rio»**. En la inducción, la asistente es el **coach**: presenta cada lección («Escúchala»), anima en el test y da la retroalimentación de la práctica; el cliente simulado tiene su propio avatar y otra voz, y se le responde también con el micrófono.
  - **Acceso ([ADR 0014](docs/adr/0014-acceso-por-numero-de-reloj-y-revision.md) y [ADR 0015](docs/adr/0015-entrada-separada-sin-contrasena.md)):**
    - **`/entrar`** es un selector: «Soy empleado» (grande) o «Administración» (discreto). Los empleados nunca ven la entrada de administración.
    - **Empleados** (colaborador y supervisor): **solo con su número de reloj, sin contraseña** (lo pide la ficha; el NIP se probó y se descartó), en `/acceso` (lista de empresas) → `/acceso/{empresa}` o con el QR de su sucursal. Un número nuevo por QR queda dado de alta.
    - **Admin y RH:** correo y contraseña en `/entrar/admin`.
    - **Sin Google ni modo invitado.**
    - **Estudiantes de la demo:** **0001–0004** en Del Río. **Jueces:** **1001–1010** («Juez 1» a «Juez 10»), en `/acceso/del-rio`; los dio de alta el seed el 10-oct.
  - **Respuestas:** panel donde admin y RH **revisan y califican** (0–10 con comentario) las prácticas y los tests. El empleado ve su calificación y el aviso de que su instructor revisa.
- **Material del reto:** "Manual de procedimientos para cajeros — Tienda Escuela", **ficticio**, 15 secciones, en `conocimiento/del-rio/`.
  - Pide citar "sección N, Subtítulo".
  - Tiene promociones con fecha y horario (8 al 10 de octubre, COMBO42 de 08:00 a 10:30).
  - Tiene una tabla de lo que no define y a quién se canaliza.
- **Stack:** Next.js 16 + React 19 + Tailwind 4 + Vercel AI SDK 7 (Anthropic → Groq; `gpt-oss-20b` para tareas rápidas; Whisper para la voz) + **Supabase (Postgres con RLS, Auth sin contraseñas, Storage, Realtime)** + Vercel ([ADR 0002](docs/adr/0002-stack.md)).
- **Hecho:**
  - Base multiempresa con RLS; login con Google, código o invitado; alta por QR; equipo y roles; identidad del asistente.
  - **RAG:**
    - Ingesta de PDF por títulos y subtítulos (el manual quedó en 96 secciones citables) con Contextual Retrieval.
    - Búsqueda en Postgres con IDF y prefijo de raíz, más **reescritura de la consulta** y fusión: 18/18 en `pruebas/busqueda.json`.
    - Fecha y hora en el prompt.
    - Citas verificables que abren el PDF original en su página.
    - Red de seguridad de canalización.
  - **Módulos generados con IA y revisados** (lecciones, test y práctica con cliente simulado), gamificación (puntos, niveles, insignias, racha, festejo; reto por sucursal sin rankings), métricas agregadas y canalizaciones en vivo.
  - **Pulsar para hablar** (Whisper en Groq, sin guardar audio, filtro de frases fantasma).
  - **Evidencia para el jurado:** `npm run validar` → `docs/validacion.md`:
    - Lógica: 68.
    - Aislamiento SQL: 42 (incluye número de reloj, revisión, el endurecimiento de la `120800`, que la tabla de empresas y `auth.users` no se leen y que un empleado no crea empresas).
    - Búsqueda: 18/18 (16/18 sin reescritura).
    - Punta a punta: 61 (selector de entrada, empleados sin liga a administración, login por número de reloj, 20 entradas a la vez del mismo número, nadie entra directo contra Auth, QR, límite de altas, revisión, práctica guardada por el servidor, historial largo en el chat, salir, voz).
    - Prueba documentada: **10/10 con Groq**.
  - **Prueba de estrés en producción** (10-oct, 12:55): unos 40 jueces simulados, **226/226 operaciones sin fallas**.
    - 20 preguntas al chat a la vez, en ≤7 s.
    - 12 voces de Azure a la vez.
    - 0 citas inválidas bajo carga, y DESC10 = $160.50.
    - Detalle en [`docs/prueba-de-estres.md`](docs/prueba-de-estres.md); el script es `pruebas/estres-produccion.py`, que corre contra producción y lo que crea se borra después.
- **Llaves:**
  - **En local** (`.env.local`): `GROQ_API_KEY` sí; `ANTHROPIC_API_KEY` vacía.
  - **En Vercel:** las públicas de Supabase, `GROQ_API_KEY`, `SUPABASE_SECRET_KEY` (sensitive) y, desde el 10-oct, las `AZURE_*` de la voz (Production y Preview; región `northcentralus`). Faltan `ANTHROPIC_API_KEY` y, a propósito, las de ElevenLabs: si se cargan, tienen prioridad sobre Azure.
  - **En local**, `.env.local` tiene también las `AZURE_*` y unas `ELEVENLABS_*`. Esas hacen que en local se intente ElevenLabs primero (402 → respaldo); hay que comentarlas para probar Azure en local.
- **Falta (además de lo de Wal):**
  - Llave de Anthropic y repetir la prueba documentada con Claude como eslabón principal.
  - Pitch y video de respaldo de la demo con voz. Ya hay un GIF sin audio: `respaldo-demo-del-rio.gif`, en Descargas de Wal.
  - Prueba en el celular con la URL de producción.
  - Opcionales: Google, embeddings, pulsar para hablar también en la práctica.
- **Pendiente de Del Río:** si autoriza su logotipo y quién es su **enlace de RH u Operación**. El material ya llegó (ADR 0013). El avatar ya viste el uniforme de Del Río (azul, cuello y vivos rojos, estrella amarilla; colores del logo, decisión de Wal; ADR 0005).
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

**Preguntas de la demo:** "¿Cómo hago una cancelación?", "¿Qué hago si un producto no tiene precio?", "¿Cómo aplico una promoción?", "¿Qué debo revisar al cerrar caja?", "¿Cuándo debo llamar al supervisor?". Con el manual oficial, esta última **está cubierta** (sección «Cuándo llamar al supervisor», 17 situaciones; ADR 0013): se responde con la lista y la cita, y canalizar es opcional (`pruebas/consultas.json`, id 5). Lo que debe canalizar es lo que el manual no define.

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

- **Decisiones:** `docs/adr/` (0001 reto · 0002 stack · 0003 proveedores IA · 0004 citas · 0005 avatar · 0006 guardarraíles · 0007 test y prueba documentada · 0008 criterios · **0009 multiempresa · 0010 RAG · 0011 módulos, gamificación y canalizaciones · 0012 despliegue · 0013 material del reto (Tienda Escuela) · 0014 acceso por número de reloj y revisión · 0015 entrada separada, sin contraseña para empleados · 0016 voz natural**). Una decisión nueva o un cambio de rumbo se registra como ADR nuevo.
- **Datos y permisos:** `supabase/migrations/` (Postgres con RLS en TODAS las tablas; helpers `mis_empresas()`, `gestiono()`, `superviso()`, `atiendo()`). La autorización la decide la base, no el código. `lib/sesion.ts` = capa de acceso (`contextoEmpresa(slug)`, `requerirGestion`). Tipos: `npm run tipos`.
- **Rutas:** `/` landing · `/entrar` (selector) · `/entrar/admin` (admin/RH: correo y contraseña) · `/acceso` (lista de empresas) · `/acceso/{empresa}` (empleados: número de reloj) · `/unirse/{codigo}` (QR de sucursal: número de reloj, alta) · `/inicio` (admin: mis empresas, registrar empresa) · `/restablecer` · `/e/{slug}` (inicio con nivel e insignias) · `/e/{slug}/asistente` · `/e/{slug}/modulos/{id}` (lecciones → test → práctica) · `/e/{slug}/canalizaciones` · `/e/{slug}/admin/{contenido,modulos,respuestas,equipo,metricas,ajustes}` · APIs `/api/chat`, `/api/practica`, `/api/transcribir` (voz a texto), `/api/voz` (resumen hablado) y `/api/acceso-reloj`.
- **Contenido:** `conocimiento/del-rio/` tiene el manual OFICIAL del reto (PDF, ficticio) y su módulo revisado; `conocimiento/superette/` tiene contenido de ejemplo escrito por el equipo. `npm run sembrar` los carga; la UI pone una franja de contenido ficticio en ambas empresas.
- **IA:** `lib/ia/` reutiliza la cadena de brotes (Anthropic → Groq, espera el primer fragmento antes de comprometerse con un proveedor). Los modelos se cambian con `IA_MODELO_ANTHROPIC` e `IA_MODELO_GROQ`, sin tocar código.

## Comandos

```bash
supabase start -x edge-runtime,logflare,vector,imgproxy,supavisor   # Supabase local (Docker); Mailpit en :54324
supabase db reset      # reaplica migraciones (borra datos locales)
npm run sembrar        # demos del-rio (manual oficial) y superette (SEMBRAR_ADMIN_EMAIL=correo para quedar como admin; -- --reiniciar)
npm run sembrar:nube   # lo mismo contra la nube, con .env.nube (lo corre Wal; docs/despliegue.md)
npm run dev            # http://localhost:3000
npm test               # pruebas de lógica pura (node --test)
npm run test:sql       # aislamiento multiempresa y búsqueda (Supabase local)
npm run humo           # punta a punta: admin con contraseña y estudiante 0001 con número de reloj (requiere dev + sembrar)
npm run lint
npm run build
npm run tipos          # regenera lib/supabase/tipos.ts desde el esquema local
npm run probar:cadena  # ping a cada proveedor de IA (requiere llaves en .env.local)
npm run prueba         # prueba documentada → docs/prueba-documentada.md (por omisión del-rio; -- --empresa <slug>)
npm run validar        # corre TODO y escribe docs/validacion.md (evidencia para el jurado)
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
