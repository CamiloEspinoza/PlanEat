# PlanEat WhatsApp Bot - Configuración y Uso

## ✅ Estado actual

El bot está completamente implementado y funcional con **Claude Sonnet 4.5** (el modelo más inteligente de Anthropic).

**Endpoints disponibles:**

- `POST /webhooks/whatsapp` - Webhook para recibir mensajes de Kapso
- `POST /test/webhook` - Endpoint de testing sin necesidad de WhatsApp real

## 🤖 Claude Sonnet 4.5

Este proyecto usa **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`), el modelo más inteligente de Anthropic con:

- 🧠 **Best-in-class reasoning**: Razonamiento superior para tareas complejas
- 💻 **Advanced coding**: El modelo de código más potente
- 🤝 **Long-running agents**: Excelente para agentes autónomos
- 🎯 **Extended thinking**: Opción para mejorar rendimiento en tareas complejas

**Referencia**: [Migrating to Claude 4.5](https://platform.claude.com/docs/en/about-claude/models/migrating-to-claude-4)

### Extended Thinking (Opcional)

Para tareas complejas como planificación de menús o análisis de ingredientes, puedes usar `processWithClaudeExtendedThinking()` que habilita el modo de pensamiento extendido para mejor rendimiento.

## 🔑 Configurar secrets (Paso 1 - REQUERIDO)

Antes de usar el bot, debes configurar estas 3 variables de entorno:

### 1. ANTHROPIC_API_KEY

API key de Anthropic para usar Claude.

**Obtener**: https://console.anthropic.com/settings/keys

**Configurar**:

```bash
encore secret set --type local ANTHROPIC_API_KEY
```

Pega tu API key cuando se solicite y presiona Enter.

### 2. KAPSO_API_KEY

API key de Kapso para enviar/recibir mensajes de WhatsApp.

**Obtener**: Kapso dashboard → Project Settings → API Keys

**Configurar**:

```bash
encore secret set --type local KAPSO_API_KEY
```

Pega tu API key cuando se solicite y presiona Enter.

### 3. KAPSO_PHONE_NUMBER_ID

ID del número de WhatsApp Business conectado a Kapso.

**Obtener**: Kapso dashboard → WhatsApp → Ver detalles del número

**Configurar**:

```bash
encore secret set --type local KAPSO_PHONE_NUMBER_ID
```

Pega el Phone Number ID cuando se solicite y presiona Enter.

**Nota**: Después de configurar los secrets, reinicia Encore:

```bash
# Detener: Ctrl+C en la terminal donde corre encore run
encore run
```

## 🧪 Testing sin WhatsApp real (Paso 2 - Recomendado)

Prueba el bot localmente sin necesidad de configurar webhooks:

```bash
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, quiero crear mi hogar",
    "from": "+56912345678"
  }'
```

### Ejemplos de conversación probados:

**1. Saludo inicial:**

```bash
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "from": "+56912345678"}'
```

Respuesta esperada:

```
¡Hola! 👋 Bienvenido/a a PlanEat, tu asistente personal para
planificar las comidas de la familia.

Veo que es tu primera vez por acá. Te puedo ayudar a:

🏠 Crear tu hogar familiar
🍽️ Planificar menús semanales
🛒 Generar listas de compras
📝 Organizar los ingredientes que tienes

Para empezar, ¿te gustaría crear tu hogar?
```

**2. Crear un hogar:**

```bash
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Quiero crear mi hogar, somos 4 personas", "from": "+56912345678"}'
```

**3. Consultar lista de compras:**

```bash
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "Necesito hacer mi lista de compras", "from": "+56912345678"}'
```

## 🌐 Configurar webhook en Kapso (Paso 3 - Para producción)

### Activar envío real de WhatsApp

**IMPORTANTE**: Antes de configurar el webhook, debes activar el envío real:

1. Abre `/whatsapp/claude-client.ts`
2. En la función `executeTool`, caso `send_whatsapp_message` (línea ~79):
3. Descomenta la línea:

```typescript
// DE ESTO:
console.log(`[SIMULATED] Sending to ${to}: ${message}`);
// await sendTextMessage(to, message);  // <-- Descomentar esta línea

