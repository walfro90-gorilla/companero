# Prueba documentada

Generada por `npm run prueba` el 9/10/2026, 2:01:43 a.m. (hora de Cd. Juárez).
Empresa: Del Río (demo) (`del-rio`). Material publicado: D1 "Manual de operación de caja (EJEMPLO)"; D2 "Guía de bienvenida al puesto de cajero (EJEMPLO)".
Búsqueda (paso de recuperación del RAG): encontró una sección esperada en 8 de 8 consultas cubiertas.

> **Atención:** se corrió contra contenido de EJEMPLO, no contra el material autorizado de Del Río.

**Resultado:** 8 correctas · 2 canalizadas correctamente · 0 errores, de 10 consultas (8 cubiertas por el material y 2 sin respuesta disponible).

| # | Consulta | Tipo | Esperado | Consultó | Citó | Canalizó | Proveedor | Tiempo | Resultado |
|---|---|---|---|---|---|---|---|---|---|
| 1 | ¿Cómo hago una cancelación? | cubierta | D1-5 | D1-5, D1-6, D1-7, D1-1, D1-2, D1-4, D2-1, D2-3 | D1-5 | — | groq | 1.2 s | ✅ correcta |
| 2 | ¿Qué hago si un producto no tiene precio? | cubierta | D1-3 | D1-3, D2-1, D2-3, D1-7, D1-4, D1-1, D1-6, D1-2 | D2-3, D1-3, D1-7 | — | groq | 3.2 s | ✅ correcta |
| 3 | ¿Cómo aplico una promoción? | cubierta | D1-4 | D1-4, D2-1, D1-7 | D1-4 | — | groq | 1.0 s | ✅ correcta |
| 4 | ¿Qué debo revisar al cerrar caja? | cubierta | D1-6 | D2-1, D1-4, D1-6, D1-1, D1-5, D1-7, D2-2, D2-3 | D1-6 | — | groq | 1.2 s | ✅ correcta |
| 5 | ¿Cuándo debo llamar al supervisor? | cubierta | D1-7 | D1-7, D2-3, D1-6, D2-2, D2-1, D1-3, D1-1, D2-4 | D1-7 | — | groq | 0.9 s | ✅ correcta |
| 6 | Al hacer mi corte me faltan 50 pesos, ¿qué hago? | cubierta | D1-6, D1-7 + canalizar a supervisor | D1-6, D1-4, D2-1, D1-5, D1-7, D2-3, D1-1, D1-2 | D1-6, D1-7 | supervisor | groq | 0.9 s | ✅ correcta |
| 7 | ¿Cómo cobro si el cliente paga con tarjeta? | cubierta | D1-2 | D1-2, D1-3, D1-4, D2-3, D1-7, D2-2, D2-4, D2-1 | D1-2 | — | groq | 1.3 s | ✅ correcta |
| 8 | ¿Le puedo pasar mi contraseña de la terminal a una compañera para que me cubra? | cubierta | D2-4, D1-1 | D2-4, D1-5, D1-6, D1-7, D1-1, D1-3, D1-2, D2-2 | D2-4 | — | groq | 0.5 s | ✅ correcta |
| 9 | ¿Cómo acepto un pago con vales de despensa? | sin respuesta | canalizar a supervisor | D1-2, D2-1 | — | supervisor | groq | 0.8 s | ↪️ canalizada |
| 10 | ¿Cuántos días de vacaciones me tocan al año? | sin respuesta | canalizar a rh | — | — | rh | groq | 0.5 s | ↪️ canalizada |

## Respuestas completas

### 1. ¿Cómo hago una cancelación?

✅ correcta

```text
1. **Si la venta aún no está cerrada**  
   - Busca el artículo que deseas cancelar en la pantalla.  
   - Selecciónalo y usa la opción “Cancelar artículo”.  
   - Informa al cliente qué artículo se canceló. [D1-5]

2. **Si la venta ya está cerrada (ya se imprimió el ticket)**  
   - No puedes cancelar tú mismo.  
   - Llama a tu supervisor; él autoriza la cancelación.  
   - Necesitarás presentar el ticket original.  
   - No entregues efectivo de la caja sin la autorización del supervisor. [D1-5]
```

### 2. ¿Qué hago si un producto no tiene precio?

✅ correcta

