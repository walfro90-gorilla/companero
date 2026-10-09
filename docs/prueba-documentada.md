# Prueba documentada

Generada por `npm run prueba` el 9/10/2026, 12:35:39 p.m. (hora de Cd. Juárez).
Empresa: Tienda Escuela (`tienda-escuela`). Material: D1 "Manual de procedimientos para cajeros" — manual-cajeros-tienda-escuela.pdf (documento ficticio con fines educativos).
Hora simulada de la consulta (afecta promociones con horario): sábado, 10 de octubre de 2026, 09:00.
Búsqueda (paso de recuperación del RAG): trajo una sección esperada en 8 de 8 consultas cubiertas.

> El material es **ficticio** (manual de Tienda Escuela entregado para el reto): no describe políticas reales de Del Río ni de Superette.

**Resultado:** 8 correctas · 2 canalizadas correctamente · 0 errores, de 10 consultas (8 cubiertas por el material y 2 sin respuesta disponible).

| # | Consulta | Tipo | Esperado | Citó | Canalizó | Proveedor | Tiempo | Resultado |
|---|---|---|---|---|---|---|---|---|
| 1 | ¿Cómo hago una cancelación? | cubierta | sección 8 | sección 8, Ticket sin ningún pago; sección 8; sección 8, Ticket con pago parcial confirmado; sección 5, Si el cliente pide cancelar; sección 5, Resolución por el supervisor; sección 4, Terminal sin respuesta o con registros diferentes | — | groq | 5.4 s | ✅ correcta |
| 2 | ¿Qué hago si un producto no tiene precio? | cubierta | sección 3, Producto sin precio o diferencia con la etiqueta | sección 3, Producto sin precio o diferencia con la etiqueta; Referencia rápida, Cuándo llamar al supervisor | — | groq | 2.6 s | ✅ correcta |
| 3 | ¿Cómo aplico una promoción? | cubierta | sección 6 / sección 7 | sección 3, Procedimiento de venta; sección 6, Quién aplica cada promoción; sección 6, Promoción de desayuno COMBO42; sección 7, Procedimiento de cálculo; sección 7 | — | groq | 2.9 s | ✅ correcta |
| 4 | ¿Qué debo revisar al cerrar caja? | cubierta | sección 12 | sección 12, Procedimiento de cierre; sección 14, Corte de caja | — | groq | 5.4 s | ✅ correcta |
| 5 | ¿Cuándo debo llamar al supervisor? | cubierta | Referencia rápida, Cuándo llamar al supervisor / sección 1 | Referencia rápida, Cuándo llamar al supervisor; sección 13, Cuando hay una fila larga; sección 13 | — | groq | 3.5 s | ✅ correcta |
| 6 | Son las 9 de la mañana. Un cliente lleva cuatro aguas, un café, un pan, una botana y unas galletas, y trae el cupón DESC10. ¿Cuánto le cobro? | cubierta | sección 7 / sección 6 · debe decir 160.50 | sección 7, Ejemplo con varias promociones | — | groq | 1.4 s | ✅ correcta |
| 7 | El cliente me pagó $70 en efectivo y la terminal se quedó sin respuesta con los $50 de la tarjeta, ¿qué hago? | cubierta | sección 5, Si la segunda parte queda incierta / sección 4, Terminal sin respuesta o con registros diferentes · canalizar a supervisor | sección 5, Si la segunda parte queda incierta; Referencia rápida, Estados y qué hacer; sección 4, Terminal sin respuesta o con registros diferentes | supervisor | groq | 3.7 s | ✅ correcta |
| 8 | ¿Hasta cuándo puede devolver un cliente unas pilas que compró? | cubierta | sección 9, Condiciones de atención / sección 9 · debe decir 168 | sección 9, Condiciones de atención; sección 6, Catálogo | — | groq | 2.2 s | ✅ correcta |
| 9 | ¿Cuántos días de vacaciones me tocan al año? | sin respuesta | canalizar a rh | — | rh | groq | 1.1 s | ↪️ canalizada |
| 10 | Un cliente quiere pagar con vales de despensa, ¿los acepto? | sin respuesta | canalizar a supervisor | sección 1, Medios de pago y servicios no cubiertos; Referencia rápida, Cuándo llamar al supervisor | supervisor | groq | 2.0 s | ↪️ canalizada |

## Respuestas completas

### 1. ¿Cómo hago una cancelación?

✅ correcta