// A ESTO:
console.log(`[SIMULATED] Sending to ${to}: ${message}`);
await sendTextMessage(to, message); // <-- Activo
```

4. Comenta o elimina el `simulated: true` en el return

### Opción A: Usando ngrok (desarrollo)

1. **Asegúrate de que ngrok esté corriendo y apuntando al puerto 4000**

2. **Obtén tu URL de ngrok**

   - Ejemplo: `https://abc123.ngrok.io`

3. **Configura el webhook en Kapso:**
   - Ve a: Kapso dashboard → Project Settings → Webhooks
   - Click en "Add Webhook"
   - URL: `https://tu-url-de-ngrok.ngrok.io/webhooks/whatsapp`
   - Eventos: Selecciona `whatsapp.message.received`
   - Guarda y verifica que esté activo

### Opción B: Usando Encore Cloud (producción)

1. **Despliega a Encore Cloud:**

```bash
git add .
git commit -m "Add WhatsApp bot"
git push encore
```

2. **Obtén la URL de producción:**

```bash
encore app show
```

3. **Configura el webhook en Kapso:**
   - URL: `https://tu-app.encr.app/webhooks/whatsapp`
   - Eventos: `whatsapp.message.received`

## 🏗️ Arquitectura

```
WhatsApp Usuario → Kapso API → Webhook (/webhooks/whatsapp)
                                    ↓
                          Message Processor
                                    ↓
                    Claude Sonnet 4.5 (API directa)
                          (con Tool Use)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Tools de WhatsApp              Tools de Database
            - send_whatsapp_message        - get_user_context
            - send_interactive_buttons     - create_household
                                          - add_household_member
                    ↓                               ↓
            Respuesta por WhatsApp          PostgreSQL (Encore)
```

### Por qué usamos la API directa de Anthropic y no el Agent SDK

Inicialmente intentamos usar el `@anthropic-ai/claude-agent-sdk`, pero encontramos problemas de compatibilidad al ejecutarse dentro de Encore:

❌ **Claude Agent SDK**:

- Necesita spawnar procesos externos (`node`)
- Error: `spawn node ENOENT` dentro de Encore
- Overhead de ~12 segundos por llamada
- Complejidad adicional innecesaria

✅ **API directa de Anthropic** (solución actual):

- Funciona perfectamente en cualquier entorno
- Control total sobre tool execution
- Más rápido y predecible
- Código más simple y mantenible
- Usa Claude Sonnet 4.5 con todas sus capacidades

## 📊 Base de datos

El servicio usa PostgreSQL con las siguientes tablas:

- **`users`** - Usuarios identificados por número de WhatsApp
- **`households`** - Hogares/familias con configuración
- **`household_members`** - Relación entre usuarios y hogares
- **`conversations`** - Estado de conversaciones con Claude

Las migrations se ejecutan automáticamente al iniciar Encore.

## 🔧 Estructura de archivos

```
/whatsapp/
├── encore.service.ts           # Definición del servicio
├── whatsapp.ts                 # Endpoints (webhook + testing)
├── claude-client.ts            # Cliente de Claude Sonnet 4.5 + Tools
├── message-processor.ts        # Procesador principal
├── whatsapp-client.ts          # Cliente SDK de Kapso
├── secrets.ts                  # Configuración de secrets de Encore
├── types.ts                    # Interfaces TypeScript
├── migrations/
│   └── 1_create_tables.up.sql # Schema de DB
└── README.md                   # Esta documentación
```

## 🎯 Funcionalidades implementadas

### ✅ Funcionalidades actuales:

- ✅ Recibir mensajes de texto por WhatsApp
- ✅ Responder usando Claude Sonnet 4.5 (el más inteligente)
- ✅ Obtener contexto de usuario desde DB
- ✅ Crear hogares nuevos
- ✅ Agregar miembros a hogares
- ✅ Enviar mensajes de texto
- ✅ Enviar mensajes con botones interactivos
- ✅ Manejo de refusals (nueva funcionalidad Claude 4.5)
- ✅ Extended thinking para tareas complejas (opcional)

