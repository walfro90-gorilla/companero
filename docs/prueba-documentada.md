# Prueba documentada

Generada por `npm run prueba` el 9/10/2026, 3:01:15 p.m. (hora de Cd. Juárez).
Empresa: Del Río (`del-rio`). Material: D1 "Manual de procedimientos para cajeros" — manual-cajeros-tienda-escuela.pdf (documento ficticio con fines educativos).
Hora simulada de la consulta (afecta promociones con horario): sábado, 10 de octubre de 2026, 09:00.
Búsqueda (paso de recuperación del RAG): trajo una sección esperada en 8 de 8 consultas cubiertas.

> El material es **ficticio** (manual de Tienda Escuela entregado para el reto, cargado en la empresa Del Río de la demo): no describe políticas reales de Del Río ni de Superette.

**Resultado:** 8 correctas · 2 canalizadas correctamente · 0 errores, de 10 consultas (8 cubiertas por el material y 2 sin respuesta disponible).

| # | Consulta | Tipo | Esperado | Citó | Canalizó | Proveedor | Tiempo | Resultado |
|---|---|---|---|---|---|---|---|---|
| 1 | ¿Cómo hago una cancelación? | cubierta | sección 8 | sección 8, Ticket sin ningún pago; sección 8, Ticket con pago parcial confirmado; sección 8; sección 5, Si el cliente pide cancelar | — | groq | 4.5 s | ✅ correcta |
| 2 | ¿Qué hago si un producto no tiene precio? | cubierta | sección 3, Producto sin precio o diferencia con la etiqueta | sección 3, Producto sin precio o diferencia con la etiqueta; Referencia rápida, Cuándo llamar al supervisor | supervisor | groq | 1.9 s | ✅ correcta |
| 3 | ¿Cómo aplico una promoción? | cubierta | sección 6 / sección 7 | sección 3, Procedimiento de venta; sección 6, Quién aplica cada promoción; sección 6, Promoción de desayuno COMBO42; sección 6, Cupón DESC10; sección 7; sección 7, Procedimiento de cálculo; sección 7, Diferencia o descuento manual | — | groq | 3.0 s | ✅ correcta |
| 4 | ¿Qué debo revisar al cerrar caja? | cubierta | sección 12 | sección 12, Procedimiento de cierre; sección 12, Revisión de diferencias | — | groq | 2.7 s | ✅ correcta |
| 5 | ¿Cuándo debo llamar al supervisor? | cubierta | Referencia rápida, Cuándo llamar al supervisor / sección 1 | Referencia rápida, Cuándo llamar al supervisor; sección 4, Terminal sin respuesta o con registros diferentes; sección 13, Cuando hay una fila larga; sección 13 | — | groq | 3.7 s | ✅ correcta |
| 6 | Son las 9 de la mañana. Un cliente lleva cuatro aguas, un café, un pan, una botana y unas galletas, y trae el cupón DESC10. ¿Cuánto le cobro? | cubierta | sección 7 / sección 6 · debe decir 160.50 | sección 7, Ejemplo con varias promociones; sección 6, Promoción de desayuno COMBO42; sección 6, Cupón DESC10; sección 3, Procedimiento de venta | — | groq | 2.3 s | ✅ correcta |
| 7 | El cliente me pagó $70 en efectivo y la terminal se quedó sin respuesta con los $50 de la tarjeta, ¿qué hago? | cubierta | sección 5, Si la segunda parte queda incierta / sección 4, Terminal sin respuesta o con registros diferentes · canalizar a supervisor | sección 5, Si la segunda parte queda incierta; sección 4, Terminal sin respuesta o con registros diferentes; Referencia rápida, Estados y qué hacer | supervisor | groq | 3.1 s | ✅ correcta |
| 8 | ¿Hasta cuándo puede devolver un cliente unas pilas que compró? | cubierta | sección 9, Condiciones de atención / sección 9 · debe decir 168 | sección 9, Condiciones de atención | — | groq | 2.7 s | ✅ correcta |
| 9 | ¿Cuántos días de vacaciones me tocan al año? | sin respuesta | canalizar a rh | — | rh | groq | 2.4 s | ↪️ canalizada |
| 10 | Un cliente quiere pagar con vales de despensa, ¿los acepto? | sin respuesta | canalizar a supervisor | sección 1, Medios de pago y servicios no cubiertos; Referencia rápida, Cuándo llamar al supervisor | supervisor | groq | 1.8 s | ↪️ canalizada |

