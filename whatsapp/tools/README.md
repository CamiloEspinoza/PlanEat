# 🛠️ MCP Tools

Esta carpeta contiene las herramientas (tools) del Model Context Protocol (MCP) utilizadas por el agente de Claude.

## 📂 Estructura

```
tools/
├── index.ts                        # Exporta todas las tools
├── send-whatsapp-message.ts       # Enviar mensajes de WhatsApp
├── get-user-context.ts            # Obtener contexto del usuario
├── create-household.ts            # Crear un nuevo hogar
├── add-household-members.ts       # Agregar miembros al hogar
└── save-conversation-state.ts     # Guardar estado de conversación
```

## 🔧 Tools Disponibles

### 1. **send_whatsapp_message**
Envía un mensaje de WhatsApp al usuario.

**Parámetros:**
- `to`: Número de WhatsApp del destinatario
- `message`: Contenido del mensaje

### 2. **get_user_context**
Obtiene el contexto completo del usuario incluyendo perfil, hogar y miembros.

**Parámetros:**
- `phone_number`: Número de WhatsApp del usuario

**Retorna:**
- `exists`: Boolean indicando si el usuario existe
- `user`: Información del usuario
- `household`: Información del hogar
- `members`: Array de miembros del hogar

### 3. **create_household**
Crea un nuevo hogar y registra al usuario como administrador.

**Parámetros:**
- `admin_phone`: Número de WhatsApp del administrador
- `display_name`: Nombre del administrador
- `household_size`: Tamaño del hogar
- `dietary_restrictions`: Restricciones dietéticas (opcional)
- `preferences`: Preferencias alimentarias (opcional)
- `goals`: Objetivos del hogar (opcional)

### 4. **add_household_members**
Agrega miembros a un hogar existente.

**Parámetros:**
- `household_id`: ID del hogar
- `members`: Array de miembros con:
  - `name`: Nombre del miembro
  - `phone_number`: Número de WhatsApp (opcional)
  - `age`: Edad (opcional)
  - `relationship`: Relación con el admin (opcional)
  - `role`: Rol en el hogar (opcional)

**Nota:** Los niños pequeños NO tienen WhatsApp, por lo que `phone_number` es opcional.

### 5. **save_conversation_state**
Guarda el estado actual de la conversación.

**Parámetros:**
- `phone_number`: Número de WhatsApp del usuario
- `current_intent`: Intención actual (opcional)
- `conversation_state`: Estado de la conversación (opcional)

## 🔄 Uso

Las tools se importan automáticamente en `claude-agent-client.ts`:

```typescript
import {
  sendWhatsAppMessageTool,
  getUserContextTool,
  createHouseholdTool,
  addHouseholdMembersTool,
  saveConversationStateTool,
} from "./tools";
```

## 📝 Crear una Nueva Tool

Para agregar una nueva tool:

1. Crea un archivo en esta carpeta (e.g., `my-new-tool.ts`)
2. Importa `tool` y `z` de sus respectivos paquetes
3. Define la tool usando la función `tool()`
4. Exporta la tool en `index.ts`
5. Agrégala al servidor MCP en `claude-agent-client.ts`

**Ejemplo:**

```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

export const myNewTool = tool(
  "my_new_tool",
  "Descripción de qué hace la tool",
  {
    param1: z.string().describe("Descripción del parámetro"),
  },
  async ({ param1 }) => {
    // Implementación
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ result: "success" }),
        },
      ],
    };
  }
);
```

## 🐛 Debugging

Todas las tools incluyen logging detallado:

```
🔧 TOOL CALLED: tool_name
   Param: value
✅ Operation successful
```

Esto facilita el debugging en los logs de Encore.

