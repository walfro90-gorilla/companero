# Investigación (2026-10-09) — Cómo aprende la gente: ciencia del aprendizaje, comportamiento, multimedia y color

Para **Compañero** (inducción y refuerzo de cajeros). Complementa `docs/investigacion.md`, que ya cubre microlearning,
repaso espaciado básico, avatares comerciales, voz y RAG; aquí no se repite eso. Las decisiones que salgan de aquí van
en `docs/adr/` (sobre todo ADR 0005 avatar y ADR 0011 módulos y gamificación).

**Cómo se hizo:** cuatro investigaciones web en paralelo (ciencia cognitiva · comportamiento y motivación · multimedia,
avatar y color · aprendizaje adulto e inducción), priorizando metaanálisis y fuentes primarias con DOI. Los contrastes
de color de la paleta (§4) se recalcularon aquí con la fórmula de WCAG.

**Cómo leerlo**
- **Solidez:** *alta* = metaanálisis o réplicas · *media* = pocos estudios, laboratorio o correlacional · *baja* = marco
  de practicantes, opinión o dato de proveedor.
- **Tamaño de efecto** (d, g): 0.2 pequeño · 0.5 mediano · 0.8 grande. DE = desviaciones estándar.
- **"(no verificado)"** = no se confirmó en la fuente primaria. No usarlo en el pitch.
- Las cifras de laboratorio (p. ej. las medianas de Mayer) suelen salir más altas que las de metaanálisis
  independientes: planear con las independientes.

---

## Lo esencial en 12 ideas

1. **Recordar enseña más que releer.** Práctica de recuperación g = 0.50; con retroalimentación 0.73. Sin
   retroalimentación y con ≤50 % de aciertos, el efecto es **nulo** (g = 0.03).
2. **La retroalimentación debe explicar el porqué.** Explicativa 0.49 · dar la respuesta correcta 0.32 · solo
   "correcto/incorrecto" 0.05. Siempre sobre la tarea y nunca sobre la persona: **más de un tercio** de las
   intervenciones de retroalimentación empeoran el desempeño.
3. **Espaciar e intercalar en los repasos.** Los intervalos iguales bastan (crecientes vs. iguales: g = 0.034). Un
   acierto en cada una de 3 sesiones supera a 3 aciertos en una sola.
4. **Una idea por pantalla, con imagen real anotada pegada al texto y cero adornos** (coherencia d ≈ 0.70; los
   "detalles seductores" restan).
5. **Ver un modelo, practicar y equivocarse sin castigo.** El modelado tiene efecto grande en habilidad. El
   entrenamiento con errores da d = 0.44, y 0.80 en tareas nuevas.
6. **La IA que resuelve daña el aprendizaje; la que da pistas, no.** Con IA libre, el examen bajó 17 %. Un asistente
   RAG **que cita los materiales**, como Compañero, bajó la calificación 0.37 DE cuando se usó para pedir respuestas.
7. **La IA ayuda más a los novatos:** en soporte al cliente, +34 % de productividad en los menos experimentados.
8. **El avatar ayuda poco, pero ayuda** (g = 0.20). Los 2D rinden más que los 3D (0.38 vs. 0.11). Conviene chico,
   estilizado y siempre con texto.
9. **Color: "el rojo perjudica" no se sostiene.** Lo que sí funciona es el color como código (siempre con ícono y
   palabra), contraste ≥ 4.5:1 (meta 7:1) y modo claro por defecto.
10. **La gamificación funciona para aprender (g ≈ 0.49), pero se desgasta.** Lo correcto: sin ranking, premios por
    dominio, racha flexible por turnos y sorpresas.
11. **Mitos:** estilos de aprendizaje, pirámide del aprendizaje, "10 % del cerebro", "la IA dará 2 sigma".
12. **En la inducción pesan más la aceptación social y la claridad del puesto.** Un buddy humano y el supervisor
    importan; el avatar no los sustituye.

---

## 1. Ciencia cognitiva: qué hace que se aprenda y se recuerde

| Técnica | Qué es | Efecto / hallazgo | Solidez | Fuente |
|---|---|---|---|---|
| Práctica de recuperación | Recordar sin ver el material | g = 0.50 vs. releer. Con retroalimentación 0.73, sin ella 0.39. **Sin retroalimentación y ≤50 % de aciertos: 0.03.** Retención ≥1 día: 0.69. En aulas reales (48,478 alumnos): 0.50. Otros metaanálisis: ≈0.61 (rango 0.50–0.61) | Alta | Rowland 2014; Yang 2021; Adesope 2017 |
| Transferencia del testing | Preguntas nuevas o de aplicación | d = 0.40 (0.16–0.61 según tipo). Sube con alto acierto inicial y retroalimentación elaborada | Alta | Pan & Rickard 2018 |
| Retroalimentación | Explicar el porqué vs. marcar correcto/incorrecto | Global d = 0.48 (435 estudios), muy variable. En entornos digitales: explicativa 0.49, respuesta correcta 0.32, solo correcto/incorrecto 0.05 | Alta | Wisniewski 2020; Van der Kleij 2015; Mertens (retroalimentación) 2022 |
| Momento de la retroalimentación | Inmediata vs. diferida | Mixto. En laboratorio gana la diferida (pocos efectos); en entornos digitales la diferida rinde menos. Tras opción múltiple, la retroalimentación evita aprender los distractores | Media | Rowland 2014; Butler 2007; Butler & Roediger 2008; Van der Kleij 2015 |
| Preguntas previas | Preguntar antes de enseñar | g = 0.54 en lo preguntado y 0.04 en lo no preguntado. Funciona aunque se fallen, si luego se ve la respuesta | Alta (efecto específico) | St. Hilaire 2024; Pan & Carpenter 2023 |
| Intercalado | Mezclar tipos de problema | g = 0.42. Ayuda más cuando las categorías se parecen. **Con listas de palabras: −0.39** (ahí conviene bloquear) | Alta, condicional | Brunmair & Richter 2019 |
| Autoexplicación / generación | Explicarse el porqué; producir en vez de leer | Autoexplicación g = 0.55; generación d = 0.40 | Alta | Bisra 2018; Bertsch 2007 |
| Ejemplos resueltos | Solución paso a paso para estudiar | g = 0.48 (55 estudios). Agregar preguntas de autoexplicación al ejemplo **bajó** el efecto | Alta | Barbieri 2023 |
| Desvanecimiento / inversión de pericia | Retirar pasos conforme avanza; lo que ayuda al novato estorba al experto | Confirmado; metaanálisis 2025 (cifras no verificadas) | Media-alta | Kalyuga 2003; Tetzlaff 2025 |
| Andamiaje digital | Apoyo temporal dentro de la tarea | g = 0.46 (144 estudios); **mayor en adultos** | Alta | Belland 2017 |
| Carga cognitiva | Memoria de trabajo limitada: quitar lo que no suma y dosificar lo complejo | Quitar adornos: mediana d = 0.86 (23 de 23 pruebas, laboratorio) | Alta | Sweller 2019; Mayer |
| Descubrimiento sin guía | "Que lo descubra solo" | d = −0.38 vs. instrucción explícita; con guía, +0.30 | Alta | Alfieri 2011 |
| Ranking de Dunlosky | 10 técnicas de estudio | Utilidad **alta**: recuperación y práctica distribuida. **Moderada**: interrogación elaborativa, autoexplicación, intercalado. **Baja**: resumir, subrayar, palabra clave, imágenes mentales, releer. La actualización de 2021 nota que el 93 % de los efectos mide aprendizaje superficial | Alta | Dunlosky 2013; Donoghue & Hattie 2021 |
| Dificultades deseables / ilusión de fluidez | Lo que cuesta se retiene; lo fácil engaña | 78 % prefirió estudiar en bloque aun después de ver su examen. En clase activa se aprende más pero se *siente* que menos | Alta | Bjork & Bjork 2020; Kornell & Bjork 2008; Deslauriers 2019 |
| Errores con alta confianza | Equivocarse seguro y recibir corrección | Se corrigen mejor, pero regresan si no se repasan | Alta | Metcalfe 2017 |
| Dominio y tutoría | Avanzar al dominar; uno a uno | Dominio: positivo en 108 evaluaciones, más en los débiles. Tutor humano 0.79; tutor inteligente paso a paso 0.76; el que solo califica la respuesta final 0.31. **El "2 sigma" de Bloom no se replicó** (0 de 96 estudios) | Alta | Kulik 1990; VanLehn 2011; von Hippel 2024 |
| Curva del olvido | Pérdida rápida y luego lenta | Réplica con 1 sujeto y sílabas sin sentido; mide ahorro al reaprender, no recuerdo | Media | Murre & Dros 2015 |
| Cuándo repasar | Intervalo entre repasos | Óptimo ≈20–40 % del plazo si hay que recordar a 1 semana; 5–10 % si es a 1 año. Crecientes vs. iguales: g = 0.034 | Alta | Cepeda 2008; Latimier 2021; Rawson & Dunlosky 2022 |
| Marcos de diseño | Merrill (problema → activar → demostrar → aplicar → integrar), 9 eventos de Gagné, Bloom revisada | Útiles para estructurar; poca prueba experimental directa | Baja-media | Merrill 2002 |
| Transferencia al puesto | Usar lo aprendido en el trabajo | Pesan la motivación, el clima de transferencia y el **apoyo del supervisor** (89 estudios) | Alta (correlacional) | Blume 2010 |