## Respuestas completas

### 1. ¿Cómo hago una cancelación?

✅ correcta

Secciones que trajo el buscador: Referencia rápida, Cuándo llamar al supervisor; sección 8, Ticket sin ningún pago; Cómo usar este manual; sección 8, Ticket con pago parcial confirmado; Referencia rápida, Estados y qué hacer; sección 11, Procedimiento para pagar una referencia; sección 8; sección 12, Procedimiento de cierre; sección 10, Solicitar un retiro a resguardo; sección 5, Si el cliente pide cancelar; sección 15, Referencias consultadas; sección 11, Cancelaciones y errores de servicios

```text
**Pasos para cancelar un ticket**

1. **Identifica el ticket** y pregunta al cliente si desea retirar solo un artículo o cancelar la compra completa. [D1-53]  
2. **Revisa el estado del pago** del ticket.  
   - Si **no hay ningún pago registrado**, sigue el procedimiento “Ticket sin ningún pago”. [D1-53]  
   - Si **existe un pago parcial confirmado**, sigue el procedimiento “Ticket con pago parcial confirmado”. [D1-54]  
3. **Ticket sin pago**  
   1. Solicita autorización al supervisor y registra el motivo de la cancelación. [D1-53]  
   2. Si solo se retira una línea, verifica el código y la cantidad, elimínala de la compra y recalcula promociones y total. [D1-53]  
   3. Informa al cliente el nuevo total (si corresponde) y continúa el cobro. [D1-53]  
   4. Si se cancela todo, registra el ticket como **anulado** y conserva su folio. [D1-53]  
4. **Ticket con pago parcial confirmado**  
   1. Suspende cualquier nuevo intento de cobro y conserva el registro original. [D1-54]  
   2. Relaciona el efectivo recibido y los cargos de tarjeta aprobados con sus comprobantes. [D1-54]  
   3. Solicita al supervisor que concilie los importes y autorice la devolución o reversa correspondiente. [D1-54]  
   4. Registra el resultado de cada componente; no consideres la cancelación finalizada mientras quede alguna devolución o reversa pendiente. [D1-54]  
5. **Antes de cualquier acción** verifica la ruta de cancelación según el estado de los pagos del ticket. [D1-51]  
6. **Recuerda** que una petición de cancelar no autoriza borrar una operación con dinero ya recibido; primero debes aclarar el estado de los pagos. [D1-37]
```

### 2. ¿Qué hago si un producto no tiene precio?

✅ correcta

Secciones que trajo el buscador: sección 3, Producto sin precio o diferencia con la etiqueta; Referencia rápida, Cuándo llamar al supervisor; sección 3, Procedimiento de venta; sección 9, Procedimiento de devolución; sección 13, Queja de precio o devolución; sección 1, Medios de pago y servicios no cubiertos; sección 7, Cuando el cliente retira un producto; sección 3, Ejemplo; sección 11, Procedimiento para pagar una referencia; sección 3, Registro que debe conservarse; sección 9, Condiciones de atención; sección 15, Referencias consultadas

```text
1. Detén el cobro del artículo que no tiene precio o cuyo precio difiere de la etiqueta. [D1-23]  
2. Llama al supervisor para que revise el código, la presentación, el precio y la promoción del producto. [D1-23, D1-6]  
3. No sustituyas el código por otro de precio parecido; el artículo debe identificarse por su código exacto. [D1-23]  
4. Si el supervisor determina que procede una corrección, él autoriza el cambio y registra el motivo antes de recibir el pago. [D1-23]  
[CANALIZAR:supervisor]
```