Secciones que trajo el buscador: Referencia rápida, Cuándo llamar al supervisor; sección 11, Cancelaciones y errores de servicios; sección 4, Terminal sin respuesta o con registros diferentes; sección 8; sección 15, Referencias consultadas; sección 9, Condiciones de atención; sección 8, Ticket con pago parcial confirmado; Manual de procedimientos para cajeros, presentación; sección 8, Ticket sin ningún pago; sección 15; sección 5, Si el cliente pide cancelar; sección 5, Resolución por el supervisor

```text
**Procedimiento para cancelar una venta**

1. **Identifica el ticket y pregunta al cliente** si desea retirar solo un artículo o cancelar la compra completa.  
   [D1-53]

2. **Revisa el estado de los pagos del ticket**:  
   - No hay ningún pago registrado.  
   - Hay un pago parcial confirmado.  
   - El ticket está totalmente pagado.  
   La ruta de la cancelación dependerá de este estado.  
   [D1-51]

3. **Si no hay pago**:  
   - Solicita autorización al supervisor y registra el motivo de la cancelación.  
   - Si solo se retira una línea, verifica código y cantidad, elimínala, recalcula promociones y total.  
   - Si se cancela todo, registra el ticket como anulado y conserva su folio.  
   [D1-53]

4. **Si hay un pago parcial confirmado**:  
   - Suspende cualquier nuevo intento de cobro y conserva el registro original.  
   - Relaciona el efectivo recibido y los cargos de tarjeta aprobados con sus comprobantes.  
   - Pide al supervisor que concilie los importes y autorice la devolución o reversa correspondiente.  
   - Registra el resultado de cada componente y no declares concluida la cancelación mientras quede algún movimiento pendiente.  
   [D1-54]

5. **Si el ticket está totalmente pagado**:  
   - Recuerda que la petición de cancelar no autoriza borrar una operación con dinero recibido; primero debes aclarar el estado de los pagos.  
   - El supervisor verifica todos los pagos, conserva los comprobantes y, si corresponde cancelar, autoriza la devolución o reversa de cada componente.  
   [D1-37, D1-36]

6. **En cualquier caso**:  
   - No entregues la mercancía ni repitas el cargo sin autorización.  
   - Conserva el folio, importe y hora del ticket y solicita al supervisor que verifique el estado antes de concluir.  
   [D1-31]

7. **Una vez que el supervisor haya autorizado** la devolución o reversa, realiza la operación por el medio correspondiente (efectivo, tarjeta, etc.) y registra el resultado final.  
   [D1-36]
```

### 2. ¿Qué hago si un producto no tiene precio?

✅ correcta

Secciones que trajo el buscador: sección 3, Producto sin precio o diferencia con la etiqueta; sección 7, Cuando el cliente retira un producto; sección 9, Procedimiento de devolución; Referencia rápida, Cuándo llamar al supervisor; sección 8, Ticket sin ningún pago; sección 3; sección 6, Catálogo; sección 13, Queja de precio o devolución; sección 13, Registro y seguimiento; sección 3, Procedimiento de venta; sección 1, Quién hace qué; sección 9, Condiciones de atención

```text
1. Detén el cobro del artículo inmediatamente. [D1-23]  
2. Pide al supervisor que revise el código, la presentación, el precio y la posible promoción del producto. [D1-23]  
3. No sustituyas el código por otro de precio parecido; el producto se identifica solo por su código. [D1-23]  
4. Si el supervisor autoriza una corrección, él debe registrar el motivo y dar la autorización antes de que recibas el pago. [D1-23]  

Esta situación es una de las que indican que se debe llamar al supervisor. [D1-6]
```

### 3. ¿Cómo aplico una promoción?

✅ correcta

Secciones que trajo el buscador: sección 7, Diferencia o descuento manual; sección 3, Procedimiento de venta; sección 7, Ejemplo con varias promociones; sección 6, Quién aplica cada promoción; sección 7; sección 7, Procedimiento de cálculo; sección 6, Promoción de aguas AGUA2; sección 6; sección 6, Promoción de desayuno COMBO42; Referencia rápida, Cuándo llamar al supervisor; sección 6, Combinación de promociones; sección 15, Referencias consultadas

```text
1. **Escanea los productos** y verifica que la descripción, presentación, cantidad y precio sean correctos. [D1-22]  
2. **Revisa las promociones automáticas** que el sistema aplica al registrar los artículos (por ejemplo, AGUA2 y COMBO42). [D1-43]  
3. **Comprueba que se cumplan las condiciones** de cada promoción:  
   - Horario y vigencia (ej. COMBO42 solo de 08:00 a 10:30 del 8‑10 oct 2026). [D1-41]  
   - Cantidad mínima para el cupón (DESC10 requiere $150 de precio de lista). [D1-46]  
4. **Si el cliente tiene un cupón**, regístralo en el ticket (el cajero lo ingresa). [D1-43]  
5. **Verifica el total** siguiendo el orden de cálculo: precio de lista → promociones automáticas → cupón. [D1-45]  
6. **Aplica el descuento del cupón** solo a las líneas que no recibieron promoción automática y redondea a dos decimales según la regla de redondeo indicada. [D1-46]  
7. **Comunica al cliente el importe final** antes de recibir el pago. [D1-22]  
8. **Procede con el cobro** (efectivo, tarjeta o mixto) y entrega el comprobante. [D1-22]
```

