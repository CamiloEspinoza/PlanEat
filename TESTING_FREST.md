# 🧪 Testing Frest Integration

Guía rápida para probar la integración de Frest API con PlanEat.

## 📋 Pre-requisitos

1. **Frest API corriendo** (local o producción)
2. **Variables de entorno configuradas** en `.env`:

```bash
# Para desarrollo local
FREST_API_URL=http://localhost:8001
FREST_API_KEY=tu_api_key_aqui

# Para producción
FREST_API_URL=https://api.frest.cl
FREST_API_KEY=tu_api_key_produccion
```

## 🚀 Método 1: Script de Prueba Automático

```bash
npm run test:frest
```

Este script verifica:
- ✅ Conexión con Frest API
- ✅ Búsqueda de usuario por teléfono
- ✅ Consulta de productos con precios y stock

### Output esperado:

```
🧪 Iniciando pruebas de Frest API...

📡 Test 1: Verificar conexión con Frest API
   URL: http://localhost:8001
   API Key configurada: ✅ Sí

🔍 Test 2: Buscar usuario de prueba
   Buscando teléfono: 56995545216
   ✅ Usuario encontrado:
      - ID: 123
      - Nombre: Juan Pérez
      - Email: juan@example.com
      - Direcciones: 1

🛒 Test 3: Consultar productos
   Buscando: Tomate, Lechuga, Palta
   ✅ Productos disponibles: 3
      - Tomate: $1490 (stock: 50 kg)
      - Lechuga Costina: $890 (stock: 30 un)
      - Palta Hass: $2990 (stock: 25 kg)

✅ ¡Todas las pruebas pasaron exitosamente!
```

## 📱 Método 2: Prueba con WhatsApp (E2E)

### Paso 1: Iniciar el bot

```bash
npm run dev
# o en producción
pm2 restart planeat
```

### Paso 2: Enviar mensaje de prueba

Envía por WhatsApp:

```
quiero comprar tomates y lechuga
```

### Paso 3: Flujo esperado

El bot debería:

1. **Buscar usuario en Frest**
   ```
   Bot: Hola Juan! Veo que tienes una dirección guardada en Providencia.
        ¿Quieres que el pedido llegue ahí?
   ```

2. **Confirmar dirección**
   ```
   Tu: Sí
   ```

3. **Consultar productos**
   ```
   Bot: Encontré tus productos en Frest! 🛒
        ✅ Tomate: $1.490/kg (stock: 50 kg)
        ✅ Lechuga Costina: $890/un (stock: 30 un)
        ¿Cuánto quieres de cada uno?
   ```

4. **Confirmar cantidades**
   ```
   Tu: 2 kilos de tomate y 1 lechuga
   ```

5. **Crear pedido**
   ```
   Bot: ¡Listo! Tu pedido #FRE-12345 está creado 🎉
        
        Resumen:
        - Subtotal: $3.870
        - Despacho: $1.000
        - Total: $4.870
        
        Para completar tu compra, paga aquí:
        https://webpay.transbank.cl/...
        
        ⏰ El link expira en 2 horas.
   ```

## 🔍 Verificar Logs

### En PlanEat:

```bash
pm2 logs planeat | grep Frest
```

Deberías ver:
```
🛒 [Frest] Consultando 2 productos
✅ [Frest] Encontrados: 2/2 productos
🛒 [Frest] Creando pedido para user_id: 123
✅ [Frest] Pedido creado: FRE-12345
```

### En Frest API:

```bash
tail -f /ruta/a/LaVegaAdmin/storage/logs/laravel.log | grep "Bot API"
```

## ❌ Troubleshooting

### Error: Connection refused

```
❌ Error: connect ECONNREFUSED 127.0.0.1:8001
```

**Solución:** Iniciar Frest API

```bash
cd /ruta/a/LaVegaAdmin
php artisan serve --port=8001
```

### Error: 401 Unauthorized

```
❌ Error: Unauthorized - Invalid API Key
```

**Solución:** Verificar `FREST_API_KEY` en `.env`

### Error: 404 Not Found

```
❌ Error: Route not found
```

**Solución:** Verificar que Frest API tenga las rutas del Bot API implementadas:
- `/bot/usuarios/buscar`
- `/bot/productos/consultar`
- `/bot/pedidos/crear`

### Router no detecta intención de compra

El router usa estas palabras clave:
- "comprar"
- "pedido"
- "online"
- "jumbo", "lider", "frest"

Prueba con: `"quiero comprar online"`

## 🎯 Casos de Prueba Sugeridos

### Caso 1: Usuario nuevo sin cuenta en Frest

```
Tu: quiero comprar tomates
Bot: Para hacer tu pedido en Frest, necesito algunos datos
     ¿Cuál es tu nombre completo?
...
```

### Caso 2: Usuario existente con dirección guardada

```
Tu: necesito comprar verduras
Bot: Hola Juan! ¿Quieres que el pedido llegue a Av. Providencia 1234?
...
```

### Caso 3: Producto sin stock

```
Bot: Encontré tus productos! 🛒
     ✅ Tomate: $1.490/kg
     ⚠️  Palta Hass: sin stock
     💡 Alternativa: Palta Común $2.990/kg ✅
```

### Caso 4: Consultar estado de pedido

```
Tu: ¿dónde está mi pedido?
Bot: Tu pedido #FRE-12345:
     Estado: En preparación 📦
     Pago: Aprobado ✅
     Entrega estimada: Hoy 16:00-18:00
```

## 📊 Métricas de Performance

- **Búsqueda de usuario:** ~200ms
- **Consulta de productos:** ~300ms  
- **Creación de pedido:** ~500ms
- **Total (flujo completo):** ~15-20s

## 🔐 Seguridad

- ✅ API Key nunca se expone al cliente
- ✅ Todas las comunicaciones por HTTPS en producción
- ✅ Rate limit: 100 requests/minuto
- ✅ Timeout: 30 segundos por request

## 📚 Referencias

- [FREST_INTEGRATION.md](./FREST_INTEGRATION.md) - Documentación completa
- [Agente Ecommerce](./whatsapp/agents/ecommerce.ts) - Lógica del agente
- [Frest Client](./whatsapp/clients/frest-client.ts) - Cliente HTTP

---

¿Problemas? Revisa los logs con `pm2 logs planeat` o crea un issue en el repo.

