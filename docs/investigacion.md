# Investigación (2026-10-08) — avatar de inducción para cajeros Del Río

Reporte de investigación web. Lo marcado "(no verificado)" no se confirmó en fuente primaria. Las decisiones que
salgan de aquí van en `docs/adr/`.

> **Ciencia del aprendizaje, comportamiento, multimedia y color** (9-oct): `docs/investigacion-aprendizaje.md`, con
> recomendaciones priorizadas para la demo y el piloto.

## Del Río (para el pitch)
- **Grupo de la Vega** (Almacenes Distribuidores de la Frontera): Del Río (227), Del Río Express (27), Superette
  (35), Oasis (13), Almacén (2); ~300 sucursales en el estado de Chihuahua. Lema "¡Tu Súper en Menos Pasos!".
  https://superette.com.mx/nosotros/
- **+5,000 empleos**; valores públicos: rapidez, servicio, limpieza, "personal agradable". https://delriosa.com/
- 2014: 199 tiendas y ~2,360 empleados → casi duplicaron plantilla. https://www.cronicadechihuahua.com/Invade-corporativo-juarense-la.html
- 2023: contrataron +300 migrantes (Cuba, Haití, Guatemala, El Salvador, Honduras).
  https://forbes.com.mx/esta-cadena-de-tiendas-de-conveniencia-da-empleo-a-migrantes-en-ciudad-juarez/
- Desde el 10-sep-2026 cobran **trámites municipales con referencia** en Del Río, Superette y Oasis: un
  procedimiento nuevo que todo cajero debe aprender. https://juarezhoy.com.mx/habilitan-pago-de-tramites-municipales-en-tiendas-del-rio-superette-y-oasis/
  (Solo usarlo en el contenido si Del Río entrega el procedimiento autorizado; como ejemplo de "por qué" sí sirve.)
- Rotación en tiendas de conveniencia: hasta 140% anual (Apli 2022); OXXO >90% y 15,000 contrataciones al mes.
  https://www.publimetro.com.mx/noticias/2022/03/28/trabajo-rotacion-de-personal-lleva-a-la-calle-a-23-millones-de-mexicanos/ ·
  https://expansion.mx/carrera/2023/10/23/oxxo-segunda-caja-cerrada
- No usar en el pitch: una mención no verificada de un incidente de ransomware; sí refuerza "sin datos personales".

## Avatares de IA para capacitación
- HeyGen LiveAvatar (FULL 2 créditos/min; LITE 1 crédito/min con STT/LLM/TTS propios; Essential $99/mes 1,100
  créditos), D-ID Agents (~$0.45/min, no verificado), Synthesia (API desde Creator ~$89/mes), Azure TTS Avatar
  ($0.50/min). https://docs.liveavatar.com/docs/faq/credits
- Casos: Walmart VR (Strivr) +10–15% en exámenes; Lowe's Mylow Companion (+1,700 tiendas); Axonify (dato del
  proveedor) −82% tiempo de inducción en goeasy; Duolingo "Lily" en Rive con estados pensando/escuchando.
  https://www.shrm.org/mena/topics-tools/news/technology/walmart-revolutionizes-training-virtual-reality ·
  https://axonify.com/solutions/onboarding/ · https://rive.app/blog/duolingo-s-ai-powered-video-call-brings-lily-to-life
- Qué da WOW: personaje que reacciona (escucha/piensa), respuestas con fuente verificable, práctica con cliente
  simulado y retroalimentación inmediata.

## Lip-sync y voz
- `speechSynthesis` no expone el audio: no hay lip-sync real con él; los eventos `boundary` fallan con voces de red de Chrome.
- 2D recomendado: 6–8 bocas SVG movidas por **visemas de Azure** (es-MX soporta Viseme ID) o por los tiempos por
  carácter de ElevenLabs (`stream/with-timestamps`). https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme
- Rive: exportar requiere plan Cadet ($9/mes anual) desde 20-oct-2025. TalkingHead 3D: sin lip-sync en español,
  requiere GLB con blend shapes; riesgo alto.
