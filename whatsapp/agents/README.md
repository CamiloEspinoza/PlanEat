# 🤖 Subagentes Especializados

PlanEat utiliza una arquitectura de **Router + Subagentes** para manejar diferentes aspectos de la experiencia del usuario.

## 📂 Estructura de Archivos

```
agents/
├── index.ts              # Exporta todos los agentes
├── router.ts            # Router agent prompt (41 líneas)
├── onboarding.ts        # Onboarding agent (35 líneas)
├── menu-planner.ts      # Menu planning agent (37 líneas)
├── shopping-list.ts     # Shopping list agent (46 líneas)
├── ecommerce.ts         # E-commerce agent (35 líneas)
└── README.md           # Esta documentación
```

**Total: 214 líneas** organizadas en 6 archivos modulares.

## 🏗️ Arquitectura

```
Usuario (WhatsApp)
        ↓
   Router Agent (Main)
        ↓
   ┌────┴────┬────────┬──────────┐
   ↓         ↓        ↓          ↓
Onboarding Menu  Shopping  E-commerce
  Agent    Planner  List     Agent
           Agent    Agent
```

## 📋 Agentes Disponibles

### 1. **Router Agent** (Main)

**Responsabilidad:** Analizar mensajes y delegar al agente correcto

**Modelo:** Sonnet 4.5

**Tools:** Todas (para verificar contexto)

**Decisiones:**
- Nuevo usuario o habla de familia → `onboarding`
- Pregunta sobre comidas/menú → `menu-planner`
- Habla de compras/ingredientes → `shopping-list`
- Quiere hacer pedido online → `ecommerce`

---

### 2. **Onboarding Agent**

**Responsabilidad:** Registro y configuración de nuevos usuarios

**Modelo:** Sonnet 4.5

**Tools:**
- `get_user_context`
- `create_household`
- `add_household_members`
- `save_conversation_state`
- `send_whatsapp_message`

**Flujo:**
1. Saluda y presenta PlanEat
2. Recopila nombre del usuario
3. Pregunta composición familiar
4. Pregunta preferencias y restricciones
5. Crea hogar y agrega miembros
6. Confirma perfil creado

**Ejemplos de mensajes:**
```
"Hola, soy nuevo"
"Mi nombre es Camilo, vivo con mi familia"
"Quiero crear mi perfil"
```

---

### 3. **Menu Planner Agent**

**Responsabilidad:** Crear menús semanales personalizados

**Modelo:** Sonnet 4.5

**Tools:**
- `get_user_context`
- `send_whatsapp_message`

**Características:**
- Genera menús de 7 días (almuerzo + cena)
- Considera preferencias del hogar
- Respeta restricciones dietéticas
- Mezcla cocinas favoritas
- Adapta porciones al tamaño del hogar

**Ejemplos de mensajes:**
```
"Qué cocino esta semana?"
"Dame ideas para el menú"
"Necesito recetas para 7 días"
```

---

### 4. **Shopping List Agent**

**Responsabilidad:** Generar listas de compras organizadas

**Modelo:** Sonnet 4.5

**Tools:**
- `get_user_context`
- `send_whatsapp_message`

**Características:**
- Extrae ingredientes de menús
- Agrupa por categorías
- Calcula cantidades para el hogar
- Optimiza para reducir desperdicios

**Ejemplos de mensajes:**
```
"Necesito lista de compras"
"Qué ingredientes necesito?"
"Dame la lista para el super"
```

---

### 5. **E-commerce Agent**

**Responsabilidad:** Ayudar con pedidos online

**Modelo:** Sonnet 4.5

**Tools:**
- `get_user_context`
- `send_whatsapp_message`

**Estado:** 🚧 En desarrollo

**Futuras capacidades:**
- Buscar productos en supermercados online
- Comparar precios
- Crear pedidos automáticamente

**Ejemplos de mensajes:**
```
"Quiero hacer un pedido"
"Comprar online"
"Envío a domicilio"
```

## 🔄 Flujo de Delegación

```typescript
// 1. Usuario envía mensaje
Usuario: "Hola, soy Camilo, vivo con mi familia"

// 2. Router analiza
Router: get_user_context("56995545216")
Router: "Usuario nuevo + menciona familia" → onboarding

// 3. Onboarding toma control
Onboarding: create_household(...)
Onboarding: add_household_members(...)
Onboarding: send_whatsapp_message("Perfil creado!")

// 4. Sesión guarda el agente usado
Session: last_agent = "onboarding"
```

## 📊 Ventajas de esta Arquitectura

### ✅ Especialización
- Cada agente es experto en su dominio
- Prompts más enfocados = mejor performance
- Menos confusión del modelo

### ✅ Escalabilidad
- Fácil agregar nuevos agentes
- Cada agente evoluciona independientemente
- Testing más simple

### ✅ Mantenibilidad
- Cambios en un agente no afectan otros
- Prompts más cortos y claros
- Code review más fácil

### ✅ Optimización Futura
- Diferentes modelos por agente (haiku vs sonnet)
- Caching específico por agente
- Rate limiting independiente

## 🎯 Configuración

Los agentes se configuran en `claude-agent-client.ts`:

```typescript
import { PLANEAT_AGENTS } from "./agents";

const queryOptions = {
  systemPrompt: ROUTER_PROMPT,
  agents: PLANEAT_AGENTS,
  // ... otras opciones
};
```

## 🔧 Crear Nuevo Agente

Para agregar un nuevo agente:

### 1. Crea un archivo nuevo (e.g., `my-new-agent.ts`)

```typescript
import { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

export const myNewAgent: AgentDefinition = {
  description: "Qué hace este agente",
  tools: ["tool1", "tool2"],
  prompt: `System prompt del agente...`,
  model: "sonnet",
};
```

### 2. Exporta en `index.ts`

```typescript
export { myNewAgent } from "./my-new-agent";

export const PLANEAT_AGENTS = {
  // ... agentes existentes
  "my-new-agent": myNewAgent,
};
```

### 3. Actualiza el Router en `router.ts`

```typescript
5. **my-new-agent** - Para [funcionalidad]
   - Cuando [condiciones]
   - Frases: "ejemplos"
```

## 📝 Logs

Cuando un agente es activado, verás en los logs:

```
🎯 Starting Agent SDK query with config:
   Model: claude-sonnet-4-5-20250929
   Agents: 4 subagents available
   
⚙️ System message: {
  "type": "system",
  "agents": ["onboarding", "menu-planner", "shopping-list", "ecommerce"]
}

🤖 Agent response: [onboarding agent responding...]
```

## 🧪 Testing

Para probar un agente específico:

1. Envía un mensaje que active ese agente
2. Verifica que el router delegue correctamente
3. Observa que las tools correctas se ejecuten
4. Confirma la respuesta apropiada

## 🚀 Próximos Pasos

- [ ] Agregar métricas por agente
- [ ] Implementar agent switching mid-conversation
- [ ] Agregar memory específica por agente
- [ ] Optimizar con modelos diferentes (haiku para router/onboarding)