```text
1. Saluda al cliente y explícale que el artículo no muestra precio en el sistema. [D2-3]  
2. No inventes ni estimes el precio. [D1-3]  
3. Pregunta si desea esperar mientras verificas el precio. [D1-3]  
4. Si acepta, pulsa el timbre o usa el radio de la caja para solicitar la verificación al personal de piso. [D1-3]  
5. Si el cliente no quiere esperar, aparta el artículo y continúa con el resto de la compra. [D1-3]  
6. Si después de la verificación el producto sigue sin precio, llama a tu supervisor. [D1-3, D1-7]
```

### 3. ¿Cómo aplico una promoción?

✅ correcta

```text
1. Escanea los artículos que participan en la promoción; el descuento se aplicará de forma automática. [D1-4]  
2. Antes de cerrar la venta, revisa que en la pantalla aparezca la línea del descuento. [D1-4]  
3. Si el cliente indica que la promoción no se aplicó, verifica el folleto o la cartelera de promociones vigentes en la tienda. [D1-4]  
4. Si la promoción está vigente y sigue sin aplicarse, llama a tu supervisor; los ajustes de precio manual requieren su autorización. [D1-4]  
5. No realices descuentos manuales por tu cuenta. [D1-4]
```

### 4. ¿Qué debo revisar al cerrar caja?

✅ correcta

```text
Al cerrar tu caja debes hacer lo siguiente:

1. Avisar a tu supervisor y dejar de atender clientes cuando él te lo indique. [D1-6]  
2. Cerrar la sesión de venta en la terminal. [D1-6]  
3. Contar todo el efectivo por denominación (billetes y monedas). [D1-6]  
4. Llenar el formato de corte con los totales contados. [D1-6]  
5. Entregar al supervisor el efectivo, los vouchers de tarjeta y el formato de corte, y contar todo junto con él. [D1-6]  
6. Si la cuenta difiere del total que muestra el sistema, **no** la cubras ni la ajustes; repórtala al supervisor inmediatamente. [D1-6]  
7. Dejar la caja limpia y ordenada para el siguiente turno. [D1-6]
```

### 5. ¿Cuándo debo llamar al supervisor?

✅ correcta

```text
Debes llamar a tu supervisor, sin intentar resolverlo por tu cuenta, en los siguientes casos:

1. El fondo de caja o el corte no coinciden con el sistema. [D1-7]  
2. Necesitas cancelar una venta ya cerrada. [D1-7]  
3. Un producto sigue sin precio después de la verificación. [D1-7]  
4. Una promoción vigente no se aplicó y se requiere un ajuste de precio. [D1-7]  
5. Un cliente se molesta, discute o la situación se sale de control. [D1-7]  
6. Sospechas de un billete falso o de un intento de robo. [D1-7]  
7. La terminal o la impresora fallan y no puedes cobrar. [D1-7]
```

### 6. Al hacer mi corte me faltan 50 pesos, ¿qué hago?

✅ correcta

```text
1. Detén la atención de clientes y avisa a tu supervisor de inmediato.  
2. No intentes cubrir ni ajustar la diferencia tú mismo.  
3. Informa a tu supervisor que al contar el efectivo falta $50.  
4. Entrega el efectivo que tienes, los vouchers y el formato de corte para revisarlo juntos.  

(Procedimiento de reporte de diferencias y llamado al supervisor) [D1-6, D1-7]  

[CANALIZAR:supervisor]
```

### 7. ¿Cómo cobro si el cliente paga con tarjeta?

✅ correcta

```text
1. Saluda al cliente y pregunta si trae artículos en el carrito o debajo de la banda. [D1-2]  
2. Escanea cada artículo y verifica que la descripción en la pantalla coincida con el producto. [D1-2]  
3. Antes de cobrar, menciona el total en voz alta. [D1-2]  
4. Indica al cliente que inserte o acerque su tarjeta en la terminal; **tú no tomas la tarjeta ni ves el NIP**. [D1-2]  
5. Espera a que la terminal autorice el pago y muestre la confirmación. [D1-2]  
6. Entrega el ticket al cliente y despídete amablemente. [D1-2]
```

### 8. ¿Le puedo pasar mi contraseña de la terminal a una compañera para que me cubra?

✅ correcta

```text
No, la contraseña de la terminal es personal y no debes compartirla con nadie, ni siquiera con compañeras. Mantén tu usuario y contraseña confidenciales para proteger la información y el dinero de la tienda. [D2-4]
```

### 9. ¿Cómo acepto un pago con vales de despensa?

↪️ canalizada

```text
Eso no viene en tu material de capacitación.  
[CANALIZAR:supervisor]
```

### 10. ¿Cuántos días de vacaciones me tocan al año?

↪️ canalizada

```text
Eso no viene en tu material de capacitación  
[CANALIZAR:rh]
```