---

## 2. Comportamiento y motivación: que quiera aprender, lo haga y vuelva

| Modelo / técnica | Idea central | Evidencia | Solidez | Fuente |
|---|---|---|---|---|
| Reforzamiento positivo (Skinner) | Una consecuencia agradable e inmediata hace que la conducta se repita | En empresas d = 0.51 (≈17 % más desempeño). Dinero + retroalimentación + reconocimiento: el mayor efecto | Alta | Stajkovic & Luthans 1997, 2003 |
| Programas variables | La recompensa impredecible engancha (error de predicción, dopamina) | El mecanismo es sólido. El riesgo: las cajas de botín se asocian a juego problemático (r ≈ 0.27) | Alta / media | Schultz 1997; Spicer 2022 |
| Autoeficacia y modelado (Bandura) | "Puedo hacerlo": por logros propios y viendo a un par | Autoeficacia–desempeño r = 0.38 (114 estudios). Modelado: grande en conocimiento y habilidad, modesto en conducta; mejor con modelos **correctos e incorrectos**, reglas en vez de guiones y metas de aplicación | Alta | Bandura 1977; Stajkovic & Luthans 1998; Taylor 2005 |
| Autodeterminación (Deci & Ryan) | Autonomía, competencia, relación | La motivación "identificada" (le veo valor) predice persistencia; la externa no predice desempeño y baja el bienestar. Dar a elegir ayuda, mejor con 2–4 opciones | Alta | Howard 2021; Patall 2008 |
| Sobrejustificación | Los premios tangibles esperados minan el interés | Tangibles d = −0.34; **inesperados ≈ 0.01**; retroalimentación positiva +0.33; **elogio controlador ("como debías") −0.44**. Los incentivos predicen *cantidad*; la motivación intrínseca, *calidad* | Alta | Deci, Koestner & Ryan 1999; Cerasoli 2014 |
| Fogg (B = MAP) y COM-B | Motivación + habilidad + aviso; diagnosticar capacidad, oportunidad, motivación | Fogg: 6 estudios heterogéneos. COM-B es un método de diseño, sin efecto propio | Baja / media | Fogg 2009; Anselmi 2025; Michie 2011 |
| Hábitos | Repetir en el mismo contexto | Mediana 66 días (18–254). **Faltar una vez no afectó** la formación del hábito | Media | Lally 2010; Singh 2024 |
| Intenciones de implementación | "Si pasa X, entonces hago Y" | d = 0.65 (94 pruebas); 0.27–0.66 en 642 pruebas | Alta | Gollwitzer & Sheeran 2006; Sheeran 2024 |
| Nudges | Cambiar el entorno de decisión | d = 0.43 sin corregir; **≈0.04 corregido por sesgo de publicación**. Recordatorios ≈ 0.00 | Media | Mertens (nudges) 2022; Maier 2022; DellaVigna & Linos 2022 |
| Gamificación | Elementos de juego | Aprendizaje g = 0.49, motivación 0.36, conducta 0.25 (solo aprendizaje se sostiene con estudios rigurosos). Se desgasta: de 0.42 a 0.15 a las 14 semanas | Media | Sailer & Homner 2020; Bai 2020; Huang 2020; Mazeas 2022 |
| Elementos por separado | Cada elemento hace algo distinto | Insignias y gráficas de desempeño → competencia; historia, avatar y compañeros → relación. Tabla de posiciones + insignias obligatorias **bajó** motivación, satisfacción y examen final | Media | Sailer 2017; Mekler 2017; Hanus & Fox 2015 |
| Rachas | Mantener la racha se vuelve meta | Ver la racha rota reduce el uso, sobre todo si la persona se culpa; poder "repararla" lo atenúa. En Perú (60,000 niños) resaltar rachas subió uso y logro. Riesgos: cuidar la métrica en vez de aprender y culpa al dejar la app | Media | Silverman & Barasch 2023; Aulagnon 2026 (working paper); Kuo 2026 |
| Retroalimentación | Brecha + siguiente paso | d = 0.41 (Kluger & DeNisi), pero **>1/3 empeora** cuando la atención se va al "yo". Retroalimentación con mucha información 0.99; premio/castigo 0.24 | Alta | Kluger & DeNisi 1996; Wisniewski 2020; Hattie & Timperley 2007 |
| Monitoreo del progreso | Ver el propio avance | d = 0.40 (138 experimentos); mayor si queda registrado | Alta | Harkin 2016 |
| Curiosidad y sorpresa | Lo que intriga y lo aislado se recuerdan mejor | Curiosidad mejora la memoria del tema; **no "contagia"** a datos no relacionados. Efecto von Restorff (aislamiento) | Media | Gruber 2014; Keller 2024; Hunt 1995 (no verificado) |
| Narrativa | Historias vs. texto expositivo | g ≈ 0.55 (75+ muestras, 33,000 personas) | Media-alta | Mar 2021 |
| Estrés | Estrés antes de aprender o recordar | Reduce la memoria (113 estudios) → **sin cronómetros en las evaluaciones** | Alta | Shields 2017 |
| Mentalidad de crecimiento | "La habilidad se desarrolla" | Intervenciones d = 0.05–0.08 (no significativo tras corregir sesgo) | Baja | Sisk 2018; Macnamara & Burgoyne 2023; Yeager 2019 |
| Seguridad psicológica | Si es seguro preguntar y equivocarse, se aprende | Respaldo en manufactura y metaanálisis (mayormente transversal). Los nuevos la pierden tras el primer año | Media-alta | Edmondson 1999; Frazier 2017 |
| Humano virtual | Ante una computadora se teme menos al juicio | La gente se abre más con un humano virtual (un estudio) | Media | Lucas 2014 |

---

