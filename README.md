# Compañero 🧑‍🏫 — la compañera de capacitación con IA para cajeros de nuevo ingreso

**Hack Knights IA Challenge 2026 · Reto Del Río:** *«Tu compañero Del Río», un avatar con IA que guía la inducción
de cajeros.*

> **Rio** es una asistente con avatar que **enseña el trabajo de caja con el manual de la empresa**. Responde dudas
> **citando la sección exacta**, da un **módulo de inducción** con test y práctica con un cliente simulado, y cuando
> algo **no está en el manual** no lo inventa: **se lo pasa al supervisor o a RH**.

### 🟢 En línea: **https://companero-ten.vercel.app**

---

## ▶️ Pruébalo en 1 minuto

1. Abre **https://companero-ten.vercel.app** (en el celular también) → **Entrar** → **Soy empleado** → **Del Río**.
2. Escribe el número de reloj **`0001`**. Los estudiantes de demo son `0001`, `0002`, `0003` y `0004`. No hay
   contraseña: así lo pide el reto.
3. Entra a **Rio** y toca una de las preguntas sugeridas, o escribe una de estas:

| Pregunta | Qué vas a ver |
|---|---|
| ¿Cómo hago una cancelación? | Los pasos, cada uno con su cita «sección N» |
| ¿Qué hago si un producto no tiene precio? | La respuesta citada y el aviso de que se pide ayuda al supervisor |
| Son las 9 a. m., el cliente lleva 4 aguas, café, pan, botana y galletas, con el cupón DESC10. ¿Cuánto le cobro? | El cálculo paso a paso: **$160.50**, igual que el manual (las promociones del manual valen del 8 al 10 de octubre de 2026) |
| ¿Cuántos días de vacaciones me tocan? | No está en el manual: **no inventa** y **lo canaliza a RH** |

4. **Toca cualquier cita** (por ejemplo «sección 3»): se abre el **PDF original en esa página**, para verificarla.
5. Activa **«Voz activada»**. Rio contesta **en voz alta** con un resumen, y también le puedes **preguntar hablando**
   con el 🎤. Si el navegador bloquea el audio, toca **«▶ Escuchar a Rio»**.
6. Ve a **Inicio → el módulo «Inducción del cajero: un turno completo»**: 6 lecciones que Rio presenta, un test de
   6 preguntas con explicación y 3 prácticas con un cliente simulado al que respondes escribiendo o hablando.

> 📄 El material es el **manual oficial del reto** («Manual de procedimientos para cajeros — Tienda Escuela»). Es
> **ficticio**, y la app lo indica con una franja en todas las pantallas: no describe políticas reales de Del Río.

---

## 💡 El problema y la idea

- **Problema:** cada cajero nuevo necesita que alguien le explique lo mismo: cobros, cancelaciones, promociones,
  corte de caja… Con la rotación, eso consume horas del supervisor en cada ingreso.
- **Solución:** una compañera con IA, disponible a cualquier hora, que enseña **solo con el material autorizado de la
  empresa** y sabe cuándo pasar la duda a una persona.
- **Qué hace la IA, en una frase:** lee el manual de la empresa y responde cada duda **con la sección exacta que la
  respalda**. Sin IA, el cajero tendría que buscar en 34 páginas o interrumpir al supervisor.

---

## ✅ Cómo cumplimos los criterios del reto

| Criterio (peso) | Qué hicimos | Dónde se comprueba |
|---|---|---|
| **Exactitud y respaldo (30 %)** | Responde solo con el manual. Cada afirmación lleva su cita, la app **valida** que cada cita exista y la cita abre el PDF en la página. Si no está en el manual, **canaliza**, no inventa. | [Prueba documentada](docs/prueba-documentada.md): **10/10** (8 correctas con cita y 2 canalizadas) |
| **Utilidad para la inducción (25 %)** | Un módulo completo: **6 lecciones**, un **test de 6 preguntas** con la explicación de cada respuesta y **3 prácticas** con un cliente simulado. Al final, Rio da retroalimentación. | En la app: Inicio → módulo |
| **Uso efectivo de IA (20 %)** | RAG sobre el manual: 96 secciones citables, búsqueda en Postgres con reescritura de la consulta, fecha y hora para las promociones con horario, cálculos guiados por el manual, voz a texto (Whisper) y resumen hablado. | [Validación](docs/validacion.md): la búsqueda encuentra la sección correcta en **18/18** |
| **Experiencia de uso (15 %)** | Avatar con el uniforme de la empresa. Pensada para el celular, se le puede hablar y contesta con voz natural de México (Azure). Se entra con el número de reloj o el QR de la sucursal, sin contraseñas. | En la app |
| **Viabilidad de piloto (10 %)** | RH sube su PDF y queda listo: se parte solo en secciones citables. Es multiempresa y multisucursal, RH califica las prácticas en el panel «Respuestas» y está probado con carga real. | [Prueba de estrés](docs/prueba-de-estres.md): **226/226** con ~40 usuarios a la vez |

### Entregables de la ficha técnica
- [x] **App funcional** con avatar, conversación por texto (y voz) y **un módulo de inducción completo**.
- [x] **Base de conocimiento** con el material autorizado y **referencias verificables**: la cita abre el PDF en su
      página.
- [x] **Test de comprensión** de 6 preguntas (la ficha pide ≥5), **con la explicación** de cada respuesta.
- [x] **Prueba documentada** de 10 consultas, 8 cubiertas y 2 sin respuesta, con las correctas, los errores y las
      canalizaciones: [`docs/prueba-documentada.md`](docs/prueba-documentada.md).