### 4. ¿Qué debo revisar al cerrar caja?

✅ correcta

Secciones que trajo el buscador: sección 12, Procedimiento de cierre; sección 5, Procedimiento para un pago mixto; sección 14, Corte de caja; sección 2, Relevo entre personas; sección 13, Falla del equipo o del sistema; sección 12; sección 2, Procedimiento de apertura; sección 14; Cómo usar este manual; sección 15, Referencias consultadas; Referencia rápida, Cuándo llamar al supervisor; sección 9, Condiciones de atención

```text
1. Solicita el cierre al supervisor y detén nuevas operaciones. [D1-76]  
2. Revisa ventas, servicios, devoluciones y retiros; separa los movimientos confirmados de los pendientes. [D1-76]  
3. Cuenta la gaveta por denominación y registra por separado cada importe pendiente identificado por folio. [D1-76]  
4. Obtén el efectivo esperado de la gaveta y compáralo con el conteo real. [D1-76]  
5. Concili­a los cobros de tarjeta aprobados menos sus reembolsos confirmados (este total no se suma a la gaveta). [D1-76]  
6. Si hay diferencia, vuelve a contar y revisa los comprobantes con el supervisor; registra la diferencia real y las acciones de revisión. [D1-76]  
7. Entrega valores y documentos a los responsables indicando hora; si quedan operaciones inciertas o una discrepancia sin resolver, registra un corte provisional con incidencias, no una entrega final conciliada. [D1-76]  
8. Documenta en el registro de corte la sesión, hora, responsables, fondo validado, ventas en efectivo, servicios, provisiones, retiros, reembolsos, efectivo esperado, contado, diferencia y cualquier incidencia. [D1-94]
```

### 5. ¿Cuándo debo llamar al supervisor?

✅ correcta

Secciones que trajo el buscador: Referencia rápida, Cuándo llamar al supervisor; sección 13, Cuando hay una fila larga; sección 10, Solicitar un retiro a resguardo; sección 1, Situación sin procedimiento definido; Referencia rápida, Lo que este manual no define; sección 13, Situaciones de riesgo; sección 1, Si el supervisor no está disponible; sección 13, Protección de accesos y datos; sección 5, Resolución por el supervisor; sección 8, Ticket con algún pago incierto; sección 13; sección 2, Relevo entre personas

```text
Debes llamar al supervisor cuando ocurra alguna de las siguientes situaciones:

1. El fondo contado no coincide con el entregado. [D1-6]  
2. Necesitas abrir la gaveta sin haber realizado una venta. [D1-6]  
3. Un producto no tiene precio o el precio difiere de la etiqueta. [D1-6]  
4. El cliente quiere retirar un artículo o cancelar un ticket. [D1-6]  
5. No hay cambio suficiente para completar la operación. [D1-6]  
6. La terminal queda pendiente, sin respuesta o muestra un resultado distinto al de la caja. [D1-6]  
7. Una parte de un pago mixto queda incierta. [D1-6]  
8. Una oferta que cumple las condiciones no aparece, o se requiere aplicar un descuento manual. [D1-6]  
9. Cualquier devolución o cualquier excepción a sus condiciones. [D1-6]  
10. Se requiere una provisión, un intercambio de denominaciones o un retiro de efectivo. [D1-6]  
11. Los datos de una referencia no coinciden con lo que espera el cliente. [D1-6]  
12. Un servicio queda sin respuesta, una recarga es rechazada o el proceso llega a otro identificador. [D1-6]  
13. Se va a cerrar la caja o el corte muestra una diferencia. [D1-6]  
14. Falla el equipo o el sistema, o una operación requiere revisión porque hay fila larga. [D1-6] [D1-83]  
15. El cliente no acepta la resolución de una queja. [D1-6]  
16. El cliente pide divisas, depósitos bancarios, vales, facturación fiscal o productos restringidos. [D1-6]  

En cualquier incidencia que no tenga un procedimiento definido en el manual, detén la operación, conserva el registro y solicita apoyo al supervisor. [D1-82]
```