## 3. Imágenes, multimedia y video

Cifras d de Mayer 2017 (laboratorio); entre paréntesis, metaanálisis independientes cuando existen.

| Principio | Qué hacer | Efecto | Solidez | Fuente |
|---|---|---|---|---|
| Multimedia / codificación dual | Palabra + imagen que muestren lo mismo | d = 1.67. Las imágenes ligadas al texto ayudan **sobre todo con baja alfabetización** | Alta | Mayer 2017; Paivio 1991; Houts 2006 |
| Coherencia | Quitar foto de stock, memes, curiosidades, música | d = 0.70; los detalles seductores restan (Rey 2012; Sundararajan & Adesope 2020) y el daño crece con la cantidad | Alta | Rey 2012; Sundararajan & Adesope 2020; Wesenberg 2026 |
| Tipo de imagen | Representativas u organizativas, no decorativas | Las decorativas: nulo o negativo | Media | Carney & Levin 2002 |
| Señalización | Flechas, números, resaltado | d = 0.46 (independiente: 0.38). Ayuda a novatos; puede estorbar a expertos | Alta | Alpizar 2020; Richter 2016, 2018 |
| Redundancia | Con voz + imagen, no repetir el texto literal: solo palabras clave | d = 0.87; voz + texto ayuda a novatos solo sin imágenes | Media-alta | Adesope & Nesbit 2012 |
| Contigüidad espacial | Etiqueta pegada a la parte; retroalimentación junto a la respuesta | d = 0.79 (independiente: 0.63) | Alta | Schroeder & Cenkci 2018 |
| Segmentación | Pasos cortos con "Siguiente" | d = 0.70 (independiente: pequeño-mediano) | Alta | Rey 2019 |
| Preentrenamiento | Nombrar partes y términos antes del procedimiento | d = 0.46 | Media | Mayer 2017 |
| Modalidad | Explicar diagramas con voz | d = 0.72 cuando el sistema marca el ritmo; **falla si el usuario controla el ritmo** | Media | Ginns 2005 |
| Personalización | "Tú", tono cortés y conversacional | d = 0.79 (independiente: 0.30–0.54) | Alta | Ginns 2013 |
| Voz | Voz clara; el TTS moderno sirve | TTS moderno ≈ voz humana | Media | Craig & Schroeder 2019 |
| Imagen del instructor | Poner una cara no garantiza aprendizaje | Pequeño en retención, nulo en transferencia; sube la motivación pero quita mirada al material | Media | Beege 2023 |
| Encarnación | Gestos que señalan, mirada al contenido | d = 0.36 | Media | Davis 2018 |
| Actividad generativa | Preguntas intercaladas, explicar con sus palabras | Preguntas intercaladas en video: menos divagación, más aprendizaje | Alta | Fiorella & Mayer 2016; Szpunar 2013 |
| Diseño emocional | Colores agradables, formas redondas | Retención d = 0.39, motivación 0.26 | Media | Brom 2018; Wong & Adesope 2021 |
| Animación vs. estática | Animar procedimientos; estática para ubicar partes | d = 0.37; procedimental-motor 1.06; la estática gana en disposición espacial | Media-alta | Höffler & Leutner 2007; Berney & Bétrancourt 2016; Ploetzner 2021 |
| Video | Como complemento, < 6 min | Sustituir g = 0.28; **complementar 0.80**. ≤ 6 min = más enganche (no mide aprendizaje) | Alta / media | Noetel 2021; Guo 2014 |
| Subtítulos | Siempre disponibles | Mejoran comprensión y memoria (100+ estudios) | Alta | Gernsbacher 2015 |
| Íconos | Ícono + etiqueta | El ícono solo rinde peor al inicio | Media | Wiedenbeck 1999 |

---

## 4. Psicología del color: mito vs. evidencia

**Mitos**
- **"El rojo perjudica el desempeño"** (Elliot 2007). Metaanálisis Gnambs 2020 (67 efectos): tras corregir sesgo de
  publicación, no queda efecto, y las réplicas cercanas fallaron. No hay que evitar el rojo: hay que darle **un solo
  significado**.
- **"El azul calma, el verde concentra."** El propio Elliot dice que el campo es naciente y sin base para aplicarse.
  Las asociaciones color–emoción son casi universales (30 países, r = .88), pero asociar no es aprender mejor.

**Lo que sí tiene evidencia**
- **Color como código:** colorear igual el texto y su parte en la imagen mejora retención y transferencia, sobre todo
  en novatos (Ozcelik 2009).
- **Contraste WCAG 2.2 (AA):** texto 4.5:1 · texto grande (≥ 24 px, o ≥ 18.66 px en negritas) 3:1 · componentes y
  gráficos 3:1 · **el color nunca es el único medio** (1.4.1) · AAA pide 7:1.
- **Daltonismo:** ≈8 % de los hombres y 0.4 % de las mujeres de origen europeo; el par más confundido es rojo/verde,
  justo correcto/error. No se encontró prevalencia mexicana confiable.
- **Claro vs. oscuro:** texto oscuro sobre claro se lee mejor a toda edad; en penumbra el modo oscuro fue el peor para
  leer de un vistazo. → **Claro por defecto, oscuro opcional.**
- **México, NOM-026-STPS-2008:** rojo = paro/prohibición/incendio · amarillo = advertencia · verde = condición segura ·
  azul = obligación. Los cajeros ya conviven con ese código: respetarlo y **no usar rojo para promociones** dentro de la
  app (que sea solo "error/alto").

**Paleta funcional (contraste sobre blanco, recalculado aquí con la fórmula WCAG)**

| Estado | Color | Contraste | Además del color |
|---|---|---|---|
| Correcto | `#146C2E` | 6.53:1 | Palomita + "Correcto" |
| Error | `#B3261E` | 6.54:1 | Tache + qué hacer |
| Alerta | Fondo `#F5B800` con texto `#1A1A1A` | 9.73:1 | Triángulo + "Atención" |
| Alerta (texto/ícono sobre blanco) | `#7A4F00` | 7.13:1 | El ámbar `#F5B800` sobre blanco da solo 1.79:1: no usarlo para texto |
| Info / obligatorio | `#1558B0` | 6.87:1 | "i" en círculo |
| Texto base | `#1F2933` | 14.76:1 | — |

Meta sugerida de 7:1 por los reflejos y la luz variable de tienda (inferencia, no probado en tiendas). Probar con un
simulador de protanopia y deuteranopia.

---

## 5. El avatar: cuándo ayuda y cuándo estorba

- **Efecto global pequeño:** Schroeder 2013 (43 estudios) pequeño pero significativo; Castro-Alonso 2021 g = 0.20.
  **2D > 3D (0.38 vs. 0.11).** Gestos, movimiento y voz no moderaron el efecto.
- **Valle inquietante:** casi humano con distorsión facial genera rechazo (g = 1.01–1.46, Diel 2021). Un personaje 2D
  estilizado lo evita.
- **Avatares de IA generativa 2024–2026:** mismo aprendizaje y experiencia algo peor (Netland 2024, 447 personas);
  menos enganche y reportes de distracción (Arkün-Kocadere 2024). Un avatar "agradable" sí mejoró motivación (Pi 2022).

**Ayuda** cuando da retroalimentación, guía transiciones, hace de cliente en la práctica, señala con gestos y motiva a
novatos. **Estorba** cuando compite con un diagrama, es grande, se anima sin parar, parece casi humano, habla sin
texto ni controles o alarga la lección.