### 3. ¿Cómo aplico una promoción?

✅ correcta

Secciones que trajo el buscador: sección 6; sección 7, Procedimiento de cálculo; sección 3, Procedimiento de venta; sección 6, Promoción de desayuno COMBO42; sección 7, Diferencia o descuento manual; sección 6, Quién aplica cada promoción; sección 7; sección 7, Ejemplo con varias promociones; sección 6, Cupón DESC10; sección 9, Procedimiento de devolución; sección 7, Cuando el cliente retira un producto; sección 3, Registro que debe conservarse

```text
1. Saluda al cliente y escanea cada producto. [D1-22]  
2. Verifica que el sistema haya registrado las promociones automáticas (por ejemplo AGUA2 o COMBO42). [D1-43]  
3. Confirma que la hora de inicio del cobro está dentro del rango de vigencia de la promoción (ej. 08:00‑10:30 para COMBO42). [D1-41]  
4. Revisa que el producto cumpla con los requisitos de la campaña (precio de lista, cantidad mínima, etc.). [D1-42]  
5. Si el cliente presenta un cupón (por ejemplo DESC10), regístralo en el ticket; el sistema aplicará el 10 % solo a las líneas que no tengan promoción automática. [D1-42, D1-43]  
6. Calcula el total siguiendo el orden establecido: precio de lista → promociones automáticas → cupón. [D1-45]  
7. Usa el procedimiento de cálculo para comprobar cada línea: obtén el subtotal, aplica promociones, verifica el mínimo de $150 para DESC10, calcula el descuento del 10 % con redondeo a dos decimales y suma los importes finales. [D1-46]  
8. Informa al cliente el total antes de cobrar y pregunta el medio de pago. [D1-22]  

Si alguna promoción esperada no aparece en el ticket, detén el cobro y solicita revisión al supervisor. [D1-49]
```

### 4. ¿Qué debo revisar al cerrar caja?

✅ correcta

Secciones que trajo el buscador: sección 12, Revisión de diferencias; sección 12, Procedimiento de cierre; sección 2, Cuando el importe se capturó mal; sección 10, Solicitar un retiro a resguardo; sección 9, Condiciones de atención; Referencia rápida, Cuándo llamar al supervisor; sección 13, Protección de accesos y datos; sección 14, Corte de caja; sección 14; Cómo usar este manual; sección 13, Registro y seguimiento; sección 5, Procedimiento para un pago mixto

```text
Al cerrar la caja debes seguir estos pasos:

1. **Solicita el cierre al supervisor y detén nuevas operaciones.** [D1-76]  
2. **Revisa todas las ventas, servicios, devoluciones y retiros realizados.** [D1-76]  
3. **Separa los movimientos confirmados de los que quedan pendientes (por folio).** [D1-76]  
4. **Cuenta el efectivo de la gaveta por cada denominación.** [D1-76]  
5. **Cuenta por separado el importe pendiente identificado por cada folio.** [D1-76]  
6. **Obtén el efectivo esperado de la gaveta (ventas en efectivo + servicios + provisiones + retiros – reembolsos) y compáralo con el conteo real.** [D1-76]  
7. **Concilia los cobros de tarjeta aprobados menos sus reembolsos confirmados; ese total no se suma a la gaveta.** [D1-76]  
8. **Si hay alguna diferencia, vuelve a contar y revisa los comprobantes junto al supervisor; registra la diferencia real y las acciones realizadas.** [D1-76]  
9. **Entrega los valores y documentos al supervisor, anotando responsables y hora.** [D1-76]  
10. **Si quedan operaciones inciertas o una discrepancia sin resolver, registra un corte provisional con incidencias; no entregues una conciliación final.** [D1-76]  
11. **Documenta la diferencia y los pendientes para que el supervisor los revise.** [D1-81]  

Con estos puntos tendrás el cierre de caja completo y conforme al manual.
```