- [x] **Presentación**: el funcionamiento, los requisitos, las limitaciones y la propuesta de piloto están abajo.

---

## 🔬 Evidencia (generada por código, no escrita a mano)

| Prueba | Resultado | Archivo |
|---|---|---|
| Lógica de la aplicación (citas, canalización, voz, gamificación…) | **82 / 82** | [`docs/validacion.md`](docs/validacion.md) |
| Aislamiento entre empresas, roles y privacidad (Postgres con RLS) | **42 comprobaciones** | [`docs/validacion.md`](docs/validacion.md) |
| La búsqueda encuentra la sección correcta | **18 / 18** | [`docs/validacion.md`](docs/validacion.md) |
| Punta a punta (entrada, pantallas, QR, permisos, voz) | **70 / 70** | [`docs/validacion.md`](docs/validacion.md) |
| Prueba documentada con IA (10 consultas reales) | **10 / 10** | [`docs/prueba-documentada.md`](docs/prueba-documentada.md) |
| Estrés en producción (~40 usuarios: 20 preguntas a la vez, voz, micrófono) | **226 / 226**, 0 citas inválidas | [`docs/prueba-de-estres.md`](docs/prueba-de-estres.md) |

Todo se vuelve a generar con `npm run validar`.

---

## 🛡️ Condiciones del reto que respetamos
- **Solo material autorizado:** la IA responde únicamente con las secciones publicadas por la empresa.
- **No inventa políticas:** si el manual no lo dice, lo canaliza al supervisor o a RH, y la duda llega en vivo a su
  bandeja.
- **No ejecuta operaciones de caja:** explica el procedimiento y quién lo autoriza.
- **Sin datos personales ni credenciales:** el empleado entra solo con su número de reloj, sin contraseña.
- **Evaluación para aprender, no para decidir sobre personas:** el test se califica solo, pero **una persona de RH
  revisa** y comenta las prácticas. No hay rankings entre personas.

---

## 🚀 Propuesta de prueba piloto
- **Requisitos de uso:**
  - un celular o una computadora con navegador e internet;
  - RH sube el manual en PDF con texto;
  - cada sucursal tiene su QR para dar de alta a sus cajeros con su número de reloj.
- **Piloto propuesto:**
  - 2 sucursales y los cajeros de nuevo ingreso de 2 semanas.
  - Medimos el tiempo de inducción, las dudas resueltas sin interrumpir al supervisor, las canalizaciones y los
    resultados del test.
  - RH valida el contenido y califica las prácticas.
- **Actualizar contenidos:** RH sube la nueva versión del PDF. Se parte en secciones citables, RH las revisa y
  publica, y el asistente responde con lo nuevo sin tocar código.

### Limitaciones conocidas
- Responde solo con lo que está en el material publicado y no se conecta a los sistemas de caja.
- Necesita internet: los modelos de IA están en la nube.
- Los PDF escaneados como imagen todavía no se leen; se necesita la versión con texto.
- La IA puede variar en detalles de redacción entre una respuesta y otra. Por eso cada respuesta trae sus citas
  verificables y lo dudoso se canaliza.

---

## ⚙️ Cómo funciona por dentro

```
RH sube el PDF ─► se parte en 96 secciones citables («sección N, Subtítulo») ─► Postgres (Supabase)
                                                                                    │
Pregunta del cajero ─► búsqueda (texto + reescritura de la consulta) ─► las 12 secciones más relevantes
                    ─► el modelo responde SOLO con ellas y cita [D1-n] ─► la app valida cada cita
                    ─► si no está en el material: [CANALIZAR] ─► bandeja del supervisor o de RH, en vivo
```

- **Stack:** Next.js 16 · React 19 · Tailwind 4 · Vercel AI SDK 7 · Supabase (Postgres con RLS, Auth, Storage,
  Realtime) · Vercel.
- **IA:**
  - **Groq `gpt-oss-120b`** responde en la demo; **Claude** entra como modelo principal en cuanto hay llave, con
    respaldo automático entre ambos.
  - `gpt-oss-20b` reescribe consultas y hace el resumen hablado.
  - **Whisper** convierte la voz en texto.
  - **Azure Speech** (Dalia, voz de México) habla.
- **Multiempresa:** cada empresa ve solo lo suyo; lo garantiza la base de datos con RLS, no el código. En la demo hay
  dos empresas: **Del Río** y **Superette (demo)**.
- Las decisiones y su porqué están en [`docs/adr/`](docs/adr/), 16 ADR. El despliegue, en
  [`docs/despliegue.md`](docs/despliegue.md).

## 💻 Correrlo en local

```bash
npm install
supabase start -x edge-runtime,logflare,vector,imgproxy,supavisor   # requiere Docker
cp .env.example .env.local    # URL y llaves de Supabase local + GROQ_API_KEY (Anthropic y Azure son opcionales)
SEMBRAR_ADMIN_EMAIL=tu@correo SEMBRAR_ADMIN_PASSWORD=una-contraseña npm run sembrar
npm run dev                   # http://localhost:3000 → Soy empleado → Del Río → 0001
```

| Comando | Qué hace |
|---|---|
| `npm run validar` | Corre **todas** las pruebas y genera `docs/validacion.md` |
| `npm test` · `npm run test:sql` · `npm run humo` | Lógica · aislamiento en Postgres · punta a punta |
| `npm run prueba` | Prueba documentada con IA → `docs/prueba-documentada.md` |

La entrada de administración (RH) está en **Entrar → Administración**, con correo y contraseña. Las credenciales de
la demo las da el equipo.