**Para el avatar 2D de Compañero (ADR 0005)**
1. Caricatura plana con formas redondas; nada de fotorrealismo ni lip-sync casi humano.
2. Chico y en una esquina durante lecciones y diagramas; crece en la práctica y en la retroalimentación.
3. Cada estado se distingue por forma, movimiento **y texto**: escucha (ondas + "Te escucho") · piensa (puntos +
   "Buscando en el manual…", que de paso explica la espera) · habla (boca + subtítulo).
4. Gestos y mirada hacia el elemento que explica.
5. Animación en reposo mínima, respetando `prefers-reduced-motion`.
6. Voz opcional, siempre con texto y con pausar, repetir y velocidad.
7. Cara positiva al acertar y empática al fallar; nunca regaño.
8. La cita del documento en una tarjeta pegada a la respuesta (contigüidad).

---

## 6. IA que enseña vs. IA que resuelve: los guardarrailes

| Estudio | Qué pasó | Solidez |
|---|---|---|
| Kestin 2025 (Harvard, física, n = 194) | Tutor IA con soluciones de expertos dentro del prompt y guía parte por parte: ganancia mediana más del doble que la clase activa (0.73–1.3 DE). No midió retención | Media-alta |
| Bastani 2025 (PNAS, ~1,000 alumnos) | ChatGPT tal cual: práctica +48 %, **examen sin IA −17 %**. Tutor que solo da pistas: práctica +127 % y **sin daño** en el examen | Alta |
| Liu 2026 (2,379 universitarios, aleatorizado, sin revisión por pares) | **Asistente RAG que cita los materiales del curso**: calificación final −0.37 DE, participación −0.90 DE; 74 % de las peticiones eran "dame la respuesta". **Es el caso más parecido a Compañero** | Media |
| Brynjolfsson, Li & Raymond (NBER 2023; QJE 2025) | Asistente de IA para agentes de soporte: +14–15 % casos por hora; **+34 % en novatos** | Alta |
| Dell'Acqua 2023 (BCG) | +12.2 % tareas, 25.1 % más rápido, >40 % calidad… pero **−19 pp** en tareas fuera de lo que la IA hace bien | Alta |
| Otis 2025 (Kenia, 640 emprendedores, WhatsApp) | Sin efecto promedio: los de bajo desempeño empeoraron ~10 % (aplicaron peor el consejo) | Alta |
| Tutor CoPilot (Wang 2024) | +4 pp de dominio; +9 pp con los tutores más débiles | Alta |
| Lehmann; Contractor & Reyes 2026; Fan 2025 | Complementar el esfuerzo suma; sustituirlo resta ("pereza metacognitiva") | Media (preprints) |

**Qué significa:** Compañero tiene dos trabajos distintos y conviene que el avatar se comporte distinto en cada uno.
- **Modo aprender (lección, test, práctica):** primero el intento → pista 1 → pista 2 → ejemplo parecido → respuesta. Las
  soluciones vienen del manual (no las inventa el modelo). El dominio se mide **solo con aciertos sin ayuda**.
- **Modo caja (consulta libre en el turno):** respuesta directa, corta (≤3 líneas), con cita y checklist; es apoyo
  justo a tiempo, como en Brynjolfsson. Pero la ayuda se **desvanece**: si alguien pregunta lo mismo 3 veces, se le
  propone practicarlo (lección de la realidad aumentada en manufactura: con ayuda permanente la tarea se hace 43.8 % más
  rápido, pero al quitarla toma 23 % más; se aprende menos).
- Si la consulta libre toca un tema del módulo en curso: "¿Qué harías tú?" antes de responder.
- **Medir** el porcentaje de peticiones "dame la respuesta" (el indicador de Liu 2026).
- Candados para novatos (Otis): solo contenido del manual; lo que no está, se canaliza; nunca improvisar políticas de
  efectivo o devoluciones (ya en ADR 0006).

---

## 7. Adultos en el trabajo e inducción

| Práctica / modelo | Qué es | Evidencia | Solidez | Fuente |
|---|---|---|---|---|
| Andragogía (Knowles) | 6 supuestos del adulto que aprende | Efectividad "inconclusa" tras 30+ años; útil como heurística | Baja | Rachal 2002 |
| Ciclo de Kolb | Experiencia → reflexión → concepto → prueba | Poca prueba empírica | Baja | Morris 2020 |
| 70-20-10 | 70 % en el trabajo, 20 % de otros, 10 % formal | Evidencia "débil", definiciones inconsistentes | Baja | Clardy 2018 |
| 4 C de Bauer | Cumplimiento, Clarificación, Cultura, Conexión | Marco; solo ~20 % de las empresas cubren las 4 | Media | Bauer 2010 (SHRM) |
| Socialización organizacional | Qué conecta onboarding con permanencia | Claridad de rol, autoeficacia y **aceptación social** (70 muestras). 2025 (183 estudios): pesan más la aceptación social y la conducta proactiva | Alta | Bauer 2007; Bauer 2025 |
| Previsualización realista del puesto | Mostrar lo bueno y lo difícil | 52 estudios: funciona porque la empresa se ve honesta; efecto modesto en rotación | Alta (efecto pequeño) | Earnest 2011 |
| Buddy / mentor | Compañero asignado | Microsoft (autorreporte de la empresa): con >8 reuniones en 90 días, 97 % dijo que le ayudó a ser productivo rápido. Metaanálisis de mentoría: efecto pequeño | Media-baja | SHRM; Eby 2008 |
| Práctica deliberada | Práctica diseñada con retroalimentación | Explica 26 % en juegos, 4 % en educación, <1 % en profesiones (contra la versión fuerte de Ericsson) | Alta | Macnamara 2014 |
| Modelado + juego de roles | Ver, practicar, retroalimentar, planear | Grande en habilidad; transfiere mejor con modelos buenos y malos y con el supervisor capacitado | Alta | Taylor, Russ-Eft & Chan 2005 |
| Simulación | Juegos de simulación | Autoeficacia +20 %, conocimiento procedimental +14 %, retención +9 %; mejor como complemento | Media-alta | Sitzmann 2011 |
| Cliente simulado con IA | Un LLM hace de cliente | Ensayo de conflictos (n = 40): escalada −67 %. Pacientes virtuales con IA: mejoran, pero menos que con actores. **Sin estudios en retail** | Media-baja | Shaikh 2024; PMC12634008 |
| Apoyo justo a tiempo | "5 momentos de necesidad" | Marco de practicantes sin ensayos; la contrapartida de la ayuda permanente sí está medida (§6) | Baja / alta | Gottfredson & Mosher 2011; MSOM 2022 |
| Checklists | Lista corta en puntos críticos | Cirugía: mortalidad 1.5 % → 0.8 % (antes-después). Ontario (101 hospitales): sin mejora; **depende de que se use de verdad** | Media | Haynes 2009; Urbach 2014 |
| Aprendizaje móvil | Celular como medio | g = 0.52 (110 estudios). Importa el método, no el medio | Media | Sung 2016; Sitzmann 2006 |
| Habilidades blandas en primera línea | 80 h de curso a costureras (India) | +13.5 % productividad, retorno 256 % a 8 meses; sin efecto en retención | Alta (ECA) | Adhvaryu 2023 |
| Kirkpatrick | Reacción, aprendizaje, conducta, resultados | Que el curso "guste" casi no predice transferencia; que se perciba **útil** sí | Alta | Alliger 1997 |
| Juegos serios | Juegos completos | d = 0.29 en aprendizaje; no motivan más | Media-alta | Wouters 2013 |
| Realidad aumentada | Información sobre la vista real | Educación d = 0.68, pero estudios de < 1 mes (efecto novedad); retail solo datos de proveedor | Media / baja | Garzón 2019 |
| Cómic, podcast, voz con IA | Formatos novedosos | Cómic: metaanálisis sin resultados aún; podcast: aprendizaje mixto; voz con IA en el trabajo: sin ensayos. **Llaman la atención, sin evidencia** | Baja | PCI RR 575; PMC12067963 |