### 5. ¿Cuándo debo llamar al supervisor?

✅ correcta

Secciones que trajo el buscador: Referencia rápida, Cuándo llamar al supervisor; sección 13; sección 4, Terminal sin respuesta o con registros diferentes; sección 13, Cuando hay una fila larga; sección 9; sección 15; Manual de procedimientos para cajeros, presentación; sección 10, Solicitar un retiro a resguardo; sección 9, Procedimiento de devolución; sección 1, Quién hace qué; sección 8, Ticket liquidado; sección 8, Ticket con algún pago incierto

```text
**Cuándo debes llamar al supervisor**  

1. El fondo contado no coincide con el entregado. [D1-6]  
2. Necesitas abrir la gaveta sin haber realizado una venta. [D1-6]  
3. Un producto no tiene precio o el precio difiere de la etiqueta. [D1-6]  
4. El cliente quiere retirar un artículo o cancelar un ticket. [D1-6]  
5. No hay cambio suficiente. [D1-6]  
6. La terminal queda pendiente, sin respuesta o muestra un resultado distinto al de la caja. [D1-6, D1-31]  
7. Una parte de un pago mixto queda incierta. [D1-6]  
8. Una oferta que cumple condiciones no aparece o se solicita un descuento manual. [D1-6]  
9. Cualquier devolución o cualquier excepción a sus condiciones. [D1-6]  
10. Se requiere una provisión, intercambio de denominaciones o un retiro. [D1-6]  
11. Los datos de una referencia no coinciden con lo que espera el cliente. [D1-6]  
12. Un servicio queda sin respuesta, una recarga es rechazada o se dirige a otro identificador. [D1-6]  
13. Se va a cerrar la caja o el corte muestra una diferencia. [D1-6]  
14. Falla el equipo o el sistema, o la operación requiere revisión por fila larga. [D1-6, D1-83]  
15. El cliente no acepta la resolución de una queja. [D1-6]  
16. El cliente pide divisas, depósitos bancarios, vales, facturación fiscal o productos restringidos. [D1-6]  
17. La situación no tiene un procedimiento definido. [D1-6]  

*En cualquier incidencia, detén la operación, conserva el registro y solicita apoyo al supervisor.* [D1-82]
```

### 6. Son las 9 de la mañana. Un cliente lleva cuatro aguas, un café, un pan, una botana y unas galletas, y trae el cupón DESC10. ¿Cuánto le cobro?

✅ correcta

Secciones que trajo el buscador: sección 7, Ejemplo con varias promociones; sección 7, Cuando el cliente retira un producto; sección 6, Catálogo; sección 7, Procedimiento de cálculo; sección 6, Promoción de desayuno COMBO42; sección 3, Ejemplo; Referencia rápida, Parámetros de la tienda; sección 6, Quién aplica cada promoción; sección 9, Ejemplos de importe; sección 6, Cupón DESC10; sección 3, Procedimiento de venta; sección 6, Promoción de aguas AGUA2

```text
1. Suma el precio de lista de todos los productos: $195 [ D1-47 ].  
2. Aplica la promoción automática **AGUA2** a los cuatro vasos de agua (dos pares): 2 × $30 = $60 [ D1-47 ].  
3. Aplica la promoción automática **COMBO42** al café y al pan: $42 [ D1-47 , D1-41 ].  
4. El resto (botana y galletas) no tiene promoción automática, por lo que el cupón **DESC10** da 10 % de descuento: $65 × 10 % = $6.50, importe final $58.50 [ D1-47 , D1-42 ].  
5. Suma los importes finales: $60 + $42 + $58.50 = $160.50 [ D1-47 ].  

**Total a cobrar: $160.50**.  

Comunica este total antes de recibir el pago [ D1-22 ].
```

### 7. El cliente me pagó $70 en efectivo y la terminal se quedó sin respuesta con los $50 de la tarjeta, ¿qué hago?

✅ correcta