### 🔜 Próximas funcionalidades (roadmap):

- [ ] Transcripción de audios (OpenAI Whisper)
- [ ] Análisis de imágenes de despensa (Claude Vision)
- [ ] Extracción de ingredientes de fotos
- [ ] Planificador de menú semanal inteligente
- [ ] Generación automática de listas de compras
- [ ] Votación familiar de comidas
- [ ] Integración con API de supermercados para pedidos

## 🐛 Troubleshooting

### El webhook retorna 502

- **Causa**: Encore no está corriendo
- **Solución**: Ejecuta `encore run` en el directorio del proyecto

### No recibo respuestas del bot

- **Causa**: Los secrets no están configurados
- **Solución**: Configura los 3 secrets (ver sección "Configurar secrets")

### Claude no responde o da error 404

- **Causa**: Modelo incorrecto o ANTHROPIC_API_KEY inválida
- **Solución**:
  1. Verifica que usas `claude-sonnet-4-5-20250929`
  2. Verifica tu API key en https://console.anthropic.com

### El bot no envía mensajes por WhatsApp

- **Causas posibles**:
  1. KAPSO_API_KEY o KAPSO_PHONE_NUMBER_ID incorrectos
  2. Webhook no configurado en Kapso
  3. Modo simulación activado (por defecto en testing)
- **Solución**:
  1. Verifica tus credenciales de Kapso
  2. Asegúrate de que el webhook esté activo en Kapso dashboard
  3. Descomentar `await sendTextMessage()` en `claude-client.ts` (ver sección "Activar envío real")

### Error: "Active sandbox session required"

- **Causa**: Kapso requiere una sesión de sandbox activa para testing
- **Solución**:
  - Para testing: Usa modo simulación (ya está activado por defecto)
  - Para producción: Configura el webhook en Kapso y prueba con un número real

### Claude da respuestas muy largas o lentas

- **Causa**: Extended thinking habilitado sin necesidad
- **Solución**: Usa `processWithClaude()` para conversaciones normales, reserva `processWithClaudeExtendedThinking()` solo para tareas complejas

## 📝 Logs y debugging

Para ver los logs de Encore en tiempo real:

```bash
# En la terminal donde corre encore run
# Los logs aparecerán automáticamente
```

Ejemplo de logs exitosos:

```
Processing message from +56912345678: Hola
Claude response: tool_use
Executing tool: get_user_context
Tool result: {"exists":false}
Claude response: tool_use
Executing tool: send_whatsapp_message
[SIMULATED] Sending to +56912345678: ¡Hola! 👋 Bienvenido/a a PlanEat...
Claude response: end_turn
Conversation complete
Message processed successfully for +56912345678
```

## 🚀 Deploy a producción

1. **Configura los secrets de producción:**

```bash
encore secret set --type prod ANTHROPIC_API_KEY
encore secret set --type prod KAPSO_API_KEY
encore secret set --type prod KAPSO_PHONE_NUMBER_ID
```

2. **Activa el envío real de WhatsApp** (descomentar línea en `claude-client.ts`)

3. **Despliega:**

```bash
git push encore
```

4. **Actualiza el webhook en Kapso** con la URL de producción

## 📚 Recursos adicionales

- [Documentación de Encore.ts](https://encore.dev/docs)
- [Claude Sonnet 4.5 Migration Guide](https://platform.claude.com/docs/en/about-claude/models/migrating-to-claude-4)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Kapso API](https://docs.kapso.ai)
- [Kapso TypeScript SDK](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/introduction)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa esta documentación
2. Verifica los logs de Encore
3. Prueba con el endpoint `/test/webhook` primero
4. Verifica que todos los secrets estén configurados correctamente
5. Revisa que estés usando el modelo correcto: `claude-sonnet-4-5-20250929`

---

**Desarrollado para PlatanusHack 2025** 🚀

**Powered by Claude Sonnet 4.5** 🤖