**Estadísticas virales que NO hay que usar en el pitch:** "+82 % de retención con buen onboarding" (sin origen
rastreable, de proveedor), "69 % más probable que se quede 3 años" (un caso de Corning de 1998), "la mitad de los
trabajadores por hora se va en 120 días" (póster de 2010). Lo defendible: Gallup 2019, solo 12 % dice que su empresa
hace bien el onboarding (consultora).

---

## 8. Mitos

| Mito | Qué dice la evidencia | Fuente |
|---|---|---|
| Estilos de aprendizaje (visual/auditivo/kinestésico) | Ningún experimento válido apoya adaptar la enseñanza al "estilo"; lo cree el 89 % de los docentes. Lo que sí funciona: ajustar el formato **al contenido** (cobrar se demuestra, no se describe) | Pashler 2008; Newton & Salvi 2020 |
| Pirámide del aprendizaje / cono de Dale con porcentajes | Sin datos; los porcentajes son inventados | Letrud & Hernes 2018 |
| "Solo usamos el 10 % del cerebro" | La neuroimagen no encuentra regiones inactivas | Beyerstein; Dekker 2012 |
| "La IA dará 2 sigma" | Meta realista: ≈1/3 de DE | von Hippel 2024 |
| "Se olvida el 70 % en un día" | La curva se hizo con sílabas sin sentido | Murre & Dros 2015 |
| "El rojo perjudica" / "el azul calma" | No sobrevive a la corrección por sesgo | Gnambs 2020; Elliot 2019 |
| "Las lecciones de mentalidad de crecimiento funcionan" | Efectos mínimos; mejor construirla con el diseño (reintentos, errores normalizados) | Sisk 2018; Macnamara & Burgoyne 2023 |

---

## 9. Contexto México y Juárez (para diseñar)

- **El celular es la única pantalla segura** (ENDUTIH 2025, INEGI, publicada el 16-jun-2026): 97.6 % de 15–24 años y
  96.5 % de 25–34 usa internet; 84.6 % de la población usa celular y de ellos 97.0 % tiene smartphone; 90.6 % usa
  mensajería; **79.3 % es de prepago**; solo 38.1 % usa computadora. → App ligera, que aguante mala señal y gaste pocos
  datos.
- **Perfil del cajero en México** (Data México/ENOE, 1T-2026): 725 mil personas, $6,820 MXN al mes, 44.5 h por semana,
  33.4 años promedio, 12 años de escolaridad, 76.3 % mujeres.
- **Lectura:** Chihuahua promedia 10.0 años de escolaridad (Censo 2020). En PIAAC, 50.6 % de los adultos mexicanos está
  en nivel 1 de lectura o menos (OCDE; no verificado en el informe completo). → Lenguaje claro, una idea por frase,
  imagen con leyenda simple.
- **Supermercados en Juárez** (UACJ, Geplat 2021; 390 encuestados de 20 a 30 años, en pandemia): 60 % pensó en renunciar
  en los últimos 6 meses. Al elegir empleo pesan sueldo (33 %), horario (30 %) y cercanía (21 %). Causas señaladas:
  sueldo, inseguridad y asaltos, falta de crecimiento, **tareas confusas y poca comunicación con el supervisor**. Las dos
  últimas son justo lo que ataca Compañero. El estudio trae datos por cadena; no se reproducen aquí por ser de pandemia
  y sensibles para los patrocinadores.
- **Rotación:** no hay cifra oficial para cajeros. Referencias: OXXO 34.1 % anual (2013, fuente secundaria); México en
  general 17 % (proveedor); retail en EE. UU. 2025, 3.8 % de bajas al mes (BLS JOLTS).
- **Costo de una baja:** en EE. UU., 16 % del salario anual en puestos de menos de US$30k (CAP 2012). Ilustración
  (extrapolación): 16 % de ≈$81.8k MXN al año ≈ **$13k MXN por cajero**.
- **Ley:** el artículo 153-A de la LFT obliga a capacitar. Compañero genera evidencia de capacitación, pero no sustituye
  la constancia DC-3.

---

## 10. La gamificación de Compañero frente a la evidencia (ADR 0011)

| Elemento actual | Veredicto | Ajuste |
|---|---|---|
| **Sin ranking entre personas** | ✅ Conservar | Las tablas obligatorias bajaron motivación y examen (Hanus & Fox) y generan ansiedad (Bai 2020). Coherente con "evaluación de aprendizaje" |
| **Puntos** | ⚠️ Ajustar | Solo por **dominio demostrado** (aciertos en práctica y repaso), nunca por abrir la app ni por tiempo: los puntos suben la cantidad, no la motivación |
| **Niveles** | ⚠️ Ajustar | Que cada nivel sea una competencia real ("Nivel 2: cobro con tarjeta y vales"): así funcionan como monitoreo de progreso (d = 0.40) |
| **Insignias** | ⚠️ Ajustar | Por hitos de dominio + algunas **sorpresa** (los premios inesperados no dañan, d ≈ 0.01). Nunca por solo participar |
| **Racha** | 🔁 Cambiar | Diaria estricta no sirve a gente con turnos y descansos. Racha por **turnos** o semanal flexible (p. ej. 3 de 7 días), congelado en días de descanso, opción de reparar, y un contador acumulado que no se pierde ("días aprendidos este mes"). **Nunca "perdiste tu racha"** |
| **Festejo** | ⚠️ Ajustar | Corto y que nombre lo logrado ("Dominaste el corte de caja"). Celebrar la tarea, no a la persona. Al final de la lección, no en la pantalla de aprendizaje |
| **Reto por sucursal** | ✅ Conservar | Meta cooperativa ("80 % del equipo terminó Devoluciones"); competir + colaborar es lo que mejor sale. Solo agregados con un mínimo de personas, sin exhibir a la sucursal que va atrás |

**No agregar:** premios tangibles ligados a puntos (si la empresa da incentivo, por la certificación y como
reconocimiento), cronómetros en evaluaciones, ruletas o cofres aleatorios, mensajes de culpa.

**Sí agregar:** barra de progreso hacia "listo para caja"; narrativa de "mi primer turno"; elecciones reales (orden de
módulos, escenario de práctica); plan si-entonces al cerrar el primer uso.

---

## 11. Recomendaciones priorizadas

Ligadas a los criterios de la ficha (ADR 0008): Exactitud 30 % · **Utilidad para la inducción 25 %** · **Uso efectivo
de IA 20 %** · **Experiencia de uso 15 %** · **Viabilidad de prueba piloto 10 %**. Revisar contra lo ya construido
antes de cambiar código.

### A. Para la demo del sábado (cambios de prompt, texto y estilo; alto impacto)