- **TTS es-MX:** Azure Dalia/Jorge (+ HD Ximena/Tristan), $15/M caracteres, **F0 gratis 500k caracteres/mes**, con
  visemas; ElevenLabs Flash v2.5 ~75–200 ms, $0.04/1k caracteres; OpenAI tts sin tiempos; Google Chirp 3 HD $30/M.
  **Groq TTS no tiene español** (solo inglés y árabe). https://console.groq.com/docs/text-to-speech
- AI SDK 7: `generateSpeech` estable (sin streaming documentado; partir por oraciones). https://ai-sdk.dev/docs/ai-sdk-core/speech
- **STT:** Groq whisper-large-v3-turbo $0.04/h (mínimo 10 s por request; 20 req/min), en el SDK con `transcribe`.
  Web Speech `SpeechRecognition` limitado (Chrome manda audio a Google; Firefox no). https://console.groq.com/docs/speech-to-text

## RAG con citas y abstención
- **Citations nativas de Claude**: `cited_text` no cuenta como tokens de salida; las citas siempre apuntan a
  pasajes válidos; incompatibles con structured outputs. https://platform.claude.com/docs/en/build-with-claude/citations
- **En `@ai-sdk/anthropic` 4.0.78 sí funcionan** (revisado en el código, aunque la doc no lo diga): partes `file`
  text/plain o PDF con `providerOptions.anthropic.citations.enabled`, emiten `source`. Un documento por sección.
  Groq no las tiene: el esquema propio `[D1-3]` se mantiene para el respaldo.
- Abstención (guía de Anthropic): permitir "no sé", citar textualmente, retractar lo que no tenga cita.
  https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
- Evaluación: fidelidad (RAGAS, promptfoo `context-faithfulness`) **no mide abstención** → reportar "% de citas
  correctas" y "% de escalamientos correctos".

## Microlearning
- Repaso espaciado > repaso masivo (g = 0.74; intervalos uniformes bastan). https://link.springer.com/10.3758/s13428-018-1184-7
- Realizable: módulos de 3–5 min, escenario ramificado de 3 nodos, quiz de 5 con retroalimentación citada,
  insignias, "repaso mañana" (Leitner en localStorage).

## Cápsulas narradas
- Más barata: el LLM arma un guion de 4–6 diapositivas (JSON) y el avatar lo narra en el navegador con subtítulos.
- Remotion (licencia de empresa necesaria en producción), HeyGen API (~$1–4/min), NotebookLM Video Overviews
  (implica subir material a Google: pedir permiso).

## Ideas WOW priorizadas (1.5 días)
1. Estados vivos del avatar (escucha, piensa, habla, celebra, preocupado al escalar) — 2–3 h, riesgo bajo.
2. "No está en el material" + **ticket en vivo** a bandeja de supervisor/RH — 2–3 h, riesgo bajo.
3. Citas clicables con el pasaje exacto resaltado — 3–5 h, riesgo medio.
4. Role-play con cliente simulado evaluado con cita — 4–6 h, riesgo medio.
5. Quiz de 5 con retroalimentación citada + insignia "Cajero Nivel 1" + repaso programado — 3–4 h, riesgo bajo.
6. Lip-sync con visemas Azure es-MX sobre 6–8 bocas SVG (Web Speech de respaldo) — 4–6 h, riesgo medio.
7. Cápsula narrada autogenerada de una sección — 3–5 h, riesgo medio-bajo.
8. Tablero de validación + panel del supervisor (% citas y escalamientos correctos; dudas no cubiertas → pendientes RH) — 2–3 h, riesgo bajo.
- Bonus: respuestas en kreyòl/francés/inglés citando el manual en español (personal migrante) — 1–2 h, solo texto.
- No recomendado ahora: avatar fotorrealista (HeyGen LiveAvatar / Azure TTS Avatar): mucho WOW, 6–10 h, riesgo de red y créditos → "siguiente paso" del pitch.
- No recomendado ahora (10-oct): servidor MCP para consultar el manual desde Copilot Studio, Claude o ChatGPT. No sube ningún criterio de la ficha y pide dependencias nuevas, autenticación por empresa sin saltarse la RLS y permiso de Del Río para abrir el material: 2–3 h, riesgo medio → "siguiente paso" del pitch.