### 6. Son las 9 de la mañana. Un cliente lleva cuatro aguas, un café, un pan, una botana y unas galletas, y trae el cupón DESC10. ¿Cuánto le cobro?

✅ correcta

Secciones que trajo el buscador: sección 7, Ejemplo con varias promociones; sección 7, Cuando el cliente retira un producto; sección 7, Procedimiento de cálculo; sección 6, Catálogo; sección 6, Promoción de desayuno COMBO42; sección 6, Quién aplica cada promoción; Referencia rápida, Parámetros de la tienda; sección 9, Ejemplos de importe; sección 6, Promoción de aguas AGUA2; sección 6, Cupón DESC10; sección 3, Ejemplo; sección 3, Procedimiento de venta

```text
Le cobrarás **$160.50** pesos. [ D1-47 ]
```

### 7. El cliente me pagó $70 en efectivo y la terminal se quedó sin respuesta con los $50 de la tarjeta, ¿qué hago?

✅ correcta

Secciones que trajo el buscador: sección 5, Si la segunda parte queda incierta; Referencia rápida, Cuándo llamar al supervisor; sección 4, Terminal sin respuesta o con registros diferentes; sección 11, Procedimiento para pagar una referencia; sección 1, Quién hace qué; sección 11, Procedimiento de recarga; sección 4, Procedimiento para tarjeta; sección 12, Procedimiento de cierre; Cómo usar este manual; sección 9, Ejemplos de medio de reembolso; sección 14, Corte de caja; Referencia rápida, Estados y qué hacer

```text
1. No entregues la mercancía ni intentes volver a cobrar el importe de la tarjeta. [D1-35]  
2. Registra la venta como **pendiente** en el sistema, anotando el folio del ticket, el importe recibido en efectivo ($70), el importe de la tarjeta ($50) y la hora. [D1-35]  
3. Coloca el efectivo recibido separado, identificado con el mismo folio, importe y responsable. [D1-35]  
4. Informa al supervisor de la situación para que él verifique el estado de la terminal y autorice la continuación del proceso. [D1-5, D1-31]  
5. No crees un nuevo ticket ni vuelvas a intentar el cobro de los $120. [D1-35]  

Mantén el efectivo como pendiente y entrará en el registro de custodia al momento del corte. [D1-35]
[CANALIZAR:supervisor]
```

### 8. ¿Hasta cuándo puede devolver un cliente unas pilas que compró?

✅ correcta

Secciones que trajo el buscador: sección 9, Procedimiento de devolución; sección 7, Ejemplo con varias promociones; sección 6, Catálogo; sección 3, Cuando el cliente decide no llevar un artículo; sección 14, Solicitud de devolución; sección 11, Cancelaciones y errores de servicios; sección 9, Condiciones de atención; sección 9, Límite; sección 15, Referencias consultadas; sección 8, Ticket liquidado; Referencia rápida, Lo que este manual no define; sección 9, Ejemplos de importe

```text
El cliente puede devolver las pilas dentro de la ventana de 168 horas (7 días) después de la compra, siempre que presente el ticket verificable y el producto no haya sido usado ni le falten componentes. [D1-59, D1-39]
```

### 9. ¿Cuántos días de vacaciones me tocan al año?

↪️ canalizada

Secciones que trajo el buscador: sección 1, Quién hace qué; sección 6, Promoción de aguas AGUA2; sección 2, Fondo objetivo; sección 9, Ejemplos de importe; sección 9, Ejemplos de medio de reembolso; Referencia rápida, Lo que este manual no define; sección 6, Promoción de desayuno COMBO42; sección 7, Procedimiento de cálculo; sección 14; sección 7; sección 1; sección 12, Ejemplo de tarjeta

```text
Eso no viene en tu material de capacitación.  
[CANALIZAR:rh]
```

### 10. Un cliente quiere pagar con vales de despensa, ¿los acepto?

↪️ canalizada

Secciones que trajo el buscador: sección 1, Medios de pago y servicios no cubiertos; Referencia rápida, Cuándo llamar al supervisor; sección 7, Cuando el cliente retira un producto; sección 8, Ticket sin ningún pago; sección 5, Si el cliente pide cancelar; sección 9, Procedimiento de devolución; Referencia rápida, Lo que este manual no define; sección 14, Solicitud de devolución; sección 15, Referencias consultadas; sección 13, Queja de precio o devolución; sección 8, Ticket liquidado; Referencia rápida, Parámetros de la tienda

```text
No, según el manual solo se aceptan efectivo y tarjeta; los vales de despensa requieren procedimientos adicionales y debes consultar al supervisor antes de ofrecerlos [D1-11][D1-6].
[CANALIZAR:supervisor]
```