| # | Recomendación | Criterio | Evidencia |
|---|---|---|---|
| A1 | **Orden del módulo:** pregunta previa sin calificar sobre un caso real → lección de una idea con ejemplo resuelto sobre el procedimiento del manual → test con retroalimentación → práctica con cliente simulado → repaso | Utilidad | Preguntas previas 0.54; ejemplos resueltos 0.48; recuperación 0.73 con retroalimentación |
| A2 | **Test:** 5–8 preguntas (la ficha pide ≥5), distractores = errores reales de cajero, **≥2 casos nuevos** de aplicación, retroalimentación que explique el porqué, qué hacer y cite la sección | Utilidad, Exactitud | Retroalimentación explicativa 0.49 vs. 0.05; transferencia 0.40 |
| A3 | **Pistas antes que respuesta** en test y práctica (intento → pista 1 → pista 2 → ejemplo → respuesta) | Uso efectivo de IA | Bastani 2025; Liu 2026 |
| A4 | **Tono del avatar:** retroalimentación sobre la tarea y el siguiente paso ("Casi: el cambio era $37, no $27. Tip: cuenta del total hacia arriba. Va otra"); sin "debes/tienes que"; nunca "eres muy bueno/malo" | Experiencia | Elogio controlador −0.44; >1/3 del feedback daña si va al "yo" |
| A5 | **Preguntar sin pena:** decirlo y que sea cierto: "Tu supervisor no ve tus preguntas, solo tu avance" (ADR 0011 ya lo garantiza con RLS) | Experiencia | Seguridad psicológica; humano virtual (Lucas 2014) |
| A6 | **Racha flexible** + puntos por dominio + festejo que nombra lo logrado (§10) | Experiencia | §2 y §10 |
| A7 | **Visual:** paleta verificada (§4), ícono + palabra en todo estado, texto ≥ 16 px (mejor 18), interlineado 1.5, áreas táctiles ≥ 44 px, modo claro, `prefers-reduced-motion` | Experiencia | WCAG 2.2; Piepenbrock 2013 |
| A8 | **Avatar:** estados con texto ("Buscando en el manual…"), chico durante la lección, cita en tarjeta pegada a la respuesta | Experiencia, Exactitud | §5 |
| A9 | **Plan de piloto con Kirkpatrick** en la presentación (§12) | Viabilidad | Alliger 1997 |

### B. Para el piloto con cajeros

- **Buddy humano obligatorio**, agendado por el avatar (meta: ≥4 encuentros en 90 días) y un "modo supervisor". El
  avatar presenta por nombre al buddy y al supervisor el primer día (conexión y claridad primero; el cumplimiento se
  reparte en la semana).
- **Repaso:** día 0 hasta acertar cada ítem crítico; luego 3–5 preguntas los días 1–2, 7 y 21–30, **fuera del turno**;
  el ítem fallado vuelve antes; tras 2 aciertos seguidos se retira. Intercalar en los repasos lo que se confunde (tarjeta,
  vales, devolución), no en la primera lección.
- **"¿Seguro o no seguro?"** en preguntas críticas: el error cometido con seguridad recibe explicación destacada y vuelve
  en 1–2 días.
- **Dificultad:** apuntar a 70–85 % de aciertos al primer intento; si alguien falla la mayoría, regresarlo a un ejemplo
  resuelto en vez de repetir el test. Quien acierte las preguntas previas salta a la práctica (inversión de pericia).
- **Modo caja con ayuda que se desvanece** (§6) y medir el % de "dame la respuesta".
- **Checklists** de apertura, corte y arqueo **con base en el manual**, verificadas por el supervisor.
- **Recordatorios** opcionales, máximo uno al día, con horas de silencio, sin culpa, y con A/B (sus efectos suelen ser
  casi nulos; pesa más el plan si-entonces que hace la propia persona).
- **Validar con 5–8 cajeros reales** antes de escalar.

### C. Después (si hay tiempo o en el producto)

- Clip de 20–30 s de **cajero modelo haciéndolo bien y cometiendo el error común**, luego 3 reglas, luego práctica.
- **Previsualización realista del puesto** de 2 min (filas largas, cliente molesto, corte) después de contratar.
- Narrativa "mi primer turno" que hile los módulos.
- Escenarios del cliente simulado propuestos por cajeros veteranos, con dificultad que sube por pasos.
- Módulo de incidencias y seguridad **solo con lo que diga el manual** (sección 13 de Tienda Escuela); nunca inventar
  protocolos.
- Audio opcional para quien lee poco.

### Lo que NO hay que hacer
Ranking individual · premios tangibles por puntos · cronómetros en el test · ruletas o cofres aleatorios · mensajes de
culpa · avatar fotorrealista · fotos de stock o imágenes decorativas · que el avatar lea en voz alta el texto que ya está
en pantalla · evaluar módulos con "¿te gustó?" · lecciones de "mentalidad de crecimiento" · estadísticas virales en el
pitch.

---

## 12. Cómo medir el piloto (Kirkpatrick + Phillips)

- **Diseño:** cohorte con Compañero vs. inducción habitual, en tiendas pareadas o semanas alternas; reportar tamaños de
  efecto con intervalos. Esperar efectos pequeños y desconfiar de los grandes.
- **Nivel 1 (reacción):** preguntar por **utilidad** ("¿te sirvió para tu turno?"), no por agrado.
- **Nivel 2 (aprendizaje):** prueba antes y después, retención a 7 días, juego de roles calificado con rúbrica.
- **Nivel 3 (conducta):** observación del supervisor con checklist los días 3 y 14; tiempo hasta ser cajero autónomo;
  mapa de dudas al avatar (ya existe como "huecos del material").
- **Nivel 4 (resultados):** bajas a 30, 60 y 90 días; diferencias de caja; quejas.
- **ROI:** bajas evitadas × costo por baja − costo del programa.
- En 2 semanas solo se ven los niveles 1 a 3; el nivel 4 necesita 90 días.
- **Métricas de producto:** finalización por módulo, retención a 7 días, aciertos en el repaso espaciado, preguntas al
  avatar y % de peticiones "dame la respuesta".

---

## 13. Frases para el pitch (solo con cifras verificadas)

- "La IA ayuda más a quien empieza: en soporte al cliente, los novatos rindieron **34 % más** con un asistente de IA
  (Brynjolfsson, Li & Raymond, NBER 2023 / QJE 2025)."
- "Y la diseñamos para **enseñar, no para resolver por ellos**: cuando la IA da la respuesta, el examen baja **17 %**;
  cuando da pistas, no (Bastani et al., PNAS 2025)."
- "Recordar enseña más que releer: el test con retroalimentación explicada casi duplica el efecto (g = 0.73 vs. 0.39;
  Rowland 2014)."
- "El celular es la única pantalla con la que se puede contar: 97 % de los jóvenes usa internet y 79 % es de prepago
  (INEGI, ENDUTIH 2025). Por eso Compañero es ligero y móvil."
- "Sin ranking a propósito: las tablas de posiciones obligatorias bajaron la motivación y la calificación (Hanus & Fox
  2015)."

---

## Fuentes