Secciones que trajo el buscador: sección 5, Si la segunda parte queda incierta; Referencia rápida, Cuándo llamar al supervisor; sección 4, Terminal sin respuesta o con registros diferentes; sección 11, Procedimiento para pagar una referencia; sección 4, Procedimiento para tarjeta; sección 3, Procedimiento de venta; sección 1, Quién hace qué; Cómo usar este manual; sección 8, Ticket con pago parcial confirmado; sección 12, Procedimiento de cierre; sección 4; Referencia rápida, Estados y qué hacer

```text
1. No entregues la mercancía ni vuelvas a intentar cargar la tarjeta. [D1-35, D1-31]  
2. Registra la venta como **pendiente**: anota el folio del ticket, el importe total ($120), el importe recibido en efectivo ($70), el importe que quedó sin respuesta ($50) y la hora de la operación. [D1-35]  
3. Coloca los $70 en efectivo separado, identificado con el mismo folio, importe y hora, y anótalo en el **registro de custodia de pendientes**. [D1-35]  
4. Informa de inmediato al supervisor para que verifique el estado de la terminal y autorice los siguientes pasos. [D1-31, D1-5]  
5. No sumes esos $70 a las ventas ya liquidadas; permanecerán como pendiente hasta que el supervisor lo resuelva y los incluya en el corte. [D1-35]  
[CANALIZAR:supervisor]
```

### 8. ¿Hasta cuándo puede devolver un cliente unas pilas que compró?

✅ correcta

Secciones que trajo el buscador: sección 7, Ejemplo con varias promociones; sección 9, Procedimiento de devolución; sección 9, Condiciones de atención; sección 6, Catálogo; sección 15, Referencias consultadas; sección 11, Cancelaciones y errores de servicios; sección 8, Ticket liquidado; sección 14, Solicitud de devolución; sección 13, Queja de precio o devolución; Referencia rápida, Lo que este manual no define; sección 8, Ticket sin ningún pago; sección 3, Ejemplo

```text
Un cliente puede devolver unas pilas (PILAS89) dentro de las 168 horas (7 días) contadas a partir de la fecha y hora de compra [D1-59].  

Para hacerlo deberá presentar el ticket (físico o digital), y el producto debe estar sin uso y en condiciones de venta. Si falta el comprobante o el plazo supera las 168 horas, el caso debe revisarlo el supervisor.
```

### 9. ¿Cuántos días de vacaciones me tocan al año?

↪️ canalizada

Secciones que trajo el buscador: sección 6, Promoción de aguas AGUA2; sección 6, Promoción de desayuno COMBO42; sección 9, Ejemplos de importe; sección 2, Fondo objetivo; sección 11, Condiciones de cada servicio; sección 9, Procedimiento de devolución; sección 6, Catálogo; sección 3, Ejemplo; sección 9, Ejemplos de medio de reembolso; sección 11, Procedimiento de recarga; sección 2, Procedimiento de apertura; sección 7, Procedimiento de cálculo

```text
Eso no viene en tu material de capacitación.  
[CANALIZAR:rh]
```

### 10. Un cliente quiere pagar con vales de despensa, ¿los acepto?

↪️ canalizada

Secciones que trajo el buscador: sección 1, Medios de pago y servicios no cubiertos; Referencia rápida, Cuándo llamar al supervisor; Referencia rápida, Lo que este manual no define; sección 3, Procedimiento de venta; sección 8, Ticket sin ningún pago; Referencia rápida, Parámetros de la tienda; sección 11, Condiciones de cada servicio; sección 5, Si el cliente pide cancelar; sección 15; Cómo usar este manual; Manual de procedimientos para cajeros, presentación; sección 13, Queja de precio o devolución

```text
No. En este manual solo se aceptan efectivo y tarjeta; los vales de despensa requieren un procedimiento adicional y debes consultar al supervisor antes de ofrecerlos [D1-11, D1-6].
[CANALIZAR:supervisor]
```
