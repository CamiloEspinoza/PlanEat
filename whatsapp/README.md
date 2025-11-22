# PlanEat WhatsApp Bot - Configuración

## Variables de entorno requeridas

Para que el bot funcione correctamente, necesitas configurar los siguientes secrets en Encore:

### 1. ANTHROPIC_API_KEY
- **Descripción**: API key de Anthropic para usar Claude
- **Obtener**: https://console.anthropic.com/settings/keys
- **Configurar**:
```bash
encore secret set --type local ANTHROPIC_API_KEY
# Pegar tu API key cuando se solicite
```

### 2. KAPSO_API_KEY
- **Descripción**: API key de Kapso para enviar/recibir mensajes de WhatsApp
- **Obtener**: En Kapso dashboard → Project Settings → API Keys
- **Configurar**:
```bash
encore secret set --type local KAPSO_API_KEY
# Pegar tu API key cuando se solicite
```

### 3. KAPSO_PHONE_NUMBER_ID
- **Descripción**: ID del número de WhatsApp Business conectado a Kapso
- **Obtener**: En Kapso dashboard → WhatsApp → Ver detalles del número
- **Configurar**:
```bash
encore secret set --type local KAPSO_PHONE_NUMBER_ID
# Pegar el Phone Number ID cuando se solicite
```

## Configurar webhook en Kapso

Una vez que el servicio esté corriendo, configura el webhook en Kapso:

1. Ve a Kapso dashboard → Project Settings → Webhooks
2. Agrega un nuevo webhook endpoint:
   - URL: `https://tu-app.encr.app/webhooks/whatsapp` (o tu URL de desarrollo)
   - Eventos: Selecciona `whatsapp.message.received`
3. Guarda y verifica que el webhook esté activo

## Testing local

Para probar localmente sin recibir mensajes reales de WhatsApp:

```bash
# Inicia el servidor de Encore
encore run

# En otra terminal, envía un mensaje de prueba
curl -X POST http://localhost:4000/test/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, quiero crear mi hogar",
    "from": "+56912345678"
  }'
```

## Arquitectura

```
WhatsApp → Kapso Webhook → Backend Encore → Claude Agent SDK
                              ↓
                    Tools custom:
                    - send_whatsapp_message (Kapso SDK)
                    - get_user_context (DB)
                    - create_household (DB)
                    - add_household_member (DB)
                              ↓
                    Claude usa tools automáticamente
                              ↓
                    Respuesta enviada por WhatsApp
```

## Archivos principales

- `encore.service.ts` - Definición del servicio
- `whatsapp.ts` - Endpoints (webhook + testing)
- `agent.ts` - Configuración de Claude Agent SDK y tools
- `message-processor.ts` - Procesador principal de mensajes
- `whatsapp-client.ts` - Cliente SDK de Kapso
- `db-tools.ts` - Herramientas de base de datos (obsoleto, integrado en agent.ts)
- `types.ts` - Interfaces TypeScript
- `migrations/` - Schema de base de datos

## Base de datos

El servicio usa PostgreSQL con las siguientes tablas:

- `users` - Usuarios por número de WhatsApp
- `households` - Hogares/familias
- `household_members` - Miembros de cada hogar
- `conversations` - Estado de conversaciones

Las migrations se ejecutan automáticamente al iniciar Encore.

## Próximos pasos

- [ ] Configurar transcripción de audios (ElevenLabs u OpenAI Whisper)
- [ ] Implementar extracción de ingredientes de imágenes
- [ ] Crear planificador de menú semanal
- [ ] Implementar generación de listas de compras
- [ ] Integrar con API de supermercados