**Ciencia cognitiva.** Rowland 2014 https://doi.org/10.1037/a0037559 · Yang 2021 https://doi.org/10.1037/bul0000309 ·
Adesope 2017 https://doi.org/10.3102/0034654316689306 · Pan & Rickard 2018 https://doi.org/10.1037/bul0000151 ·
Wisniewski 2020 https://doi.org/10.3389/fpsyg.2019.03087 · Van der Kleij 2015 https://doi.org/10.3102/0034654314564881 ·
Mertens (retroalimentación) 2022 https://doi.org/10.1037/edu0000764 · Butler 2007 https://doi.org/10.1037/1076-898X.13.4.273 ·
Butler & Roediger 2008, *Memory & Cognition* 36(3) · St. Hilaire 2024 https://doi.org/10.3758/s13423-023-02353-8 ·
Pan & Carpenter 2023 https://doi.org/10.1007/s10648-023-09814-5 · Brunmair & Richter 2019 https://doi.org/10.1037/bul0000209 ·
Bisra 2018 https://doi.org/10.1007/s10648-018-9434-x · Bertsch 2007 https://doi.org/10.3758/BF03193441 ·
Barbieri 2023 https://doi.org/10.1007/s10648-023-09745-1 · Kalyuga 2003, *Educational Psychologist* 38(1) ·
Tetzlaff 2025 https://doi.org/10.1016/j.learninstruc.2025.102142 · Belland 2017 https://doi.org/10.3102/0034654316670999 ·
Sweller 2019 https://doi.org/10.1007/s10648-019-09465-5 · Alfieri 2011 https://doi.org/10.1037/a0021017 ·
Dunlosky 2013 https://doi.org/10.1177/1529100612453266 · Donoghue & Hattie 2021 https://doi.org/10.3389/feduc.2021.581216 ·
Bjork & Bjork 2020 https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2021/01/RABjorkELBjorkJARMAC2020ForPostingSingleSpaced.pdf ·
Kornell & Bjork 2008, *Psychological Science* 19(6) · Deslauriers 2019 https://doi.org/10.1073/pnas.1821936116 ·
Metcalfe 2017 https://doi.org/10.1146/annurev-psych-010416-044022 · Kulik 1990 https://doi.org/10.3102/00346543060002265 ·
VanLehn 2011 https://doi.org/10.1080/00461520.2011.611369 · von Hippel 2024 https://www.educationnext.org/two-sigma-tutoring-separating-science-fiction-from-science-fact/ ·
Murre & Dros 2015 https://doi.org/10.1371/journal.pone.0120644 · Cepeda 2008 https://pubmed.ncbi.nlm.nih.gov/19076480/ ·
Cepeda 2006 https://doi.org/10.1037/0033-2909.132.3.354 · Latimier 2021 https://doi.org/10.1007/s10648-020-09572-8 ·
Rawson & Dunlosky 2022 https://doi.org/10.1177/09637214221100484 · Kerfoot 2012 https://pubmed.ncbi.nlm.nih.gov/22664558/ ·
Merrill 2002 https://doi.org/10.1007/BF02505024 · Blume 2010 https://doi.org/10.1177/0149206309352880

**Comportamiento y motivación.** Stajkovic & Luthans 1997, *Academy of Management Journal* 40(5) · Stajkovic & Luthans 1998 https://doi.org/10.1037/0033-2909.124.2.240 ·
Stajkovic & Luthans 2003 https://goal-lab.psych.umn.edu/orgpsych/readings/5.%20Motivation/Stajkovic%20&%20Luthans%20(2003).pdf ·
Schultz 1997 https://doi.org/10.1126/science.275.5306.1593 · Spicer 2022 https://www.open-access.bcu.ac.uk/14466/ ·
Bandura 1977 https://doi.org/10.1037/0033-295X.84.2.191 · Taylor, Russ-Eft & Chan 2005 https://doi.org/10.1037/0021-9010.90.4.692 ·
Howard 2021 https://doi.org/10.1177/1745691620966789 · Patall 2008 https://doi.org/10.1037/0033-2909.134.2.270 ·
Deci, Koestner & Ryan 1999 https://doi.org/10.1037/0033-2909.125.6.627 · Cerasoli 2014 https://doi.org/10.1037/a0035661 ·
Fogg 2009 https://doi.org/10.1145/1541948.1541999 · Anselmi 2025 https://doi.org/10.1186/s12889-025-24525-y ·
Michie 2011 https://doi.org/10.1186/1748-5908-6-42 · Lally 2010 https://doi.org/10.1002/ejsp.674 ·
Singh 2024 https://doi.org/10.3390/healthcare12232488 · Gollwitzer & Sheeran 2006 https://doi.org/10.1016/S0065-2601(06)38002-1 ·
Sheeran 2024 https://doi.org/10.1080/10463283.2024.2334563 · Mertens (nudges) 2022 https://doi.org/10.1073/pnas.2107346118 ·
Maier 2022 https://doi.org/10.1073/pnas.2200300119 · DellaVigna & Linos 2022 https://doi.org/10.3982/ECTA18709 ·
Sailer & Homner 2020 https://doi.org/10.1007/s10648-019-09498-w · Bai 2020 https://doi.org/10.1016/j.edurev.2020.100322 ·
Huang 2020 https://doi.org/10.1007/s11423-020-09807-z · Mazeas 2022 https://doi.org/10.2196/26779 ·
Sailer 2017 https://doi.org/10.1016/j.chb.2016.12.033 · Mekler 2017 https://doi.org/10.1016/j.chb.2015.08.048 ·
Hanus & Fox 2015 https://doi.org/10.1016/j.compedu.2014.08.019 · Silverman & Barasch 2023 https://doi.org/10.1093/jcr/ucac029 ·
Aulagnon et al. 2026 (working paper) https://www.ipr.northwestern.edu/documents/working-papers/2026/wp-26-05.pdf ·
Kuo 2026 https://doi.org/10.1145/3773077.3806127 · Duolingo 2020 https://blog.duolingo.com/improving-the-streak ·
Kluger & DeNisi 1996 https://doi.org/10.1037/0033-2909.119.2.254 · Hattie & Timperley 2007 https://doi.org/10.3102/003465430298487 ·
Harkin 2016 https://doi.org/10.1037/bul0000025 · Gruber 2014 https://doi.org/10.1016/j.neuron.2014.08.060 ·
Keller 2024 https://doi.org/10.1038/s41539-024-00234-w · Hunt 1995 https://doi.org/10.3758/BF03214414 ·
Mar 2021 https://doi.org/10.3758/s13423-020-01853-1 · Shields 2017 https://doi.org/10.1037/bul0000100 ·
Sisk 2018 https://doi.org/10.1177/0956797617739704 · Macnamara & Burgoyne 2023 https://doi.org/10.1037/bul0000352 ·
Yeager 2019 https://doi.org/10.1038/s41586-019-1466-y · Edmondson 1999 https://doi.org/10.2307/2666999 ·
Frazier 2017 https://doi.org/10.1111/peps.12183 · Keith & Frese 2008 https://doi.org/10.1037/0021-9010.93.1.59 ·
Lucas 2014 https://doi.org/10.1016/j.chb.2014.04.043

**Multimedia, avatar y color.** Mayer 2017 https://doi.org/10.1111/jcal.12197 · Paivio 1991 https://doi.org/10.1037/h0084295 ·
Houts 2006 https://doi.org/10.1016/j.pec.2005.05.004 · Rey 2012 https://eric.ed.gov/?id=EJ986386 ·
Sundararajan & Adesope 2020 https://eric.ed.gov/?id=EJ1263249 · Wesenberg 2026 https://eric.ed.gov/?id=EJ1508784 ·
Carney & Levin 2002 https://doi.org/10.1023/A:1013176309260 · Alpizar 2020 https://doi.org/10.1007/s11423-020-09748-7 ·
Richter 2016 https://doi.org/10.1016/j.edurev.2015.12.003 · Richter 2018 https://eric.ed.gov/?id=EJ1178409 ·
Adesope & Nesbit 2012 https://doi.org/10.1037/a0026147 · Schroeder & Cenkci 2018 https://eric.ed.gov/?id=EJ1186641 ·
Rey 2019 https://doi.org/10.1007/s10648-018-9456-4 · Ginns 2005 https://eric.ed.gov/?id=EJ723937 ·
Ginns 2013 https://eric.ed.gov/?id=EJ1036785 · Craig & Schroeder 2019 https://doi.org/10.1177/0735633118802877 ·
Fiorella & Mayer 2016 https://eric.ed.gov/?id=EJ1120458 · Szpunar 2013 https://doi.org/10.1073/pnas.1221764110 ·
Brom 2018 https://doi.org/10.1016/j.edurev.2018.09.004 · Wong & Adesope 2021 https://eric.ed.gov/?id=EJ1295978 ·
Höffler & Leutner 2007 https://eric.ed.gov/?id=EJ780451 · Berney & Bétrancourt 2016 https://doi.org/10.1016/j.compedu.2016.06.005 ·
Ploetzner 2021 https://eric.ed.gov/?id=EJ1303009 · Noetel 2021 https://eric.ed.gov/?id=EJ1290063 ·
Guo 2014 https://doi.org/10.1145/2556325.2566239 · Gernsbacher 2015 https://doi.org/10.1177/2372732215602130 ·
Wiedenbeck 1999 https://doi.org/10.1080/014492999119129 · Schroeder 2013 https://doi.org/10.2190/EC.49.1.a ·
Castro-Alonso 2021 https://doi.org/10.1007/s10648-020-09587-1 · Davis 2018 https://doi.org/10.1016/j.edurev.2018.05.002 ·
Beege 2023 https://doi.org/10.1016/j.edurev.2023.100564 · Diel 2021 https://doi.org/10.1145/3470742 ·
Netland 2024 https://doi.org/10.1016/j.compedu.2024.105164 · Arkün-Kocadere 2024 https://eric.ed.gov/?id=EJ1441518 ·
Pi 2022 https://eric.ed.gov/?id=EJ1356802 · Elliot 2007 https://doi.org/10.1037/0096-3445.136.1.154 ·
Elliot & Maier 2014 https://doi.org/10.1146/annurev-psych-010213-115035 · Elliot 2019 https://doi.org/10.1037/gpr0000170 ·
Gnambs 2020 https://doi.org/10.3758/s13423-020-01772-1 · Jonauskaite 2020 https://doi.org/10.1177/0956797620948810 ·
Ozcelik 2009 https://eric.ed.gov/?id=EJ842989 · Birch 2012 https://doi.org/10.1364/JOSAA.29.000313 ·
Piepenbrock 2013 https://doi.org/10.1080/00140139.2013.790485 · Buchner 2009 https://doi.org/10.1080/00140130802641635 ·
Dobres 2017 https://doi.org/10.1016/j.apergo.2016.11.001 · WCAG 2.2 https://www.w3.org/TR/WCAG22/ ·
Guía STPS NOM-026 https://www.gob.mx/cms/uploads/attachment/file/807422/GUIA_INFORMATIVA_NOM-026.pdf

**IA en el aprendizaje y el trabajo.** Kestin 2025 https://doi.org/10.1038/s41598-025-97652-6 ·
Bastani 2025 https://doi.org/10.1073/pnas.2422633122 · Liu 2026 https://doi.org/10.26300/y3f8-vh05 ·
Brynjolfsson, Li & Raymond 2025 https://doi.org/10.1093/qje/qjae044 (versión 2023: https://www.nber.org/papers/w31161) ·
Dell'Acqua 2023 https://papers.ssrn.com/abstract=4573321 · Otis 2025 https://doi.org/10.1287/mnsc.2024.06909 ·
Tutor CoPilot (Wang 2024) https://arxiv.org/abs/2410.03017 · Lehmann https://arxiv.org/abs/2409.09047 ·
Contractor & Reyes 2026 https://arxiv.org/abs/2607.08849 · Fan 2025 https://doi.org/10.1111/bjet.13544 ·
Shaikh 2024 https://arxiv.org/abs/2309.12309 · Paciente virtual con IA https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12634008/ ·
Realidad aumentada en manufactura (MSOM 2022) https://doi.org/10.1287/msom.2021.1070

**Adultos e inducción.** Rachal 2002 https://aquila.usm.edu/fac_pubs/3602 · Morris 2020 https://researchspace.bathspa.ac.uk/13077 ·
Pashler 2008 https://doi.org/10.1111/j.1539-6053.2009.01038.x · Clardy 2018 https://doi.org/10.1177/1534484318759399 ·
Bauer 2010 (SHRM) https://studentaffairs.uga.edu/wp-content/uploads/2021/08/Onboarding-New-Employees.pdf ·
Bauer 2007 https://doi.org/10.1037/0021-9010.92.3.707 · Bauer 2025 https://doi.org/10.1177/01492063241277168 ·
Earnest 2011 https://doi.org/10.1111/j.1744-6570.2011.01230.x · Eby 2008 https://doi.org/10.1016/j.jvb.2007.04.005 ·
Buddy de Microsoft (SHRM) https://www.shrm.org/topics-tools/news/organizational-employee-development/work-buddies-can-help-new-employees-transition-job-organizational-culture ·
Gallup 2019 https://www.gallup.com/workplace/247172/problems-onboarding-program.aspx ·
Macnamara 2014, *Psychological Science* 25(8) · Sitzmann 2011 y 2006, *Personnel Psychology* · Gottfredson & Mosher 2011, ISBN 9780071703116 ·
Haynes 2009 https://doi.org/10.1056/NEJMsa0810119 · Urbach 2014, *NEJM* 370(11) · Sung 2016 https://doi.org/10.1016/j.compedu.2015.11.008 ·
Adhvaryu 2023 https://doi.org/10.1086/724320 · Alliger 1997 https://doi.org/10.1111/j.1744-6570.1997.tb00911.x ·
Wouters 2013 https://doi.org/10.1037/a0031311 · Garzón 2019 https://doi.org/10.1016/j.edurev.2019.04.001 ·
Cómic (PCI RR 575) https://rr.peercommunityin.org/articles/rec?id=575 · Podcast https://pmc.ncbi.nlm.nih.gov/articles/PMC12067963/ ·
Newton & Salvi 2020 https://doi.org/10.3389/feduc.2020.602451 · Letrud & Hernes 2018 https://doi.org/10.1080/2331186X.2018.1518638 ·
Dekker 2012 https://doi.org/10.3389/fpsyg.2012.00429 · Beyerstein https://www.scientificamerican.com/article/uncovering-brainscams/

**México y Juárez.** ENDUTIH 2025 https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/endutih/ENDUTIH_25.pdf ·
Data México (cajeros) https://www.economia.gob.mx/datamexico/es/profile/occupation/cajeros-taquilleros-y-receptores-de-apuestas ·
Censo 2020 Chihuahua https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2021/EstSociodemo/ResultCenso2020_Chih.pdf ·
OCDE (PIAAC, América Latina) https://oecd.org/en/publications/skills-in-latin-america_5ab893f0-en/full-report/component-5.html ·
UACJ, supermercados en Juárez https://cathi.uacj.mx/handle/20.500.11961/19582 · BLS JOLTS https://www.bls.gov/news.release/archives/jolts_03132026.htm ·
CAP 2012 https://www.americanprogress.org/article/there-are-significant-business-costs-to-replacing-employees/ ·
LFT art. 153-A https://sidof.segob.gob.mx/notas/docFuente/5632307

**No verificado o de segunda mano** (no usar como dato duro): el g exacto de Adesope 2017; las cifras de Tetzlaff
2025, St. Hilaire 2024 y Kerfoot 2012; el 68 % vs. 26 % de Rawson & Dunlosky; Carney & Levin 2002; Hunt 1995; los
estudios de 2026 en *Educ. Inf. Technol.* sobre voz sintética; el 50.6 % de PIAAC; ISO 24495-1; las cifras de Cable,
Gino & Staats 2013; los DOI de Butler & Roediger 2008, Kalyuga 2003 y Kornell & Bjork 2008.
